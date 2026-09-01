-- Проверка завершена: служебное сообщение помечаем прочитанным,
-- чтобы оно не висело у специалиста как новое.
UPDATE t_p50633472_niche_creator_networ.direct_messages
SET read_at = now()
WHERE from_name = 'Проверка' AND text = '[служебная проверка рассылки]';

-- Журнал отправки очищаем, чтобы тестовое письмо не блокировало
-- настоящее уведомление этому специалисту сегодня.
UPDATE t_p50633472_niche_creator_networ.message_digest_sent
SET sent_on = DATE '2000-01-01'
WHERE user_id = 5 AND sent_on = CURRENT_DATE;