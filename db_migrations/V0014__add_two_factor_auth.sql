CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.two_factor_codes (
  id SERIAL PRIMARY KEY,
  challenge_id varchar(64) NOT NULL UNIQUE,
  user_id integer NOT NULL,
  code_hash varchar(128) NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_2fa_challenge ON t_p50633472_niche_creator_networ.two_factor_codes(challenge_id);

ALTER TABLE t_p50633472_niche_creator_networ.users
  ADD COLUMN IF NOT EXISTS twofa_enabled boolean NOT NULL DEFAULT true;