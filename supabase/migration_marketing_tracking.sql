-- Run this once in Supabase SQL Editor for the existing StartProject database.
alter table public.leads add column if not exists submitted_at timestamptz not null default now();
alter table public.leads add column if not exists source_tag text;
alter table public.leads add column if not exists marketing_source text;
alter table public.leads add column if not exists marketing_medium text;
alter table public.leads add column if not exists marketing_campaign text;
alter table public.leads add column if not exists marketing_content text;
alter table public.leads add column if not exists marketing_term text;
alter table public.leads add column if not exists gclid text;
alter table public.leads add column if not exists fbclid text;
alter table public.leads add column if not exists li_fat_id text;
alter table public.leads add column if not exists landing_page text;
alter table public.leads add column if not exists referrer text;

create index if not exists leads_submitted_at_idx on public.leads(submitted_at desc);
create index if not exists leads_source_tag_idx on public.leads(source_tag);
