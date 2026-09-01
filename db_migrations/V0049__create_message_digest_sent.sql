-- Лог писем о непрочитанных сообщениях: защита от повторной отправки.
-- Одному человеку — не чаще одного письма в сутки, даже если функция
-- по расписанию отработает несколько раз.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.message_digest_sent (
    user_id INTEGER NOT NULL,
    sent_on DATE NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, sent_on)
);