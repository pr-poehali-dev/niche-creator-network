ALTER TABLE t_p50633472_niche_creator_networ.providers
  ADD COLUMN IF NOT EXISTS country_ru varchar(120) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country_en varchar(120) NOT NULL DEFAULT '';

UPDATE t_p50633472_niche_creator_networ.providers SET country_ru='Россия', country_en='Russia' WHERE city_en IN ('Moscow') AND country_en='';
UPDATE t_p50633472_niche_creator_networ.providers SET country_ru='ОАЭ', country_en='UAE' WHERE city_en IN ('Dubai') AND country_en='';
UPDATE t_p50633472_niche_creator_networ.providers SET country_ru='Великобритания', country_en='United Kingdom' WHERE city_en IN ('London') AND country_en='';