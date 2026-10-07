# StartProject — Vercel + Supabase

## Deploy
1. Push this repository to GitHub.
2. Import the repository into Vercel.
3. In Supabase, create a project and run `supabase/schema.sql` in SQL Editor.
4. In Vercel Project Settings → Environment Variables add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for Production.
5. Redeploy.
6. Add `startproject.in` as the Vercel custom domain.

## Security
The Supabase service-role key is server-side only. Never put it in frontend code. RLS is enabled on the leads table with no public policies.

## API
`POST /api/leads` accepts `project_report`, `investor_dpr`, and `business_plan` submissions.


## Razorpay Payment Links

Enterprise: https://rzp.io/rzp/V2iBr0Ty
Pro: https://rzp.io/rzp/7W5gH39a
Super: https://rzp.io/rzp/bkxzDViw


## Vercel environment variables
Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in Vercel. The secret key must remain server-side and must never be placed in `public/index.html` or committed to GitHub. The API also accepts the older `SUPABASE_SERVICE_ROLE_KEY` name for compatibility.

Health check: `/api/health`


## Marketing attribution
StartProject captures UTM parameters and common click IDs when a lead is submitted. The API stores `source_tag`, `marketing_source`, `marketing_medium`, `marketing_campaign`, `marketing_content`, `marketing_term`, `gclid`, `fbclid`, `li_fat_id`, `landing_page`, `referrer`, and the server-side `submitted_at` timestamp.

Example campaign links (replace the campaign/content values as needed):
- Meta/Facebook: https://www.startproject.in/?utm_source=meta&utm_medium=paid_social&utm_campaign=project_reports&utm_content=facebook_ad_01
- Google: https://www.startproject.in/?utm_source=google&utm_medium=cpc&utm_campaign=project_reports&utm_content=search_ad_01
- LinkedIn: https://www.startproject.in/?utm_source=linkedin&utm_medium=paid_social&utm_campaign=project_reports&utm_content=linkedin_ad_01
- WhatsApp: https://www.startproject.in/?utm_source=whatsapp&utm_medium=referral&utm_campaign=project_reports&utm_content=whatsapp_01

For more granular reporting, use unique `utm_campaign` and `utm_content` values for each campaign/ad/creative.

## Admin dashboard

The private admin dashboard is available at `/admin`. The login uses a login ID rather than an email address.

Set these Vercel Production environment variables:

- `ADMIN_LOGIN_ID` — admin login ID (set this to `parth`)
- `ADMIN_PASSWORD` — strong admin password (set this in Vercel; do not commit it to GitHub)
- `ADMIN_SESSION_SECRET` — long random secret used to sign the HttpOnly admin session cookie

The dashboard reads leads through a server-side Vercel API using the Supabase secret key. The Supabase secret key is never exposed to the browser.
