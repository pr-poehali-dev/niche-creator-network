import json
import os
import hashlib
import hmac
import smtplib
import secrets as pysecrets
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import psycopg2

SCHEMA = 't_p50633472_niche_creator_networ'
SESSION_DAYS = 30
CODE_TTL_MIN = 10
MAX_2FA_ATTEMPTS = 5


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _hash_code(code: str) -> str:
    return hashlib.sha256(('2fa:' + code).encode()).hexdigest()


def _mask_email(email: str) -> str:
    try:
        name, domain = email.split('@', 1)
    except ValueError:
        return email
    if len(name) <= 2:
        masked = name[0] + '*'
    else:
        masked = name[0] + '*' * (len(name) - 2) + name[-1]
    return f'{masked}@{domain}'


def _send_2fa_email(to_email: str, code: str, lang: str = 'ru') -> bool:
    host = os.environ.get('SMTP_HOST')
    port = int(os.environ.get('SMTP_PORT', '465'))
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD')
    if not all([host, user, password]):
        return False
    if lang == 'en':
        subject = 'SHCHIT — your login code'
        title = 'Your verification code'
        note = 'Enter this code to finish signing in. It expires in 10 minutes. If this was not you, ignore this email.'
    else:
        subject = 'ЩИТ — код для входа'
        title = 'Ваш код подтверждения'
        note = 'Введите этот код, чтобы завершить вход. Код действует 10 минут. Если это были не вы — проигнорируйте письмо.'
    html = f'''<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,sans-serif;color:#1a1d24;">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4e6eb;border-radius:10px;overflow:hidden;">
  <div style="padding:24px 30px;background:#1a1d24;color:#fff;">
    <div style="font-weight:800;font-size:20px;letter-spacing:0.2em;">Щ<span style="color:#d4af37;">ИТ</span></div>
  </div>
  <div style="padding:28px 30px;text-align:center;">
    <div style="font-size:15px;font-weight:700;margin-bottom:18px;">{title}</div>
    <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#b8901f;background:#faf7ec;border:1px solid #ecdfb0;border-radius:8px;padding:16px;">{code}</div>
    <div style="margin-top:20px;font-size:12px;color:#9aa0ab;line-height:1.5;">{note}</div>
  </div>
</div></body></html>'''
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = user
    msg['To'] = to_email
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=20)
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            server.starttls()
        server.login(user, password)
        server.sendmail(user, [to_email], msg.as_string())
        server.quit()
        return True
    except (smtplib.SMTPException, OSError):
        return False


def _start_2fa(cur, user_id: int, email: str, lang: str) -> dict:
    code = ''.join(pysecrets.choice('0123456789') for _ in range(6))
    challenge = pysecrets.token_hex(24)
    expires = (datetime.utcnow() + timedelta(minutes=CODE_TTL_MIN)).strftime('%Y-%m-%d %H:%M:%S')
    code_hash = _hash_code(code).replace("'", "''")
    cur.execute(f"DELETE FROM {SCHEMA}.two_factor_codes WHERE user_id = {user_id}")
    cur.execute(
        f"INSERT INTO {SCHEMA}.two_factor_codes (challenge_id, user_id, code_hash, expires_at) "
        f"VALUES ('{challenge}', {user_id}, '{code_hash}', '{expires}')"
    )
    sent = _send_2fa_email(email, code, lang)
    return {'challengeId': challenge, 'sent': sent}


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
            esc_role = role.replace("'", "''")
            cur.execute(f"SELECT id, role, name FROM {SCHEMA}.users WHERE email = '{esc_email}'")
            row = cur.fetchone()
            if row:
                user_id = int(row[0])
                cur.execute(f"UPDATE {SCHEMA}.users SET role = '{esc_role}' WHERE id = {user_id}")
            else:
                placeholder = _make_hash(pysecrets.token_hex(16)).replace("'", "''")
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (email, password_hash, role, name) "
                    f"VALUES ('{esc_email}', '{placeholder}', '{esc_role}', 'Администратор') RETURNING id"
                )
                user_id = cur.fetchone()[0]
            new_token = _create_session(cur, user_id)
            return _resp(200, {'token': new_token, 'user': {'id': user_id, 'email': admin_email, 'role': role, 'name': 'Администратор', 'isAdmin': True}})

        if action == 'register':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            role = body.get('role') if body.get('role') in ('client', 'provider') else 'client'
            name = (body.get('name') or '').strip()[:200]
            consent = bool(body.get('consent'))
            if not email or '@' not in email:
                return _resp(400, {'error': 'invalid_email'})
            if len(password) < 6:
                return _resp(400, {'error': 'weak_password'})
            if not consent:
                return _resp(400, {'error': 'consent'})
            esc_email = email.replace("'", "''")
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = '{esc_email}'")
            if cur.fetchone():
                return _resp(409, {'error': 'email_exists'})
            pwd_hash = _make_hash(password).replace("'", "''")
            esc_name = name.replace("'", "''")
            consent_version = (str(body.get('consentVersion') or '1.0'))[:20].replace("'", "''")
            try:
                src_ip = (event.get('requestContext', {}).get('identity', {}).get('sourceIp') or '')[:64].replace("'", "''")
            except (AttributeError, TypeError):
                src_ip = ''
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email, password_hash, role, name, consent_accepted_at, consent_version, consent_ip) "
                f"VALUES ('{esc_email}', '{pwd_hash}', '{role}', '{esc_name}', now(), '{consent_version}', '{src_ip}') RETURNING id"
            )
            user_id = cur.fetchone()[0]
            new_token = _create_session(cur, user_id)
            return _resp(200, {'token': new_token, 'user': {'id': user_id, 'email': email, 'role': role, 'name': name}})

        if action == 'login':
            email = (body.get('email') or '').strip().lower()
            password = body.get('password') or ''
            lang = body.get('lang') if body.get('lang') in ('ru', 'en') else 'ru'
            esc_email = email.replace("'", "''")
            cur.execute(f"SELECT id, password_hash, role, name, twofa_enabled FROM {SCHEMA}.users WHERE email = '{esc_email}'")
            row = cur.fetchone()
            if not row or not _verify_password(password, row[1]):
                return _resp(401, {'error': 'invalid_credentials'})
            twofa_on = bool(row[4]) if len(row) > 4 else True
            if twofa_on:
                ch = _start_2fa(cur, row[0], email, lang)
                return _resp(200, {'need2fa': True, 'challengeId': ch['challengeId'], 'emailHint': _mask_email(email), 'sent': ch['sent']})
            new_token = _create_session(cur, row[0])
            return _resp(200, {'token': new_token, 'user': {'id': row[0], 'email': email, 'role': row[2], 'name': row[3]}})

        if action == 'verify_2fa':
            challenge = (body.get('challengeId') or '').strip().replace("'", "''")[:64]
            code = (body.get('code') or '').strip()
            if not challenge or not code.isdigit() or len(code) != 6:
                return _resp(400, {'error': 'invalid_code'})
            cur.execute(
                f"SELECT id, user_id, code_hash, attempts, expires_at FROM {SCHEMA}.two_factor_codes WHERE challenge_id = '{challenge}'"
            )
            rec = cur.fetchone()
            if not rec:
                return _resp(400, {'error': 'challenge_not_found'})
            rec_id, uid, code_hash, attempts, expires_at = rec
            if expires_at < datetime.utcnow():
                cur.execute(f"DELETE FROM {SCHEMA}.two_factor_codes WHERE id = {rec_id}")
                return _resp(400, {'error': 'code_expired'})
            if attempts >= MAX_2FA_ATTEMPTS:
                cur.execute(f"DELETE FROM {SCHEMA}.two_factor_codes WHERE id = {rec_id}")
                return _resp(429, {'error': 'too_many_attempts'})
            if not hmac.compare_digest(code_hash, _hash_code(code)):
                cur.execute(f"UPDATE {SCHEMA}.two_factor_codes SET attempts = attempts + 1 WHERE id = {rec_id}")
                return _resp(401, {'error': 'wrong_code'})
            cur.execute(f"DELETE FROM {SCHEMA}.two_factor_codes WHERE id = {rec_id}")
            cur.execute(f"SELECT id, email, role, name FROM {SCHEMA}.users WHERE id = {uid}")
            u = cur.fetchone()
            if not u:
                return _resp(401, {'error': 'invalid_session'})
            new_token = _create_session(cur, u[0])
            return _resp(200, {'token': new_token, 'user': {'id': u[0], 'email': u[1], 'role': u[2], 'name': u[3]}})

        if action == 'resend_2fa':
            challenge = (body.get('challengeId') or '').strip().replace("'", "''")[:64]
            lang = body.get('lang') if body.get('lang') in ('ru', 'en') else 'ru'
            if not challenge:
                return _resp(400, {'error': 'challenge_not_found'})
            cur.execute(f"SELECT user_id FROM {SCHEMA}.two_factor_codes WHERE challenge_id = '{challenge}'")
            rec = cur.fetchone()
            if not rec:
                return _resp(400, {'error': 'challenge_not_found'})
            cur.execute(f"SELECT email FROM {SCHEMA}.users WHERE id = {rec[0]}")
            ur = cur.fetchone()
            if not ur:
                return _resp(400, {'error': 'challenge_not_found'})
            ch = _start_2fa(cur, rec[0], ur[0], lang)
            return _resp(200, {'challengeId': ch['challengeId'], 'sent': ch['sent']})

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
            is_admin = str(row[1] or '').startswith('admin+') and str(row[1] or '').endswith('@shchit.local')
            return _resp(200, {'user': {'id': row[0], 'email': row[1], 'role': row[2], 'name': row[3], 'isAdmin': is_admin}})

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