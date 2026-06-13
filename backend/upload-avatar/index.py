import json
import os
import base64
import uuid
import boto3
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
ALLOWED_EXT = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}


def handler(event: dict, context) -> dict:
    '''
    Business: загружает аватар (фото) исполнителя или клиента в S3 и сохраняет ссылку в БД.
    Args: event с httpMethod, body (JSON: role 'provider'|'client', id, imageBase64, ext)
    Returns: HTTP-ответ с публичным URL аватара
    '''
    method = event.get('httpMethod', 'POST')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    role = (body.get('role') or '').strip()
    rec_id = (body.get('id') or '').strip()
    image_b64 = body.get('imageBase64') or ''
    ext = (body.get('ext') or 'jpg').lower().replace('.', '')

    if role not in ('provider', 'client'):
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid role'})}
    if not rec_id:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'id required'})}
    if ext not in ALLOWED_EXT:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid ext'})}
    if ',' in image_b64:
        image_b64 = image_b64.split(',', 1)[1]
    try:
        data = base64.b64decode(image_b64)
    except Exception:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid image'})}
    if len(data) > 5 * 1024 * 1024:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'file too large'})}

    key = f"avatars/{role}/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=ALLOWED_EXT[ext])
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    safe_id = rec_id.replace("'", "''")
    safe_url = cdn_url.replace("'", "''")
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    if role == 'provider':
        cur.execute(f"UPDATE {SCHEMA}.providers SET avatar_url='{safe_url}' WHERE slug='{safe_id}'")
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.clients (client_id, avatar_url) VALUES ('{safe_id}', '{safe_url}') "
            f"ON CONFLICT (client_id) DO UPDATE SET avatar_url=EXCLUDED.avatar_url, updated_at=now()"
        )
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'url': cdn_url})}
