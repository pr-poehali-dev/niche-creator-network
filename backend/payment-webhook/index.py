import json
import os
import hmac
import hashlib
import base64
import urllib.request
import urllib.error
from datetime import datetime, timedelta

import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Paddle-Signature',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

VALID_PLANS = ('start', 'pro', 'premium')

# Минимальные ожидаемые суммы в рублях (со скидкой 70% от полной цены — с запасом на промо и валютную конвертацию)
PLAN_PRICES_RUB = {'start': 1990, 'pro': 4490, 'premium': 7990}
MIN_ACCEPTABLE_FACTOR = 0.5  # не даём активировать тариф, если оплачено меньше половины минимальной цены


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _activate(slug, plan, period):
    if not slug or plan not in VALID_PLANS:
        return False
    months = 12 if period == 'year' else 1
    until = (datetime.utcnow() + timedelta(days=30 * months)).strftime('%Y-%m-%d')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.providers SET subscription_active=true, "
        f"subscription_until=%s, plan=%s WHERE slug=%s",
        (until, plan, slug),
    )
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return updated > 0


def _already_processed(payment_id: str, provider: str) -> bool:
    '''Идемпотентность: одно и то же событие оплаты не должно активировать подписку дважды.'''
    if not payment_id:
        return False
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"CREATE TABLE IF NOT EXISTS {SCHEMA}.processed_payments "
        f"(payment_id VARCHAR(200) PRIMARY KEY, provider VARCHAR(20), created_at TIMESTAMP DEFAULT now())"
    )
    conn.commit()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.processed_payments (payment_id, provider) VALUES (%s, %s)",
            (payment_id, provider),
        )
        conn.commit()
        return False
    except psycopg2.IntegrityError:
        conn.rollback()
        return True
    finally:
        cur.close()
        conn.close()


def _verify_paddle(raw_body, signature):
    secret = os.environ.get('PADDLE_WEBHOOK_SECRET', '')
    if not secret:
        return False  # без секрета не доверяем вебхукам в проде
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


def _verify_yookassa_payment(payment_id: str) -> dict | None:
    '''
    ЮКасса не подписывает вебхуки HMAC-ключом — единственный надёжный способ
    убедиться, что оплата реальна, это запросить сам платёж напрямую через API
    ЮКассы по его ID и проверить статус/сумму на стороне сервера.
    '''
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret = os.environ.get('YOOKASSA_SECRET_KEY', '')
    if not shop_id or not secret or not payment_id:
        return None
    token = base64.b64encode(f'{shop_id}:{secret}'.encode()).decode()
    req = urllib.request.Request(
        f'https://api.yookassa.ru/v3/payments/{payment_id}',
        headers={'Authorization': f'Basic {token}'},
        method='GET',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except (urllib.error.URLError, ValueError, TimeoutError):
        return None


def handler(event, context):
    '''
    Business: принимает webhook об успешной оплате от ЮКассы и Paddle и
              автоматически активирует подписку и тариф исполнителя.
              Каждый платёж проверяется на стороне сервера (подпись или прямой запрос
              к API провайдера), чтобы исключить подделку уведомлений об оплате.
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
            payment_id = str(data.get('id') or '')
            if _already_processed(payment_id, 'paddle'):
                return _resp(200, {'ok': True, 'provider': 'paddle', 'duplicate': True})
            status = str(data.get('status') or '')
            if status not in ('completed', 'paid'):
                return _resp(200, {'ok': False, 'error': 'not_paid'})
            cd = data.get('custom_data') or {}
            ok = _activate(cd.get('slug', ''), (cd.get('plan') or '').lower(), cd.get('period', 'month'))
            return _resp(200, {'ok': ok, 'provider': 'paddle'})
        return _resp(200, {'ok': True, 'ignored': etype})

    # ---- ЮКасса ----
    if 'event' in body and 'object' in body:
        etype = body.get('event', '')
        if etype == 'payment.succeeded':
            obj = body.get('object', {})
            payment_id = str(obj.get('id') or '')
            if _already_processed(payment_id, 'yookassa'):
                return _resp(200, {'ok': True, 'provider': 'yookassa', 'duplicate': True})
            # Не доверяем телу вебхука напрямую — перезапрашиваем платёж у ЮКассы по ID
            verified = _verify_yookassa_payment(payment_id)
            if not verified:
                return _resp(403, {'error': 'verification_failed'})
            if verified.get('status') != 'succeeded' or not verified.get('paid'):
                return _resp(200, {'ok': False, 'error': 'not_paid'})
            md = verified.get('metadata') or {}
            plan = (md.get('plan') or '').lower()
            slug = md.get('slug', '')
            period = md.get('period', 'month')
            if plan not in VALID_PLANS:
                return _resp(400, {'error': 'invalid_plan'})
            try:
                paid_amount = float((verified.get('amount') or {}).get('value') or 0)
            except (TypeError, ValueError):
                paid_amount = 0
            expected_min = PLAN_PRICES_RUB[plan] * MIN_ACCEPTABLE_FACTOR
            if paid_amount < expected_min:
                return _resp(400, {'error': 'amount_mismatch'})
            ok = _activate(slug, plan, period)
            return _resp(200, {'ok': ok, 'provider': 'yookassa'})
        return _resp(200, {'ok': True, 'ignored': etype})

    return _resp(200, {'ok': True, 'ignored': 'unknown'})
