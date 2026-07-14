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

BAD_ROOTS = [
    'хуй', 'хуя', 'хуе', 'пизд', 'ебан', 'ебат', 'еба', 'ебл', 'бляд', 'блят',
    'сука', 'сук', 'мудак', 'муда', 'гондон', 'гандон', 'долбоеб', 'залуп',
    'пидор', 'пидар', 'манда', 'дрочи', 'выеб', 'наеб', 'отъеб', 'уеб',
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'asshole', 'bastard', 'whore', 'slut',
]
BAD_RE = re.compile('(' + '|'.join(BAD_ROOTS) + ')', re.IGNORECASE)


def clean_text(text):
    if not text:
        return ''
    def repl(m):
        return m.group(0)[0] + '*' * (len(m.group(0)) - 1)
    return BAD_RE.sub(repl, text)


def esc(v, limit=2000):
    return str(v if v is not None else '').strip()[:limit]


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _recalc_provider_rating(cur, slug):
    cur.execute(
        f"SELECT COUNT(*), COALESCE(AVG(rating), 5.0) FROM {SCHEMA}.reviews WHERE target_type='provider' AND target_id=%s",
        (slug,),
    )
    count, avg = cur.fetchone()
    cur.execute(
        f"UPDATE {SCHEMA}.providers SET rating=%s, reviews=%s WHERE slug=%s",
        (round(float(avg), 1), int(count), slug),
    )


def _recalc_client_rating(cur, client_id):
    cur.execute(
        f"SELECT COUNT(*), COALESCE(AVG(rating), 5.0) FROM {SCHEMA}.reviews WHERE target_type='client' AND target_id=%s",
        (client_id,),
    )
    count, avg = cur.fetchone()
    cur.execute(
        f"UPDATE {SCHEMA}.clients SET rating=%s, reviews_count=%s WHERE client_id=%s",
        (round(float(avg), 1), int(count), client_id),
    )


def handler(event: dict, context) -> dict:
    '''
    Business: отзывы и рейтинг между клиентом и исполнителем. Отзыв можно оставить
              только по заявке, которую исполнитель отметил выполненной (provider_marked_done).
              Одна сторона — один отзыв на заявку. После сохранения пересчитывается
              средний рейтинг цели (provider.rating/reviews или clients.rating).
    Args: event с httpMethod, queryStringParameters (targetType, targetId — GET публичный список),
          body (action=create: requestId, targetType, targetId, rating, text)
    Returns: HTTP-ответ со списком отзывов или статусом сохранения
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            target_type = esc(params.get('targetType'), 10)
            target_id = esc(params.get('targetId'), 64)
            if target_type not in ('provider', 'client') or not target_id:
                return _resp(400, {'error': 'targetType and targetId required'})
            cur.execute(
                f"SELECT author_name, rating, text, created_at FROM {SCHEMA}.reviews "
                f"WHERE target_type=%s AND target_id=%s ORDER BY created_at DESC LIMIT 200",
                (target_type, target_id),
            )
            reviews = [{
                'authorName': r[0], 'rating': r[1], 'text': r[2],
                'createdAt': r[3].isoformat() if r[3] else None,
            } for r in cur.fetchall()]
            return _resp(200, {'reviews': reviews})

        if method == 'POST':
            user = auth_utils.get_auth_user(event)
            if not user:
                return _resp(401, {'error': 'unauthorized'})
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 20)

            if action == 'create':
                try:
                    request_id = int(body.get('requestId') or 0)
                except (TypeError, ValueError):
                    request_id = 0
                target_type = esc(body.get('targetType'), 10)
                target_id = esc(body.get('targetId'), 64)
                try:
                    rating = int(body.get('rating') or 0)
                except (TypeError, ValueError):
                    rating = 0
                text = clean_text(esc(body.get('text'), 2000))

                if not request_id or target_type not in ('provider', 'client') or not target_id:
                    return _resp(400, {'error': 'requestId, targetType, targetId required'})
                if rating < 1 or rating > 5:
                    return _resp(400, {'error': 'rating must be 1..5'})

                cur.execute(
                    f"SELECT client_id, chosen_provider, provider_marked_done FROM {SCHEMA}.client_requests WHERE id=%s",
                    (request_id,),
                )
                rq = cur.fetchone()
                if not rq:
                    return _resp(404, {'error': 'request not found'})
                req_client_id, req_provider_slug, marked_done = rq
                if not marked_done:
                    return _resp(403, {'error': 'request not marked done yet'})

                client_id = auth_utils.client_id(user)
                provider_slug = auth_utils.provider_slug(user)

                if target_type == 'provider':
                    if client_id != req_client_id or target_id != req_provider_slug:
                        return _resp(403, {'error': 'forbidden'})
                    author_type, author_id, author_name = 'client', client_id, esc(body.get('authorName'), 200)
                else:
                    if provider_slug != req_provider_slug or target_id != req_client_id:
                        return _resp(403, {'error': 'forbidden'})
                    author_type, author_id, author_name = 'provider', provider_slug, esc(body.get('authorName'), 200)

                cur.execute(
                    f"INSERT INTO {SCHEMA}.reviews (request_id, author_type, author_id, author_name, target_type, target_id, rating, text) "
                    f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s) "
                    f"ON CONFLICT (request_id, author_id) DO NOTHING",
                    (request_id, author_type, author_id, author_name, target_type, target_id, rating, text),
                )
                if cur.rowcount == 0:
                    conn.rollback()
                    return _resp(409, {'error': 'review already exists'})

                if target_type == 'provider':
                    _recalc_provider_rating(cur, target_id)
                    uid = notify_utils.id_from_slug(target_id)
                else:
                    _recalc_client_rating(cur, target_id)
                    uid = notify_utils.id_from_slug(target_id)
                notify_utils.push(
                    cur, uid, 'system', 'Новый отзыв',
                    f'Вам оставили отзыв с оценкой {rating}/5.', 'dashboard',
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()
