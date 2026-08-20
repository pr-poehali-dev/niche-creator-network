'''
Проверка подписи устройства.

Браузер подписывает каждый запрос закрытым ключом, который нельзя выгрузить
из устройства. Здесь мы проверяем эту подпись открытым ключом, сохранённым
при входе. Если токен украли и предъявили с другой машины — подписи не будет
(или она не сойдётся), и сессия отклоняется.
'''

import base64
import json
import time

try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import ec, utils as asym_utils
    from cryptography.exceptions import InvalidSignature
    CRYPTO_OK = True
except ImportError:  # библиотека недоступна — проверку не выполняем
    CRYPTO_OK = False

# Допустимый разбег времени между устройством и сервером.
# Заодно ограничивает повторное использование перехваченной подписи.
MAX_SKEW_SEC = 300


def _b64url_decode(s: str) -> bytes:
    s = s.strip().replace('-', '+').replace('_', '/')
    pad = (-len(s)) % 4
    return base64.b64decode(s + '=' * pad)


def load_public_key(jwk_json: str):
    '''Восстанавливает открытый ключ устройства из сохранённого JWK.'''
    if not CRYPTO_OK or not jwk_json:
        return None
    try:
        jwk = json.loads(jwk_json)
        if jwk.get('kty') != 'EC' or jwk.get('crv') != 'P-256':
            return None
        x = int.from_bytes(_b64url_decode(jwk['x']), 'big')
        y = int.from_bytes(_b64url_decode(jwk['y']), 'big')
        return ec.EllipticCurvePublicNumbers(x, y, ec.SECP256R1()).public_key()
    except (ValueError, KeyError, TypeError):
        return None


def verify(jwk_json: str, signature_b64: str, ts: str) -> bool:
    '''
    True — подпись верна и свежая. Проверяем ровно то, что подписал браузер:
    метку времени.
    '''
    if not CRYPTO_OK:
        return False
    pub = load_public_key(jwk_json)
    if pub is None or not signature_b64 or not ts:
        return False

    # Свежесть: старую подпись повторно не примем.
    try:
        sent_ms = int(ts)
    except (TypeError, ValueError):
        return False
    if abs(time.time() * 1000 - sent_ms) > MAX_SKEW_SEC * 1000:
        return False

    try:
        raw = _b64url_decode(signature_b64)
        # WebCrypto отдаёт подпись как r||s по 32 байта; cryptography ждёт DER.
        if len(raw) != 64:
            return False
        r = int.from_bytes(raw[:32], 'big')
        s = int.from_bytes(raw[32:], 'big')
        der = asym_utils.encode_dss_signature(r, s)
        payload = str(ts).encode()
        pub.verify(der, payload, ec.ECDSA(hashes.SHA256()))
        return True
    except (InvalidSignature, ValueError, TypeError):
        return False
