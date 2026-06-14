import json
import os
import base64
import uuid
import urllib.request
import urllib.error

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}

# Базовые цены тарифов в рублях (источник истины)
PLAN_PRICES_RUB = {
    'start': 1990,
    'pro': 4490,
    'premium': 7990,
}

# Валюта по коду страны (ISO 3166-1 alpha-2)
COUNTRY_CURRENCY = {
    'RU': 'RUB', 'BY': 'BYN', 'KZ': 'KZT', 'UA': 'UAH',
    'US': 'USD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'ES': 'EUR', 'IT': 'EUR',
    'AE': 'AED', 'TR': 'TRY', 'CN': 'CNY', 'IN': 'INR', 'KZ2': 'KZT',
}

# Запасные курсы (1 RUB = X валюты), на случай недоступности API
FALLBACK_RATES = {
    'RUB': 1.0, 'USD': 0.011, 'EUR': 0.010, 'GBP': 0.0086,
    'AED': 0.040, 'BYN': 0.036, 'KZT': 5.6, 'UAH': 0.45,
    'TRY': 0.39, 'CNY': 0.078, 'INR': 0.93,
}


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _country_code(event, body):
    cc = (body.get('countryCode') or '').upper().strip()
    if cc:
        return cc
    try:
        ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', '')
    except (AttributeError, TypeError):
        ip = ''
    if ip:
        try:
            url = f'http://ip-api.com/json/{ip}?fields=status,countryCode'
            with urllib.request.urlopen(url, timeout=6) as r:
                d = json.loads(r.read().decode('utf-8'))
            if d.get('status') == 'success':
                return (d.get('countryCode') or '').upper()
        except (urllib.error.URLError, ValueError, TimeoutError):
            pass
    return 'RU'


def _rate(currency):
    if currency == 'RUB':
        return 1.0
    try:
        url = f'https://api.exchangerate.host/convert?from=RUB&to={currency}'
        with urllib.request.urlopen(url, timeout=6) as r:
            d = json.loads(r.read().decode('utf-8'))
        rate = d.get('result')
        if rate and rate > 0:
            return float(rate)
    except (urllib.error.URLError, ValueError, TimeoutError, KeyError):
        pass
    return FALLBACK_RATES.get(currency, FALLBACK_RATES['USD'])


def _create_yookassa(amount_rub, plan, email, return_url):
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret = os.environ.get('YOOKASSA_SECRET_KEY', '')
    if not shop_id or not secret:
        return None, 'yookassa_not_configured'
    payload = {
        'amount': {'value': f'{amount_rub:.2f}', 'currency': 'RUB'},
        'capture': True,
        'confirmation': {'type': 'redirect', 'return_url': return_url or 'https://example.com/return'},
        'description': f'Подписка «{plan}»',
        'metadata': {'plan': plan, 'email': email},
    }
    data = json.dumps(payload).encode('utf-8')
    token = base64.b64encode(f'{shop_id}:{secret}'.encode()).decode()
    req = urllib.request.Request(
        'https://api.yookassa.ru/v3/payments',
        data=data,
        headers={
            'Authorization': f'Basic {token}',
            'Idempotence-Key': str(uuid.uuid4()),
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            res = json.loads(r.read().decode('utf-8'))
        confirm = (res.get('confirmation') or {}).get('confirmation_url')
        return {'paymentId': res.get('id'), 'confirmationUrl': confirm, 'provider': 'yookassa'}, None
    except urllib.error.HTTPError as e:
        return None, f'yookassa_error_{e.code}'
    except (urllib.error.URLError, ValueError, TimeoutError):
        return None, 'yookassa_unavailable'


def _create_paddle(amount, currency, plan, email):
    api_key = os.environ.get('PADDLE_API_KEY', '')
    env = (os.environ.get('PADDLE_ENV', 'sandbox') or 'sandbox').lower()
    if not api_key:
        return None, 'paddle_not_configured'
    base = 'https://sandbox-api.paddle.com' if env != 'production' else 'https://api.paddle.com'
    # Создаём транзакцию с произвольной ценой (custom price) на подписку
    cents = int(round(amount * 100))
    payload = {
        'items': [{
            'quantity': 1,
            'price': {
                'description': f'Subscription {plan}',
                'name': f'Plan {plan}',
                'billing_cycle': {'interval': 'month', 'frequency': 1},
                'unit_price': {'amount': str(cents), 'currency_code': currency},
                'product': {'name': f'Shchit {plan}', 'tax_category': 'standard'},
            },
        }],
        'currency_code': currency,
        'collection_mode': 'automatic',
        'customer': {'email': email} if email else None,
    }
    payload = {k: v for k, v in payload.items() if v is not None}
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f'{base}/transactions',
        data=data,
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            res = json.loads(r.read().decode('utf-8'))
        txn = res.get('data', {})
        checkout = (txn.get('checkout') or {}).get('url')
        return {'paymentId': txn.get('id'), 'checkoutUrl': checkout, 'provider': 'paddle'}, None
    except urllib.error.HTTPError as e:
        return None, f'paddle_error_{e.code}'
    except (urllib.error.URLError, ValueError, TimeoutError):
        return None, 'paddle_unavailable'


def handler(event, context):
    '''
    Business: создаёт платёж за подписку. Для РФ — через ЮКассу (рубли),
              для остальных стран — через Paddle с автоконвертацией валюты.
              Возвращает ссылку на оплату и сумму в местной валюте.
    Args: event с httpMethod, body (plan, email, countryCode, period, returnUrl)
    Returns: HTTP-ответ с ссылкой оплаты, суммой и валютой
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')

    # GET / quote: только посчитать сумму в местной валюте без создания платежа
    action = (body.get('action') or '').strip()
    plan = (body.get('plan') or '').lower().strip()
    if plan not in PLAN_PRICES_RUB:
        return _resp(400, {'error': 'invalid_plan'})

    period = (body.get('period') or 'month').lower()
    months = 12 if period == 'year' else 1
    # Год = 10 месяцев (2 в подарок)
    base_rub = PLAN_PRICES_RUB[plan] * (10 if months == 12 else 1)

    cc = _country_code(event, body)
    currency = COUNTRY_CURRENCY.get(cc, 'USD')
    rate = _rate(currency)
    local_amount = round(base_rub * rate, 2)

    quote = {
        'plan': plan,
        'countryCode': cc,
        'currency': currency,
        'amount': local_amount,
        'amountRub': base_rub,
        'period': 'year' if months == 12 else 'month',
        'provider': 'yookassa' if cc == 'RU' else 'paddle',
    }

    if action == 'quote':
        return _resp(200, quote)

    email = (body.get('email') or '').strip()
    return_url = (body.get('returnUrl') or '').strip()

    if cc == 'RU':
        result, err = _create_yookassa(base_rub, plan, email, return_url)
    else:
        result, err = _create_paddle(local_amount, currency, plan, email)

    if err:
        return _resp(200, {**quote, 'configured': False, 'error': err})

    return _resp(200, {**quote, 'configured': True, **result})
