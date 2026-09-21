-- Заключения автопроверки документов. Это ПОДСКАЗКА администратору,
-- а не решение: итоговую галочку «проверен» по-прежнему ставит человек.
-- Храним отдельно от анкеты, чтобы история проверок не терялась при
-- редактировании профиля.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.doc_checks (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL,
    verdict VARCHAR(16) NOT NULL DEFAULT 'review',
    score INTEGER NOT NULL DEFAULT 0,
    findings TEXT NOT NULL DEFAULT '[]',
    ai_used BOOLEAN NOT NULL DEFAULT false,
    ai_summary TEXT NOT NULL DEFAULT '',
    checked_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_checks_slug
    ON t_p50633472_niche_creator_networ.doc_checks (slug, checked_at DESC);