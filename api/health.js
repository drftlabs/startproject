const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return res.status(500).json({
      ok: false,
      databaseConfigured: false,
      databaseConnected: false,
      error: 'Supabase environment variables are missing'
    });
  }

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from('leads').select('id').limit(1);

    if (error) {
      return res.status(500).json({
        ok: false,
        databaseConfigured: true,
        databaseConnected: false,
        error: error.message,
        code: error.code || null
      });
    }

    return res.status(200).json({
      ok: true,
      databaseConfigured: true,
      databaseConnected: true
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      databaseConfigured: true,
      databaseConnected: false,
      error: error.message || 'Supabase connection failed'
    });
  }
};
