import json
import os
import psycopg2
from crypto_utils import encrypt_field

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    '''
    Business: сохраняет контакты исполнителя (телефон, email, мессенджеры, сайт) в БД.
    Args: event с httpMethod, body (JSON: slug, phone, email, whatsapp, telegram, website)
    Returns: HTTP-ответ со статусом сохранения
    '''
    method = event.get('httpMethod', 'POST')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    slug = (body.get('slug') or '').strip()
    if not slug:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'slug required'})}

    def clean(v):
        return (str(v).strip() if v is not None else '')[:200]

    phone = clean(body.get('phone'))
    email = clean(body.get('email'))
    whatsapp = clean(body.get('whatsapp'))
    telegram = clean(body.get('telegram')).lstrip('@')
    website = clean(body.get('website'))

    # Телефон, email и WhatsApp/Telegram шифруются перед записью в БД (AES).
    # Сайт (website) не шифруем — он и так публичный URL.
    enc_phone = encrypt_field(phone)
    enc_email = encrypt_field(email)
    enc_whatsapp = encrypt_field(whatsapp)
    enc_telegram = encrypt_field(telegram)

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.providers SET phone=%s, email=%s, whatsapp=%s, telegram=%s, website=%s WHERE slug=%s",
        (enc_phone, enc_email, enc_whatsapp, enc_telegram, website, slug),
    )
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    if updated == 0:
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'provider not found'})}

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True})}