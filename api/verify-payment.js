const { getSupabase, razorpayAuth, verifyCheckoutSignature, fetchRazorpayPayment, expectedAmountForPlan, markPaid } = require('../lib/payment');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { leadId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    if (!leadId || !orderId || !paymentId || !signature) return res.status(400).json({ error: 'Missing payment verification fields' });
    if (!verifyCheckoutSignature(orderId, paymentId, signature)) return res.status(400).json({ error: 'Razorpay checkout signature is invalid' });
    const supabase = getSupabase();
    const { data: lead, error } = await supabase.from('leads').select('id,plan,razorpay_order_id,order_amount_paise,payment_status').eq('id', leadId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!lead || lead.razorpay_order_id !== orderId) return res.status(400).json({ error: 'Payment order does not match this lead' });
    const auth = razorpayAuth();
    const payment = await fetchRazorpayPayment(paymentId, auth);
    const expectedAmount = expectedAmountForPlan(lead.plan);
    if (payment.order_id !== orderId || Number(payment.amount) !== Number(expectedAmount) || Number(lead.order_amount_paise) !== Number(expectedAmount)) {
      return res.status(400).json({ error: 'Payment amount or order does not match the selected plan' });
    }
    if (payment.status === 'captured' || payment.captured === true) {
      const updated = await markPaid({ orderId, paymentId, amountPaise: payment.amount, currency: payment.currency, method: payment.method, signature, event: 'checkout_verified' });
      return res.status(200).json({ ok: true, paid: true, leadId: updated.id, orderId, paymentId, amount: updated.paid_amount, currency: updated.payment_currency });
    }
    await supabase.from('leads').update({ payment_status: payment.status === 'authorized' ? 'processing' : payment.status || 'pending', razorpay_payment_id: paymentId, razorpay_signature: signature, payment_method: payment.method || null, updated_at: new Date().toISOString() }).eq('id', leadId);
    return res.status(200).json({ ok: true, paid: false, status: payment.status || 'processing', leadId, orderId, paymentId });
  } catch (err) {
    console.error('verify-payment error', err);
    return res.status(500).json({ error: err.message || 'Could not verify payment' });
  }
};
