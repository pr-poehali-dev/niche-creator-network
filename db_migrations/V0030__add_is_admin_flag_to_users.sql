-- Добавляем явный флаг администратора вместо небезопасной проверки по email-паттерну.
-- Это защищает от повышения привилегий: права админа теперь определяются
-- отдельным полем в БД, а не структурой email-адреса.
ALTER TABLE t_p50633472_niche_creator_networ.users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Переносим текущих служебных администраторов на новый флаг.
UPDATE t_p50633472_niche_creator_networ.users
  SET is_admin = true
  WHERE email LIKE 'admin+%@shchit.local';