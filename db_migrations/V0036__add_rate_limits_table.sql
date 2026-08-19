-- Ограничение частоты запросов (rate limiting) для защиты от массового
-- сканирования каталога ботами-парсерами и конкурентами.
-- Храним счётчики обращений по IP в скользящем окне.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.rate_limits (
  id bigserial PRIMARY KEY,
  bucket character varying(64) NOT NULL,
  ip character varying(64) NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON t_p50633472_niche_creator_networ.rate_limits (bucket, ip, created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_created
  ON t_p50633472_niche_creator_networ.rate_limits (created_at);