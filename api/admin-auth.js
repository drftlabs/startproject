const crypto = require('crypto');

const COOKIE_NAME = 'sp_admin_session';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function sign(payload) {
  const s = secret();
  if (!s) throw new Error('ADMIN_SESSION_SECRET is not configured');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', s).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  try {
    const s = secret();
    if (!s || !token) return null;
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expected = crypto.createHmac('sha256', s).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_) { return null; }
}

function cookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setSession(res, email) {
  const token = sign({ email, exp: Math.floor(Date.now() / 1000) + MAX_AGE });
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function currentAdmin(req) {
  return verify(cookies(req)[COOKIE_NAME]);
}

module.exports = { setSession, clearSession, currentAdmin, COOKIE_NAME };
