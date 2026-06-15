import json
import os
import urllib.request
import urllib.error

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

LANG_NAMES = {
    'ru': 'Russian', 'en': 'English', 'fr': 'French', 'de': 'German',
    'ja': 'Japanese', 'ar': 'Arabic', 'he': 'Hebrew',
}


def _resp(status, payload):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(payload, ensure_ascii=False)}


def _openai_translate(texts, target_lang):
    '''Переводит список строк на target_lang через OpenAI. Возвращает список переводов.'''
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return None
    target_name = LANG_NAMES.get(target_lang, 'English')
    numbered = '\n'.join(f'{i + 1}. {t}' for i, t in enumerate(texts))
    system = (
        'You are a professional translator for a security-industry platform. '
        f'Translate each numbered line into {target_name}. '
        'Keep the original meaning, tone and any names/usernames. '
        'If a line is already in the target language, return it unchanged. '
        'Return ONLY a JSON object of the form {"items": ["...", "..."]} '
        'with translations in the same order, no explanations.'
    )
    body = {
        'model': 'gpt-4o-mini',
        'temperature': 0.2,
        'response_format': {'type': 'json_object'},
        'messages': [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': numbered},
        ],
    }
    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        data=json.dumps(body).encode('utf-8'),
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read().decode('utf-8'))
    content = data['choices'][0]['message']['content']
    parsed = json.loads(content)
    items = parsed.get('items')
    if isinstance(items, list) and len(items) == len(texts):
        return [str(x) for x in items]
    return None


def handler(event: dict, context) -> dict:
    '''
    Business: автоматический перевод сообщений чатов, форума и личных диалогов
              на язык интерфейса пользователя. Если ключ перевода недоступен —
              возвращает оригиналы (translated=False), чтобы UI не ломался.
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
    if target not in LANG_NAMES:
        return _resp(400, {'error': 'unsupported target'})

    texts = [str(t)[:2000] for t in texts][:50]

    try:
        result = _openai_translate(texts, target)
    except Exception:
        result = None

    if result is None:
        return _resp(200, {'items': texts, 'translated': False})
    return _resp(200, {'items': result, 'translated': True})
