-- Кейсы (портфолио) исполнителей. Хранятся на сервере, привязка по slug исполнителя.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.provider_cases (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT '',
    category VARCHAR(120) NOT NULL DEFAULT '',
    views INTEGER NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_provider_cases_slug ON t_p50633472_niche_creator_networ.provider_cases (slug);