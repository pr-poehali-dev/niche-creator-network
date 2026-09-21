-- Временная сессия администратора для проверки функции разбора документов
-- на реальных анкетах. Гасится сразу после теста следующей миграцией.
INSERT INTO t_p50633472_niche_creator_networ.sessions
    (token, user_id, expires_at, last_seen_at)
VALUES ('doccheck-temp-admin-session', 3, now() + interval '1 hour', now())
ON CONFLICT (token) DO UPDATE SET
    expires_at = now() + interval '1 hour',
    last_seen_at = now(),
    revoked = false;