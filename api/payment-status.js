const { getSupabase } = require('../lib/payment');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const leadId = String(req.query.lead || '');
    const orderId = String(req.query.order || '');
    if (!leadId || !orderId) return res.status(400).json({ error: 'Missing lead/order reference' });
    const supabase = getSupabase();
    const { data, error } = await supabase.from('leads').select('id,plan,plan_price,payment_status,paid_amount,payment_currency,paid_at,razorpay_order_id,razorpay_payment_id').eq('id', leadId).eq('razorpay_order_id', orderId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Payment reference not found' });
    return res.status(200).json({ ok: true, paid: data.payment_status === 'paid', status: data.payment_status || 'unpaid', plan: data.plan, paidAmount: data.paid_amount === null ? null : Number(data.paid_amount), currency: data.payment_currency || 'INR', paidAt: data.paid_at, paymentId: data.razorpay_payment_id || null });
  } catch (err) {
    console.error('payment-status error', err);
    return res.status(500).json({ error: 'Could not check payment status' });
  }
};
