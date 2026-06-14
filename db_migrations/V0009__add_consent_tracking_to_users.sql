ALTER TABLE t_p50633472_niche_creator_networ.users
  ADD COLUMN IF NOT EXISTS consent_accepted_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS consent_version varchar(20),
  ADD COLUMN IF NOT EXISTS consent_ip varchar(64);