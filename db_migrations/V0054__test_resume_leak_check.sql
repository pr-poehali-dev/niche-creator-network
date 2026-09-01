-- Тестовое резюме для проверки: видны ли контакты без оплаты доступа.
-- Контакты намеренно НЕ шифруем — если утечка есть, она будет заметна
-- в ответе сервера открытым текстом.
INSERT INTO t_p50633472_niche_creator_networ.resumes
    (user_id, is_published, position, employment, city, experience_years,
     salary_from, about, skills, contact_phone, contact_email)
VALUES (5, true, 'ПРОВЕРКА УТЕЧКИ', 'full', 'Тестоград', 7, 150000,
        'Служебная запись для проверки защиты контактов.', 'проверка|защита',
        'PHONE-LEAK-CANARY', 'EMAIL-LEAK-CANARY')
ON CONFLICT (user_id) DO UPDATE SET
    is_published = true,
    position = EXCLUDED.position,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email;