import json
import os
import re
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

ALLOWED_CATEGORIES = {
    'physical', 'cyber', 'economic', 'crisis', ''
}


def esc(v, limit=200):
    return str(v if v is not None else '').strip()[:limit]


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    '''
    Business: заявки клиентов и отклики исполнителей. Клиент создаёт заявку по категории,
              она доступна всем исполнителям этой категории. Исполнители откликаются,
              клиент выбирает исполнителя.
    Args: event с httpMethod, body/queryStringParameters
    Returns: HTTP-ответ со списком заявок/откликов или статусом операции
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    # Все операции требуют авторизации. Личность (клиент/исполнитель) — из токена.
    user = auth_utils.get_auth_user(event)
    if not user:
        return _resp(401, {'error': 'unauthorized'})

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            view = esc(params.get('view'), 20)

            if view == 'provider':
                slug = auth_utils.provider_slug(user)
                category = esc(params.get('category'), 40)
                if category and category in ALLOWED_CATEGORIES:
                    cur.execute(
                        f"SELECT r.id, r.client_name, r.category, r.service, r.description, r.budget, r.city, r.created_at, "
                        f"rr.id, rr.message, rr.price, rr.status "
                        f"FROM {SCHEMA}.client_requests r "
                        f"LEFT JOIN {SCHEMA}.request_responses rr ON rr.request_id=r.id AND rr.provider_slug=%s "
                        f"WHERE r.status='open' AND r.category=%s ORDER BY r.created_at DESC LIMIT 100",
                        (slug, category),
                    )
                else:
                    cur.execute(
                        f"SELECT r.id, r.client_name, r.category, r.service, r.description, r.budget, r.city, r.created_at, "
                        f"rr.id, rr.message, rr.price, rr.status "
                        f"FROM {SCHEMA}.client_requests r "
                        f"LEFT JOIN {SCHEMA}.request_responses rr ON rr.request_id=r.id AND rr.provider_slug=%s "
                        f"WHERE r.status='open' ORDER BY r.created_at DESC LIMIT 100",
                        (slug,),
                    )
                rows = cur.fetchall()
                items = []
                for x in rows:
                    items.append({
                        'id': x[0], 'clientName': x[1], 'category': x[2], 'service': x[3],
                        'description': x[4], 'budget': x[5], 'city': x[6],
                        'createdAt': x[7].isoformat() if x[7] else None,
                        'myResponse': None if x[8] is None else {'message': x[9], 'price': x[10], 'status': x[11]},
                    })
                # Фиксируем факт просмотра задач этим специалистом (уникально на задачу).
                shown_ids = [x[0] for x in rows]
                if shown_ids:
                    args = [(rid, slug) for rid in shown_ids]
                    cur.executemany(
                        f"INSERT INTO {SCHEMA}.request_views (request_id, provider_slug) "
                        f"VALUES (%s, %s) ON CONFLICT (request_id, provider_slug) DO NOTHING",
                        args,
                    )
                    conn.commit()
                return _resp(200, {'requests': items})

            if view == 'mine':
                # Заявки, по которым клиент выбрал именно этого исполнителя —
                # тут он видит статус и может отметить работу выполненной.
                slug = auth_utils.provider_slug(user)
                cur.execute(
                    f"SELECT id, client_name, category, service, description, budget, city, status, "
                    f"created_at, provider_marked_done "
                    f"FROM {SCHEMA}.client_requests WHERE chosen_provider=%s ORDER BY created_at DESC LIMIT 100",
                    (slug,),
                )
                items = [{
                    'id': x[0], 'clientName': x[1], 'category': x[2], 'service': x[3],
                    'description': x[4], 'budget': x[5], 'city': x[6], 'status': x[7],
                    'createdAt': x[8].isoformat() if x[8] else None,
                    'providerMarkedDone': bool(x[9]),
                } for x in cur.fetchall()]
                return _resp(200, {'requests': items})

            # default: client view — только свои заявки
            client_id = auth_utils.client_id(user)
            cur.execute(
                f"SELECT id, category, service, description, budget, city, status, chosen_provider, created_at, needed_date, needed_time, provider_marked_done "
                f"FROM {SCHEMA}.client_requests WHERE client_id=%s ORDER BY created_at DESC LIMIT 100",
                (client_id,),
            )
            reqs = cur.fetchall()
            req_ids = [r[0] for r in reqs]
            responses_by_req = {}
            views_by_req = {}
            reviewed_req_ids = set()
            if req_ids:
                cur.execute(
                    f"SELECT request_id, provider_slug, provider_name, message, price, status "
                    f"FROM {SCHEMA}.request_responses WHERE request_id = ANY(%s) ORDER BY created_at ASC",
                    (req_ids,),
                )
                for rr in cur.fetchall():
                    responses_by_req.setdefault(rr[0], []).append({
                        'providerSlug': rr[1], 'providerName': rr[2], 'message': rr[3], 'price': rr[4], 'status': rr[5],
                    })
                # Число уникальных специалистов, просмотревших каждую задачу.
                cur.execute(
                    f"SELECT request_id, COUNT(*) FROM {SCHEMA}.request_views "
                    f"WHERE request_id = ANY(%s) GROUP BY request_id",
                    (req_ids,),
                )
                for vr in cur.fetchall():
                    views_by_req[vr[0]] = int(vr[1])
                # Заявки, по которым клиент уже оставил отзыв — не показываем кнопку повторно.
                cur.execute(
                    f"SELECT request_id FROM {SCHEMA}.reviews WHERE request_id = ANY(%s) AND author_id=%s",
                    (req_ids, client_id),
                )
                reviewed_req_ids = {rr[0] for rr in cur.fetchall()}
            items = []
            for r in reqs:
                items.append({
                    'id': r[0], 'category': r[1], 'service': r[2], 'description': r[3],
                    'budget': r[4], 'city': r[5], 'status': r[6], 'chosenProvider': r[7],
                    'createdAt': r[8].isoformat() if r[8] else None,
                    'neededDate': r[9].isoformat() if r[9] else '',
                    'neededTime': r[10] or '',
                    'responses': responses_by_req.get(r[0], []),
                    'views': views_by_req.get(r[0], 0),
                    'providerMarkedDone': bool(r[11]),
                    'canReview': bool(r[11]) and r[0] not in reviewed_req_ids and bool(r[7]),
                })
            return _resp(200, {'requests': items})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 20)

            if action == 'create':
                client_id = auth_utils.client_id(user)
                category = esc(body.get('category'), 40)
                if category not in ALLOWED_CATEGORIES:
                    category = ''
                client_name = esc(body.get('clientName'))
                service = esc(body.get('service'))
                description = esc(body.get('description'), 2000)
                budget = esc(body.get('budget'), 80)
                city = esc(body.get('city'), 120)
                # Дата/время услуги: принимаем YYYY-MM-DD и HH:MM, иначе NULL/пусто.
                nd = esc(body.get('neededDate'), 10)
                needed_date = nd if re.match(r'^\d{4}-\d{2}-\d{2}$', nd) else None
                nt = esc(body.get('neededTime'), 5)
                needed_time = nt if re.match(r'^\d{2}:\d{2}$', nt) else ''
                cur.execute(
                    f"INSERT INTO {SCHEMA}.client_requests (client_id, client_name, category, service, description, budget, city, needed_date, needed_time) "
                    f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    (client_id, client_name, category, service, description, budget, city, needed_date, needed_time),
                )
                new_id = cur.fetchone()[0]

                # Уведомляем активных специалистов о новой задаче, чтобы они быстрее откликались.
                cat_label = notify_utils.CATEGORY_LABELS.get(category, '')
                cur.execute(
                    f"SELECT slug FROM {SCHEMA}.providers WHERE subscription_active = true"
                )
                svc_txt = service or (cat_label or 'услуга по безопасности')
                where = f' в {city}' if city else ''
                title = 'Новая задача от клиента'
                text = f'Появилась новая задача: «{svc_txt}»{where}. Бюджет: {budget or "не указан"}. Откликнитесь в кабинете.'
                for prov in cur.fetchall():
                    uid = notify_utils.id_from_slug(prov[0])
                    if uid:
                        notify_utils.push(cur, uid, 'task', title, text, 'dashboard', email=False)
                conn.commit()
                return _resp(200, {'success': True, 'id': new_id})

            if action == 'respond':
                try:
                    request_id = int(body.get('requestId') or 0)
                except (TypeError, ValueError):
                    request_id = 0
                slug = auth_utils.provider_slug(user)
                if not request_id:
                    return _resp(400, {'error': 'requestId required'})
                provider_name = esc(body.get('providerName'))
                message = esc(body.get('message'), 2000)
                price = esc(body.get('price'), 80)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.request_responses (request_id, provider_slug, provider_name, message, price) "
                    f"VALUES (%s, %s, %s, %s, %s) "
                    f"ON CONFLICT (request_id, provider_slug) DO UPDATE SET "
                    f"message=EXCLUDED.message, price=EXCLUDED.price, provider_name=EXCLUDED.provider_name, status='sent'",
                    (request_id, slug, provider_name, message, price),
                )
                # Уведомляем клиента — автора заявки — о новом отклике.
                cur.execute(
                    f"SELECT client_id, service FROM {SCHEMA}.client_requests WHERE id=%s",
                    (request_id,),
                )
                rq = cur.fetchone()
                if rq:
                    client_uid = notify_utils.id_from_slug(rq[0])
                    svc = rq[1] or ''
                    title = 'Новый отклик на вашу задачу'
                    text = f'Специалист {provider_name} откликнулся на задачу «{svc}». Цена: {price or "по договорённости"}.'
                    notify_utils.push(cur, client_uid, 'task', title, text, 'dashboard')
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'choose':
                try:
                    request_id = int(body.get('requestId') or 0)
                except (TypeError, ValueError):
                    request_id = 0
                slug = esc(body.get('providerSlug'), 64)
                client_id = auth_utils.client_id(user)
                if not request_id or not slug:
                    return _resp(400, {'error': 'requestId and providerSlug required'})
                cur.execute(
                    f"UPDATE {SCHEMA}.client_requests SET status='assigned', chosen_provider=%s "
                    f"WHERE id=%s AND client_id=%s",
                    (slug, request_id, client_id),
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.request_responses SET status='accepted' "
                    f"WHERE request_id=%s AND provider_slug=%s",
                    (request_id, slug),
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.request_responses SET status='declined' "
                    f"WHERE request_id=%s AND provider_slug<>%s",
                    (request_id, slug),
                )
                # Уведомляем выбранного специалиста, что клиент выбрал именно его.
                cur.execute(f"SELECT service FROM {SCHEMA}.client_requests WHERE id=%s", (request_id,))
                svc_row = cur.fetchone()
                svc = (svc_row[0] if svc_row else '') or ''
                provider_uid = notify_utils.id_from_slug(slug)
                notify_utils.push(
                    cur, provider_uid, 'task',
                    'Клиент выбрал вас',
                    f'Клиент выбрал вас по задаче «{svc}». Свяжитесь с ним, чтобы обсудить детали.',
                    'dashboard',
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'complete':
                # Клиент завершает свою задачу.
                try:
                    request_id = int(body.get('requestId') or 0)
                except (TypeError, ValueError):
                    request_id = 0
                client_id = auth_utils.client_id(user)
                if not request_id:
                    return _resp(400, {'error': 'requestId required'})
                cur.execute(
                    f"UPDATE {SCHEMA}.client_requests SET status='completed' "
                    f"WHERE id=%s AND client_id=%s",
                    (request_id, client_id),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'provider_done':
                # Исполнитель, выбранный по заявке, отмечает работу выполненной —
                # это открывает клиенту возможность оставить отзыв.
                try:
                    request_id = int(body.get('requestId') or 0)
                except (TypeError, ValueError):
                    request_id = 0
                slug = auth_utils.provider_slug(user)
                if not request_id:
                    return _resp(400, {'error': 'requestId required'})
                cur.execute(
                    f"UPDATE {SCHEMA}.client_requests SET provider_marked_done=true, provider_marked_done_at=now() "
                    f"WHERE id=%s AND chosen_provider=%s",
                    (request_id, slug),
                )
                if cur.rowcount == 0:
                    conn.rollback()
                    return _resp(403, {'error': 'not your request'})
                cur.execute(f"SELECT client_id, service FROM {SCHEMA}.client_requests WHERE id=%s", (request_id,))
                rq = cur.fetchone()
                if rq:
                    client_uid = notify_utils.id_from_slug(rq[0])
                    svc = rq[1] or ''
                    notify_utils.push(
                        cur, client_uid, 'task',
                        'Задача выполнена',
                        f'Специалист отметил задачу «{svc}» как выполненную. Оставьте отзыв в личном кабинете.',
                        'dashboard',
                    )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()