-- Проверка отметок завершена: служебное сообщение скрываем, временную
-- дружбу отменяем, сессии гасим. Строки не удаляем — только обезличиваем.
UPDATE t_p50633472_niche_creator_networ.direct_messages
SET removed_at = now(), text = '', attachments = '[]',
    geo_lat = '', geo_lon = '', geo_label = ''
WHERE pair_key = 'u4:u5' AND removed_at IS NULL;

UPDATE t_p50633472_niche_creator_networ.friendships
SET status = 'declined', responded_at = now()
WHERE user_id_a = 4 AND user_id_b = 5;

UPDATE t_p50633472_niche_creator_networ.sessions
SET revoked = true, expires_at = now() - interval '1 day'
WHERE token IN ('readcheck-user-a', 'readcheck-user-b');