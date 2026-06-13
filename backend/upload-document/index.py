import json
import os
import base64
import uuid
import boto3

ALLOWED_EXT = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
}


def handler(event: dict, context) -> dict:
    '''
    Business: загружает файл документа (диплом, сертификат) исполнителя в S3 и возвращает публичный URL.
    Args: event с httpMethod, body (JSON: fileBase64, ext, slug)
    Returns: HTTP-ответ с публичным URL файла
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
    slug = (body.get('slug') or 'common').strip().replace('/', '')[:64] or 'common'
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

    key = f"documents/{slug}/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=ALLOWED_EXT[ext])
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'url': cdn_url})}
