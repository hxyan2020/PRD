create table if not exists categories (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0
);

create table if not exists evidence (
  id text primary key,
  slug text not null unique,
  title text not null,
  summary text not null,
  detail text not null default '',
  fingerprint text not null,
  language text not null default 'en',
  languages jsonb not null default '["en"]'::jsonb,
  source_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists evidence_fingerprint_idx on evidence (fingerprint);
create index if not exists evidence_status_idx on evidence (status);
create index if not exists evidence_last_seen_idx on evidence (last_seen_at desc);

create table if not exists evidence_categories (
  evidence_id text not null references evidence (id) on delete cascade,
  category_id text not null references categories (id) on delete cascade,
  primary key (evidence_id, category_id)
);

create index if not exists evidence_categories_category_idx on evidence_categories (category_id);

create table if not exists evidence_sources (
  id text primary key,
  evidence_id text not null references evidence (id) on delete cascade,
  url text not null,
  title text not null default '',
  snippet text not null default '',
  language text not null default 'en',
  publisher text not null default '',
  fetched_at timestamptz not null default now(),
  unique (evidence_id, url)
);

create index if not exists evidence_sources_evidence_idx on evidence_sources (evidence_id);

create table if not exists scan_runs (
  id text primary key,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  candidates integer not null default 0,
  merged integer not null default 0,
  inserted integer not null default 0,
  source text not null default 'web-scan',
  notes text not null default ''
);
