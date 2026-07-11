-- Учёт уникальных просмотров задачи специалистами.
-- Один специалист (provider_slug) считается один раз на задачу.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.request_views (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL,
    provider_slug VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (request_id, provider_slug)
);

CREATE INDEX IF NOT EXISTS idx_request_views_req
    ON t_p50633472_niche_creator_networ.request_views (request_id);