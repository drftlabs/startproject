const { clearSession } = require('./admin-auth');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  clearSession(res);
  return res.status(200).json({ ok: true });
};
