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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_type_idx on public.leads(type);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists leads_email_idx on public.leads(email);

alter table public.leads enable row level security;
-- No public policies: browser clients cannot directly read or write leads.
-- Vercel API uses SUPABASE_SERVICE_ROLE_KEY server-side only.
