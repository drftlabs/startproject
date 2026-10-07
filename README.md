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
