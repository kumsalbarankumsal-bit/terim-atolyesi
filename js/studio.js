'use strict';
/* =====================================================================
   TERİM ATÖLYESİ — Stüdyo
   Çalışma seti + 18 mod. Her mod: start · view · after · act · key · summary.
   Stüdyo modları tekrar takvimini bozmaz; yalnızca Öğren, Kartlar sonu ve
   Maraton yeni terimleri aralıklı tekrar listesine ekler.
   ===================================================================== */
const ST_GROUPS = [
  { k: 'tanis', tr: 'Tanış', tag: 'ilk karşılaşma', d: 'Kartlarla ayıkla, Öğren ile üç basamakta çalış, kendi sözlerinle anlat.', modes: ['cards', 'learn', 'anlat'] },
  { k: 'yaz', tr: 'Hatırla ve üret', tag: 'seçenek yok', d: 'Terimi kendin üretirsin. Hafızadaki en kalıcı iz burada oluşur.', modes: ['write', 'spell', 'define'] },
  { k: 'metin', tr: 'Metinde gör', tag: 'Paper 1 gibi', d: 'Terimi örnekte ve kısa metinde tanı; kanıt → teknik → etki zincirini kur.', modes: ['example', 'lens', 'chain', 'twin'] },
  { k: 'oyun', tr: 'Oyunlar', tag: 'hız ve dikkat', d: 'Tanımayı otomatikleştirir. Rekorlar sete göre tutulur.', modes: ['match', 'memory', 'eclair', 'rain', 'shelf'] },
  { k: 'sina', tr: 'Sına ve kalıcı yap', tag: 'sınav provası', d: 'Geri bildirimsiz test, bir alanın tamamını bitiren maraton ve kendi bağlantın.', modes: ['test', 'exam', 'atelier'] }
];
function stSrcList() {
  return [['all', 'Bütün terimler'], ...CAT_KEYS.map(c => ['c:' + c, CATS[c]]), ['due', 'Tekrarı gelenler'], ['hard', 'Zorlu'], ['fav', 'Yıldızlı'], ['mine', 'Öğrendiklerim'], ['new', 'Henüz yeni'], ['notes', 'Notlu']];
}
function stSet() { if (!S.st || typeof S.st !== 'object') S.st = { src: 'all', size: 20, order: 'smart' }; return S.st; }
function stCatOf(sel) { return /^c:/.test(sel.src) ? sel.src.slice(2) : null; }
function stBase(sel) {
  const c = stCatOf(sel);
  if (c && BYCAT[c]) return BYCAT[c];
  switch (sel.src) {
    case 'due': return dueList();
    case 'hard': return ITEMS.filter(x => isHard(x.k));
    case 'fav': return ITEMS.filter(x => S.f[x.k]);
    case 'mine': return ITEMS.filter(x => status(x.k) !== 'new');
    case 'new': return ITEMS.filter(x => status(x.k) === 'new');
    case 'notes': return ITEMS.filter(x => S.notes[x.k]);
    default: return ITEMS;
  }
}
function stOrdered(ws, order) {
  if (order === 'book') return ws.slice().sort((a, b) => a.i - b.i);
  if (order === 'rand') return shuffle(ws.slice());
  const b = [[], [], [], [], [], []];
  ws.forEach(w => { const s = status(w.k); b[isDue(w.k) ? 0 : isHard(w.k) ? 1 : s === 'learn' ? 2 : s === 'new' ? 3 : 4].push(w); });
  return [...shuffle(b[0]), ...shuffle(b[1]), ...b[2].sort((x, y) => stageOf(x.k) - stageOf(y.k)), ...b[3].sort((x, y) => x.i - y.i), ...shuffle(b[4])];
}
function stLabel(sel) { const f = stSrcList().find(x => x[0] === sel.src); return f ? f[1] : 'Bütün terimler'; }
function stKey(sel) { return sel.src; }
function stOpt(k, def) { S.mo = S.mo || {}; const o = Object.assign({}, def, S.mo[k] || {}); S.mo[k] = o; return o; }
function stBest(P, val, lowerBetter, sub) {
  const key = P.k + (sub ? '-' + sub : '') + ':' + stKey(P.sel), cur = S.best[key];
  const better = cur === undefined || (lowerBetter ? val < cur : val > cur);
  if (better) S.best[key] = val;
  return { rec: better && cur !== undefined, first: cur === undefined, prev: cur };
}

/* ---------- ortak parçalar ---------- */
function plSay(it) { return TTS.ok ? `<button class="iconbtn plain" data-say="${esc(it.k)}" aria-label="Sesli oku">${IC('speak')}</button>` : ''; }
function plFb(P, it, ok, note, extra) { return fbHTML(ok, it, note, extra); }
function plNext(P, label) { return `<div class="sess-actions">${P.canOv ? `<button class="btn ghost" data-pl="override">${IC('check')}Aslında doğru yazdım</button>` : ''}<button class="btn lg" data-pl="next" id="plNext">${label || 'Devam'}${IC('arrow')}</button></div><p class="kbd">Enter: devam</p>`; }
function plType(P, ph) {
  return `<div class="typein"><input id="plIn" class="${P.ans ? (P.ok1 ? 'ok' : 'no') : ''}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="${ph || 'Terimi yaz…'}" ${P.ans ? `disabled value="${esc(P.typed || '')}"` : ''} aria-label="Cevabın"><button class="btn" data-pl="check" ${P.ans ? 'disabled' : ''}>Kontrol et</button></div>
    ${P.ans ? '' : `<div class="trkeys" aria-label="Türkçe harfler">${TR_KEYS.map(k => `<button data-trk="${k}" tabindex="-1">${k}</button>`).join('')}</div>`}`;
}
function plFocusIn() { const i = $('#plIn'); if (i && !i.disabled) setTimeout(() => i.focus({ preventScroll: true }), 60); const n = $('#plNext'); if (n) setTimeout(() => n.focus({ preventScroll: true }), 40); }
function paper(it, inner, opt) {
  opt = opt || {};
  return `<article class="paper ${opt.enter === false ? '' : 'enter'}" id="plPaper" style="${catStyle(it ? it.c : 't')}">${it ? `<span class="strip" data-strip="${it.c}" aria-hidden="true"></span>` : '<span class="strip" style="background:linear-gradient(90deg,#2A44B8,#0B97A4,#0F8E57,#E09E06,#DD3A2A,#D1337C)"></span>'}${inner}</article>`;
}
const STOP = new Set('ve ile bir bu şu o da de ya ki gibi için kadar daha çok az en ne nasıl hangi her hiç olan olarak ise ama fakat yani bunu onu şey biri iki üç değil diye kendi bütün metin metinde metnin okur okura okurun anlam anlamı yerine yoluyla arasında olur olması ayrı başka sonra önce'.split(' '));
function words(s) { return (lowerTr(s).match(/[a-zçğıöşüâîû]+/g) || []); }
const DF = (() => { const df = Object.create(null); ITEMS.forEach(x => { new Set(words(x.m)).forEach(w => { df[w] = (df[w] || 0) + 1; }); }); return df; })();

/* =====================================================================
   OYNATICI
   ===================================================================== */
let PL = null;
function stLaunch(k, over) {
  over = over || {};
  const M = MODES[k]; if (!M) return;
  const sel = Object.assign({}, stSet(), over.set || {});
  if (k === 'exam') { examOpen(sel); return; }
  let ws = over.ids ? over.ids.map(id => BYK[id]).filter(Boolean) : stOrdered(stBase(sel), sel.order);
  if (M.elig) ws = ws.filter(M.elig);
  const size = over.size !== undefined ? over.size : (M.size !== undefined ? M.size : sel.size);
  if (size && !over.ids && !M.ownSize) ws = ws.slice(0, size);
  const min = M.min || 1;
  if (!M.free && ws.length < min) { toast(ws.length ? `Bu mod için en az ${min} uygun terim gerekiyor; sette ${ws.length} var. Daha büyük bir set seç.` : (M.none || 'Bu sette bu moda uygun terim yok; başka bir set seç.'), 3600); return; }
  plStop(); closeSheet();
  PL = { k, M, sel, over, words: ws, label: over.label || stLabel(sel), xp0: S.xp, xpShown: 0, t0: Date.now(), ok: 0, no: 0, combo: 0, maxCombo: 0, wrong: new Set(), done: false, from: PAGES.includes(VIEW) ? VIEW : 'studio', tm: [] };
  M.start(PL);
  if (PL.abort) { const m = PL.abort; PL = null; toast(m, 3600); return; }
  show('play');
}
function plStop() {
  if (!PL) return;
  if (PL.M.stop) try { PL.M.stop(PL); } catch (e) {}
  (PL.tm || []).forEach(t => { clearTimeout(t); clearInterval(t); }); PL.tm = [];
  if (PL.raf) cancelAnimationFrame(PL.raf); PL.raf = 0;
}
function plRender() {
  if (!PL) { $('#v-play').innerHTML = ''; return; }
  const v = $('#v-play');
  v.innerHTML = plHeader() + `<div class="stagewrap ${PL.M.wide ? 'wide' : ''}">${PL.done ? plSummaryHTML() : PL.M.view(PL)}</div>`;
  paintStrips(v); paintSwatches(v);
  if (PL.done) countUps(v);
  if (!PL.done && PL.M.after) PL.M.after(PL);
}
RENDER.play = () => plRender();
function plHeader() {
  const p = PL.done ? 1 : PL.M.progress ? clamp(PL.M.progress(PL), 0, 1) : null;
  return `<div class="pl-top">
    <button class="iconbtn" data-pl="quit" aria-label="${PL.done ? 'Kapat' : 'Bitir'}">${IC('x')}</button>
    <div class="pl-t"><b>${IC(PL.M.ic, 'sm')}${esc(PL.M.tr)}</b><span>${esc(PL.label)}</span></div>
    ${!PL.done && PL.M.hud ? PL.M.hud(PL) : ''}
    <span class="combo" id="plCombo" ${PL.combo >= 3 && !PL.done ? '' : 'hidden'}>${IC('flame', 'sm')}<span>×${PL.combo}</span></span>
    <span class="pl-xp tnum" id="plXP">+${S.xp - PL.xp0} XP</span>
  </div>${p !== null ? `<div class="prog"><span style="width:${(p * 100).toFixed(1)}%"></span></div>` : ''}`;
}
function plHud() {
  if (!PL) return;
  const c = $('#plCombo'); if (c) { c.hidden = !(PL.combo >= 3); const s = c.querySelector('span'); if (s) s.textContent = '×' + PL.combo; }
  const p = $('#v-play .prog span'); if (p && PL.M.progress && !PL.done) p.style.width = (clamp(PL.M.progress(PL), 0, 1) * 100).toFixed(1) + '%';
  const h = $('#plHud'); if (h && PL.M.hud) h.outerHTML = PL.M.hud(PL);
}
function plScore(ok, it, o) {
  o = o || {};
  if (ok) { PL.ok++; PL.combo++; PL.maxCombo = Math.max(PL.maxCombo, PL.combo); if (o.xp) addXP(o.xp); }
  else { PL.no++; PL.combo = 0; if (it) PL.wrong.add(it.k); if (o.hard && it && isLearn(it.k)) S.p[it.k].w = (S.p[it.k].w || 0) + 1; }
  if (o.count !== false) countAnswer(ok);
  touch();
}
function plFx(el, ok, xp, col) {
  if (!PL) return;
  haptic(ok ? 'ok' : 'no'); sfx(ok ? 'ok' : 'no');
  const P = PL, done = () => { if (PL !== P) return; const x = $('#plXP'); if (x) x.textContent = '+' + (S.xp - P.xp0) + ' XP'; };
  const c = $('#plCombo');
  if (ok) {
    if (el) splashAt(el, 14, col ? [col, '#FFFFFF', col] : null);
    if (xp && el) flyTo(el, $('#plXP'), '+' + xp, 'xp', done); else done();
    if (c && P.combo >= 3) { c.hidden = false; c.querySelector('span').textContent = '×' + P.combo; if (P.combo % 5 === 0) { bump(c); splashAt(c, 22, ['#E09E06', '#DD3A2A', '#FFFFFF']); haptic('big'); } }
  } else { if (el) shake(el); done(); if (c) c.hidden = true; }
}
function plFinish(st) {
  if (!PL || PL.done) return;
  plStop(); PL.done = true; PL.stats = st;
  touch(); flush(); plRender();
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  if (st.confetti) setTimeout(() => { confetti(st.confetti); sfx('win'); }, 120);
}
function plSummaryHTML() {
  const s = PL.stats, wrong = [...PL.wrong].map(k => BYK[k]).filter(Boolean), I = levelInfo();
  return `<section class="card sum rise">
      <div class="sum-paper" data-lvimg="${I.i}" data-w="760" data-h="300" data-pal="${EB.phaseOf()}"></div>
      ${s.rec ? `<span class="recpill">${IC('trophy', 'sm')}Yeni rekor</span>` : ''}<h1>${esc(s.title)}</h1>${s.big !== undefined ? `<div class="sum-big tnum">${s.big}</div>` : ''}<p class="muted">${esc(s.sub || '')}</p>
      <div class="sum-stats">${s.rows.map(([a, b]) => `<div class="stat"><b class="tnum">${b}</b><span>${a}</span></div>`).join('')}</div>
      ${s.note ? `<p class="note">${s.note}</p>` : ''}
      ${s.btns ? `<div class="sess-actions" style="justify-content:center">${s.btns}</div>` : ''}
      <div class="sess-actions" style="justify-content:center">
        <button class="btn lg" data-pl="again">${IC('review')}${s.againLabel || 'Yeniden'}</button>
        ${wrong.length && PL.k !== 'learn' ? `<button class="btn no lg" data-pl="wrong">${IC('learn')}Yanlışlarla Öğren (${wrong.length})</button>` : ''}
        <button class="btn ghost lg" data-pl="studio">${IC('studio')}Başka mod</button>
      </div></section>
    ${s.extra || ''}
    ${wrong.length && !s.noWrongList ? `<section class="card" style="margin-top:14px"><div class="card-h"><h2>Gözden geçir</h2><span class="faint" style="font-weight:800">${wrong.length} terim</span></div><div class="wlist">${wrong.map(x => `<div class="wl" style="${catStyle(x.c)}"><b>${esc(x.t)}</b><span>${esc(x.m)}</span></div>`).join('')}</div></section>` : ''}`;
}
function plQuit() {
  if (!PL) { show('studio'); return; }
  if (PL.done || PL.ok + PL.no === 0) { const f = PL.from; plStop(); PL = null; show(f || 'studio'); return; }
  plFinish(PL.M.summary ? PL.M.summary(PL, true) : { title: 'Ara verdin', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]] });
}
function plAct(a, t, e) {
  if (!PL) return;
  if (a === 'quit') { plQuit(); return; }
  if (a === 'again') { const P = PL; stLaunch(P.k, Object.assign({}, P.over, { ids: P.M.free ? undefined : P.words.map(w => w.k), set: P.sel, label: P.label })); return; }
  if (a === 'wrong') { const P = PL; stLaunch('learn', { ids: [...P.wrong], set: P.sel, label: 'Yanlışların · ' + P.M.tr }); return; }
  if (a === 'studio') { const g = PL.M.grp; plStop(); PL = null; show(g === 'p2' ? 'p2' : 'studio'); return; }
  if (PL.M.act) PL.M.act(PL, a, t, e);
}
/* sürükle-bırak kartı */
function bindDrag(el, onL, onR) {
  if (!el) return;
  let x0 = 0, y0 = 0, dx = 0, on = false, id = null;
  const tl = el.querySelector('.swipe-tag.l'), tr = el.querySelector('.swipe-tag.r');
  el.addEventListener('pointerdown', e => { if (e.button > 0) return; on = true; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; dx = 0; el.style.transition = 'none'; delete el.dataset.dragged; });
  el.addEventListener('pointermove', e => {
    if (!on || e.pointerId !== id) return;
    dx = e.clientX - x0; const dy = e.clientY - y0;
    if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx) * 1.2) return;
    try { el.setPointerCapture(id); } catch (er) {}
    el.dataset.dragged = 1;
    el.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
    if (tl) tl.style.opacity = Math.max(0, -dx / 110); if (tr) tr.style.opacity = Math.max(0, dx / 110);
  });
  const end = e => {
    if (!on || (e && e.pointerId !== id)) return; on = false;
    el.style.transition = '';
    if (tl) tl.style.opacity = 0; if (tr) tr.style.opacity = 0;
    if (dx > 100) onR(); else if (dx < -100) onL(); else el.style.transform = '';
    setTimeout(() => { delete el.dataset.dragged; }, 50);
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}

/* =====================================================================
   MODLAR
   ===================================================================== */
const MODES = {};

/* ---------- Kartlar ---------- */
MODES.cards = {
  tr: 'Kartlar', tag: 'çevir · kaydır', ic: 'cards', grp: 'tanis', ill: '<i class="card1"></i><i class="card2"></i>',
  why: 'Önce hatırlamaya çalış, sonra çevir. Bilmediğin kartlar yeni turda yeniden gelir.',
  start(P) { P.o = stOpt('cards', { front: 'term' }); P.deck = shuffle(P.words.slice()); P.i = 0; P.round = 1; P.again = []; P.known = new Set(); P.first = new Set(); P.flip = false; },
  progress: P => P.known.size / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.round}. tur · ${P.deck.length - P.i} kart</span>`,
  view(P) {
    const w = P.deck[P.i], tf = P.o.front === 'term';
    const termFace = `<div class="fl-mid"><span class="q-label">${esc(CATS[w.c])}</span><div class="bigterm">${esc(w.t)}</div><div class="en-tag" lang="en">${esc(w.en)}</div></div><div class="fl-bot">${plSay(w)}<span>anlamını hatırla, sonra çevir</span></div>`;
    const defFace = `<div class="fl-mid"><span class="q-label">Hangi terim?</span><p class="qdef">${esc(w.m)}</p></div><div class="fl-bot"><span>terimi hatırla, sonra çevir</span></div>`;
    const back = `<div class="fl-mid" style="align-items:flex-start;text-align:left">${tf ? '' : `<div class="bigterm md">${esc(w.t)}</div>`}<p class="qdef">${esc(w.m)}</p><p class="qex" style="width:100%">${esc(w.ex)}</p>${S.notes[w.k] ? `<p class="hint">Notun: ${esc(S.notes[w.k])}</p>` : ''}</div>`;
    return `<div class="row" style="justify-content:center;margin-bottom:12px"><div class="seg" role="group" aria-label="Kartın ön yüzü"><button data-pl="front" data-v="term" aria-pressed="${tf}">Ön yüz: terim</button><button data-pl="front" data-v="def" aria-pressed="${!tf}">Ön yüz: tanım</button></div></div>
      <div class="flash ${P.flip ? 'flip' : ''}" id="flash" data-pl="flip" role="button" tabindex="0" aria-label="Kartı çevir" style="${catStyle(w.c)}">
        <span class="swipe-tag l">TEKRAR</span><span class="swipe-tag r">BİLİYORUM</span>
        <div class="flash-in"><div class="flash-face f"><span class="strip" data-strip="${w.c}"></span>${tf ? termFace : defFace}</div><div class="flash-face b"><span class="strip" data-strip="${w.c}"></span>${back}</div></div>
      </div>
      <div class="decide"><button class="btn ghost lg" data-pl="no">${IC('review')}Tekrar gelsin</button><button class="btn ok lg" data-pl="yes">${IC('check')}Biliyorum</button></div>
      <p class="kbd">Boşluk: çevir · ← tekrar gelsin · → biliyorum · kartı kaydırabilirsin</p>`;
  },
  after(P) { bindDrag($('#flash'), () => cardsDecide(P, false), () => cardsDecide(P, true)); },
  act(P, a, t) {
    if (a === 'flip') { const el = $('#flash'); if (!el || el.dataset.dragged) return; P.flip = !P.flip; el.classList.toggle('flip', P.flip); haptic('tap'); if (P.flip && S.pref.auto) speak(P.deck[P.i].m); return; }
    if (a === 'yes' || a === 'no') { cardsDecide(P, a === 'yes'); return; }
    if (a === 'front') { P.o.front = t.dataset.v; touch(); P.flip = false; plRender(); return; }
    if (a === 'mk-learn') { const ids = P.toLearn || []; ids.forEach(k => learnTerm(k, false)); addXP(3 * ids.length); touch(); toast(`${ids.length} terim öğrenme listene eklendi · ilk tekrar yarın`); P.toLearn = []; P.stats.btns = cardsBtns(P); plRender(); return; }
    if (a === 'mk-known') { const ids = P.toKnow || []; ids.forEach(k => knowTerm(k)); touch(); toast(`${ids.length} terim “biliyordum” olarak işaretlendi`); P.toKnow = []; P.stats.btns = cardsBtns(P); plRender(); }
  },
  key(P, e, inInput) { if (inInput) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); MODES.cards.act(P, 'flip'); } else if (e.key === 'ArrowRight') cardsDecide(P, true); else if (e.key === 'ArrowLeft') cardsDecide(P, false); },
  summary(P, early) {
    P.toLearn = P.words.filter(w => !P.first.has(w.k) && status(w.k) === 'new').map(w => w.k);
    P.toKnow = [...P.first].filter(k => status(k) === 'new');
    const st = { title: early ? 'Ara verdin' : 'Bütün kartlar tamam', big: `${P.first.size}/${P.words.length}`, sub: 'ilk turda bildiğin kartlar',
      rows: [['Tur', P.round], ['Kart', P.words.length], ['Bilmediğin', P.words.length - P.first.size], ['XP', '+' + (S.xp - P.xp0)]],
      note: 'Bilmediğin kartlar için en iyi sonraki adım Öğren: aynı terimleri önce seçerek, sonra yazarak çalıştırır.', confetti: early ? 0 : 90 };
    P.stats = st; st.btns = cardsBtns(P); return st;
  }
};
function cardsBtns(P) {
  return (P.toLearn && P.toLearn.length ? `<button class="btn" data-pl="mk-learn">${IC('plus')}Bilmediğim ${P.toLearn.length} yeni terimi listeme ekle</button>` : '')
    + (P.toKnow && P.toKnow.length ? `<button class="btn ghost" data-pl="mk-known">${IC('check')}İlk turda bildiğim ${P.toKnow.length} yeni terimi “biliyordum” say</button>` : '');
}
function cardsDecide(P, yes) {
  if (P.busy || P.done) return; P.busy = true;
  const w = P.deck[P.i], el = $('#flash');
  if (yes) { P.known.add(w.k); if (P.round === 1) P.first.add(w.k); addXP(1); PL.ok++; }
  else { P.again.push(w); PL.wrong.add(w.k); PL.no++; }
  countAnswer(yes); touch(); haptic(yes ? 'ok' : 'tap');
  if (yes) splashAt(el, 10, [PIG[w.c].h, '#FFFFFF']);
  outAnim(el, yes ? 'r' : 'l', () => {
    P.busy = false; P.i++; P.flip = false;
    if (P.i >= P.deck.length) {
      if (P.again.length) { P.deck = shuffle(P.again); P.again = []; P.i = 0; P.round++; toast(`${P.round}. tur · bilmediğin ${P.deck.length} kart`); }
      else { addXP(8); plFinish(MODES.cards.summary(P, false)); return; }
    }
    plRender();
  });
}

/* ---------- Öğren ---------- */
MODES.learn = {
  tr: 'Öğren', tag: 'tanı · seç · yaz', ic: 'learn', grp: 'tanis', ill: '<span class="bars"><i></i><i></i><i></i></span>',
  why: 'Her terim üç basamaktan geçer: anlamını tanı, tanımdan seç, sonunda kendin yaz. Bitenler aralıklı tekrar listene girer.',
  start(P) {
    P.lv = {}; P.miss = {}; P.words.forEach(w => { P.lv[w.k] = 0; P.miss[w.k] = 0; });
    P.queue = P.words.slice(); P.active = []; P.recent = []; P.finished = []; P.added = 0;
    learnFill(P); learnNext(P);
  },
  progress: P => P.words.reduce((s, w) => s + P.lv[w.k], 0) / (P.words.length * 3),
  hud: P => `<span class="hud" id="plHud">${P.finished.length}/${P.words.length} tamam</span>`,
  view(P) {
    const q = P.q, w = q.it, L = clamp(P.lv[w.k], 0, 2);
    const strip = P.active.concat(P.finished.slice(-4)).map(x => `<i class="lv${Math.min(3, P.lv[x.k])} ${x === w ? 'cur' : ''}" title="${esc(x.main)}"></i>`).join('');
    let body;
    if (q.type === 'type') body = plType(P) + (P.ans ? '' : `<div class="row" style="margin-top:10px"><span class="hint">İpucu: «${esc(w.main.charAt(0))}…», ${w.main.length} harf</span><span class="spacer"></span><button class="linkbtn" data-pl="idk">Bilmiyorum</button></div>`);
    else body = optsHTML(q, P.ans, 'plopt');
    const extra = q.type === 'type' && P.typed && (!P.ok1 || P.near) ? `<p>Doğrusu: <b>${diffHTML(P.typed, w.main)}</b></p>` : '';
    return `<div class="lv-strip" aria-label="Çalışılan terimler ve basamakları">${strip}</div>
      ${paper(w, `<div class="row" style="justify-content:space-between;margin-bottom:4px"><span class="hint">${['Tanı', 'Seç', 'Yaz'][L]} · basamak ${L + 1}/3</span><span class="stage">${[0, 1, 2].map(i => `<i class="${i < P.lv[w.k] ? 'on' : ''}"></i>`).join('')}</span></div>
        ${qPromptHTML(q)}${body}${P.ans ? plFb(P, w, P.ok1, P.near ? 'Neredeyse' : '', extra) : ''}`, { enter: !P.ans })}
      ${P.ans ? plNext(P) : `<p class="kbd">${q.type === 'type' ? 'Enter: kontrol et' : '1–4 ile seçebilirsin'}</p>`}`;
  },
  after() { plFocusIn(); },
  act(P, a, t) {
    if (a === 'plopt' && !P.ans) { const o = P.q.options[+t.dataset.k]; if (!o) return; o.picked = true; P.typed = null; P.near = false; P.canOv = false; learnAnswer(P, o.ok); plRender(); plFx($(`[data-pl="plopt"][data-k="${t.dataset.k}"]`), o.ok, o.ok ? 3 : 0, PIG[P.q.it.c].h); if (o.ok) learnAuto(P, 900); return; }
    if ((a === 'check' || a === 'idk') && !P.ans) {
      const v = a === 'idk' ? '' : (($('#plIn') || {}).value || '').trim(); if (a === 'check' && !v) return;
      const res = a === 'idk' ? 'no' : checkTyped(v, P.q.it);
      P.typed = v; P.near = res === 'near'; P.canOv = res === 'no' && a !== 'idk';
      learnAnswer(P, res !== 'no'); plRender(); plFx($('#plIn') || $('#plPaper'), res !== 'no', res !== 'no' ? 3 : 0, PIG[P.q.it.c].h);
      if (res === 'ok') learnAuto(P, 1000);
      return;
    }
    if (a === 'override' && P.canOv) { const w = P.q.it; P.canOv = false; P.lv[w.k] = Math.min(3, (P.qL || 0) + 1); P.miss[w.k] = Math.max(0, P.miss[w.k] - 1); PL.no--; PL.ok++; PL.wrong.delete(w.k); P.ok1 = true; if (P.lv[w.k] >= 3) learnDone(P, w); plRender(); return; }
    if (a === 'next' && P.ans) learnGo(P);
  },
  key(P, e, inInput) {
    if (inInput) { if (e.key === 'Enter') { e.preventDefault(); MODES.learn.act(P, P.ans ? 'next' : 'check'); } return; }
    if (!P.ans && /^[1-4]$/.test(e.key) && P.q.options) { const b = $(`[data-pl="plopt"][data-k="${+e.key - 1}"]`); if (b) b.click(); }
    else if (P.ans && e.key === 'Enter') { e.preventDefault(); learnGo(P); }
  },
  summary(P, early) {
    const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0, hard = P.words.filter(w => P.miss[w.k] >= 2).length;
    return { title: early ? 'Mola' : 'Öğrendin', big: `${P.finished.length}/${P.words.length}`, sub: 'terim üç basamağı da geçti',
      rows: [['Doğruluk', '%' + acc], ['Listene giren', P.added], ['Zorlandığın', hard], ['Süre', fmtTime(Date.now() - PL.t0)]],
      note: P.added ? `${P.added} terim aralıklı tekrar listene girdi; ilk tekrarları yarın.` : (early ? 'Kaldığın terimler bir sonraki Öğren oturumunda yine önüne gelir.' : ''),
      againLabel: 'Aynı terimlerle yeniden', confetti: !early && P.finished.length >= 5 ? 120 : 0 };
  }
};
function learnFill(P) { while (P.active.length < 6 && P.queue.length) P.active.push(P.queue.shift()); }
function learnNext(P) {
  learnFill(P);
  if (!P.active.length) { addXP(5); plFinish(MODES.learn.summary(P, false)); return false; }
  const cands = P.active.filter(w => !P.recent.includes(w.k));
  const w = (cands.length ? cands : P.active).sort((a, b) => P.lv[a.k] - P.lv[b.k] || Math.random() - .5)[0];
  const L = clamp(P.lv[w.k], 0, 2);
  const type = L === 0 ? 'def' : L === 1 ? (w.ex && Math.random() < .4 ? 'ex' : 'term') : (typeable(w) ? 'type' : 'ex');
  P.q = makeQ(w, type); P.qL = L; P.ans = false; P.ok1 = false; P.typed = ''; P.canOv = false; P.near = false;
  P.recent.push(w.k); if (P.recent.length > Math.min(2, P.active.length - 1)) P.recent.shift();
  return true;
}
function learnDone(P, w) {
  P.active = P.active.filter(x => x !== w); P.finished.push(w);
  if (status(w.k) === 'new') { learnTerm(w.k, true); P.added++; }
  addXP(4);
}
function learnAnswer(P, ok) {
  const w = P.q.it; P.ans = true; P.ok1 = ok;
  plScore(ok, w, { xp: ok ? 3 : 0 });
  if (ok) { P.lv[w.k]++; if (P.lv[w.k] >= 3) learnDone(P, w); }
  else { P.miss[w.k]++; P.lv[w.k] = Math.max(0, P.lv[w.k] - 1); }
}
function learnAuto(P, ms) { if (!S.pref.adv) return; const q = P.q; P.tm.push(setTimeout(() => { if (PL === P && P.q === q && P.ans && !P.done) learnGo(P); }, ms)); }
function learnGo(P) { if (learnNext(P)) plRender(); }

/* ---------- Anlat ---------- */
MODES.anlat = {
  tr: 'Anlat', tag: 'kendi sözlerinle', ic: 'talk', grp: 'tanis', ill: '<span class="bubble"><i></i><i></i></span>',
  why: 'Terimi bir arkadaşına anlatır gibi kendi sözlerinle açıkla, sonra tanımla karşılaştır. Hatırlamaya zorlamak ezberden daha kalıcıdır.',
  start(P) { P.i = 0; P.rev = false; P.text = ''; P.marks = { full: 0, half: 0, none: 0 }; },
  progress: P => P.i / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.words.length}</span>`,
  view(P) {
    const w = P.words[P.i];
    if (!P.rev) return paper(w, `<div class="q-k"><span class="q-label">Bu terimi anlat</span>${catChip(w.c)}</div><div class="bigterm">${esc(w.t)}</div><div class="en-tag" lang="en">${esc(w.en)}</div>
        <div class="notebox" style="margin-top:16px"><label class="q-label" for="anlatIn">İlkokul çocuğuna anlatır gibi: ne demek, metinde neye benzer?</label><textarea id="anlatIn" placeholder="Yazmak istemezsen içinden söyle, sonra karşılaştır.">${esc(P.text)}</textarea></div>
        <div class="sess-actions"><button class="btn lg" data-pl="reveal">${IC('eye')}Tanımla karşılaştır</button></div>`) + '<p class="kbd">Ctrl + Enter: karşılaştır</p>';
    const keys = anlatKeys(w), user = new Set(words(P.text).map(x => x.slice(0, 5)));
    const hit = keys.filter(k => user.has(k.slice(0, 5)));
    return paper(w, `<div class="q-k"><span class="q-label">Karşılaştır</span>${catChip(w.c)}</div><div class="bigterm md">${esc(w.t)}</div>
        ${P.text ? `<div class="model" style="margin-top:12px"><span class="q-label">Senin anlatımın</span><p style="margin-top:4px">${esc(P.text)}</p></div>` : ''}
        <div class="fb good" style="background:var(--card-2);border-color:var(--line)"><span class="q-label">Tanım</span><p class="def">${esc(w.m)}</p><p class="ex">${esc(w.ex)}</p></div>
        ${P.text && keys.length ? `<p class="hint" style="margin-top:12px">Tanımın anahtar sözcüklerinden ${hit.length}/${keys.length} tanesi senin anlatımında: ${keys.map(k => `<span class="chip ${hit.includes(k) ? 'ok' : ''}" style="margin:2px">${esc(k)}</span>`).join('')}</p>` : ''}
        <p class="hint" style="margin-top:14px">Dürüstçe değerlendir:</p>
        <div class="opts" style="grid-template-columns:repeat(3,1fr)"><button class="btn no" data-pl="rate" data-v="none">Bilemedim</button><button class="btn saf" data-pl="rate" data-v="half">Yarım</button><button class="btn ok" data-pl="rate" data-v="full">Tam anlattım</button></div>`, { enter: false });
  },
  after(P) { const t = $('#anlatIn'); if (t) { setTimeout(() => t.focus({ preventScroll: true }), 60); t.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); MODES.anlat.act(P, 'reveal'); } }); } },
  act(P, a, t) {
    if (a === 'reveal') { const ta = $('#anlatIn'); P.text = ta ? ta.value.trim() : ''; P.rev = true; plRender(); haptic('tap'); return; }
    if (a === 'rate') {
      const v = t.dataset.v, w = P.words[P.i]; P.marks[v]++;
      plScore(v !== 'none', w, { xp: v === 'full' ? 4 : v === 'half' ? 2 : 0, hard: v === 'none' });
      if (v === 'none') PL.wrong.add(w.k);
      plFx(t, v !== 'none', v === 'full' ? 4 : v === 'half' ? 2 : 0, PIG[w.c].h);
      P.tm.push(setTimeout(() => { if (PL !== P) return; P.i++; P.rev = false; P.text = ''; if (P.i >= P.words.length) plFinish(MODES.anlat.summary(P, false)); else plRender(); }, 420));
    }
  },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Anlattın', big: P.marks.full, sub: 'terimi tam anlattın', rows: [['Tam', P.marks.full], ['Yarım', P.marks.half], ['Bilemedin', P.marks.none], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Bilemediklerin Öğren modunda üç basamakla pekişir. Anlattıklarını Bağ kur ile not olarak saklayabilirsin.', confetti: !early && P.marks.full >= 5 ? 90 : 0 }; }
};
function anlatKeys(w) {
  const ws = [...new Set(words(w.m))].filter(x => x.length >= 5 && !STOP.has(x));
  return ws.sort((a, b) => (DF[a] || 0) - (DF[b] || 0)).slice(0, 5);
}

/* ---------- Yaz ---------- */
MODES.write = {
  tr: 'Yaz', tag: 'tanımdan terime', ic: 'type', grp: 'yaz', ill: '<span class="line"><i></i><b></b></span>', elig: typeable,
  why: 'Tanımı okursun, terimi kendin yazarsın. Seçenek olmadan hatırlamak, tanımaktan çok daha güçlü bir iz bırakır. İpuçları puanı biraz düşürür.',
  start(P) { P.i = 0; P.ans = false; P.hints = 0; P.score = 0; },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.words.length}</span>`,
  view(P) {
    const w = P.words[P.i], H = P.hints, m = w.main;
    const reveal = H === 0 ? '' : H === 1 ? m.charAt(0) + '…' : H === 2 ? m.slice(0, Math.ceil(m.length / 2)) + '…' : m.split('').map((ch, i) => i % 2 === 0 || ch === ' ' ? ch : '·').join('');
    const extra = P.ans && P.typed && (!P.ok1 || P.near) ? `<p>Doğrusu: <b>${diffHTML(P.typed, m)}</b></p>` : '';
    return paper(w, `<div class="q-k"><span class="q-label">Terimi yaz</span>${catChip(w.c)}</div><p class="qdef">${esc(w.m)}</p>
        ${P.ans ? '' : `<p class="qex" style="margin-top:12px;font-size:1.05rem">${esc(maskTerm(w.ex, w))}</p>`}
        ${plType(P)}
        ${P.ans ? plFb(P, w, P.ok1, P.near ? 'Neredeyse' : '', extra) : `<div class="row" style="margin-top:10px;flex-wrap:wrap">${H ? `<span class="hint">İpucu: <b>${esc(reveal)}</b></span>` : `<span class="hint">${m.length} harf</span>`}<span class="spacer"></span>${H < 3 ? `<button class="btn ghost sm" data-pl="hint">${IC('spark', 'sm')}İpucu ${H + 1}</button>` : ''}<button class="linkbtn" data-pl="idk">Bilmiyorum</button></div>`}`, { enter: !P.ans }) + (P.ans ? plNext(P) : '<p class="kbd">Enter: kontrol et</p>');
  },
  after() { plFocusIn(); },
  act(P, a) {
    const w = P.words[P.i];
    if (a === 'hint' && !P.ans) { P.hints = Math.min(3, P.hints + 1); const v = ($('#plIn') || {}).value || ''; plRender(); const i = $('#plIn'); if (i) i.value = v; return; }
    if ((a === 'check' || a === 'idk') && !P.ans) {
      const v = a === 'idk' ? '' : (($('#plIn') || {}).value || '').trim(); if (a === 'check' && !v) return;
      const res = a === 'idk' ? 'no' : checkTyped(v, w); P.typed = v; P.ans = true; P.ok1 = res !== 'no'; P.near = res === 'near'; P.canOv = res === 'no' && a !== 'idk';
      const xp = P.ok1 ? Math.max(1, 4 - P.hints) : 0; if (P.ok1) P.score += xp;
      plScore(P.ok1, w, { xp }); plRender(); plFx($('#plIn'), P.ok1, xp, PIG[w.c].h);
      if (res === 'ok') { const i0 = P.i; if (S.pref.adv) P.tm.push(setTimeout(() => { if (PL === P && P.i === i0 && P.ans) MODES.write.act(P, 'next'); }, 1000)); }
      return;
    }
    if (a === 'override' && P.canOv) { P.canOv = false; P.ok1 = true; PL.no--; PL.ok++; PL.wrong.delete(w.k); plRender(); return; }
    if (a === 'next' && P.ans) { P.i++; P.ans = false; P.hints = 0; P.typed = ''; P.near = false; P.canOv = false; if (P.i >= P.words.length) { addXP(5); plFinish(MODES.write.summary(P, false)); } else plRender(); }
  },
  key(P, e, inInput) { if (inInput && e.key === 'Enter') { e.preventDefault(); MODES.write.act(P, P.ans ? 'next' : 'check'); } else if (!inInput && P.ans && e.key === 'Enter') MODES.write.act(P, 'next'); },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'Yazdın', big: '%' + acc, sub: 'doğru yazdığın terimler', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['Puan', P.score], ['Süre', fmtTime(Date.now() - PL.t0)]], confetti: !early && acc >= 80 ? 110 : 0 }; }
};

/* ---------- Harf harf ---------- */
function spellTarget(w) { return w.main.replace(/\([^)]*\)/g, '').trim(); }
MODES.spell = {
  tr: 'Harf harf', tag: 'harfleri diz', ic: 'tiles', grp: 'yaz', ill: '<span class="tiles"><i>İ</i><i>m</i><i>g</i></span>',
  elig: w => typeable(w) && /^[A-Za-zÇĞİÖŞÜçğıöşüâîû \-']+$/.test(spellTarget(w)) && spellTarget(w).replace(/[\s\-']/g, '').length <= 16 && spellTarget(w).length >= 3,
  why: 'Tanıma uyan terimi karışık harflerden kur. Yazmaktan daha kolay ama yine üretimdir; özellikle uzun ve yabancı kökenli terimlerin yazımını oturtur.',
  start(P) { P.i = 0; P.c = spellBuild(P.words[0]); },
  progress: P => P.i / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.words.length}</span>`,
  view(P) {
    const w = P.words[P.i], c = P.c;
    return paper(w, `<div class="q-k"><span class="q-label">Harflerle kur</span>${catChip(w.c)}</div><p class="qdef">${esc(w.m)}</p>
      <div class="slots-row" aria-label="Kurulan terim">${c.slots.map(s => s.fixed ? `<span class="slot ${s.ch === ' ' ? 'sp' : 'fixed'}">${s.ch === ' ' ? '' : esc(s.ch)}</span>` : `<span class="slot ${s.got ? 'got' : ''}">${s.got ? esc(s.show) : ''}</span>`).join('')}</div>
      ${c.solved ? plFb(P, w, true, c.miss ? `${c.miss} yanlış dokunuş` : 'Kusursuz') : `<div class="tilebank">${c.tiles.map((t, i) => `<button class="tile ${t.used ? 'used' : ''}" data-pl="tile" data-k="${i}" aria-label="${esc(t.ch)}">${esc(t.show)}</button>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button class="linkbtn" data-pl="sp-hint">Bir harf göster</button><span class="spacer"></span><button class="linkbtn" data-pl="sp-skip">Geç</button></div>`}`, { enter: !c.solved }) + (c.solved ? plNext(P) : '<p class="kbd">Klavyeyle de yazabilirsin</p>');
  },
  act(P, a, t) {
    const c = P.c, w = P.words[P.i];
    if (a === 'tile' && !c.solved) { spellTap(P, +t.dataset.k, t); return; }
    if (a === 'sp-hint' && !c.solved) { const need = c.slots.find(s => !s.fixed && !s.got); const ti = c.tiles.findIndex(x => !x.used && x.ch === need.ch); if (ti >= 0) { c.miss++; spellTap(P, ti, null, true); } return; }
    if (a === 'sp-skip' && !c.solved) { PL.wrong.add(w.k); plScore(false, w); c.slots.forEach(s => { s.got = true; }); c.solved = true; c.miss = 99; plRender(); return; }
    if (a === 'next' && c.solved) { P.i++; if (P.i >= P.words.length) { addXP(5); plFinish(MODES.spell.summary(P, false)); return; } P.c = spellBuild(P.words[P.i]); plRender(); }
  },
  key(P, e, inInput) {
    if (inInput) return; const c = P.c;
    if (c.solved) { if (e.key === 'Enter') MODES.spell.act(P, 'next'); return; }
    if (e.key.length === 1) { const k = lowerTr(e.key); const ti = c.tiles.findIndex(x => !x.used && lowerTr(x.ch) === k); if (ti >= 0) spellTap(P, ti, $(`[data-pl="tile"][data-k="${ti}"]`)); }
  },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Harfler yerinde', big: PL.ok, sub: 'terimi kurdun', rows: [['Kurulan', PL.ok], ['Geçilen', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], confetti: !early && PL.ok >= 6 ? 90 : 0 }; }
};
function spellBuild(w) {
  const target = spellTarget(w), up = ch => ch.toLocaleUpperCase('tr-TR');
  const slots = [...target].map(ch => /[\s\-']/.test(ch) ? { ch, fixed: true } : { ch: lowerTr(ch), show: up(ch), got: false });
  const letters = slots.filter(s => !s.fixed).map(s => s.ch);
  const pool = 'aeıioöuübcçdfgğhjklmnprsştvyz';
  const decoys = []; while (decoys.length < Math.min(3, Math.max(2, Math.round(letters.length / 4)))) { const d = pool[Math.random() * pool.length | 0]; decoys.push(d); }
  const tiles = shuffle([...letters, ...decoys].map(ch => ({ ch, show: up(ch), used: false })));
  return { slots, tiles, solved: false, miss: 0 };
}
function spellTap(P, i, el, hint) {
  const c = P.c, t = c.tiles[i]; if (!t || t.used) return;
  const need = c.slots.find(s => !s.fixed && !s.got);
  if (!need) return;
  if (t.ch === need.ch) {
    t.used = true; need.got = true; haptic('tap'); sfx('tick');
    if (!c.slots.some(s => !s.fixed && !s.got)) {
      c.solved = true; const w = P.words[P.i], xp = c.miss === 0 ? 4 : 2;
      plScore(true, w, { xp }); plRender(); plFx($('.slots-row'), true, xp, PIG[w.c].h); return;
    }
    plRender();
  } else {
    c.miss++; haptic('no'); if (el) { el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad'); }
    if (c.miss === 3) PL.wrong.add(P.words[P.i].k);
  }
}

/* ---------- Tanım tamamla ---------- */
MODES.define = {
  tr: 'Tanım tamamla', tag: 'eksik sözcük', ic: 'gap', grp: 'yaz', ill: '<span class="gapl"><i></i><b></b><i></i></span>',
  elig: w => !!defBlank(w),
  why: 'Tanımın en ayırt edici sözcüğü boş bırakılır. Benzer terimleri birbirinden ayıran şey çoğu zaman tek bir sözcüktür.',
  start(P) { P.i = 0; P.ans = false; P.q = defQ(P.words[0]); },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.words.length}</span>`,
  view(P) {
    const w = P.words[P.i], q = P.q;
    const txt = esc(w.m).replace(esc(q.word), `<span class="chip ${P.ans ? (P.ok1 ? 'ok' : 'no') : ''}" style="font-size:1em;padding:2px 10px">${P.ans ? esc(q.word) : '&nbsp;&nbsp;?&nbsp;&nbsp;'}</span>`);
    return paper(w, `<div class="q-k"><span class="q-label">Tanımı tamamla</span>${catChip(w.c)}</div><div class="bigterm md">${esc(w.t)}</div>
      <p class="qdef" style="margin-top:12px">${txt}</p>
      <div class="opts two">${q.opts.map((o, i) => `<button class="opt ${P.ans ? (o === q.word ? 'ok' : o === P.pick ? 'no' : 'dim') : ''}" data-pl="dopt" data-k="${i}" ${P.ans ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>
      ${P.ans ? `<p class="qex" style="margin-top:14px">${esc(w.ex)}</p>` : ''}`, { enter: !P.ans }) + (P.ans ? plNext(P) : '<p class="kbd">1–4 ile seçebilirsin</p>');
  },
  act(P, a, t) {
    const w = P.words[P.i];
    if (a === 'dopt' && !P.ans) { const o = P.q.opts[+t.dataset.k]; P.pick = o; P.ans = true; P.ok1 = o === P.q.word; plScore(P.ok1, w, { xp: P.ok1 ? 3 : 0 }); plRender(); plFx($(`[data-pl="dopt"][data-k="${t.dataset.k}"]`), P.ok1, P.ok1 ? 3 : 0, PIG[w.c].h); if (P.ok1 && S.pref.adv) { const i0 = P.i; P.tm.push(setTimeout(() => { if (PL === P && P.i === i0 && P.ans) MODES.define.act(P, 'next'); }, 1300)); } return; }
    if (a === 'next' && P.ans) { P.i++; P.ans = false; if (P.i >= P.words.length) { addXP(5); plFinish(MODES.define.summary(P, false)); } else { P.q = defQ(P.words[P.i]); plRender(); } }
  },
  key(P, e) { if (!P.ans && /^[1-4]$/.test(e.key)) { const b = $(`[data-pl="dopt"][data-k="${+e.key - 1}"]`); if (b) b.click(); } else if (P.ans && e.key === 'Enter') MODES.define.act(P, 'next'); },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'Tanımlar tamam', big: '%' + acc, sub: 'doğru tamamladığın tanımlar', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], confetti: !early && acc >= 80 ? 90 : 0 }; }
};
function defBlank(w) {
  const ws = (w.m.match(/[A-Za-zÇĞİÖŞÜçğıöşüâîû]+/g) || []).filter(x => x.length >= 5 && !STOP.has(lowerTr(x)));
  if (!ws.length) return null;
  const termWords = new Set(words(w.t).map(x => x.slice(0, 5)));
  const c = ws.filter(x => !termWords.has(lowerTr(x).slice(0, 5)));
  if (!c.length) return null;
  return c.sort((a, b) => (DF[lowerTr(a)] || 0) - (DF[lowerTr(b)] || 0) || b.length - a.length)[0];
}
function defQ(w) {
  const word = defBlank(w), L = word.length, low = lowerTr(word);
  const pool = []; const seen = new Set([low]);
  [...shuffle(BYCAT[w.c]), ...shuffle(ITEMS)].forEach(x => { if (x.k === w.k || pool.length >= 3) return; (x.m.match(/[A-Za-zÇĞİÖŞÜçğıöşüâîû]+/g) || []).forEach(t => { const tl = lowerTr(t); if (pool.length < 3 && t.length >= 5 && Math.abs(t.length - L) <= 3 && !STOP.has(tl) && !seen.has(tl) && !w.m.includes(t)) { seen.add(tl); pool.push(t); } }); });
  return { word, opts: shuffle([word, ...pool.slice(0, 3)]) };
}

/* ---------- Örnekte bul ---------- */
MODES.example = {
  tr: 'Örnekte bul', tag: 'örnekten terime', ic: 'quote', grp: 'metin', ill: '<span class="quote"></span><span class="lensC"></span>', elig: w => !!w.ex && maskTerm(w.ex, w).length > 12,
  why: 'Sınavda terim sana adıyla gelmez; metindeki bir örnek olarak gelir. Örnekten terimi tanımak, analizdeki ilk adımdır.',
  start(P) { P.i = 0; P.ans = false; P.q = makeQ(P.words[0], 'ex'); },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.words.length}</span>`,
  view(P) { const q = P.q, w = q.it; return paper(w, `${qPromptHTML(q)}${optsHTML(q, P.ans, 'plopt')}${P.ans ? plFb(P, w, P.ok1) : ''}`, { enter: !P.ans }) + (P.ans ? plNext(P) : '<p class="kbd">1–4 ile seçebilirsin</p>'); },
  act(P, a, t) {
    if (a === 'plopt' && !P.ans) { const o = P.q.options[+t.dataset.k]; o.picked = true; P.ans = true; P.ok1 = o.ok; plScore(o.ok, P.q.it, { xp: o.ok ? 3 : 0 }); plRender(); plFx($(`[data-pl="plopt"][data-k="${t.dataset.k}"]`), o.ok, o.ok ? 3 : 0, PIG[P.q.it.c].h); if (o.ok && S.pref.adv) { const i0 = P.i; P.tm.push(setTimeout(() => { if (PL === P && P.i === i0 && P.ans) MODES.example.act(P, 'next'); }, 1200)); } return; }
    if (a === 'next' && P.ans) { P.i++; P.ans = false; if (P.i >= P.words.length) { addXP(5); plFinish(MODES.example.summary(P, false)); } else { P.q = makeQ(P.words[P.i], 'ex'); plRender(); } }
  },
  key(P, e) { if (!P.ans && /^[1-4]$/.test(e.key)) { const b = $(`[data-pl="plopt"][data-k="${+e.key - 1}"]`); if (b) b.click(); } else if (P.ans && e.key === 'Enter') MODES.example.act(P, 'next'); },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'Örnekler çözüldü', big: '%' + acc, sub: 'örnekten doğru tanıdığın terimler', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Sıradaki adım Yakın okuma: terimleri kısa edebî metinlerin içinde bul.', confetti: !early && acc >= 80 ? 100 : 0 }; }
};

/* ---------- Yakın okuma ---------- */
function passagesFor(P) {
  const c = stCatOf(P.sel), keys = new Set(P.words.map(w => w.k));
  let L = PASSAGES.filter(p => keys.has(p.k));
  if (L.length < 4 && c) L = PASSAGES.filter(p => BYK[p.k].c === c);
  if (L.length < 4) L = PASSAGES.slice();
  return shuffle(L);
}
function passageHTML(p) {
  let i = 0;
  return esc(p.txt).replace(/ \/ /g, ' <span class="br"></span>').replace(/⟦(.*?)⟧/g, (m, s) => `<span class="hl" style="animation-delay:${.25 + (i++) * .25}s">${s}</span>`);
}
MODES.lens = {
  tr: 'Yakın okuma', tag: 'metinde terim', ic: 'lens', grp: 'metin', ill: '<span class="text"><i></i><i></i><i></i></span>', free: 1, ownSize: 1,
  why: 'Atölye için yazılmış kısa metinlerde altı çizili kısmı oku, kullanılan tekniği bul. Ardından o tekniğin etkisini anlatan örnek analiz cümlesini gör.',
  start(P) { P.list = passagesFor(P).slice(0, Math.min(12, PASSAGES.length)); P.i = 0; P.ans = false; lensQ(P); },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.list.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.list.length}</span>`,
  view(P) {
    const p = P.list[P.i], it = BYK[p.k];
    return paper(it, `<div class="q-k"><span class="q-label">Altı çizili kısımda hangi teknik var?</span><span class="chip">${P.i + 1}. metin</span></div>
      <p class="passage">${passageHTML(p)}</p>
      <div class="opts two">${P.opts.map((x, i) => `<button class="opt big ${P.ans ? (x.k === p.k ? 'ok' : x.k === P.pick ? 'no' : 'dim') : ''}" data-pl="lopt" data-k="${i}" ${P.ans ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(x.t)}</span></button>`).join('')}</div>
      ${P.ans ? `<div class="fb ${P.ok1 ? 'good' : 'bad'}"><div class="fb-h">${P.ok1 ? `<span class="badge-ok">${IC('check', 'sm')}Doğru</span>` : `<span class="badge-no">${IC('x', 'sm')}Doğrusu: ${esc(it.t)}</span>`}</div><p class="def">${esc(it.m)}</p></div>
        <div class="etki"><b>Örnek analiz cümlesi</b>${esc(cap(p.kanit))} ${esc(p.teknik)} ${esc(p.etki)}</div>` : ''}`, { enter: !P.ans }) + (P.ans ? plNext(P) : '<p class="kbd">1–4 ile seçebilirsin</p>');
  },
  act(P, a, t) {
    const p = P.list[P.i], it = BYK[p.k];
    if (a === 'lopt' && !P.ans) { const x = P.opts[+t.dataset.k]; P.pick = x.k; P.ans = true; P.ok1 = x.k === p.k; plScore(P.ok1, it, { xp: P.ok1 ? 5 : 0 }); plRender(); plFx($(`[data-pl="lopt"][data-k="${t.dataset.k}"]`), P.ok1, P.ok1 ? 5 : 0, PIG[it.c].h); return; }
    if (a === 'next' && P.ans) { P.i++; P.ans = false; if (P.i >= P.list.length) { addXP(8); plFinish(MODES.lens.summary(P, false)); } else { lensQ(P); plRender(); } }
  },
  key(P, e) { if (!P.ans && /^[1-4]$/.test(e.key)) { const b = $(`[data-pl="lopt"][data-k="${+e.key - 1}"]`); if (b) b.click(); } else if (P.ans && e.key === 'Enter') MODES.lens.act(P, 'next'); },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'Yakın okuma tamam', big: '%' + acc, sub: 'metinde doğru bulduğun teknikler', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Şimdi aynı metinlerle Cümle kur: kanıtı, tekniği ve etkiyi sırayla birleştirip tam bir analiz cümlesi yaz.', confetti: !early && acc >= 75 ? 120 : 0 }; }
};
function cap(s) { s = String(s); return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1); }
function lensQ(P) { const p = P.list[P.i]; P.opts = shuffle([BYK[p.k], ...p.dis.map(n => BYK[n]).filter(Boolean)]).slice(0, 4); if (!P.opts.some(x => x.k === p.k)) P.opts[0] = BYK[p.k]; P.opts = shuffle(P.opts); }

/* ---------- Cümle kur ---------- */
MODES.chain = {
  tr: 'Cümle kur', tag: 'kanıt · teknik · etki', ic: 'chain', grp: 'metin', ill: '<span class="slots"><i></i><i></i><i></i><b></b><b></b><b></b></span>', free: 1, ownSize: 1,
  why: 'IB analizinin iskeleti: önce kanıt, sonra teknik, en sonda etki. Parçaları doğru sırayla birleştir; özet ve yanlış teknik tuzaklarına düşme.',
  start(P) { P.list = passagesFor(P).slice(0, 8); P.i = 0; chainBuild(P); P.miss = 0; P.trap = 0; },
  progress: P => (P.i + P.c.got.length / 3) / P.list.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.list.length}</span>`,
  view(P) {
    const p = P.list[P.i], it = BYK[p.k], c = P.c, L = ['Kanıt', 'Teknik', 'Etki'];
    const slots = [0, 1, 2].map(i => `<div class="cslot k${i + 1} ${c.got[i] ? 'got' : ''}" data-l="${L[i]}">${c.got[i] ? esc(c.got[i].txt) : ''}</div>`).join('');
    const done = c.got.length === 3;
    return paper(it, `<div class="q-k"><span class="q-label">Analiz cümlesini kur</span><span class="chip">${esc(it.t)}</span></div>
      <p class="passage" style="font-size:clamp(1.1rem,2.8vw,1.35rem)">${passageHTML(p)}</p>
      <div class="chain">${slots}</div>
      ${done ? `<div class="model"><span class="k1">${esc(cap(p.kanit))}</span> <span class="k2">${esc(p.teknik)}</span> <span class="k3">${esc(p.etki)}</span></div><p class="hint" style="margin-top:8px">Sınavda bu kalıbı kendi kelimelerinle kur: kanıtı göster, tekniği adlandır, etkisini açıkla.</p>`
        : `<p class="hint" style="margin-bottom:8px">Sıradaki parça: <b>${L[c.got.length]}</b></p><div class="chunks">${c.chunks.map((x, i) => `<button class="chunk ${x.used ? 'used' : ''}" data-pl="chunk" data-k="${i}">${esc(x.txt)}</button>`).join('')}</div>`}`, { enter: false }) + (done ? plNext(P) : '');
  },
  act(P, a, t) {
    const p = P.list[P.i], it = BYK[p.k], c = P.c;
    if (a === 'chunk') {
      const x = c.chunks[+t.dataset.k]; if (!x || x.used) return;
      const need = c.got.length;
      if (x.role === need) {
        x.used = true; c.got.push(x); haptic('ok'); sfx('tick');
        if (c.got.length === 3) { const ok = c.err === 0; if (ok) plScore(true, it, { xp: 6 }); else addXP(2); plRender(); plFx($('.chain'), true, ok ? 6 : 2, PIG[it.c].h); }
        else plRender();
      } else {
        c.err++; P.miss++; haptic('no'); sfx('no');
        t.classList.remove('bad'); void t.offsetWidth; t.classList.add('bad');
        if (x.role === 'ozet') { P.trap++; toast('Bu bir özet: metnin ne anlattığını söylüyor, nasıl anlattığını değil.', 3200); }
        else if (x.role === 'yanlis') toast('Bu teknik bu kanıta uymuyor.', 2600);
        else toast(['Önce kanıtı göster.', 'Şimdi tekniği adlandır.', 'Sonda etkiyi açıkla.'][need], 2200);
        if (c.err === 1) { PL.no++; PL.combo = 0; PL.wrong.add(it.k); countAnswer(false); }
      }
      return;
    }
    if (a === 'next' && c.got.length === 3) { P.i++; if (P.i >= P.list.length) { addXP(8); plFinish(MODES.chain.summary(P, false)); } else { chainBuild(P); plRender(); } }
  },
  key(P, e) { if (P.c.got.length === 3 && e.key === 'Enter') MODES.chain.act(P, 'next'); },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Cümleler kuruldu', big: PL.ok, sub: 'hatasız kurduğun analiz cümlesi', rows: [['Hatasız', Math.max(0, PL.ok)], ['Hatalı dokunuş', P.miss], ['Özet tuzağı', P.trap], ['XP', '+' + (S.xp - PL.xp0)]], note: P.trap ? 'Özet tuzağına düştüğün oldu: sınavda “metinde şu olur” cümleleri puan getirmez; “şu teknik şu etkiyi yaratır” cümleleri getirir.' : 'Kanıt → teknik → etki sırası artık elinde. Paper 1 paragraflarını bu zincirle kur.', confetti: !early && P.miss <= 2 ? 120 : 0 }; }
};
function chainBuild(P) {
  const p = P.list[P.i];
  const other = pick(PASSAGES.filter(x => x.k !== p.k && BYK[x.k].c !== 'n'));
  const chunks = [
    { txt: cap(p.kanit), role: 0 }, { txt: p.teknik, role: 1 }, { txt: p.etki, role: 2 },
    { txt: 'Metinde ' + p.ozet, role: 'ozet' }, { txt: other.teknik, role: 'yanlis' }
  ];
  P.c = { chunks: shuffle(chunks), got: [], err: 0 };
}

/* ---------- İkiz terimler ---------- */
MODES.twin = {
  tr: 'İkiz terimler', tag: 'sık karıştırılanlar', ic: 'twin', grp: 'metin', ill: '<span class="venn"><i></i><i></i></span>', free: 1, ownSize: 1,
  why: 'Sınavda en çok puan kaybettiren şey yakın terimleri karıştırmaktır. Bir tanım gelir; iki ikizden hangisine ait olduğunu seç ve farkı gör.',
  start(P) {
    const keys = new Set(P.words.map(w => w.k));
    let L = PAIRS.map((p, i) => i).filter(i => [PAIRS[i][0], PAIRS[i][1]].some(n => { const it = pairItem(n); return it && keys.has(it.k); }));
    if (L.length < 6) L = PAIRS.map((p, i) => i);
    P.list = shuffle(L).slice(0, 14).map(i => ({ i, side: Math.random() < .5 ? 0 : 1 })); P.n = 0; P.ans = false;
  },
  progress: P => (P.n + (P.ans ? 1 : 0)) / P.list.length,
  hud: P => `<span class="hud" id="plHud">${P.n + 1}/${P.list.length}</span>`,
  view(P) {
    const q = P.list[P.n], p = PAIRS[q.i], ok = p[q.side];
    return paper(pairItem(p[0]) || null, `<div class="q-k"><span class="q-label">Bu tanım hangisine ait?</span><span class="chip">${esc(p[0])} · ${esc(p[1])}</span></div>
      <p class="qdef" style="font-size:1.3rem">${esc(p[2 + q.side])}</p>
      <div class="opts two">${[0, 1].map(s => `<button class="opt big ${P.ans ? (s === q.side ? 'ok' : s === P.pick ? 'no' : 'dim') : ''}" data-pl="topt" data-k="${s}" ${P.ans ? 'disabled' : ''}><span class="k">${s + 1}</span><span>${esc(p[s])}</span></button>`).join('')}</div>
      ${P.ans ? `<div class="pair" style="margin-top:16px"><div><b>${esc(p[0])}</b><p>${esc(p[2])}</p></div><div><b>${esc(p[1])}</b><p>${esc(p[3])}</p></div></div>` : ''}`, { enter: !P.ans }) + (P.ans ? plNext(P) : '<p class="kbd">1 ya da 2 · ← → ile de seçebilirsin</p>');
  },
  act(P, a, t) {
    const q = P.list[P.n];
    if (a === 'topt' && !P.ans) { P.pick = +t.dataset.k; P.ans = true; P.ok1 = P.pick === q.side; const it = pairItem(PAIRS[q.i][q.side]); plScore(P.ok1, it, { xp: P.ok1 ? 3 : 0 }); plRender(); plFx($(`[data-pl="topt"][data-k="${t.dataset.k}"]`), P.ok1, P.ok1 ? 3 : 0); return; }
    if (a === 'next' && P.ans) { P.n++; P.ans = false; if (P.n >= P.list.length) { addXP(6); plFinish(MODES.twin.summary(P, false)); } else plRender(); }
  },
  key(P, e) { if (!P.ans && (e.key === '1' || e.key === 'ArrowLeft')) $('[data-pl="topt"][data-k="0"]').click(); else if (!P.ans && (e.key === '2' || e.key === 'ArrowRight')) $('[data-pl="topt"][data-k="1"]').click(); else if (P.ans && e.key === 'Enter') MODES.twin.act(P, 'next'); },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'İkizler ayrıldı', big: '%' + acc, sub: 'doğru ayırt ettiğin çiftler', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Bütün çiftleri yan yana görmek için Sözlük → Karıştırılanlar.', confetti: !early && acc >= 85 ? 110 : 0 }; }
};

/* ---------- Eşleştir ---------- */
MODES.match = {
  tr: 'Eşleştir', tag: 'süreli eşleştirme', ic: 'match', grp: 'oyun', ill: '<span class="pairsA"><i></i><i></i><i></i><i></i></span>', min: 4,
  why: 'Altı terimi tanımlarıyla (ya da İngilizceleriyle) olabildiğince hızlı eşleştir. Yanlış dokunuş 2 saniye ekler. Hız, tanımayı otomatikleştirir.',
  fmtBest: v => (v / 1000).toFixed(1) + ' sn',
  start(P) { P.o = stOpt('match', { kind: 'def' }); P.pool = shuffle(P.words.slice()); P.round = 0; P.rounds = Math.min(3, Math.ceil(P.pool.length / 6)); P.pen = 0; P.tStart = Date.now(); P.miss = 0; matchDeal(P); P.tm.push(setInterval(() => { const c = $('#mClock'); if (c && PL === P) c.textContent = matchClock(P); }, 200)); },
  progress: P => (P.round + (P.L.length - P.left.length) / P.L.length) / P.rounds,
  hud: P => `<span class="hud tnum" id="plHud"><span id="mClock">${matchClock(P)}</span> · ${P.round + 1}/${P.rounds}</span>`,
  view(P) {
    const d = P.o.kind === 'def';
    return `<div class="row" style="justify-content:center;margin-bottom:12px"><div class="seg" role="group" aria-label="Eşleştirme türü"><button data-pl="kind" data-v="def" aria-pressed="${d}">Terim ↔ tanım</button><button data-pl="kind" data-v="en" aria-pressed="${!d}">Terim ↔ İngilizce</button></div></div>
      <div class="mgame"><div class="mcol">${P.L.map((x, i) => `<button class="mtile term ${x.done ? 'ok' : ''} ${P.pk && P.pk.s === 'L' && P.pk.i === i ? 'sel' : ''}" data-pl="mt" data-s="L" data-k="${i}" style="${catStyle(x.it.c)}">${esc(x.it.t)}</button>`).join('')}</div>
      <div class="mcol">${P.R.map((x, i) => `<button class="mtile ${x.done ? 'ok' : ''} ${P.pk && P.pk.s === 'R' && P.pk.i === i ? 'sel' : ''}" data-pl="mt" data-s="R" data-k="${i}" ${d ? '' : 'lang="en"'}>${esc(d ? shortDef(x.it, 84) : x.it.en)}</button>`).join('')}</div></div>
      <p class="kbd">Bir terime, sonra karşılığına dokun</p>`;
  },
  act(P, a, t) {
    if (a === 'kind') { P.o.kind = t.dataset.v; touch(); stLaunch('match', { ids: P.words.map(w => w.k), set: P.sel, label: P.label }); return; }
    if (a !== 'mt') return;
    const s = t.dataset.s, i = +t.dataset.k, arr = s === 'L' ? P.L : P.R; if (arr[i].done) return;
    if (!P.pk || P.pk.s === s) { P.pk = { s, i }; $$('.mtile.sel').forEach(x => x.classList.remove('sel')); t.classList.add('sel'); haptic('tap'); return; }
    const a1 = s === 'L' ? arr[i] : P.L[P.pk.i], b1 = s === 'R' ? arr[i] : P.R[P.pk.i];
    const other = $(`[data-pl="mt"][data-s="${P.pk.s}"][data-k="${P.pk.i}"]`);
    P.pk = null;
    if (a1.it.k === b1.it.k) {
      a1.done = b1.done = true; P.left = P.left.filter(k => k !== a1.it.k);
      plScore(true, a1.it, { xp: 1, count: false }); t.classList.add('ok'); if (other) other.classList.add('ok'); $$('.mtile.sel').forEach(x => x.classList.remove('sel'));
      haptic('ok'); sfx('ok'); splashAt(t, 10, [PIG[a1.it.c].h, '#FFFFFF']); plHud();
      if (!P.left.length) { P.round++; if (P.round >= P.rounds) { P.end = Date.now(); matchEnd(P); } else P.tm.push(setTimeout(() => { if (PL !== P) return; matchDeal(P); plRender(); }, 450)); }
    } else {
      P.pen += 2000; P.miss++; PL.no++; PL.combo = 0; PL.wrong.add(a1.it.k); haptic('no'); sfx('no');
      [t, other].forEach(x => { if (x) { x.classList.remove('sel'); x.classList.add('no'); setTimeout(() => x.classList.remove('no'), 420); } });
    }
  },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Eşleştirme bitti', big: matchClock(P), sub: `${P.rounds} tur · ${P.miss} yanlış dokunuş`, rows: [['Süre', matchClock(P)], ['Ceza', '+' + P.pen / 1000 + ' sn'], ['Doğru', PL.ok], ['XP', '+' + (S.xp - PL.xp0)]], rec: P.isRec, confetti: !early ? 120 : 0 }; }
};
function matchDeal(P) {
  const set = P.pool.slice(P.round * 6, P.round * 6 + 6);
  if (set.length < 3) { const extra = shuffle(P.words.filter(w => !set.includes(w))).slice(0, 6 - set.length); set.push(...extra); }
  P.L = shuffle(set).map(it => ({ it, done: false })); P.R = shuffle(set).map(it => ({ it, done: false })); P.left = set.map(x => x.k); P.pk = null;
}
function matchClock(P) { const ms = (P.end || Date.now()) - P.tStart + P.pen; return (ms / 1000).toFixed(1) + ' sn'; }
function matchEnd(P) { const ms = P.end - P.tStart + P.pen; const b = stBest(P, ms, true, P.o.kind); P.isRec = b.rec; addXP(Math.max(4, 14 - Math.round(ms / 10000))); plFinish(MODES.match.summary(P, false)); }

/* ---------- Hafıza ---------- */
MODES.memory = {
  tr: 'Hafıza', tag: 'ebru kartları', ic: 'grid', grp: 'oyun', ill: '<span class="memo"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>', min: 6, size: 6,
  why: 'Ebru kartlarını çevir, terimi İngilizcesiyle eşleştir. Konum hafızası ile anlam hafızası birlikte çalışır.',
  start(P) {
    const set = shuffle(P.words.slice()).slice(0, 6), c = pick(CAT_KEYS);
    P.cards = shuffle(set.flatMap(it => [{ it, side: 't' }, { it, side: 'e' }])).map((x, i) => Object.assign(x, { i, open: false, done: false, back: CAT_KEYS[(CAT_KEYS.indexOf(c) + i % 3) % CAT_KEYS.length] }));
    P.openI = []; P.moves = 0; P.tStart = Date.now(); P.pairs = 0;
  },
  progress: P => P.pairs / 6,
  hud: P => `<span class="hud tnum" id="plHud">${P.moves} hamle</span>`,
  view(P) {
    return `<div class="memgrid">${P.cards.map(c => `<button class="mem ${c.open || c.done ? 'open' : ''} ${c.done ? 'done' : ''}" data-pl="mem" data-k="${c.i}" aria-label="${c.open || c.done ? esc(c.side === 't' ? c.it.t : c.it.en) : 'Kapalı kart'}">
      <span class="f" data-swatch="${c.back}" data-w="200" data-h="160"></span><span class="b ${c.side === 't' ? 'term' : ''}" ${c.side === 'e' ? 'lang="en"' : ''}>${esc(c.side === 't' ? c.it.t : c.it.en)}</span></button>`).join('')}</div>
      <p class="kbd">İki kart çevir: terim ve İngilizcesi eşleşirse açık kalır</p>`;
  },
  act(P, a, t) {
    if (a !== 'mem' || P.lock) return;
    const c = P.cards[+t.dataset.k]; if (!c || c.open || c.done) return;
    c.open = true; t.classList.add('open'); haptic('tap'); sfx('tick');
    P.openI.push(c.i);
    if (P.openI.length === 2) {
      P.moves++; plHud();
      const [x, y] = P.openI.map(i => P.cards[i]); P.openI = [];
      if (x.it.k === y.it.k && x.side !== y.side) {
        x.done = y.done = true; P.pairs++; plScore(true, x.it, { xp: 2, count: false });
        P.tm.push(setTimeout(() => { $$(`[data-pl="mem"][data-k="${x.i}"],[data-pl="mem"][data-k="${y.i}"]`).forEach(el => el.classList.add('done')); splashAt(t, 12, [PIG[x.it.c].h, '#FFFFFF']); sfx('ok'); plHud(); if (P.pairs === 6) { const b = stBest(P, P.moves, true); P.isRec = b.rec; addXP(Math.max(4, 16 - P.moves)); P.tm.push(setTimeout(() => plFinish(MODES.memory.summary(P, false)), 600)); } }, 350));
      } else {
        P.lock = true;
        P.tm.push(setTimeout(() => { x.open = y.open = false; $$(`[data-pl="mem"][data-k="${x.i}"],[data-pl="mem"][data-k="${y.i}"]`).forEach(el => el.classList.remove('open')); P.lock = false; }, 900));
      }
    }
  },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Bütün çiftler açık', big: P.moves, sub: 'hamlede bitirdin', rows: [['Hamle', P.moves], ['Süre', fmtTime(Date.now() - P.tStart)], ['XP', '+' + (S.xp - PL.xp0)]], rec: P.isRec, confetti: !early ? 120 : 0, noWrongList: 1 }; }
};

/* ---------- Şimşek ---------- */
MODES.eclair = {
  tr: 'Şimşek', tag: '60 saniye', ic: 'bolt', grp: 'oyun', ill: '<span class="tf y">✓</span><span class="boltI"></span><span class="tf n">✕</span>', min: 6, size: 0,
  why: '60 saniye: terim ile tanım eşleşiyor mu? Doğru ya da yanlış de. Üst üste doğrular puanı katlar; hızlı karar, sınavda zaman kazandırır.',
  start(P) { P.score = 0; P.n = 0; P.end = Date.now() + 60000; P.left = 60; eclairPair(P); P.tm.push(setInterval(() => { if (PL !== P || P.done) return; P.left = Math.max(0, Math.ceil((P.end - Date.now()) / 1000)); const b = $('#ecT'); if (b) b.style.transform = `scaleX(${Math.max(0, (P.end - Date.now()) / 60000)})`; plHud(); if (Date.now() >= P.end) eclairEnd(P); }, 200)); },
  hud: P => `<span class="hud tnum" id="plHud">${P.left} sn · ${P.score} puan</span>`,
  view(P) {
    const c = P.c;
    return `<div class="eclair"><div class="timer"><i id="ecT" style="transform:scaleX(${Math.max(0, (P.end - Date.now()) / 60000)})"></i></div>
      <div class="card-q" id="ecCard" style="${catStyle(c.it.c)}"><span class="q-label">Bu tanım bu terime mi ait?</span><div class="ec-t">${esc(c.it.t)}</div><div class="ec-eq">=</div><div class="ec-d">${esc(shortDef(c.shown, 110))}</div></div>
      <div class="decide"><button class="btn no lg" data-pl="ec" data-v="0">${IC('x')}Yanlış</button><button class="btn ok lg" data-pl="ec" data-v="1">${IC('check')}Doğru</button></div>
      <p class="kbd">← yanlış · → doğru</p></div>`;
  },
  act(P, a, t) { if (a === 'ec') eclairAns(P, t.dataset.v === '1', t); },
  key(P, e) { if (e.key === 'ArrowLeft') eclairAns(P, false, $('[data-pl="ec"][data-v="0"]')); else if (e.key === 'ArrowRight') eclairAns(P, true, $('[data-pl="ec"][data-v="1"]')); },
  summary(P, early) { return { title: early ? 'Durdun' : 'Süre doldu', big: P.score, sub: 'puan', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['En uzun seri', PL.maxCombo], ['XP', '+' + (S.xp - PL.xp0)]], rec: P.isRec, confetti: !early && P.score >= 100 ? 140 : 0 }; }
};
function eclairPair(P) {
  const it = pick(P.words), truth = Math.random() < .5;
  const shown = truth ? it : (distractors(it, 1)[0] || pick(ITEMS.filter(x => x.k !== it.k)));
  P.c = { it, shown, truth };
}
function eclairAns(P, said, el) {
  if (P.done || Date.now() >= P.end) return;
  const ok = said === P.c.truth;
  if (ok) { P.score += 10 * Math.min(5, 1 + Math.floor(PL.combo / 3)); }
  plScore(ok, P.c.it, { xp: ok ? 1 : 0 });
  plFx(el || $('#ecCard'), ok, 0, PIG[P.c.it.c].h);
  if (!ok) shake($('#ecCard'));
  P.n++; eclairPair(P); plRender();
}
function eclairEnd(P) { if (P.done) return; const b = stBest(P, P.score, false); P.isRec = b.rec; addXP(Math.round(P.score / 15)); plFinish(MODES.eclair.summary(P, false)); }

/* ---------- Ebru yağmuru ---------- */
MODES.rain = {
  tr: 'Ebru yağmuru', tag: 'damlayı yakala', ic: 'rain', grp: 'oyun', ill: '<span class="drops"><i></i><i></i><i></i></span>', min: 6, size: 0,
  why: 'Tanıma uyan terimi taşıyan boya damlasını yere düşmeden yakala. Yakaladığın her damla aşağıdaki teknede açılır; oyun bitince kendi ebrun kalır.',
  start(P) { P.score = 0; P.lives = 3; P.wave = 0; P.speed = 1; P.drops = []; P.caught = 0; },
  hud: P => `<span class="hud tnum" id="plHud"><span class="lives">${[0, 1, 2].map(i => `<i class="${i >= P.lives ? 'lost' : ''}"></i>`).join('')}</span> · ${P.score}</span>`,
  view(P) {
    return `<div class="rain" id="rainBox"><div class="rain-q" id="rainQ"><small>Bu tanımın terimini yakala</small><span id="rainQt"></span></div><div class="rain-tekne"><canvas id="rainCv"></canvas></div></div>
      <p class="kbd">Doğru damlaya dokun · yanlış damla bir hak götürür · doğru damlayı kaçırmak da</p>`;
  },
  after(P) {
    const box = $('#rainBox'), cv = $('#rainCv'); if (!box || !cv) return;
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    P.tr = new EB.Tray(1000, Math.round(1000 * r.height / r.width), EB.PAL[EB.phaseOf()].bg); P.tr.res = 7; P.tr.cap = 900; P.trK = cv.width / 1000; P.trCtx = cv.getContext('2d');
    P.tr.render(P.trCtx, P.trK, { veinColor: EB.PAL[EB.phaseOf()].vein });
    rainWave(P);
    let last = performance.now();
    const loop = now => {
      if (PL !== P || P.done) return;
      const dt = clamp(now - last, 0, 48) / 16.67; last = now;
      const H = box.clientHeight, floor = H * .78;
      for (const d of P.drops) {
        if (d.gone) continue;
        d.y += d.v * dt * P.speed;
        d.el.style.transform = `translate(${d.x}px,${d.y}px)`;
        if (d.y > floor - d.h) {
          d.gone = true; d.el.classList.add('miss');
          if (d.ok) { rainLose(P, 'Doğru damla kaçtı'); return P.raf = requestAnimationFrame(loop); }
        }
      }
      P.raf = requestAnimationFrame(loop);
    };
    P.raf = requestAnimationFrame(loop);
    box.addEventListener('pointerdown', e => { const d = e.target.closest('.rdrop'); if (!d) return; e.preventDefault(); rainTap(P, +d.dataset.k); });
  },
  summary(P, early) { return { title: early ? 'Durdun' : 'Yağmur dindi', big: P.score, sub: `${P.caught} damla yakaladın`, rows: [['Yakalanan', P.caught], ['Dalga', P.wave], ['XP', '+' + (S.xp - PL.xp0)]], rec: P.isRec, confetti: !early && P.caught >= 8 ? 130 : 0, extra: P.img ? `<section class="card" style="margin-top:14px;text-align:center"><div class="card-h"><h2>Senin ebrun</h2><span class="faint" style="font-weight:800">${P.caught} damla</span></div><img src="${P.img}" alt="Oyunda yakaladığın damlalarla oluşan ebru" style="width:100%;border-radius:16px"></section>` : '' }; }
};
function rainWave(P) {
  const box = $('#rainBox'); if (!box || PL !== P) return;
  P.drops.forEach(d => { if (d.el && d.el.isConnected) d.el.remove(); }); P.drops = [];
  const it = pick(P.words), ds = distractors(it, P.wave < 3 || box.clientWidth < 560 ? 2 : 3);
  P.cur = it; P.wave++; P.speed = Math.min(2.4, 1 + P.wave * .07);
  $('#rainQt').textContent = shortDef(it, 120);
  const W = box.clientWidth, set = shuffle([it, ...ds]), lanes = set.length, laneW = W / lanes, q = $('#rainQ').getBoundingClientRect(), top0 = q.bottom - box.getBoundingClientRect().top + 8;
  set.forEach((x, i) => {
    const el = document.createElement('button'); el.className = 'rdrop'; el.dataset.k = i; el.textContent = x.main; el.style.setProperty('--dc', PIG[x.c].h);
    el.setAttribute('aria-label', x.main);
    box.appendChild(el);
    const w = el.offsetWidth, h = el.offsetHeight;
    const d = { it: x, ok: x.k === it.k, el, x: clamp(laneW * i + (laneW - w) / 2 + (Math.random() - .5) * laneW * .2, 6, W - w - 6), y: top0 - 30 - Math.random() * 90, v: .55 + Math.random() * .25, w, h, gone: false };
    el.style.transform = `translate(${d.x}px,${d.y}px)`;
    P.drops.push(d);
  });
}
function rainTap(P, i) {
  const d = P.drops[i]; if (!d || d.gone || P.done) return;
  if (d.ok) {
    d.gone = true; d.el.style.setProperty('--tf', `translate(${d.x}px,${d.y}px)`); d.el.classList.add('pop');
    P.caught++; const pts = 10 + Math.round(P.speed * 5); P.score += pts; plScore(true, d.it, { xp: 2 }); plFx(d.el, true, 2, PIG[d.it.c].h); sfx('drop');
    const tr = P.tr; if (tr) { const x = 60 + Math.random() * 880, y = tr.h * (.25 + Math.random() * .5); tr.drop(x, y, 26 + Math.random() * 30, PIG[d.it.c].h, 60); if (P.caught % 4 === 0) tr.vline(80 + Math.random() * 840, (Math.random() < .5 ? -1 : 1) * tr.h * .2, 9); tr.render(P.trCtx, P.trK, { veinColor: EB.PAL[EB.phaseOf()].vein }); }
    plHud();
    P.tm.push(setTimeout(() => { if (PL === P && !P.done) rainWave(P); }, 380));
  } else {
    d.gone = true; d.el.classList.add('miss'); shake(d.el); rainLose(P, 'Yanlış damla');
  }
}
function rainLose(P, why) {
  P.lives--; plScore(false, P.cur, {}); haptic('no'); sfx('no'); plHud();
  if (P.lives <= 0) { rainEnd(P); return; }
  toast(why + ' · doğrusu: ' + P.cur.main, 2000);
  P.tm.push(setTimeout(() => { if (PL === P && !P.done) rainWave(P); }, 700));
}
function rainEnd(P) {
  if (P.done) return;
  cancelAnimationFrame(P.raf);
  try { const cv = $('#rainCv'); if (cv && P.caught) P.img = cv.toDataURL('image/jpeg', .85); } catch (e) {}
  const b = stBest(P, P.score, false); P.isRec = b.rec; addXP(Math.round(P.score / 12));
  plFinish(MODES.rain.summary(P, false));
}

/* ---------- Raflara diz ---------- */
MODES.shelf = {
  tr: 'Raflara diz', tag: 'hangi boya?', ic: 'shelf', grp: 'oyun', ill: '<span class="jars3"><i></i><i></i><i></i><b></b></span>', min: 4,
  why: 'Terimi doğru boya kavanozuna koy. Terimin hangi alana ait olduğunu bilmek, analizde onu doğru bağlamda kullanmanı sağlar.',
  start(P) { P.i = 0; P.ans = false; shelfQ(P); },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.words.length}</span>`,
  view(P) {
    const w = P.words[P.i];
    return `<div class="paper sortq ${P.ans ? '' : 'enter'}" id="plPaper"><span class="strip" style="background:linear-gradient(90deg,#2A44B8,#0B97A4,#0F8E57,#E09E06,#DD3A2A,#D1337C)"></span>
      <span class="q-label">Hangi boyaya ait?</span><div class="bigterm">${esc(w.t)}</div><div class="en-tag" lang="en">${esc(w.en)}</div>
      ${P.ans ? `<p class="qdef" style="margin-top:12px;font-size:1.05rem">${esc(w.m)}</p>` : ''}</div>
      <div class="shelves3">${P.opts.map((c, i) => `<button class="shelfbtn ${P.ans ? (c === w.c ? 'ok' : c === P.pick ? 'no' : '') : ''}" data-pl="sh" data-k="${i}" style="${catStyle(c)}" ${P.ans ? 'disabled' : ''}><span class="sw" data-swatch="${c}" data-w="92" data-h="92"></span><span><small class="faint" style="display:block;font-size:.75rem;font-weight:800">${i + 1} · ${esc(PIG[c].n)}</small>${esc(CATS[c])}</span></button>`).join('')}</div>
      ${P.ans ? plNext(P) : '<p class="kbd">1–4 ile seçebilirsin</p>'}`;
  },
  act(P, a, t) {
    const w = P.words[P.i];
    if (a === 'sh' && !P.ans) { const c = P.opts[+t.dataset.k]; P.pick = c; P.ans = true; P.ok1 = c === w.c; plScore(P.ok1, w, { xp: P.ok1 ? 2 : 0 }); plRender(); plFx($(`[data-pl="sh"][data-k="${t.dataset.k}"]`), P.ok1, P.ok1 ? 2 : 0, PIG[w.c].h); if (P.ok1 && S.pref.adv) { const i0 = P.i; P.tm.push(setTimeout(() => { if (PL === P && P.i === i0 && P.ans) MODES.shelf.act(P, 'next'); }, 1100)); } return; }
    if (a === 'next' && P.ans) { P.i++; P.ans = false; if (P.i >= P.words.length) { addXP(5); plFinish(MODES.shelf.summary(P, false)); } else { shelfQ(P); plRender(); } }
  },
  key(P, e) { if (!P.ans && /^[1-4]$/.test(e.key)) { const b = $(`[data-pl="sh"][data-k="${+e.key - 1}"]`); if (b) b.click(); } else if (P.ans && e.key === 'Enter') MODES.shelf.act(P, 'next'); },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'Raflar düzenli', big: '%' + acc, sub: 'doğru rafa koyduğun terimler', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], confetti: !early && acc >= 80 ? 100 : 0 }; }
};
function shelfQ(P) { const w = P.words[P.i]; const sh = SHELVES.find(s => s.cats.includes(w.c)); const near = shuffle(sh.cats.filter(c => c !== w.c)).slice(0, 2); const far = shuffle(CAT_KEYS.filter(c => c !== w.c && !near.includes(c))).slice(0, 3 - near.length); P.opts = shuffle([w.c, ...near, ...far]); }

/* ---------- Test ---------- */
MODES.test = {
  tr: 'Test', tag: 'geri bildirimsiz', ic: 'test', grp: 'sina', ill: '<span class="checks"><i></i><i></i><i></i></span>', min: 4,
  why: 'Sınav provası: cevapların sonuna kadar gösterilmez. Sonunda puanını ve cevap anahtarını görürsün.',
  start(P) {
    P.qs = P.words.map((it, i) => { const t = ['def', 'term', it.ex ? 'ex' : 'term', typeable(it) ? 'type' : 'term'][i % 4]; return makeQ(it, t); });
    P.qs = shuffle(P.qs); P.i = 0; P.res = [];
  },
  progress: P => P.i / P.qs.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.qs.length}</span>`,
  view(P) {
    const q = P.qs[P.i], it = q.it;
    const body = q.type === 'type' ? plType({ ans: false }) : `<div class="opts">${q.options.map((o, i) => `<button class="opt ${q.type !== 'def' ? 'big' : ''}" data-pl="tq" data-k="${i}"><span class="k">${i + 1}</span><span>${esc(optText(q, o.x))}</span></button>`).join('')}</div>`;
    return paper(it, qPromptHTML(q) + body) + `<div class="sess-actions"><button class="linkbtn" data-pl="tskip">Boş bırak</button></div><p class="kbd">${q.type === 'type' ? 'Enter: cevapla' : '1–4 ile seçebilirsin'} · cevaplar sonda</p>`;
  },
  after() { plFocusIn(); },
  act(P, a, t) {
    const q = P.qs[P.i]; if (!q) return;
    let ok = false, given = '';
    if (a === 'tq') { const o = q.options[+t.dataset.k]; ok = o.ok; given = optText(q, o.x); }
    else if (a === 'check') { given = (($('#plIn') || {}).value || '').trim(); if (!given) return; ok = checkTyped(given, q.it) !== 'no'; }
    else if (a === 'tskip') { given = '—'; ok = false; }
    else return;
    P.res.push({ q, ok, given }); if (ok) { PL.ok++; } else { PL.no++; PL.wrong.add(q.it.k); }
    countAnswer(ok); haptic('tap'); sfx('tick');
    P.i++;
    if (P.i >= P.qs.length) { const pct = Math.round(PL.ok / P.qs.length * 100); addXP(PL.ok * 2 + 5); const b = stBest(P, pct, false); P.isRec = b.rec; plFinish(MODES.test.summary(P, false)); }
    else plRender();
  },
  key(P, e, inInput) { if (inInput && e.key === 'Enter') { e.preventDefault(); MODES.test.act(P, 'check'); } else if (!inInput && /^[1-4]$/.test(e.key)) { const b = $(`[data-pl="tq"][data-k="${+e.key - 1}"]`); if (b) b.click(); } },
  summary(P, early) {
    const n = P.res.length, pct = n ? Math.round(PL.ok / n * 100) : 0;
    const key = `<section class="card" style="margin-top:14px"><div class="card-h"><h2>Cevap anahtarı</h2><span class="faint" style="font-weight:800">${PL.ok}/${n}</span></div><div class="wlist">${P.res.map((r, i) => `<div class="wl" style="${catStyle(r.q.it.c)};${r.ok ? '' : 'background:var(--nar-soft)'}"><b>${i + 1}. ${r.ok ? '✓' : '✕'} ${esc(r.q.it.t)}</b><span>${r.ok ? esc(shortDef(r.q.it, 90)) : `Senin cevabın: ${esc(trunc(r.given, 70))}`}</span></div>`).join('')}</div></section>`;
    return { title: early ? 'Test yarıda kaldı' : pct >= 85 ? 'Sınava hazırsın' : pct >= 60 ? 'İyi bir prova' : 'Daha çalışmalı', big: '%' + pct, sub: `${n} sorudan ${PL.ok} doğru`, rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['Süre', fmtTime(Date.now() - PL.t0)]], rec: P.isRec, extra: key, noWrongList: 1, confetti: !early && pct >= 85 ? 150 : 0 };
  }
};

/* ---------- Maraton ---------- */
MODES.exam = {
  tr: 'Maraton', tag: 'bir alanı bitir', ic: 'flag', grp: 'sina', ill: '<span class="flagI"><i></i><b></b></span>', free: 1,
  why: 'Seçtiğin alanın bütün terimleri altışar altışar öğretilir ve hemen sınanır; yanlışlar doğru bilinene kadar geri gelir. Her üç partide karma tekrar, sonda final. Kaldığın yerden devam eder.',
  start() {}, view() { return ''; }
};
function examOpen(sel) {
  const E = S.exam;
  if (E && E.pos < E.keys.length) {
    openSheet(`<div class="sheet-h"><h2>Maraton</h2><button class="iconbtn" data-close aria-label="Kapat">${IC('x')}</button></div>
      <p class="muted">Yarım kalan maratonun var: <b>${esc(E.name)}</b> · ${E.pos}/${E.keys.length} terim.</p>
      <div class="sess-actions" style="justify-content:flex-start"><button class="btn lg" data-exgo="resume">${IC('flag')}Devam et</button><button class="btn ghost lg" data-exgo="new">Yeni maraton</button></div>`);
    return;
  }
  examPick(sel);
}
function examPick(sel) {
  const c = stCatOf(sel);
  openSheet(`<div class="sheet-h"><h2>Maraton</h2><button class="iconbtn" data-close aria-label="Kapat">${IC('x')}</button></div>
    <p class="muted" style="margin-bottom:14px">${esc(MODES.exam.why)}</p>
    <div class="filters">${CAT_KEYS.map(k => `<button class="fchip" data-exnew="${k}" aria-pressed="${k === c}" style="${catStyle(k)}"><i class="dot"></i>${esc(CATS[k])} <span class="cnt">${BYCAT[k].length}</span></button>`).join('')}<button class="fchip" data-exnew="all">Bütün terimler <span class="cnt">${ITEMS.length}</span></button></div>`);
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-exgo],[data-exnew]'); if (!t) return;
  if (t.dataset.exgo === 'resume') { closeSheet(); examRun(); return; }
  if (t.dataset.exgo === 'new') { examPick(stSet()); return; }
  const k = t.dataset.exnew, list = k === 'all' ? ITEMS : BYCAT[k];
  S.exam = { name: k === 'all' ? 'Bütün terimler' : CATS[k], src: k, keys: list.map(x => x.k), pos: 0, batches: 0, fin: null }; touch();
  closeSheet(); examRun();
});
function examRun() {
  const E = S.exam; if (!E) return;
  plStop();
  PL = { k: 'exam', M: EXRUN, sel: stSet(), over: {}, words: E.keys.map(k => BYK[k]).filter(Boolean), label: 'Maraton · ' + E.name, xp0: S.xp, t0: Date.now(), ok: 0, no: 0, combo: 0, maxCombo: 0, wrong: new Set(), done: false, from: 'studio', tm: [] };
  EXRUN.start(PL); show('play');
}
const EXRUN = {
  tr: 'Maraton', ic: 'flag',
  start(P) { exBatch(P); },
  progress: P => { const E = S.exam; return E.fin ? (E.keys.length + P.fi / P.fq.length * 6) / (E.keys.length + 6) : E.pos / (E.keys.length + 6); },
  hud: P => { const E = S.exam; return `<span class="hud" id="plHud">${E.fin ? 'Final' : `${E.pos}/${E.keys.length}`}</span>`; },
  view(P) {
    if (P.ph === 'teach') {
      const w = P.batch[P.ti];
      return paper(w, `<div class="q-k"><span class="q-label">Öğren · ${P.ti + 1}/${P.batch.length}</span>${catChip(w.c)}</div><div class="bigterm">${esc(w.t)}</div><div class="en-tag" lang="en">${esc(w.en)}</div><p class="qdef" style="margin-top:12px">${esc(w.m)}</p><p class="qex" style="margin-top:12px">${esc(w.ex)}</p>`) + `<div class="sess-actions"><button class="btn lg" data-pl="ex-ok" id="plNext">${P.ti + 1 < P.batch.length ? 'Anladım' : 'Kontrole geç'}${IC('arrow')}</button></div><p class="kbd">Enter: devam</p>`;
    }
    const q = P.q, it = q.it;
    return paper(it, `<p class="hint" style="margin-bottom:8px">${P.ph === 'final' ? `Final · ${P.fi + 1}/${P.fq.length}` : P.ph === 'mix' ? 'Karma tekrar' : `Kontrol · ${P.batch.length - P.cq.length + 1}/${P.batch.length}`}</p>${qPromptHTML(q)}${optsHTML(q, P.ans, 'plopt')}${P.ans ? plFb(P, it, P.ok1) : ''}`, { enter: !P.ans }) + (P.ans ? plNext(P) : '<p class="kbd">1–4 ile seçebilirsin</p>');
  },
  after() { plFocusIn(); },
  act(P, a, t) {
    const E = S.exam;
    if (a === 'ex-ok' && P.ph === 'teach') { P.ti++; if (P.ti >= P.batch.length) { P.ph = 'check'; P.cq = shuffle(P.batch); P.q = makeQ(P.cq[0], 'term'); P.ans = false; } plRender(); return; }
    if (a === 'plopt' && !P.ans) {
      const o = P.q.options[+t.dataset.k]; o.picked = true; P.ans = true; P.ok1 = o.ok; const it = P.q.it;
      plScore(o.ok, it, { xp: o.ok ? 2 : 0 }); plRender(); plFx($(`[data-pl="plopt"][data-k="${t.dataset.k}"]`), o.ok, o.ok ? 2 : 0, PIG[it.c].h);
      if (P.ph === 'final') P.fres.push(o.ok);
      return;
    }
    if (a === 'next' && P.ans) {
      const it = P.q.it;
      if (P.ph === 'check' || P.ph === 'mix') {
        P.cq.shift(); if (!P.ok1) P.cq.push(it);
        if (P.cq.length) { P.q = makeQ(P.cq[0], P.ph === 'mix' ? pick(['def', 'term', 'ex']) : 'term'); P.ans = false; plRender(); return; }
        if (P.ph === 'check') {
          P.batch.forEach(w => { if (status(w.k) === 'new') learnTerm(w.k, !PL.wrong.has(w.k)); });
          E.pos += P.batch.length; E.batches++; addXP(6); touch();
          if (E.batches % 3 === 0 && E.pos > 6) { P.ph = 'mix'; P.cq = shuffle(E.keys.slice(0, E.pos).map(k => BYK[k])).slice(0, 6); P.q = makeQ(P.cq[0], 'def'); P.ans = false; toast('Karma tekrar: önceki partilerden 6 terim'); plRender(); return; }
        }
        exBatch(P); plRender(); return;
      }
      if (P.ph === 'final') { P.fi++; if (P.fi >= P.fq.length) { exEnd(P); return; } P.q = P.fq[P.fi]; P.ans = false; plRender(); }
    }
  },
  key(P, e) {
    if (P.ph === 'teach' && e.key === 'Enter') { EXRUN.act(P, 'ex-ok'); return; }
    if (!P.ans && /^[1-4]$/.test(e.key)) { const b = $(`[data-pl="plopt"][data-k="${+e.key - 1}"]`); if (b) b.click(); } else if (P.ans && e.key === 'Enter') EXRUN.act(P, 'next');
  },
  summary(P, early) { const E = S.exam || {}; return { title: 'Ara verdin', sub: `${E.pos || 0}/${(E.keys || []).length} terim · kaldığın yerden devam edebilirsin`, big: (E.keys ? Math.round(E.pos / E.keys.length * 100) : 0) + '%', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]] }; }
};
function exBatch(P) {
  const E = S.exam;
  if (E.pos >= E.keys.length) {
    P.ph = 'final'; E.fin = 1;
    P.fq = shuffle(E.keys.map(k => BYK[k])).slice(0, Math.min(20, E.keys.length)).map((it, i) => makeQ(it, ['def', 'term', it.ex ? 'ex' : 'term'][i % 3]));
    P.fi = 0; P.fres = []; P.q = P.fq[0]; P.ans = false; return;
  }
  P.batch = E.keys.slice(E.pos, E.pos + 6).map(k => BYK[k]); P.ti = 0; P.ph = 'teach';
}
function exEnd(P) {
  const E = S.exam, n = P.fres.length, ok = P.fres.filter(Boolean).length, pct = n ? Math.round(ok / n * 100) : 0;
  addXP(15 + ok * 2); S.exam = null; touch();
  P.M = Object.assign({}, EXRUN, { summary: () => ({ title: pct >= 85 ? 'Maraton tamam' : 'Bitiş çizgisi', big: '%' + pct, sub: `final: ${n} sorudan ${ok} doğru`, rows: [['Alan', E.name], ['Terim', E.keys.length], ['Toplam doğru', PL.ok], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Maratonda öğrendiğin terimler aralıklı tekrar listende; yarından itibaren tek tek geri gelecekler.', confetti: 180 }) });
  plFinish(P.M.summary());
}

/* ---------- Bağ kur ---------- */
const ATELIER_PROMPTS = [
  'Okuduğun bir eserden (ör. Paper 2 kitaplarından) bu terime örnek olacak bir sahne yaz.',
  'Bu terimi kendi uydurduğun tek bir cümleyle göster.',
  'Bu terimi aklında tutmak için bir çağrışım ya da hafıza ipucu bul.',
  'Bu terimi en çok karıştırdığın terimden ayıran farkı tek cümleyle yaz.',
  'Bu tekniğin okurda yarattığı etkiyi bir sınav cümlesiyle anlat.'
];
MODES.atelier = {
  tr: 'Bağ kur', tag: 'kendi örneğin', ic: 'pen', grp: 'sina', ill: '<span class="penI"></span>', size: 8,
  why: 'Terime kendi örneğini, çağrışımını ya da sınav cümleni yaz. Kendi ürettiğin bağlantı en kalıcı olandır; notun Sözlük ve kartlarda seninle kalır.',
  start(P) { P.i = 0; P.saved = 0; P.words.sort((a, b) => (isHard(b.k) - isHard(a.k)) || (!!S.notes[a.k] - !!S.notes[b.k])); },
  progress: P => P.i / P.words.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.words.length}</span>`,
  view(P) {
    const w = P.words[P.i], pr = ATELIER_PROMPTS[(P.i + w.i) % ATELIER_PROMPTS.length];
    return paper(w, `<div class="q-k"><span class="q-label">Bağ kur</span>${catChip(w.c)}</div><div class="bigterm md">${esc(w.t)}</div><p class="qdef" style="margin-top:8px;font-size:1.05rem">${esc(w.m)}</p><p class="qex" style="margin-top:10px;font-size:1.02rem">${esc(w.ex)}</p>
      <div class="notebox" style="margin-top:14px"><label class="q-label" for="atIn">${esc(pr)}</label><textarea id="atIn" placeholder="Kendi cümlen…">${esc(S.notes[w.k] || '')}</textarea></div>`) +
      `<div class="sess-actions"><button class="btn ghost" data-pl="at-skip">Geç</button><button class="btn lg" data-pl="at-save">${IC('check')}Kaydet ve devam</button></div><p class="kbd">Ctrl + Enter: kaydet</p>`;
  },
  after(P) { const t = $('#atIn'); if (t) { setTimeout(() => t.focus({ preventScroll: true }), 60); t.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); MODES.atelier.act(P, 'at-save'); } }); } },
  act(P, a) {
    const w = P.words[P.i];
    if (a === 'at-save') {
      const v = (($('#atIn') || {}).value || '').trim();
      if (v) { const fresh = !S.notes[w.k]; S.notes[w.k] = v; P.saved++; plScore(true, w, { xp: fresh ? 5 : 2, count: false }); plFx($('#atIn'), true, fresh ? 5 : 2, PIG[w.c].h); }
      else delete S.notes[w.k];
      touch();
    }
    if (a === 'at-save' || a === 'at-skip') { P.tm.push(setTimeout(() => { if (PL !== P) return; P.i++; if (P.i >= P.words.length) plFinish(MODES.atelier.summary(P, false)); else plRender(); }, a === 'at-save' ? 380 : 0)); }
  },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Bağlar kuruldu', big: P.saved, sub: 'not kaydettin', rows: [['Not', P.saved], ['Toplam notun', Object.keys(S.notes).length], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Notların Sözlük\'te “Notlu” filtresinde ve kartların arka yüzünde.', confetti: !early && P.saved >= 4 ? 90 : 0, noWrongList: 1 }; }
};

/* Stüdyo'da seçenek düğmeleri data-pl ile çalışsın */
function optsHTML(q, ans, act) {
  const big = q.type !== 'def';
  const attr = act === 'sopt' ? i => `data-sopt="${i}"` : i => `data-pl="${act}" data-k="${i}"`;
  return `<div class="opts">${q.options.map((o, i) => `<button class="opt ${big ? 'big' : ''} ${ans ? (o.ok ? 'ok' : o.picked ? 'no' : 'dim') : ''}" ${attr(i)} ${ans ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(optText(q, o.x))}</span></button>`).join('')}</div>`;
}

/* =====================================================================
   STÜDYO SAYFASI
   ===================================================================== */
function miniBar(c) {
  const seg = (k, n) => n ? `<i class="s-${k}" style="flex:${n}"></i>` : '';
  return `<div class="sbar" aria-hidden="true">${seg('master', c.master)}${seg('known', c.known)}${seg('learn', c.learn)}${seg('new', c.new)}</div>`;
}
function modeCard(k, compact) {
  const M = MODES[k], sel = stSet();
  const bestKey = k === 'match' ? 'match-' + ((S.mo.match || {}).kind || 'def') : k;
  const best = S.best[bestKey + ':' + stKey(sel)];
  return `<button class="mcard g-${M.grp}" data-stmode="${k}">
    <span class="mill" aria-hidden="true">${M.ill}</span>
    <span class="mname">${IC(M.ic, 'sm')}<b>${M.tr}</b></span><span class="mtag">${esc(M.tag)}</span>
    ${compact ? '' : `<span class="mwhy">${M.why}</span>`}
    ${!compact && best !== undefined ? `<span class="mfoot"><span class="mbest">${IC('trophy', 'sm')}${M.fmtBest ? M.fmtBest(best) : k === 'test' ? '%' + best : best}</span></span>` : ''}
  </button>`;
}
let SPOT = 0, ST_OPEN = false;
function stSpotlight(root) {
  clearInterval(SPOT); if (motionLevel() < 2 || !root) return;
  const tick = () => {
    if (!root.isConnected || root.hidden || document.visibilityState !== 'visible') return;
    const cards = $$('.mcard', root).filter(c => { const r = c.getBoundingClientRect(); return r.bottom > 60 && r.top < innerHeight - 40 && r.right > 20 && r.left < innerWidth - 20; });
    $$('.mcard.live', root).forEach(c => c.classList.remove('live'));
    if (cards.length) pick(cards).classList.add('live');
  };
  SPOT = setInterval(tick, 3200); setTimeout(tick, 600);
}
function stRoute(c) {
  const stops = [['cards', 'Kartlar', 'ayıkla'], ['learn', 'Öğren', 'tanı · seç · yaz'], ['example', 'Örnekte bul', 'tanı'], ['lens', 'Yakın okuma', 'metinde bul'], ['chain', 'Cümle kur', 'analiz et']];
  const rec = !c.total ? '' : c.new === c.total ? 'cards' : c.new > c.total * .3 ? 'learn' : c.solid < c.total * .5 ? 'example' : 'lens';
  return `<section class="route" aria-label="Önerilen çalışma sırası">
    <h2>Önerilen yol</h2><p>Yeni bir seti bu sırayla çalış; tekrarlar ise zamanı gelince kendiliğinden gelir.</p>
    <ol class="rline">${stops.map(([k, t, s]) => `<li class="${k === rec ? 'rec' : ''}"><button data-stmode="${k}"><i class="rdot" aria-hidden="true"></i><b>${t}</b><small>${k === rec ? 'şimdi bu' : s}</small></button></li>`).join('')}
      <li><button data-run="review"><i class="rdot" aria-hidden="true" style="border-color:var(--lac)"></i><b>Tekrar</b><small>1 gün sonra</small></button></li></ol>
  </section>`;
}
RENDER.studio = () => {
  const sel = stSet(), base = stBase(sel), c = counts(base), cat = stCatOf(sel), due = dueList().length;
  const srcChips = stSrcList().map(([k, t]) => {
    const n = stBase({ src: k }).length, cc = /^c:/.test(k) ? k.slice(2) : null;
    if (!n && sel.src !== k) return '';
    return `<button class="fchip" data-stsrc="${k}" aria-pressed="${sel.src === k}" ${cc ? `style="${catStyle(cc)}"` : ''}>${cc ? '<i class="dot"></i>' : ''}${esc(t)} <span class="tnum cnt">${n}</span></button>`;
  }).join('');
  const sizes = [[10, '10'], [20, '20'], [40, '40'], [0, 'Hepsi']].map(([n, t]) => `<button data-stsize="${n}" aria-pressed="${sel.size === n}">${t}</button>`).join('');
  const orders = [['smart', 'Akıllı'], ['book', 'Liste'], ['rand', 'Karışık']].map(([k, t]) => `<button data-storder="${k}" aria-pressed="${sel.order === k}">${t}</button>`).join('');
  const take = sel.size ? Math.min(base.length, sel.size) : base.length;
  const v = $('#v-studio');
  v.innerHTML = `
    <div class="page-h"><h1>Stüdyo</h1><span class="sub">${Object.keys(MODES).filter(k => MODES[k].grp !== 'p2').length} çalışma modu</span></div>
    <p class="lead">Aynı terimleri farklı yollardan çalış. Her mod hafızanın başka bir kapısını çalar; kartın üstünde neden işe yaradığı yazıyor.</p>
    <details class="card st-set" id="stSetBox" ${ST_OPEN ? 'open' : ''} style="${cat ? catStyle(cat) : ''}">
      <summary aria-label="Çalışma setini değiştir">
        <span class="st-cur"><span class="st-k">Çalışma seti</span><b>${esc(stLabel(sel))}</b><small class="tnum">${take} terimlik oturum · ${sel.order === 'smart' ? 'akıllı sıra' : sel.order === 'book' ? 'liste sırası' : 'karışık'} · sette ${c.new} yeni, ${c.learn} öğreniliyor, ${c.solid} kalıcı</small>${miniBar(c)}</span>
        <span class="btn sm ghost st-chg">${ST_OPEN ? 'Kapat' : 'Değiştir'}</span>
      </summary>
      <div class="st-body">
        <div class="filters scrollx" role="group" aria-label="Kaynak">${srcChips}</div>
        <div class="st-row"><div class="st-lab">Terim sayısı <div class="seg" role="group">${sizes}</div></div><div class="st-lab">Sıra <div class="seg" role="group">${orders}</div></div></div>
      </div>
    </details>
    ${due ? `<button class="st-due" data-run="review">${IC('review')}<span><b>${due} terim tekrar bekliyor</b><small>Aralıklı tekrar Stüdyo'dan önce gelir: zamanı geçmiş tekrar, unutmanın başladığı yerdir.</small></span>${IC('chev', 'sm')}</button>` : ''}
    ${stRoute(c)}
    ${ST_GROUPS.map(g => `<section class="st-grp g-${g.k}"><div class="st-grp-h"><h2>${g.tr}</h2><i>${g.tag}</i></div><p>${g.d}</p><div class="mgrid">${g.modes.map(k => modeCard(k)).join('')}</div></section>`).join('')}
    <button class="feedcard st-feed" data-feed=""><span class="fc-t"><small>Akış</small><b>Kaydır, öğren.</b><span>Bütün modların karışımı, tek parmakla: yeni terimler, hızlı sorular, ikizler, yakın okuma ve Paper 2.</span><span class="fc-go">${IC('reel', 'sm')}Akışı aç</span></span></button>
    <button class="card p2link st-p2" data-go="p2"><span class="p2link-ic" aria-hidden="true">${IC('p2')}</span><span><b>Paper 2 yöntemi</b><small>Sınavın yapısı, denemenin anatomisi, notunun tamamı ve 7 ayrı çalışma yolu Paper 2 sekmesinde.</small></span>${IC('chev')}</button>`;
  const D = $('#stSetBox'); if (D) D.addEventListener('toggle', () => { ST_OPEN = D.open; const c2 = D.querySelector('.st-chg'); if (c2) c2.textContent = D.open ? 'Kapat' : 'Değiştir'; });
  stSpotlight(v);
};

/* ---------- olaylar ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-pl],[data-stmode],[data-stsrc],[data-stsize],[data-storder]');
  if (!t) return;
  const d = t.dataset;
  if (d.pl) { plAct(d.pl, t, e); return; }
  if (d.stmode) { haptic('tap'); stLaunch(d.stmode); return; }
  if (d.stsrc) { stSet().src = d.stsrc; touch(); RENDER.studio(); haptic('tap'); return; }
  if (d.stsize !== undefined) { stSet().size = +d.stsize; touch(); RENDER.studio(); return; }
  if (d.storder) { stSet().order = d.storder; touch(); RENDER.studio(); }
});
document.addEventListener('keydown', e => {
  if (VIEW !== 'play' || !PL || !$('#sheetBg').hidden) return;
  if (e.key === 'Escape') { plQuit(); return; }
  if (PL.done) return;
  const inInput = !!(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName));
  if (PL.M.key) PL.M.key(PL, e, inInput);
});
