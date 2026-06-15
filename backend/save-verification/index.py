import json
import os
from datetime import datetime
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    # GET: владелец загружает свои данные в форму редактирования (с паспортом).
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        slug = esc(params.get('slug'))
        if not slug:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'slug required'})}
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT full_name, passport_number, legal_status, license_info, registry_number, "
            f"show_full_name, show_legal_status, show_license, show_registry, "
            f"pseudonym, use_pseudonym, licenses, documents, bio, age, "
            f"show_bio, show_age, show_documents, gender, avatar_url, "
            f"timezone, always_available, quiet_start, quiet_end, license_verified, "
            f"plan, subscription_active, subscription_until, services, birth_date "
            f"FROM {SCHEMA}.providers WHERE slug='{slug}'"
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'verification': None})}
        svc_raw = row[28] if isinstance(row[28], list) else (json.loads(row[28]) if row[28] else [])
        svc = []
        for x in svc_raw:
            if isinstance(x, dict):
                k = str(x.get('key', '')).strip()
                if k:
                    svc.append({'key': k, 'price': str(x.get('price', '')).strip()})
            elif str(x).strip():
                svc.append({'key': str(x).strip(), 'price': ''})
        lic = row[11] if isinstance(row[11], list) else (json.loads(row[11]) if row[11] else [])
        if not lic and (row[3] or '').strip():
            lic = [row[3].strip()]
        docs = row[12] if isinstance(row[12], list) else (json.loads(row[12]) if row[12] else [])
        data = {
            'fullName': row[0] or '', 'passportNumber': row[1] or '', 'legalStatus': row[2] or 'ip',
            'registry': row[4] or '',
            'showFullName': bool(row[5]), 'showLegalStatus': bool(row[6]),
            'showLicense': bool(row[7]), 'showRegistry': bool(row[8]),
            'pseudonym': row[9] or '', 'usePseudonym': bool(row[10]),
            'licenses': [str(x) for x in lic],
            'documents': [{'title': str(d.get('title', '')), 'url': str(d.get('url', ''))} for d in docs if isinstance(d, dict)],
            'bio': row[13] or '', 'age': row[14],
            'showBio': bool(row[15]), 'showAge': bool(row[16]), 'showDocuments': bool(row[17]),
            'gender': row[18] or 'm', 'avatarUrl': row[19] or '',
            'timezone': row[20] or '', 'alwaysAvailable': bool(row[21]),
            'quietStart': row[22] or '', 'quietEnd': row[23] or '',
            'licenseVerified': bool(row[24]),
            'plan': row[25] or 'start',
            'subscriptionActive': bool(row[26]),
            'subscriptionUntil': row[27].isoformat() if row[27] else None,
            'services': svc,
            'birthDate': row[29].isoformat() if row[29] else '',
        }
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'verification': data})}

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

    pseudonym = esc(body.get('pseudonym'))
    use_pseudonym = b(body.get('usePseudonym'))

    gender = esc(body.get('gender')) or 'm'
    if gender not in ('m', 'f'):
        gender = 'm'

    # Несколько лицензий
    raw_licenses = body.get('licenses') or []
    licenses = [str(x).strip()[:300] for x in raw_licenses if str(x).strip()] if isinstance(raw_licenses, list) else []
    licenses_json = json.dumps(licenses, ensure_ascii=False).replace("'", "''")

    # Документы (дипломы/сертификаты)
    raw_docs = body.get('documents') or []
    documents = []
    if isinstance(raw_docs, list):
        for d in raw_docs:
            if isinstance(d, dict):
                t = str(d.get('title', '')).strip()[:200]
                u = str(d.get('url', '')).strip()[:500]
                if t or u:
                    documents.append({'title': t, 'url': u})
    documents_json = json.dumps(documents, ensure_ascii=False).replace("'", "''")

    bio = str(body.get('bio') or '').strip()[:2000].replace("'", "''")

    # Дата рождения + автоматический расчёт возраста
    birth_raw = str(body.get('birthDate') or '').strip()[:10]
    birth_date = None
    if len(birth_raw) == 10 and birth_raw[4] == '-' and birth_raw[7] == '-':
        try:
            bd = datetime.strptime(birth_raw, '%Y-%m-%d').date()
            today = datetime.utcnow().date()
            if 1900 < bd.year and bd <= today:
                birth_date = bd
        except ValueError:
            birth_date = None
    birth_sql = f"'{birth_date.isoformat()}'" if birth_date else 'NULL'

    if birth_date is not None:
        today = datetime.utcnow().date()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    else:
        age_val = body.get('age')
        try:
            age = int(age_val)
            if age < 18 or age > 100:
                age = None
        except (TypeError, ValueError):
            age = None
    age_sql = str(age) if age is not None else 'NULL'

    show_bio = b(body.get('showBio'))
    show_age = b(body.get('showAge'))
    show_documents = b(body.get('showDocuments'))

    timezone = esc(body.get('timezone'))[:64]
    always_available = b(body.get('alwaysAvailable'))

    def time_or_empty(v):
        s = str(v or '').strip()
        if len(s) == 5 and s[2] == ':' and s[:2].isdigit() and s[3:].isdigit():
            return s
        return ''
    quiet_start = time_or_empty(body.get('quietStart')).replace("'", "''")
    quiet_end = time_or_empty(body.get('quietEnd')).replace("'", "''")

    # Выбранные услуги: список объектов {key, price}.
    # Поддерживаем старый формат (список строк-ключей).
    raw_services = body.get('services') or []
    sel_services = []
    if isinstance(raw_services, list):
        seen = set()
        for s in raw_services:
            if isinstance(s, dict):
                key = str(s.get('key', '')).strip()[:160]
                price = str(s.get('price', '')).strip()[:40]
            else:
                key = str(s).strip()[:160]
                price = ''
            if key and key not in seen:
                seen.add(key)
                sel_services.append({'key': key, 'price': price})
        sel_services = sel_services[:50]
    services_json = json.dumps(sel_services, ensure_ascii=False).replace("'", "''")

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
        f"show_registry={show_registry}, "
        f"pseudonym='{pseudonym}', "
        f"use_pseudonym={use_pseudonym}, "
        f"gender='{gender}', "
        f"licenses='{licenses_json}'::jsonb, "
        f"documents='{documents_json}'::jsonb, "
        f"bio='{bio}', "
        f"age={age_sql}, "
        f"birth_date={birth_sql}, "
        f"show_bio={show_bio}, "
        f"show_age={show_age}, "
        f"show_documents={show_documents}, "
        f"timezone='{timezone}', "
        f"always_available={always_available}, "
        f"quiet_start='{quiet_start}', "
        f"quiet_end='{quiet_end}', "
        f"services='{services_json}'::jsonb "
        f"WHERE slug='{slug}'"
    )
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    if updated == 0:
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'provider not found'})}

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True})}