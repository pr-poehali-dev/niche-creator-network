import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
import auth_utils

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}

ALLOWED_TYPES = {'system', 'message', 'terms', 'price', 'task', 'community'}


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _email_enabled(cur, user_id: int) -> bool:
    cur.execute(f"SELECT email_enabled FROM {SCHEMA}.notification_prefs WHERE user_id=%s", (user_id,))
    row = cur.fetchone()
    if row is None:
        return True
    return bool(row[0])


def _send_email(to_addr: str, title: str, body: str) -> bool:
    '''Дублирование уведомления на почту. Возвращает True при успешной отправке.'''
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
        print(f"[notifications] SMTP ERROR: {type(e).__name__}: {e}")
        return False


def _create_notification(cur, user_id: int, ntype: str, title: str, body: str, link, email_to: str):
    '''Создаёт уведомление и, если пользователь не отключил, дублирует на почту.'''
    if ntype not in ALLOWED_TYPES:
        ntype = 'system'
    cur.execute(
        f"INSERT INTO {SCHEMA}.notifications (user_id, type, title, body, link) "
        f"VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (user_id, ntype, title[:255], body, (link or None)),
    )
    new_id = cur.fetchone()[0]
    emailed = False
    if email_to and _email_enabled(cur, user_id):
        emailed = _send_email(email_to, title, body)
    return new_id, emailed


def handler(event: dict, context) -> dict:
    '''
    Business: колокольчик уведомлений — список, счётчик непрочитанных, настройки
    дублирования на почту (вкл/выкл), пометка прочитанным. Уведомления приходят от
    платформы: сообщения, изменения оферты/лицензии, цены, новые задачи, общение.
    Args: event с httpMethod; GET — список+настройки; POST body {action}.
    Returns: JSON с уведомлениями/статусом.
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    user = auth_utils.get_auth_user(event)
    if not user:
        return _resp(401, {'error': 'unauthorized'})
    user_id = user['id']

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()

        if method == 'GET':
            cur.execute(
                f"SELECT id, type, title, body, link, is_read, created_at "
                f"FROM {SCHEMA}.notifications WHERE user_id=%s ORDER BY created_at DESC LIMIT 50",
                (user_id,),
            )
            items = [{
                'id': r[0], 'type': r[1], 'title': r[2], 'body': r[3],
                'link': r[4], 'isRead': bool(r[5]),
                'createdAt': r[6].isoformat() if r[6] else None,
            } for r in cur.fetchall()]
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.notifications WHERE user_id=%s AND is_read=false",
                (user_id,),
            )
            unread = cur.fetchone()[0]
            # Непрочитанные личные сообщения считаем здесь же: отдельный опрос
            # из шапки удвоил бы число вызовов функций на каждого посетителя.
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.direct_messages "
                f"WHERE to_id = %s AND read_at IS NULL",
                (f'u{user_id}',),
            )
            unread_messages = int((cur.fetchone() or [0])[0])
            email_enabled = _email_enabled(cur, user_id)
            conn.commit()
            return _resp(200, {
                'notifications': items,
                'unread': unread,
                'unreadMessages': unread_messages,
                'emailEnabled': email_enabled,
            })

        body = {}
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            body = {}
        action = body.get('action', '')

        if action == 'mark_read':
            nid = int(body.get('id', 0))
            cur.execute(
                f"UPDATE {SCHEMA}.notifications SET is_read=true WHERE id=%s AND user_id=%s",
                (nid, user_id),
            )
            conn.commit()
            return _resp(200, {'success': True})

        if action == 'mark_all_read':
            cur.execute(
                f"UPDATE {SCHEMA}.notifications SET is_read=true WHERE user_id=%s AND is_read=false",
                (user_id,),
            )
            conn.commit()
            return _resp(200, {'success': True})

        if action == 'set_email':
            enabled = bool(body.get('enabled', True))
            cur.execute(
                f"INSERT INTO {SCHEMA}.notification_prefs (user_id, email_enabled) VALUES (%s, %s) "
                f"ON CONFLICT (user_id) DO UPDATE SET email_enabled=EXCLUDED.email_enabled, updated_at=now()",
                (user_id, enabled),
            )
            conn.commit()
            return _resp(200, {'success': True, 'emailEnabled': enabled})

        if action == 'create':
            # Пользователь создаёт уведомление самому себе (тест/демо колокольчика).
            ntype = body.get('type', 'system')
            title = (body.get('title') or '').strip() or 'Уведомление'
            text = (body.get('body') or '').strip()
            link = body.get('link')
            new_id, emailed = _create_notification(cur, user_id, ntype, title, text, link, user['email'])
            conn.commit()
            return _resp(200, {'success': True, 'id': new_id, 'emailed': emailed})

        return _resp(400, {'error': 'unknown_action'})
    finally:
        conn.close()