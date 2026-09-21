-- Проверка интерфейса завершена — временную админскую сессию гасим.
UPDATE t_p50633472_niche_creator_networ.sessions
SET revoked = true, expires_at = now() - interval '1 day'
WHERE token IN ('doccheck-ui-temp-session', 'doccheck-temp-admin-session');