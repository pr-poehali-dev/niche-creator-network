import html
import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import psycopg2
import auth_utils

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

ALLOWED_TARGET_TYPES = {'provider', 'client', 'message', 'forum_topic'}
ALLOWED_REASONS = {
    'spam', 'scam', 'illegal', 'harassment', 'fake_profile', 'other',
}

REASON_LABELS = {
    'spam': 'Спам', 'scam': 'Мошенничество', 'illegal': 'Незаконная деятельность',
    'harassment': 'Оскорбления', 'fake_profile': 'Поддельный профиль', 'other': 'Другое',
}
TARGET_LABELS = {
    'provider': 'Профиль исполнителя', 'client': 'Профиль клиента',
    'message': 'Личное сообщение', 'forum_topic': 'Тема форума',
}


def esc(v, limit=2000):
    return str(v if v is not None else '').strip()[:limit]


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _esc_html(v, limit=2000):
    return html.escape(str(v or '')[:limit])


def _notify_admin_email(reporter_email: str, target_type: str, target_id: str, reason: str, details: str):
    '''Отправляет письмо администратору о новой жалобе. Не бросает исключений наружу —
    сбой почты не должен ломать создание жалобы (она уже сохранена в БД).'''
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port_raw = os.environ.get('SMTP_PORT', '465')
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not all([smtp_host, smtp_user, smtp_password]):
        return
    try:
        smtp_port = int(smtp_port_raw)
    except (TypeError, ValueError):
        smtp_port = 465

    target_label = TARGET_LABELS.get(target_type, target_type)
    reason_label = REASON_LABELS.get(reason, reason)
    subject = f'ЩИТ — Новая жалоба: {reason_label}'
    html_body = (
        '<div style="font-family:Arial,sans-serif;color:#1a1d24;padding:24px;max-width:600px;">'
        '<div style="background:#1a1d24;color:#fff;padding:18px 22px;border-radius:8px 8px 0 0;">'
        '<b style="letter-spacing:.2em;">Щ<span style="color:#d4af37;">ИТ</span></b>'
        '<div style="font-size:13px;opacity:.7;margin-top:4px;">Новая жалоба на платформе</div></div>'
        '<div style="border:1px solid #e4e6eb;border-top:none;border-radius:0 0 8px 8px;padding:22px;">'
        f'<p style="margin:0 0 10px;"><b>Объект жалобы:</b> {_esc_html(target_label, 100)}</p>'
        f'<p style="margin:0 0 10px;"><b>ID объекта:</b> {_esc_html(target_id, 100)}</p>'
        f'<p style="margin:0 0 10px;"><b>Причина:</b> {_esc_html(reason_label, 100)}</p>'
        f'<p style="margin:0 0 10px;"><b>От кого:</b> {_esc_html(reporter_email, 200) or "—"}</p>'
        f'<p style="margin:16px 0 6px;"><b>Подробности:</b></p>'
        f'<div style="background:#f4f5f7;border-radius:6px;padding:14px;white-space:pre-wrap;">{_esc_html(details, 2000) or "—"}</div>'
        '<p style="margin-top:18px;font-size:13px;color:#666;">Рассмотреть жалобу можно в панели администратора.</p>'
        '</div></div>'
    )
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = smtp_user
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=20)
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, [smtp_user], msg.as_string())
        server.quit()
    except Exception as e:
        print(f"[complaints] SMTP ERROR: {type(e).__name__}: {e}")


def handler(event: dict, context) -> dict:
    '''
    Business: жалобы пользователей на профили исполнителей/клиентов, личные сообщения
              или темы форума. Модерация доступна только администратору.
    Args: event с httpMethod, body (action=create: targetType, targetId, reason, details;
          action=list/resolve — только для админа)
    Returns: HTTP-ответ со статусом создания жалобы или списком (для админа)
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        user = auth_utils.get_auth_user(event)
        if not user:
            return _resp(401, {'error': 'unauthorized'})

        if method == 'GET':
            if not user.get('is_admin'):
                return _resp(403, {'error': 'forbidden'})
            cur.execute(
                f"SELECT id, reporter_user_id, reporter_role, target_type, target_id, reason, details, status, created_at "
                f"FROM {SCHEMA}.complaints ORDER BY created_at DESC LIMIT 200"
            )
            items = [{
                'id': r[0], 'reporterUserId': r[1], 'reporterRole': r[2],
                'targetType': r[3], 'targetId': r[4], 'reason': r[5], 'details': r[6],
                'status': r[7], 'createdAt': r[8].isoformat() if r[8] else None,
            } for r in cur.fetchall()]
            return _resp(200, {'complaints': items})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 20) or 'create'

            if action == 'create':
                target_type = esc(body.get('targetType'), 20)
                target_id = esc(body.get('targetId'), 64)
                reason = esc(body.get('reason'), 30)
                details = esc(body.get('details'), 2000)
                if target_type not in ALLOWED_TARGET_TYPES or not target_id:
                    return _resp(400, {'error': 'targetType and targetId required'})
                if reason not in ALLOWED_REASONS:
                    reason = 'other'
                cur.execute(
                    f"INSERT INTO {SCHEMA}.complaints (reporter_user_id, reporter_role, target_type, target_id, reason, details) "
                    f"VALUES (%s, %s, %s, %s, %s, %s)",
                    (user['id'], user.get('role', ''), target_type, target_id, reason, details),
                )
                conn.commit()
                # Уведомляем администратора на почту, чтобы жалоба не потерялась.
                # Сбой отправки не влияет на успешный ответ — жалоба уже сохранена.
                _notify_admin_email(user.get('email', ''), target_type, target_id, reason, details)
                return _resp(200, {'success': True})

            if action == 'resolve':
                if not user.get('is_admin'):
                    return _resp(403, {'error': 'forbidden'})
                try:
                    complaint_id = int(body.get('complaintId') or 0)
                except (TypeError, ValueError):
                    complaint_id = 0
                status = esc(body.get('status'), 20) or 'resolved'
                if not complaint_id:
                    return _resp(400, {'error': 'complaintId required'})
                cur.execute(
                    f"UPDATE {SCHEMA}.complaints SET status=%s WHERE id=%s",
                    (status, complaint_id),
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()