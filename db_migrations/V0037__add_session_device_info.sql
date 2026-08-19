-- Журнал входов: чтобы пользователь сам видел, откуда заходили в его аккаунт,
-- и мог вовремя заметить чужую активность.
-- Храним минимум: тип устройства/браузер и усечённый IP (без последнего октета),
-- чтобы показать «примерное место» и при этом не накапливать лишние
-- персональные данные.
ALTER TABLE t_p50633472_niche_creator_networ.sessions
  ADD COLUMN IF NOT EXISTS device_label character varying(120),
  ADD COLUMN IF NOT EXISTS ip_masked character varying(64);