-- Временно включаем HR-доступ тестовому клиенту, чтобы убедиться:
-- после оплаты контакты действительно открываются, а просмотр
-- записывается кандидату. Доступ снимается следующей миграцией.
INSERT INTO t_p50633472_niche_creator_networ.hr_access (user_id, active, until, company)
VALUES (2, true, CURRENT_DATE + 1, 'Проверка доступа')
ON CONFLICT (user_id) DO UPDATE SET
    active = true, until = CURRENT_DATE + 1, company = 'Проверка доступа';