-- Временная сессия специалиста: нужна, чтобы посмотреть кабинет глазами
-- пользователя и проверить новые блоки анкеты. Гасится следующей миграцией.
INSERT INTO t_p50633472_niche_creator_networ.sessions
    (token, user_id, expires_at, last_seen_at)
VALUES ('uxcheck-provider-temp', 4, now() + interval '40 minutes', now())
ON CONFLICT (token) DO UPDATE SET
    expires_at = now() + interval '40 minutes',
    last_seen_at = now(),
    revoked = false;