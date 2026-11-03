/* POST /api/lead: every YURI form (contact, demo days, partner, newsletter) into GoHighLevel.
 * website-tracking-and-lead-capture-standard §2 and §3, ghl-website-forms-spec §7 (vault 06-Engineering/_reference).
 * Delivery is three calls: upsert the contact with NO tags in the body, add the tags, then write the note.
 * Env (Vercel only, never in the repo): GHL_PRIVATE_TOKEN, GHL_LOCATION_ID. The browser never talks to GHL. */
const API = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';
const SOURCE = 'yuripickleballpaddles.com';
const CAPS = { name: 120, email: 254, phone: 40, company: 160, need: 80, budget: 60, message: 5000, page: 200, form_id: 40 };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const WINDOW_MS = 10 * 60 * 1000, MAX_HITS = 5;
const hits = new Map();   // ip -> timestamps; per function instance

const isConfigured = () => Boolean(process.env.GHL_PRIVATE_TOKEN && process.env.GHL_LOCATION_ID);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// An inquiry with the newsletter box ticked also gets the newsletter tag (consent, Sun 2026-11-03)
// The form mode tag names the form an inquiry came from (standard §2, Sun 2026-11-03)
const FORM_TAG = { contact: 'website-contact', demo: 'website-demo', partner: 'website-partner' };
const tagsFor = (l) => ['website', l.type === 'newsletter' ? 'newsletter' : 'website-inquiry', ...(l.need ? [slug(l.need)] : []),
  ...(l.type === 'contact' && FORM_TAG[l.form_id] ? [FORM_TAG[l.form_id]] : []), ...(l.type === 'contact' && l.newsletter ? ['newsletter'] : [])];
const splitName = (n = '') => { const p = n.trim().split(/\s+/).filter(Boolean); return p.length ? { firstName: p[0], lastName: p.slice(1).join(' ') || undefined } : {}; };
const noteFor = (l) => [`Website inquiry${l.page ? ` from ${l.page}` : ''}`, l.need && `Need: ${l.need}`, l.budget && `Budget: ${l.budget}`,
  l.company && `Company: ${l.company}`, l.phone && `Phone: ${l.phone}`, `Newsletter: ${l.newsletter ? 'yes' : 'no'}`, l.message && `Message:\n${l.message}`].filter(Boolean).join('\n');

async function deliverLead(lead) {
  const headers = { Authorization: `Bearer ${process.env.GHL_PRIVATE_TOKEN}`, Version: API_VERSION, 'Content-Type': 'application/json', Accept: 'application/json' };
  const post = (path, body) => fetch(API + path, { method: 'POST', headers, signal: AbortSignal.timeout(10000), body: JSON.stringify(body) });
  const up = await post('/contacts/upsert', { locationId: process.env.GHL_LOCATION_ID, ...splitName(lead.name), email: lead.email,
    phone: lead.phone || undefined, companyName: lead.company || undefined, source: SOURCE });
  if (!up.ok) throw new Error(`GHL upsert ${up.status}`);
  const id = ((await up.json()) || {}).contact?.id;
  if (!id) throw new Error('GHL upsert returned no contact id');
  // Tags through Add Tags, never the upsert body: tags on upsert overwrite every tag the contact already has
  const tagged = await post(`/contacts/${id}/tags`, { tags: tagsFor(lead) });
  if (!tagged.ok) throw new Error(`GHL tags ${tagged.status}`);   // website-inquiry triggers the workflow, so this is fatal
  if (lead.type === 'contact') {
    const note = await post(`/contacts/${id}/notes`, { body: noteFor(lead) });
    if (!note.ok) console.error(`GHL note ${note.status} for contact ${id}`);   // the contact and tags landed; not fatal
  }
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
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'bad_json' });
  if (body.website) return res.status(200).json({ ok: true });   // honeypot: bots get a fake success
  const lead = { type: body.type === 'newsletter' ? 'newsletter' : 'contact' };
  for (const [k, cap] of Object.entries(CAPS)) lead[k] = String(body[k] ?? '').trim().slice(0, cap);
  lead.newsletter = body.newsletter === true;
  const fields = [];
  if (!EMAIL.test(lead.email)) fields.push('email');
  if (lead.type === 'contact') { if (!lead.name) fields.push('name'); if (!lead.need) fields.push('need'); }
  if (fields.length) return res.status(400).json({ ok: false, error: 'invalid', fields });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (throttled(ip)) return res.status(429).json({ ok: false, error: 'rate_limited' });
  if (!isConfigured()) return res.status(503).json({ ok: false, error: 'not_configured' });
  try {
    await deliverLead(lead);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('lead delivery failed:', e.message);   // never the token
    return res.status(502).json({ ok: false, error: 'delivery_failed' });
  }
};
