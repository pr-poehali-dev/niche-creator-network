-- Вносим оплаченный платёж Алексея (provider-4) в историю платежей.
-- Тариф Старт, месяц, со скидкой 30% = 1393 ₽, оплата через ЮKassa.
INSERT INTO t_p50633472_niche_creator_networ.payments
  (slug, plan, period, amount, currency, status, provider, payment_id, payer_email)
VALUES
  ('provider-4', 'start', 'month', 1393.00, 'RUB', 'paid', 'yookassa',
   'manual-2026-07-05-provider4', '89133645748@mail.ru');