import os
import json
from datetime import datetime, timedelta

import psycopg2
from crypto_utils import decrypt_field

from mail_utils import render_email, send_mail, esc, SITE_URL

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

# За сколько дней до окончания напоминаем
REMIND_DAYS = 3

PLAN_TITLES = {'start': 'Старт', 'pro': 'Профи', 'premium': 'Премиум', 'chop': 'Для ЧОП', 'enterprise': 'Enterprise'}


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _send_email(to_email, name, plan, until_str):
    """Напоминание о скором окончании подписки.

    Рассылочное письмо (bulk): получает заголовки отписки. Человек, который
    уже не работает на платформе, должен иметь возможность отписаться одним
    нажатием — иначе он нажмёт «спам», и это ударит по доставляемости всех
    остальных писем, включая коды входа.
    """
    if not os.environ.get('SMTP_HOST') or not os.environ.get('SMTP_USER'):
        return False, 'smtp_not_configured'

    plan_ru = PLAN_TITLES.get(plan, plan)
    greeting = f'Здравствуйте, {esc(name)}!' if name else 'Здравствуйте!'
    body = (
        f'<p style="margin:0 0 14px;">{greeting}</p>'
        f'<p style="margin:0 0 14px;">Ваш тариф <b>«{esc(plan_ru)}»</b> на платформе ЩИТ '
        f'заканчивается <b>{esc(until_str)}</b> — осталось около {REMIND_DAYS} дней.</p>'
        '<p style="margin:0;">Чтобы ваш профиль оставался видимым для клиентов и вы '
        'продолжали получать заказы, продлите подписку в личном кабинете.</p>'
    )
    html = render_email(
        'Напоминание о подписке',
        body,
        button_text='Продлить подписку',
        button_url=f'{SITE_URL}/?section=pricing',
        footer_note='Если вы уже продлили тариф — просто проигнорируйте это письмо.',
        preheader=f'Тариф «{plan_ru}» заканчивается {until_str}',
    )
    ok = send_mail(
        to_email,
        f'ЩИТ — подписка заканчивается {until_str}',
        html,
        bulk=True,
        log_tag='subscription-reminder',
    )
    return (True, None) if ok else (False, 'smtp_send_failed')


def handler(event, context):
    '''
    Business: раз в день рассылает исполнителям напоминание на почту за 3 дня
              до окончания подписки, чтобы они вовремя продлевали тариф.
              Защищено от повторной отправки: одному исполнителю не более
              одного напоминания на конкретную дату окончания.
    Args: event с httpMethod (вызывается планировщиком или вручную владельцем).
    Returns: HTTP-ответ со статистикой отправки (сколько найдено/отправлено).
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    target_date = (datetime.utcnow().date() + timedelta(days=REMIND_DAYS))

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Лог отправленных напоминаний (защита от дублей)
    cur.execute(
        f"CREATE TABLE IF NOT EXISTS {SCHEMA}.subscription_reminders "
        f"(slug VARCHAR(64), expires_on DATE, sent_at TIMESTAMP DEFAULT now(), "
        f"PRIMARY KEY (slug, expires_on))"
    )
    conn.commit()

    # Ищем всех, у кого активная подписка заканчивается ровно в target_date
    cur.execute(
        f"SELECT slug, name_ru, email, plan, subscription_until FROM {SCHEMA}.providers "
        f"WHERE subscription_active = true AND subscription_until = %s AND email <> ''",
        (target_date.isoformat(),),
    )
    rows = cur.fetchall()

    found = len(rows)
    sent = 0
    skipped = 0
    errors = 0

    for slug, name, email_enc, plan, until in rows:
        # Уже отправляли на эту дату окончания — пропускаем
        cur.execute(
            f"INSERT INTO {SCHEMA}.subscription_reminders (slug, expires_on) VALUES (%s, %s) "
            f"ON CONFLICT (slug, expires_on) DO NOTHING RETURNING slug",
            (slug, until.isoformat()),
        )
        if cur.fetchone() is None:
            conn.commit()
            skipped += 1
            continue
        conn.commit()

        email = decrypt_field(email_enc or '')
        if not email or '@' not in email:
            continue
        until_str = until.strftime('%d.%m.%Y')
        ok, _err = _send_email(email, (name or '').strip(), (plan or 'start'), until_str)
        if ok:
            sent += 1
        else:
            errors += 1

    cur.close()
    conn.close()

    return _resp(200, {
        'ok': True,
        'targetDate': target_date.isoformat(),
        'found': found,
        'sent': sent,
        'skipped': skipped,
        'errors': errors,
    })