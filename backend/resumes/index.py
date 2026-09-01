import json
import os
from datetime import date

import psycopg2
import auth_utils
import notify_utils
from crypto_utils import encrypt_field, decrypt_field

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

EMPLOYMENT = {'full', 'part', 'project', 'shift'}


def esc(v, limit=200):
    return str(v if v is not None else '').strip()[:limit]


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _hr_active(cur, user_id: int) -> bool:
    '''Есть ли у пользователя оплаченный доступ к базе резюме.
    Проверяется ТОЛЬКО на сервере: фронтенду доверять нельзя.'''
    cur.execute(
        f"SELECT active, until FROM {SCHEMA}.hr_access WHERE user_id = %s",
        (user_id,),
    )
    row = cur.fetchone()
    if not row or not row[0]:
        return False
    return row[1] is None or row[1] >= date.today()


def _public_card(row) -> dict:
    '''Обезличенная карточка резюме — то, что видно БЕЗ оплаты.
    Ни имени, ни фото, ни контактов: это и есть товар площадки.'''
    (uid, position, employment, relocation, remote_ok, salary_from, salary_currency,
     experience_years, city, about, skills, updated_at) = row
    skills_list = [s for s in (skills or '').split('|') if s][:8]
    return {
        'id': uid,
        'position': position,
        'employment': employment,
        'relocation': bool(relocation),
        'remoteOk': bool(remote_ok),
        'salaryFrom': salary_from,
        'salaryCurrency': salary_currency,
        'experienceYears': experience_years,
        'city': city,
        # Короткая выжимка вместо полного текста: достаточно, чтобы оценить
        # кандидата, но не настолько, чтобы обойтись без оплаты.
        'aboutTeaser': (about or '')[:180],
        'skills': skills_list,
        'updatedAt': updated_at.isoformat() if updated_at else None,
        'locked': True,
    }


def handler(event: dict, context) -> dict:
    '''
    Business: резюме исполнителей и платный доступ HR к базе кандидатов.
              Исполнитель сам решает, публиковать ли резюме. Без оплаты HR
              видит обезличенные карточки, с оплатой — имя, фото и контакты.
    Args: event с httpMethod, headers (X-Auth-Token), queryStringParameters, body.
    Returns: HTTP-ответ с резюме, списком кандидатов или статусом доступа.
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    user = auth_utils.get_auth_user(event)
    if not user:
        return _resp(401, {'error': 'unauthorized'})

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            kind = esc((event.get('queryStringParameters') or {}).get('kind'), 30)

            if kind == 'my':
                # Своё резюме — всегда полностью, вместе с контактами.
                cur.execute(
                    f"SELECT is_published, position, employment, relocation, remote_ok, "
                    f"salary_from, salary_currency, experience_years, city, about, skills, "
                    f"education, history, contact_phone, contact_email "
                    f"FROM {SCHEMA}.resumes WHERE user_id = %s",
                    (user['id'],),
                )
                r = cur.fetchone()
                if not r:
                    return _resp(200, {'resume': None, 'views': [], 'viewsCount': 0})
                resume = {
                    'isPublished': bool(r[0]), 'position': r[1], 'employment': r[2],
                    'relocation': bool(r[3]), 'remoteOk': bool(r[4]), 'salaryFrom': r[5],
                    'salaryCurrency': r[6], 'experienceYears': r[7], 'city': r[8],
                    'about': r[9], 'skills': [s for s in (r[10] or '').split('|') if s],
                    'education': r[11], 'history': r[12],
                    'contactPhone': decrypt_field(r[13] or ''),
                    'contactEmail': decrypt_field(r[14] or ''),
                }
                # Кто смотрел резюме — исполнитель видит компанию и дату.
                cur.execute(
                    f"SELECT viewer_company, created_at FROM {SCHEMA}.resume_views "
                    f"WHERE resume_user_id = %s ORDER BY created_at DESC LIMIT 30",
                    (user['id'],),
                )
                views = [{'company': v[0], 'at': v[1].isoformat() if v[1] else None} for v in cur.fetchall()]
                cur.execute(
                    f"SELECT COUNT(*) FROM {SCHEMA}.resume_views WHERE resume_user_id = %s",
                    (user['id'],),
                )
                total = int((cur.fetchone() or [0])[0])
                return _resp(200, {'resume': resume, 'views': views, 'viewsCount': total})

            if kind == 'access':
                cur.execute(
                    f"SELECT active, until, company FROM {SCHEMA}.hr_access WHERE user_id = %s",
                    (user['id'],),
                )
                a = cur.fetchone()
                return _resp(200, {
                    'active': _hr_active(cur, user['id']),
                    'until': a[1].isoformat() if a and a[1] else None,
                    'company': a[2] if a else '',
                })

            if kind == 'search':
                q = (event.get('queryStringParameters') or {})
                text = esc(q.get('q'), 100).lower()
                city = esc(q.get('city'), 100).lower()
                remote = esc(q.get('remote'), 10) == '1'
                relocate = esc(q.get('relocation'), 10) == '1'
                paid = _hr_active(cur, user['id'])

                sql = (
                    f"SELECT user_id, position, employment, relocation, remote_ok, salary_from, "
                    f"salary_currency, experience_years, city, about, skills, updated_at "
                    f"FROM {SCHEMA}.resumes WHERE is_published = true"
                )
                params = []
                if text:
                    sql += " AND (LOWER(position) LIKE %s OR LOWER(skills) LIKE %s OR LOWER(about) LIKE %s)"
                    like = f'%{text}%'
                    params += [like, like, like]
                if city:
                    sql += " AND LOWER(city) LIKE %s"
                    params.append(f'%{city}%')
                if remote:
                    sql += " AND remote_ok = true"
                if relocate:
                    sql += " AND relocation = true"
                sql += " ORDER BY updated_at DESC LIMIT 100"
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()

                items = []
                for row in rows:
                    card = _public_card(row)
                    if paid:
                        # Оплаченный доступ: раскрываем личность кандидата.
                        # Просмотр НЕ записываем — это лишь список; отметка
                        # ставится, когда HR открывает конкретное резюме.
                        cur.execute(
                            f"SELECT name_ru, name_en, avatar_url, rating, verified "
                            f"FROM {SCHEMA}.providers WHERE slug = %s",
                            (f"provider-{row[0]}",),
                        )
                        p = cur.fetchone()
                        card['locked'] = False
                        card['name'] = {'ru': p[0], 'en': p[1]} if p else None
                        card['avatar'] = p[2] if p else None
                        card['rating'] = float(p[3]) if p and p[3] is not None else None
                        card['verified'] = bool(p[4]) if p else False
                        card['aboutTeaser'] = row[9] or ''
                    items.append(card)
                return _resp(200, {'items': items, 'paid': paid, 'total': len(items)})

            if kind == 'one':
                # Полное резюме с контактами — только за деньги.
                if not _hr_active(cur, user['id']):
                    return _resp(402, {'error': 'payment_required'})
                try:
                    target = int(esc((event.get('queryStringParameters') or {}).get('id'), 12) or 0)
                except ValueError:
                    return _resp(400, {'error': 'bad_id'})
                cur.execute(
                    f"SELECT position, employment, relocation, remote_ok, salary_from, "
                    f"salary_currency, experience_years, city, about, skills, education, "
                    f"history, contact_phone, contact_email FROM {SCHEMA}.resumes "
                    f"WHERE user_id = %s AND is_published = true",
                    (target,),
                )
                r = cur.fetchone()
                if not r:
                    return _resp(404, {'error': 'not_found'})
                cur.execute(
                    f"SELECT name_ru, name_en, avatar_url, rating, verified "
                    f"FROM {SCHEMA}.providers WHERE slug = %s",
                    (f"provider-{target}",),
                )
                p = cur.fetchone()

                # Отмечаем просмотр: кандидат должен видеть, кто им интересуется.
                cur.execute(
                    f"SELECT company FROM {SCHEMA}.hr_access WHERE user_id = %s",
                    (user['id'],),
                )
                comp = (cur.fetchone() or [''])[0] or user.get('name') or 'Компания'
                cur.execute(
                    f"INSERT INTO {SCHEMA}.resume_views (resume_user_id, viewer_user_id, viewer_company) "
                    f"VALUES (%s, %s, %s)",
                    (target, user['id'], comp[:200]),
                )
                notify_utils.push(
                    cur, target, 'community',
                    'Ваше резюме открыли',
                    f'Компания «{comp}» посмотрела ваше резюме.',
                    'dashboard',
                )
                conn.commit()

                return _resp(200, {'resume': {
                    'id': target,
                    'position': r[0], 'employment': r[1], 'relocation': bool(r[2]),
                    'remoteOk': bool(r[3]), 'salaryFrom': r[4], 'salaryCurrency': r[5],
                    'experienceYears': r[6], 'city': r[7], 'about': r[8],
                    'skills': [s for s in (r[9] or '').split('|') if s],
                    'education': r[10], 'history': r[11],
                    'contactPhone': decrypt_field(r[12] or ''),
                    'contactEmail': decrypt_field(r[13] or ''),
                    'name': {'ru': p[0], 'en': p[1]} if p else None,
                    'avatar': p[2] if p else None,
                    'rating': float(p[3]) if p and p[3] is not None else None,
                    'verified': bool(p[4]) if p else False,
                    'locked': False,
                }})

            return _resp(400, {'error': 'unknown kind'})

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = esc(body.get('action'), 30)

            if action == 'save':
                # Резюме заводит только исполнитель: клиенту оно ни к чему.
                if user.get('role') != 'provider':
                    return _resp(403, {'error': 'providers_only'})
                employment = esc(body.get('employment'), 40)
                if employment not in EMPLOYMENT:
                    employment = 'full'
                try:
                    salary = int(body.get('salaryFrom') or 0) or None
                except (TypeError, ValueError):
                    salary = None
                try:
                    exp = max(0, min(60, int(body.get('experienceYears') or 0)))
                except (TypeError, ValueError):
                    exp = 0
                skills = '|'.join([esc(s, 40) for s in (body.get('skills') or [])][:20])

                cur.execute(
                    f"INSERT INTO {SCHEMA}.resumes (user_id, is_published, position, employment, "
                    f"relocation, remote_ok, salary_from, salary_currency, experience_years, city, "
                    f"about, skills, education, history, contact_phone, contact_email, updated_at) "
                    f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now()) "
                    f"ON CONFLICT (user_id) DO UPDATE SET is_published = EXCLUDED.is_published, "
                    f"position = EXCLUDED.position, employment = EXCLUDED.employment, "
                    f"relocation = EXCLUDED.relocation, remote_ok = EXCLUDED.remote_ok, "
                    f"salary_from = EXCLUDED.salary_from, salary_currency = EXCLUDED.salary_currency, "
                    f"experience_years = EXCLUDED.experience_years, city = EXCLUDED.city, "
                    f"about = EXCLUDED.about, skills = EXCLUDED.skills, education = EXCLUDED.education, "
                    f"history = EXCLUDED.history, contact_phone = EXCLUDED.contact_phone, "
                    f"contact_email = EXCLUDED.contact_email, updated_at = now()",
                    (
                        user['id'], bool(body.get('isPublished')), esc(body.get('position'), 200),
                        employment, bool(body.get('relocation')), bool(body.get('remoteOk')),
                        salary, esc(body.get('salaryCurrency'), 8) or 'RUB', exp,
                        esc(body.get('city'), 120), esc(body.get('about'), 2000), skills,
                        esc(body.get('education'), 1500), esc(body.get('history'), 3000),
                        # Контакты кандидата шифруем: в базе они не должны
                        # лежать открытым текстом.
                        encrypt_field(esc(body.get('contactPhone'), 40)),
                        encrypt_field(esc(body.get('contactEmail'), 120)),
                    ),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'publish':
                if user.get('role') != 'provider':
                    return _resp(403, {'error': 'providers_only'})
                cur.execute(
                    f"UPDATE {SCHEMA}.resumes SET is_published = %s, updated_at = now() "
                    f"WHERE user_id = %s",
                    (bool(body.get('value')), user['id']),
                )
                conn.commit()
                return _resp(200, {'success': True})

            if action == 'set_company':
                cur.execute(
                    f"INSERT INTO {SCHEMA}.hr_access (user_id, company) VALUES (%s, %s) "
                    f"ON CONFLICT (user_id) DO UPDATE SET company = EXCLUDED.company, updated_at = now()",
                    (user['id'], esc(body.get('company'), 200)),
                )
                conn.commit()
                return _resp(200, {'success': True})

            return _resp(400, {'error': 'unknown action'})

        return _resp(405, {'error': 'method_not_allowed'})
    finally:
        cur.close()
        conn.close()
