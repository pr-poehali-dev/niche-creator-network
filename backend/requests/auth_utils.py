import os
from datetime import datetime
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def get_auth_user(event: dict):
    '''
    Возвращает данные текущего пользователя по токену сессии (заголовок X-Auth-Token),
    либо None если токен отсутствует/невалиден/просрочен.
    Результат: {'id': int, 'email': str, 'role': str, 'is_admin': bool} или None.
    '''
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''
    if not token:
        return None
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.email, u.role, s.expires_at, u.is_admin "
            f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
            f"WHERE s.token = %s",
            (token,),
        )
        row = cur.fetchone()
        cur.close()
    finally:
        conn.close()
    if not row or row[3] < datetime.utcnow():
        return None
    email = str(row[1] or '')
    return {'id': int(row[0]), 'email': email, 'role': row[2], 'is_admin': bool(row[4])}


def provider_slug(user: dict) -> str:
    '''Slug профиля исполнителя, которым владеет пользователь.'''
    return f"provider-{user['id']}"


def client_id(user: dict) -> str:
    '''Идентификатор клиента, которым владеет пользователь.'''
    return f"client-{user['id']}"