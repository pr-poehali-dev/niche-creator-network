import os
from datetime import datetime, timedelta

import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def client_ip(event: dict) -> str:
    '''IP посетителя: сначала из контекста платформы, затем из X-Forwarded-For.'''
    try:
        ip = (event.get('requestContext', {}).get('identity', {}).get('sourceIp') or '')
    except (AttributeError, TypeError):
        ip = ''
    if not ip:
        headers = event.get('headers') or {}
        fwd = headers.get('X-Forwarded-For') or headers.get('x-forwarded-for') or ''
        ip = fwd.split(',')[0].strip()
    return str(ip)[:64]


def check_and_count(event: dict, bucket: str, limit: int, window_sec: int) -> bool:
    '''
    Ограничение частоты запросов в скользящем окне.
    Возвращает True, если запрос разрешён, и False при превышении лимита.

    Защищает от массового сканирования: живой человек делает единицы запросов
    в минуту, парсер — сотни. Лимиты подобраны так, чтобы обычный посетитель
    их никогда не достиг.

    При любой ошибке БД пропускаем запрос: доступность сайта важнее, чем
    жёсткость лимита (fail-open).
    '''
    ip = client_ip(event)
    if not ip:
        return True
    since = datetime.utcnow() - timedelta(seconds=window_sec)
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        conn.autocommit = True
        try:
            cur = conn.cursor()
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.rate_limits "
                f"WHERE bucket = %s AND ip = %s AND created_at > %s",
                (bucket, ip, since),
            )
            hits = cur.fetchone()[0]
            if hits >= limit:
                cur.close()
                return False
            cur.execute(
                f"INSERT INTO {SCHEMA}.rate_limits (bucket, ip) VALUES (%s, %s)",
                (bucket, ip),
            )
            # Периодическая уборка старых записей, чтобы таблица не росла.
            if hits % 25 == 0:
                cur.execute(
                    f"DELETE FROM {SCHEMA}.rate_limits WHERE created_at < %s",
                    (datetime.utcnow() - timedelta(hours=6),),
                )
            cur.close()
        finally:
            conn.close()
    except Exception as e:
        print(f"[rate_limit] check failed, allowing request: {type(e).__name__}: {e}")
        return True
    return True
