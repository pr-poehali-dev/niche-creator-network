import json
import urllib.request
import urllib.parse

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

SUPPORTED = {'ru', 'en', 'fr', 'de', 'ja', 'ar', 'he'}

USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0 Safari/537.36'
)


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _google_translate_one(text, target_lang):
    '''Перевод одной строки через бесплатный публичный эндпоинт Google Translate.
       Без ключа и регистрации. Возвращает (перевод, detected_source) или (None, None).'''
    params = urllib.parse.urlencode({
        'client': 'gtx',
        'sl': 'auto',
        'tl': target_lang,
        'dt': 't',
        'q': text,
    })
    url = 'https://translate.googleapis.com/translate_a/single?' + params
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req, timeout=12) as r:
        data = json.loads(r.read().decode('utf-8'))
    # data[0] — массив сегментов перевода; data[2] — определённый исходный язык
    segments = data[0] or []
    translated = ''.join(seg[0] for seg in segments if seg and seg[0])
    detected = data[2] if len(data) > 2 else None
    if translated:
        return translated, detected
    return None, None


def handler(event: dict, context) -> dict:
    '''
    Business: автоматический перевод сообщений чатов, форума и личных диалогов
              на язык интерфейса пользователя. Бесплатный переводчик без ключа.
              Если перевод недоступен — возвращает оригиналы (translated=False),
              чтобы интерфейс не ломался.
    Args: event с httpMethod и body {texts: [...], target: 'en'}
    Returns: HTTP-ответ {items: [...], translated: bool}
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    if method != 'POST':
        return _resp(405, {'error': 'Method not allowed'})

    body = json.loads(event.get('body') or '{}')
    texts = body.get('texts') or []
    target = str(body.get('target') or 'en').lower()

    if not isinstance(texts, list) or not texts:
        return _resp(400, {'error': 'texts required'})
    if target not in SUPPORTED:
        return _resp(400, {'error': 'unsupported target'})

    texts = [str(t)[:2000] for t in texts][:50]

    items = []
    any_translated = False
    for text in texts:
        if not text.strip():
            items.append(text)
            continue
        try:
            translated, detected = _google_translate_one(text, target)
        except Exception:
            translated, detected = None, None
        if translated and detected and detected != target:
            items.append(translated)
            any_translated = True
        elif translated:
            # язык совпал с целевым — оставляем как есть
            items.append(text)
        else:
            items.append(text)

    return _resp(200, {'items': items, 'translated': any_translated})
