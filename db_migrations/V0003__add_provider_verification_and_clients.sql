-- Verification fields for providers
ALTER TABLE t_p50633472_niche_creator_networ.providers
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(200) DEFAULT '',
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(40) DEFAULT '',
  ADD COLUMN IF NOT EXISTS legal_status VARCHAR(20) DEFAULT '',
  ADD COLUMN IF NOT EXISTS license_info VARCHAR(300) DEFAULT '',
  ADD COLUMN IF NOT EXISTS registry_number VARCHAR(60) DEFAULT '',
  ADD COLUMN IF NOT EXISTS show_full_name BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_legal_status BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_license BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_registry BOOLEAN NOT NULL DEFAULT false;

-- Clients table
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.clients (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL DEFAULT '',
    phone VARCHAR(40) NOT NULL DEFAULT '',
    email VARCHAR(160) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Seed sample verification data for the active demo provider
UPDATE t_p50633472_niche_creator_networ.providers
SET full_name = 'Морозов Александр Сергеевич',
    passport_number = '4500 123456',
    legal_status = 'ip',
    license_info = 'Лицензия на полиграфологию № ПЛ-7701 от 12.03.2019',
    registry_number = 'ОГРНИП 319774600123456',
    show_full_name = true,
    show_legal_status = true,
    show_license = true,
    show_registry = true
WHERE slug = 'morozov';