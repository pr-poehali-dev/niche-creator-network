CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client',
    name VARCHAR(200) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p50633472_niche_creator_networ.users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON t_p50633472_niche_creator_networ.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON t_p50633472_niche_creator_networ.users(email);