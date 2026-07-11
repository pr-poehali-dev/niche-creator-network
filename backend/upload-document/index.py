import json
import os
import base64
import uuid
import boto3
from auth_utils import get_auth_user, provider_slug

ALLOWED_EXT = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
}

# Магические байты допустимых форматов (защита от подмены типа файла).
MAGIC = {
    'pdf': (b'%PDF-',),
    'png': (b'\x89PNG\r\n\x1a\n',),
    'jpg': (b'\xff\xd8\xff',),
    'jpeg': (b'\xff\xd8\xff',),
    'webp': (b'RIFF',),
}


def _magic_ok(ext: str, data: bytes) -> bool:
    return any(data.startswith(sig) for sig in MAGIC.get(ext, ()))


def handler(event: dict, context) -> dict:
    '''
    Business: загружает файл документа (диплом, сертификат) исполнителя в S3 и возвращает публичный URL.
              Папка определяется по токену сессии (X-Auth-Token) — исполнитель загружает
              документы только в свою папку (защита от IDOR).
    Args: event с httpMethod, headers (X-Auth-Token), body (JSON: fileBase64, ext)
    Returns: HTTP-ответ с публичным URL файла
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

    # Авторизация: документы загружает только сам исполнитель, в свою папку.
    user = get_auth_user(event)
    if not user:
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'unauthorized'})}
    slug = provider_slug(user)

    body = json.loads(event.get('body') or '{}')
    file_b64 = body.get('fileBase64') or ''
    ext = (body.get('ext') or '').lower().replace('.', '')

    if ext not in ALLOWED_EXT:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid ext'})}
    if ',' in file_b64:
        file_b64 = file_b64.split(',', 1)[1]
    try:
        data = base64.b64decode(file_b64)
    except Exception:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid file'})}
    if not data:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'empty file'})}
    if len(data) > 10 * 1024 * 1024:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'file too large'})}
    if not _magic_ok(ext, data):
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'invalid file'})}

    key = f"documents/{slug}/{uuid.uuid4().hex}.{ext}"
    try:
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType=ALLOWED_EXT[ext])
    except Exception as e:
        print(f"[upload-document] S3 ERROR: {type(e).__name__}: {e}")
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'storage_failed'})}
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'url': cdn_url})}