import json
import os
import re
import urllib.request
import urllib.error
from datetime import datetime

import psycopg2
from crypto_utils import decrypt_field

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
}


def _resp(status, body):
    return {'statusCode': status, 'headers': CORS, 'body': json.dumps(body, ensure_ascii=False), 'isBase64Encoded': False}


def _is_admin(cur, token):
    if not token:
        return False
    cur.execute(
        f"SELECT u.is_admin, s.expires_at, s.revoked FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,),
    )
    row = cur.fetchone()
    if not row or row[2] or row[1] < datetime.utcnow():
        return False
    return bool(row[0])


# ---------- Математические проверки реквизитов ----------
# Контрольные суммы ИНН и ОГРН считаются по формулам ФНС. Выдуманный номер
# почти никогда их не проходит — это отсекает большинство подделок
# бесплатно и мгновенно, ещё до всякого ИИ.

def _inn_valid(v: str) -> bool:
    d = [int(c) for c in v if c.isdigit()]
    if len(d) == 10:
        w = [2, 4, 10, 3, 5, 9, 4, 6, 8]
        return d[9] == sum(a * b for a, b in zip(w, d[:9])) % 11 % 10
    if len(d) == 12:
        w1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
        w2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
        return (d[10] == sum(a * b for a, b in zip(w1, d[:10])) % 11 % 10
                and d[11] == sum(a * b for a, b in zip(w2, d[:11])) % 11 % 10)
    return False


def _ogrn_valid(v: str) -> bool:
    d = ''.join(c for c in v if c.isdigit())
    if len(d) == 13:
        return int(d[12]) == int(d[:12]) % 11 % 10
    if len(d) == 15:  # ОГРНИП
        return int(d[14]) == int(d[:14]) % 13 % 10
    return False


def _check_registry(reg: str, legal_status: str, findings: list) -> int:
    '''Проверяет ОГРН/ОГРНИП/ИНН. Возвращает вклад в общий балл.'''
    digits = ''.join(c for c in reg if c.isdigit())
    if not digits:
        findings.append({'level': 'warn', 'text': 'Регистрационный номер не указан — проверить вручную по документам.'})
        return 0

    # Заглушки вроде «000000000000» или «111111111111» формально проходят
    # контрольную сумму, поэтому отсекаем их раньше формулы.
    if len(set(digits)) <= 2:
        findings.append({'level': 'fail', 'text': 'Регистрационный номер состоит из повторяющихся цифр — это заглушка.'})
        return -40

    if len(digits) in (13, 15):
        if _ogrn_valid(digits):
            kind = 'ОГРНИП' if len(digits) == 15 else 'ОГРН'
            findings.append({'level': 'ok', 'text': f'{kind} прошёл проверку контрольной суммы.'})
            # ОГРНИП у юрлица (и наоборот) — типичная путаница либо подделка.
            if legal_status == 'company' and len(digits) == 15:
                findings.append({'level': 'warn', 'text': 'Указан ОГРНИП (для ИП), но статус — юрлицо. Уточнить.'})
                return 15
            if legal_status == 'ip' and len(digits) == 13:
                findings.append({'level': 'warn', 'text': 'Указан ОГРН (для юрлица), но статус — ИП. Уточнить.'})
                return 15
            return 30
        findings.append({'level': 'fail', 'text': 'ОГРН не проходит проверку контрольной суммы — номер недействителен.'})
        return -40

    if len(digits) in (10, 12):
        if _inn_valid(digits):
            findings.append({'level': 'ok', 'text': 'ИНН прошёл проверку контрольной суммы.'})
            return 25
        findings.append({'level': 'fail', 'text': 'ИНН не проходит проверку контрольной суммы — номер недействителен.'})
        return -40

    findings.append({'level': 'fail', 'text': f'Номер из {len(digits)} цифр не похож ни на ИНН, ни на ОГРН.'})
    return -25


def _check_licenses(licenses: list, findings: list) -> int:
    '''Формальная проверка лицензий: наличие номера, явные заглушки.'''
    if not licenses:
        findings.append({'level': 'warn', 'text': 'Лицензии не указаны.'})
        return 0
    score = 0
    junk = re.compile(r'^(тест|test|123|000|—|-|нет|no)\s*$', re.I)
    for lic in licenses[:10]:
        s = str(lic).strip()
        if junk.match(s) or len(s) < 5:
            findings.append({'level': 'fail', 'text': f'Лицензия «{s[:40]}» выглядит как заглушка, а не как реальный документ.'})
            score -= 20
            continue
        if not re.search(r'\d', s):
            findings.append({'level': 'warn', 'text': f'В лицензии «{s[:40]}» нет номера — проверить вручную.'})
            continue
        findings.append({'level': 'ok', 'text': f'Лицензия указана с номером: {s[:60]}'})
        score += 15
    return min(score, 30)


def _check_duplicates(cur, slug: str, reg: str, full_name: str, findings: list) -> int:
    '''
    Один и тот же ОГРН или ФИО в нескольких анкетах — признак клона
    или попытки обойти блокировку. Сравниваем по расшифрованным значениям.
    '''
    if not reg and not full_name:
        return 0
    cur.execute(
        f"SELECT slug, registry_number, full_name FROM {SCHEMA}.providers "
        f"WHERE slug <> %s AND (registry_number <> '' OR full_name <> '')",
        (slug,),
    )
    hits = []
    reg_d = ''.join(c for c in reg if c.isdigit())
    fio_n = ' '.join(full_name.lower().split())
    for other_slug, o_reg, o_fio in cur.fetchall():
        o_reg_d = ''.join(c for c in decrypt_field(o_reg or '') if c.isdigit())
        o_fio_n = ' '.join(decrypt_field(o_fio or '').lower().split())
        if reg_d and o_reg_d and reg_d == o_reg_d:
            hits.append(f'{other_slug} (тот же номер)')
        elif fio_n and o_fio_n and fio_n == o_fio_n:
            hits.append(f'{other_slug} (то же ФИО)')
    if hits:
        findings.append({'level': 'fail', 'text': 'Совпадение с другими анкетами: ' + ', '.join(hits[:5])})
        return -35
    findings.append({'level': 'ok', 'text': 'Совпадений с другими анкетами не найдено.'})
    return 15


def _check_documents(docs: list, findings: list) -> int:
    if not docs:
        findings.append({'level': 'warn', 'text': 'Скан-копии документов не загружены.'})
        return 0
    findings.append({'level': 'ok', 'text': f'Загружено файлов: {len(docs)}.'})
    return 10


def _check_name(full_name: str, findings: list) -> int:
    fio = ' '.join((full_name or '').split())
    if not fio:
        findings.append({'level': 'warn', 'text': 'ФИО не указано.'})
        return 0
    parts = [p for p in fio.split(' ') if len(p) > 1]
    if len(parts) < 2:
        findings.append({'level': 'warn', 'text': 'ФИО указано не полностью.'})
        return 0
    if re.search(r'\d|(.)\1{3,}', fio) or re.match(r'^(тест|test|asd|qwe)', fio, re.I):
        findings.append({'level': 'fail', 'text': 'ФИО похоже на случайный набор символов.'})
        return -30
    findings.append({'level': 'ok', 'text': 'ФИО заполнено корректно.'})
    return 15


# ---------- ИИ-анализ сканов ----------

def _ai_review(provider: dict, findings: list):
    '''
    Разбор документов языковой моделью. Работает, только если задан ключ
    OPENAI_API_KEY. В модель уходят НЕ сканы и НЕ паспортные данные, а
    обезличенная сводка: что за статус, сколько документов, какие лицензии.
    Передавать персональные данные во внешний сервис нельзя (152-ФЗ).
    '''
    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return False, ''

    summary = {
        'legal_status': provider.get('legal_status') or 'не указан',
        'licenses': [str(x)[:80] for x in (provider.get('licenses') or [])][:10],
        'documents_titles': [str(d.get('title', ''))[:80] for d in (provider.get('documents') or [])][:10],
        'specialty': provider.get('title') or '',
        'country': provider.get('country') or '',
        'registry_length': len(''.join(c for c in (provider.get('registry') or '') if c.isdigit())),
        'auto_findings': [f['text'] for f in findings],
    }
    prompt = (
        'Ты помощник администратора площадки специалистов по безопасности. '
        'Проверь непротиворечивость заявки на верификацию по сводке ниже. '
        'Персональных данных в сводке нет намеренно. Оцени: соответствуют ли '
        'названия лицензий заявленной специальности и стране, нет ли противоречий '
        'между статусом и документами, нет ли признаков выдуманных названий. '
        'Ответь строго JSON: {"risk":"low|medium|high","summary":"2-3 предложения по-русски",'
        '"questions":["что уточнить у специалиста"]}\n\nСводка: '
        + json.dumps(summary, ensure_ascii=False)
    )
    payload = {
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.2,
        'max_tokens': 400,
        'response_format': {'type': 'json_object'},
    }
    try:
        req = urllib.request.Request(
            'https://api.openai.com/v1/chat/completions',
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'},
            method='POST',
        )
        raw = urllib.request.urlopen(req, timeout=25).read()
        content = json.loads(raw)['choices'][0]['message']['content']
        data = json.loads(content)
        risk = str(data.get('risk', 'medium'))
        text = str(data.get('summary', ''))[:800]
        for q in (data.get('questions') or [])[:4]:
            findings.append({'level': 'warn', 'text': 'ИИ предлагает уточнить: ' + str(q)[:160]})
        return True, f'[риск: {risk}] {text}'
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError, KeyError, TimeoutError) as e:
        print(f'[doc-check] ai review failed: {type(e).__name__}')
        return False, ''


def _run_check(cur, slug: str) -> dict:
    cur.execute(
        f"SELECT legal_status, registry_number, full_name, licenses, license_info, "
        f"documents, title_ru, country_ru, verified, license_verified "
        f"FROM {SCHEMA}.providers WHERE slug = %s",
        (slug,),
    )
    row = cur.fetchone()
    if not row:
        return None

    legal_status = row[0] or ''
    registry = decrypt_field(row[1] or '')
    full_name = decrypt_field(row[2] or '')
    licenses = row[3] if isinstance(row[3], list) else (json.loads(row[3]) if row[3] else [])
    if not licenses and (row[4] or '').strip():
        licenses = [row[4].strip()]
    documents = row[5] if isinstance(row[5], list) else (json.loads(row[5]) if row[5] else [])

    findings = []
    score = 50  # нейтральный старт: заявка не виновата и не безупречна
    score += _check_name(full_name, findings)
    score += _check_registry(registry, legal_status, findings)
    score += _check_licenses(licenses, findings)
    score += _check_duplicates(cur, slug, registry, full_name, findings)
    score += _check_documents(documents, findings)

    ai_used, ai_summary = _ai_review({
        'legal_status': legal_status, 'licenses': licenses, 'documents': documents,
        'title': row[6], 'country': row[7], 'registry': registry,
    }, findings)

    score = max(0, min(100, score))

    # «Чисто» — только когда проверять действительно было что. Раньше анкета
    # без ФИО и без регистрационного номера набирала проходной балл на одних
    # лицензиях и помечалась зелёной: администратор доверился бы подсказке и
    # пропустил пустую заявку. Отсутствие данных — это не чистота, а «нечего
    # проверять».
    has_identity = bool(' '.join((full_name or '').split()))
    has_registry = bool(''.join(c for c in registry if c.isdigit()))

    if any(f['level'] == 'fail' for f in findings):
        verdict = 'risk'
    elif not (has_identity and has_registry):
        verdict = 'review'
        findings.append({
            'level': 'warn',
            'text': 'Недостаточно данных для заключения: нужны ФИО и регистрационный номер. Проверка вручную обязательна.',
        })
        score = min(score, 55)
    elif score >= 80:
        verdict = 'clean'
    else:
        verdict = 'review'

    cur.execute(
        f"INSERT INTO {SCHEMA}.doc_checks (slug, verdict, score, findings, ai_used, ai_summary) "
        f"VALUES (%s, %s, %s, %s, %s, %s)",
        (slug, verdict, score, json.dumps(findings, ensure_ascii=False), ai_used, ai_summary),
    )
    return {'slug': slug, 'verdict': verdict, 'score': score,
            'findings': findings, 'aiUsed': ai_used, 'aiSummary': ai_summary}


def handler(event: dict, context) -> dict:
    '''
    Business: ИИ-администратор проверяет документы исполнителей и выдаёт
              заключение для человека: контрольные суммы ИНН/ОГРН, поиск
              клонов анкет, формальная проверка лицензий и разбор сводки
              языковой моделью. Итоговое решение о допуске принимает
              администратор — автоматически статус «проверен» не ставится.
    Args: event с httpMethod, headers (X-Auth-Token администратора),
          body {action: 'check', slug} либо GET ?slug= для последнего заключения.
    Returns: HTTP-ответ с вердиктом, баллом и списком находок.
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if not _is_admin(cur, token):
            return _resp(403, {'error': 'forbidden'})

        if method == 'GET':
            # Последние заключения по всем анкетам — для списка в админке.
            cur.execute(
                f"SELECT DISTINCT ON (slug) slug, verdict, score, findings, ai_used, ai_summary, checked_at "
                f"FROM {SCHEMA}.doc_checks ORDER BY slug, checked_at DESC"
            )
            items = {}
            for r in cur.fetchall():
                items[r[0]] = {
                    'verdict': r[1], 'score': r[2],
                    'findings': json.loads(r[3] or '[]'),
                    'aiUsed': bool(r[4]), 'aiSummary': r[5],
                    'checkedAt': r[6].isoformat() if r[6] else None,
                }
            return _resp(200, {'checks': items})

        body = json.loads(event.get('body') or '{}')
        action = str(body.get('action') or 'check')

        if action == 'check':
            slug = str(body.get('slug') or '').strip()[:64]
            if not slug:
                return _resp(400, {'error': 'slug_required'})
            result = _run_check(cur, slug)
            if result is None:
                return _resp(404, {'error': 'provider_not_found'})
            conn.commit()
            return _resp(200, result)

        if action == 'check_all':
            # Массовая проверка: полезно после наплыва заявок.
            cur.execute(
                f"SELECT slug FROM {SCHEMA}.providers WHERE is_demo IS NOT TRUE ORDER BY slug LIMIT 50"
            )
            slugs = [r[0] for r in cur.fetchall()]
            results = []
            for s in slugs:
                r = _run_check(cur, s)
                if r:
                    results.append({'slug': s, 'verdict': r['verdict'], 'score': r['score']})
            conn.commit()
            return _resp(200, {'checked': len(results), 'results': results})

        return _resp(400, {'error': 'unknown_action'})
    finally:
        cur.close()
        conn.close()