ALTER TABLE t_p50633472_niche_creator_networ.providers
  ADD COLUMN IF NOT EXISTS plan varchar(20) NOT NULL DEFAULT 'start';

UPDATE t_p50633472_niche_creator_networ.providers SET plan = 'premium' WHERE slug = 'morozov';
UPDATE t_p50633472_niche_creator_networ.providers SET plan = 'pro' WHERE slug = 'semenov';