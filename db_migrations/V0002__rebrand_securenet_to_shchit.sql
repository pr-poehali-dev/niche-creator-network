UPDATE t_p50633472_niche_creator_networ.providers
SET email = REPLACE(email, '@securenet.ru', '@shchit.ru'),
    website = REPLACE(website, 'securenet.ru', 'shchit.ru')
WHERE email LIKE '%securenet.ru%' OR website LIKE '%securenet.ru%';