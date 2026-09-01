-- Тестовый платёж занял номер в журнале обработанных, хотя проверку
-- подлинности не проходил. Переименовываем, чтобы освободить номер:
-- удалять записи о платежах нельзя, это финансовый журнал.
UPDATE t_p50633472_niche_creator_networ.processed_payments
SET payment_id = payment_id || '-void-testdata'
WHERE payment_id LIKE 'unverifiable-%'
  AND payment_id NOT LIKE '%-void-testdata';