-- Демонстрационные профили: честная пометка вместо ложного знака «проверено».
-- Настоящие специалисты имеют slug вида provider-N (создаются при регистрации).
-- Все остальные профили — витринные образцы, добавленные вручную для показа
-- возможностей платформы.
ALTER TABLE t_p50633472_niche_creator_networ.providers
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

UPDATE t_p50633472_niche_creator_networ.providers
  SET is_demo = true
  WHERE slug NOT LIKE 'provider-%';

-- Снимаем знак «Документы проверены» с образцов: этот знак — главная ценность
-- платформы безопасности, и он не должен стоять на выдуманном человеке.
UPDATE t_p50633472_niche_creator_networ.providers
  SET verified = false
  WHERE is_demo = true;