import json
import urllib.request
import urllib.parse
import urllib.error

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}

USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0 Safari/537.36'
)

# Типы объектов, которые нас интересуют: города, посёлки, регионы/области/штаты/провинции, страны.
# Nominatim (jsonv2) отдаёт тип объекта в поле "addresstype" — это надёжнее,
# чем комбинация "class"/"type" (в jsonv2 класс лежит в "category").
CITY_TYPES = {'city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'borough'}
REGION_TYPES = {'state', 'region', 'province', 'county', 'state_district', 'territory'}
COUNTRY_TYPES = {'country'}

# Поле "Город" ищет города и области/штаты/провинции (специалист может быть
# зарегистрирован не в самом городе, а в области — поэтому регионы тоже нужны).
# Поле "Страна" ищет только страны — без городов и регионов.
CITY_FIELD_TYPES = CITY_TYPES | REGION_TYPES
COUNTRY_FIELD_TYPES = COUNTRY_TYPES

SUPPORTED_LANGS = {'ru', 'en', 'fr', 'de', 'ja', 'ar', 'he'}


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    '''
    Business: подсказки городов/областей/штатов/провинций (поле "Город") или только
              стран (поле "Страна") по мере ввода текста — автокомплит в поиске
              специалистов клиентом. Бесплатный публичный геокодер Nominatim
              (OpenStreetMap), без ключа. Поддерживает все языки интерфейса сайта,
              чтобы результат переводился на язык пользователя независимо от того,
              на каком языке страну/город ищут (например, японец ищет город в Германии).
    Args: event с httpMethod, queryStringParameters {q: строка запроса, lang: ru|en|fr|de|ja|ar|he,
          field: city|country — что подсказывать}
    Returns: HTTP-ответ {items: [{name, region, country, countryCode, lat, lon, type}]}
    '''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    if method != 'GET':
        return _resp(405, {'error': 'Method not allowed'})

    params = event.get('queryStringParameters') or {}
    q = (params.get('q') or '').strip()[:200]
    lang = (params.get('lang') or 'ru').strip().lower()
    if lang not in SUPPORTED_LANGS:
        lang = 'ru'
    field = (params.get('field') or 'city').strip().lower()
    if field not in ('city', 'country'):
        field = 'city'
    allowed_types = COUNTRY_FIELD_TYPES if field == 'country' else CITY_FIELD_TYPES

    if len(q) < 2:
        return _resp(200, {'items': []})

    query_params = {
        'q': q,
        'format': 'jsonv2',
        'addressdetails': 1,
        'accept-language': lang,
        'limit': 8,
    }
    if field == 'country':
        # Ограничиваем геокодер только странами — так подсказки для поля
        # «Страна» никогда не содержат города или регионы.
        query_params['featuretype'] = 'country'
    query = urllib.parse.urlencode(query_params)
    url = 'https://nominatim.openstreetmap.org/search?' + query
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    items = []
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode('utf-8'))
        for row in data:
            addr_type = row.get('addresstype') or row.get('type') or ''
            if addr_type not in allowed_types:
                continue
            addr = row.get('address') or {}
            name = (
                addr.get('city') or addr.get('town') or addr.get('village')
                or addr.get('municipality') or addr.get('state')
                or addr.get('country') or row.get('name') or ''
            )
            region = addr.get('state') or addr.get('region') or addr.get('county') or ''
            country = addr.get('country') or ''
            if not name:
                continue
            if addr_type in COUNTRY_TYPES:
                item_type = 'country'
            elif addr_type in REGION_TYPES:
                item_type = 'region'
            else:
                item_type = 'city'
            items.append({
                'name': name,
                'region': region if region != name else '',
                'country': country,
                'countryCode': (addr.get('country_code') or '').upper(),
                'lat': float(row['lat']) if row.get('lat') else None,
                'lon': float(row['lon']) if row.get('lon') else None,
                'type': item_type,
            })
    except (urllib.error.URLError, ValueError, TimeoutError, OSError, KeyError) as e:
        # Геокодер — вспомогательный сервис: при сбое просто возвращаем пустой список,
        # чтобы клиент мог продолжить вводить город/страну вручную.
        print(f"[geocode-search] lookup failed: {type(e).__name__}: {e}")
        return _resp(200, {'items': []})

    # Убираем дубликаты по (name, region, country)
    seen = set()
    unique = []
    for it in items:
        key = (it['name'].lower(), it['region'].lower(), it['country'].lower())
        if key in seen:
            continue
        seen.add(key)
        unique.append(it)

    return _resp(200, {'items': unique})