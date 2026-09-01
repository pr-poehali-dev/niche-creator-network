import json
import os
import psycopg2
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


def esc(v, limit=200):
    return str(v if v is not None else '').strip()[:limit]


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _pair(a: int, b: int):
    '''Возвращает (user_id_a, user_id_b) в отсортированном порядке — так, как хранится в БД.'''
    return (a, b) if a < b else (b, a)


def _provider_info(cur, user_id: int):
    '''Данные исполнителя (для карточки в поиске/списке друзей) по его user_id.'''
    slug = f"provider-{user_id}"
    cur.execute(
        f"SELECT name_ru, name_en, title_ru, title_en, avatar_url, rating, verified "
        f"FROM {SCHEMA}.providers WHERE slug=%s",
        (slug,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {
        'slug': slug,
        'name': {'ru': row[0], 'en': row[1]},
        'title': {'ru': row[2], 'en': row[3]},
        'avatar': row[4],
        'rating': float(row[5]) if row[5] is not None else 0,
        'verified': bool(row[6]),
    }


def handler(event: dict, context) -> dict:
    '''
    Business: система «друзей» между исполнителями — поиск участника по уникальному
              публичному ID, отправка/принятие/отклонение заявок в друзья, список друзей.
              Личный чат между друзьями использует существующий DM-механизм (backend messages),
              pair_key формируется как "u{minId}:u{maxId}".
    Args: event с httpMethod, queryStringParameters (action=search: publicId; action=list — без параметров),
          body (action=request: targetPublicId; action=accept/decline/remove: requestId или friendUserId)
    Returns: HTTP-ответ с результатом поиска, списком друзей/заявок или статусом операции
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    user = auth_utils.get_auth_user(event)
    if not user:
        return _resp(401, {'error': 'unauthorized'})
    my_id = user['id']

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = esc(params.get('action'), 20) or 'list'

            if action == 'search':
                # Поиск коллег: по числовому ID, имени или специализации.
                # Ищем ТОЛЬКО среди исполнителей — это профессиональное
                # сообщество, клиентов в нём быть не должно.
                q = esc(params.get('q'), 80) or esc(params.get('publicId'), 80)
                if len(q) < 2:
                    return _resp(200, {'results': []})
                rows = []
                if q.isdigit():
                    cur.execute(
                        f"SELECT id, role, name, public_id FROM {SCHEMA}.users "
                        f"WHERE public_id=%s AND role='provider' LIMIT 1",
                        (int(q),),
                    )
                    rows = cur.fetchall()
                if not rows:
                    like = f'%{q.lower()}%'
                    # Совпадение по имени специалиста, должности или тегам анкеты.
                    cur.execute(
                        f"SELECT u.id, u.role, u.name, u.public_id "
                        f"FROM {SCHEMA}.users u "
                        f"JOIN {SCHEMA}.providers p ON p.slug = 'provider-' || u.id "
                        f"WHERE u.role='provider' AND u.id <> %s AND p.is_demo = false AND p.active = true "
                        f"AND (lower(u.name) LIKE %s OR lower(p.name_ru) LIKE %s OR lower(p.name_en) LIKE %s "
                        f"OR lower(p.title_ru) LIKE %s OR lower(p.title_en) LIKE %s "
                        f"OR lower(p.tags_ru) LIKE %s OR lower(p.tags_en) LIKE %s) "
                        f"ORDER BY p.rating DESC NULLS LAST LIMIT 20",
                        (my_id, like, like, like, like, like, like, like),
                    )
                    rows = cur.fetchall()

                results = []
                for r in rows:
                    found_id, role, name, pub = r[0], r[1], r[2], r[3]
                    if found_id == my_id:
                        continue
                    a, b = _pair(my_id, found_id)
                    cur.execute(
                        f"SELECT status, requested_by FROM {SCHEMA}.friendships "
                        f"WHERE user_id_a=%s AND user_id_b=%s",
                        (a, b),
                    )
                    fr = cur.fetchone()
                    status = fr[0] if fr else 'none'
                    # Кто отправил заявку — нужно, чтобы показать «принять»
                    # вместо «ожидает» тому, кому она пришла.
                    incoming = bool(fr and fr[0] == 'pending' and fr[1] != my_id)
                    results.append({
                        'userId': found_id, 'publicId': pub, 'role': role, 'name': name,
                        'provider': _provider_info(cur, found_id),
                        'friendStatus': status, 'incoming': incoming,
                    })
                return _resp(200, {'results': results})

            if action == 'requests':
                # Входящие заявки в друзья (кто-то отправил мне, ожидают моего решения).
                cur.execute(
                    f"SELECT id, user_id_a, user_id_b, requested_by, created_at FROM {SCHEMA}.friendships "
                    f"WHERE (user_id_a=%s OR user_id_b=%s) AND status='pending' AND requested_by<>%s "
                    f"ORDER BY created_at DESC LIMIT 100",
                    (my_id, my_id, my_id),
                )
                items = []
                for r in cur.fetchall():
                    other_id = r[2] if r[1] == my_id else r[1]
                    prov = _provider_info(cur, other_id)
                    items.append({
                        'requestId': r[0], 'userId': other_id,
                        'provider': prov, 'createdAt': r[4].isoformat() if r[4] else None,
                    })
                return _resp(200, {'requests': items})

            # default: список принятых друзей
            cur.execute(
                f"SELECT id, user_id_a, user_id_b FROM {SCHEMA}.friendships "
                f"WHERE (user_id_a=%s OR user_id_b=%s) AND status='accepted' "
                f"ORDER BY responded_at DESC LIMIT 200",
                (my_id, my_id),
            )
            items = []
            for r in cur.fetchall():
                other_id = r[2] if r[1] == my_id else r[1]
                prov = _provider_info(cur, other_id)
                pair_key = f"u{min(my_id, other_id)}:u{max(my_id, other_id)}"
                items.append({'friendshipId': r[0], 'userId': other_id, 'provider': prov, 'pairKey': pair_key})
            return _resp(200, {'friends': items})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 20)

            if action == 'request':
                try:
                    target_id = int(body.get('targetUserId') or 0)
                except (TypeError, ValueError):
                    target_id = 0
                if not target_id or target_id == my_id:
                    return _resp(400, {'error': 'invalid targetUserId'})
                a, b = _pair(my_id, target_id)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.friendships (user_id_a, user_id_b, status, requested_by) "
                    f"VALUES (%s, %s, 'pending', %s) "
                    f"ON CONFLICT (user_id_a, user_id_b) DO NOTHING",
                    (a, b, my_id),
                )
                if cur.rowcount == 0:
                    conn.rollback()
                    return _resp(409, {'error': 'friendship already exists'})
                notify_utils.push(
                    cur, target_id, 'community',
                    'Новая заявка в друзья',
                    'Другой специалист хочет добавить вас в друзья. Посмотрите заявку в личном кабинете.',
                    'dashboard',
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'accept' or action == 'decline':
                try:
                    request_id = int(body.get('requestId') or 0)
                except (TypeError, ValueError):
                    request_id = 0
                if not request_id:
                    return _resp(400, {'error': 'requestId required'})
                cur.execute(
                    f"SELECT user_id_a, user_id_b, requested_by FROM {SCHEMA}.friendships WHERE id=%s",
                    (request_id,),
                )
                row = cur.fetchone()
                if not row:
                    return _resp(404, {'error': 'not found'})
                ua, ub, requested_by = row
                if my_id not in (ua, ub) or requested_by == my_id:
                    return _resp(403, {'error': 'forbidden'})
                new_status = 'accepted' if action == 'accept' else 'declined'
                cur.execute(
                    f"UPDATE {SCHEMA}.friendships SET status=%s, responded_at=now() WHERE id=%s",
                    (new_status, request_id),
                )
                if new_status == 'accepted':
                    notify_utils.push(
                        cur, requested_by, 'community',
                        'Заявка в друзья принята',
                        'Специалист принял вашу заявку в друзья. Теперь вы можете переписываться.',
                        'dashboard',
                    )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'remove':
                try:
                    friend_user_id = int(body.get('friendUserId') or 0)
                except (TypeError, ValueError):
                    friend_user_id = 0
                if not friend_user_id:
                    return _resp(400, {'error': 'friendUserId required'})
                a, b = _pair(my_id, friend_user_id)
                cur.execute(
                    f"DELETE FROM {SCHEMA}.friendships WHERE user_id_a=%s AND user_id_b=%s",
                    (a, b),
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()