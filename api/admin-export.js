const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const { currentAdmin } = require('./admin-auth');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const admin = currentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const id = String(req.query.id || '').trim();
  if (!id) return res.status(400).json({ error: 'Lead ID is required' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(500).json({ error: 'Database is not configured' });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', id).single();
  if (error || !lead) return res.status(404).json({ error: 'Lead not found', details: error?.message || null });

  const rows = [
    ['Field', 'Value'],
    ['Submission Date / Time', lead.submitted_at || lead.created_at || ''],
    ['Lead ID', lead.id || ''],
    ['Type', lead.type || ''],
    ['Name', lead.name || ''],
    ['Email', lead.email || ''],
    ['Company', lead.company || ''],
    ['Business Type', lead.business_type || ''],
    ['Industry', lead.industry || ''],
    ['City', lead.city || ''],
    ['Project Value', lead.project_value || ''],
    ['Business Model', lead.business_model || ''],
    ['Education', lead.education || ''],
    ['Work Experience', lead.work_experience || ''],
    ['Report Purpose(s)', Array.isArray(lead.purposes) ? lead.purposes.join(', ') : (lead.purposes ? JSON.stringify(lead.purposes) : '')],
    ['Amount Needed / Applying For', lead.amount_needed || ''],
    ['Specific Requirements', lead.requirements || ''],
    ['Selected Plan', lead.plan || ''],
    ['Fees Amount', lead.plan_price ?? ''],
    ['Project Name', lead.project_name || ''],
    ['Project Cost', lead.project_cost || ''],
    ['Investor DPR Requirements', lead.dpr_requirements || ''],
    ['Business Plan Requirements', lead.business_plan_requirements || ''],
    ['Status', lead.status || 'new'],
    ['Marketing Source', lead.marketing_source || lead.source_tag || ''],
    ['Marketing Medium', lead.marketing_medium || ''],
    ['Marketing Campaign', lead.marketing_campaign || ''],
    ['Marketing Content', lead.marketing_content || ''],
    ['Marketing Term', lead.marketing_term || ''],
    ['GCLID', lead.gclid || ''],
    ['FBCLID', lead.fbclid || ''],
    ['LinkedIn Click ID', lead.li_fat_id || ''],
    ['Landing Page', lead.landing_page || ''],
    ['Referrer', lead.referrer || ''],
    ['PDF', lead.report_pdf_path || '']
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Lead');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const safeName = String(lead.name || 'lead').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'lead';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="startproject-${safeName}.xlsx"`);
  return res.end(buffer);
};
