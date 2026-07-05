-- Поле приоритета закрепления: чем больше, тем выше в списке (0 = обычный).
ALTER TABLE t_p50633472_niche_creator_networ.providers
  ADD COLUMN IF NOT EXISTS pin_priority integer NOT NULL DEFAULT 0;

-- Дата "навсегда" для бесплатных вечных подписок.
-- Алексей (provider-4): Премиум навсегда + закрепление на первой позиции.
UPDATE t_p50633472_niche_creator_networ.providers
SET plan = 'premium',
    subscription_active = true,
    subscription_until = DATE '2099-12-31',
    pin_priority = 1000
WHERE slug = 'provider-4';

-- Владимир (provider-5): Про навсегда.
UPDATE t_p50633472_niche_creator_networ.providers
SET plan = 'pro',
    subscription_active = true,
    subscription_until = DATE '2099-12-31',
    pin_priority = 0
WHERE slug = 'provider-5';