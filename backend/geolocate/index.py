import json
import urllib.request
import urllib.error


def handler(event: dict, context) -> dict:
    '''
    Business: определяет город, страну и координаты пользователя по его IP-адресу.
    Args: event с httpMethod, requestContext.identity.sourceIp
    Returns: HTTP-ответ с city, country, countryCode, lat, lon
    '''
    method = event.get('httpMethod', 'GET')

    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    ip = ''
    rc = event.get('requestContext') or {}
    identity = rc.get('identity') or {}
    ip = identity.get('sourceIp') or ''

    headers = event.get('headers') or {}
    fwd = headers.get('X-Forwarded-For') or headers.get('x-forwarded-for') or ''
    if fwd:
        ip = fwd.split(',')[0].strip()

    result = {'city': '', 'country': '', 'countryCode': '', 'lat': None, 'lon': None, 'ip': ip}

    try:
        url = f'http://ip-api.com/json/{ip}?fields=status,country,countryCode,city,lat,lon'
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        if data.get('status') == 'success':
            result['city'] = data.get('city', '')
            result['country'] = data.get('country', '')
            result['countryCode'] = data.get('countryCode', '')
            result['lat'] = data.get('lat')
            result['lon'] = data.get('lon')
    except (urllib.error.URLError, ValueError, TimeoutError, OSError) as e:
        # Геолокация — вспомогательная: при недоступности внешнего сервиса
        # возвращаем пустой результат, не роняя запрос.
        print(f"[geolocate] lookup failed: {type(e).__name__}: {e}")

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps(result)}