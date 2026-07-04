CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.login_attempts (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(200) NOT NULL,
    ip VARCHAR(64) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time
    ON t_p50633472_niche_creator_networ.login_attempts (identifier, created_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
    ON t_p50633472_niche_creator_networ.login_attempts (ip, created_at);
