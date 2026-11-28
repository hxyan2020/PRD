alter table evidence add column if not exists caption text not null default '';
alter table evidence add column if not exists body_what text not null default '';
alter table evidence add column if not exists body_where text not null default '';
alter table evidence add column if not exists body_when text not null default '';
alter table evidence add column if not exists body_how text not null default '';
alter table evidence add column if not exists body_why text not null default '';
alter table evidence add column if not exists images jsonb not null default '[]'::jsonb;
alter table evidence add column if not exists ratings jsonb not null default '{}'::jsonb;
alter table evidence add column if not exists translations jsonb not null default '{}'::jsonb;

alter table evidence_sources add column if not exists image_url text not null default '';

alter table scan_runs add column if not exists sources_scanned integer not null default 0;
alter table scan_runs add column if not exists relevant_sourced integer not null default 0;
alter table scan_runs add column if not exists schedule_label text not null default '';
