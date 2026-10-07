const { createClient } = require('@supabase/supabase-js');
const { currentAdmin } = require('./admin-auth');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const admin = currentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Database is not configured' });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const limitRaw = Number(req.query.limit || 500);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 500, 1), 1000);

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(limit);

  if (error) return res.status(500).json({ error: 'Could not load leads', details: error.message, code: error.code || null });
  return res.status(200).json({ ok: true, admin: admin.email, count: data.length, leads: data });
};
