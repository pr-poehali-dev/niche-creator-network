-- Усиление безопасности сессий:
-- 1) fingerprint — отпечаток клиента (браузер + подсеть IP). Позволяет отклонить
--    украденный токен, если им пользуются с другого устройства.
-- 2) last_seen_at — время последней активности, для скользящего продления сессии.
-- 3) revoked — явный признак отзыва (выход со всех устройств, смена пароля).
-- 4) индексы — для быстрого отзыва всех сессий пользователя и чистки просроченных.
ALTER TABLE t_p50633472_niche_creator_networ.sessions
  ADD COLUMN IF NOT EXISTS fingerprint character varying(64),
  ADD COLUMN IF NOT EXISTS last_seen_at timestamp without time zone NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS revoked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_sessions_user_id
  ON t_p50633472_niche_creator_networ.sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON t_p50633472_niche_creator_networ.sessions (expires_at);

-- Обезвреживаем уже просроченные сессии явным признаком отзыва,
-- чтобы они не могли быть приняты ни при каких условиях.
UPDATE t_p50633472_niche_creator_networ.sessions
  SET revoked = true
  WHERE expires_at < now();