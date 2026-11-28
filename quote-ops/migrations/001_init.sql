create table if not exists investigation_cases (
  id text primary key,
  title text not null,
  symbol text not null default '',
  status text not null default 'open',
  severity text not null default 'P1',
  notes text not null default '',
  skill_id text,
  risk_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rag_queries (
  id text primary key,
  question text not null,
  locale text not null default 'zh-CN',
  hit_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
