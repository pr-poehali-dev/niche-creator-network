-- Уведомления пользователей (колокольчик) + настройка дублирования на почту.

CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(40) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    link VARCHAR(80) NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON t_p50633472_niche_creator_networ.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON t_p50633472_niche_creator_networ.notifications (user_id, is_read);

-- Настройки уведомлений пользователя. email_enabled = дублировать на почту.
CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.notification_prefs (
    user_id INTEGER PRIMARY KEY,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);