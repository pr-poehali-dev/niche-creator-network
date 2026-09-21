import json
import os
import base64
import uuid

import boto3
from auth_utils import get_auth_user

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

# Что разрешено отправлять в переписке. Исполняемые файлы и архивы
# намеренно не допускаются: через чат специалистов по безопасности
# вирус разошёлся бы быстрее всего.
ALLOWED = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
}

IMAGE_EXT = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

MAGIC = {
    'png': (b'\x89PNG\r\n\x1a\n',),
    'jpg': (b'\xff\xd8\xff',),
    'jpeg': (b'\xff\xd8\xff',),
    'webp': (b'RIFF',),
    'gif': (b'GIF87a', b'GIF89a'),
    'pdf': (b'%PDF-',),
    # Офисные форматы: docx/xlsx — это zip, doc/xls — составной документ OLE.
    'docx': (b'PK\x03\x04',),
    'xlsx': (b'PK\x03\x04',),
    'doc': (b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1',),
    'xls': (b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1',),
}

DANGEROUS_MARKERS = (
    b'<script', b'<?php', b'<%', b'<svg', b'javascript:',
    b'#!/bin/', b'MZ\x90', b'\x7fELF',
)

PDF_DANGEROUS = (
    b'/JavaScript', b'/JS', b'/Launch', b'/OpenAction',
    b'/AA', b'/EmbeddedFile', b'/RichMedia',
)

# Потолок запроса у платформы — 3,5 МБ, и файл приходит в base64
# (это +33% к размеру). Поэтому реальный предел вложения ~2,4 МБ.
# Фото браузер ужимает перед отправкой, так что в этот лимит попадает
# даже снимок с телефона; для документов предел честно показываем.
MAX_IMAGE = 2400 * 1024
MAX_FILE = 2400 * 1024


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _content_ok(ext: str, data: bytes) -> bool:
    '''
    Проверяем содержимое, а не расширение. Переименованный вирус
    «фото.png» не пройдёт: у него не те первые байты.
    '''
    if ext == 'txt':
        # У текстового файла нет сигнатуры — проверяем, что это правда текст
        # и внутри нет скриптов.
        try:
            head = data[:8192].decode('utf-8')
        except UnicodeDecodeError:
            return False
        low = head.lower()
        return not any(m.decode('latin-1', 'ignore') in low for m in (b'<script', b'<?php', b'javascript:'))

    if not any(data.startswith(sig) for sig in MAGIC.get(ext, ())):
        return False
    if ext == 'webp' and data[8:12] != b'WEBP':
        return False
    if ext == 'pdf':
        return not any(m in data for m in PDF_DANGEROUS)
    if ext in ('docx', 'xlsx', 'doc', 'xls'):
        # Офисные файлы — контейнеры, внутри может быть что угодно;
        # ограничиваемся проверкой сигнатуры и размера.
        return True
    head_tail = data[:4096].lower() + data[-4096:].lower()
    return not any(m.lower() in head_tail for m in DANGEROUS_MARKERS)


def handler(event: dict, context) -> dict:
    '''
    Business: приём вложений для переписки — фото и документов. Файл
              проверяется по реальному содержимому (магические байты),
              исполняемые файлы и архивы не принимаются, затем кладётся
              в файловое хранилище. Возвращает ссылку для отправки в чат.
    Args: event с httpMethod, headers (X-Auth-Token), body (JSON: fileBase64, ext, name)
    Returns: HTTP-ответ со ссылкой на файл, типом и размером.
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'method_not_allowed'})

    user = get_auth_user(event)
    if not user:
        return _resp(401, {'error': 'unauthorized'})

    body = json.loads(event.get('body') or '{}')
    ext = str(body.get('ext') or '').lower().replace('.', '').strip()
    if ext == 'jpe':
        ext = 'jpeg'
    if ext not in ALLOWED:
        return _resp(400, {'error': 'unsupported_type'})

    raw = body.get('fileBase64') or ''
    if ',' in raw:
        raw = raw.split(',', 1)[1]

    # Размер считаем ДО декодирования. Раньше слишком большой файл сначала
    # раскладывался в память и функция падала с «сервис недоступен» —
    # человек не понимал, что именно пошло не так.
    limit = MAX_IMAGE if ext in IMAGE_EXT else MAX_FILE
    if len(raw) > (limit // 3) * 4 + 1024:
        return _resp(400, {'error': 'too_large', 'limitMb': limit // (1024 * 1024)})

    try:
        data = base64.b64decode(raw)
    except (ValueError, TypeError):
        return _resp(400, {'error': 'invalid_file'})
    if not data:
        return _resp(400, {'error': 'empty_file'})

    if len(data) > limit:
        return _resp(400, {'error': 'too_large', 'limitMb': limit // (1024 * 1024)})

    if not _content_ok(ext, data):
        return _resp(400, {'error': 'invalid_file'})

    # Имя файла показываем в чате, но в ключ хранилища не подставляем:
    # иначе через имя можно было бы влезть в чужую папку.
    safe_name = ''.join(c for c in str(body.get('name') or '') if c.isalnum() or c in ' ._-()')[:80]
    key = f"chat/u{user['id']}/{uuid.uuid4().hex}.{ext}"

    try:
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType=ALLOWED[ext])
    except Exception as e:
        print(f'[chat-upload] storage error: {type(e).__name__}')
        return _resp(500, {'error': 'storage_failed'})

    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return _resp(200, {
        'success': True,
        'url': url,
        'type': 'image' if ext in IMAGE_EXT else 'file',
        'name': safe_name or f'file.{ext}',
        'ext': ext,
        'size': len(data),
    })