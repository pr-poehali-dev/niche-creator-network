import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def handler(event: dict, context) -> dict:
    '''
    Business: возвращает список исполнителей с контактами. Если тариф не оплачен,
              карточка обезличивается (скрываются имя, контакты, фото).
    Args: event с httpMethod
    Returns: HTTP-ответ со списком исполнителей
    '''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    # ВНИМАНИЕ: passport_number НИКОГДА не выбираем в публичный ответ.
    cur.execute(
        f'SELECT slug, name_ru, name_en, title_ru, title_en, city_ru, city_en, '
        f'lat, lon, price_ru, price_en, rating, reviews, cases, experience, img, '
        f'tags_ru, tags_en, phone, email, whatsapp, telegram, website, '
        f'verified, subscription_active, '
        f'full_name, legal_status, license_info, registry_number, '
        f'show_full_name, show_legal_status, show_license, show_registry, '
        f'pseudonym, use_pseudonym, avatar_url, gender, '
        f'licenses, documents, bio, age, show_bio, show_age, show_documents '
        f'FROM {SCHEMA}.providers ORDER BY subscription_active DESC, rating DESC, reviews DESC'
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    providers = []
    for r in rows:
        active = bool(r[24])
        item = {
            'slug': r[0],
            'title': {'ru': r[3], 'en': r[4]},
            'city': {'ru': r[5], 'en': r[6]},
            'lat': r[7],
            'lon': r[8],
            'price': {'ru': r[9], 'en': r[10]},
            'rating': float(r[11]),
            'reviews': r[12],
            'cases': r[13],
            'experience': r[14],
            'tags': {
                'ru': [t for t in (r[16] or '').split('|') if t],
                'en': [t for t in (r[17] or '').split('|') if t],
            },
            'verified': bool(r[23]),
            'active': active,
            'gender': r[36] or 'm',
        }
        if active:
            use_pseudonym = bool(r[34])
            pseudonym = (r[33] or '').strip()
            if use_pseudonym and pseudonym:
                item['name'] = {'ru': pseudonym, 'en': pseudonym}
                item['isPseudonym'] = True
            else:
                item['name'] = {'ru': r[1], 'en': r[2]}
                item['isPseudonym'] = False
            item['img'] = (r[35] or '').strip() or r[15]
            item['contacts'] = {
                'phone': r[18],
                'email': r[19],
                'whatsapp': r[20],
                'telegram': r[21],
                'website': r[22],
            }
            # Публичная верификация: только поля с включённой видимостью.
            # Номер паспорта не отдаётся никогда.
            licenses_raw = r[37] if isinstance(r[37], list) else (json.loads(r[37]) if r[37] else [])
            documents_raw = r[38] if isinstance(r[38], list) else (json.loads(r[38]) if r[38] else [])
            public_verification = {}
            if bool(r[29]) and r[25]:
                public_verification['fullName'] = r[25]
            if bool(r[30]) and r[26]:
                public_verification['legalStatus'] = r[26]
            if bool(r[31]):
                # Несколько лицензий + поддержка старого одиночного поля
                lic_list = [str(x).strip() for x in licenses_raw if str(x).strip()]
                if not lic_list and (r[27] or '').strip():
                    lic_list = [r[27].strip()]
                if lic_list:
                    public_verification['licenses'] = lic_list
            if bool(r[32]) and r[28]:
                public_verification['registry'] = r[28]
            if bool(r[43]) and documents_raw:
                docs = [{'title': str(d.get('title', '')).strip()} for d in documents_raw if isinstance(d, dict) and str(d.get('title', '')).strip()]
                if docs:
                    public_verification['documents'] = docs
            if bool(r[41]) and (r[39] or '').strip():
                public_verification['bio'] = r[39].strip()
            item['verification'] = public_verification or None
            # Возраст показываем, если включена видимость
            item['age'] = r[40] if (bool(r[42]) and r[40]) else None
        else:
            # Обезличиваем: скрываем имя, фото, контакты и верификацию
            item['name'] = {'ru': 'Профиль скрыт', 'en': 'Profile hidden'}
            item['img'] = None
            item['contacts'] = None
            item['verification'] = None
            item['age'] = None
        providers.append(item)

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'providers': providers})}