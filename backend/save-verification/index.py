import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

ALLOWED_STATUS = {'self', 'ip', 'company', ''}


def esc(v):
    return str(v if v is not None else '').strip().replace("'", "''")[:300]


def handler(event: dict, context) -> dict:
    '''
    Business: сохраняет данные верификации исполнителя (ФИО, паспорт, статус,
              лицензия, реквизиты) и флаги видимости каждого поля для клиентов.
    Args: event с httpMethod, body (JSON: slug, fullName, passportNumber, legalStatus,
          license, registry, showFullName, showLegalStatus, showLicense, showRegistry)
    Returns: HTTP-ответ со статусом сохранения
    '''
    method = event.get('httpMethod', 'POST')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    slug = esc(body.get('slug'))
    if not slug:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'slug required'})}

    full_name = esc(body.get('fullName'))
    passport = esc(body.get('passportNumber'))
    legal_status = esc(body.get('legalStatus'))
    if legal_status not in ALLOWED_STATUS:
        legal_status = ''
    license_info = esc(body.get('license'))
    registry = esc(body.get('registry'))

    def b(v):
        return 'true' if bool(v) else 'false'

    show_name = b(body.get('showFullName'))
    show_status = b(body.get('showLegalStatus'))
    show_license = b(body.get('showLicense'))
    show_registry = b(body.get('showRegistry'))

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.providers SET "
        f"full_name='{full_name}', "
        f"passport_number='{passport}', "
        f"legal_status='{legal_status}', "
        f"license_info='{license_info}', "
        f"registry_number='{registry}', "
        f"show_full_name={show_name}, "
        f"show_legal_status={show_status}, "
        f"show_license={show_license}, "
        f"show_registry={show_registry} "
        f"WHERE slug='{slug}'"
    )
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    if updated == 0:
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'provider not found'})}

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True})}
