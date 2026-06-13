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
    cur.execute(
        f'SELECT slug, name_ru, name_en, title_ru, title_en, city_ru, city_en, '
        f'lat, lon, price_ru, price_en, rating, reviews, cases, experience, img, '
        f'tags_ru, tags_en, phone, email, whatsapp, telegram, website, '
        f'verified, subscription_active '
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
        }
        if active:
            item['name'] = {'ru': r[1], 'en': r[2]}
            item['img'] = r[15]
            item['contacts'] = {
                'phone': r[18],
                'email': r[19],
                'whatsapp': r[20],
                'telegram': r[21],
                'website': r[22],
            }
        else:
            # Обезличиваем: скрываем имя, фото и контакты
            item['name'] = {'ru': 'Профиль скрыт', 'en': 'Profile hidden'}
            item['img'] = None
            item['contacts'] = None
        providers.append(item)

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'providers': providers})}
