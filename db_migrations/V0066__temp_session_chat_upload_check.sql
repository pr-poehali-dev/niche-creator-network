-- Временная сессия для проверки загрузки вложений в чат.
-- Гасится следующей миграцией сразу после теста.
INSERT INTO t_p50633472_niche_creator_networ.sessions
    (token, user_id, expires_at, last_seen_at)
VALUES ('chatupload-temp-check', 4, now() + interval '30 minutes', now())
ON CONFLICT (token) DO UPDATE SET
    expires_at = now() + interval '30 minutes',
    last_seen_at = now(),
    revoked = false;