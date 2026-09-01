-- Проверка завершена: тестовую дружбу переводим в 'declined',
-- чтобы она не давала реальным аккаунтам доступ к переписке.
UPDATE t_p50633472_niche_creator_networ.friendships
SET status = 'declined', responded_at = now()
WHERE user_id_a = 4 AND user_id_b = 5 AND status = 'accepted';