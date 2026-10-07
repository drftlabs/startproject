const { currentAdmin } = require('./admin-auth');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const admin = currentAdmin(req);
  if (!admin) return res.status(401).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, loginId: admin.email });
};
