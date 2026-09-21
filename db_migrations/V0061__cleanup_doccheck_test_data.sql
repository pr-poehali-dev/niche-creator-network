-- Проверка завершена: тестовые анкеты помечаем служебными и вычищаем,
-- временную админскую сессию гасим. Записи проверок оставляем как историю.
UPDATE t_p50633472_niche_creator_networ.providers
SET is_demo = true,
    name_ru = '[служебная запись]',
    name_en = '[service record]',
    registry_number = '',
    full_name = '',
    licenses = '[]'::jsonb,
    documents = '[]'::jsonb
WHERE slug IN ('zz-test-fake', 'zz-test-good', 'zz-test-clone');

UPDATE t_p50633472_niche_creator_networ.sessions
SET revoked = true, expires_at = now() - interval '1 day'
WHERE token = 'doccheck-temp-admin-session';