import os
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken


def _get_fernet() -> Fernet:
    '''Строит ключ Fernet (AES-128-CBC + HMAC-SHA256) из секрета ENCRYPTION_KEY проекта.'''
    raw = os.environ.get('ENCRYPTION_KEY', '')
    if not raw:
        raise RuntimeError('ENCRYPTION_KEY is not configured')
    digest = hashlib.sha256(raw.encode('utf-8')).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_field(value: str) -> str:
    '''Шифрует строку. Пустые значения не шифруются (остаются пустой строкой).'''
    if not value:
        return ''
    f = _get_fernet()
    token = f.encrypt(value.encode('utf-8'))
    return token.decode('utf-8')


def decrypt_field(value: str) -> str:
    '''
    Расшифровывает строку. Если значение не похоже на зашифрованный токен
    (например, старые данные, сохранённые до включения шифрования) —
    возвращает исходную строку как есть, чтобы не ломать отображение.
    '''
    if not value:
        return ''
    try:
        f = _get_fernet()
        return f.decrypt(value.encode('utf-8')).decode('utf-8')
    except (InvalidToken, ValueError, TypeError):
        return value
