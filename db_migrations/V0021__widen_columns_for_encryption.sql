-- Расширяем поля, где будут храниться зашифрованные значения (base64 Fernet-токен длиннее оригинала)
ALTER TABLE t_p50633472_niche_creator_networ.providers
    ALTER COLUMN phone TYPE text,
    ALTER COLUMN email TYPE text,
    ALTER COLUMN whatsapp TYPE text,
    ALTER COLUMN telegram TYPE text,
    ALTER COLUMN full_name TYPE text,
    ALTER COLUMN passport_number TYPE text,
    ALTER COLUMN registry_number TYPE text;

ALTER TABLE t_p50633472_niche_creator_networ.clients
    ALTER COLUMN phone TYPE text,
    ALTER COLUMN email TYPE text,
    ALTER COLUMN full_name TYPE text;

ALTER TABLE t_p50633472_niche_creator_networ.direct_messages
    ALTER COLUMN text TYPE text;
