/* YURI analytics: website-tracking-and-lead-capture-standard (vault 06-Engineering/_reference), 2026-11-03.
 * registry (EVENTS) -> track() -> window.dataLayer -> GTM -> GA4. Event names come only from EVENTS (snake_case);
 * where a click happened goes in link_location, never in the name. Page views come from the Google tag in GTM.
 * GTM loads on the live domain only, when Analytics is on: by the visitor's choice, or by the region default below.
 * Debug: ?debug_analytics=1 shows every event on screen for the tab; ?debug_analytics=0 turns it off.
 * Static-site version of OPD's lib/analytics.ts, ClickTracker, Analytics and AnalyticsDebugOverlay. */
(() => {
  const Y = (window.YURI = window.YURI || {});

  /* ---------- registry ---------- */
  const EVENTS = {   // event -> See-Think-Do stage (intent_stage). No booking engine, FAQ, video or chat on this site.
    nav_click: 'see', cta_click: 'think', outbound_click: 'think', email_click: 'think',
    generate_lead: 'do', sign_up: 'do', phone_click: 'do',
  };
  const PARAMS = ['link_location', 'link_url', 'link_text', 'page_path', 'link_domain', 'item_id', 'form_id', 'intent_stage'];
  const SITE_HOSTS = ['yuripickleballpaddles.com', 'www.yuripickleballpaddles.com'];   // the store subdomain counts as outbound
  const isLiveHost = () => SITE_HOSTS.includes(location.hostname);
  const BUTTON_CLASS = 'btn';
  const BOOKING_HOSTS = [];
  const NAV_LOCS = ['header', 'mobile_menu', 'footer', 'breadcrumb'];
  const DEBUG_KEY = 'yuri_debug_analytics';
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function isDebug() {
    try {
      const f = new URLSearchParams(location.search).get('debug_analytics');
      if (f === '1') sessionStorage.setItem(DEBUG_KEY, '1');
      if (f === '0') sessionStorage.removeItem(DEBUG_KEY);
      return sessionStorage.getItem(DEBUG_KEY) === '1';
    } catch (e) { return false; }
  }

  /* ---------- emitter: every standard parameter is reset on each push, so GTM never carries an old value over ---------- */
  function track(name, params = {}) {
    if (!(name in EVENTS)) { console.warn('analytics: not in the registry:', name); return; }
    const p = Object.fromEntries(PARAMS.map((k) => [k, undefined]));
    Object.assign(p, { page_path: location.pathname, intent_stage: EVENTS[name] }, params);
    window.dataLayer.push({ event: name, ...p });
    if (debug) debug(name, p);
  }

  /* ---------- click tracker: one capture-phase listener for every link ---------- */
  function linkLocation(el) {
    const marked = el.closest('[data-evt-loc]'); if (marked) return marked.dataset.evtLoc;
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('[aria-label="Breadcrumb"]')) return 'breadcrumb';
    const s = el.closest('section[id]'); if (s && s.id.startsWith('hero')) return 'hero';
    return el.classList.contains(BUTTON_CLASS) ? 'section_cta' : 'inline_body';
  }
  function linkText(a) {
    const c = a.cloneNode(true); c.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove());
    return (c.textContent.replace(/\s+/g, ' ').trim() || a.getAttribute('aria-label') || '').slice(0, 100);
  }
  function classify(a, loc) {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('tel:')) return ['phone_click', {}];
    if (href.startsWith('mailto:')) return ['email_click', {}];
    let host = '';
    try { host = new URL(href, location.href).hostname.toLowerCase(); } catch (e) { /* treat as internal */ }
    if (host && BOOKING_HOSTS.some((b) => host.includes(b))) return ['booking_click', { link_domain: host }];
    if (host && host !== location.hostname && !SITE_HOSTS.includes(host)) return ['outbound_click', { link_domain: host }];
    const o = a.closest('[data-evt]'); if (o && (o.dataset.evt === 'nav' || o.dataset.evt === 'cta')) return [o.dataset.evt + '_click', {}];
    return [NAV_LOCS.includes(loc) ? 'nav_click' : 'cta_click', {}];
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    const loc = linkLocation(a), [name, extra] = classify(a, loc);
    track(name, { link_location: loc, link_url: a.getAttribute('href'), link_text: linkText(a), ...extra });
  }, true);

  /* ---------- default before a choice (Sun, 2026-11-03; copy/cookie-banner.md): Analytics on, except opt-in in the EU,
     EEA, UK, Switzerland and California; Marketing off everywhere. Unknown location means opt-in. Revisit at $10K in sales. ---------- */
  const OPT_IN = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
    'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH']);
  const GEO_KEY = 'yuri_consent_default';
  function consentDefault() {
    const off = { analytics: false, marketing: false };
    if (!isLiveHost()) return Promise.resolve(off);
    try { const c = sessionStorage.getItem(GEO_KEY); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) { /* no storage */ }
    return fetch('/api/geo').then((r) => r.json()).then((g) => {
      const optIn = !g.country || OPT_IN.has(g.country) || (g.country === 'US' && g.region === 'CA');
      const st = { analytics: !optIn, marketing: false };
      try { sessionStorage.setItem(GEO_KEY, JSON.stringify(st)); } catch (e) { /* no storage */ }
      return st;
    }).catch(() => off);
  }

  /* ---------- GTM loader: live domain + Analytics consent; Marketing drives the ad signals; GPC means off ---------- */
  let gtmOn = false;
  function consent(st) {
    const ads = st && st.marketing ? 'granted' : 'denied';
    const c = { analytics_storage: st && st.analytics ? 'granted' : 'denied', ad_storage: ads, ad_user_data: ads, ad_personalization: ads };
    if (gtmOn) { gtag('consent', 'update', c); return; }
    const id = (document.querySelector('meta[name="gtm-id"]') || {}).content;
    if (!id || !isLiveHost() || navigator.globalPrivacyControl === true || !(st && st.analytics)) return;
    gtmOn = true;
    gtag('consent', 'default', c);
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id); document.head.appendChild(s);
  }

  /* ---------- debug overlay ---------- */
  let debug = null;
  if (isDebug()) {
    const box = document.createElement('div');
    box.setAttribute('role', 'log'); box.setAttribute('aria-label', 'Analytics debug');
    box.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:99999;width:340px;max-height:55vh;overflow:auto;padding:10px 12px;'
      + 'background:rgba(16,17,17,.94);color:#fff;font:11px/1.5 ui-monospace,Menlo,monospace;border-radius:8px';
    box.innerHTML = '<strong>analytics debug</strong> <span style="opacity:.6">?debug_analytics=0 to close</span><div></div>';
    const list = box.lastChild;
    debug = (name, p) => {
      const row = document.createElement('div'); row.style.cssText = 'border-top:1px solid rgba(255,255,255,.15);padding:4px 0';
      const shown = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined));
      row.innerHTML = '<span style="color:#ffd166"></span><pre style="margin:2px 0 0;white-space:pre-wrap;word-break:break-all"></pre>';
      row.firstChild.textContent = name + ' · ' + new Date().toLocaleTimeString(); row.lastChild.textContent = JSON.stringify(shown, null, 1);
      list.prepend(row);
    };
    const mount = () => document.body.appendChild(box);
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  }

  Y.track = track;
  Y.analyticsConsent = consent;
  Y.consentDefault = consentDefault;
})();
