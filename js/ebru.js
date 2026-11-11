'use strict';
/* =====================================================================
   TERİM ATÖLYESİ — ebru motoru ve hareket katmanı
   Matematiksel ebru (Jaffer'in "mathematical marbling" dönüşümleri):
   damla (her yeni damla eskileri iter), tarak/bız çizgisi, sarmal, dalga,
   yerel bız darbesi. Üstüne: yaşayan tekne, açılış (kâğıt kaldırma),
   boya sıçraması, uçan XP, sayaçlar, sayfa geçişleri.
   ===================================================================== */
function motionLevel() { if (REDUCED_OS) return 0; const m = S.pref.motion; return m === 'off' ? 0 : m === 'calm' ? 1 : 2; }

const EB = (() => {
  const TAU = Math.PI * 2;
  function circle(cx, cy, r, n) {
    n = n || Math.max(24, Math.min(220, Math.round(r * 1.3)));
    const p = new Array(n * 2);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; p[2 * i] = cx + r * Math.cos(a); p[2 * i + 1] = cy + r * Math.sin(a); }
    return p;
  }
  function dropTx(p, cx, cy, r) {
    const r2 = r * r;
    for (let i = 0; i < p.length; i += 2) {
      const dx = p[i] - cx, dy = p[i + 1] - cy, d2 = dx * dx + dy * dy || 1e-9, k = Math.sqrt(1 + r2 / d2);
      p[i] = cx + dx * k; p[i + 1] = cy + dy * k;
    }
  }
  function tineTx(p, bx, by, mx, my, z, lam) {
    const nx = -my, ny = mx;
    for (let i = 0; i < p.length; i += 2) {
      const d = Math.abs((p[i] - bx) * nx + (p[i + 1] - by) * ny), s = z * lam / (d + lam);
      p[i] += mx * s; p[i + 1] += my * s;
    }
  }
  function swirlTx(p, cx, cy, ang, lam) {
    for (let i = 0; i < p.length; i += 2) {
      const dx = p[i] - cx, dy = p[i + 1] - cy, d = Math.sqrt(dx * dx + dy * dy), t = ang * Math.exp(-d / lam), c = Math.cos(t), s = Math.sin(t);
      p[i] = cx + dx * c - dy * s; p[i + 1] = cy + dx * s + dy * c;
    }
  }
  function waveTx(p, amp, wl, ph, axis) {
    for (let i = 0; i < p.length; i += 2) {
      if (axis === 'x') p[i] += amp * Math.sin(TAU * p[i + 1] / wl + ph);
      else p[i + 1] += amp * Math.sin(TAU * p[i] / wl + ph);
    }
  }
  function pushTx(p, cx, cy, dx, dy, sig) {
    const k2 = 1 / (2 * sig * sig), lim = 9 * sig * sig;
    for (let i = 0; i < p.length; i += 2) {
      const ex = p[i] - cx, ey = p[i + 1] - cy, d2 = ex * ex + ey * ey;
      if (d2 > lim) continue;
      const f = Math.exp(-d2 * k2); p[i] += dx * f; p[i + 1] += dy * f;
    }
  }
  function refine(p, maxLen, cap) {
    const n = p.length / 2; if (n >= cap) return p;
    const out = []; const m2 = maxLen * maxLen; let added = 0;
    for (let i = 0; i < n; i++) {
      const x0 = p[2 * i], y0 = p[2 * i + 1], j = (i + 1) % n, x1 = p[2 * j], y1 = p[2 * j + 1];
      out.push(x0, y0);
      const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy;
      if (l2 > m2 && n + added < cap) {
        const k = Math.min(Math.ceil(Math.sqrt(l2) / maxLen) - 1, cap - n - added);
        for (let s = 1; s <= k; s++) out.push(x0 + dx * s / (k + 1), y0 + dy * s / (k + 1));
        added += k;
      }
    }
    return out;
  }
  function inPoly(p, x, y) {
    let c = false; const n = p.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = p[2 * i], yi = p[2 * i + 1], xj = p[2 * j], yj = p[2 * j + 1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }

  class Tray {
    constructor(w, h, bg) { this.w = w; this.h = h; this.bg = bg; this.polys = []; this.ops = 0; this.res = 5; this.cap = 3600; }
    get points() { let n = 0; for (const q of this.polys) n += q.p.length / 2; return n; }
    each(fn) { for (const q of this.polys) fn(q.p); }
    refineAll() { const m = this.res, c = this.cap; for (const q of this.polys) q.p = refine(q.p, m, c); }
    drop(cx, cy, r, col, n) { this.each(p => dropTx(p, cx, cy, r)); this.polys.push({ p: circle(cx, cy, r, n), c: col }); this.refineAll(); this.ops++; this.prune(); return this; }
    tine(bx, by, mx, my, z, lam) { this.each(p => tineTx(p, bx, by, mx, my, z, lam)); this.refineAll(); this.ops++; return this; }
    vline(x, z, lam) { return this.tine(x, 0, 0, 1, z, lam || 10); }
    hline(y, z, lam) { return this.tine(0, y, 1, 0, z, lam || 10); }
    swirl(cx, cy, ang, lam) { this.each(p => swirlTx(p, cx, cy, ang, lam)); this.refineAll(); this.ops++; return this; }
    wave(amp, wl, ph, axis) { this.each(p => waveTx(p, amp, wl, ph, axis)); this.refineAll(); this.ops++; return this; }
    stroke(x0, y0, x1, y1, sig, refineEach) {
      const L = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(L / (sig * .45))), dx = (x1 - x0) / steps, dy = (y1 - y0) / steps;
      for (let s = 0; s < steps; s++) { const cx = x0 + dx * s, cy = y0 + dy * s; this.each(p => pushTx(p, cx, cy, dx, dy, sig)); if (refineEach || s % 3 === 2) this.refineAll(); }
      this.refineAll(); this.ops++; return this;
    }
    prune() {
      // tekneyi bütünüyle örten bir halka varsa, altında kalanlar görünmez: zemine çevir
      const W = this.w, H = this.h, pts = [[W * .02, H * .02], [W * .98, H * .02], [W * .02, H * .98], [W * .98, H * .98], [W / 2, H / 2]];
      for (let i = this.polys.length - 1; i > 0; i--) {
        const p = this.polys[i].p; let outside = true;
        for (let j = 0; j < p.length; j += 2) { const x = p[j], y = p[j + 1]; if (x > -2 && x < W + 2 && y > -2 && y < H + 2) { outside = false; break; } }
        if (!outside) continue;
        if (pts.every(([x, y]) => inPoly(p, x, y))) { this.bg = this.polys[i].c; this.polys.splice(0, i + 1); break; }
      }
      // tamamen dışarı itilmiş ve hiçbir köşeyi örtmeyen küçük parçalar
      this.polys = this.polys.filter(q => { const p = q.p; for (let j = 0; j < p.length; j += 2) { const x = p[j], y = p[j + 1]; if (x > -40 && x < W + 40 && y > -40 && y < H + 40) return true; } return pts.some(([x, y]) => inPoly(p, x, y)); });
    }
    snapshot() { return { bg: this.bg, polys: this.polys.map(q => ({ p: q.p.slice(), c: q.c })) }; }
    restore(s) { this.bg = s.bg; this.polys = s.polys.map(q => ({ p: q.p.slice(), c: q.c })); }
    render(ctx, scale, opt) {
      opt = opt || {};
      const sc = scale || 1;
      ctx.setTransform(sc, 0, 0, sc, opt.ox || 0, opt.oy || 0);
      ctx.fillStyle = this.bg; ctx.fillRect(-2, -2, this.w + 4, this.h + 4);
      const vein = opt.vein !== false, vc = opt.veinColor || this.bg;
      ctx.lineJoin = 'round';
      for (const q of this.polys) {
        const p = q.p; if (p.length < 6) continue;
        ctx.beginPath(); ctx.moveTo(p[0], p[1]);
        for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]);
        ctx.closePath(); ctx.fillStyle = q.c; ctx.fill();
        if (vein) { ctx.strokeStyle = vc; ctx.globalAlpha = opt.veinAlpha || .55; ctx.lineWidth = (opt.veinW || 1.1) / Math.max(.6, sc) * Math.max(1, sc * .9); ctx.stroke(); ctx.globalAlpha = 1; }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  /* ---------- paletler ---------- */
  const PAL = {
    day: { bg: '#F6EEDB', vein: '#FBF6EA', c: ['#233C9E', '#0E9AA7', '#D83A2A', '#E7A40C', '#128A55', '#C9356F', '#F3E3BE', '#8FC1E8', '#8C5A2E', '#FFFFFF'] },
    dawn: { bg: '#F7E7DF', vein: '#FFF5EF', c: ['#E58A8F', '#F4B183', '#B9A0D9', '#7FA8DB', '#F7D27A', '#FFFFFF', '#6C7FC4', '#E36A7E', '#93C9BE', '#F9E2D2'] },
    golden: { bg: '#F4DDB8', vein: '#FBEBD0', c: ['#B23A2A', '#E7A40C', '#7A3AA8', '#233C9E', '#D9622B', '#FFF4DC', '#8C5A2E', '#C9356F', '#2A8B74', '#F2C46A'] },
    night: { bg: '#0D1638', vein: '#1A2552', c: ['#34D1C9', '#F2B705', '#E8517C', '#5D7BFF', '#FFFFFF', '#9B6BFF', '#1E3A8A', '#FF8A5B', '#3FBF7F', '#F4E9D0'] }
  };
  function phaseOf(d) {
    d = d || new Date(); const h = d.getHours() + d.getMinutes() / 60;
    if (h >= 5 && h < 8) return 'dawn';
    if (h >= 8 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'golden';
    return 'night';
  }
  /* ---------- teknikler ---------- */
  function base(T, pal, r, n, rmin, rmax) {
    for (let i = 0; i < n; i++) T.drop(r() * T.w, r() * T.h, rmin + r() * (rmax - rmin), pal.c[i % pal.c.length]);
  }
  function gelgit(T, r, gap, z) { let s = 1; for (let x = gap * (.4 + r() * .3); x < T.w; x += gap) { T.vline(x, z * s, 9); s = -s; } }
  function flower(T, cx, cy, R, cols, petals, r, tulip) {
    cols.forEach((c, i) => T.drop(cx, cy, R * (1 - i / (cols.length + .4)), c, 120));
    if (tulip) {
      T.stroke(cx, cy + R * 1.05, cx, cy + R * 2.6, R * .16);
      T.stroke(cx - R * .55, cy - R * .2, cx - R * .7, cy - R * 1.25, R * .2);
      T.stroke(cx + R * .55, cy - R * .2, cx + R * .7, cy - R * 1.25, R * .2);
      T.stroke(cx, cy - R * 1.15, cx, cy - R * .35, R * .22);
      return;
    }
    for (let k = 0; k < petals; k++) {
      const a = k / petals * TAU + r() * .2, ox = cx + Math.cos(a) * R * 1.25, oy = cy + Math.sin(a) * R * 1.25;
      T.stroke(ox, oy, cx + Math.cos(a) * R * .35, cy + Math.sin(a) * R * .35, R * .2);
    }
  }
  function compose(tech, w, h, seed, palName, opt) {
    opt = opt || {};
    const pal = typeof palName === 'object' ? palName : (PAL[palName] || PAL.day), r = rng(seed || 7);
    const T = new Tray(w, h, pal.bg); T.res = opt.res || Math.max(3.2, w / 220); T.cap = opt.cap || 2600;
    const A = w * h, dense = Math.round(clamp(A / 5600, 18, 56)), rmax = Math.sqrt(A) * .17, rmin = Math.sqrt(A) * .05;
    const pc = { bg: pal.bg, c: shuffle(pal.c) };
    if (tech === 'kumlu') {
      base(T, pc, r, Math.round(dense * .55), rmin * 1.2, rmax * 1.25);
      T.res = Math.max(4, w / 160); gelgit(T, r, w / 7, h * .1);
      const sand = Math.round(clamp(A / 1500, 40, 170));
      for (let i = 0; i < sand; i++) T.drop(r() * w, r() * h, 2 + r() * Math.sqrt(A) * .012, pc.c[(i * 3) % pc.c.length], 10);
      return T;
    }
    if (tech === 'hatip' || tech === 'cicek' || tech === 'usta') {
      base(T, { c: pc.c.slice(0, 5) }, r, Math.round(dense * .6), rmin, rmax * .9);
      gelgit(T, r, w / 9, h * .07);
      if (tech === 'usta') { T.res = Math.max(4, w / 170); for (let y = h / 14; y < h; y += h / 7) T.hline(y, w * .03, 6); T.wave(h * .03, w / 4, r() * 6); }
      const n = tech === 'usta' ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const cx = w * (.18 + .64 * (i + .5) / n) + (r() - .5) * w * .08, cy = h * (.32 + r() * .36), R = Math.min(w, h) * (tech === 'cicek' ? .12 : .15);
        const fc = [pc.c[(i + 1) % pc.c.length], '#FFFFFF', pc.c[(i + 4) % pc.c.length], pc.c[(i + 6) % pc.c.length]];
        flower(T, cx, cy - (tech === 'cicek' ? R * .6 : 0), R, fc, 5 + (i % 2), r, tech === 'cicek' || (tech === 'usta' && i % 2 === 1));
      }
      return T;
    }
    base(T, pc, r, dense, rmin, rmax);
    if (tech === 'battal') return T;
    gelgit(T, r, w / (tech === 'bulbul' ? 8 : 11), h * .11);
    if (tech === 'gelgit') return T;
    if (tech === 'bulbul') {
      const g = Math.min(w, h) / 2.6;
      for (let y = g * .55; y < h; y += g) for (let x = g * .55 + ((y / g) % 2 ? g / 2 : 0); x < w; x += g) T.swirl(x, y, (r() < .5 ? -1 : 1) * 8, g * .3);
      return T;
    }
    T.res = Math.max(3.6, w / 180);
    for (let y = h / 22; y < h; y += h / 11) T.hline(y, w * .045, 6);
    if (tech === 'tarakli') return T;
    T.wave(h * .035, w / 3.2, r() * 6); T.wave(w * .02, h / 2.5, r() * 6, 'x');
    return T;
  }
  /* ---------- statik görüntüler (önbellekli) ---------- */
  const CACHE = new Map();
  function image(key, tech, w, h, seed, pal, opt) {
    if (CACHE.has(key)) return CACHE.get(key);
    const T = compose(tech, w, h, seed, pal, opt), cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const PP = typeof pal === 'object' ? pal : (PAL[pal] || PAL.day);
    const ctx = cv.getContext('2d'); T.render(ctx, dpr, { veinColor: PP.vein || PP.bg, veinAlpha: .6 });
    let url = ''; try { url = cv.toDataURL('image/jpeg', .88); } catch (e) {}
    CACHE.set(key, url); return url;
  }
  function swatchPal(c) {
    const P0 = PIG[c], keys = CAT_KEYS, i = keys.indexOf(c), a = PIG[keys[(i + 3) % keys.length]].h, b = PIG[keys[(i + 7) % keys.length]].h;
    return { bg: '#F7F0E0', vein: '#FFFBF2', c: [P0.h, '#FFFFFF', P0.h, a, P0.s, P0.h, '#F7F0E0', b, P0.h] };
  }
  function catImage(c, w, h) {
    const key = 'cat:' + c + ':' + w + 'x' + h;
    if (CACHE.has(key)) return CACHE.get(key);
    const T = compose('gelgit', w, h, hashStr(c) + 3, swatchPal(c), { cap: 1600 });
    const cv = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    T.render(cv.getContext('2d'), dpr, { veinColor: '#FFFBF2', veinAlpha: .65 });
    let url = ''; try { url = cv.toDataURL('image/jpeg', .86); } catch (e) {}
    CACHE.set(key, url); return url;
  }
  return { Tray, compose, PAL, phaseOf, image, catImage, swatchPal, circle, TAU };
})();

/* ---------- boşta çalışan görüntü üretimi ---------- */
const IDLE_Q = [];
function idle(fn) { IDLE_Q.push(fn); if (IDLE_Q.length === 1) idleRun(); }
function idleRun() {
  const go = dl => {
    let n = 0;
    while (IDLE_Q.length && (n === 0 || !dl || dl.timeRemaining() > 6)) { const f = IDLE_Q.shift(); try { f(); } catch (e) {} n++; }
    if (IDLE_Q.length) idleRun();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 600 }); else setTimeout(() => go(null), 30);
}
/* data-swatch="c" taşıyan öğelere kategori ebrusu, data-lvimg="i" taşıyanlara basamak kâğıdı */
function paintSwatches(root) {
  $$('[data-swatch]', root).forEach(el => {
    const c = el.dataset.swatch, w = +(el.dataset.w || 220), h = +(el.dataset.h || 150), key = 'cat:' + c + ':' + w + 'x' + h;
    const set = url => { if (url) { el.style.backgroundImage = `url(${url})`; el.classList.add('painted'); } };
    idle(() => set(EB.catImage(c, w, h)));
  });
  $$('[data-lvimg]', root).forEach(el => {
    const i = +el.dataset.lvimg, w = +(el.dataset.w || 300), h = +(el.dataset.h || 200), L = LEVELS[i];
    const pal = el.dataset.pal || 'day', key = 'lv:' + i + ':' + w + 'x' + h + ':' + pal;
    const set = url => { if (url) { el.style.backgroundImage = `url(${url})`; el.classList.add('painted'); } };
    idle(() => set(EB.image(key, L.tech, w, h, 1000 + i * 37, pal)));
  });
}

/* =====================================================================
   YAŞAYAN TEKNE — ana sayfadaki ebru
   ===================================================================== */
const TEKNE = { T: null, cv: null, ctx: null, scale: 1, anim: null, raf: 0, idleT: 0, phase: '', vis: true, lastUser: 0, ptr: null, io: null, pal: null, dirty: false, born: 0, ops: 0 };
function tekneMount(host) {
  tekneStop();
  if (!host) return;
  const cv = document.createElement('canvas'); cv.className = 'tekne-cv'; cv.setAttribute('aria-hidden', 'true');
  host.prepend(cv);
  TEKNE.cv = cv; TEKNE.ctx = cv.getContext('2d'); TEKNE.host = host;
  tekneSize(true);
  tekneBind(cv);
  if ('IntersectionObserver' in window) { TEKNE.io = new IntersectionObserver(es => es.forEach(e => { TEKNE.vis = e.isIntersecting; if (TEKNE.vis) tekneKick(); })); TEKNE.io.observe(host); }
  TEKNE.ro && TEKNE.ro.disconnect();
  if ('ResizeObserver' in window) { let rt = 0; TEKNE.ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => tekneSize(false), 160); }); TEKNE.ro.observe(host); }
  tekneKick();
}
function tekneStop() {
  cancelAnimationFrame(TEKNE.raf); TEKNE.raf = 0; clearTimeout(TEKNE.idleT);
  if (TEKNE.io) TEKNE.io.disconnect(); TEKNE.io = null;
  if (TEKNE.ro) TEKNE.ro.disconnect(); TEKNE.ro = null;
  TEKNE.anim = null;
}
function tekneSize(fresh) {
  const host = TEKNE.host; if (!host || !TEKNE.cv) return;
  const r = host.getBoundingClientRect(); if (!r.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), maxPx = 2.4e6;
  let k = dpr; if (r.width * r.height * k * k > maxPx) k = Math.sqrt(maxPx / (r.width * r.height));
  TEKNE.cv.width = Math.round(r.width * k); TEKNE.cv.height = Math.round(r.height * k);
  const W = 1000, H = Math.round(1000 * r.height / r.width);
  TEKNE.scale = TEKNE.cv.width / W; TEKNE.k = k; TEKNE.cssW = r.width;
  if (fresh || !TEKNE.T || Math.abs(TEKNE.T.h - H) > 30) tekneCompose(W, H);
  tekneDraw();
}
function tekneCompose(W, H) {
  const ph = EB.phaseOf(), lv = levelIndex(S.xp), L = LEVELS[lv];
  const tech = ['battal', 'gelgit', 'tarakli', 'sal', 'bulbul', 'kumlu', 'hatip', 'cicek', 'usta'].includes(L.tech) ? L.tech : 'battal';
  const pal = Object.assign({}, EB.PAL[ph]);
  const dc = PIG[dayCat()].h; pal.c = [dc, ...pal.c.slice(0, 6), dc, ...pal.c.slice(6)];
  TEKNE.pal = pal; TEKNE.phase = ph;
  TEKNE.T = EB.compose(tech === 'usta' || tech === 'cicek' ? 'hatip' : tech === 'kumlu' ? 'gelgit' : tech, W, H, hashStr(ymd() + ph) + lv, pal, { cap: 2200, res: 5.5 });
  TEKNE.ops = 0; TEKNE.born = Date.now();
}
function tekneDraw() { const t = TEKNE; if (!t.T || !t.ctx) return; t.T.render(t.ctx, t.scale, { veinColor: t.pal.vein, veinAlpha: .58, veinW: 1.25 }); }
function tekneKick() {
  if (!TEKNE.cv) return;
  clearTimeout(TEKNE.idleT);
  if (motionLevel() < 2) return;
  TEKNE.idleT = setTimeout(tekneIdle, 2600 + Math.random() * 2400);
}
function tekneIdle() {
  const t = TEKNE; if (!t.cv || !t.cv.isConnected) { tekneStop(); return; }
  if (!t.vis || document.visibilityState !== 'visible' || Date.now() - t.lastUser < 2500 || t.anim) { tekneKick(); return; }
  if (t.T.points > 52000 || t.ops > 42) { tekneRenew(); return; }
  const W = t.T.w, H = t.T.h;
  if (t.ops % 5 === 4) {
    const x = W * (.15 + Math.random() * .7), z = (Math.random() < .5 ? -1 : 1) * H * (.14 + Math.random() * .1);
    tekneAnim({ kind: 'tine', x, z, lam: 10, dur: 1700 });
  } else {
    const c = pick(t.pal.c), r = 22 + Math.random() * 46;
    tekneAnim({ kind: 'drop', x: W * (.08 + Math.random() * .84), y: H * (.12 + Math.random() * .76), r, c, dur: 1100 });
  }
  tekneKick();
}
function tekneRenew() {
  const t = TEKNE, cv = t.cv; if (!cv) return;
  cv.classList.add('renew');
  setTimeout(() => { if (!t.T) return; tekneCompose(t.T.w, t.T.h); tekneDraw(); cv.classList.remove('renew'); tekneKick(); }, 700);
}
function tekneAnim(op) {
  const t = TEKNE; if (!t.T) return;
  if (t.anim) tekneFinish();
  op.snap = t.T.snapshot(); op.t0 = performance.now(); t.anim = op;
  if (op.kind === 'drop') sfx('drop');
  const step = now => {
    const a = t.anim; if (!a) return;
    const k = clamp((now - a.t0) / a.dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
    t.T.restore(a.snap);
    if (a.kind === 'drop') { t.T.each(p => tineless(p, a, e)); t.T.polys.push({ p: EB.circle(a.x, a.y, Math.max(.5, a.r * e), Math.max(28, Math.round(a.r * 1.4))), c: a.c }); }
    else if (a.kind === 'tine') { t.T.each(p => tineMove(p, a, e)); }
    tekneDraw();
    if (k < 1) t.raf = requestAnimationFrame(step); else tekneFinish();
  };
  cancelAnimationFrame(t.raf); t.raf = requestAnimationFrame(step);
}
function tineless(p, a, e) { const r = a.r * e, r2 = r * r; for (let i = 0; i < p.length; i += 2) { const dx = p[i] - a.x, dy = p[i + 1] - a.y, d2 = dx * dx + dy * dy || 1e-9, k = Math.sqrt(1 + r2 / d2); p[i] = a.x + dx * k; p[i + 1] = a.y + dy * k; } }
function tineMove(p, a, e) { const z = a.z * e, lam = a.lam; for (let i = 0; i < p.length; i += 2) { const d = Math.abs(p[i] - a.x); p[i + 1] += z * lam / (d + lam); } }
function tekneFinish() {
  const t = TEKNE, a = t.anim; if (!a) return;
  t.T.restore(a.snap); t.anim = null;
  if (a.kind === 'drop') t.T.drop(a.x, a.y, a.r, a.c, Math.max(28, Math.round(a.r * 1.4)));
  else if (a.kind === 'tine') t.T.vline(a.x, a.z, a.lam);
  t.ops++; tekneDraw();
}
function tekneBind(cv) {
  const t = TEKNE;
  const toW = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * t.T.w, (e.clientY - r.top) / r.height * t.T.h]; };
  cv.addEventListener('pointerdown', e => {
    if (!t.T) return;
    t.lastUser = Date.now(); if (t.anim) tekneFinish();
    const [x, y] = toW(e); t.ptr = { x, y, x0: x, y0: y, moved: 0, id: e.pointerId, t0: Date.now() };
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  cv.addEventListener('pointermove', e => {
    const p = t.ptr; if (!p || p.id !== e.pointerId) return;
    const [x, y] = toW(e), dx = x - p.x, dy = y - p.y, L = Math.hypot(dx, dy);
    if (L < 2) return;
    p.moved += L; t.lastUser = Date.now();
    if (p.moved > 10) {
      const steps = Math.ceil(L / 7);
      for (let s = 0; s < steps; s++) { const cx = p.x + dx * s / steps, cy = p.y + dy * s / steps; t.T.each(q => pushLocal(q, cx, cy, dx / steps * .9, dy / steps * .9, 24)); }
      if ((p.n = (p.n || 0) + 1) % 4 === 0) t.T.refineAll();
      tekneDraw(); e.preventDefault();
    }
    p.x = x; p.y = y;
  });
  const up = e => {
    const p = t.ptr; if (!p || p.id !== e.pointerId) return; t.ptr = null; t.lastUser = Date.now();
    if (p.moved <= 10 && Date.now() - p.t0 < 600) {
      const c = pick(t.pal.c), r = 26 + Math.random() * 30;
      tekneAnim({ kind: 'drop', x: p.x0, y: p.y0, r, c, dur: motionLevel() ? 900 : 1 }); haptic('tap');
      const hint = $('.tekne-hint'); if (hint) hint.classList.add('used');
    } else { t.T.refineAll(); tekneDraw(); t.ops++; }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.style.touchAction = 'pan-y';
}
function pushLocal(p, cx, cy, dx, dy, sig) { const k2 = 1 / (2 * sig * sig), lim = 9 * sig * sig; for (let i = 0; i < p.length; i += 2) { const ex = p[i] - cx, ey = p[i + 1] - cy, d2 = ex * ex + ey * ey; if (d2 > lim) continue; const f = Math.exp(-d2 * k2); p[i] += dx * f; p[i + 1] += dy * f; } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tekneKick(); });

/* =====================================================================
   AÇILIŞ — tekneye boya serpilir, tarak geçer, kâğıt kaldırılır
   ===================================================================== */
function maybeIntro() {
  const mode = S.pref.intro || 'day';
  if (motionLevel() < 2 || mode === 'off') return;
  if (mode === 'day' && S.pref.introDay === ymd()) return;
  S.pref.introDay = ymd(); touch();
  const ph = EB.phaseOf(), pal = EB.PAL[ph];
  const box = document.createElement('div'); box.className = 'intro ph-' + ph; box.setAttribute('aria-hidden', 'true'); box.style.setProperty('--ib', pal.bg);
  const greet = ph === 'night' ? 'İyi geceler' : ph === 'golden' ? 'İyi akşamlar' : ph === 'dawn' ? 'Günaydın' : 'Hoş geldin';
  box.innerHTML = `<div class="intro-sheet"><canvas></canvas><div class="intro-grain"></div></div>
    <div class="intro-title"><small>${greet}</small><b>Terim Atölyesi</b><span>Bugünün boyası · ${esc(PIG[dayCat()].n)}</span></div>`;
  document.body.appendChild(box);
  const cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
  const dpr = Math.min(1.5, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  const W = 1000, H = Math.round(1000 * innerHeight / innerWidth), sc = cv.width / W;
  const T = new EB.Tray(W, H, pal.bg); T.res = 7; T.cap = 1400;
  const cols = [PIG[dayCat()].h, ...shuffle(pal.c).slice(0, 7)];
  const plan = cols.map((c, i) => ({ at: 60 + i * 95, x: W * (.12 + Math.random() * .76), y: H * (.15 + Math.random() * .7), r: Math.min(W, H) * (.11 + Math.random() * .1), c }));
  let gone = false, raf = 0; const t0 = performance.now(); let done = 0, tineAt = 900, tined = 0;
  const frame = now => {
    if (gone) return;
    const el = now - t0;
    // damlalar sırayla açılır
    let snap = null;
    while (done < plan.length && el >= plan[done].at + 380) { const d = plan[done]; T.drop(d.x, d.y, d.r, d.c, 90); done++; }
    if (done < plan.length && el >= plan[done].at) {
      const d = plan[done], k = Math.min(1, (el - d.at) / 380), e = 1 - Math.pow(1 - k, 3);
      snap = T.snapshot(); T.each(p => tineless(p, { x: d.x, y: d.y, r: d.r }, e)); T.polys.push({ p: EB.circle(d.x, d.y, Math.max(.5, d.r * e), 90), c: d.c });
    }
    if (done >= plan.length && tined < 4 && el >= tineAt + tined * 120) { const x = W * (.18 + tined * .21); T.vline(x, (tined % 2 ? -1 : 1) * H * .16, 12); tined++; }
    T.render(ctx, sc, { veinColor: pal.vein, veinAlpha: .6, veinW: 1.4 });
    if (snap) T.restore(snap);
    if (el > 1250 && !box.classList.contains('titled')) box.classList.add('titled');
    if (el > 1900) { lift(false); return; }
    raf = requestAnimationFrame(frame);
  };
  const lift = fast => {
    if (gone) return; gone = true; cancelAnimationFrame(raf);
    box.classList.add('lift'); if (fast) box.classList.add('fast');
    setTimeout(() => box.remove(), fast ? 420 : 1150);
  };
  box.addEventListener('pointerdown', () => lift(true));
  requestAnimationFrame(() => { box.classList.add('on'); raf = requestAnimationFrame(frame); });
}

/* =====================================================================
   BOYA SIÇRAMASI, KUTLAMA
   ===================================================================== */
const PX = { list: [], raf: 0, ctx: null, w: 0, h: 0 };
function pxCtx() {
  const cv = document.getElementById('fx'); if (!cv || !cv.getContext) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (!PX.ctx || PX.w !== innerWidth || PX.h !== innerHeight) {
    PX.ctx = cv.getContext('2d'); PX.w = innerWidth; PX.h = innerHeight;
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); PX.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return PX.ctx;
}
function pxRun() {
  if (PX.raf || !pxCtx()) return;
  let last = performance.now();
  const step = t => {
    const dt = clamp((t - last) / 16.67, 0, 2.5); last = t;
    const ctx = PX.ctx; ctx.clearRect(0, 0, PX.w, PX.h);
    PX.list = PX.list.filter(p => (p.life -= dt) > 0 && p.y < PX.h + 80);
    for (const p of PX.list) {
      const a = Math.max(0, Math.min(1, p.life / (p.fade || 30)));
      if (p.k === 'c') {
        p.vy += 0.22 * dt; p.vx *= Math.pow(0.985, dt); p.vy *= Math.pow(0.985, dt);
        p.x += (p.vx + Math.sin(p.ph) * 0.8) * dt; p.y += p.vy * dt; p.ph += p.vph * dt; p.r += p.vr * dt;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.max(0.15, Math.abs(Math.cos(p.ph))));
        ctx.globalAlpha = a; ctx.fillStyle = p.c;
        if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, Math.max(.1, p.s * .5), 0, Math.PI * 2); ctx.fill(); }
        else if (p.shape === 2) { ctx.beginPath(); ctx.moveTo(0, -p.s * .7); ctx.quadraticCurveTo(p.s * .55, 0, 0, p.s * .55); ctx.quadraticCurveTo(-p.s * .55, 0, 0, -p.s * .7); ctx.fill(); }
        else { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-p.s / 2, -p.s / 4, p.s, p.s / 2, 2) : ctx.rect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.fill(); }
        ctx.restore();
      } else if (p.k === 'b') {
        // genişleyen boya halkası
        p.rr += (p.R - p.rr) * .12 * dt;
        ctx.globalAlpha = a * .5; ctx.strokeStyle = p.c; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.1, p.rr), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = a * .16; ctx.fillStyle = p.c; ctx.fill();
      } else {
        p.vy += 0.16 * dt; p.vx *= Math.pow(0.95, dt); p.vy *= Math.pow(0.95, dt); p.x += p.vx * dt; p.y += p.vy * dt;
        const ang = Math.atan2(p.vy, p.vx), sp = Math.min(3, Math.hypot(p.vx, p.vy) * .35);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.globalAlpha = a; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.ellipse(0, 0, p.s * (1 + sp * .45), p.s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    if (PX.list.length) PX.raf = requestAnimationFrame(step); else { PX.raf = 0; ctx.clearRect(0, 0, PX.w, PX.h); }
  };
  PX.raf = requestAnimationFrame(step);
}
const FX_COLS = ['#2A44B8', '#0B97A4', '#DD3A2A', '#E09E06', '#0F8E57', '#D1337C', '#8B3FC6', '#FFFFFF'];
function confetti(n, opt) {
  if (motionLevel() < 2 || !pxCtx()) return;
  n = n || 120; opt = opt || {};
  const sides = n >= 140, cols = opt.cols || FX_COLS;
  for (let i = 0; i < n; i++) {
    let x, y, vx, vy;
    if (sides && i % 3 !== 0) { const L = i % 2 === 0; x = L ? -10 : innerWidth + 10; y = innerHeight * (0.55 + Math.random() * .2); vx = (L ? 1 : -1) * (6 + Math.random() * 9); vy = -9 - Math.random() * 9; }
    else { x = (opt.x ?? innerWidth / 2) + (Math.random() - .5) * 90; y = opt.y ?? innerHeight * .34; vx = (Math.random() - .5) * 15; vy = -Math.random() * 12 - 5; }
    PX.list.push({ k: 'c', x, y, vx, vy, s: 7 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .25, ph: Math.random() * 6, vph: .08 + Math.random() * .14, c: cols[i % cols.length], shape: i % 4 === 0 ? 2 : i % 4 === 1 ? 1 : 0, life: 170 + Math.random() * 40, fade: 30 });
  }
  pxRun();
}
function splash(x, y, n, cols) {
  if (motionLevel() < 1 || !pxCtx()) return;
  cols = cols || FX_COLS;
  const full = motionLevel() === 2;
  PX.list.push({ k: 'b', x, y, rr: 4, R: full ? 46 : 26, c: cols[0], life: 30, fade: 30 });
  if (full) PX.list.push({ k: 'b', x, y, rr: 2, R: 70, c: cols[1 % cols.length], life: 38, fade: 38 });
  for (let i = 0; i < (full ? n || 16 : 6); i++) {
    const a = Math.random() * Math.PI * 2, v = 2.2 + Math.random() * 5.5;
    PX.list.push({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.6, s: 2.2 + Math.random() * 3, c: cols[i % cols.length], life: 36 + Math.random() * 20, fade: 40 });
  }
  pxRun();
}
function splashAt(el, n, cols) { if (!el) return; const r = el.getBoundingClientRect(); splash(r.left + r.width / 2, r.top + r.height / 2, n, cols); }

/* ---------- uçan XP, zıplama, sallanma ---------- */
function flyTo(fromEl, toEl, text, cls, done) {
  if (!fromEl || !document.body.animate) { done && done(); return; }
  const a = fromEl.getBoundingClientRect();
  const el = document.createElement('div'); el.className = 'fly ' + (cls || ''); el.textContent = text; el.setAttribute('aria-hidden', 'true');
  document.body.appendChild(el);
  const x0 = a.left + a.width / 2, y0 = a.top + Math.min(a.height / 2, 40);
  const b = toEl && toEl.getBoundingClientRect();
  if (motionLevel() < 2 || !b || !b.width) {
    el.style.left = x0 + 'px'; el.style.top = y0 + 'px';
    const an = el.animate([{ transform: 'translate(-50%,-50%) scale(.7)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-200%) scale(1)', opacity: 0 }], { duration: motionLevel() ? 800 : 400, easing: 'cubic-bezier(.2,.7,.2,1)' });
    an.onfinish = () => { el.remove(); done && done(); };
    return;
  }
  const x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
  const mx = (x0 + x1) / 2 + (x1 > x0 ? -60 : 60), my = Math.min(y0, y1) - 90;
  const k = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, u = 1 - t, x = u * u * x0 + 2 * u * t * mx + t * t * x1, y = u * u * y0 + 2 * u * t * my + t * t * y1;
    k.push({ transform: `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) scale(${(1.1 - t * .45).toFixed(2)})`, opacity: i === 12 ? .3 : 1 });
  }
  el.style.left = '0px'; el.style.top = '0px';
  const an = el.animate(k, { duration: 760, easing: 'cubic-bezier(.45,0,.25,1)' });
  an.onfinish = () => { el.remove(); bump(toEl); done && done(); };
}
function bump(el) { if (!el || !el.animate || motionLevel() < 1) return; el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 340, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 460); }
function outAnim(el, dir, cb) {
  if (!el || !el.animate || motionLevel() < 1) { cb(); return; }
  const x = dir === 'l' ? '-115%' : dir === 'r' ? '115%' : '0', r = dir === 'l' ? -10 : dir === 'r' ? 10 : 0;
  const cur = getComputedStyle(el).transform;
  const an = el.animate([{ transform: cur === 'none' ? 'none' : cur, opacity: 1 }, { transform: `translateX(${x}) rotate(${r}deg)`, opacity: dir === 'u' ? 0 : .2 }], { duration: 230, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'forwards' });
  an.onfinish = cb;
}

/* ---------- sayılar, halkalar, çubuklar ---------- */
const COUNTS = Object.create(null);
function countUps(root) {
  const m = motionLevel();
  $$('[data-count]', root).forEach(el => {
    const to = +el.dataset.count, key = el.dataset.ck || '', from = key in COUNTS ? COUNTS[key] : 0;
    COUNTS[key] = to;
    const fmt = v => (el.dataset.pre || '') + Math.round(v).toLocaleString('tr-TR') + (el.dataset.suf || '');
    if (!m || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), ms = Math.min(1100, 420 + Math.abs(to - from) * 6);
    el.textContent = fmt(from);
    const f = t => { const k = clamp((t - t0) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });
  $$('[data-ring]', root).forEach(c => { const off = c.getAttribute('data-ring'); if (!m) { c.style.strokeDashoffset = off; return; } requestAnimationFrame(() => requestAnimationFrame(() => { c.style.strokeDashoffset = off; })); });
  $$('[data-w]', root).forEach(b => { const w = b.getAttribute('data-w'); if (!m) { b.style.width = w; return; } requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = w; })); });
  $$('[data-fill]', root).forEach(b => { const v = b.getAttribute('data-fill'); if (!m) { b.style.setProperty('--fill', v); return; } requestAnimationFrame(() => requestAnimationFrame(() => { b.style.setProperty('--fill', v); })); });
}

/* ---------- sayfa geçişleri ---------- */
function vt(update, dir) {
  if (motionLevel() < 1 || !document.startViewTransition || document.visibilityState !== 'visible') { update(); return; }
  document.documentElement.dataset.vdir = dir || '';
  try { document.startViewTransition(update); } catch (e) { update(); }
}

/* ---------- ebru şerit: soru kâğıtlarının üst kenarı ---------- */
function stripURL(c) {
  const key = 'strip:' + c;
  return EB.image(key, 'tarakli', 900, 46, hashStr(key), EB.swatchPal(c), { cap: 900, res: 6 });
}
