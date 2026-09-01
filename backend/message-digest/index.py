import os
import json
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

# Письмо шлём, только если сообщение висит непрочитанным дольше этого срока:
# человек мог просто не успеть открыть вкладку.
QUIET_HOURS = 3
# Если непрочитанное уже старше этого срока — письмо не нужно: либо его уже
# отправляли, либо новость перестала быть срочной.
MAX_AGE_HOURS = 72

SITE_URL = 'https://shieldpspl.ru/'


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False)}


def _send_email(to_email: str, name: str, count: int, senders: list) -> bool:
    '''Письмо о непрочитанных сообщениях. Текст сообщений НЕ включаем —
    переписка приватна, в письме только факт и имена отправителей.'''
    host = os.environ.get('SMTP_HOST')
    port = int(os.environ.get('SMTP_PORT', '465'))
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD')
    if not all([host, user, password]):
        return False

    greeting = f'Здравствуйте, {name}!' if name else 'Здравствуйте!'
    if count == 1:
        headline = 'У вас 1 непрочитанное сообщение'
    elif 2 <= count <= 4:
        headline = f'У вас {count} непрочитанных сообщения'
    else:
        headline = f'У вас {count} непрочитанных сообщений'
    from_line = ''
    if senders:
        names = ', '.join(senders[:3])
        more = f' и ещё {len(senders) - 3}' if len(senders) > 3 else ''
        from_line = f'<p style="margin:0 0 14px;">От: <b>{names}</b>{more}.</p>'

    html = (
        '<div style="font-family:Arial,sans-serif;color:#1a1d24;padding:24px;max-width:600px;margin:0 auto;">'
        '<div style="background:#1a1d24;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">'
        '<b style="letter-spacing:.2em;font-size:18px;">Щ<span style="color:#d4af37;">ИТ</span></b>'
        '<div style="font-size:13px;opacity:.7;margin-top:4px;">Новые сообщения</div></div>'
        '<div style="border:1px solid #e4e6eb;border-top:none;border-radius:0 0 8px 8px;padding:24px;">'
        f'<p style="margin:0 0 14px;">{greeting}</p>'
        f'<p style="margin:0 0 14px;"><b>{headline}</b> в сообществе специалистов.</p>'
        f'{from_line}'
        f'<a href="{SITE_URL}" style="display:inline-block;background:#d4af37;color:#1a1d24;'
        'text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:6px;margin:6px 0 4px;">'
        'Открыть переписку</a>'
        '<p style="margin:18px 0 0;font-size:12px;color:#9aa0ab;">Текст сообщений мы не пересылаем — '
        'переписка доступна только вам. Отключить такие письма можно в уведомлениях на сайте.</p>'
        '</div></div>'
    )

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'ЩИТ — {headline.lower()}'
    msg['From'] = user
    msg['To'] = to_email
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=20)
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            server.starttls()
        server.login(user, password)
        server.sendmail(user, [to_email], msg.as_string())
        server.quit()
        return True
    except (smtplib.SMTPException, OSError) as e:
        print(f'[message-digest] send failed: {e}')
        return False


def handler(event, context):
    '''
    Business: раз в несколько часов присылает специалисту письмо, если ему
              написали, а он давно не заходил на сайт. Текст переписки в письмо
              не попадает — только количество и имена отправителей.
              Не чаще одного письма в сутки на человека; учитывает отключение
              почтовых уведомлений в настройках.
    Args: event с httpMethod (вызывается планировщиком или вручную владельцем).
    Returns: HTTP-ответ со статистикой (найдено получателей / отправлено писем).
    '''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    now = datetime.utcnow()
    quiet_before = now - timedelta(hours=QUIET_HOURS)
    too_old = now - timedelta(hours=MAX_AGE_HOURS)
    today = now.date()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Кому писать: есть непрочитанные сообщения нужного «возраста».
    # to_id хранится как 'u{id}' — приводим к числовому идентификатору.
    cur.execute(
        f"SELECT CAST(substring(to_id from 2) AS INTEGER) AS uid, COUNT(*) "
        f"FROM {SCHEMA}.direct_messages "
        f"WHERE read_at IS NULL AND to_id ~ '^u[0-9]+$' "
        f"AND created_at <= %s AND created_at >= %s "
        f"GROUP BY 1",
        (quiet_before, too_old),
    )
    targets = cur.fetchall()

    found = len(targets)
    sent = 0
    skipped = 0

    for uid, count in targets:
        # Человек заходил недавно — значит, сообщения он видел в интерфейсе,
        # письмо будет назойливым.
        cur.execute(
            f"SELECT MAX(last_seen_at) FROM {SCHEMA}.sessions WHERE user_id = %s",
            (uid,),
        )
        last_seen = (cur.fetchone() or [None])[0]
        if last_seen and last_seen > quiet_before:
            skipped += 1
            continue

        # Уважаем отключённые почтовые уведомления.
        cur.execute(
            f"SELECT email_enabled FROM {SCHEMA}.notification_prefs WHERE user_id = %s",
            (uid,),
        )
        pref = cur.fetchone()
        if pref is not None and not pref[0]:
            skipped += 1
            continue

        # Не чаще одного письма в сутки: вставка-замок в журнале отправок.
        cur.execute(
            f"INSERT INTO {SCHEMA}.message_digest_sent (user_id, sent_on) VALUES (%s, %s) "
            f"ON CONFLICT (user_id, sent_on) DO NOTHING RETURNING user_id",
            (uid, today),
        )
        if cur.fetchone() is None:
            conn.commit()
            skipped += 1
            continue
        conn.commit()

        cur.execute(f"SELECT email, name FROM {SCHEMA}.users WHERE id = %s", (uid,))
        urow = cur.fetchone()
        if not urow or not urow[0] or '@' not in urow[0]:
            continue
        email, name = urow[0], (urow[1] or '').strip()

        # Имена отправителей: берём из анкет, а не из поля сообщения.
        cur.execute(
            f"SELECT DISTINCT from_id FROM {SCHEMA}.direct_messages "
            f"WHERE to_id = %s AND read_at IS NULL AND created_at >= %s LIMIT 5",
            (f'u{uid}', too_old),
        )
        senders = []
        for (from_id,) in cur.fetchall():
            if not (from_id or '').startswith('u') or not from_id[1:].isdigit():
                continue
            cur.execute(
                f"SELECT name_ru FROM {SCHEMA}.providers WHERE slug = %s",
                (f'provider-{from_id[1:]}',),
            )
            prow = cur.fetchone()
            if prow and (prow[0] or '').strip():
                senders.append(prow[0].strip())

        if _send_email(email, name, int(count), senders):
            sent += 1

    cur.close()
    conn.close()
    return _resp(200, {'found': found, 'sent': sent, 'skipped': skipped})
