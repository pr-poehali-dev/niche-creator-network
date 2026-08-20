import json
import os
import re
import psycopg2
from crypto_utils import decrypt_field
from auth_utils import get_auth_user
from rate_limit import check_and_count

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def _price_value(price_str):
    '''Достаёт число из строки цены вида "от 8 000 ₽" или "from $90".'''
    if not price_str:
        return None
    digits = re.sub(r'[^\d]', '', str(price_str))
    if not digits:
        return None
    try:
        return int(digits)
    except ValueError:
        return None


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
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    # Личные контакты специалистов (телефон, email, мессенджеры) отдаём ТОЛЬКО
    # авторизованным пользователям. Иначе конкурент или бот-парсер выгружает всю
    # базу контактов одним запросом. Гостю карточка видна целиком, но вместо
    # контактов он получает признак contactsLocked и предложение войти.
    viewer = get_auth_user(event)
    contacts_allowed = viewer is not None

    # Защита от массового выкачивания каталога. Обычный посетитель загружает
    # список считанные разы за сессию; парсеру нужны сотни обращений подряд.
    # Лимит намеренно щедрый, чтобы не мешать живым пользователям.
    if not check_and_count(event, 'providers', limit=60, window_sec=60):
        return {
            'statusCode': 429,
            'headers': {**cors, 'Retry-After': '60'},
            'body': json.dumps({'error': 'too_many_requests'}),
        }

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
        f'licenses, documents, bio, age, show_bio, show_age, show_documents, '
        f'license_verified, timezone, always_available, quiet_start, quiet_end, '
        f'plan, country_ru, country_en, services, is_demo '
        # Сортировка каталога. Ключевое изменение: анкеты с ЗАПОЛНЕННЫМ
        # профилем идут выше пустых, даже если у пустой оплачена подписка.
        # Иначе витрина открывается карточками без специализации и цены —
        # клиент видит «пустой каталог» и уходит, а платящий специалист
        # всё равно не получает заказ. Внутри заполненных приоритет платных
        # тарифов сохраняется полностью.
        f"FROM {SCHEMA}.providers ORDER BY "
        f"(CASE WHEN COALESCE(title_ru,'') <> '' AND COALESCE(price_ru,'') <> '' THEN 0 ELSE 1 END), "
        f"pin_priority DESC, subscription_active DESC, "
        f"(CASE WHEN plan='chop' THEN 0 WHEN plan='premium' THEN 1 WHEN plan='pro' THEN 2 ELSE 3 END), rating DESC, reviews DESC"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    providers = []
    # key -> {'value': int, 'ru': str, 'en': str} минимальная цена по услуге
    service_min = {}
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
            # Витринный образец, а не живой специалист. Фронт помечает такие
            # карточки явно, чтобы человек не пытался с ними связаться.
            'isDemo': bool(r[53]),
            'active': active,
            'gender': r[36] or 'm',
            'plan': (r[49] or 'start'),
            'country': {'ru': r[50] or '', 'en': r[51] or ''},
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
            if contacts_allowed:
                item['contacts'] = {
                    'phone': decrypt_field(r[18]),
                    'email': decrypt_field(r[19]),
                    'whatsapp': decrypt_field(r[20]),
                    'telegram': decrypt_field(r[21]),
                    'website': r[22],
                }
                item['contactsLocked'] = False
            else:
                # Гость: сайт остаётся полезным (профиль, рейтинг, услуги видны),
                # но личные данные специалиста не утекают к парсерам.
                item['contacts'] = None
                item['contactsLocked'] = True
            # Публичная верификация: только поля с включённой видимостью.
            # Номер паспорта не отдаётся никогда.
            licenses_raw = r[37] if isinstance(r[37], list) else (json.loads(r[37]) if r[37] else [])
            documents_raw = r[38] if isinstance(r[38], list) else (json.loads(r[38]) if r[38] else [])
            public_verification = {}
            if bool(r[30]) and r[26]:
                public_verification['legalStatus'] = r[26]
            if bool(r[31]):
                # Несколько лицензий + поддержка старого одиночного поля
                lic_list = [str(x).strip() for x in licenses_raw if str(x).strip()]
                if not lic_list and (r[27] or '').strip():
                    lic_list = [r[27].strip()]
                if lic_list:
                    public_verification['licenses'] = lic_list
            if bool(r[43]) and documents_raw:
                docs = []
                for d in documents_raw:
                    if isinstance(d, dict):
                        title = str(d.get('title', '')).strip()
                        url = str(d.get('url', '')).strip()
                        if title or url:
                            docs.append({'title': title, 'url': url})
                if docs:
                    public_verification['documents'] = docs
            if bool(r[41]) and (r[39] or '').strip():
                public_verification['bio'] = r[39].strip()
            services_raw = r[52] if isinstance(r[52], list) else (json.loads(r[52]) if r[52] else [])
            svc_list = []
            for x in services_raw:
                if isinstance(x, dict):
                    k = str(x.get('key', '')).strip()
                    pr = str(x.get('price', '')).strip()
                else:
                    k = str(x).strip()
                    pr = ''
                if not k:
                    continue
                svc_list.append({'key': k, 'price': pr})
                # Накапливаем минимальную цену по услуге среди активных исполнителей
                val = _price_value(pr)
                if val is not None:
                    cur_min = service_min.get(k)
                    if cur_min is None or val < cur_min['value']:
                        service_min[k] = {'value': val, 'price': pr}
            if svc_list:
                public_verification['services'] = svc_list
            item['verification'] = public_verification or None
            # Возраст показываем, если включена видимость
            item['age'] = r[40] if (bool(r[42]) and r[40]) else None
            # Доступность для звонков
            item['timezone'] = (r[45] or '').strip() or None
            item['alwaysAvailable'] = bool(r[46])
            item['quietStart'] = (r[47] or '').strip() or None
            item['quietEnd'] = (r[48] or '').strip() or None
            # Бейдж «Лицензия»: полная верификация + подтверждённая лицензия + ИП/ООО
            lic_all = [str(x).strip() for x in licenses_raw if str(x).strip()]
            if not lic_all and (r[27] or '').strip():
                lic_all = [r[27].strip()]
            org_status = (r[26] or '').strip().lower()
            is_org = org_status in ('ip', 'company', 'ооо', 'ип', 'llc')
            item['licenseVerified'] = bool(r[44])
            item['licensed'] = bool(r[44]) and bool(r[23]) and bool(lic_all) and is_org
            if item['licensed']:
                vv = item.get('verification') or {}
                vv.setdefault('licenses', lic_all)
                vv['legalStatus'] = r[26]
                item['verification'] = vv
        else:
            # Обезличиваем: скрываем имя, фото, контакты и верификацию
            item['name'] = {'ru': 'Профиль скрыт', 'en': 'Profile hidden'}
            item['img'] = None
            item['contacts'] = None
            item['verification'] = None
            item['age'] = None
        providers.append(item)

    service_prices = {k: v['price'] for k, v in service_min.items()}

    # Честная статистика для главной страницы: считаем по фактическим данным,
    # а не показываем красивые выдуманные числа. Лучше скромные настоящие
    # цифры, чем громкие выдуманные — на них строится доверие к платформе.
    # В статистику идут только настоящие специалисты: витринные образцы
    # не должны надувать цифры — иначе это снова обман посетителя.
    active_list = [p for p in providers if p.get('active') and not p.get('isDemo')]
    countries = {
        (p.get('country') or {}).get('ru')
        for p in providers
        if p.get('active') and (p.get('country') or {}).get('ru')
    }
    # География считается по всему активному каталогу, включая образцы:
    # это честно описывает охват направлений платформы.
    shown = [p for p in providers if p.get('active')]
    cities = {
        (p.get('city') or {}).get('ru')
        for p in shown
        if (p.get('city') or {}).get('ru')
    }
    verified_count = sum(1 for p in active_list if p.get('verified'))
    stats = {
        'specialists': len(active_list),
        'verified': verified_count,
        'countries': len(countries),
        'cities': len(cities),
        'services': len(service_prices),
    }

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({'providers': providers, 'servicePrices': service_prices, 'stats': stats}),
    }