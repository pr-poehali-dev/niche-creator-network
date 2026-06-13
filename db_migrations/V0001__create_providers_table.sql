CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.providers (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) UNIQUE NOT NULL,
    name_ru VARCHAR(160) NOT NULL,
    name_en VARCHAR(160) NOT NULL,
    title_ru VARCHAR(160) NOT NULL,
    title_en VARCHAR(160) NOT NULL,
    city_ru VARCHAR(120) NOT NULL,
    city_en VARCHAR(120) NOT NULL,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    price_ru VARCHAR(80) NOT NULL,
    price_en VARCHAR(80) NOT NULL,
    rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
    reviews INTEGER NOT NULL DEFAULT 0,
    cases INTEGER NOT NULL DEFAULT 0,
    experience INTEGER NOT NULL DEFAULT 0,
    img TEXT,
    tags_ru TEXT NOT NULL DEFAULT '',
    tags_en TEXT NOT NULL DEFAULT '',
    phone VARCHAR(40),
    email VARCHAR(160),
    whatsapp VARCHAR(40),
    telegram VARCHAR(80),
    website VARCHAR(200),
    verified BOOLEAN NOT NULL DEFAULT true,
    subscription_active BOOLEAN NOT NULL DEFAULT true,
    subscription_until DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

INSERT INTO t_p50633472_niche_creator_networ.providers
(slug, name_ru, name_en, title_ru, title_en, city_ru, city_en, lat, lon, price_ru, price_en, rating, reviews, cases, experience, tags_ru, tags_en, phone, email, whatsapp, telegram, website, verified, subscription_active, subscription_until)
VALUES
('morozov', 'Александр Морозов', 'Alexander Morozov', 'Полиграфолог', 'Polygraph examiner', 'Москва', 'Moscow', 55.7558, 37.6173, 'от 8 000 ₽', 'from $90', 4.9, 134, 312, 12,
 'Полиграф|HR-проверки|Корпоративная безопасность', 'Polygraph|HR screening|Corporate security',
 '+74951234567', 'a.morozov@securenet.ru', '+74951234567', 'morozov_polygraph', 'https://securenet.ru/morozov', true, true, '2026-12-31'),
('vlasova', 'Елена Власова', 'Elena Vlasova', 'Частный детектив', 'Private investigator', 'Лондон', 'London', 51.5074, -0.1278, 'от 12 000 ₽', 'from $140', 4.8, 87, 198, 9,
 'Розыск|Наружное наблюдение|Сбор доказательств', 'Tracing|Surveillance|Evidence gathering',
 '+442071234567', 'e.vlasova@securenet.ru', '+442071234567', 'vlasova_pi', 'https://securenet.ru/vlasova', true, true, '2026-12-31'),
('semenov', 'Игорь Семёнов', 'Igor Semenov', 'Специалист по TSCM', 'TSCM specialist', 'Дубай', 'Dubai', 25.2048, 55.2708, 'от 25 000 ₽', 'from $280', 5.0, 62, 145, 15,
 'Поиск жучков|Контрразведка|Защита переговоров', 'Bug sweeping|Counterintelligence|Meeting protection',
 '+97141234567', 'i.semenov@securenet.ru', '+97141234567', 'semenov_tscm', 'https://securenet.ru/semenov', true, false, '2025-09-01');