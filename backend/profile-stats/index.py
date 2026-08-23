import json
import os
import hashlib
from datetime import date, timedelta

import psycopg2
from auth_utils import get_auth_user, provider_slug

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

ALLOWED_SOURCES = {'catalog', 'search', 'services', 'direct'}


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body)}


def _viewer_hash(event: dict) -> str:
    '''Обезличенный отпечаток посетителя: IP и браузер не хранятся в открытом
    виде — только необратимый хеш. Нужен, чтобы один человек за день считался
    одним просмотром, а не накручивал счётчик обновлением страницы.'''
    ctx = event.get('requestContext') or {}
    ip = ((ctx.get('identity') or {}).get('sourceIp')) or ''
    headers = event.get('headers') or {}
    ua = headers.get('User-Agent') or headers.get('user-agent') or ''
    salt = os.environ.get('VIEW_HASH_SALT', 'shchit-views')
    return hashlib.sha256(f'{salt}|{ip}|{ua}'.encode()).hexdigest()[:64]


def handler(event: dict, context) -> dict:
    '''
    Business: считает просмотры анкет специалистов и отдаёт статистику владельцу анкеты.
              POST — записывает просмотр (один посетитель за сутки считается один раз).
              GET — возвращает владельцу число просмотров за 7 и 30 дней и разбивку по источникам.
    Args: event с httpMethod, headers (X-Auth-Token для GET), body (JSON: slug, source)
    Returns: HTTP-ответ со статистикой просмотров либо подтверждением записи
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        slug = (str(body.get('slug') or ''))[:64]
        source = (str(body.get('source') or 'catalog'))[:32]
        if source not in ALLOWED_SOURCES:
            source = 'catalog'
        if not slug:
            cur.close()
            conn.close()
            return _resp(400, {'error': 'slug_required'})

        # Просмотр засчитываем только у существующей анкеты: иначе таблицу
        # можно засорить произвольными значениями извне.
        cur.execute(f"SELECT 1 FROM {SCHEMA}.providers WHERE slug=%s", (slug,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return _resp(404, {'error': 'provider_not_found'})

        viewer = _viewer_hash(event)
        # Уникальный индекс по (анкета, посетитель, дата) отсекает повторы:
        # накрутить счётчик перезагрузкой страницы нельзя.
        cur.execute(
            f"INSERT INTO {SCHEMA}.profile_views (provider_slug, viewer_hash, source) "
            f"VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            (slug, viewer, source),
        )
        cur.close()
        conn.close()
        return _resp(200, {'success': True})

    if method != 'GET':
        cur.close()
        conn.close()
        return _resp(405, {'error': 'method_not_allowed'})

    # Статистику видит только владелец анкеты — чужие цифры недоступны.
    user = get_auth_user(event)
    if not user:
        cur.close()
        conn.close()
        return _resp(401, {'error': 'unauthorized'})
    slug = provider_slug(user)

    today = date.today()
    since_30 = today - timedelta(days=30)
    since_7 = today - timedelta(days=7)

    cur.execute(
        f"SELECT count(*) FROM {SCHEMA}.profile_views "
        f"WHERE provider_slug=%s AND created_at >= %s",
        (slug, since_7),
    )
    views_7 = int((cur.fetchone() or [0])[0])

    cur.execute(
        f"SELECT count(*) FROM {SCHEMA}.profile_views "
        f"WHERE provider_slug=%s AND created_at >= %s",
        (slug, since_30),
    )
    views_30 = int((cur.fetchone() or [0])[0])

    cur.execute(
        f"SELECT source, count(*) FROM {SCHEMA}.profile_views "
        f"WHERE provider_slug=%s AND created_at >= %s GROUP BY source",
        (slug, since_30),
    )
    sources = {r[0]: int(r[1]) for r in cur.fetchall()}

    # Помесячная разбивка по дням за последнюю неделю — для простого графика.
    cur.execute(
        f"SELECT created_at::date, count(*) FROM {SCHEMA}.profile_views "
        f"WHERE provider_slug=%s AND created_at >= %s "
        f"GROUP BY created_at::date ORDER BY created_at::date",
        (slug, since_7),
    )
    daily = [{'date': str(r[0]), 'count': int(r[1])} for r in cur.fetchall()]

    cur.close()
    conn.close()
    return _resp(200, {
        'views7': views_7,
        'views30': views_30,
        'sources': sources,
        'daily': daily,
    })
