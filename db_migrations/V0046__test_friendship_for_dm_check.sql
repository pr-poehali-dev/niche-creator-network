-- Проверочная дружба между двумя реальными специалистами (4 и 5)
-- для сквозной проверки доступа к личной переписке.
INSERT INTO t_p50633472_niche_creator_networ.friendships
    (user_id_a, user_id_b, status, requested_by, responded_at)
VALUES (4, 5, 'accepted', 4, now())
ON CONFLICT (user_id_a, user_id_b) DO NOTHING;