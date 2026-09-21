-- Тестовые анкеты для проверки ИИ-администратора: поддельный номер,
-- клон существующей анкеты и корректные данные. Удаляются после теста.
INSERT INTO t_p50633472_niche_creator_networ.providers
    (slug, name_ru, name_en, title_ru, title_en, city_ru, city_en, country_ru, country_en,
     price_ru, price_en, tags_ru, tags_en, legal_status, registry_number, full_name,
     licenses, documents, is_demo)
VALUES
    ('zz-test-fake', 'Тест Подделка', 'Test Fake', 'Полиграфолог', 'Polygraph',
     'Москва', 'Moscow', 'Россия', 'Russia', '0', '0', '', '', 'ip',
     '1234567890123', 'Иванов Иван Иванович', '["тест"]'::jsonb, '[]'::jsonb, false),
    ('zz-test-good', 'Тест Честный', 'Test Good', 'Детектив', 'Detective',
     'Москва', 'Moscow', 'Россия', 'Russia', '0', '0', '', '', 'ip',
     '320222500068242', 'Петров Пётр Петрович',
     '["Лицензия ЧД № 77-123456 от 2024"]'::jsonb,
     '[{"title":"Скан лицензии","url":"https://example.com/1.pdf"}]'::jsonb, false),
    ('zz-test-clone', 'Тест Клон', 'Test Clone', 'Детектив', 'Detective',
     'Москва', 'Moscow', 'Россия', 'Russia', '0', '0', '', '', 'ip',
     '320222500068242', 'Петров Пётр Петрович', '[]'::jsonb, '[]'::jsonb, false)
ON CONFLICT (slug) DO UPDATE SET
    registry_number = EXCLUDED.registry_number,
    full_name = EXCLUDED.full_name,
    licenses = EXCLUDED.licenses,
    documents = EXCLUDED.documents;