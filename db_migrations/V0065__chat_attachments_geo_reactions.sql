-- Вложения и геометки в сообщениях. Храним как отдельные колонки, а не
-- внутри текста: так вложение не потеряется при маскировке мата и не
-- сломает расшифровку, а старые сообщения продолжают работать как были.
--
-- attachments — JSON-массив [{type,url,name,size,w,h}]. Сами файлы лежат
-- в S3, в базе только ссылки. Координаты шифруем: местоположение человека
-- не менее чувствительно, чем текст переписки.
-- removed_at — мягкое скрытие сообщения автором (строка остаётся в базе).

ALTER TABLE t_p50633472_niche_creator_networ.direct_messages
    ADD COLUMN IF NOT EXISTS attachments TEXT NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS geo_lat TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS geo_lon TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS geo_label TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS reply_to INTEGER NULL,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP NULL;

ALTER TABLE t_p50633472_niche_creator_networ.chat_messages
    ADD COLUMN IF NOT EXISTS attachments TEXT NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS geo_lat TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS geo_lon TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS geo_label TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS reply_to INTEGER NULL,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP NULL;

-- Реакции смайликом на сообщение. Отдельная таблица, чтобы один человек
-- не мог поставить одну и ту же реакцию дважды (ограничение уникальности).
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.message_reactions (
    id SERIAL PRIMARY KEY,
    scope VARCHAR(8) NOT NULL DEFAULT 'dm',
    message_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uniq_reaction UNIQUE (scope, message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_reactions_msg
    ON t_p50633472_niche_creator_networ.message_reactions (scope, message_id);