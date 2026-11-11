'use strict';
/* =====================================================================
   TERİM ATÖLYESİ — çekirdek
   Veri modeli, boyalar (kategoriler), kayıt ve eski sürümden taşıma,
   aralıklı tekrar (1·3·7·14·30 gün), seviyeler (ebru basamakları),
   soru üretimi, yazılı cevap denetimi, ses, titreşim, sesli okuma.
   ===================================================================== */
const DAY = 864e5, IV = [1, 3, 7, 14, 30];
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const IC = (n, c) => `<svg class="ic ${c || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ymd = d => { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const trunc = (s, n) => { s = String(s); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:.]+\S*$/, '') + '…' : s; };
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const REDUCED_OS = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- boyalar: her alan bir pigment ---------- */
const PIG = {
  t: { n: 'Lâcivert', h: '#2A44B8', s: '#E6EAFA', ink: '#fff' },
  a: { n: 'Firuze', h: '#0B97A4', s: '#DBF3F4', ink: '#fff' },
  k: { n: 'Erguvan', h: '#8B3FC6', s: '#F0E5FA', ink: '#fff' },
  o: { n: 'Nar', h: '#DD3A2A', s: '#FCE6E2', ink: '#fff' },
  c: { n: 'Kehribar', h: '#D16C06', s: '#FCEBD9', ink: '#fff' },
  s: { n: 'Zümrüt', h: '#0F8E57', s: '#DDF2E7', ink: '#fff' },
  i: { n: 'Gül', h: '#D1337C', s: '#FBE3EE', ink: '#fff' },
  z: { n: 'Çini', h: '#2468D9', s: '#E2ECFB', ink: '#fff' },
  d: { n: 'Safran', h: '#E09E06', s: '#FFF2CF', ink: '#2B1E00' },
  g: { n: 'Yeşim', h: '#2A8B74', s: '#DEF1EC', ink: '#fff' },
  n: { n: 'Gül kurusu', h: '#B25472', s: '#F7E4EA', ink: '#fff' },
  r: { n: 'Kiremit', h: '#BC4A29', s: '#F8E5DE', ink: '#fff' },
  e: { n: 'Leylak', h: '#6560D8', s: '#EAE9FB', ink: '#fff' },
  m: { n: 'Mor', h: '#7A3AA8', s: '#EFE4F6', ink: '#fff' },
  l: { n: 'Deniz', h: '#137EA5', s: '#DDEFF6', ink: '#fff' },
  y: { n: 'Toprak', h: '#8E5A31', s: '#F2E8DE', ink: '#fff' },
  b: { n: 'Altın', h: '#C08708', s: '#FAF0D2', ink: '#2B1E00' },
  f: { n: 'Fıstıkî', h: '#5F921C', s: '#ECF4DD', ink: '#fff' },
  p: { n: 'Gök', h: '#2F86D6', s: '#E1EFFB', ink: '#fff' }
};
const CAT_KEYS = Object.keys(CATS);
const SHELVES = [
  { k: 'anlati', tr: 'Anlatı ve düzyazı', d: 'Kim anlatıyor, nasıl anlatıyor, zaman ve mekân nasıl kuruluyor?', cats: ['t', 'a', 'k', 'o', 'c'] },
  { k: 'siir', tr: 'Şiir, dil ve ses', d: 'İmge, söz sanatı, ses ve ton: yakın okumanın araç kutusu.', cats: ['s', 'i', 'z', 'd', 'g', 'n'] },
  { k: 'tur', tr: 'Tür, bağlam ve sınav', d: 'Tiyatro, deneme, akımlar, eleştirel mercekler ve IB yazısının dili.', cats: ['r', 'e', 'm', 'l', 'y', 'b', 'f', 'p'] }
];

/* ---------- terimler ---------- */
const ITEMS = D.map((r, i) => {
  const alts = r[1].split(' / ').map(s => s.trim());
  return { i, k: r[1], c: r[0], t: r[1], main: alts[0], alts, en: r[2], m: r[3], ex: r[4] };
});
const BYK = Object.create(null); ITEMS.forEach(x => { BYK[x.k] = x; });
const BYCAT = {}; CAT_KEYS.forEach(c => { BYCAT[c] = ITEMS.filter(x => x.c === c); });
const PAIR_OF = Object.create(null);
function pairItem(name) {
  const n = norm(name); if (n === 'karakter') return null;
  return ITEMS.find(x => x.alts.some(a => norm(a) === n)) || ITEMS.find(x => x.alts.some(a => norm(a).startsWith(n + ' '))) || null;
}
PAIRS.forEach((p, i) => { [p[0], p[1]].forEach(n => { const it = pairItem(n); if (it) (PAIR_OF[it.k] = PAIR_OF[it.k] || []).push(i); }); });
const PASSAGES = (typeof PASS !== 'undefined' ? PASS : []).map((p, i) => ({ i, k: p[0], txt: p[1], kanit: p[2], teknik: p[3], etki: p[4], ozet: p[5], dis: p[6] || [] })).filter(p => BYK[p.k]);

/* ---------- metin yardımcıları (Türkçe) ---------- */
function lowerTr(s) { return String(s).toLocaleLowerCase('tr-TR'); }
function norm(s) {
  return lowerTr(s).replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u')
    .replace(/\([^)]*\)/g, ' ').replace(/[’'`´"“”.,;:!?…\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
}
function stripTr(s) { return norm(s).replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u'); }
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
/* yazılan cevabı denetler: 'ok' | 'near' | 'no' */
function checkTyped(val, it) {
  const v = norm(val); if (!v) return 'no';
  const forms = it.alts.map(norm).filter(Boolean);
  if (forms.includes(v)) return 'ok';
  const vs = stripTr(val);
  if (it.alts.map(stripTr).includes(vs)) return 'near';
  for (const f of forms) {
    const d = lev(v, f), L = f.length;
    if ((L >= 5 && d <= 1) || (L >= 9 && d <= 2) || (L >= 16 && d <= 3)) return 'near';
  }
  return 'no';
}
/* bir metindeki terim adlarını gizler (örnekte cevabı vermesin) */
function maskTerm(txt, it) {
  let out = String(txt);
  it.alts.forEach(a => {
    const words = a.replace(/\([^)]*\)/g, '').split(/\s+/).filter(w => w.length >= 4);
    words.forEach(w => {
      const stem = w.slice(0, Math.max(4, w.length - 2));
      const re = new RegExp('(^|[^A-Za-zÇĞİÖŞÜçğıöşüâîû])(' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[A-Za-zÇĞİÖŞÜçğıöşüâîû]*)', 'gi');
      out = out.replace(re, (m0, p, word) => p + '▢'.repeat(Math.min(6, word.length)));
    });
  });
  return out;
}
function shortDef(it, n) { const s = it.m.split(/;\s/)[0]; return trunc(s, n || 90); }
function typeable(it) { return it.c !== 'f' && it.c !== 'p' && !/\.\.\.|…/.test(it.main) && it.main.length <= 30; }

/* =====================================================================
   KAYIT
   ===================================================================== */
const LS2 = 'terim-atolyesi-v2', LS1 = 'terim-atolyesi-v1';
const PREF_DEF = { fs: 19, lh: 0, hc: 0, theme: 'light', motion: 'full', intro: 'day', introDay: '', sound: 1, haptic: 1, auto: 0, rate: 0.95, goal: 150, adv: 1 };
function freshState() { return { v: 2, p: {}, xp: 0, days: {}, ans: {}, f: {}, notes: {}, best: {}, ta: 0, tc: 0, lv: 0, pref: Object.assign({}, PREF_DEF), st: { src: 'all', size: 20, order: 'smart' }, mo: {}, exam: null, upd: 0, born: Date.now() }; }
let S = freshState();
let MIGRATED = false;
(function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(LS2) || 'null'); } catch (e) {}
  if (raw && raw.v === 2) {
    S = Object.assign(freshState(), raw);
    S.pref = Object.assign({}, PREF_DEF, raw.pref || {});
    S.st = Object.assign({ src: 'all', size: 20, order: 'smart' }, raw.st || {});
    ['p', 'days', 'ans', 'f', 'notes', 'best', 'mo'].forEach(k => { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
    return;
  }
  let old = null;
  try { old = JSON.parse(localStorage.getItem(LS1) || 'null'); } catch (e) {}
  if (old && typeof old === 'object') {
    const s = freshState();
    if (old.p && typeof old.p === 'object') Object.keys(old.p).forEach(k => { if (BYK[k]) { const q = old.p[k]; s.p[k] = { s: +q.s || 0, d: +q.d || 0, w: +q.w || 0 }; } });
    s.xp = +old.xp || 0; s.days = old.days || {}; s.ta = +old.ta || 0; s.tc = +old.tc || 0;
    s.pref.fs = clamp(+old.fs || 19, 15, 28); s.pref.theme = old.theme === 'dark' ? 'dark' : 'light';
    s.pref.lh = old.lh ? 1 : 0; s.pref.hc = old.hc ? 1 : 0; s.pref.motion = old.motion === 0 ? 'off' : 'full'; s.pref.auto = old.auto ? 1 : 0;
    s.pref.rate = +old.rate || .95; s.pref.goal = +old.goal || 150;
    s.lv = null;
    S = s; MIGRATED = true;
  }
})();
let SAVE_T = 0;
function touch() { S.upd = Date.now(); clearTimeout(SAVE_T); SAVE_T = setTimeout(flush, 350); }
function flush() { clearTimeout(SAVE_T); try { localStorage.setItem(LS2, JSON.stringify(S)); } catch (e) {} }
window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

/* =====================================================================
   ARALIKLI TEKRAR — s: basamak (0–6), d: vade, w: yanlış sayısı
   ===================================================================== */
const P = k => S.p[k];
function status(k) { const p = S.p[k]; if (!p) return 'new'; if (p.kn) return 'known'; return p.s >= 6 ? 'master' : 'learn'; }
const isLearn = k => status(k) === 'learn';
const isDue = k => isLearn(k) && S.p[k].d <= Date.now();
const isHard = k => !!(S.p[k] && S.p[k].w >= 2);
const isSolid = k => { const s = status(k); return s === 'master' || s === 'known'; };
function stageOf(k) { const p = S.p[k]; return p ? (p.kn ? 6 : p.s) : -1; }
function grade(k, ok) {
  const p = S.p[k] || (S.p[k] = { s: 0, d: 0, w: 0 });
  delete p.kn;
  if (ok) { const s = Math.min(p.s, 4); p.d = Date.now() + IV[s] * DAY; p.s = Math.min(6, p.s + 1); }
  else { p.s = 0; p.d = Date.now(); p.w = (p.w || 0) + 1; }
  p.l = Date.now();
}
function learnTerm(k, okFirst) { const p = S.p[k] = S.p[k] && !S.p[k].kn ? S.p[k] : { s: 0, d: 0, w: 0 }; p.s = okFirst ? Math.max(1, p.s) : p.s; p.d = Date.now() + DAY; p.l = Date.now(); }
function knowTerm(k) { S.p[k] = { s: 6, d: 0, w: 0, kn: 1, l: Date.now() }; }
function dueList() { return ITEMS.filter(x => isDue(x.k)).sort((a, b) => S.p[a.k].d - S.p[b.k].d); }
function counts(list) {
  list = list || ITEMS;
  const c = { total: list.length, new: 0, learn: 0, master: 0, known: 0, due: 0, hard: 0 };
  list.forEach(x => { const s = status(x.k); c[s]++; if (isDue(x.k)) c.due++; if (isHard(x.k)) c.hard++; });
  c.solid = c.master + c.known; c.seen = c.total - c.new;
  c.pct = c.total ? (c.solid + c.learn * .35) / c.total : 0;
  return c;
}
function forecast() {
  const out = Array(7).fill(0), t0 = new Date(); t0.setHours(0, 0, 0, 0);
  ITEMS.forEach(x => { if (!isLearn(x.k)) return; const d = Math.floor((Math.max(S.p[x.k].d, t0.getTime()) - t0) / DAY); if (d >= 0 && d < 7) out[d]++; });
  return out;
}
function nextNewIn(c) { return (c ? BYCAT[c] : ITEMS).filter(x => status(x.k) === 'new'); }
function nextCat() {
  for (const sh of SHELVES) for (const c of sh.cats) { const n = BYCAT[c].filter(x => status(x.k) === 'new').length; if (n && BYCAT[c].some(x => status(x.k) !== 'new')) return c; }
  for (const sh of SHELVES) for (const c of sh.cats) if (BYCAT[c].some(x => status(x.k) === 'new')) return c;
  return null;
}

/* =====================================================================
   XP, SERİ, SEVİYE — ebru basamakları
   ===================================================================== */
const LEVELS = [
  { xp: 0, t: 'Okur', e: 'Battal ebru', tech: 'battal', d: 'Ebrunun alfabesi: tekneye serpilen boyalar, birbirini iterek kendi yerini bulur.' },
  { xp: 250, t: 'Dikkatli okur', e: 'Gelgit ebru', tech: 'gelgit', d: 'Bız (ince çubuk) boyaların içinde bir aşağı bir yukarı gezdirilir; dalgalar doğar.' },
  { xp: 700, t: 'Yakın okuyucu', e: 'Taraklı ebru', tech: 'tarakli', d: 'Gelgidin üstünden ince dişli bir tarak geçer; desen tüy gibi incelir.' },
  { xp: 1400, t: 'Yorumcu', e: 'Şal ebru', tech: 'sal', d: 'Tarak dalgalı yürütülür; desen Kaşmir şallarını andırır.' },
  { xp: 2400, t: 'Çözümleyici', e: 'Bülbül yuvası', tech: 'bulbul', d: 'Bız küçük daireler çizer; boyalar sarmal yuvalar örer.' },
  { xp: 3800, t: 'Eleştirmen', e: 'Kumlu ebru', tech: 'kumlu', d: 'Sayısız minik damla, kumsala benzeyen ince bir doku oluşturur.' },
  { xp: 5600, t: 'Kuramcı', e: 'Hatip ebrusu', tech: 'hatip', d: 'İç içe damlalar bızla çekilerek yıldız ve kalp biçimli göbeklere dönüşür.' },
  { xp: 7800, t: 'Usta okur', e: 'Çiçekli ebru', tech: 'cicek', d: 'Damlalar bızla çekilip lâle ve karanfillere dönüşür.' },
  { xp: 10500, t: 'Usta eleştirmen', e: 'Üstat işi', tech: 'usta', d: 'Şal zemin üstüne çiçekler: bütün tekniklerin bir arada olduğu kâğıt.' }
];
function levelIndex(xp) { let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++; return i; }
if (S.lv == null || S.lv < levelIndex(S.xp)) S.lv = levelIndex(S.xp);
function levelInfo() {
  const i = levelIndex(S.xp), L = LEVELS[i], N = LEVELS[i + 1];
  return { i, L, N, pct: N ? (S.xp - L.xp) / (N.xp - L.xp) : 1, left: N ? N.xp - S.xp : 0 };
}
let ON_LEVEL = null;
function addXP(n) {
  if (!n) return;
  const before = levelIndex(S.xp);
  S.xp += n; const t = ymd(); S.days[t] = (S.days[t] || 0) + n;
  const after = levelIndex(S.xp);
  if (after > before && after > (S.lv || 0)) { S.lv = after; if (ON_LEVEL) setTimeout(() => ON_LEVEL(after), 650); }
  touch();
}
function countAnswer(ok) { const t = ymd(); S.ans[t] = (S.ans[t] || 0) + 1; S.ta++; if (ok) S.tc++; touch(); }
function streak() { let n = 0; const d = new Date(); if (!S.days[ymd(d)]) d.setDate(d.getDate() - 1); while (S.days[ymd(d)]) { n++; d.setDate(d.getDate() - 1); } return n; }
const todayXP = () => S.days[ymd()] || 0;
const todayAns = () => S.ans[ymd()] || 0;

/* =====================================================================
   SORU ÜRETİMİ
   tipler: def (terim → tanım), term (tanım → terim), ex (örnek → terim),
           en (İngilizce → terim), type (tanım → yaz)
   ===================================================================== */
function distractors(it, n, opt) {
  opt = opt || {};
  const ban = new Set([it.k, ...(opt.ban || [])]);
  const pairs = (PAIR_OF[it.k] || []).map(i => PAIRS[i]).flatMap(p => [p[0], p[1]]).map(pairItem).filter(x => x && !ban.has(x.k));
  const same = shuffle(BYCAT[it.c].filter(x => !ban.has(x.k)));
  const other = shuffle(ITEMS.filter(x => x.c !== it.c && !ban.has(x.k)));
  const out = [], seen = new Set();
  const push = x => { if (x && !seen.has(x.k) && out.length < n && (!opt.filter || opt.filter(x))) { seen.add(x.k); out.push(x); } };
  if (opt.pairs !== false) shuffle(pairs).slice(0, 1).forEach(push);
  same.forEach(push); other.forEach(push);
  return out;
}
function makeQ(it, type) {
  const q = { it, type };
  if (type === 'type') return q;
  const filter = type === 'en' ? x => norm(x.en) !== norm(it.en) : type === 'def' ? x => x.m !== it.m : null;
  const ds = distractors(it, 3, { filter });
  q.options = shuffle([it, ...ds]).map(x => ({ x, ok: x.k === it.k, picked: false }));
  return q;
}
function typeForStage(it) {
  const s = Math.max(0, stageOf(it.k));
  if (s <= 1) return 'def';
  if (s === 2) return 'term';
  if (s === 3) return it.ex ? 'ex' : 'term';
  return typeable(it) ? 'type' : 'ex';
}
function optText(q, x) {
  if (q.type === 'def') return x.m;
  return x.t;
}

/* =====================================================================
   SES, TİTREŞİM, SESLİ OKUMA
   ===================================================================== */
const TTS = { ok: typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined', v: null };
function pickVoice() { try { const vs = speechSynthesis.getVoices(); TTS.v = vs.find(v => /^tr/i.test(v.lang)) || null; } catch (e) {} }
if (TTS.ok) { pickVoice(); try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {} }
function speak(t) { if (!TTS.ok || !t) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'tr-TR'; if (TTS.v) u.voice = TTS.v; u.rate = S.pref.rate || .95; speechSynthesis.speak(u); } catch (e) {} }
function hush() { try { if (TTS.ok) speechSynthesis.cancel(); } catch (e) {} }
function haptic(kind) {
  if (!S.pref.haptic || !navigator.vibrate) return;
  const PT = { tap: 8, ok: 14, no: [26, 60, 26], big: [14, 40, 14, 40, 70], warn: 45 };
  try { navigator.vibrate(PT[kind] || 10); } catch (e) {}
}
let ACTX = null;
function sfx(kind) {
  if (!S.pref.sound) return;
  try {
    ACTX = ACTX || new (window.AudioContext || window.webkitAudioContext)();
    if (ACTX.state === 'suspended') ACTX.resume();
    const t = ACTX.currentTime, g = ACTX.createGain(); g.connect(ACTX.destination);
    const tone = (f0, f1, start, dur, vol, type) => {
      const o = ACTX.createOscillator(), gg = ACTX.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t + start); o.frequency.exponentialRampToValueAtTime(f1, t + start + dur);
      gg.gain.setValueAtTime(0.0001, t + start); gg.gain.exponentialRampToValueAtTime(vol, t + start + .012); gg.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      o.connect(gg); gg.connect(g); o.start(t + start); o.stop(t + start + dur + .02);
    };
    if (kind === 'ok') { tone(660, 990, 0, .16, .07); tone(990, 1320, .08, .2, .05); }
    else if (kind === 'no') { tone(220, 150, 0, .22, .07, 'triangle'); }
    else if (kind === 'drop') { tone(1200, 380, 0, .14, .05); }
    else if (kind === 'win') { [523, 659, 784, 1046].forEach((f, i) => tone(f, f * 1.01, i * .09, .32, .05)); }
    else if (kind === 'tick') { tone(1800, 1600, 0, .03, .025); }
  } catch (e) {}
}

/* ---------- günün terimi / günün boyası ---------- */
function dayTerm(d) { const r = rng(hashStr('terim:' + ymd(d))); return ITEMS[Math.floor(r() * ITEMS.length)]; }
function dayCat(d) { return dayTerm(d).c; }
function fmtTime(ms) { const s = Math.round(ms / 1000); return s < 60 ? s + ' sn' : Math.floor(s / 60) + ' dk ' + (s % 60) + ' sn'; }
