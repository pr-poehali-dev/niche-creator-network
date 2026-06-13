-- Pseudonym + avatar + gender for providers
ALTER TABLE t_p50633472_niche_creator_networ.providers
  ADD COLUMN IF NOT EXISTS pseudonym VARCHAR(160) DEFAULT '',
  ADD COLUMN IF NOT EXISTS use_pseudonym BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'm';

-- Avatar + gender for clients
ALTER TABLE t_p50633472_niche_creator_networ.clients
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10) DEFAULT 'm';

-- Seed gender for demo providers
UPDATE t_p50633472_niche_creator_networ.providers SET gender = 'f' WHERE slug = 'vlasova';
UPDATE t_p50633472_niche_creator_networ.providers SET gender = 'm' WHERE slug IN ('morozov', 'semenov');