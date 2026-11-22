create table if not exists lps (
  id text primary key,
  slug text not null unique,
  name text not null,
  aliases jsonb not null default '[]'::jsonb,
  category text not null,
  used_by_vantage boolean not null default false,
  regions jsonb not null default '[]'::jsonb,
  hours text not null,
  asset_classes jsonb not null default '[]'::jsonb,
  products jsonb not null default '[]'::jsonb,
  cost_tier text not null,
  pricing_quality integer not null default 3,
  latency_profile text not null,
  regulation jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  weaknesses jsonb not null default '[]'::jsonb,
  best_for jsonb not null default '[]'::jsonb,
  website text,
  notes text not null default '',
  kb_body_en text not null default '',
  kb_body_zh text not null default '',
  score_hints jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists lps_used_by_vantage_idx on lps (used_by_vantage);
create index if not exists lps_category_idx on lps (category);
