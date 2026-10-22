CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    UNIQUE (blocker_id, blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON t_p50633472_niche_creator_networ.user_blocks (blocked_id);

CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.skill_endorsements (
    id SERIAL PRIMARY KEY,
    endorser_id integer NOT NULL,
    target_id integer NOT NULL,
    skill varchar(80) NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    UNIQUE (endorser_id, target_id, skill)
);
CREATE INDEX IF NOT EXISTS idx_endorse_target ON t_p50633472_niche_creator_networ.skill_endorsements (target_id);

ALTER TABLE t_p50633472_niche_creator_networ.users ADD COLUMN IF NOT EXISTS last_seen_at timestamp NULL;
ALTER TABLE t_p50633472_niche_creator_networ.users ADD COLUMN IF NOT EXISTS show_online boolean NOT NULL DEFAULT true;