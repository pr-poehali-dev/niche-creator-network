import json
import os
import hmac
import hashlib
from datetime import datetime, timedelta

import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Paddle-Signature',
    'Content-Type': 'application/json',
}

VALID_PLANS = ('start', 'pro', 'premium')


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _activate(slug, plan, period):
    if not slug or plan not in VALID_PLANS:
        return False
    months = 12 if period == 'year' else 1
    until = (datetime.utcnow() + timedelta(days=30 * months)).strftime('%Y-%m-%d')
    esc_slug = slug.replace("'", "''")
    esc_plan = plan.replace("'", "''")
    # premium даёт право на бейдж карточки; license_verified ставит админ отдельно
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.providers SET subscription_active=true, "
        f"subscription_until='{until}', plan='{esc_plan}' WHERE slug='{esc_slug}'"
    )
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return updated > 0


def _verify_paddle(raw_body, signature):
    secret = os.environ.get('PADDLE_WEBHOOK_SECRET', '')
    if not secret:
        return True  # секрет не задан — пропускаем (для теста sandbox)
    if not signature:
        return False
    try:
        parts = dict(p.split('=', 1) for p in signature.split(';'))
        ts = parts.get('ts', '')
        h1 = parts.get('h1', '')
        signed = f'{ts}:{raw_body}'.encode()
        digest = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
        return hmac.compare_digest(digest, h1)
    except (ValueError, AttributeError):
        return False


def handler(event, context):
    '''
    Business: принимает webhook об успешной оплате от ЮКассы и Paddle и
              автоматически активирует подписку и тариф исполнителя.
    Args: event с httpMethod, body (JSON вебхука), headers (Paddle-Signature)
    Returns: HTTP 200 при успешной обработке
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'method_not_allowed'})

    raw = event.get('body') or '{}'
    try:
        body = json.loads(raw)
    except (ValueError, TypeError):
        return _resp(400, {'error': 'invalid_json'})

    headers = event.get('headers') or {}

    # ---- Paddle ----
    if 'event_type' in body:
        sig = headers.get('Paddle-Signature') or headers.get('paddle-signature') or ''
        if not _verify_paddle(raw, sig):
            return _resp(403, {'error': 'bad_signature'})
        etype = body.get('event_type', '')
        if etype in ('transaction.completed', 'transaction.paid'):
            data = body.get('data', {})
            cd = data.get('custom_data') or {}
            ok = _activate(cd.get('slug', ''), (cd.get('plan') or '').lower(), cd.get('period', 'month'))
            return _resp(200, {'ok': ok, 'provider': 'paddle'})
        return _resp(200, {'ok': True, 'ignored': etype})

    # ---- ЮКасса ----
    if 'event' in body and 'object' in body:
        etype = body.get('event', '')
        if etype == 'payment.succeeded':
            obj = body.get('object', {})
            md = obj.get('metadata') or {}
            ok = _activate(md.get('slug', ''), (md.get('plan') or '').lower(), md.get('period', 'month'))
            return _resp(200, {'ok': ok, 'provider': 'yookassa'})
        return _resp(200, {'ok': True, 'ignored': etype})

    return _resp(200, {'ok': True, 'ignored': 'unknown'})
