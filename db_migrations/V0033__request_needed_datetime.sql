-- Дата/время, когда клиенту нужна услуга, для заявок.
ALTER TABLE t_p50633472_niche_creator_networ.client_requests
    ADD COLUMN IF NOT EXISTS needed_date DATE NULL,
    ADD COLUMN IF NOT EXISTS needed_time VARCHAR(5) NULL DEFAULT '';