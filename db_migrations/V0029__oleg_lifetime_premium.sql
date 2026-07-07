-- Пожизненный бесплатный Премиум для Олега (provider-6), все функции активны
UPDATE t_p50633472_niche_creator_networ.providers
SET plan = 'premium',
    subscription_active = true,
    subscription_until = DATE '2099-12-31',
    verified = true,
    license_verified = true,
    pin_priority = GREATEST(pin_priority, 100)
WHERE slug = 'provider-6';