alter table lps add column if not exists optimal_regions jsonb not null default '[]'::jsonb;
