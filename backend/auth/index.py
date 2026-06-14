import json
import os
import hashlib
import hmac
import secrets as pysecrets
from datetime import datetime, timedelta

import psycopg2

SCHEMA = 't_p50633472_niche_creator_networ'
SESSION_DAYS = 30


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _hash_password(password: str, salt: str) -> str:
    dk = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 120000)
    return dk.hex()


def _make_hash(password: str) -> str:
    salt = pysecrets.token_hex(16)
    return f"pbkdf2${salt}${_hash_password(password, salt)}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        _, salt, digest = stored.split('$', 2)
    except ValueError:
        return False
    return hmac.compare_digest(_hash_password(password, salt), digest)


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
            'Content-Type': 'application/json',
        },
        'body': json.dumps(body),
        'isBase64Encoded': False,
    }


def handler(event: dict, context) -> dict:
    '''
    Business: регистрация, вход, проверка сессии и выход пользователей (клиент/исполнитель).
    Args: event с httpMethod, body (action: register|login|logout|me), headers (X-Auth-Token)
    Returns: HTTP-ответ с данными пользователя и токеном сессии
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return _resp(200, {})

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    raw_body = (event.get('body') or '').strip()
    try:
        body = json.loads(raw_body) if raw_body else {}
    except (ValueError, TypeError):
        body = {}
    action = (body.get('action') or '').strip()

    conn = _conn()
    conn.autocommit = True
    try:
        cur = conn.cursor()

        if action == 'admin_login':
            password = body.get('password') or ''
            admin_pwd = os.environ.get('ADMIN_PASSWORD', '')
            if not admin_pwd or not hmac.compare_digest(password, admin_pwd):
                return _resp(401, {'error': 'invalid_credentials'})
            role = body.get('role') if body.get('role') in ('client', 'provider') else 'client'
            admin_email = f"admin+{role}@shchit.local"
            esc_email = admin_email.replace("'", "''")
            cur.execute(f"SELECT id, role, name FROM {SCHEMA}.users WHERE email = '{esc_email}'")
            row = cur.fetchone()
            if row:
                user_id = row[0]
                cur.execute(f"UPDATE {SCHEMA}.users SET role = '{role}' WHERE id = {user_id}")
            else:
                placeholder = _make_hash(pysecrets.token_hex(16)).replace("'", "''")
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (email, password_hash, role, name) "
                    f"VALUES ('{esc_email}', '{placeholder}', '{role}', 'Администратор') RETURNING id"
                )
                user_id = cur.fetchone()[0]
            new_token = _create_session(cur, user_id)
            return _resp(200, {'token': new_token, 'user': {'id': user_id, 'email': admin_email, 'role': role, 'name': 'Администратор', 'isAdmin': True}})

        if action == 'register':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            role = body.get('role') if body.get('role') in ('client', 'provider') else 'client'
            name = (body.get('name') or '').strip()[:200]
            if not email or '@' not in email:
                return _resp(400, {'error': 'invalid_email'})
            if len(password) < 6:
                return _resp(400, {'error': 'weak_password'})
            esc_email = email.replace("'", "''")
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = '{esc_email}'")
            if cur.fetchone():
                return _resp(409, {'error': 'email_exists'})
            pwd_hash = _make_hash(password).replace("'", "''")
            esc_name = name.replace("'", "''")
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email, password_hash, role, name) "
                f"VALUES ('{esc_email}', '{pwd_hash}', '{role}', '{esc_name}') RETURNING id"
            )
            user_id = cur.fetchone()[0]
            new_token = _create_session(cur, user_id)
            return _resp(200, {'token': new_token, 'user': {'id': user_id, 'email': email, 'role': role, 'name': name}})

        if action == 'login':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            esc_email = email.replace("'", "''")
            cur.execute(f"SELECT id, password_hash, role, name FROM {SCHEMA}.users WHERE email = '{esc_email}'")
            row = cur.fetchone()
            if not row or not _verify_password(password, row[1]):
                return _resp(401, {'error': 'invalid_credentials'})
            new_token = _create_session(cur, row[0])
            return _resp(200, {'token': new_token, 'user': {'id': row[0], 'email': email, 'role': row[2], 'name': row[3]}})

        if action == 'me':
            if not token:
                return _resp(401, {'error': 'no_token'})
            esc_token = token.replace("'", "''")
            cur.execute(
                f"SELECT u.id, u.email, u.role, u.name, s.expires_at "
                f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
                f"WHERE s.token = '{esc_token}'"
            )
            row = cur.fetchone()
            if not row or row[4] < datetime.utcnow():
                return _resp(401, {'error': 'invalid_session'})
            return _resp(200, {'user': {'id': row[0], 'email': row[1], 'role': row[2], 'name': row[3]}})

        if action == 'logout':
            if token:
                esc_token = token.replace("'", "''")
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = now() WHERE token = '{esc_token}'")
            return _resp(200, {'ok': True})

        return _resp(400, {'error': 'unknown_action'})
    finally:
        conn.close()


def _create_session(cur, user_id: int) -> str:
    token = pysecrets.token_hex(32)
    expires = (datetime.utcnow() + timedelta(days=SESSION_DAYS)).strftime('%Y-%m-%d %H:%M:%S')
    cur.execute(
        f"INSERT INTO {SCHEMA}.sessions (token, user_id, expires_at) "
        f"VALUES ('{token}', {user_id}, '{expires}')"
    )
    return token