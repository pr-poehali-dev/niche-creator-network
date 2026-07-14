import json
import os
import psycopg2
import auth_utils

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

ALLOWED_TARGET_TYPES = {'provider', 'client', 'message', 'forum_topic'}
ALLOWED_REASONS = {
    'spam', 'scam', 'illegal', 'harassment', 'fake_profile', 'other',
}


def esc(v, limit=2000):
    return str(v if v is not None else '').strip()[:limit]


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    '''
    Business: жалобы пользователей на профили исполнителей/клиентов, личные сообщения
              или темы форума. Модерация доступна только администратору.
    Args: event с httpMethod, body (action=create: targetType, targetId, reason, details;
          action=list/resolve — только для админа)
    Returns: HTTP-ответ со статусом создания жалобы или списком (для админа)
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        user = auth_utils.get_auth_user(event)
        if not user:
            return _resp(401, {'error': 'unauthorized'})

        if method == 'GET':
            if not user.get('is_admin'):
                return _resp(403, {'error': 'forbidden'})
            cur.execute(
                f"SELECT id, reporter_user_id, reporter_role, target_type, target_id, reason, details, status, created_at "
                f"FROM {SCHEMA}.complaints ORDER BY created_at DESC LIMIT 200"
            )
            items = [{
                'id': r[0], 'reporterUserId': r[1], 'reporterRole': r[2],
                'targetType': r[3], 'targetId': r[4], 'reason': r[5], 'details': r[6],
                'status': r[7], 'createdAt': r[8].isoformat() if r[8] else None,
            } for r in cur.fetchall()]
            return _resp(200, {'complaints': items})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 20) or 'create'

            if action == 'create':
                target_type = esc(body.get('targetType'), 20)
                target_id = esc(body.get('targetId'), 64)
                reason = esc(body.get('reason'), 30)
                details = esc(body.get('details'), 2000)
                if target_type not in ALLOWED_TARGET_TYPES or not target_id:
                    return _resp(400, {'error': 'targetType and targetId required'})
                if reason not in ALLOWED_REASONS:
                    reason = 'other'
                cur.execute(
                    f"INSERT INTO {SCHEMA}.complaints (reporter_user_id, reporter_role, target_type, target_id, reason, details) "
                    f"VALUES (%s, %s, %s, %s, %s, %s)",
                    (user['id'], user.get('role', ''), target_type, target_id, reason, details),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'resolve':
                if not user.get('is_admin'):
                    return _resp(403, {'error': 'forbidden'})
                try:
                    complaint_id = int(body.get('complaintId') or 0)
                except (TypeError, ValueError):
                    complaint_id = 0
                status = esc(body.get('status'), 20) or 'resolved'
                if not complaint_id:
                    return _resp(400, {'error': 'complaintId required'})
                cur.execute(
                    f"UPDATE {SCHEMA}.complaints SET status=%s WHERE id=%s",
                    (status, complaint_id),
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'Method not allowed'})
    finally:
        cur.close()
        conn.close()
