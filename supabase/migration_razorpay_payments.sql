-- Run once in Supabase SQL Editor before deploying the payment integration.
alter table public.leads add column if not exists razorpay_order_id text;
alter table public.leads add column if not exists razorpay_payment_id text;
alter table public.leads add column if not exists razorpay_signature text;
alter table public.leads add column if not exists payment_status text not null default 'unpaid';
alter table public.leads add column if not exists order_amount_paise bigint;
alter table public.leads add column if not exists paid_amount numeric(12,2);
alter table public.leads add column if not exists payment_currency text not null default 'INR';
alter table public.leads add column if not exists paid_at timestamptz;
alter table public.leads add column if not exists payment_method text;
alter table public.leads add column if not exists payment_error text;
alter table public.leads add column if not exists razorpay_webhook_event text;
create unique index if not exists leads_razorpay_order_id_uidx on public.leads(razorpay_order_id) where razorpay_order_id is not null;
create index if not exists leads_payment_status_idx on public.leads(payment_status);

-- Correct historic project-report fee values that may have been stored without decimal places.
update public.leads set plan_price = case lower(trim(plan)) when 'enterprise' then 672.60 when 'pro' then 1227.20 when 'super' then 1805.40 else plan_price end where type = 'project_report' and lower(trim(plan)) in ('enterprise','pro','super') and (plan_price in (67260,122720,180540) or plan_price is null);
