-- Отметка о прочтении личных сообщений.
-- Хранится на самом сообщении: так «непрочитанное» считается одним запросом
-- и не требует отдельной таблицы состояний.
ALTER TABLE t_p50633472_niche_creator_networ.direct_messages
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_dm_unread
    ON t_p50633472_niche_creator_networ.direct_messages (to_id, read_at);

CREATE INDEX IF NOT EXISTS idx_dm_pair_created
    ON t_p50633472_niche_creator_networ.direct_messages (pair_key, created_at DESC);