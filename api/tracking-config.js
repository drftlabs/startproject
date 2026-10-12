module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    googleAdsConversionId: process.env.GOOGLE_ADS_CONVERSION_ID || '',
    googleAdsConversionLabel: process.env.GOOGLE_ADS_CONVERSION_LABEL || '',
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',
    metaPixelId: process.env.META_PIXEL_ID || ''
  });
};
