import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

ALLOWED_CATEGORIES = {
    'physical', 'cyber', 'economic', 'investigation', 'engineering', 'polygraph', ''
}


def esc(v, limit=200):
    return str(v if v is not None else '').strip().replace("'", "''")[:limit]


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

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            view = esc(params.get('view'), 20)

            if view == 'provider':
                slug = esc(params.get('providerSlug'), 64)
                category = esc(params.get('category'), 40)
                where = "WHERE r.status='open'"
                if category and category in ALLOWED_CATEGORIES and category != '':
                    where += f" AND r.category='{category}'"
                cur.execute(
                    f"SELECT r.id, r.client_name, r.category, r.service, r.description, r.budget, r.city, r.created_at, "
                    f"rr.id, rr.message, rr.price, rr.status "
                    f"FROM {SCHEMA}.client_requests r "
                    f"LEFT JOIN {SCHEMA}.request_responses rr ON rr.request_id=r.id AND rr.provider_slug='{slug}' "
                    f"{where} ORDER BY r.created_at DESC LIMIT 100"
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
                return _resp(200, {'requests': items})

            # default: client view
            client_id = esc(params.get('clientId'), 64)
            if not client_id:
                return _resp(400, {'error': 'clientId required'})
            cur.execute(
                f"SELECT id, category, service, description, budget, city, status, chosen_provider, created_at "
                f"FROM {SCHEMA}.client_requests WHERE client_id='{client_id}' ORDER BY created_at DESC LIMIT 100"
            )
            reqs = cur.fetchall()
            req_ids = [r[0] for r in reqs]
            responses_by_req = {}
            if req_ids:
                ids_sql = ','.join(str(i) for i in req_ids)
                cur.execute(
                    f"SELECT request_id, provider_slug, provider_name, message, price, status "
                    f"FROM {SCHEMA}.request_responses WHERE request_id IN ({ids_sql}) ORDER BY created_at ASC"
                )
                for rr in cur.fetchall():
                    responses_by_req.setdefault(rr[0], []).append({
                        'providerSlug': rr[1], 'providerName': rr[2], 'message': rr[3], 'price': rr[4], 'status': rr[5],
                    })
            items = []
            for r in reqs:
                items.append({
                    'id': r[0], 'category': r[1], 'service': r[2], 'description': r[3],
                    'budget': r[4], 'city': r[5], 'status': r[6], 'chosenProvider': r[7],
                    'createdAt': r[8].isoformat() if r[8] else None,
                    'responses': responses_by_req.get(r[0], []),
                })
            return _resp(200, {'requests': items})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 20)

            if action == 'create':
                client_id = esc(body.get('clientId'), 64)
                if not client_id:
                    return _resp(400, {'error': 'clientId required'})
                category = esc(body.get('category'), 40)
                if category not in ALLOWED_CATEGORIES:
                    category = ''
                client_name = esc(body.get('clientName'))
                service = esc(body.get('service'))
                description = esc(body.get('description'), 2000)
                budget = esc(body.get('budget'), 80)
                city = esc(body.get('city'), 120)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.client_requests (client_id, client_name, category, service, description, budget, city) "
                    f"VALUES ('{client_id}', '{client_name}', '{category}', '{service}', '{description}', '{budget}', '{city}') RETURNING id"
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return _resp(200, {'success': True, 'id': new_id})

            if action == 'respond':
                request_id = int(body.get('requestId') or 0)
                slug = esc(body.get('providerSlug'), 64)
                if not request_id or not slug:
                    return _resp(400, {'error': 'requestId and providerSlug required'})
                provider_name = esc(body.get('providerName'))
                message = esc(body.get('message'), 2000)
                price = esc(body.get('price'), 80)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.request_responses (request_id, provider_slug, provider_name, message, price) "
                    f"VALUES ({request_id}, '{slug}', '{provider_name}', '{message}', '{price}') "
                    f"ON CONFLICT (request_id, provider_slug) DO UPDATE SET "
                    f"message=EXCLUDED.message, price=EXCLUDED.price, provider_name=EXCLUDED.provider_name, status='sent'"
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'choose':
                request_id = int(body.get('requestId') or 0)
                slug = esc(body.get('providerSlug'), 64)
                client_id = esc(body.get('clientId'), 64)
                if not request_id or not slug:
                    return _resp(400, {'error': 'requestId and providerSlug required'})
                cur.execute(
                    f"UPDATE {SCHEMA}.client_requests SET status='assigned', chosen_provider='{slug}' "
                    f"WHERE id={request_id} AND client_id='{client_id}'"
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.request_responses SET status='accepted' "
                    f"WHERE request_id={request_id} AND provider_slug='{slug}'"
                )
                cur.execute(
                    f"UPDATE {SCHEMA}.request_responses SET status='declined' "
                    f"WHERE request_id={request_id} AND provider_slug<>'{slug}'"
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()
