import os
import hashlib
import hmac
import device_sig
from datetime import datetime, timedelta
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

# Должно совпадать с настройками в backend/auth: сессия живёт не дольше
# SESSION_DAYS и умирает после SESSION_IDLE_DAYS простоя.
SESSION_DAYS = 7
SESSION_IDLE_DAYS = 2


def _client_ip(event: dict) -> str:
    try:
        ip = (event.get('requestContext', {}).get('identity', {}).get('sourceIp') or '')
    except (AttributeError, TypeError):
        ip = ''
    if not ip:
        headers = event.get('headers') or {}
        fwd = headers.get('X-Forwarded-For') or headers.get('x-forwarded-for') or ''
        ip = fwd.split(',')[0].strip()
    return str(ip)[:64]


def _fingerprint(event: dict) -> str:
    '''Отпечаток клиента: браузер + подсеть IP (см. backend/auth/index.py).'''
    headers = event.get('headers') or {}
    ua = (headers.get('User-Agent') or headers.get('user-agent') or '')[:200]
    ip = _client_ip(event)
    net = '.'.join(ip.split('.')[:2]) if '.' in ip else ip[:16]
    return hashlib.sha256(f'{ua}|{net}'.encode()).hexdigest()


def get_auth_user(event: dict):
    '''
    Возвращает данные текущего пользователя по токену сессии (заголовок X-Auth-Token),
    либо None если токен отсутствует/невалиден/просрочен/отозван/предъявлен с чужого
    устройства.
    Результат: {'id': int, 'email': str, 'role': str, 'is_admin': bool} или None.
    '''
    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''
    if not token:
        return None
    fingerprint = _fingerprint(event)
    now = datetime.utcnow()
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT u.id, u.email, u.role, s.expires_at, u.is_admin, "
            f"s.revoked, s.last_seen_at, s.fingerprint, s.device_pubkey, u.name "
            f"FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
            f"WHERE s.token = %s",
            (token,),
        )
        row = cur.fetchone()
        if not row or row[5] or row[3] < now:
            cur.close()
            return None
        # Долгий простой — сессия считается мёртвой.
        if row[6] and row[6] < now - timedelta(days=SESSION_IDLE_DAYS):
            cur.execute(f"UPDATE {SCHEMA}.sessions SET revoked = true WHERE token = %s", (token,))
            conn.commit()
            cur.close()
            return None
        # Токен пришёл с другого устройства/сети — вероятная кража, гасим сессию.
        if row[7] and fingerprint and not hmac.compare_digest(str(row[7]), fingerprint):
            cur.execute(f"UPDATE {SCHEMA}.sessions SET revoked = true WHERE token = %s", (token,))
            conn.commit()
            cur.close()
            return None
        # Подпись устройства: закрытый ключ невозможно выгрузить из браузера,
        # поэтому украденный токен без самого устройства бесполезен. Проверяем
        # только если ключ был сохранён при входе — старые сессии работают.
        if row[8]:
            _h = event.get('headers') or {}
            _sig = _h.get('X-Device-Sig') or _h.get('x-device-sig') or ''
            _ts = _h.get('X-Device-Ts') or _h.get('x-device-ts') or ''
            if not device_sig.verify(str(row[8]), _sig, _ts):
                cur.execute(f"UPDATE {SCHEMA}.sessions SET revoked = true WHERE token = %s", (token,))
                conn.commit()
                cur.close()
                return None
        # Скользящее продление, пока пользователь активен.
        cur.execute(
            f"UPDATE {SCHEMA}.sessions SET last_seen_at = now(), expires_at = %s WHERE token = %s",
            (now + timedelta(days=SESSION_DAYS), token),
        )
        conn.commit()
        cur.close()
    finally:
        conn.close()
    email = str(row[1] or '')
    # Имя берём из базы, а не из тела запроса: иначе кто угодно мог бы
    # подписаться «Администратор» в общем чате и на форуме.
    name = str(row[9] or '').strip() or email.split('@')[0]
    return {'id': int(row[0]), 'email': email, 'role': row[2], 'is_admin': bool(row[4]), 'name': name}


def user_dm_id(user: dict) -> str:
    '''Идентификатор пользователя в личных сообщениях.'''
    return f"u{user['id']}"


def is_dm_participant(user: dict, pair_key: str) -> bool:
    '''
    Проверяет, что пользователь является участником переписки.
    pair_key имеет формат "uA:uB" (отсортированные id участников).
    '''
    uid = user_dm_id(user)
    parts = str(pair_key or '').split(':')
    return uid in parts


def other_dm_user_id(user: dict, pair_key: str):
    '''Числовой id собеседника из pair_key вида "u12:u34". None — если разобрать не удалось.'''
    uid = user_dm_id(user)
    for part in str(pair_key or '').split(':'):
        if part and part != uid and part.startswith('u') and part[1:].isdigit():
            return int(part[1:])
    return None


def are_friends(user: dict, pair_key: str) -> bool:
    '''
    Переписываться можно только с теми, с кем дружба подтверждена обеими сторонами.
    Без этой проверки любой участник мог бы писать незнакомому специалисту,
    зная лишь его номер, — это спам и способ давления на людей, чья работа
    связана с риском.
    '''
    other = other_dm_user_id(user, pair_key)
    if not other:
        return False
    a, b = (user['id'], other) if user['id'] < other else (other, user['id'])
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT 1 FROM {SCHEMA}.friendships "
            f"WHERE user_id_a = %s AND user_id_b = %s AND status = 'accepted'",
            (a, b),
        )
        ok = cur.fetchone() is not None
        cur.close()
        return ok
    finally:
        conn.close()