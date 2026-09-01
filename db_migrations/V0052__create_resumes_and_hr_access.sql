-- Резюме исполнителя: отдельная сущность, а не поля в анкете.
-- Так исполнитель остаётся обычным специалистом, а резюме — его личное
-- решение искать работу, которое можно выключить одним переключателем.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.resumes (
    user_id INTEGER PRIMARY KEY,
    is_published BOOLEAN NOT NULL DEFAULT false,
    position VARCHAR(200) NOT NULL DEFAULT '',
    employment VARCHAR(40) NOT NULL DEFAULT 'full',
    relocation BOOLEAN NOT NULL DEFAULT false,
    remote_ok BOOLEAN NOT NULL DEFAULT false,
    salary_from INTEGER NULL,
    salary_currency VARCHAR(8) NOT NULL DEFAULT 'RUB',
    experience_years INTEGER NOT NULL DEFAULT 0,
    city VARCHAR(120) NOT NULL DEFAULT '',
    about TEXT NOT NULL DEFAULT '',
    skills TEXT NOT NULL DEFAULT '',
    education TEXT NOT NULL DEFAULT '',
    history TEXT NOT NULL DEFAULT '',
    contact_phone TEXT NOT NULL DEFAULT '',
    contact_email TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_published
    ON t_p50633472_niche_creator_networ.resumes (is_published, updated_at DESC);

-- Платный доступ HR к базе резюме. Это НЕ роль пользователя: HR — обычный
-- клиент, купивший подписку. Поэтому регистрация и роли не меняются.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.hr_access (
    user_id INTEGER PRIMARY KEY,
    active BOOLEAN NOT NULL DEFAULT false,
    until DATE NULL,
    company VARCHAR(200) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Кто открывал резюме. Исполнитель видит компанию и дату — это его отдача
-- от площадки. Пишем только реально открытые (оплаченные) просмотры.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.resume_views (
    id SERIAL PRIMARY KEY,
    resume_user_id INTEGER NOT NULL,
    viewer_user_id INTEGER NOT NULL,
    viewer_company VARCHAR(200) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_views_target
    ON t_p50633472_niche_creator_networ.resume_views (resume_user_id, created_at DESC);