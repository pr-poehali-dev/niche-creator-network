CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.password_resets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(128) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    requested_ip VARCHAR(64) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token
    ON t_p50633472_niche_creator_networ.password_resets (token_hash);

CREATE INDEX IF NOT EXISTS idx_password_resets_user
    ON t_p50633472_niche_creator_networ.password_resets (user_id, created_at DESC);