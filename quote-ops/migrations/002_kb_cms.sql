create table if not exists kb_nodes (
  id text primary key,
  parent_id text references kb_nodes(id) on delete set null,
  kind text not null,
  slug text not null unique,
  title_zh text not null default '',
  title_en text not null default '',
  summary_zh text not null default '',
  summary_en text not null default '',
  body_zh text not null default '',
  body_en text not null default '',
  sort_order int not null default 0,
  tags jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null default '',
  updated_by text not null default ''
);

create index if not exists kb_nodes_parent_idx on kb_nodes(parent_id);
create index if not exists kb_nodes_kind_idx on kb_nodes(kind);
create index if not exists kb_nodes_updated_idx on kb_nodes(updated_at desc);

create table if not exists kb_revisions (
  id text primary key,
  node_id text not null references kb_nodes(id) on delete cascade,
  action text not null,
  actor_sub text not null default '',
  actor_email text not null default '',
  actor_name text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists kb_revisions_node_idx on kb_revisions(node_id, created_at desc);

create table if not exists kb_media (
  id text primary key,
  node_id text references kb_nodes(id) on delete cascade,
  name text not null,
  mime text not null default 'application/octet-stream',
  kind text not null default 'file',
  data_url text not null,
  size_bytes int not null default 0,
  created_at timestamptz not null default now(),
  created_by text not null default ''
);

create index if not exists kb_media_node_idx on kb_media(node_id);
