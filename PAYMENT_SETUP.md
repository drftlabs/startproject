# StartProject payment integration deployment checklist

## Before deployment

1. Open Supabase → SQL Editor and run `supabase/migration_razorpay_payments.sql` once. It adds Razorpay/payment fields and corrects known project-report plan prices that were stored without decimals. Existing lead records are retained.
2. Confirm `supabase/migration_admin_pdf.sql` has already been run for the existing admin PDF-upload feature. `schema.sql` now includes the column for new setups.
3. In Vercel → Project → Settings → Environment Variables, add the following for Production (and Preview if you use it):
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `GOOGLE_ADS_CONVERSION_ID`
   - `GOOGLE_ADS_CONVERSION_LABEL`
   - `GOOGLE_ANALYTICS_ID` (optional GA4 Measurement ID)
   - `META_PIXEL_ID` (optional Meta Pixel ID)
4. Use Razorpay test-mode API keys first. Never commit the secret key or webhook secret to GitHub and never put them in public HTML.
5. In Razorpay Dashboard → Account & Settings / Webhooks, add `https://www.startproject.in/api/razorpay-webhook`. Use the exact same secret entered in `RAZORPAY_WEBHOOK_SECRET`. Subscribe to `payment.captured` and `order.paid`.
6. Redeploy Vercel after adding environment variables.

## Price mapping

The backend controls the checkout amount and does not trust the browser-provided amount:

- Enterprise: ₹672.60 (67,260 paise)
- Pro: ₹1,227.20 (122,720 paise)
- Super: ₹1,805.40 (180,540 paise)

## Conversion behaviour

- Project form opened: Meta `AddToCart` and GA4 `add_to_cart` (if their IDs are configured).
- Continue to Payment clicked: Meta `InitiateCheckout` and GA4 `begin_checkout`.
- Payment confirmed by the backend: branded `/thank-you.html` is shown. The page checks `/api/payment-status` and sends the Google Ads conversion (`GOOGLE_ADS_CONVERSION_ID` + `GOOGLE_ADS_CONVERSION_LABEL`), GA4 `purchase`, and Meta `Purchase` (if configured) only when the server confirms payment is paid.
- If payment is still processing, the page polls status and does not send Purchase until payment is confirmed.

## Admin dashboard

Open `/admin`. Each lead now includes payment status, plan fee, actual amount paid, Razorpay order/payment IDs, payment method, and paid timestamp. Amounts are displayed to two decimal places. The migration fixes known old plan-fee values stored as `67260`, `122720`, or `180540` instead of rupees with decimals.

## Test checklist

1. Use Razorpay test credentials and a test payment method from Razorpay's current test-mode documentation.
2. Submit a new project report form.
3. Confirm the created lead is visible in Supabase with a Razorpay order ID and payment status `created`.
4. Complete a test payment. Confirm the browser goes to `/thank-you.html` and the page displays Paid after server verification.
5. Confirm Supabase and `/admin` show `payment_status = paid`, `paid_amount` equal to the exact fee, payment ID, and `paid_at`.
6. In Razorpay Dashboard, confirm the webhook delivery to `/api/razorpay-webhook` succeeded.
7. Use Google Tag Assistant / Google Ads diagnostics and Meta Test Events to verify configured tracking. Purchase tracking requires the Google Ads conversion ID and label to be set.

A live payment cannot be verified until valid Razorpay keys and the webhook secret are configured in Vercel.
