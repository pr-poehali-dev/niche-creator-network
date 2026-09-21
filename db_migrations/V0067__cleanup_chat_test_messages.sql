-- Проверка чата завершена: служебные сообщения скрываем (строки остаются
-- как история), временную сессию гасим.
UPDATE t_p50633472_niche_creator_networ.chat_messages
SET removed_at = now(), text = '', attachments = '[]',
    geo_lat = '', geo_lon = '', geo_label = ''
WHERE room = 'general'
  AND author_id = 'u4'
  AND created_at > now() - interval '2 hours'
  AND removed_at IS NULL;

UPDATE t_p50633472_niche_creator_networ.sessions
SET revoked = true, expires_at = now() - interval '1 day'
WHERE token = 'chatupload-temp-check';