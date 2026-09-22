"""
Единый движок писем платформы ЩИТ.

Зачем модуль появился: отправка была разбросана по девяти функциям, SMTP-код
скопирован почти дословно, а вёрстка у писем разошлась — где-то тёмная шапка
с золотой надписью, где-то светлая, у кода подтверждения одна типографика,
у уведомления другая. Любая правка шаблона означала девять одинаковых
правок и девять шансов ошибиться.

Здесь собрано всё, что касается письма: соединение с почтовым сервером,
вёрстка и заголовки, влияющие на доставляемость.

Что чинит модуль по части «письмо дошло, а не попало в спам»:

1. Текстовая версия. Раньше уходил только HTML. Письмо без текстовой
   альтернативы спам-фильтры считают подозрительным, а в консольных
   почтовиках и у незрячих пользователей оно превращалось в пустоту.
   Теперь каждое письмо multipart/alternative: текст + HTML.

2. Человеческое имя отправителя. В поле From стоял голый адрес робота —
   в списке писем это выглядело как «shieldpspl@yandex.ru», а не «ЩИТ».
   Теперь отображается имя, адрес остаётся тем же.

3. List-Unsubscribe. Для рассылочных писем (уведомления, дайджесты,
   напоминания) почтовые службы ждут заголовок с отпиской. Без него
   письма от отправителя постепенно скатываются в спам — даже те, что
   человек ждёт. Транзакционные письма (коды входа, чеки) его не получают:
   там отписка неуместна и сама по себе выглядит странно.

4. Message-ID и Date. Письма без корректного Message-ID часть серверов
   помечает как сомнительные.

5. Тайм-аут и обработка ошибок. Почтовый сервер не должен ронять операцию:
   если письмо не ушло, человек всё равно зарегистрировался и оплатил.

Чего модуль НЕ делает и не может сделать: SPF, DKIM и DMARC настраиваются
в DNS домена, а не в коде. Без них письма всё равно будут уходить в спам у
части получателей. Это задача для владельца домена.
"""

import os
import re
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr, formatdate, make_msgid

SITE_URL = 'https://shieldpspl.ru'
BRAND_NAME = 'ЩИТ'

# Фирменные цвета. Держим рядом с шаблоном: письмо должно узнаваться как
# продолжение сайта, а не выглядеть чужим.
GOLD = '#d4af37'
GOLD_DARK = '#b8901f'
INK = '#1a1d24'
TEXT = '#3d434f'
MUTED = '#8b919c'
LINE = '#e4e6eb'
PAPER = '#ffffff'
BACKDROP = '#f4f5f7'


def _smtp_config():
    """Настройки почты. Возвращает None, если почта не настроена —
    тогда отправка молча пропускается, а не падает с ошибкой."""
    host = os.environ.get('SMTP_HOST')
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD')
    if not all([host, user, password]):
        return None
    try:
        port = int(os.environ.get('SMTP_PORT', '465'))
    except (TypeError, ValueError):
        port = 465
    return {'host': host, 'port': port, 'user': user, 'password': password}


def html_to_text(html: str) -> str:
    """Простая текстовая версия из HTML.

    Не полноценный конвертер — задача скромнее: дать спам-фильтру и
    текстовому почтовику осмысленное содержимое вместо пустоты. Ссылки
    раскрываем, чтобы в тексте осталась кнопка перехода.
    """
    text = re.sub(r'<br\s*/?>', '\n', html, flags=re.I)
    # Ячейки таблицы разделяем пробелом, иначе в тексте ключ слипается со
    # значением: «УстройствоChrome · Windows».
    text = re.sub(r'</t[dh]>', ' ', text, flags=re.I)
    text = re.sub(r'</(p|div|tr|h1|h2|h3|table)>', '\n', text, flags=re.I)
    # Ссылку показываем как «текст: адрес» — иначе в тексте остаётся
    # слово «Открыть в кабинете» без самого адреса.
    text = re.sub(
        r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
        lambda m: f'{re.sub(r"<[^>]+>", "", m.group(2)).strip()}: {m.group(1)}',
        text,
        flags=re.I | re.S,
    )
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&')
    text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"')
    text = re.sub(r'\n{3,}', '\n\n', text)
    return '\n'.join(line.strip() for line in text.split('\n')).strip()


def esc(value) -> str:
    """Экранирование пользовательских данных в письме.

    Имя, текст отзыва или название услуги приходят от людей. Без
    экранирования чужая угловая скобка ломает вёрстку письма, а в худшем
    случае превращает письмо в инструмент подмены содержимого.
    """
    if value is None:
        return ''
    return (
        str(value)
        .replace('&', '&amp;')
        .replace('<', '&lt;')
        .replace('>', '&gt;')
        .replace('"', '&quot;')
    )


def render_email(
    title: str,
    body_html: str,
    *,
    button_text: str = '',
    button_url: str = '',
    footer_note: str = '',
    preheader: str = '',
    lang: str = 'ru',
) -> str:
    """Единый каркас письма.

    Вёрстка на таблицах — не архаизм, а требование почтовых клиентов:
    Outlook рендерит письма движком Word и игнорирует современную вёрстку.
    Ширина 560px помещается в область просмотра большинства почтовиков.

    preheader — строка, которую почтовый клиент показывает в списке писем
    после темы. Без неё туда попадает начало служебного текста вроде
    «Открыть в кабинете» — выглядит неряшливо и не помогает понять суть.
    """
    year = datetime.now(timezone.utc).year
    is_en = lang == 'en'

    button_html = ''
    if button_text and button_url:
        # Кнопка тоже таблицей: <a> с padding в Outlook разъезжается.
        button_html = f'''
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px;">
        <tr><td style="border-radius:6px;background:{GOLD};">
          <a href="{button_url}" style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:{INK};text-decoration:none;border-radius:6px;">{esc(button_text)}</a>
        </td></tr>
      </table>'''

    footer_html = ''
    if footer_note:
        footer_html = f'<div style="margin-top:22px;padding-top:18px;border-top:1px solid {LINE};font-size:12px;line-height:1.6;color:{MUTED};">{footer_note}</div>'

    rights = 'All rights reserved.' if is_en else 'Все права защищены.'
    preheader_html = ''
    if preheader:
        # Прячем строку: она нужна только списку писем, в теле не видна.
        preheader_html = (
            f'<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{esc(preheader)}</div>'
        )

    return f'''<!DOCTYPE html>
<html lang="{lang}"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:{BACKDROP};">
{preheader_html}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:{BACKDROP};padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:{PAPER};border:1px solid {LINE};border-radius:10px;overflow:hidden;">
    <tr><td style="padding:22px 30px;background:{INK};">
      <a href="{SITE_URL}" style="font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:19px;letter-spacing:0.18em;color:{PAPER};text-decoration:none;">Щ<span style="color:{GOLD};">ИТ</span></a>
    </td></tr>
    <tr><td style="padding:28px 30px;font-family:Arial,Helvetica,sans-serif;">
      <h1 style="margin:0 0 14px;font-size:18px;line-height:1.35;font-weight:bold;color:{INK};">{esc(title)}</h1>
      <div style="font-size:14px;line-height:1.65;color:{TEXT};">{body_html}</div>
      {button_html}
      {footer_html}
    </td></tr>
    <tr><td style="padding:16px 30px;background:#fafbfc;border-top:1px solid {LINE};font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:{MUTED};">
      © {year} {BRAND_NAME}. {rights}<br>
      <a href="{SITE_URL}" style="color:{MUTED};text-decoration:underline;">shieldpspl.ru</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>'''


def render_code_email(title: str, code: str, note: str, lang: str = 'ru') -> str:
    """Письмо с кодом подтверждения.

    Код — единственное, ради чего письмо открывают, поэтому он крупный и
    выделен. Код дублируется в preheader: в списке писем он виден сразу,
    и на телефоне его часто достаточно, чтобы не открывать письмо вовсе.
    """
    # Разрядку даём межбуквенным интервалом, а не пробелами внутри строки:
    # так цифры читаются раздельно, но копируются одним куском. С пробелами
    # человек копировал «4 8 2 9 1 3», и поле ввода кода его не принимало.
    body = f'''
      <div style="margin:18px 0;padding:18px;text-align:center;background:#faf7ec;border:1px solid #ecdfb0;border-radius:8px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:34px;font-weight:bold;letter-spacing:6px;color:{GOLD_DARK};">{esc(code)}</div>
      </div>
      <div style="font-size:13px;line-height:1.6;color:{MUTED};">{note}</div>'''
    return render_email(title, body, lang=lang, preheader=f'{code} — {title}')


def render_table_email(
    title: str,
    intro: str,
    rows: list,
    note: str = '',
    *,
    button_text: str = '',
    button_url: str = '',
    lang: str = 'ru',
) -> str:
    """Письмо со сводкой «ключ — значение»: вход с нового устройства,
    смена пароля, детали платежа."""
    rows_html = ''.join(
        f'<tr>'
        f'<td style="padding:9px 0;font-size:13px;color:{MUTED};border-bottom:1px solid {LINE};">{esc(k)}</td>'
        f'<td style="padding:9px 0;font-size:13px;font-weight:bold;color:{INK};text-align:right;border-bottom:1px solid {LINE};">{esc(v)}</td>'
        f'</tr>'
        for k, v in rows
    )
    body = f'''
      <div style="margin-bottom:16px;">{intro}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">{rows_html}</table>'''
    return render_email(
        title,
        body,
        button_text=button_text,
        button_url=button_url,
        footer_note=note,
        preheader=intro,
        lang=lang,
    )


def send_mail(
    to_addr: str,
    subject: str,
    html: str,
    *,
    reply_to: str = '',
    bulk: bool = False,
    timeout: int = 20,
    log_tag: str = 'mail',
) -> bool:
    """Отправляет письмо. Никогда не бросает исключение наружу.

    bulk=True — письмо рассылочного характера (уведомление, дайджест,
    напоминание о подписке). Такие письма получают заголовки отписки и
    пометку Precedence: bulk — это то, чего почтовые службы ждут от
    массовых отправок. Транзакционные письма (код входа, чек об оплате)
    отправляются без них.
    """
    cfg = _smtp_config()
    if not cfg or not to_addr:
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    # Имя отправителя вместо голого адреса: в списке писем видно «ЩИТ».
    msg['From'] = formataddr((BRAND_NAME, cfg['user']))
    msg['To'] = to_addr
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid(domain='shieldpspl.ru')
    if reply_to:
        msg['Reply-To'] = reply_to

    if bulk:
        # Отписка одним нажатием: почтовые клиенты показывают кнопку рядом
        # с темой. Человеку это проще, чем искать настройки, а отправителю
        # выгоднее — отписка не портит репутацию, а жалоба на спам портит.
        msg['List-Unsubscribe'] = f'<{SITE_URL}/?section=dashboard&unsubscribe=1>'
        msg['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
        msg['Precedence'] = 'bulk'
        msg['Auto-Submitted'] = 'auto-generated'

    # Порядок важен: почтовый клиент показывает последнюю подходящую часть,
    # поэтому текст идёт первым, а HTML — вторым.
    msg.attach(MIMEText(html_to_text(html), 'plain', 'utf-8'))
    msg.attach(MIMEText(html, 'html', 'utf-8'))

    try:
        if cfg['port'] == 465:
            server = smtplib.SMTP_SSL(cfg['host'], cfg['port'], timeout=timeout)
        else:
            server = smtplib.SMTP(cfg['host'], cfg['port'], timeout=timeout)
            server.starttls()
        try:
            server.login(cfg['user'], cfg['password'])
            server.sendmail(cfg['user'], [to_addr], msg.as_string())
        finally:
            try:
                server.quit()
            except Exception:
                pass
        return True
    except Exception as e:
        # Письмо не должно ронять основную операцию: регистрация прошла,
        # платёж принят — даже если почтовый сервер недоступен.
        print(f'[{log_tag}] SMTP ERROR: {type(e).__name__}: {e}')
        return False