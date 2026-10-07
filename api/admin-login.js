const { setSession } = require('./admin-auth');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminLoginId = process.env.ADMIN_LOGIN_ID || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminLoginId || !adminPassword || !(process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return res.status(500).json({ error: 'Admin login is not configured in Vercel.' });
  }

  const body = req.body || {};
  const loginId = String(body.loginId || body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (loginId !== String(adminLoginId).trim().toLowerCase() || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid login ID or password.' });
  }

  setSession(res, loginId);
  return res.status(200).json({ ok: true });
};
