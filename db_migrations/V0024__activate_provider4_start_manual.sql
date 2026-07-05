-- Ручная активация оплаченной подписки Алексея (provider-4), тариф Старт, 1 месяц.
-- Оплата прошла в ЮKassa, но webhook не был настроен — активируем вручную.
UPDATE t_p50633472_niche_creator_networ.providers
SET subscription_active = true,
    plan = 'start',
    subscription_until = (CURRENT_DATE + INTERVAL '30 days')
WHERE slug = 'provider-4';