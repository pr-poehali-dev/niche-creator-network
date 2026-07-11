import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

ALLOWED_TYPES = {'system', 'message', 'terms', 'price', 'task', 'community'}


def _email_enabled(cur, user_id: int) -> bool:
    '''Дублировать ли уведомления на почту (по умолчанию — да).'''
    cur.execute(f"SELECT email_enabled FROM {SCHEMA}.notification_prefs WHERE user_id=%s", (user_id,))
    row = cur.fetchone()
    if row is None:
        return True
    return bool(row[0])


def _user_email(cur, user_id: int):
    cur.execute(f"SELECT email FROM {SCHEMA}.users WHERE id=%s", (user_id,))
    row = cur.fetchone()
    return row[0] if row else None


def _send_email(to_addr: str, title: str, body: str) -> bool:
    host = os.environ.get('SMTP_HOST')
    port = int(os.environ.get('SMTP_PORT', '465'))
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD')
    if not all([host, user, password, to_addr]):
        return False
    html = (
        '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">'
        '<div style="background:#0d1117;padding:20px;border-radius:8px 8px 0 0">'
        '<span style="color:#e6b34d;font-weight:bold;font-size:18px">ЩИТ</span></div>'
        f'<div style="padding:24px;border:1px solid #eee;border-top:0;border-radius:0 0 8px 8px">'
        f'<h2 style="color:#111;font-size:18px;margin:0 0 12px">{title}</h2>'
        f'<p style="color:#444;font-size:14px;line-height:1.6">{body}</p>'
        '<p style="color:#999;font-size:12px;margin-top:24px">Вы получили это письмо, потому что включено '
        'дублирование уведомлений на почту. Отключить можно в личном кабинете.</p>'
        '</div></div>'
    )
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'ЩИТ · {title}'
    msg['From'] = user
    msg['To'] = to_addr
    msg.attach(MIMEText(html, 'html', 'utf-8'))
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=20)
        else:
            server = smtplib.SMTP(host, port, timeout=20)
            server.starttls()
        server.login(user, password)
        server.sendmail(user, [to_addr], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[notify] SMTP ERROR: {type(e).__name__}: {e}")
        return False


def id_from_slug(slug: str):
    '''Извлекает user_id из slug вида provider-123 / client-123.'''
    try:
        return int(str(slug).rsplit('-', 1)[-1])
    except (ValueError, AttributeError):
        return None


def push(cur, user_id, ntype: str, title: str, body: str, link=None):
    '''Создаёт уведомление пользователю и, если не отключено, дублирует на почту.
    Не бросает исключений наружу — уведомления не должны ломать основную операцию.'''
    if not user_id:
        return
    try:
        if ntype not in ALLOWED_TYPES:
            ntype = 'system'
        cur.execute(
            f"INSERT INTO {SCHEMA}.notifications (user_id, type, title, body, link) "
            f"VALUES (%s, %s, %s, %s, %s)",
            (user_id, ntype, str(title)[:255], str(body), (link or None)),
        )
        if _email_enabled(cur, user_id):
            email = _user_email(cur, user_id)
            if email:
                _send_email(email, str(title), str(body))
    except Exception as e:
        print(f"[notify] push error: {type(e).__name__}: {e}")
