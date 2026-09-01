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

VALID_PLANS = ('start', 'pro', 'premium', 'chop', 'hr')
# Тариф работодателя: открывает доступ к базе резюме, а не профиль специалиста.
HR_PLANS = ('hr',)

# Минимальные ожидаемые суммы в рублях (со скидкой 70% от полной цены — с запасом на промо и валютную конвертацию)
PLAN_PRICES_RUB = {'start': 1990, 'pro': 4490, 'premium': 7990, 'chop': 12990, 'hr': 9900}
# Годовая подписка стоит как 10 месяцев (2 в подарок) — так же, как в create-payment.
YEAR_MONTHS = 10
# Максимальная законная скидка (промо). Ниже этой доли платёж считается поддельным.
MAX_DISCOUNT = 0.30
# Небольшой допуск на округление и курсовые копейки.
ROUNDING_TOLERANCE = 0.02


# Сколько единиц валюты стоит 1 рубль. Курсы намеренно занижены (валюта
# «дешевле» рубля, чем на деле): порог проверки становится мягче, и настоящий
# платёж не отклонится из-за колебаний курса, а копеечный — всё равно не пройдёт.
RUB_RATES = {
    'RUB': 1.0, 'USD': 0.009, 'EUR': 0.008, 'GBP': 0.007,
    'AED': 0.033, 'BYN': 0.028, 'KZT': 4.5, 'UAH': 0.36,
    'TRY': 0.30, 'CNY': 0.065, 'INR': 0.75,
}


def _to_rub_rate(currency: str) -> float:
    '''Множитель для перевода рублёвой цены в валюту платежа.
    Неизвестная валюта — считаем по доллару: это самый строгий порог.'''
    return RUB_RATES.get((currency or 'RUB').upper(), 0.009)


def _expected_min_rub(plan: str, period: str) -> float:
    '''
    Минимально допустимая сумма для тарифа с учётом периода и максимальной
    скидки. Раньше принимались любые 50% от МЕСЯЧНОЙ цены, из-за чего годовую
    подписку можно было получить, заплатив за полмесяца.
    '''
    base = PLAN_PRICES_RUB[plan] * (YEAR_MONTHS if period == 'year' else 1)
    # На доступ работодателя промо-скидка не действует, поэтому и «пола»
    # в 70% для него быть не должно: иначе базу можно выкупить дешевле цены.
    discount = 0.0 if plan in HR_PLANS else MAX_DISCOUNT
    return base * (1 - discount) * (1 - ROUNDING_TOLERANCE)

# URL функции отправки чека на почту (send-receipt). Берётся из переменной
# окружения RECEIPT_FUNCTION_URL, чтобы не хардкодить адрес в коде и менять его
# без правок. Значение по умолчанию оставлено для обратной совместимости.
RECEIPT_URL = os.environ.get(
    'RECEIPT_FUNCTION_URL',
    'https://functions.poehali.dev/4a87b00b-70a2-4af4-846b-156ef2a08b97',
)
PLAN_TITLES = {'start': 'Старт', 'pro': 'Профи', 'premium': 'Премиум', 'chop': 'Для ЧОП',
               'hr': 'Доступ к базе резюме'}


def _send_receipt(email, plan, period, amount, currency, payment_id):
    '''Отправляет чек об оплате на email плательщика. Best-effort: ошибки не мешают webhook.'''
    if not email or '@' not in email:
        return
    period_ru = 'Годовая подписка' if period == 'year' else 'Месячная подписка'
    cur_sign = {'RUB': '₽', 'USD': '$', 'EUR': '€'}.get(currency, currency)
    try:
        amount_str = f'{float(amount):,.2f}'.replace(',', ' ') + f' {cur_sign}'
    except (TypeError, ValueError):
        amount_str = f'{amount} {cur_sign}'
    payload = {
        'email': email,
        'lang': 'ru',
        'receiptNo': str(payment_id)[:16].upper(),
        'date': datetime.utcnow().strftime('%d.%m.%Y'),
        'plan': PLAN_TITLES.get(plan, plan),
        'period': period_ru,
        'amount': amount_str,
        'payer': email,
        'method': 'Онлайн-оплата',
    }
    try:
        req = urllib.request.Request(
            RECEIPT_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        urllib.request.urlopen(req, timeout=15).read()
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError) as e:
        # Почту в журнал не пишем — это персональные данные, а логи хранятся
        # дольше и доступны шире, чем сама база. Для диагностики хватает
        # номера платежа.
        print(f'receipt send failed for payment {payment_id}: {type(e).__name__}')


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _activate(slug, plan, period):
    if not slug or plan not in VALID_PLANS:
        return False
    months = 12 if period == 'year' else 1
    until = (datetime.utcnow() + timedelta(days=30 * months)).strftime('%Y-%m-%d')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Работодатель: включаем доступ к базе резюме. Профиль специалиста при
    # этом не трогаем — у HR его попросту нет, slug имеет вид 'hr-{id}'.
    if plan in HR_PLANS:
        if not slug.startswith('hr-') or not slug[3:].isdigit():
            cur.close()
            conn.close()
            return False
        cur.execute(
            f"INSERT INTO {SCHEMA}.hr_access (user_id, active, until) VALUES (%s, true, %s) "
            f"ON CONFLICT (user_id) DO UPDATE SET active = true, until = EXCLUDED.until, "
            f"updated_at = now()",
            (int(slug[3:]), until),
        )
        conn.commit()
        cur.close()
        conn.close()
        return True

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


def _record_payment(slug, plan, period, amount, currency, provider, payment_id, email):
    '''Записывает успешный платёж в историю. Best-effort: не мешает основной обработке.'''
    if not slug:
        return
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.payments "
            f"(slug, plan, period, amount, currency, status, provider, payment_id, payer_email) "
            f"VALUES (%s, %s, %s, %s, %s, 'paid', %s, %s, %s)",
            (slug, plan, period, amount, currency, provider, str(payment_id)[:200], (email or '')[:200]),
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f'record_payment failed for {slug}: {e}')


def _already_processed(payment_id: str, provider: str) -> bool:
    '''Идемпотентность: одно и то же событие оплаты не должно активировать подписку дважды.
    Атомарная вставка ON CONFLICT: если строка вставилась — платёж новый (False),
    если конфликт (уже есть) — повтор (True). Без гонок и без падений на дубле.'''
    if not payment_id:
        return False
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.processed_payments (payment_id, provider) "
            f"VALUES (%s, %s) ON CONFLICT (payment_id) DO NOTHING RETURNING payment_id",
            (payment_id, provider),
        )
        inserted = cur.fetchone() is not None
        conn.commit()
        return not inserted
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
            status = str(data.get('status') or '')
            if status not in ('completed', 'paid'):
                return _resp(200, {'ok': False, 'error': 'not_paid'})
            # Отметку об обработке ставим только для действительно оплаченного
            # события — иначе неоплаченное уведомление «сжигает» номер платежа.
            if _already_processed(payment_id, 'paddle'):
                return _resp(200, {'ok': True, 'provider': 'paddle', 'duplicate': True})
            cd = data.get('custom_data') or {}
            p_plan = (cd.get('plan') or '').lower()
            p_period = cd.get('period', 'month')
            if p_plan not in VALID_PLANS:
                return _resp(400, {'error': 'invalid_plan'})
            if p_period not in ('month', 'year'):
                p_period = 'month'

            details = data.get('details') or {}
            totals = (details.get('totals') or {})
            p_amount = totals.get('grand_total') or totals.get('total') or 0
            try:
                p_amount = float(p_amount) / 100  # Paddle отдаёт сумму в минорных единицах
            except (TypeError, ValueError):
                p_amount = 0
            p_currency = data.get('currency_code', 'USD')

            # ПРОВЕРКА СУММЫ. Раньше подписка Paddle включалась до сверки
            # оплаченного с ценой тарифа — в отличие от ЮКассы. Уведомление с
            # копеечной суммой открывало полный доступ. Теперь сумма приводится
            # к рублям и сверяется с минимально допустимой ценой тарифа.
            if p_amount < _expected_min_rub(p_plan, p_period) * _to_rub_rate(p_currency):
                print(f'[payment-webhook] paddle amount_mismatch plan={p_plan} period={p_period}')
                return _resp(400, {'error': 'amount_mismatch'})

            ok = _activate(cd.get('slug', ''), p_plan, p_period)
            if ok:
                _send_receipt(cd.get('email', ''), p_plan, p_period, p_amount, p_currency, payment_id)
                _record_payment(cd.get('slug', ''), p_plan, p_period, p_amount, p_currency, 'paddle', payment_id, cd.get('email', ''))
            return _resp(200, {'ok': ok, 'provider': 'paddle'})
        return _resp(200, {'ok': True, 'ignored': etype})

    # ---- ЮКасса ----
    if 'event' in body and 'object' in body:
        etype = body.get('event', '')
        if etype == 'payment.succeeded':
            obj = body.get('object', {})
            payment_id = str(obj.get('id') or '')
            # Сначала подлинность, потом отметка об обработке. Раньше платёж
            # помечался обработанным ДО проверки: подделанный вебхук навсегда
            # занимал этот номер, и настоящее уведомление от ЮКассы по нему
            # отбрасывалось как дубль — оплата не активировала подписку.
            verified = _verify_yookassa_payment(payment_id)
            if not verified:
                return _resp(403, {'error': 'verification_failed'})
            if _already_processed(payment_id, 'yookassa'):
                return _resp(200, {'ok': True, 'provider': 'yookassa', 'duplicate': True})
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
            if period not in ('month', 'year'):
                period = 'month'
            expected_min = _expected_min_rub(plan, period)
            if paid_amount < expected_min:
                print(f'[payment-webhook] amount_mismatch plan={plan} period={period} paid={paid_amount} min={expected_min}')
                return _resp(400, {'error': 'amount_mismatch'})
            ok = _activate(slug, plan, period)
            if ok:
                pay_email = md.get('email') or (verified.get('receipt') or {}).get('customer', {}).get('email', '')
                currency = (verified.get('amount') or {}).get('currency', 'RUB')
                _send_receipt(pay_email, plan, period, paid_amount, currency, payment_id)
                _record_payment(slug, plan, period, paid_amount, currency, 'yookassa', payment_id, pay_email)
            return _resp(200, {'ok': ok, 'provider': 'yookassa'})
        return _resp(200, {'ok': True, 'ignored': etype})

    return _resp(200, {'ok': True, 'ignored': 'unknown'})