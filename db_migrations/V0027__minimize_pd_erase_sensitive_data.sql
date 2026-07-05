-- Минимизация ПДн: физически стираем содержимое чувствительных полей исполнителей,
-- которые больше не собираются и не отображаются (паспорт, ФИО, дата рождения,
-- реквизиты/ОГРН). Колонки остаются пустыми и в коде не используются.
UPDATE t_p50633472_niche_creator_networ.providers
SET passport_number = '',
    full_name = '',
    registry_number = '',
    birth_date = NULL,
    show_full_name = false,
    show_registry = false;