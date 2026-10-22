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


def _is_blocked_either(cur, a: int, b: int) -> bool:
    '''Заблокировал ли кто-то из двоих другого.'''
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.user_blocks "
        f"WHERE (blocker_id=%s AND blocked_id=%s) OR (blocker_id=%s AND blocked_id=%s) LIMIT 1",
        (a, b, b, a),
    )
    return cur.fetchone() is not None


def _endorsements(cur, target_id: int, viewer_id: int):
    '''Подтверждённые навыки специалиста: сколько коллег подтвердило каждый
    и подтвердил ли его сам смотрящий.'''
    cur.execute(
        f"SELECT skill, COUNT(*), BOOL_OR(endorser_id = %s) FROM {SCHEMA}.skill_endorsements "
        f"WHERE target_id=%s GROUP BY skill ORDER BY COUNT(*) DESC, skill LIMIT 20",
        (viewer_id, target_id),
    )
    return [{'skill': r[0], 'count': int(r[1]), 'mine': bool(r[2])} for r in cur.fetchall()]


def _skills_of(cur, user_id: int):
    '''Навыки, которые можно подтвердить: услуги из анкеты специалиста
    (то, что он сам заявил), а при их отсутствии — теги анкеты.'''
    cur.execute(f"SELECT services, tags_ru FROM {SCHEMA}.providers WHERE slug=%s", (f"provider-{user_id}",))
    row = cur.fetchone()
    if not row:
        return []
    out = []
    services = row[0] if isinstance(row[0], list) else []
    for item in services:
        key = item.get('key') if isinstance(item, dict) else item
        key = str(key or '').strip()[:80]
        if key and key not in out:
            out.append(key)
    if not out and row[1]:
        for t in str(row[1]).replace(';', ',').split(','):
            t = t.strip()[:80]
            if t and t not in out:
                out.append(t)
    return out[:12]

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
                        # Служебная учётная запись владельца — не участник
                        # сообщества: её нельзя найти и добавить в друзья.
                        f"SELECT id, role, name, public_id FROM {SCHEMA}.users "
                        f"WHERE public_id=%s AND role='provider' AND is_admin = false LIMIT 1",
                        (int(q),),
                    )
                    rows = cur.fetchall()
                if not rows:
                    # База собрана с локалью, где lower() не трогает
                    # кириллицу: lower('Владимир') возвращал 'Владимир', и
                    # поиск коллег по имени на русском не находил никого.
                    # Приводим регистр явно через translate — работает при
                    # любой локали сервера. Для латиницы lower() справляется.
                    like = f'%{q.lower()}%'
                    up = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'
                    lo = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя'
                    def low(col):
                        return f"lower(translate(coalesce({col}, ''), '{up}', '{lo}'))"
                    cols = ['u.name', 'p.name_ru', 'p.name_en', 'p.title_ru', 'p.title_en', 'p.tags_ru', 'p.tags_en']
                    cond = ' OR '.join(f"{low(c)} LIKE %s" for c in cols)
                    cur.execute(
                        f"SELECT u.id, u.role, u.name, u.public_id "
                        f"FROM {SCHEMA}.users u "
                        f"JOIN {SCHEMA}.providers p ON p.slug = 'provider-' || u.id "
                        f"WHERE u.role='provider' AND u.id <> %s AND p.is_demo = false AND u.is_admin = false "
                        f"AND NOT EXISTS (SELECT 1 FROM {SCHEMA}.user_blocks bl "
                        f"  WHERE (bl.blocker_id = %s AND bl.blocked_id = u.id) "
                        f"     OR (bl.blocker_id = u.id AND bl.blocked_id = %s)) "
                        f"AND ({cond}) "
                        f"ORDER BY p.rating DESC NULLS LAST LIMIT 20",
                        (my_id, my_id, my_id) + (like,) * len(cols),
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

            if action == 'suggest':
                # «Возможно, вы знакомы». Главный двигатель роста любой
                # профессиональной сети: человек не знает, кого искать, а
                # список коллег с общими знакомыми или того же профиля
                # даёт ему первые связи в одно касание.
                # Порядок: сначала общие друзья, затем та же специализация
                # и город, затем рейтинг. Друзья, заявки и блокировки —
                # исключены.
                cur.execute(
                    f"WITH mine AS ("
                    f"  SELECT CASE WHEN user_id_a=%s THEN user_id_b ELSE user_id_a END AS fid "
                    f"  FROM {SCHEMA}.friendships WHERE (user_id_a=%s OR user_id_b=%s) AND status='accepted'"
                    f"), me AS ("
                    f"  SELECT title_ru, city_ru FROM {SCHEMA}.providers WHERE slug = 'provider-' || %s"
                    f") "
                    f"SELECT u.id, u.name, u.public_id, "
                    f"  (SELECT COUNT(*) FROM {SCHEMA}.friendships f2 JOIN mine m "
                    f"     ON m.fid = CASE WHEN f2.user_id_a=u.id THEN f2.user_id_b ELSE f2.user_id_a END "
                    f"   WHERE (f2.user_id_a=u.id OR f2.user_id_b=u.id) AND f2.status='accepted') AS mutual, "
                    f"  (p.title_ru = (SELECT title_ru FROM me)) AS same_title, "
                    f"  (p.city_ru = (SELECT city_ru FROM me)) AS same_city "
                    f"FROM {SCHEMA}.users u "
                    f"JOIN {SCHEMA}.providers p ON p.slug = 'provider-' || u.id "
                    f"WHERE u.role='provider' AND u.id <> %s AND p.is_demo = false AND u.is_admin = false "
                    f"AND NOT EXISTS (SELECT 1 FROM {SCHEMA}.friendships f "
                    f"  WHERE f.user_id_a = LEAST(u.id, %s) AND f.user_id_b = GREATEST(u.id, %s) "
                    f"  AND f.status IN ('accepted','pending')) "
                    f"AND NOT EXISTS (SELECT 1 FROM {SCHEMA}.user_blocks bl "
                    f"  WHERE (bl.blocker_id=%s AND bl.blocked_id=u.id) OR (bl.blocker_id=u.id AND bl.blocked_id=%s)) "
                    f"ORDER BY mutual DESC, same_title DESC NULLS LAST, same_city DESC NULLS LAST, p.rating DESC NULLS LAST "
                    f"LIMIT 8",
                    (my_id, my_id, my_id, my_id, my_id, my_id, my_id, my_id, my_id),
                )
                items = []
                for r in cur.fetchall():
                    reason = 'mutual' if r[3] else ('same_title' if r[4] else ('same_city' if r[5] else 'top'))
                    items.append({
                        'userId': r[0], 'publicId': r[2], 'name': r[1],
                        'provider': _provider_info(cur, r[0]),
                        'mutual': int(r[3] or 0), 'reason': reason,
                    })
                return _resp(200, {'suggestions': items})

            if action == 'endorsements':
                try:
                    target_id = int(params.get('userId') or 0)
                except (TypeError, ValueError):
                    target_id = 0
                if not target_id:
                    return _resp(400, {'error': 'userId required'})
                return _resp(200, {
                    'endorsements': _endorsements(cur, target_id, my_id),
                    'skills': _skills_of(cur, target_id),
                })

            if action == 'blocked':
                cur.execute(
                    f"SELECT b.blocked_id, u.name, b.created_at FROM {SCHEMA}.user_blocks b "
                    f"JOIN {SCHEMA}.users u ON u.id = b.blocked_id "
                    f"WHERE b.blocker_id=%s ORDER BY b.created_at DESC LIMIT 200",
                    (my_id,),
                )
                return _resp(200, {'blocked': [
                    {'userId': r[0], 'name': r[1], 'provider': _provider_info(cur, r[0])}
                    for r in cur.fetchall()
                ]})

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
                # Заблокированный не может снова постучаться в друзья — иначе
                # блокировка обходилась бы новой заявкой. Причину не
                # раскрываем: ответ такой же, как у обычного отказа.
                if _is_blocked_either(cur, my_id, target_id):
                    return _resp(403, {'error': 'unavailable'})
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

            if action == 'block':
                # Блокировка — базовая защита в любой соцсети. Для людей,
                # чья работа связана с риском, она важнее вдвойне: давление,
                # угрозы и навязчивые сообщения должны прекращаться одним
                # нажатием. Блокировка разрывает дружбу (а значит, и
                # переписку — писать можно только другу) и прячет человека
                # из поиска и рекомендаций в обе стороны.
                try:
                    target_id = int(body.get('targetUserId') or 0)
                except (TypeError, ValueError):
                    target_id = 0
                if not target_id or target_id == my_id:
                    return _resp(400, {'error': 'invalid targetUserId'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.user_blocks (blocker_id, blocked_id) VALUES (%s, %s) "
                    f"ON CONFLICT (blocker_id, blocked_id) DO NOTHING",
                    (my_id, target_id),
                )
                a, b = _pair(my_id, target_id)
                cur.execute(
                    f"DELETE FROM {SCHEMA}.friendships WHERE user_id_a=%s AND user_id_b=%s",
                    (a, b),
                )
                # Подтверждения навыков от заблокированного тоже снимаем.
                cur.execute(
                    f"DELETE FROM {SCHEMA}.skill_endorsements WHERE endorser_id=%s AND target_id=%s",
                    (target_id, my_id),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'unblock':
                try:
                    target_id = int(body.get('targetUserId') or 0)
                except (TypeError, ValueError):
                    target_id = 0
                cur.execute(
                    f"DELETE FROM {SCHEMA}.user_blocks WHERE blocker_id=%s AND blocked_id=%s",
                    (my_id, target_id),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'endorse':
                # Подтверждение навыка коллегой. Отзыв клиента говорит
                # «работа сделана», подтверждение коллеги — «он это умеет»:
                # для специалиста по безопасности второе весит не меньше.
                # Подтверждать может только друг — иначе навыки накручивались
                # бы ботами и незнакомцами. Повторное нажатие снимает отметку.
                try:
                    target_id = int(body.get('targetUserId') or 0)
                except (TypeError, ValueError):
                    target_id = 0
                skill = esc(body.get('skill'), 80)
                if not target_id or target_id == my_id or not skill:
                    return _resp(400, {'error': 'invalid'})
                a, b = _pair(my_id, target_id)
                cur.execute(
                    f"SELECT 1 FROM {SCHEMA}.friendships WHERE user_id_a=%s AND user_id_b=%s AND status='accepted'",
                    (a, b),
                )
                if not cur.fetchone():
                    return _resp(403, {'error': 'not_friends'})
                if skill not in _skills_of(cur, target_id):
                    return _resp(400, {'error': 'unknown_skill'})
                cur.execute(
                    f"DELETE FROM {SCHEMA}.skill_endorsements WHERE endorser_id=%s AND target_id=%s AND skill=%s",
                    (my_id, target_id, skill),
                )
                removed = cur.rowcount > 0
                if not removed:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.skill_endorsements (endorser_id, target_id, skill) VALUES (%s, %s, %s)",
                        (my_id, target_id, skill),
                    )
                    notify_utils.push(
                        cur, target_id, 'community',
                        'Коллега подтвердил ваш навык',
                        f'Ваш навык «{skill}» подтвердил коллега по сообществу.',
                        'dashboard', email=False,
                    )
                conn.commit()
                return _resp(200, {'success': True, 'endorsed': not removed,
                                   'endorsements': _endorsements(cur, target_id, my_id)})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()
