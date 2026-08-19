import json
import os
import re
import html
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from rate_limit import check_and_count

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}


def _esc(v, limit=2000):
    return html.escape(str(v or '')[:limit])


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    '''
    Business: принимает обращение с формы обратной связи и отправляет его на почту владельца сайта.
    Args: event с httpMethod, body (JSON: name, email, subject, message). test=true — только проверка SMTP.
    Returns: HTTP-ответ со статусом отправки.
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'Method not allowed'})

    # Защита от спам-ботов: с одного адреса не больше 5 обращений за 10 минут.
    # Живому человеку этого с запасом хватает, автоматической рассылке — нет.
    if not check_and_count(event, 'feedback', limit=5, window_sec=600):
        return _resp(429, {'error': 'too_many_requests'})

    body = json.loads(event.get('body') or '{}')

    is_test = bool(body.get('test'))

    # Валидация пользовательского ввода — до проверки SMTP,
    # чтобы некорректные данные не зависели от настроек почты
    name = (body.get('name') or '').strip()[:200]
    from_email = (body.get('email') or '').strip()[:200]
    subj = (body.get('subject') or 'Обращение с сайта').strip()[:200]
    message = (body.get('message') or '').strip()[:5000]

    if not is_test:
        if not from_email or not EMAIL_RE.match(from_email):
            return _resp(400, {'error': 'Invalid email'})
        if not message:
            return _resp(400, {'error': 'Empty message'})

    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not all([smtp_host, smtp_user, smtp_password]):
        return _resp(500, {'error': 'SMTP is not configured', 'code': 'smtp_missing'})

    to_addr = smtp_user

    if is_test:
        subject = 'ЩИТ — Тест почты (проверка настроек)'
        html_body = (
            '<div style="font-family:Arial,sans-serif;color:#1a1d24;padding:24px;">'
            '<h2 style="color:#1a1d24;">Почта настроена верно ✅</h2>'
            '<p>Это тестовое письмо от вашего сайта <b>ЩИТ</b>. '
            'Если вы его получили — отправка писем работает: коды входа, чеки и обращения с формы обратной связи будут доходить.</p>'
            '</div>'
        )
    else:
        subject = f'ЩИТ — Обращение: {_esc(subj, 120)}'
        html_body = (
            '<div style="font-family:Arial,sans-serif;color:#1a1d24;padding:24px;max-width:600px;">'
            '<div style="background:#1a1d24;color:#fff;padding:18px 22px;border-radius:8px 8px 0 0;">'
            '<b style="letter-spacing:.2em;">Щ<span style="color:#d4af37;">ИТ</span></b>'
            '<div style="font-size:13px;opacity:.7;margin-top:4px;">Новое обращение с формы обратной связи</div></div>'
            '<div style="border:1px solid #e4e6eb;border-top:none;border-radius:0 0 8px 8px;padding:22px;">'
            f'<p style="margin:0 0 10px;"><b>Имя:</b> {_esc(name, 200) or "—"}</p>'
            f'<p style="margin:0 0 10px;"><b>Email:</b> {_esc(from_email, 200)}</p>'
            f'<p style="margin:0 0 10px;"><b>Тема:</b> {_esc(subj, 200)}</p>'
            f'<p style="margin:16px 0 6px;"><b>Сообщение:</b></p>'
            f'<div style="background:#f4f5f7;border-radius:6px;padding:14px;white-space:pre-wrap;">{_esc(message, 5000)}</div>'
            '</div></div>'
        )

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = to_addr
    if not is_test and body.get('email'):
        msg['Reply-To'] = (body.get('email') or '').strip()[:200]
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))

    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=20)
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, [to_addr], msg.as_string())
        server.quit()
    except smtplib.SMTPAuthenticationError:
        return _resp(500, {'error': 'SMTP auth failed', 'code': 'smtp_auth'})
    except Exception as e:
        print(f"[feedback] SMTP ERROR: {type(e).__name__}: {e}")
        return _resp(500, {'error': 'Send failed', 'code': 'smtp_send'})

    return _resp(200, {'success': True, 'sent_to': to_addr, 'test': is_test})