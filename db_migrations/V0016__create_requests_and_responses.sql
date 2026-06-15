CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.client_requests (
  id serial PRIMARY KEY,
  client_id varchar(64) NOT NULL DEFAULT '',
  client_name varchar(200) NOT NULL DEFAULT '',
  category varchar(40) NOT NULL DEFAULT '',
  service varchar(200) NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  budget varchar(80) NOT NULL DEFAULT '',
  city varchar(120) NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'open',
  chosen_provider varchar(64) NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS t_p50633472_niche_creator_networ.request_responses (
  id serial PRIMARY KEY,
  request_id integer NOT NULL,
  provider_slug varchar(64) NOT NULL DEFAULT '',
  provider_name varchar(200) NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  price varchar(80) NOT NULL DEFAULT '',
  status varchar(20) NOT NULL DEFAULT 'sent',
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(request_id, provider_slug)
);

CREATE INDEX IF NOT EXISTS idx_requests_category ON t_p50633472_niche_creator_networ.client_requests(category);
CREATE INDEX IF NOT EXISTS idx_requests_client ON t_p50633472_niche_creator_networ.client_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_responses_request ON t_p50633472_niche_creator_networ.request_responses(request_id);