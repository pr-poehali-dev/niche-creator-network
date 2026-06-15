CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.chat_messages (
  id serial PRIMARY KEY,
  room varchar(40) NOT NULL DEFAULT 'general',
  author_id varchar(64) NOT NULL DEFAULT '',
  author_name varchar(200) NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_room ON t_p50633472_niche_creator_networ.chat_messages(room, created_at);

CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.forum_topics (
  id serial PRIMARY KEY,
  category varchar(40) NOT NULL DEFAULT '',
  title varchar(300) NOT NULL DEFAULT '',
  author_id varchar(64) NOT NULL DEFAULT '',
  author_name varchar(200) NOT NULL DEFAULT '',
  views integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forum_topics_cat ON t_p50633472_niche_creator_networ.forum_topics(category, created_at);

CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.forum_posts (
  id serial PRIMARY KEY,
  topic_id integer NOT NULL,
  author_id varchar(64) NOT NULL DEFAULT '',
  author_name varchar(200) NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON t_p50633472_niche_creator_networ.forum_posts(topic_id, created_at);

CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.direct_messages (
  id serial PRIMARY KEY,
  pair_key varchar(160) NOT NULL DEFAULT '',
  from_id varchar(64) NOT NULL DEFAULT '',
  from_name varchar(200) NOT NULL DEFAULT '',
  to_id varchar(64) NOT NULL DEFAULT '',
  text text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dm_pair ON t_p50633472_niche_creator_networ.direct_messages(pair_key, created_at);