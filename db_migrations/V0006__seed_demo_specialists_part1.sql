INSERT INTO t_p50633472_niche_creator_networ.providers
(slug, name_ru, name_en, title_ru, title_en, city_ru, city_en, lat, lon, price_ru, price_en, rating, reviews, cases, experience, img, tags_ru, tags_en, phone, email, whatsapp, telegram, website, verified, subscription_active, gender, age, bio, show_bio, show_age, licenses, show_license)
VALUES
('weber-berlin', 'Маркус Вебер', 'Markus Weber', 'Полиграфолог', 'Polygraph examiner', 'Берлин', 'Berlin', 52.5200, 13.4050, 'от 220 €', 'from €220', 4.9, 96, 210, 14,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/7ad3b230-2fec-4347-a4a7-4c4670578fee.jpg',
 'Полиграф|Проверки персонала|Расследования', 'Polygraph|Staff vetting|Investigations',
 '+493012345678', 'm.weber@example.com', '+493012345678', 'weber_polygraph', 'https://example.com/weber', true, true, 'm', 47,
 'Сертифицированный полиграфолог с опытом работы в крупных корпорациях ЕС. Специализация — корпоративные расследования и проверки при найме.', true, true,
 '["Сертификат APA №DE-2210"]'::jsonb, true),

('laurent-paris', 'Софи Лоран', 'Sophie Laurent', 'Частный детектив', 'Private investigator', 'Париж', 'Paris', 48.8566, 2.3522, 'от 180 €/день', 'from €180/day', 4.8, 74, 165, 11,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/a0c5bdd1-af25-466a-87a5-a01c0cedea17.jpg',
 'Розыск|Наблюдение|Супружеские дела', 'Tracing|Surveillance|Matrimonial',
 '+33123456789', 's.laurent@example.com', '+33123456789', 'laurent_pi', 'https://example.com/laurent', true, true, 'f', 39,
 'Лицензированный частный детектив (CNAPS). Специализируюсь на поиске людей и наружном наблюдении.', true, true,
 '["Лицензия CNAPS №FR-7741"]'::jsonb, true),

('brown-london', 'Джеймс Браун', 'James Brown', 'Специалист по TSCM', 'TSCM specialist', 'Лондон', 'London', 51.5074, -0.1278, 'от £300', 'from £300', 5.0, 58, 132, 16,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/fc0c15b9-2bf3-4932-b821-d76b3c5a8c55.jpg',
 'Поиск жучков|Контрнаблюдение|Защита переговоров', 'Bug sweeping|Counter-surveillance|Meeting protection',
 '+442079460000', 'j.brown@example.com', '+442079460000', 'brown_tscm', 'https://example.com/brown', true, true, 'm', 51,
 'TSCM-эксперт с военным прошлым. Защита переговорных и поиск технических средств съёма информации.', true, true,
 '[]'::jsonb, false),

('rossi-milan', 'Лука Росси', 'Luca Rossi', 'Корпоративная безопасность', 'Corporate security', 'Милан', 'Milan', 45.4642, 9.1900, 'от 200 €', 'from €200', 4.7, 51, 98, 10,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/340f6512-1962-4223-b3d5-6fc2ed133290.jpg',
 'Аудит безопасности|Комплаенс|Защита бизнеса', 'Security audit|Compliance|Business protection',
 '+390212345678', 'l.rossi@example.com', '+390212345678', 'rossi_security', 'https://example.com/rossi', true, true, 'm', 44,
 NULL, false, true, '[]'::jsonb, false),

('novak-prague', 'Ева Новакова', 'Eva Novakova', 'OSINT-аналитик', 'OSINT analyst', 'Прага', 'Prague', 50.0755, 14.4378, 'от 150 €', 'from €150', 4.9, 67, 140, 8,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/3ba11afe-cd6c-46af-836b-0d22e8dc209b.jpg',
 'OSINT|Проверка контрагентов|Цифровые расследования', 'OSINT|Counterparty checks|Digital investigations',
 '+420212345678', 'e.novakova@example.com', '+420212345678', 'novakova_osint', 'https://example.com/novakova', true, true, 'f', 34,
 'Аналитик открытых источников. Проверка компаний и физлиц, цифровой след, антифрод.', true, true,
 '[]'::jsonb, false),

('alqassimi-dubai', 'Халид Аль-Касими', 'Khalid Al-Qassimi', 'Личная охрана', 'Close protection', 'Дубай', 'Dubai', 25.2048, 55.2708, 'от $400/день', 'from $400/day', 5.0, 83, 175, 13,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/80551949-9652-4d71-93ba-f191d3e2bd5f.jpg',
 'Телохранитель|VIP-сопровождение|Оценка угроз', 'Bodyguard|VIP escort|Threat assessment',
 '+97142345678', 'k.alqassimi@example.com', '+97142345678', 'alqassimi_cp', 'https://example.com/alqassimi', true, true, 'm', 41,
 'Личная охрана первых лиц и публичных персон. Опыт работы на Ближнем Востоке и в Европе.', true, true,
 '[]'::jsonb, false),

('cohen-telaviv', 'Дэвид Коэн', 'David Cohen', 'Частный детектив', 'Private investigator', 'Тель-Авив', 'Tel Aviv', 32.0853, 34.7818, 'от $200', 'from $200', 4.8, 60, 128, 12,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/fc0c15b9-2bf3-4932-b821-d76b3c5a8c55.jpg',
 'Расследования|Поиск активов|Due diligence', 'Investigations|Asset tracing|Due diligence',
 '+97231234567', 'd.cohen@example.com', '+97231234567', 'cohen_pi', 'https://example.com/cohen', true, true, 'm', 46,
 NULL, false, false, '[]'::jsonb, false),

('garcia-madrid', 'Изабель Гарсия', 'Isabel Garcia', 'Полиграфолог', 'Polygraph examiner', 'Мадрид', 'Madrid', 40.4168, -3.7038, 'от 190 €', 'from €190', 4.7, 45, 89, 9,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/92040949-913f-4126-80f9-fa681d96ea82.jpg',
 'Полиграф|HR-проверки|Семейные дела', 'Polygraph|HR screening|Family matters',
 '+34912345678', 'i.garcia@example.com', '+34912345678', 'garcia_poly', 'https://example.com/garcia', true, true, 'f', 37,
 NULL, false, true, '[]'::jsonb, false),

('petrov-moscow', 'Андрей Петров', 'Andrey Petrov', 'Детектив по экономической безопасности', 'Economic security detective', 'Москва', 'Moscow', 55.7558, 37.6173, 'от 15 000 ₽', 'from $170', 4.9, 112, 240, 15,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/340f6512-1962-4223-b3d5-6fc2ed133290.jpg',
 'Экономическая безопасность|Проверка контрагентов|Антикоррупция', 'Economic security|Counterparty checks|Anti-corruption',
 '+74959876543', 'a.petrov@example.com', '+74959876543', 'petrov_econ', 'https://example.com/petrov', true, true, 'm', 49,
 'Финансовые расследования, проверка контрагентов и выявление корпоративного мошенничества.', true, true,
 '[]'::jsonb, false),

('schmidt-zurich', 'Анна Шмидт', 'Anna Schmidt', 'Кибер-форензика', 'Cyber forensics', 'Цюрих', 'Zurich', 47.3769, 8.5417, 'от 250 CHF', 'from CHF 250', 5.0, 71, 154, 10,
 'https://cdn.poehali.dev/projects/cdac7d00-bd0a-4bb7-a1b1-237a7708c061/files/3ba11afe-cd6c-46af-836b-0d22e8dc209b.jpg',
 'Цифровая криминалистика|Восстановление данных|Расследование утечек', 'Digital forensics|Data recovery|Breach investigation',
 '+41442345678', 'a.schmidt@example.com', '+41442345678', 'schmidt_forensics', 'https://example.com/schmidt', true, true, 'f', 36,
 'Цифровая криминалистика и расследование инцидентов ИБ. Экспертиза для судов.', true, true,
 '[]'::jsonb, false);