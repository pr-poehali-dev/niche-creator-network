-- Проверочный код восстановления для тестового аккаунта (сквозная проверка сценария).
INSERT INTO t_p50633472_niche_creator_networ.password_resets
    (user_id, token_hash, expires_at, requested_ip)
VALUES
    (13, '6d47ef84b35c34fe3b88c12cb07aa6bf8d680b4668c4968ce21ac83b9c00eb3f',
     now() + interval '30 minutes', 'test');