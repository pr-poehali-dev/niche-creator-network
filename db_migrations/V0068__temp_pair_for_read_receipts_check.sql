-- Временная пара друзей и две сессии: нужны, чтобы проверить отметки
-- «доставлено» и «прочитано» в живой переписке. Снимается следующей миграцией.
INSERT INTO t_p50633472_niche_creator_networ.friendships
    (user_id_a, user_id_b, status, requested_by, responded_at)
VALUES (4, 5, 'accepted', 4, now())
ON CONFLICT (user_id_a, user_id_b) DO UPDATE SET status = 'accepted', responded_at = now();

INSERT INTO t_p50633472_niche_creator_networ.sessions
    (token, user_id, expires_at, last_seen_at)
VALUES ('readcheck-user-a', 4, now() + interval '30 minutes', now()),
       ('readcheck-user-b', 5, now() + interval '30 minutes', now())
ON CONFLICT (token) DO UPDATE SET
    expires_at = now() + interval '30 minutes',
    last_seen_at = now(),
    revoked = false;