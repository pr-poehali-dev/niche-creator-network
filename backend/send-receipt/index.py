import json
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def handler(event: dict, context) -> dict:
    '''
    Business: отправляет чек об оплате тарифа на email исполнителя.
    Args: event с httpMethod, body (JSON: email, plan, amount, date, payer, receiptNo, period, method, lang)
    Returns: HTTP-ответ со статусом отправки
    '''
    method = event.get('httpMethod', 'POST')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    email = (body.get('email') or '').strip()
    if not email or '@' not in email:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Invalid email'})}

    lang = body.get('lang', 'ru')
    receipt_no = body.get('receiptNo', '')
    date = body.get('date', '')
    plan = body.get('plan', '')
    period = body.get('period', '')
    amount = body.get('amount', '')
    payer = body.get('payer', '')
    pay_method = body.get('method', '')

    if lang == 'en':
        subject = f'SecureNet — Payment receipt {receipt_no}'
        labels = {
            'title': 'Payment receipt', 'company': 'SecureNet LLC',
            'req': 'VAT 7701234567 · 1 Tverskaya St., Moscow, 125009',
            'no': 'Receipt No.', 'date': 'Payment date', 'payer': 'Payer',
            'service': 'Payment purpose', 'serviceVal': 'Membership fee (plan)',
            'plan': 'Plan', 'period': 'Period', 'method': 'Payment method',
            'total': 'Total paid', 'note': 'This document is generated automatically and requires no signature or seal.',
        }
    else:
        subject = f'SecureNet — Чек об оплате {receipt_no}'
        labels = {
            'title': 'Чек об оплате', 'company': 'ООО «СекьюрНет»',
            'req': 'ИНН 7701234567 · 125009, Москва, ул. Тверская, д. 1',
            'no': 'Чек №', 'date': 'Дата оплаты', 'payer': 'Плательщик',
            'service': 'Назначение платежа', 'serviceVal': 'Членский взнос (тариф)',
            'plan': 'Тариф', 'period': 'Период', 'method': 'Способ оплаты',
            'total': 'Итого оплачено', 'note': 'Документ сформирован автоматически и не требует подписи и печати.',
        }

    def row(k, v):
        return (
            f'<tr><td style="padding:11px 0;border-bottom:1px solid #eef0f3;color:#6b7280;font-size:14px;">{k}</td>'
            f'<td style="padding:11px 0;border-bottom:1px solid #eef0f3;font-weight:600;text-align:right;font-size:14px;">{v}</td></tr>'
        )

    html = f'''<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1a1d24;">
<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e4e6eb;border-radius:10px;overflow:hidden;">
  <div style="padding:26px 30px;background:#1a1d24;color:#fff;">
    <div style="font-weight:800;font-size:20px;">SECURE<span style="color:#d4af37;">NET</span></div>
    <div style="font-size:11px;opacity:.65;margin-top:6px;">{labels['company']}<br/>{labels['req']}</div>
    <div style="margin-top:14px;font-size:15px;font-weight:700;">{labels['title']}</div>
    <div style="font-size:12px;color:#d4af37;margin-top:3px;">{labels['no']}{receipt_no}</div>
  </div>
  <div style="padding:24px 30px;">
    <table style="width:100%;border-collapse:collapse;">
      {row(labels['date'], date)}
      {row(labels['payer'], payer)}
      {row(labels['service'], labels['serviceVal'])}
      {row(labels['plan'], plan)}
      {row(labels['period'], period)}
      {row(labels['method'], pay_method)}
    </table>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding:16px 20px;background:#faf7ec;border:1px solid #ecdfb0;border-radius:8px;">
      <span style="font-size:14px;color:#6b7280;">{labels['total']}</span>
      <span style="font-size:24px;font-weight:800;color:#b8901f;">{amount}</span>
    </div>
    <div style="margin-top:20px;font-size:11px;color:#9aa0ab;line-height:1.5;">{labels['note']}</div>
  </div>
</div></body></html>'''

    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')

    if not all([smtp_host, smtp_user, smtp_password]):
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'SMTP is not configured'})}

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = smtp_user
    msg['To'] = email
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    if smtp_port == 465:
        server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20)
    else:
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=20)
        server.starttls()
    server.login(smtp_user, smtp_password)
    server.sendmail(smtp_user, [email], msg.as_string())
    server.quit()

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'sent_to': email})}
