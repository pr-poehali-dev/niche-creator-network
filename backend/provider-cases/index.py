import json
import os
import psycopg2
from auth_utils import get_auth_user, provider_slug

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body)}


def handler(event: dict, context) -> dict:
    '''
    Business: хранит кейсы (портфолио) исполнителя. GET — список своих кейсов,
              POST — полностью заменяет список кейсов исполнителя переданным набором.
    Args: event с httpMethod, headers (X-Auth-Token), body (JSON: {cases: [...]})
    Returns: HTTP-ответ со списком кейсов исполнителя
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    user = get_auth_user(event)
    if not user:
        return _resp(401, {'error': 'unauthorized'})
    slug = provider_slug(user)

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            f"SELECT id, title, category, views, published FROM {SCHEMA}.provider_cases "
            f"WHERE slug=%s ORDER BY sort_order ASC, id DESC",
            (slug,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        cases = [{
            'id': r[0], 'title': r[1], 'category': r[2],
            'views': int(r[3] or 0), 'published': bool(r[4]),
        } for r in rows]
        return _resp(200, {'cases': cases})

    if method != 'POST':
        cur.close()
        conn.close()
        return _resp(405, {'error': 'method_not_allowed'})

    body = json.loads(event.get('body') or '{}')
    raw = body.get('cases')
    if not isinstance(raw, list):
        cur.close()
        conn.close()
        return _resp(400, {'error': 'cases_required'})

    # Полностью заменяем набор кейсов исполнителя
    cur.execute(f"DELETE FROM {SCHEMA}.provider_cases WHERE slug=%s", (slug,))
    saved = []
    for i, c in enumerate(raw[:100]):
        if not isinstance(c, dict):
            continue
        title = str(c.get('title', '')).strip()[:200]
        category = str(c.get('category', '')).strip()[:120]
        if not title:
            continue
        views = c.get('views')
        try:
            views = int(views)
        except (TypeError, ValueError):
            views = 0
        published = bool(c.get('published'))
        cur.execute(
            f"INSERT INTO {SCHEMA}.provider_cases (slug, title, category, views, published, sort_order) "
            f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (slug, title, category, views, published, i),
        )
        new_id = cur.fetchone()[0]
        saved.append({'id': new_id, 'title': title, 'category': category, 'views': views, 'published': published})

    cur.close()
    conn.close()
    return _resp(200, {'cases': saved})
