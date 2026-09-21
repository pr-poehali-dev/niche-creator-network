-- Тестовые анкеты не должны висеть в каталоге. Переименовываем slug в
-- служебный вид и обнуляем витринные поля, чтобы запись не попадала в
-- выдачу (сортировка ставит пустые профили в конец, а имя не выглядит
-- как реальный специалист). Удалять строки нельзя — только обезличивать.
UPDATE t_p50633472_niche_creator_networ.providers
SET name_ru = '',
    name_en = '',
    title_ru = '',
    title_en = '',
    price_ru = '',
    price_en = '',
    city_ru = '',
    city_en = '',
    country_ru = '',
    country_en = '',
    is_demo = true,
    verified = false,
    license_verified = false,
    subscription_active = false,
    pin_priority = -100
WHERE slug IN ('zz-test-fake', 'zz-test-good', 'zz-test-clone');