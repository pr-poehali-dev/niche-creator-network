import json
import os
import re
from datetime import datetime
import psycopg2
from crypto_utils import encrypt_field, decrypt_field

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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


def _is_admin(cur, token):
    '''Проверяет, что токен сессии принадлежит администратору.'''
    if not token:
        return False
    cur.execute(
        f"SELECT u.email, s.expires_at FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,),
    )
    row = cur.fetchone()
    if not row or row[1] < datetime.utcnow():
        return False
    email = str(row[0] or '')
    return email.startswith('admin+') and email.endswith('@shchit.local')


def handler(event: dict, context) -> dict:
    '''
    Business: хранилище переписок — профессиональные чаты по категориям, форум и личные сообщения.
              Все сообщения сохраняются в БД (не удаляются, хранятся бессрочно/≥6 мес по закону).
              Нецензурная лексика автоматически маскируется.
    Args: event с httpMethod, queryStringParameters, body
    Returns: HTTP-ответ с сообщениями/темами или статусом
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
                msgs = [{'author': r[0], 'text': r[1], 'createdAt': r[2].isoformat() if r[2] else None} for r in cur.fetchall()]
                return _resp(200, {'messages': msgs})

            if kind == 'forum':
                category = esc(params.get('category'), 40)
                if category:
                    cur.execute(
                        f"SELECT t.id, t.category, t.title, t.author_name, t.views, t.created_at, "
                        f"COUNT(p.id) AS replies "
                        f"FROM {SCHEMA}.forum_topics t "
                        f"LEFT JOIN {SCHEMA}.forum_posts p ON p.topic_id=t.id "
                        f"WHERE t.blocked = false AND t.category=%s "
                        f"GROUP BY t.id ORDER BY t.created_at DESC LIMIT 200",
                        (category,),
                    )
                else:
                    cur.execute(
                        f"SELECT t.id, t.category, t.title, t.author_name, t.views, t.created_at, "
                        f"COUNT(p.id) AS replies "
                        f"FROM {SCHEMA}.forum_topics t "
                        f"LEFT JOIN {SCHEMA}.forum_posts p ON p.topic_id=t.id "
                        f"WHERE t.blocked = false "
                        f"GROUP BY t.id ORDER BY t.created_at DESC LIMIT 200"
                    )
                topics = [{
                    'id': r[0], 'category': r[1], 'title': r[2], 'author': r[3],
                    'views': r[4], 'createdAt': r[5].isoformat() if r[5] else None, 'replies': int(r[6]),
                } for r in cur.fetchall()]
                return _resp(200, {'topics': topics})

            if kind == 'forum_topic':
                try:
                    topic_id = int(params.get('topicId') or 0)
                except (TypeError, ValueError):
                    topic_id = 0
                cur.execute(f"UPDATE {SCHEMA}.forum_topics SET views=views+1 WHERE id=%s", (topic_id,))
                conn.commit()
                cur.execute(
                    f"SELECT id, category, title, author_name, created_at FROM {SCHEMA}.forum_topics WHERE id=%s",
                    (topic_id,),
                )
                t = cur.fetchone()
                if not t:
                    return _resp(404, {'error': 'not found'})
                cur.execute(
                    f"SELECT author_name, text, created_at FROM {SCHEMA}.forum_posts "
                    f"WHERE topic_id=%s ORDER BY created_at ASC LIMIT 500",
                    (topic_id,),
                )
                posts = [{'author': p[0], 'text': p[1], 'createdAt': p[2].isoformat() if p[2] else None} for p in cur.fetchall()]
                return _resp(200, {'topic': {'id': t[0], 'category': t[1], 'title': t[2], 'author': t[3], 'createdAt': t[4].isoformat() if t[4] else None}, 'posts': posts})

            if kind == 'dm':
                pair = esc(params.get('pair'), 160)
                cur.execute(
                    f"SELECT from_id, from_name, text, created_at FROM {SCHEMA}.direct_messages "
                    f"WHERE pair_key=%s ORDER BY created_at ASC LIMIT 500",
                    (pair,),
                )
                msgs = [{'fromId': r[0], 'fromName': r[1], 'text': decrypt_field(r[2]), 'createdAt': r[3].isoformat() if r[3] else None} for r in cur.fetchall()]
                return _resp(200, {'messages': msgs})

            return _resp(400, {'error': 'unknown kind'})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 30)

            if action == 'chat_send':
                room = esc(body.get('room'), 40) or 'general'
                author_id = esc(body.get('authorId'), 64)
                author_name = esc(body.get('authorName'), 200)
                text = clean_text(esc(body.get('text'), 2000))
                if not text.strip():
                    return _resp(400, {'error': 'empty'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.chat_messages (room, author_id, author_name, text) "
                    f"VALUES (%s, %s, %s, %s)",
                    (room, author_id, author_name, text),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'forum_create':
                category = esc(body.get('category'), 40)
                title = clean_text(esc(body.get('title'), 300))
                author_id = esc(body.get('authorId'), 64)
                author_name = esc(body.get('authorName'), 200)
                if not title.strip():
                    return _resp(400, {'error': 'empty title'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.forum_topics (category, title, author_id, author_name) "
                    f"VALUES (%s, %s, %s, %s) RETURNING id",
                    (category, title, author_id, author_name),
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return _resp(200, {'success': True, 'id': new_id})

            if action == 'forum_reply':
                try:
                    topic_id = int(body.get('topicId') or 0)
                except (TypeError, ValueError):
                    topic_id = 0
                author_id = esc(body.get('authorId'), 64)
                author_name = esc(body.get('authorName'), 200)
                text = clean_text(esc(body.get('text'), 2000))
                if not topic_id or not text.strip():
                    return _resp(400, {'error': 'empty'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.forum_posts (topic_id, author_id, author_name, text) "
                    f"VALUES (%s, %s, %s, %s)",
                    (topic_id, author_id, author_name, text),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action in ('forum_delete', 'forum_block', 'forum_unblock'):
                token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token') or ''
                if not _is_admin(cur, token):
                    return _resp(403, {'error': 'forbidden'})
                try:
                    topic_id = int(body.get('topicId') or 0)
                except (TypeError, ValueError):
                    topic_id = 0
                if not topic_id:
                    return _resp(400, {'error': 'no topic'})
                if action == 'forum_delete':
                    cur.execute(f"DELETE FROM {SCHEMA}.forum_posts WHERE topic_id=%s", (topic_id,))
                    cur.execute(f"DELETE FROM {SCHEMA}.forum_topics WHERE id=%s", (topic_id,))
                else:
                    blocked = action == 'forum_block'
                    cur.execute(f"UPDATE {SCHEMA}.forum_topics SET blocked=%s WHERE id=%s", (blocked, topic_id))
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'dm_send':
                pair = esc(body.get('pair'), 160)
                from_id = esc(body.get('fromId'), 64)
                from_name = esc(body.get('fromName'), 200)
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
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()