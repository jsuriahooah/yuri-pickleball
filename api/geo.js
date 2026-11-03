/* GET /api/geo: the visitor's country and state from Vercel's location headers, for the cookie defaults
 * (copy/cookie-banner.md, Sun 2026-11-03). Returns codes only; nothing is stored or logged. */
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({ country: String(req.headers['x-vercel-ip-country'] || ''), region: String(req.headers['x-vercel-ip-country-region'] || '') });
};
