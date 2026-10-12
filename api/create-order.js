const { getSupabase, razorpayAuth, expectedAmountForPlan } = require('../lib/payment');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { leadId } = req.body || {};
    if (!leadId || typeof leadId !== 'string') return res.status(400).json({ error: 'Missing lead ID' });
    const auth = razorpayAuth();
    const supabase = getSupabase();
    const { data: lead, error } = await supabase.from('leads').select('id,type,name,email,company,plan,plan_price,payment_status,razorpay_order_id,order_amount_paise').eq('id', leadId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (lead.type !== 'project_report') return res.status(400).json({ error: 'Online checkout is available for project reports only' });
    if (lead.payment_status === 'paid') return res.status(409).json({ error: 'This lead has already been paid' });
    const amount = expectedAmountForPlan(lead.plan);
    if (!amount) return res.status(400).json({ error: 'Invalid plan selected' });
    if (lead.razorpay_order_id && ['created', 'pending', 'processing'].includes(String(lead.payment_status || '').toLowerCase()) && Number(lead.order_amount_paise) === amount) {
      return res.status(200).json({ ok: true, keyId: auth.id, orderId: lead.razorpay_order_id, amount, currency: 'INR', name: lead.name || '', email: lead.email || '', company: lead.company || '', plan: lead.plan || '' });
    }
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: auth.authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'INR', receipt: `sp_${lead.id.replace(/-/g, '').slice(0, 24)}`, notes: { lead_id: lead.id, plan: lead.plan || '', customer_email: lead.email || '' } })
    });
    const order = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(502).json({ error: order.error?.description || 'Razorpay could not create the order' });
    const { error: updateError } = await supabase.from('leads').update({
      razorpay_order_id: order.id,
      order_amount_paise: amount,
      payment_currency: 'INR',
      payment_status: 'created',
      payment_error: null,
      updated_at: new Date().toISOString()
    }).eq('id', lead.id);
    if (updateError) throw new Error(updateError.message);
    return res.status(200).json({ ok: true, keyId: auth.id, orderId: order.id, amount: order.amount, currency: order.currency, name: lead.name || '', email: lead.email || '', company: lead.company || '', plan: lead.plan || '' });
  } catch (err) {
    console.error('create-order error', err);
    return res.status(500).json({ error: err.message || 'Could not create payment order' });
  }
};
