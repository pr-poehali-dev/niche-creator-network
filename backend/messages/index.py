import json
import os
import re
import psycopg2
from crypto_utils import encrypt_field, decrypt_field
import auth_utils
import notify_utils

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

# Базовый список нецензурных корней (RU + EN). Маскируются звёздочками.
BAD_ROOTS = [
    'хуй', 'хуя', 'хуе', 'пизд', 'ебан', 'ебат', 'еба', 'ебл', 'бляд', 'блят',
    'сука', 'сук', 'мудак', 'муда', 'гондон', 'гандон', 'долбоеб', 'залуп',
    'пидор', 'пидар', 'манда', 'дрочи', 'выеб', 'наеб', 'отъеб', 'уеб',
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'asshole', 'bastard', 'whore', 'slut',
]
BAD_RE = re.compile('(' + '|'.join(BAD_ROOTS) + ')', re.IGNORECASE)


def clean_text(text):
    '''Маскирует нецензурные слова звёздочками.'''
    if not text:
        return ''
    def repl(m):
        return m.group(0)[0] + '*' * (len(m.group(0)) - 1)
    return BAD_RE.sub(repl, text)


def esc(v, limit=2000):
    return str(v if v is not None else '').strip()[:limit]


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    '''
    Business: хранилище переписок — профессиональные чаты по категориям и личные
              сообщения между друзьями. Личная переписка доступна только участникам
              и только при подтверждённой дружбе; содержимое шифруется в базе.
              Нецензурная лексика автоматически маскируется.
    Args: event с httpMethod, queryStringParameters, body
    Returns: HTTP-ответ с сообщениями или статусом
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            kind = esc(params.get('kind'), 20)

            if kind == 'chat':
                room = esc(params.get('room'), 40) or 'general'
                cur.execute(
                    f"SELECT author_name, text, created_at FROM {SCHEMA}.chat_messages "
                    f"WHERE room=%s ORDER BY created_at ASC LIMIT 200",
                    (room,),
                )
                msgs = [{'author': r[0], 'text': decrypt_field(r[1]), 'createdAt': r[2].isoformat() if r[2] else None} for r in cur.fetchall()]
                return _resp(200, {'messages': msgs})

            if kind == 'dm':
                pair = esc(params.get('pair'), 160)
                # Личную переписку может читать только её участник, и только
                # пока дружба подтверждена: удалили из друзей — доступ закрыт.
                user = auth_utils.get_auth_user(event)
                if not user or not auth_utils.is_dm_participant(user, pair):
                    return _resp(403, {'error': 'forbidden'})
                if not auth_utils.are_friends(user, pair):
                    return _resp(403, {'error': 'not_friends'})
                cur.execute(
                    f"SELECT from_id, from_name, text, created_at FROM {SCHEMA}.direct_messages "
                    f"WHERE pair_key=%s ORDER BY created_at ASC LIMIT 500",
                    (pair,),
                )
                msgs = [{'fromId': r[0], 'fromName': r[1], 'text': decrypt_field(r[2]), 'createdAt': r[3].isoformat() if r[3] else None} for r in cur.fetchall()]
                # Открыли переписку — входящие считаются прочитанными.
                cur.execute(
                    f"UPDATE {SCHEMA}.direct_messages SET read_at = now() "
                    f"WHERE pair_key = %s AND to_id = %s AND read_at IS NULL",
                    (pair, auth_utils.user_dm_id(user)),
                )
                conn.commit()
                return _resp(200, {'messages': msgs})

            if kind == 'dialogs':
                # Список переписок: собеседник, последнее сообщение и счётчик
                # непрочитанных. Без него новое сообщение легко пропустить —
                # чат открывался только из списка друзей.
                user = auth_utils.get_auth_user(event)
                if not user:
                    return _resp(401, {'error': 'unauthorized'})
                me = auth_utils.user_dm_id(user)
                my_id = user['id']
                # Берём только переписки с подтверждёнными друзьями: расторгли
                # дружбу — диалог исчезает из списка, как и доступ к нему.
                cur.execute(
                    f"SELECT CASE WHEN user_id_a = %s THEN user_id_b ELSE user_id_a END "
                    f"FROM {SCHEMA}.friendships "
                    f"WHERE (user_id_a = %s OR user_id_b = %s) AND status = 'accepted'",
                    (my_id, my_id, my_id),
                )
                friend_ids = [r[0] for r in cur.fetchall()]
                dialogs = []
                for fid in friend_ids:
                    pair_key = f"u{min(my_id, fid)}:u{max(my_id, fid)}"
                    cur.execute(
                        f"SELECT from_id, text, created_at FROM {SCHEMA}.direct_messages "
                        f"WHERE pair_key = %s ORDER BY created_at DESC LIMIT 1",
                        (pair_key,),
                    )
                    last = cur.fetchone()
                    cur.execute(
                        f"SELECT COUNT(*) FROM {SCHEMA}.direct_messages "
                        f"WHERE pair_key = %s AND to_id = %s AND read_at IS NULL",
                        (pair_key, me),
                    )
                    unread = int((cur.fetchone() or [0])[0])
                    # Анкета собеседника — имя и фото для карточки диалога.
                    cur.execute(
                        f"SELECT name_ru, name_en, title_ru, title_en, avatar_url "
                        f"FROM {SCHEMA}.providers WHERE slug = %s",
                        (f'provider-{fid}',),
                    )
                    prov = cur.fetchone()
                    dialogs.append({
                        'userId': fid,
                        'pairKey': pair_key,
                        'name': {'ru': prov[0], 'en': prov[1]} if prov else None,
                        'title': {'ru': prov[2], 'en': prov[3]} if prov else None,
                        'avatar': prov[4] if prov else None,
                        'lastText': decrypt_field(last[1]) if last else '',
                        'lastFromMe': bool(last and last[0] == me),
                        'lastAt': last[2].isoformat() if last and last[2] else None,
                        'unread': unread,
                    })
                # Свежие переписки сверху; диалоги без сообщений — в конце.
                dialogs.sort(key=lambda d: d['lastAt'] or '', reverse=True)
                total_unread = sum(d['unread'] for d in dialogs)
                return _resp(200, {'dialogs': dialogs, 'totalUnread': total_unread})

            return _resp(400, {'error': 'unknown kind'})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 30)

            if action == 'chat_send':
                # Автора определяем ТОЛЬКО по токену сессии. Раньше имя бралось
                # из тела запроса — любой посторонний мог написать в общий чат
                # от имени администратора или чужого специалиста.
                user = auth_utils.get_auth_user(event)
                if not user:
                    return _resp(401, {'error': 'unauthorized'})
                room = esc(body.get('room'), 40) or 'general'
                author_id = auth_utils.user_dm_id(user)
                author_name = esc(user.get('name'), 200)
                text = clean_text(esc(body.get('text'), 2000))
                if not text.strip():
                    return _resp(400, {'error': 'empty'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.chat_messages (room, author_id, author_name, text) "
                    f"VALUES (%s, %s, %s, %s)",
                    (room, author_id, author_name, encrypt_field(text)),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'dm_send':
                pair = esc(body.get('pair'), 160)
                # Отправитель определяется по токену; писать можно только другу.
                user = auth_utils.get_auth_user(event)
                if not user or not auth_utils.is_dm_participant(user, pair):
                    return _resp(403, {'error': 'forbidden'})
                if not auth_utils.are_friends(user, pair):
                    return _resp(403, {'error': 'not_friends'})
                from_id = auth_utils.user_dm_id(user)
                # Имя отправителя тоже из сессии, а не из запроса.
                from_name = esc(user.get('name'), 200)
                to_id = esc(body.get('toId'), 64)
                text = clean_text(esc(body.get('text'), 2000))
                if not pair or not text.strip():
                    return _resp(400, {'error': 'empty'})
                # Личные сообщения шифруются перед записью в БД
                cur.execute(
                    f"INSERT INTO {SCHEMA}.direct_messages (pair_key, from_id, from_name, to_id, text) "
                    f"VALUES (%s, %s, %s, %s, %s)",
                    (pair, from_id, from_name, to_id, encrypt_field(text)),
                )
                # Уведомляем получателя о новом личном сообщении (без текста — приватность).
                recipient_uid = notify_utils.id_from_slug(to_id)
                notify_utils.push(
                    cur, recipient_uid, 'message',
                    'Новое сообщение',
                    f'{from_name or "Пользователь"} написал вам сообщение. Откройте чат, чтобы ответить.',
                    'chat',
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()