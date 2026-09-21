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


# Вложения: в базе храним только ссылки на файлы, сами файлы лежат в
# хранилище. Принимаем строго свой CDN — иначе через чат можно было бы
# подсунуть ссылку на чужой сервер и собирать IP собеседников.
ALLOWED_URL_PREFIX = 'https://cdn.poehali.dev/'
MAX_ATTACHMENTS = 6


def clean_attachments(raw):
    '''Оставляет только корректные вложения с нашего хранилища.'''
    if not isinstance(raw, list):
        return []
    out = []
    for a in raw[:MAX_ATTACHMENTS]:
        if not isinstance(a, dict):
            continue
        url = esc(a.get('url'), 500)
        if not url.startswith(ALLOWED_URL_PREFIX):
            continue
        kind = 'image' if esc(a.get('type'), 10) == 'image' else 'file'
        try:
            size = max(0, min(int(a.get('size') or 0), 50 * 1024 * 1024))
        except (TypeError, ValueError):
            size = 0
        out.append({
            'type': kind,
            'url': url,
            'name': esc(a.get('name'), 80),
            'ext': esc(a.get('ext'), 8),
            'size': size,
        })
    return out


def clean_geo(body):
    '''
    Координаты из запроса. Возвращает (lat, lon, label) строками —
    пустые, если точки нет или значения вне допустимого диапазона.
    '''
    try:
        lat = float(body.get('geoLat'))
        lon = float(body.get('geoLon'))
    except (TypeError, ValueError):
        return '', '', ''
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return '', '', ''
    return f'{lat:.6f}', f'{lon:.6f}', clean_text(esc(body.get('geoLabel'), 200))


def _preview(last):
    '''
    Короткое описание последнего сообщения для списка диалогов.
    Сообщение из одного фото раньше выглядело как пустая строка —
    казалось, что собеседник прислал пустоту.
    '''
    if not last:
        return ''
    if last[5] is not None:
        return 'Сообщение удалено'
    text = decrypt_field(last[1] or '')
    if text.strip():
        return text
    try:
        atts = json.loads(last[3] or '[]')
    except (ValueError, TypeError):
        atts = []
    if atts:
        return 'Фото' if atts[0].get('type') == 'image' else 'Файл'
    if last[4]:
        return 'Геолокация'
    return ''


def load_reactions(cur, scope, ids):
    '''Реакции для списка сообщений: {message_id: {emoji: [user_id, ...]}}.'''
    if not ids:
        return {}
    cur.execute(
        f"SELECT message_id, emoji, user_id FROM {SCHEMA}.message_reactions "
        f"WHERE scope = %s AND message_id = ANY(%s)",
        (scope, list(ids)),
    )
    res = {}
    for mid, emoji, uid in cur.fetchall():
        res.setdefault(mid, {}).setdefault(emoji, []).append(uid)
    return res


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
                    f"SELECT id, author_name, text, created_at, attachments, "
                    f"geo_lat, geo_lon, geo_label, author_id, removed_at, edited_at "
                    f"FROM {SCHEMA}.chat_messages "
                    f"WHERE room=%s ORDER BY created_at ASC LIMIT 200",
                    (room,),
                )
                rows = cur.fetchall()
                reactions = load_reactions(cur, 'chat', [r[0] for r in rows])
                msgs = []
                for r in rows:
                    removed = r[9] is not None
                    msgs.append({
                        'id': r[0],
                        'author': r[1],
                        'authorId': r[8],
                        'text': '' if removed else decrypt_field(r[2]),
                        'createdAt': r[3].isoformat() if r[3] else None,
                        'attachments': [] if removed else json.loads(r[4] or '[]'),
                        'geo': None if (removed or not r[5]) else {
                            'lat': float(decrypt_field(r[5])), 'lon': float(decrypt_field(r[6])),
                            'label': decrypt_field(r[7]),
                        },
                        'removed': removed,
                        'edited': r[10] is not None,
                        'reactions': reactions.get(r[0], {}),
                    })
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
                    f"SELECT from_id, from_name, text, created_at, id, attachments, "
                    f"geo_lat, geo_lon, geo_label, reply_to, removed_at, edited_at, read_at "
                    f"FROM {SCHEMA}.direct_messages "
                    f"WHERE pair_key=%s ORDER BY created_at ASC LIMIT 500",
                    (pair,),
                )
                rows = cur.fetchall()
                reactions = load_reactions(cur, 'dm', [r[4] for r in rows])
                # Текст цитируемых сообщений — чтобы показать ответ «на что».
                quoted = {}
                reply_ids = [r[9] for r in rows if r[9]]
                if reply_ids:
                    cur.execute(
                        f"SELECT id, from_name, text FROM {SCHEMA}.direct_messages WHERE id = ANY(%s)",
                        (reply_ids,),
                    )
                    for qid, qname, qtext in cur.fetchall():
                        quoted[qid] = {'name': qname, 'text': decrypt_field(qtext)[:120]}
                msgs = []
                for r in rows:
                    removed = r[10] is not None
                    msgs.append({
                        'id': r[4],
                        'fromId': r[0],
                        'fromName': r[1],
                        'text': '' if removed else decrypt_field(r[2]),
                        'createdAt': r[3].isoformat() if r[3] else None,
                        'attachments': [] if removed else json.loads(r[5] or '[]'),
                        'geo': None if (removed or not r[6]) else {
                            'lat': float(decrypt_field(r[6])), 'lon': float(decrypt_field(r[7])),
                            'label': decrypt_field(r[8]),
                        },
                        'replyTo': quoted.get(r[9]) if r[9] else None,
                        'removed': removed,
                        'edited': r[11] is not None,
                        'readAt': r[12].isoformat() if r[12] else None,
                        'reactions': reactions.get(r[4], {}),
                    })
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
                        f"SELECT from_id, text, created_at, attachments, geo_lat, removed_at "
                        f"FROM {SCHEMA}.direct_messages "
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
                        # В списке диалогов вместо пустоты показываем, что
                        # пришло: «Фото», «Файл» или «Геолокация».
                        'lastText': _preview(last),
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
                atts = clean_attachments(body.get('attachments'))
                lat, lon, label = clean_geo(body)
                # Сообщение может быть без текста — если это фото или точка
                # на карте. Пустым считается только то, где нет ничего.
                if not text.strip() and not atts and not lat:
                    return _resp(400, {'error': 'empty'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.chat_messages "
                    f"(room, author_id, author_name, text, attachments, geo_lat, geo_lon, geo_label) "
                    f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (room, author_id, author_name, encrypt_field(text),
                     json.dumps(atts, ensure_ascii=False),
                     encrypt_field(lat), encrypt_field(lon), encrypt_field(label)),
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
                atts = clean_attachments(body.get('attachments'))
                lat, lon, label = clean_geo(body)
                try:
                    reply_to = int(body.get('replyTo')) if body.get('replyTo') else None
                except (TypeError, ValueError):
                    reply_to = None
                # Фото или точка на карте — полноценное сообщение и без текста.
                if not pair or (not text.strip() and not atts and not lat):
                    return _resp(400, {'error': 'empty'})
                # Ответить можно только на сообщение из этого же диалога.
                if reply_to is not None:
                    cur.execute(
                        f"SELECT 1 FROM {SCHEMA}.direct_messages WHERE id = %s AND pair_key = %s",
                        (reply_to, pair),
                    )
                    if not cur.fetchone():
                        reply_to = None
                # Личные сообщения и координаты шифруются перед записью в БД
                cur.execute(
                    f"INSERT INTO {SCHEMA}.direct_messages "
                    f"(pair_key, from_id, from_name, to_id, text, attachments, "
                    f"geo_lat, geo_lon, geo_label, reply_to) "
                    f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (pair, from_id, from_name, to_id, encrypt_field(text),
                     json.dumps(atts, ensure_ascii=False),
                     encrypt_field(lat), encrypt_field(lon), encrypt_field(label), reply_to),
                )
                # Уведомляем получателя о новом личном сообщении (без текста — приватность).
                recipient_uid = notify_utils.id_from_slug(to_id)
                # Что именно пришло — видно из уведомления, но без содержимого
                # переписки: сам текст остаётся только внутри чата.
                if atts and not text.strip():
                    what = 'прислал фото' if atts[0]['type'] == 'image' else 'прислал файл'
                elif lat and not text.strip():
                    what = 'отправил геолокацию'
                else:
                    what = 'написал вам сообщение'
                notify_utils.push(
                    cur, recipient_uid, 'message',
                    'Новое сообщение',
                    f'{from_name or "Пользователь"} {what}. Откройте чат, чтобы ответить.',
                    'chat',
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'react':
                # Реакция смайликом. Повторное нажатие снимает свою реакцию —
                # так же, как это работает в привычных мессенджерах.
                user = auth_utils.get_auth_user(event)
                if not user:
                    return _resp(401, {'error': 'unauthorized'})
                scope = 'chat' if esc(body.get('scope'), 8) == 'chat' else 'dm'
                try:
                    msg_id = int(body.get('messageId'))
                except (TypeError, ValueError):
                    return _resp(400, {'error': 'bad_message'})
                emoji = esc(body.get('emoji'), 16)
                if not emoji:
                    return _resp(400, {'error': 'bad_emoji'})

                # Ставить реакцию можно только в своей переписке.
                if scope == 'dm':
                    cur.execute(
                        f"SELECT pair_key FROM {SCHEMA}.direct_messages WHERE id = %s", (msg_id,)
                    )
                    row = cur.fetchone()
                    if not row or not auth_utils.is_dm_participant(user, row[0]):
                        return _resp(403, {'error': 'forbidden'})

                cur.execute(
                    f"SELECT id FROM {SCHEMA}.message_reactions "
                    f"WHERE scope=%s AND message_id=%s AND user_id=%s AND emoji=%s",
                    (scope, msg_id, user['id'], emoji),
                )
                existing = cur.fetchone()
                if existing:
                    cur.execute(
                        f"DELETE FROM {SCHEMA}.message_reactions WHERE id = %s", (existing[0],)
                    )
                    conn.commit()
                    return _resp(200, {'success': True, 'active': False})

                cur.execute(
                    f"INSERT INTO {SCHEMA}.message_reactions (scope, message_id, user_id, emoji) "
                    f"VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING",
                    (scope, msg_id, user['id'], emoji),
                )
                conn.commit()
                return _resp(200, {'success': True, 'active': True})

            if action == 'remove':
                # Удаление своего сообщения. Текст и вложения перестают
                # отдаваться, но строка остаётся — так переписку нельзя
                # переписать задним числом, а спорную ситуацию можно разобрать.
                user = auth_utils.get_auth_user(event)
                if not user:
                    return _resp(401, {'error': 'unauthorized'})
                try:
                    msg_id = int(body.get('messageId'))
                except (TypeError, ValueError):
                    return _resp(400, {'error': 'bad_message'})
                me = auth_utils.user_dm_id(user)
                table = 'chat_messages' if esc(body.get('scope'), 8) == 'chat' else 'direct_messages'
                owner_col = 'author_id' if table == 'chat_messages' else 'from_id'
                cur.execute(
                    f"UPDATE {SCHEMA}.{table} SET removed_at = now(), text = '', attachments = '[]', "
                    f"geo_lat = '', geo_lon = '', geo_label = '' "
                    f"WHERE id = %s AND {owner_col} = %s AND removed_at IS NULL",
                    (msg_id, me),
                )
                changed = cur.rowcount
                conn.commit()
                if not changed:
                    return _resp(403, {'error': 'forbidden'})
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()