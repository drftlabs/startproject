const fs = require('fs');
const path = require('path');
const { formidable } = require('formidable');
const { createClient } = require('@supabase/supabase-js');
const { currentAdmin } = require('./admin-auth');

const BUCKET = 'lead-pdfs';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Database is not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function ensureBucket(supabase) {
  const { data, error } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const created = await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: ['application/pdf'] });
  if (created.error && !/already exists/i.test(created.error.message || '')) throw created.error;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const admin = currentAdmin(req);
  if (!admin) return res.status(401).json({ error: 'Unauthorized' });

  let supabase;
  try { supabase = getClient(); } catch (e) { return res.status(500).json({ error: e.message }); }

  if (req.method === 'GET') {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Lead ID is required' });
    const { data: lead, error } = await supabase.from('leads').select('report_pdf_path').eq('id', id).single();
    if (error || !lead) return res.status(404).json({ error: 'Lead not found' });
    if (!lead.report_pdf_path) return res.status(404).json({ error: 'No PDF uploaded for this lead' });
    const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(lead.report_pdf_path, 300);
    if (signError || !data?.signedUrl) return res.status(500).json({ error: 'Could not create PDF link', details: signError?.message || null });
    return res.redirect(302, data.signedUrl);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureBucket(supabase);
    const form = formidable({
      multiples: false,
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024,
      allowEmptyFiles: false,
      keepExtensions: true,
      filter: ({ mimetype, originalFilename }) => mimetype === 'application/pdf' || /\.pdf$/i.test(originalFilename || '')
    });
    const [fields, files] = await form.parse(req);
    const leadId = String((fields.lead_id?.[0] || '')).trim();
    const file = files.pdf?.[0];
    if (!leadId) return res.status(400).json({ error: 'Lead ID is required' });
    if (!file) return res.status(400).json({ error: 'Please select a PDF file' });

    const { data: existing, error: existingError } = await supabase.from('leads').select('report_pdf_path').eq('id', leadId).single();
    if (existingError || !existing) return res.status(404).json({ error: 'Lead not found' });

    const ext = path.extname(file.originalFilename || '') || '.pdf';
    const safeBase = String(file.originalFilename || 'report').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').replace(/\.pdf$/i, '').slice(0, 80) || 'report';
    const storagePath = `${leadId}/${Date.now()}-${safeBase}${ext.toLowerCase()}`;

    const fileBuffer = await fs.promises.readFile(file.filepath);
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false });
    if (uploadError) throw uploadError;

    const { error: updateError } = await supabase.from('leads').update({ report_pdf_path: storagePath, updated_at: new Date().toISOString() }).eq('id', leadId);
    if (updateError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw updateError;
    }

    if (existing.report_pdf_path) {
      await supabase.storage.from(BUCKET).remove([existing.report_pdf_path]);
    }

    return res.status(200).json({ ok: true, path: storagePath });
  } catch (error) {
    return res.status(500).json({ error: 'Could not upload PDF', details: error.message || String(error) });
  }
};

module.exports.config = { api: { bodyParser: false } };
