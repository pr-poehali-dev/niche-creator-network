-- Тестовое непрочитанное сообщение 5-часовой давности для проверки
-- отбора получателей письма. Текст служебный.
INSERT INTO t_p50633472_niche_creator_networ.direct_messages
    (pair_key, from_id, from_name, to_id, text, created_at, read_at)
VALUES ('u4:u5', 'u4', 'Проверка', 'u5',
        '[служебная проверка рассылки]', now() - interval '5 hours', NULL);