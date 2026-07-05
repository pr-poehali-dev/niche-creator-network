import json
import os
import psycopg2
from crypto_utils import encrypt_field, decrypt_field
import auth_utils

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def esc(v):
    return str(v if v is not None else '').strip()[:200]


def handler(event: dict, context) -> dict:
    '''
    Business: сохраняет и возвращает данные клиента (ФИО, телефон, email).
    Args: event с httpMethod; для POST body (JSON: clientId, fullName, phone, email);
          для GET queryStringParameters clientId
    Returns: HTTP-ответ с данными клиента или статусом сохранения
    '''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    # Данные клиента доступны только их владельцу. clientId определяется по токену.
    user = auth_utils.get_auth_user(event)
    if not user:
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
    client_id = auth_utils.client_id(user)

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            f"SELECT full_name, phone, email, avatar_url, gender FROM {SCHEMA}.clients WHERE client_id=%s",
            (client_id,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'client': None})}
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            'client': {
                'fullName': decrypt_field(row[0] or ''),
                'phone': decrypt_field(row[1] or ''),
                'email': decrypt_field(row[2] or ''),
                'avatarUrl': row[3] or '',
                'gender': row[4] or 'm',
            }
        })}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        full_name = esc(body.get('fullName'))
        phone = esc(body.get('phone'))
        email = esc(body.get('email'))
        gender = esc(body.get('gender')) or 'm'
        if gender not in ('m', 'f'):
            gender = 'm'
        cur.execute(
            f"INSERT INTO {SCHEMA}.clients (client_id, full_name, phone, email, gender) "
            f"VALUES (%s, %s, %s, %s, %s) "
            f"ON CONFLICT (client_id) DO UPDATE SET "
            f"full_name=EXCLUDED.full_name, phone=EXCLUDED.phone, email=EXCLUDED.email, gender=EXCLUDED.gender, updated_at=now()",
            (client_id, encrypt_field(full_name), encrypt_field(phone), encrypt_field(email), gender),
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}