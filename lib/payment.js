const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}
function razorpayAuth() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error('Razorpay keys are not configured');
  return { id, secret, authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64') };
}
function expectedAmountForPlan(plan) {
  const normalized = String(plan || '').trim().toLowerCase();
  const amounts = { enterprise: 67260, pro: 122720, super: 180540 };
  return amounts[normalized] || null;
}
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aa = Buffer.from(a, 'hex'); const bb = Buffer.from(b, 'hex');
  return aa.length === bb.length && aa.length > 0 && crypto.timingSafeEqual(aa, bb);
}
function verifyCheckoutSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}
function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
async function fetchRazorpayPayment(paymentId, auth) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: auth.authorization }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error?.description || 'Could not verify payment with Razorpay');
  return json;
}
async function markPaid({ orderId, paymentId = null, amountPaise, currency = 'INR', method = null, signature = null, event = null }) {
  const supabase = getSupabase();
  const { data: existing, error: lookupError } = await supabase.from('leads').select('id,order_amount_paise,payment_status,paid_at').eq('razorpay_order_id', orderId).maybeSingle();
  if (lookupError) throw new Error(lookupError.message);
  if (!existing) throw new Error('No lead matched this Razorpay order ID');
  if (existing.order_amount_paise !== null && existing.order_amount_paise !== undefined && Number(existing.order_amount_paise) !== Number(amountPaise)) throw new Error('Payment amount does not match the recorded order amount');
  const update = {
    payment_status: 'paid',
    paid_amount: Number((Number(amountPaise) / 100).toFixed(2)),
    payment_currency: currency || 'INR',
    paid_at: existing.payment_status === 'paid' && existing.paid_at ? existing.paid_at : new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  if (paymentId) update.razorpay_payment_id = paymentId;
  if (signature) update.razorpay_signature = signature;
  if (method) update.payment_method = method;
  if (event) update.razorpay_webhook_event = event;
  const { data, error } = await supabase.from('leads').update(update).eq('razorpay_order_id', orderId).select('id,plan,plan_price,paid_amount,payment_status,razorpay_order_id,razorpay_payment_id,paid_at').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No lead matched this Razorpay order ID');
  return data;
}
async function readRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}
module.exports = { getSupabase, razorpayAuth, expectedAmountForPlan, verifyCheckoutSignature, verifyWebhookSignature, fetchRazorpayPayment, markPaid, readRawBody };
