-- История платежей исполнителей: реальные оплаты подписок через ЮKassa/Paddle.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.payments (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  plan VARCHAR(20) NOT NULL,
  period VARCHAR(10) NOT NULL DEFAULT 'month',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
  status VARCHAR(20) NOT NULL DEFAULT 'paid',
  provider VARCHAR(20) NOT NULL DEFAULT 'yookassa',
  payment_id VARCHAR(200),
  payer_email VARCHAR(200),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_slug ON t_p50633472_niche_creator_networ.payments (slug, created_at DESC);