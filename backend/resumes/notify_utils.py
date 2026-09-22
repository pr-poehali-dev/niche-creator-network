import os

from mail_utils import render_email, send_mail, esc, SITE_URL

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

ALLOWED_TYPES = {'system', 'message', 'terms', 'price', 'task', 'community'}

# Человекочитаемые названия категорий задач (для текста уведомлений).
CATEGORY_LABELS = {
    'physical': 'Физическая безопасность',
    'cyber': 'Кибербезопасность',
    'economic': 'Экономическая безопасность',
    'crisis': 'Антикризис и спецоперации',
}


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
    """Уведомление на почту: единый шаблон из mail_utils.

    Кнопка возврата на сайт обязательна. Без неё человек прочитывал письмо
    и закрывал: чтобы ответить специалисту, нужно было вспомнить адрес и
    зайти самому.

    bulk=True — письмо рассылочного характера, получает заголовки отписки.
    """
    if not to_addr:
        return False
    html = render_email(
        title,
        esc(body),
        button_text='Открыть в кабинете',
        button_url=f'{SITE_URL}/?section=dashboard',
        footer_note=(
            'Вы получили это письмо, потому что включено дублирование '
            'уведомлений на почту. Отключить можно в личном кабинете.'
        ),
        preheader=str(body)[:120],
    )
    return send_mail(
        to_addr,
        f'ЩИТ · {title}',
        html,
        bulk=True,
        log_tag='notify',
    )


def id_from_slug(slug: str):
    '''Извлекает user_id из slug вида provider-123 / client-123.'''
    try:
        return int(str(slug).rsplit('-', 1)[-1])
    except (ValueError, AttributeError):
        return None


def push(cur, user_id, ntype: str, title: str, body: str, link=None, email=True):
    '''Создаёт уведомление пользователю и, если не отключено, дублирует на почту.
    email=False — только в приложении (для массовых рассылок без потока писем).
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
        if email and _email_enabled(cur, user_id):
            addr = _user_email(cur, user_id)
            if addr:
                _send_email(addr, str(title), str(body))
    except Exception as e:
        print(f"[notify] push error: {type(e).__name__}: {e}")