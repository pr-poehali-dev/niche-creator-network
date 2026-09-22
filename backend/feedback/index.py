import json
import os
import re
import html

from rate_limit import check_and_count

from mail_utils import render_email, send_mail

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

    if not os.environ.get('SMTP_HOST') or not os.environ.get('SMTP_USER'):
        return _resp(500, {'error': 'SMTP is not configured', 'code': 'smtp_missing'})

    to_addr = os.environ.get('SMTP_USER')

    if is_test:
        subject = 'ЩИТ — Тест почты (проверка настроек)'
        html_body = render_email(
            'Почта настроена верно',
            '<p style="margin:0;">Это тестовое письмо от вашего сайта <b>ЩИТ</b>. '
            'Если вы его получили — отправка писем работает: коды входа, чеки '
            'и обращения с формы обратной связи будут доходить.</p>',
            preheader='Проверка настроек почты прошла успешно',
        )
    else:
        subject = f'ЩИТ — Обращение: {_esc(subj, 120)}'
        html_body = render_email(
            'Новое обращение с формы обратной связи',
            (
                f'<p style="margin:0 0 10px;"><b>Имя:</b> {_esc(name, 200) or "—"}</p>'
                f'<p style="margin:0 0 10px;"><b>Email:</b> {_esc(from_email, 200)}</p>'
                f'<p style="margin:0 0 10px;"><b>Тема:</b> {_esc(subj, 200)}</p>'
                f'<p style="margin:16px 0 6px;"><b>Сообщение:</b></p>'
                f'<div style="background:#f4f5f7;border-radius:6px;padding:14px;white-space:pre-wrap;">{_esc(message, 5000)}</div>'
            ),
            preheader=f'{_esc(name, 60) or "Без имени"}: {_esc(subj, 80)}',
        )

    # Reply-To на адрес обратившегося: владелец отвечает прямо из почты,
    # не копируя адрес руками.
    reply_to = '' if is_test else (body.get('email') or '').strip()[:200]
    if not send_mail(to_addr, subject, html_body, reply_to=reply_to, log_tag='feedback'):
        return _resp(500, {'error': 'Send failed', 'code': 'smtp_send'})

    # Адрес получателя наружу не отдаём: раньше любой мог отправить пустую
    # форму и узнать рабочую почту владельца площадки — готовая мишень для
    # спама и подбора пароля.
    return _resp(200, {'success': True, 'test': is_test})