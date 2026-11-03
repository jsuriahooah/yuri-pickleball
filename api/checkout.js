/* POST /api/checkout: the site's cart into a Shopify cart, then the browser goes to its checkoutUrl (Sun, 2026-11-03, option a).
 * Body: { lines: [{ handle, options: [option values], qty }] }. Paddles send no options and get the "Paddle Only" variant
 * (the price the site shows); accessories send their colour and size values, matched to the variant's selected options.
 * Storefront API: with SHOPIFY_STOREFRONT_PRIVATE_TOKEN (Headless channel, Vercel only, like the GHL token) when it is set and
 * accepted, else tokenless (products and cart need no token; lower limits). SHOPIFY_STORE_DOMAIN overrides the store domain. */
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07';
const SOURCE = 'yuripickleballpaddles.com';
const HANDLE = /^[a-z0-9][a-z0-9-]{0,99}$/;
const MAX_LINES = 30, MAX_QTY = 20;
const WINDOW_MS = 10 * 60 * 1000, MAX_HITS = 20;
const hits = new Map();   // ip -> timestamps; per function instance

const DOMAIN = () => process.env.SHOPIFY_STORE_DOMAIN || 'exq8kt-ty.myshopify.com';
const norm = (s) => String(s).trim().toLowerCase();

async function storefront(query, variables, ip) {
  const token = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  // mode: private token (with the buyer IP), the same token as a public one, or no token
  const call = (mode) => fetch(`https://${DOMAIN()}/api/${API_VERSION}/graphql.json`, {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json',
      ...(mode === 'private' ? { 'Shopify-Storefront-Private-Token': token, ...(ip !== 'unknown' ? { 'Shopify-Storefront-Buyer-IP': ip } : {}) } : {}),
      ...(mode === 'public' ? { 'X-Shopify-Storefront-Access-Token': token } : {}) },
    body: JSON.stringify({ query, variables }),
  });
  const refused = (r) => r.status === 401 || r.status === 403;
  let r = await call(token ? 'private' : 'none');
  if (token && refused(r)) r = await call('public');
  if (token && refused(r)) {
    console.warn(`Storefront token refused (${r.status}); using tokenless access. Check SHOPIFY_STOREFRONT_PRIVATE_TOKEN.`);
    r = await call('none');
  }
  if (!r.ok) throw new Error(`Storefront ${r.status}`);
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error(`Storefront: ${j.errors[0].message}`);
  return j.data;
}

// One request for every product in the cart: p0: product(handle: $h0) { ... }, p1: ...
async function variantsFor(handles, ip) {
  const q = `query(${handles.map((_, i) => `$h${i}: String!`).join(', ')}) {`
    + handles.map((_, i) => ` p${i}: product(handle: $h${i}) { variants(first: 100) { nodes { id title availableForSale selectedOptions { value } } } }`).join('')
    + ' }';
  const data = await storefront(q, Object.fromEntries(handles.map((h, i) => [`h${i}`, h])), ip);
  return Object.fromEntries(handles.map((h, i) => [h, data[`p${i}`] ? data[`p${i}`].variants.nodes : null]));
}

function pick(variants, options) {
  const want = options.map(norm);
  const match = variants.filter((v) => { const has = v.selectedOptions.map((o) => norm(o.value)); return want.every((w) => has.includes(w)); });
  return match.length > 1 ? (match.find((v) => /paddle only/i.test(v.title)) || match[0]) : match[0];
}

function throttled(ip) {
  const now = Date.now(), recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now); hits.set(ip, recent);
  return recent.length > MAX_HITS;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, error: 'method_not_allowed' }); }
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch (e) { return res.status(400).json({ ok: false, error: 'bad_json' }); }
  const raw = body && Array.isArray(body.lines) ? body.lines : null;
  if (!raw || !raw.length || raw.length > MAX_LINES) return res.status(400).json({ ok: false, error: 'invalid' });
  const lines = raw.map((l) => ({ handle: String((l && l.handle) || ''), qty: Math.floor(Number(l && l.qty)),
    options: Array.isArray(l && l.options) ? l.options.slice(0, 3).map((o) => String(o).slice(0, 60)).filter(Boolean) : [] }));
  if (lines.some((l) => !HANDLE.test(l.handle) || !(l.qty >= 1 && l.qty <= MAX_QTY))) return res.status(400).json({ ok: false, error: 'invalid' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (throttled(ip)) return res.status(429).json({ ok: false, error: 'rate_limited' });
  try {
    const byHandle = await variantsFor([...new Set(lines.map((l) => l.handle))], ip);
    const soldOut = [], merch = [];
    lines.forEach((l, i) => {
      const v = byHandle[l.handle] && pick(byHandle[l.handle], l.options);
      if (!v || !v.availableForSale) soldOut.push(i); else merch.push({ merchandiseId: v.id, quantity: l.qty });
    });
    if (soldOut.length) return res.status(409).json({ ok: false, error: 'sold_out', lines: soldOut });
    const data = await storefront(`mutation($input: CartInput!) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { field message } } }`,
      { input: { lines: merch, attributes: [{ key: '_source', value: SOURCE }] } }, ip);
    const c = data.cartCreate;
    if (c.userErrors.length || !c.cart) throw new Error(`cartCreate: ${c.userErrors.map((e) => e.message).join('; ')}`);
    return res.status(200).json({ ok: true, url: c.cart.checkoutUrl });
  } catch (e) {
    console.error('checkout failed:', e.message);   // never the token
    return res.status(502).json({ ok: false, error: 'checkout_failed' });
  }
};
