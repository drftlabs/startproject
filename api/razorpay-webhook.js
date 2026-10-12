const { verifyWebhookSignature, markPaid, readRawBody } = require('../lib/payment');
const handler = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  let raw;
  try {
    raw = await readRawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    if (!verifyWebhookSignature(raw, signature)) return res.status(400).json({ error: 'Invalid webhook signature' });
    const event = JSON.parse(raw.toString('utf8'));
    const eventName = String(event.event || '');
    const payment = event.payload?.payment?.entity;
    const order = event.payload?.order?.entity;
    const orderId = payment?.order_id || order?.id;
    if (eventName === 'payment.captured' && payment?.status === 'captured' && orderId) {
      await markPaid({ orderId, paymentId: payment.id, amountPaise: payment.amount, currency: payment.currency, method: payment.method, event: eventName });
    } else if (eventName === 'order.paid' && orderId) {
      const amount = Number(order?.amount_paid || order?.amount);
      if (Number.isFinite(amount) && amount > 0) await markPaid({ orderId, paymentId: payment?.id || null, amountPaise: amount, currency: order?.currency || payment?.currency || 'INR', method: payment?.method || null, event: eventName });
    } else {
      return res.status(200).json({ ok: true, ignored: true, event: eventName });
    }
    return res.status(200).json({ ok: true, received: true, event: eventName });
  } catch (err) {
    console.error('razorpay-webhook error', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
module.exports = handler;
module.exports.config = { api: { bodyParser: false } };
