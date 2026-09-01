-- Временная тестовая сессия клиента (без оплаченного HR-доступа), чтобы
-- проверить: не отдаются ли контакты кандидатов без оплаты.
INSERT INTO t_p50633472_niche_creator_networ.sessions
    (token, user_id, expires_at, last_seen_at)
VALUES ('leakcheck-temp-session-token', 2, now() + interval '1 hour', now())
ON CONFLICT (token) DO UPDATE SET
    expires_at = now() + interval '1 hour',
    last_seen_at = now(),
    revoked = false;