-- Проверка завершена. Убираем всё служебное:
-- 1) гасим временную сессию,
-- 2) снимаем выданный на проверку HR-доступ,
-- 3) снимаем с публикации тестовое резюме и стираем его канареечные контакты,
-- 4) обезличиваем тестовую запись просмотра, чтобы она не пугала специалиста.
UPDATE t_p50633472_niche_creator_networ.sessions
SET revoked = true, expires_at = now() - interval '1 day'
WHERE token = 'leakcheck-temp-session-token';

UPDATE t_p50633472_niche_creator_networ.hr_access
SET active = false, until = NULL, company = ''
WHERE user_id = 2 AND company = 'Проверка доступа';

UPDATE t_p50633472_niche_creator_networ.resumes
SET is_published = false, position = '', about = '', skills = '',
    city = '', experience_years = 0, salary_from = NULL,
    contact_phone = '', contact_email = ''
WHERE user_id = 5 AND position = 'ПРОВЕРКА УТЕЧКИ';

UPDATE t_p50633472_niche_creator_networ.resume_views
SET viewer_company = 'Служебная проверка (можно игнорировать)'
WHERE viewer_company = 'Проверка доступа';