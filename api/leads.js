const { createClient } = require('@supabase/supabase-js');

function clean(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return value;
  return value.trim().slice(0, 5000);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Database is not configured' });

  const body = req.body || {};
  const type = clean(body.type);
  if (!['project_report', 'investor_dpr', 'business_plan'].includes(type)) {
    return res.status(400).json({ error: 'Invalid enquiry type' });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  function numeric(value) {
    if (value === undefined || value === null || value === '') return null;
    const digits = String(value).replace(/[^0-9.]/g, '');
    const n = Number(digits);
    return Number.isFinite(n) ? n : null;
  }

  const purpose = Array.isArray(body.purpose) ? body.purpose.map(clean) : clean(body.purpose);
  const record = {
    type,
    name: clean(body.name), phone: clean(body.phone), email: clean(body.email), company: clean(body.company),
    business_type: clean(body.businessType), industry: clean(body.industry), city: clean(body.city),
    project_value: clean(body.projectValue), business_model: clean(body.businessModel), education: clean(body.education),
    work_experience: clean(body.workExperience || body.experience), purposes: purpose,
    amount_needed: clean(body.amountNeeded), requirements: clean(body.requirements), plan: clean(body.plan),
    plan_price: numeric(body.planPrice), project_name: clean(body.projectName), project_cost: clean(body.projectCost),
    dpr_requirements: clean(body.dprRequirements), business_plan_requirements: clean(body.businessPlanRequirements)
  };

  const { data, error } = await supabase.from('leads').insert(record).select('id').single();
  if (error) return res.status(500).json({ error: 'Could not save enquiry', details: error.message, code: error.code || null });
  return res.status(201).json({ ok: true, id: data.id });
};
