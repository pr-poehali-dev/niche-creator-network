-- Создаём профили providers для уже зарегистрированных исполнителей,
-- у которых записи не было (регистрация раньше не создавала профиль).
-- Берём id и имя из users, slug формируем как provider-{id}.
INSERT INTO t_p50633472_niche_creator_networ.providers
  (slug, name_ru, name_en, title_ru, title_en, city_ru, city_en,
   price_ru, price_en, tags_ru, tags_en, country_ru, country_en,
   verified, subscription_active, plan)
SELECT
  'provider-' || u.id,
  COALESCE(NULLIF(u.name, ''), 'Специалист'),
  COALESCE(NULLIF(u.name, ''), 'Specialist'),
  '', '', '', '', '', '', '', '', '', '',
  false, false, 'start'
FROM t_p50633472_niche_creator_networ.users u
WHERE u.role = 'provider'
  AND NOT EXISTS (
    SELECT 1 FROM t_p50633472_niche_creator_networ.providers p
    WHERE p.slug = 'provider-' || u.id
  );