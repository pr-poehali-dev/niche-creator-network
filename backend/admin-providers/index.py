import json
import os
from datetime import datetime

import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}


def _resp(status: int, body: dict) -> dict:
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _is_admin(cur, token: str) -> bool:
    if not token:
        return False
    esc = token.replace("'", "''")
    cur.execute(
        f"SELECT u.email, s.expires_at FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = '{esc}'"
    )
    row = cur.fetchone()
    if not row or row[1] < datetime.utcnow():
        return False
    email = str(row[0] or '')
    return email.startswith('admin+') and email.endswith('@shchit.local')


def handler(event: dict, context) -> dict:
    '''
    Business: админ-эндпоинт для управления исполнителями. Позволяет получить
              список всех исполнителей и переключать подтверждение лицензии
              (флажок «Лицензия»). Доступ только для администратора.
    Args: event с httpMethod, headers (X-Auth-Token), body (slug, licenseVerified)
    Returns: HTTP-ответ со списком исполнителей или статусом обновления
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if not _is_admin(cur, token):
            return _resp(403, {'error': 'forbidden'})

        if method == 'GET':
            cur.execute(
                f"SELECT slug, name_ru, name_en, legal_status, verified, license_verified, "
                f"licenses, license_info, subscription_active "
                f"FROM {SCHEMA}.providers ORDER BY name_ru"
            )
            rows = cur.fetchall()
            items = []
            for r in rows:
                lic = r[6] if isinstance(r[6], list) else (json.loads(r[6]) if r[6] else [])
                lic = [str(x).strip() for x in lic if str(x).strip()]
                if not lic and (r[7] or '').strip():
                    lic = [r[7].strip()]
                items.append({
                    'slug': r[0],
                    'name': {'ru': r[1], 'en': r[2]},
                    'legalStatus': r[3] or '',
                    'verified': bool(r[4]),
                    'licenseVerified': bool(r[5]),
                    'licenses': lic,
                    'active': bool(r[8]),
                })
            return _resp(200, {'providers': items})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            slug = str(body.get('slug') or '').strip().replace("'", "''")[:64]
            if not slug:
                return _resp(400, {'error': 'slug required'})

            sets = []
            if 'licenseVerified' in body:
                sets.append(f"license_verified={'true' if bool(body.get('licenseVerified')) else 'false'}")
            if 'verified' in body:
                sets.append(f"verified={'true' if bool(body.get('verified')) else 'false'}")
            if not sets:
                return _resp(400, {'error': 'nothing to update'})

            cur.execute(
                f"UPDATE {SCHEMA}.providers SET {', '.join(sets)} WHERE slug='{slug}'"
            )
            updated = cur.rowcount
            conn.commit()
            if updated == 0:
                return _resp(404, {'error': 'provider not found'})
            return _resp(200, {'success': True, 'slug': slug})

        return _resp(405, {'error': 'method not allowed'})
    finally:
        cur.close()
        conn.close()