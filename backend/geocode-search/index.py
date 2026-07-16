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

# Типы объектов, которые нас интересуют: города, посёлки, регионы/области/штаты, страны.
ALLOWED_CLASSES = {'place', 'boundary'}
ALLOWED_TYPES = {
    'city', 'town', 'village', 'hamlet', 'municipality', 'county',
    'state', 'region', 'province', 'district', 'administrative',
    'country',
}


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    '''
    Business: подсказки городов, областей/штатов/провинций и стран по мере ввода текста —
              используется в поиске специалистов клиентом (автокомплит "Город"/"Страна").
              Бесплатный публичный геокодер Nominatim (OpenStreetMap), без ключа.
    Args: event с httpMethod, queryStringParameters {q: строка запроса, lang: ru|en}
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
    if lang not in ('ru', 'en'):
        lang = 'ru'

    if len(q) < 2:
        return _resp(200, {'items': []})

    query = urllib.parse.urlencode({
        'q': q,
        'format': 'jsonv2',
        'addressdetails': 1,
        'accept-language': lang,
        'limit': 8,
    })
    url = 'https://nominatim.openstreetmap.org/search?' + query
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    items = []
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read().decode('utf-8'))
        for row in data:
            osm_class = row.get('class') or ''
            osm_type = row.get('type') or ''
            if osm_class not in ALLOWED_CLASSES or osm_type not in ALLOWED_TYPES:
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
            items.append({
                'name': name,
                'region': region if region != name else '',
                'country': country,
                'countryCode': (addr.get('country_code') or '').upper(),
                'lat': float(row['lat']) if row.get('lat') else None,
                'lon': float(row['lon']) if row.get('lon') else None,
                'type': 'country' if osm_type == 'country' else ('region' if osm_type in ('state', 'region', 'province') else 'city'),
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
