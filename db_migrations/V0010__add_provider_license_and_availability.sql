ALTER TABLE t_p50633472_niche_creator_networ.providers
  ADD COLUMN IF NOT EXISTS license_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone varchar(64) NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS always_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_start varchar(5) NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS quiet_end varchar(5) NULL DEFAULT '';