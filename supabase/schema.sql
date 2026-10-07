create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('project_report','investor_dpr','business_plan')),
  name text,
  phone text,
  email text,
  company text,
  business_type text,
  industry text,
  city text,
  project_value text,
  business_model text,
  education text,
  work_experience text,
  purposes jsonb,
  amount_needed text,
  requirements text,
  plan text,
  plan_price numeric,
  project_name text,
  project_cost text,
  dpr_requirements text,
  business_plan_requirements text,
  status text not null default 'new',
  submitted_at timestamptz not null default now(),
  source_tag text,
  marketing_source text,
  marketing_medium text,
  marketing_campaign text,
  marketing_content text,
  marketing_term text,
  gclid text,
  fbclid text,
  li_fat_id text,
  landing_page text,
  referrer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_type_idx on public.leads(type);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_submitted_at_idx on public.leads(submitted_at desc);
create index if not exists leads_source_tag_idx on public.leads(source_tag);
create index if not exists leads_email_idx on public.leads(email);

-- Migration-safe additions for an existing leads table.
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

alter table public.leads enable row level security;
-- No public policies: browser clients cannot directly read or write leads.
-- Vercel API uses SUPABASE_SERVICE_ROLE_KEY server-side only.
