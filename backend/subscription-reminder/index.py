import os
import json
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import psycopg2
from crypto_utils import decrypt_field

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

PLAN_TITLES = {'start': 'Старт', 'pro': 'Профи', 'premium': 'Премиум', 'enterprise': 'Enterprise'}


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _send_email(to_email, name, plan, until_str):
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not all([smtp_host, smtp_user, smtp_password]):
        return False, 'smtp_not_configured'

    plan_ru = PLAN_TITLES.get(plan, plan)
    greeting = f'Здравствуйте, {name}!' if name else 'Здравствуйте!'
    html = (
        '<div style="font-family:Arial,sans-serif;color:#1a1d24;padding:24px;max-width:600px;margin:0 auto;">'
        '<div style="background:#1a1d24;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">'
        '<b style="letter-spacing:.2em;font-size:18px;">Щ<span style="color:#d4af37;">ИТ</span></b>'
        '<div style="font-size:13px;opacity:.7;margin-top:4px;">Напоминание о подписке</div></div>'
        '<div style="border:1px solid #e4e6eb;border-top:none;border-radius:0 0 8px 8px;padding:24px;">'
        f'<p style="margin:0 0 14px;">{greeting}</p>'
        f'<p style="margin:0 0 14px;">Ваш тариф <b>«{plan_ru}»</b> на платформе ЩИТ '
        f'заканчивается <b>{until_str}</b> — осталось около {REMIND_DAYS} дней.</p>'
        '<p style="margin:0 0 14px;">Чтобы ваш профиль оставался видимым для клиентов и вы '
        'продолжали получать заказы, продлите подписку в личном кабинете.</p>'
        '<a href="https://shieldpspl.ru/" '
        'style="display:inline-block;background:#d4af37;color:#1a1d24;text-decoration:none;'
        'font-weight:bold;padding:12px 26px;border-radius:6px;margin:6px 0 4px;">Продлить подписку</a>'
        '<p style="margin:18px 0 0;font-size:12px;color:#9aa0ab;">Если вы уже продлили тариф — '
        'просто проигнорируйте это письмо.</p>'
        '</div></div>'
    )

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'ЩИТ — подписка заканчивается {until_str}'
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=20)
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, [to_email], msg.as_string())
        server.quit()
        return True, None
    except Exception as e:
        return False, str(e)[:200]


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
