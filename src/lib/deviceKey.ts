/**
 * Привязка сессии к устройству через невыгружаемый криптоключ.
 *
 * Зачем: токен входа лежит в localStorage, и вредоносный скрипт теоретически
 * может его прочитать. Раньше украденный токен работал бы у злоумышленника.
 * Теперь каждый запрос дополнительно подписывается закрытым ключом, который
 * браузер создаёт с флагом extractable: false — выгрузить его нельзя в
 * принципе, даже из кода самой страницы. Украденный токен без подписи
 * сервер отклоняет.
 *
 * Ключ хранится в IndexedDB (localStorage не умеет хранить объекты CryptoKey).
 */

const DB_NAME = "shchit_device";
const STORE = "keys";
const KEY_ID = "signing_key";

type KeyPairRecord = { privateKey: CryptoKey; publicKey: CryptoKey };

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<KeyPairRecord | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as KeyPairRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: KeyPairRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function supported(): boolean {
  return (
    typeof indexedDB !== "undefined" &&
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.generateKey === "function"
  );
}

let cached: KeyPairRecord | null = null;
let pending: Promise<KeyPairRecord | null> | null = null;

/**
 * Возвращает ключевую пару устройства, создавая её при первом обращении.
 * null — если браузер не поддерживает нужные возможности (тогда работаем
 * по-старому, только с токеном: защита не хуже прежней).
 */
async function getKeyPair(): Promise<KeyPairRecord | null> {
  if (cached) return cached;
  if (pending) return pending;
  if (!supported()) return null;

  pending = (async () => {
    try {
      const db = await idb();
      const existing = await idbGet(db, KEY_ID);
      if (existing?.privateKey) {
        cached = existing;
        return existing;
      }
      // extractable: false — закрытый ключ нельзя выгрузить из браузера
      // ни через exportKey, ни любым другим способом.
      const pair = (await crypto.subtle.generateKey(
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign", "verify"],
      )) as CryptoKeyPair;
      const rec: KeyPairRecord = { privateKey: pair.privateKey, publicKey: pair.publicKey };
      await idbPut(db, KEY_ID, rec);
      cached = rec;
      return rec;
    } catch {
      // Приватный режим, отключённый IndexedDB и т.п. — не ломаем вход.
      return null;
    } finally {
      pending = null;
    }
  })();

  return pending;
}

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Открытый ключ устройства в формате JWK — отправляется серверу при входе,
 * чтобы тот мог проверять подписи. Открытый ключ не секрет.
 */
export async function getDevicePublicKey(): Promise<string | null> {
  const pair = await getKeyPair();
  if (!pair) return null;
  try {
    const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
    return JSON.stringify({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y });
  } catch {
    return null;
  }
}

/**
 * Подпись запроса меткой времени: доказывает, что запрос сделан с того же
 * устройства, где выполнен вход, а не с чужой машины украденным токеном.
 */
export async function signRequest(): Promise<{ sig: string; ts: string } | null> {
  const pair = await getKeyPair();
  if (!pair) return null;
  try {
    // Подписываем метку времени. Этого достаточно, чтобы доказать: запрос
    // идёт с устройства, где выполнен вход. Путь намеренно не подписываем —
    // по дороге через прокси он может отличаться, и честный вход ломался бы.
    const ts = String(Date.now());
    const payload = new TextEncoder().encode(ts);
    const sig = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      pair.privateKey,
      payload,
    );
    return { sig: b64url(sig), ts };
  } catch {
    return null;
  }
}

/** Удаляет ключ устройства — например, при выходе из аккаунта. */
export async function clearDeviceKey(): Promise<void> {
  cached = null;
  if (!supported()) return;
  try {
    const db = await idb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* noop */
  }
}
