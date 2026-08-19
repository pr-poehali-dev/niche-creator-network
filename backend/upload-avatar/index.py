import json
import os
import base64
import uuid
import boto3
import psycopg2
from auth_utils import get_auth_user, provider_slug, client_id

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
ALLOWED_EXT = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}

# Магические байты: проверяем, что файл реально является изображением заявленного
# типа (защита от загрузки замаскированных исполняемых/иных файлов).
MAGIC = {
    'png': (b'\x89PNG\r\n\x1a\n',),
    'jpg': (b'\xff\xd8\xff',),
    'jpeg': (b'\xff\xd8\xff',),
    'webp': (b'RIFF',),
}

# Признаки активного содержимого. Картинка их содержать не должна: это либо
# полиглот-файл (одновременно картинка и скрипт), либо подменённый формат.
DANGEROUS_MARKERS = (
    b'<script', b'<?php', b'<%', b'<svg', b'javascript:',
    b'#!/bin/', b'MZ\x90', b'\x7fELF',
)


def _looks_like_image(ext: str, data: bytes) -> bool:
    if not any(data.startswith(sig) for sig in MAGIC.get(ext, ())):
        return False
    # WebP: после "RIFF" + 4 байта размера обязателен маркер "WEBP".
    # Без этой проверки любой RIFF-файл (например, AVI) прошёл бы как картинка.
    if ext == 'webp' and data[8:12] != b'WEBP':
        return False
    # Полиглоты: ищем исполняемые вставки в начале и конце файла —
    # именно туда их обычно дописывают, не ломая картинку.
    head_tail = data[:4096].lower() + data[-4096:].lower()
    return not any(m.lower() in head_tail for m in DANGEROUS_MARKERS)


def handler(event: dict, context) -> dict:
    '''
    Business: загружает аватар (фото) исполнителя или клиента в S3 и сохраняет ссылку в БД.
              Владелец определяется по токену сессии (X-Auth-Token) — пользователь может
              менять только свой аватар (защита от IDOR).
    Args: event с httpMethod, headers (X-Auth-Token), body (JSON: imageBase64, ext)
    Returns: HTTP-ответ с публичным URL аватара
    '''
    method = event.get('httpMethod', 'POST')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    # Авторизация: только владелец аккаунта может менять свой аватар.
    user = get_auth_user(event)
    if not user:
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}

    body = json.loads(event.get('body') or '{}')
    role = user['role'] if user['role'] in ('provider', 'client') else 'client'
    # ID записи берём НЕ из тела запроса, а из токена — исключает подмену чужого профиля.
    rec_id = provider_slug(user) if role == 'provider' else client_id(user)
    image_b64 = body.get('imageBase64') or ''
    ext = (body.get('ext') or 'jpg').lower().replace('.', '')

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
    if not _looks_like_image(ext, data):
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid image'})}

    print(f"[upload-avatar] start role={role} id={rec_id} ext={ext} bytes={len(data)}")

    key = f"avatars/{role}/{uuid.uuid4().hex}.{ext}"
    try:
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType=ALLOWED_EXT[ext])
    except Exception as e:
        print(f"[upload-avatar] S3 ERROR: {type(e).__name__}: {e}")
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'storage_failed'})}

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    print(f"[upload-avatar] uploaded to S3 key={key}")

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        if role == 'provider':
            cur.execute(f"UPDATE {SCHEMA}.providers SET avatar_url=%s WHERE slug=%s", (cdn_url, rec_id))
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.clients (client_id, avatar_url) VALUES (%s, %s) "
                f"ON CONFLICT (client_id) DO UPDATE SET avatar_url=EXCLUDED.avatar_url, updated_at=now()",
                (rec_id, cdn_url),
            )
        rows = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[upload-avatar] DB ERROR: {type(e).__name__}: {e}")
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'db_failed'})}

    print(f"[upload-avatar] done rows={rows} url={cdn_url}")
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'url': cdn_url})}