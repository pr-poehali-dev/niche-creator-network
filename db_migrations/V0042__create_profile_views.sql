CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.profile_views (
    id SERIAL PRIMARY KEY,
    provider_slug VARCHAR(64) NOT NULL,
    viewer_hash VARCHAR(64) NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'catalog',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_slug_date
    ON t_p50633472_niche_creator_networ.profile_views (provider_slug, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_views_unique_day
    ON t_p50633472_niche_creator_networ.profile_views (provider_slug, viewer_hash, (created_at::date));