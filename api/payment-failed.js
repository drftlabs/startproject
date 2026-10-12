const { getSupabase } = require('../lib/payment');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { leadId, orderId, reason } = req.body || {};
    if (!leadId || !orderId) return res.status(400).json({ error: 'Missing lead/order reference' });
    const supabase = getSupabase();
    const { error } = await supabase.from('leads').update({ payment_status: 'failed', payment_error: String(reason || 'Payment failed').slice(0, 500), updated_at: new Date().toISOString() }).eq('id', leadId).eq('razorpay_order_id', orderId).neq('payment_status', 'paid');
    if (error) throw new Error(error.message);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('payment-failed error', err);
    return res.status(500).json({ error: 'Could not record payment failure' });
  }
};
