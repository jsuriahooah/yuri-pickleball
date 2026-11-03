/*
 * YURI v3 prototypes: behaviour only. All markup and copy are generated into each page by _tools/*.py
 * from copy/*.md. This file wires: scroll-aware header + secondary nav, mega menus, mobile menu,
 * cart drawer (prototype cart in localStorage), hero slider, paddle map, all-paddles filters, compare tool,
 * product gallery, sticky mobile add to cart, forms, back to top, reveals and "not in this round" links.
 *
 * Review flags: ?state=panel (Paddles menu open) · ?state=menu (mobile menu) · ?scroll=600 (condensed header) · ?state=cart (drawer with 2 items)
 * · ?state=sent (forms show success) · ?motion=off · ?line=120-grit · ?level=new&play=relaxed
 */
(function () {
  'use strict';
  const Y = (window.YURI = window.YURI || {});
  const params = new URLSearchParams(location.search);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = () => params.get('motion') === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paddles = () => Y.paddles || [];
  // Accessory cart ids are "handle|colour|size" (round 5): the line takes its name, price and image from YURI.accessories
  const accById = (id) => {
    const [h, c, z] = id.split('|'), a = (Y.accessories || {})[h]; if (!a) return undefined;
    const lab = (v) => (v && a.labels[v]) || v;
    return { id, name: a.name, price: a.price, url: a.url, images: [(c && a.imgs[c]) || a.img], swatch: '', colour: [lab(c) || a.label, lab(z)].filter(Boolean).join(' · '), lineName: 'Accessories', acc: true };
  };
  const byId = (id) => paddles().find((p) => p.id === id) || accById(id);
  const live = (msg) => { const l = $('[data-live]'); if (!l) return; l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 30); };

  /* ---------- icons ---------- */
  const ICONS = {
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'arrow-left': '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-left': '<path d="m15 6-6 6 6 6"/>',
    'chevron-right': '<path d="m9 6 6 6-6 6"/>',
    'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'x': '<path d="M6 6l12 12M18 6 6 18"/>',
    'plus': '<path d="M12 5v14M5 12h14"/>',
    'minus': '<path d="M5 12h14"/>',
    'bag': '<path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    'check': '<path d="m5 12 5 5 9-10"/>',
    'pause': '<path d="M9 5v14M15 5v14"/>',
    'play': '<path d="M8 5v14l11-7Z"/>',
    'book': '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
    'shield': '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    'megaphone': '<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M17 8.5a5 5 0 0 1 0 7"/>',
    'calendar': '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
    'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    'heart': '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    'grid': '<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>',
    'swap': '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
    'carbon': '<path d="M4 4h16v16H4z"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
    'core': '<path d="M12 3 19 7v10l-7 4-7-4V7Z"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4Z"/>',
    'grit': '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 9h.01M12 8h.01M15.5 9.5h.01M9 12.5h.01M12.5 12h.01M15 14h.01M10.5 15.5h.01"/>',
  };
  function sprite() {
    const s = Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('');
    const d = document.createElement('div');
    d.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${s}</svg>`;
    document.body.prepend(d.firstChild);
  }
  const icon = (n) => `<svg class="i" aria-hidden="true"><use href="#i-${n}"></use></svg>`;

  /* ---------- scroll lock ---------- */
  const locks = new Set();
  function lock(key, on) { on ? locks.add(key) : locks.delete(key); document.documentElement.classList.toggle('is-locked', locks.size > 0); }

  /* ---------- header: top, scrolled, hidden (+ secondary nav) ---------- */
  function header() {
    const h = $('#site-header'), sec = $('#sec-nav');
    if (!h) return;
    const useSec = document.body.dataset.secondary === 'on' && sec;
    let prevY = scrollY, ticking = false;
    const apply = () => {
      ticking = false;
      const y = scrollY;
      const menuOpen = locks.size > 0;
      let hidden = h.dataset.state === 'hidden';
      if (y > 100) {
        if (y > prevY) hidden = true;
        else if (y < prevY - 4) hidden = false;
      } else hidden = false;
      if (menuOpen) hidden = false;
      h.dataset.state = hidden ? 'hidden' : y < 10 ? 'top' : 'scrolled';
      if (useSec) {
        const on = hidden && !menuOpen;
        sec.classList.toggle('is-on', on);
        sec.setAttribute('aria-hidden', String(!on));
        $$('a, button', sec).forEach((x) => (x.tabIndex = on ? 0 : -1));
        document.body.classList.toggle('secondary-nav-active', on);
      }
      prevY = y;
      const btt = $('.back-to-top'); if (btt) btt.hidden = y < 400;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    apply();
    Y.headerApply = apply;
  }

  /* ---------- mega menus ---------- */
  function mega() {
    const triggers = $$('.nav-trigger');
    let open = null;
    const close = (focus) => {
      if (!open) return;
      const t = $(`.nav-trigger[data-panel="${open}"]`), p = $(`#panel-${open}`);
      t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-label', t.dataset.openLabel);
      p.classList.remove('is-open'); setTimeout(() => { if (!p.classList.contains('is-open')) p.hidden = true; }, reduced() ? 0 : 280);
      open = null; lock('mega', false); document.body.classList.remove('mega-open');
      if (focus) t.focus();
    };
    const show = (key) => {
      if (open === key) return close();
      close();
      const t = $(`.nav-trigger[data-panel="${key}"]`), p = $(`#panel-${key}`);
      p.hidden = false; requestAnimationFrame(() => p.classList.add('is-open'));
      t.setAttribute('aria-expanded', 'true'); t.setAttribute('aria-label', t.dataset.closeLabel);
      open = key; lock('mega', true); document.body.classList.add('mega-open');
    };
    triggers.forEach((t) => t.addEventListener('click', () => show(t.dataset.panel)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(true); });
    document.addEventListener('click', (e) => { if (open && !e.target.closest('.mega, .nav-trigger')) close(); });
    $$('.mega a').forEach((a) => a.addEventListener('click', () => close()));
    if (params.get('state') === 'panel') show('paddles');
    Y.closeMega = close;
  }

  /* ---------- mobile menu (round 2: two columns, no accordion, scrolls inside, closes on link, button or Escape) ---------- */
  function mobileMenu() {
    const b = $('.menu-btn'), m = $('#mobile-menu');
    if (!b || !m) return;
    const set = (on, focusBack) => {
      m.hidden = !on; b.setAttribute('aria-expanded', String(on));
      b.setAttribute('aria-label', on ? b.dataset.closeLabel : b.dataset.openLabel);
      b.innerHTML = icon(on ? 'x' : 'menu');
      lock('menu', on); document.body.classList.toggle('menu-open', on);
      if (Y.headerApply) Y.headerApply();
      if (on) { const inner = $('.mobile-menu__in', m); inner.scrollTop = 0; m.tabIndex = -1; m.focus({ preventScroll: true }); }
      else if (focusBack) b.focus();
    };
    b.addEventListener('click', () => set(m.hidden, false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !m.hidden) set(false, true); });
    $$('a', m).forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('resize', () => { if (!m.hidden && innerWidth >= 1024) set(false); });
    if (params.get('state') === 'menu') set(true);
    Y.menu = set;
  }

  /* ---------- cart (prototype: localStorage stands in for the Storefront API cart) ---------- */
  const CART_KEY = 'yuri-v3-cart';
  const cart = {
    lines: [],
    load() { try { this.lines = JSON.parse(localStorage.getItem(CART_KEY) || '[]').filter((l) => byId(l.id)); } catch (e) { this.lines = []; } },
    save() { try { localStorage.setItem(CART_KEY, JSON.stringify(this.lines)); } catch (e) { /* private mode: cart lives for this page view */ } },
    count() { return this.lines.reduce((n, l) => n + l.qty, 0); },
    add(id, qty = 1) { const l = this.lines.find((x) => x.id === id); if (l) l.qty += qty; else this.lines.push({ id, qty }); this.save(); },
    set(id, qty) { this.lines = this.lines.map((l) => (l.id === id ? { ...l, qty } : l)).filter((l) => l.qty > 0); this.save(); },
  };
  const money = (n) => '$' + n.toFixed(n % 1 ? 2 : 0);   // accessories can cost $2.50
  function renderCart() {
    const d = $('#cart-drawer'); if (!d) return;
    const n = cart.count();
    $$('.cart-btn').forEach((b) => {
      b.setAttribute('aria-label', n === 0 ? 'Cart, empty' : n === 1 ? 'Cart, 1 item' : `Cart, ${n} items`);
      const c = $('.cart-count', b); c.textContent = n; c.hidden = n === 0;
    });
    const list = $('[data-cart-lines]', d);
    list.innerHTML = cart.lines.map((l) => {
      const p = byId(l.id), img = p.images[0];
      const sw = !p.swatch ? '' : p.swatch === 'split' ? '<span class="swatch swatch--split" aria-hidden="true"></span>' : `<span class="swatch${p.swatch === '#1A1A1A' ? ' swatch--dark' : ''}" style="--sw:${p.swatch}" aria-hidden="true"></span>`;
      const colour = p.colour.replace(/\[CONFIRM: ([^\]]+)\]/, '<mark class="confirm confirm--sm">CONFIRM: $1</mark>');
      return `<li class="line" data-line-id="${p.id}">
        <a class="line__img" href="${p.acc ? p.url : linkFor(p.url)}" tabindex="-1" aria-hidden="true">${img ? `<img src="${img}" alt="">` : ''}</a>
        <div class="line__info"><a class="line__name" href="${p.acc ? p.url : linkFor(p.url)}">${p.name}</a>
          <span class="colour">${sw}<span class="colour__name">${colour}</span></span><span class="line__line label">${p.lineName}</span>
          <div class="line__row"><div class="stepper" role="group" aria-label="${d.dataset.qtyLabel}">
            <button type="button" class="icon-btn" data-qty="-1" aria-label="${d.dataset.removeOne}">${icon('minus')}</button>
            <span class="stepper__n" aria-live="polite">${l.qty}</span>
            <button type="button" class="icon-btn" data-qty="1" aria-label="${d.dataset.addOne}">${icon('plus')}</button></div>
            <button type="button" class="line__remove" data-remove>${d.dataset.remove}</button></div></div>
        <span class="price line__price">${money(parseFloat(p.price.slice(1)) * l.qty)}</span></li>`;
    }).join('');
    const sub = cart.lines.reduce((s, l) => s + parseFloat(byId(l.id).price.slice(1)) * l.qty, 0);
    $('[data-cart-subtotal]', d).textContent = money(sub);
    $('[data-cart-empty]', d).hidden = n > 0;
    $('[data-cart-foot]', d).hidden = n === 0;
    list.hidden = n === 0;
  }
  let lastFocus = null;
  function openCart() {
    const d = $('#cart-drawer'), s = $('[data-scrim]');
    if (Y.closeMega) Y.closeMega();
    lastFocus = document.activeElement;
    d.hidden = false; s.hidden = false;
    requestAnimationFrame(() => { d.classList.add('is-open'); s.classList.add('is-open'); });
    lock('cart', true);
    setTimeout(() => $('[data-cart-close]', d).focus(), 30);
  }
  function closeCart() {
    const d = $('#cart-drawer'), s = $('[data-scrim]');
    d.classList.remove('is-open'); s.classList.remove('is-open'); lock('cart', false);
    setTimeout(() => { d.hidden = true; s.hidden = true; }, reduced() ? 0 : 280);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function cartWire() {
    const d = $('#cart-drawer'); if (!d) return;
    cart.load();
    if (params.get('state') === 'cart' && !cart.lines.length) { cart.add('paddles-pink-and-chic'); cart.add('paddles-cobra'); }
    renderCart();
    $$('[data-cart-open]').forEach((b) => b.addEventListener('click', openCart));
    $('[data-cart-close]', d).addEventListener('click', closeCart);
    $('[data-scrim]').addEventListener('click', closeCart);
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCart();
      if (e.key === 'Tab') {
        const f = $$('a[href], button:not([disabled])', d).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    d.addEventListener('click', (e) => {
      const li = e.target.closest('[data-line-id]'); if (!li) return;
      const id = li.dataset.lineId, l = cart.lines.find((x) => x.id === id);
      const q = e.target.closest('[data-qty]');
      if (q) { cart.set(id, l.qty + +q.dataset.qty); renderCart(); const again = $(`[data-line-id="${id}"] [data-qty="${q.dataset.qty}"]`, d); (again || $('[data-cart-close]', d)).focus(); }
      if (e.target.closest('[data-remove]')) { cart.set(id, 0); renderCart(); $('[data-cart-close]', d).focus(); }
    });
    $('[data-checkout]', d).addEventListener('click', (e) => {
      const b = e.currentTarget, span = $('span', b), was = span.textContent;
      b.disabled = true; span.textContent = d.dataset.checkoutLoading;
      setTimeout(() => { b.disabled = false; span.textContent = was; toast('Prototype: Checkout goes straight to Shopify checkout (cart.checkoutUrl).'); }, 900);
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add]'); if (!b) return;
      e.preventDefault();
      const p = byId(b.dataset.add); if (!p) return;
      const qtyEl = b.dataset.qtyFrom ? $(b.dataset.qtyFrom) : null;
      const qty = qtyEl ? Math.max(1, +qtyEl.textContent || 1) : 1;
      const span = $('span', b), was = span.innerHTML;
      b.disabled = true; span.textContent = b.dataset.adding || span.textContent;
      setTimeout(() => {
        cart.add(p.id, qty); renderCart();
        b.classList.add('is-added'); span.innerHTML = `${icon('check')} ${b.dataset.added || 'Added'}`;
        live(d.dataset.added.replace('{Paddle name}', p.name));
        setTimeout(() => { b.classList.remove('is-added'); b.disabled = false; span.innerHTML = was; openCart(); }, reduced() ? 300 : 1200);
      }, 350);
    });
    if (params.get('state') === 'cart') openCart();
    // accessory cards: the product, colour and size pickers set the Add to cart id and swap the photo
    $$('[data-acc]').forEach((card) => {
      const sync = () => {
        const pick = $('[data-acc-handle]', card), col = $('[data-acc-colour]', card), size = $('[data-acc-size]', card);
        const h = pick ? pick.value : card.dataset.acc, a = (Y.accessories || {})[h]; if (!a) return;
        const btn = $('[data-add]', card), img = $('.acard__img img', card);
        btn.dataset.add = [h, col ? col.value : '', size ? size.value : ''].join('|').replace(/\|+$/, '');
        const src = (col && a.imgs[col.value]) || a.img; if (img && src && img.getAttribute('src') !== src) img.src = src; const cap = $('[data-acc-cap]', card); if (cap) { cap.hidden = !col || !!a.imgs[col.value]; cap.textContent = cap.dataset.none; }
        const opt = col && col.selectedOptions[0]; btn.disabled = !!(opt && opt.dataset.soldOut);
      };
      card.addEventListener('change', sync); sync();
    });
  }

  /* ---------- hero slider ---------- */
  /* ---------- notice ribbon (Sun, 2026-10-28): one message at a time, every 6 s ---------- */
  function ribbon() {
    const r = $('[data-ribbon]'); if (!r) return;
    const items = $$('.ribbon__msgs li', r); if (items.length < 2 || reduced()) return;
    let k = 0, held = false;
    r.addEventListener('mouseenter', () => { held = true; }); r.addEventListener('mouseleave', () => { held = false; });
    r.addEventListener('focusin', () => { held = true; }); r.addEventListener('focusout', () => { held = false; });
    setInterval(() => { if (held) return; items[k].hidden = true; k = (k + 1) % items.length; items[k].hidden = false; }, 6000);
  }

  function slider() {
    const root = $('[data-slider]'); if (!root) return;
    const slides = $$('.slide', root), dots = $$('[data-dot]', root);
    const pauseBtn = $('[data-pause]', root);
    let i = 0, timer = null, toneTimer = null, playing = !reduced(), userPaused = false, hover = false;
    const go = (n, focus) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, j) => { const on = j === i; s.classList.toggle('is-active', on); s.inert = !on; s.setAttribute('aria-hidden', String(!on)); });
      dots.forEach((d, j) => { d.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      // Switch the header and tagline tone halfway through the crossfade, when the new slide is mostly in
      // (2026-10-28: switching at the start showed white text over a light slide for a moment).
      const tone = slides[i].dataset.tone || 'light';
      clearTimeout(toneTimer);
      toneTimer = setTimeout(() => { document.body.dataset.heroTone = tone; root.dataset.tone = tone; }, reduced() ? 0 : 300);
      if (focus) slides[i].focus();
    };
    const tick = () => { clearTimeout(timer); if (playing && !hover && !userPaused) timer = setTimeout(() => { go(i + 1); tick(); }, 7000); };
    const setPlaying = (on) => {
      playing = on; userPaused = !on;
      pauseBtn.setAttribute('aria-label', on ? pauseBtn.dataset.pauseLabel : pauseBtn.dataset.playLabel);
      pauseBtn.innerHTML = icon(on ? 'pause' : 'play');
      tick();
    };
    pauseBtn.addEventListener('click', () => setPlaying(!playing || userPaused ? true : false));
    $('[data-prev]', root).addEventListener('click', () => { setPlaying(false); go(i - 1); });
    $('[data-next]', root).addEventListener('click', () => { setPlaying(false); go(i + 1); });
    dots.forEach((d, j) => d.addEventListener('click', () => { setPlaying(false); go(j); }));
    root.addEventListener('mouseenter', () => { hover = true; tick(); });
    root.addEventListener('mouseleave', () => { hover = false; tick(); });
    root.addEventListener('focusin', () => { hover = true; tick(); });
    root.addEventListener('focusout', () => { hover = false; tick(); });
    const s = +params.get('slide'); if (s) go(s - 1); else go(0);
    if (!playing) { pauseBtn.setAttribute('aria-label', pauseBtn.dataset.playLabel); pauseBtn.innerHTML = icon('play'); userPaused = true; }
    tick();
    Y.slider = { go, state: () => ({ i, playing: playing && !userPaused }) };
  }

  /* ---------- paddle grid filter bar (round 2: line, level, game play; filters simply filter) ---------- */
  function paddleMap(root) {
    const grid = $('[data-pgrid]', root), cards = $$('.pcard', grid);
    const status = $('[data-pmap-status]', root), sub = $('[data-pmap-sub]', root), none = $('[data-pmap-none]', root);
    const st = { level: params.get('level') || '', play: params.get('play') || '', line: params.get('line') || '' };
    const valid = { level: ['new', 'regular', 'experienced'], play: ['aggressive', 'relaxed'], line: ['signature', '120-grit', 'foam-tech', 'gen-4-honeycomb'] };
    Object.keys(st).forEach((k) => { if (!valid[k].includes(st[k])) st[k] = ''; });
    const sync = (fromUser) => {
      $$('[data-level]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === st.level)));
      $$('[data-play]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.play === st.play)));
      $$('[data-line]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.line === st.line)));
      const picks = st.level && st.play ? ((Y.finder || {})[st.level] || {})[st.play] || [] : [];
      let n = 0;
      cards.forEach((c) => {
        const ok = (!st.line || c.dataset.line === st.line) && (!st.level || c.dataset.levels.split(' ').includes(st.level)) && (!st.play || c.dataset.play === st.play);
        c.hidden = !ok; if (ok) n++;
        const rank = picks.indexOf(c.dataset.paddle);
        c.style.order = rank >= 0 ? rank : 100 + +c.dataset.i;
      });
      // round 3: renumber the visible cards (01, 02...) in the order they show
      cards.filter((c) => !c.hidden).sort((a, b) => (+a.style.order || 0) - (+b.style.order || 0))
        .forEach((c, k) => { const num = $('.pcard__num', c); if (num) num.textContent = String(k + 1).padStart(2, '0'); });
      const any = st.level || st.play || st.line;
      none.hidden = !(any && n === 0);
      status.textContent = any ? root.dataset.status.replace('{n}', n) : '';
      if (st.level) { sub.textContent = root.dataset['sub' + st.level[0].toUpperCase() + st.level.slice(1)]; sub.hidden = false; } else sub.hidden = true;
      if (fromUser) {
        const q = new URLSearchParams(location.search);
        ['line', 'level', 'play'].forEach((k) => (st[k] ? q.set(k, st[k]) : q.delete(k)));
        history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      }
    };
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button.pill'); if (!b || !root.contains(b)) return;
      if ('level' in b.dataset) st.level = st.level === b.dataset.level ? '' : b.dataset.level;
      else if ('play' in b.dataset) st.play = st.play === b.dataset.play ? '' : b.dataset.play;
      else if ('line' in b.dataset) st.line = b.dataset.line;
      else return;
      sync(true);
    });
    sync(false);
  }

  /* ---------- all paddles: filters and sort (/paddles) ---------- */
  function allGrid(root) {
    const grid = $('[data-pgrid]', root), cards = $$('.pcard', grid);
    const sel = $$('select[data-filter]', root);
    const status = $('[data-all-status]', root);
    let sort = '';
    const apply = () => {
      const f = Object.fromEntries(sel.map((s) => [s.dataset.filter, s.value]));
      let n = 0;
      cards.forEach((c) => {
        const ok = (!f.line || c.dataset.line === f.line) && (!f.cat || c.dataset.cat === f.cat) &&
          (!f.level || c.dataset.levels.split(' ').includes(f.level)) && (!f.play || c.dataset.play === f.play);
        c.hidden = !ok; if (ok) n++;
      });
      const key = { light: (c) => +c.dataset.weight, mm: (c) => +c.dataset.mm * 100 + +c.dataset.weight, price: (c) => +c.dataset.price }[sort];
      const ordered = key ? [...cards].sort((a, b) => key(a) - key(b) || a.dataset.i - b.dataset.i) : cards;
      ordered.forEach((c, i) => (c.style.order = i));
      if (status) status.textContent = (status.dataset.tpl || '').replace('{n}', n);
    };
    sel.forEach((s) => s.addEventListener('change', apply));
    $$('[data-sort]', root).forEach((b) => b.addEventListener('click', () => {
      sort = sort === b.dataset.sort ? '' : b.dataset.sort;
      $$('[data-sort]', root).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.sort === sort)));
      apply();
    }));
    const clr = $('[data-all-clear]', root);
    if (clr) clr.addEventListener('click', () => { sel.forEach((s) => (s.value = '')); sort = ''; $$('[data-sort]', root).forEach((x) => x.setAttribute('aria-pressed', 'false')); apply(); });
    apply();
  }

  /* ---------- compare tool ---------- */
  function compare(root) {
    const a = $('#cmp-a', root), b = $('#cmp-b', root), out = $('[data-cmp-out]', root), msg = $('[data-cmp-msg]', root);
    const rows = JSON.parse(root.dataset.rows), tpl = { none: root.dataset.none, one: root.dataset.one };
    const specFor = (p, row) => {
      const s = Object.fromEntries(p.spec);
      const alias = { 'Best for': p.play === 'relaxed' ? 'Relaxed game play' : 'Aggressive game play',
        Level: p.levels.map((k) => ({ new: 'Beginner (3.0 and under)', regular: 'Intermediate (3.5 to 4.0)', experienced: 'Advanced (4.5+)' })[k]).join(' · '),
        Size: s['Size (length × width)'] };
      const v = row in alias ? alias[row] : s[row];
      return (v || '').replace(/\[CONFIRM: ([^\]]+)\]/g, '<mark class="confirm confirm--sm">CONFIRM: $1</mark>');
    };
    const draw = (fromUser) => {
      const pa = byId(a.value), pb = byId(b.value);
      if (!pa && !pb) { msg.textContent = tpl.none; out.innerHTML = ''; }
      else if (!pa || !pb) { msg.textContent = tpl.one; out.innerHTML = ''; }
      else {
        msg.textContent = '';
        const head = (p) => `<th scope="col"><span class="cmp__th">${p.images[0] ? `<img src="${p.images[0]}" alt="">` : ''}<span class="cmp__name">${p.name}</span><span class="price">${p.price}</span></span></th>`;
        out.innerHTML = `<div class="table-frame"><table class="spec-table spec-table--cmp"><thead><tr><th scope="col"><span class="visually-hidden">Spec</span></th>${head(pa)}${head(pb)}</tr></thead><tbody>${
          rows.map((r) => { const va = specFor(pa, r), vb = specFor(pb, r); return `<tr class="${va !== vb ? 'is-diff' : ''}"><th scope="row">${r}</th><td>${va}</td><td>${vb}</td></tr>`; }).join('')
        }</tbody></table></div><div class="cmp__actions">${[pa, pb].map((p) => `<div><button type="button" class="btn btn--primary" data-add="${p.id}"><span>${root.dataset.addTpl.replace('{Model}', p.name)}</span></button> <a class="text-action" href="${linkFor(p.url)}"><span>${root.dataset.seeTpl.replace('{Model}', p.name)}</span>${icon('arrow-right')}</a></div>`).join('')}</div>`;
      }
      sync();
      if (fromUser) {
        const q = new URLSearchParams(location.search); q.delete('a'); q.delete('b'); if (a.value) q.set('a', a.value.replace('paddles-', '')); if (b.value) q.set('b', b.value.replace('paddles-', ''));
        history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + '#compare-tool');
      }
    };
    // Compare ticks on the /paddles cards and the tray (Sun, 2026-10-30): a third tick replaces the oldest pick.
    const picks = $$('[data-cmp-pick]'), tray = $('[data-cmp-tray]');
    let inView = false;
    function sync() {
      picks.forEach((x) => x.setAttribute('aria-pressed', String(!!x.dataset.cmpPick && (x.dataset.cmpPick === a.value || x.dataset.cmpPick === b.value))));
      if (!tray) return;
      const names = [a.value, b.value].map(byId).filter(Boolean).map((p) => p.name);
      $('[data-cmp-tray-names]', tray).textContent = names.length === 2 ? names.join(' · ') : names.length ? `${names[0]} · ${tpl.one}` : '';
      $('[data-cmp-tray-go]', tray).hidden = names.length < 2;
      tray.hidden = !names.length || inView;
      // sit above the cookie banner while it is open and in the way
      tray.style.bottom = '';
      const ck = $('[data-cookie]');
      if (!tray.hidden && ck && !ck.hidden && ck.getClientRects().length) {
        const r1 = tray.getBoundingClientRect(), r2 = ck.getBoundingClientRect();
        if (r1.left < r2.right && r2.left < r1.right && r1.bottom > r2.top) tray.style.bottom = `${innerHeight - r2.top + 12}px`;
      }
    }
    picks.forEach((x) => x.addEventListener('click', () => {
      const id = x.dataset.cmpPick;
      if (a.value === id) { a.value = b.value; b.value = ''; }
      else if (b.value === id) b.value = '';
      else if (!a.value) a.value = id;
      else if (!b.value) b.value = id;
      else { a.value = b.value; b.value = id; }
      draw(true);
    }));
    if (tray) {
      $('[data-cmp-clear]', tray).addEventListener('click', () => { a.value = ''; b.value = ''; draw(true); });
      const sec = root.closest('section') || root;
      if ('IntersectionObserver' in window) new IntersectionObserver((es) => { inView = es[0].isIntersecting; sync(); }).observe(sec);
      addEventListener('resize', sync); $$('[data-cookie] button, [data-cookie-choice]').forEach((x) => x.addEventListener('click', () => setTimeout(sync, 0)));
    }
    const fromQ = (k) => { const v = params.get(k); return v ? 'paddles-' + v.replace(/^paddles-/, '') : ''; };
    a.value = byId(fromQ('a')) ? fromQ('a') : ''; b.value = byId(fromQ('b')) ? fromQ('b') : '';
    [a, b].forEach((s) => s.addEventListener('change', () => draw(true)));
    $('[data-swap]', root).addEventListener('click', () => { const t = a.value; a.value = b.value; b.value = t; draw(true); });
    $$('[data-pair]').forEach((x) => x.addEventListener('click', (e) => {
      e.preventDefault(); const [p1, p2] = x.dataset.pair.split(','); a.value = p1; b.value = p2; draw(true);
      root.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    }));
    draw(false);
  }

  /* ---------- product gallery ---------- */
  function gallery(el) {
    const main = $('.gal__main img', el), cap = $('[data-gal-count]', el);
    if (!main) return;
    const thumbs = $$('.gal__thumbs button', el);
    thumbs.forEach((b, i) => b.addEventListener('click', () => {
      main.src = b.dataset.src; main.alt = b.dataset.alt;
      thumbs.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (cap) cap.textContent = `${String(i + 1).padStart(2, '0')} / ${String(thumbs.length).padStart(2, '0')}`;
    }));
  }

  /* ---------- sticky mobile add to cart ---------- */
  function sticky() {
    const bar = $('[data-sticky-atc]'), head = $('[data-atc-after]'), main = $('#add-to-cart');
    if (!bar || !head || !main) return;
    let pastHead = false, mainOn = false;
    const set = () => { const on = pastHead && !mainOn; bar.classList.toggle('is-on', on); bar.setAttribute('aria-hidden', String(!on)); $$('a,button', bar).forEach((x) => (x.tabIndex = on ? 0 : -1)); document.body.classList.toggle('has-sticky', on); };
    new IntersectionObserver(([e]) => { pastHead = !e.isIntersecting && e.boundingClientRect.top < 0; set(); }).observe(head);
    new IntersectionObserver(([e]) => { mainOn = e.isIntersecting; set(); }, { threshold: 0.1 }).observe(main);
  }

  /* ---------- qty steppers on product pages ---------- */
  function steppers() {
    $$('[data-qty-stepper]').forEach((s) => {
      const n = $('.stepper__n', s);
      $$('[data-step]', s).forEach((b) => b.addEventListener('click', () => { n.textContent = Math.max(1, (+n.textContent || 1) + +b.dataset.step); }));
    });
  }

  /* ---------- forms (no network in the prototype) ---------- */
  function forms() {
    const errs = Y.formErrors || {};
    $$('form[data-form]').forEach((f) => {
      const done = () => {
        const s = $('.form__success', f), name = (f.querySelector('[name$="name"]') || {}).value || 'there';
        const email = (f.querySelector('[type=email]') || {}).value || 'you@example.com';
        s.innerHTML = s.innerHTML.replace('{first name}', name.split(' ')[0] || 'there').replace('{email}', email);
        $$('.form__fields, .form__grid, .form__small, .form__actions', f).forEach((x) => (x.hidden = true));
        s.hidden = false; s.focus && s.setAttribute('tabindex', '-1'); s.focus();
      };
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        let first = null;
        $$('input, select, textarea', f).forEach((x) => {
          if (x.classList.contains('hp') || x.type === 'radio') return;
          const err = f.querySelector('#' + x.id + '-err'); if (!err) return;
          let m = '';
          if (x.required && !x.value.trim()) m = x.tagName === 'SELECT' ? errs.pick : errs.required;
          else if (x.type === 'email' && x.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.value)) m = errs.email;
          err.hidden = !m; err.innerHTML = m ? `<span class="visually-hidden">Error: </span>${m}` : '';
          x.setAttribute('aria-invalid', m ? 'true' : 'false');
          if (m && !first) first = x;
        });
        $$('fieldset.field--choice', f).forEach((fs) => {
          const req = fs.querySelector('input[required]'); if (!req) return;
          const err = $('.field__err', fs), ok = fs.querySelector('input:checked');
          err.hidden = !!ok; err.innerHTML = ok ? '' : `<span class="visually-hidden">Error: </span>${errs.pick}`;
          if (!ok && !first) first = fs.querySelector('input');
        });
        if (first) { first.focus(); return; }
        const b = $('button[type=submit]', f), span = $('span', b);
        b.disabled = true; span.textContent = b.dataset.sending || 'Sending…';
        setTimeout(done, 700);
      });
      if (params.get('state') === 'sent') done();
    });
  }

  /* ---------- blog category chips ---------- */
  function blogChips() {
    const root = $('[data-blog]'); if (!root) return;
    const chips = $$('[data-cat-chip]', root), secs = $$('[data-cat-section]', root), lab = $('[data-cat-showing]', root);
    const set = (c, fromUser) => {
      chips.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.catChip === c)));
      secs.forEach((s) => (s.hidden = c !== 'all' && s.dataset.catSection !== c));
      const chip = chips.find((x) => x.dataset.catChip === c);
      lab.textContent = lab.dataset.tpl.replace('{category}', chip ? chip.textContent : '');
      if (fromUser) history.replaceState(null, '', location.pathname + (c === 'all' ? '' : '?category=' + c));
    };
    chips.forEach((x) => x.addEventListener('click', () => set(x.dataset.catChip, true)));
    const q = params.get('category');
    set(chips.some((x) => x.dataset.catChip === q) ? q : 'all', false);
  }

  /* ---------- back to top (JS easing, never CSS smooth scroll on html) ---------- */
  function backToTop() {
    const b = $('.back-to-top'); if (!b) return;
    b.addEventListener('click', () => {
      if (reduced()) { scrollTo(0, 0); return; }
      const start = scrollY, dur = Math.min(900, Math.max(400, start * 0.4)), t0 = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const step = (now) => { const t = Math.min(1, (now - t0) / dur); scrollTo(0, start * (1 - ease(t))); if (t < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
      $('#main-content').focus({ preventScroll: true });
    });
  }

  /* ---------- links not in this round ---------- */
  function linkFor(route) {
    const r = (Y.routes || {})[route.split(/[?#]/)[0]];
    return r ? r + (route.includes('#') ? '#' + route.split('#')[1] : '') : '#';
  }
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'proto-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }
  function missing() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-proto-missing]'); if (!a) return;
      e.preventDefault();
      toast(a.dataset.protoKind === 'store' ? `Opens the YURI store (Shopify): ${a.dataset.protoMissing}. The store is not part of this review.` : `Not in this prototype round: ${a.dataset.protoMissing}`);
    });
  }

  /* ---------- reveals ---------- */
  function reveals() {
    if (reduced()) { document.documentElement.classList.add('no-motion'); return; }
    document.documentElement.classList.add('has-reveal');
    const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: 0.15 });
    $$('.reveal').forEach((el) => io.observe(el));
  }

  /* ---------- cookie banner and settings (copy/cookie-banner.md). Prototype: choice kept in localStorage ---------- */
  function cookie() {
    const c = $('[data-cookie]'), panel = $('[data-cookie-panel]'); if (!c || !panel) return;
    const KEY = 'yuri-v3-consent';
    const gpc = navigator.globalPrivacyControl === true;
    let saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { saved = null; }
    const sw = $$('[data-ck]', panel);
    const setSw = (b, on) => { b.setAttribute('aria-checked', String(on)); b.setAttribute('aria-label', on ? b.dataset.on : b.dataset.off); };
    const fill = (st) => sw.forEach((b) => setSw(b, !gpc && !!(st && st[b.dataset.ck])));
    const store = (st) => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* no storage */ } c.hidden = true; live(panel.dataset.saved); };
    sw.forEach((b) => b.addEventListener('click', () => { if (!gpc) setSw(b, b.getAttribute('aria-checked') !== 'true'); }));
    if (gpc) $('[data-gpc]', panel).hidden = false;
    let opener = null;
    const scrim = $('[data-scrim]');
    const open = (e) => { opener = e && e.currentTarget; fill(saved); panel.hidden = false; scrim.hidden = false; scrim.classList.add('is-open'); lock('ck', true); setTimeout(() => $('[data-ck-close]', panel).focus(), 20); };
    const close = () => { panel.hidden = true; scrim.classList.remove('is-open'); scrim.hidden = true; lock('ck', false); if (opener) opener.focus(); };
    $$('[data-cookie-settings]').forEach((b) => b.addEventListener('click', open));
    $('[data-ck-close]', panel).addEventListener('click', close);
    scrim.addEventListener('click', () => { if (!panel.hidden) close(); });
    panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    $$('[data-cookie-choice]').forEach((b) => b.addEventListener('click', () => {
      const all = b.dataset.cookieChoice === 'accept' && !gpc;
      saved = { analytics: all, marketing: all }; store(saved); if (!panel.hidden) close();
    }));
    $('[data-ck-save]', panel).addEventListener('click', () => {
      saved = Object.fromEntries(sw.map((b) => [b.dataset.ck, b.getAttribute('aria-checked') === 'true'])); store(saved); close();
    });
    const hideForShots = params.has('shots') && params.get('cookie') !== 'on';
    if (!saved && !hideForShots) c.hidden = false;
    if (params.get('state') === 'cookies') open();
  }

  function init() {
    if (/[?&]notes=1/.test(location.search)) document.documentElement.classList.add('show-notes');
    sprite();
    header(); mega(); mobileMenu(); cartWire(); ribbon(); slider();
    $$('[data-paddle-map]').forEach(paddleMap);
    $$('[data-all-grid]').forEach(allGrid);
    $$('[data-compare]').forEach(compare);
    $$('[data-gallery]').forEach(gallery);
    sticky(); steppers(); forms(); blogChips(); backToTop(); missing(); reveals(); cookie();
    if (location.hash) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) setTimeout(() => t.scrollIntoView(), 60); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
