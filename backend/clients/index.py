import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def esc(v):
    return str(v if v is not None else '').strip().replace("'", "''")[:200]


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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        client_id = esc(params.get('clientId'))
        if not client_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'clientId required'})}
        cur.execute(
            f"SELECT full_name, phone, email FROM {SCHEMA}.clients WHERE client_id='{client_id}'"
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'client': None})}
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            'client': {'fullName': row[0], 'phone': row[1], 'email': row[2]}
        })}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        client_id = esc(body.get('clientId'))
        if not client_id:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'clientId required'})}
        full_name = esc(body.get('fullName'))
        phone = esc(body.get('phone'))
        email = esc(body.get('email'))
        cur.execute(
            f"INSERT INTO {SCHEMA}.clients (client_id, full_name, phone, email) "
            f"VALUES ('{client_id}', '{full_name}', '{phone}', '{email}') "
            f"ON CONFLICT (client_id) DO UPDATE SET "
            f"full_name=EXCLUDED.full_name, phone=EXCLUDED.phone, email=EXCLUDED.email, updated_at=now()"
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True})}

    cur.close()
    conn.close()
    return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}
