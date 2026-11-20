'use strict';
/* =====================================================================
   TERİM ATÖLYESİ — Paper 2 sekmesi
   Sınavın yapısı, denemenin anatomisi, yöntem notunun tamamı ve 7 çalışma
   yolu. Not satırları ve sorular kendi aralıklı tekrar kaydını tutar (S.p2).
   ===================================================================== */

/* ---------- veri hazırlığı ---------- */
const P2_PIG = { temel: 't', plan: 's', yazim: 'a', gun: 'i' };
P2_CH.forEach(c => { c.pig = P2_PIG[c.k]; });
const P2_LINES = [];
P2_SECS.forEach(sec => {
  sec.ch = P2_CH.find(c => c.secs.includes(sec.n));
  sec.items = sec.lines.map((x, i) => {
    const o = typeof x === 'string' ? { l: x } : x;
    let l = o.l, warn = false, chk = false;
    if (l[0] === '!') { warn = true; l = l.slice(1); }
    if (l.indexOf('✓ ') === 0) { chk = true; l = l.slice(2); }
    const j = chk ? -1 : l.indexOf(' → ');
    const it = { id: 'c' + sec.n + '.' + hashStr(l).toString(36), s: sec.n, i, k: j < 0 ? '' : l.slice(0, j), v: j < 0 ? l : l.slice(j + 3), warn, chk, f: o.f || '' };
    it.card = !chk && !!it.k;
    P2_LINES.push(it);
    return it;
  });
});
const P2_CARDS = P2_LINES.filter(x => x.card);
const P2Q = P2_Q.map(r => ({ id: 'q' + hashStr(r[1]).toString(36), s: r[0], q: r[1], a: r[2], o: r[3], h: [r[4], r[5]], x: r[6] }));
const P2G = P2_GAP.map(r => ({ id: 'g' + hashStr(r[1] + r[2]).toString(36), s: r[0], pre: r[1], a: r[2], post: r[3], o: r[4], x: r[5] }));
const P2O = P2_ORDER.map(r => ({ id: 'o' + hashStr(r[1]).toString(36), s: r[0], t: r[1], steps: r[2], x: r[3] }));
const P2E = P2_EYE.map(r => ({ id: 'e' + hashStr(r[2]).toString(36), s: r[0], ctx: r[1], txt: r[2], a: r[3], o: r[4], x: r[5], fix: r[6] }));
const P2_KALIP = (() => {
  const out = [], seen = new Set();
  P2_LINES.forEach(x => { const m = (x.k + ' → ' + x.v).match(/«(.+?)»/g); if (m) m.forEach(k => { const t = k.slice(1, -1); if (!seen.has(t)) { seen.add(t); out.push({ t, s: x.s, use: x.k && !/«/.test(x.k) ? x.k : x.v }); } }); });
  return out;
})();

/* ---------- biçim ---------- */
function p2fmt(s) {
  return esc(s).replace(/«(.+?)»/g, '<em class="kalip">$1</em>').replace(/ → /g, ' <span class="ar">→</span> ');
}
const p2mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

/* ---------- aralıklı tekrar ---------- */
function p2S() { if (!S.p2 || typeof S.p2 !== 'object') S.p2 = {}; return S.p2; }
function p2grade(id, ok) {
  const st = p2S(), p = st[id] || (st[id] = { s: 0, d: 0, w: 0 });
  if (ok) { p.d = Date.now() + IV[Math.min(p.s, 4)] * DAY; p.s = Math.min(6, p.s + 1); }
  else { p.s = 0; p.d = Date.now(); p.w = (p.w || 0) + 1; }
  p.l = Date.now();
}
function p2soft(id) { const st = p2S(), p = st[id] || (st[id] = { s: 0, d: 0, w: 0 }); p.d = Date.now() + DAY; p.l = Date.now(); }
const p2due = id => { const p = p2S()[id]; return !!p && p.d <= Date.now(); };
function p2dueCount() { let n = 0; for (const x of P2_CARDS) if (p2due(x.id)) n++; for (const x of P2Q) if (p2due(x.id)) n++; return n; }
function p2mast(secs) {
  const set = secs ? new Set(secs) : null, st = p2S();
  let n = 0, sum = 0, seen = 0;
  const add = (id, s) => { if (set && !set.has(s)) return; n++; const p = st[id]; if (p) { seen++; sum += Math.min(p.s, 3) / 3; } };
  P2_CARDS.forEach(x => add(x.id, x.s)); P2Q.forEach(x => add(x.id, x.s));
  return { n, seen, pct: n ? sum / n : 0 };
}
function p2order(list, bookNew) {
  const st = p2S(), now = Date.now(), due = [], neu = [], weak = [], rest = [];
  list.forEach(x => { const p = st[x.id]; if (!p) neu.push(x); else if (p.d <= now) due.push(x); else if (p.w && p.s < 2) weak.push(x); else rest.push(x); });
  return [...shuffle(due), ...(bookNew ? neu : shuffle(neu)), ...shuffle(weak), ...shuffle(rest)];
}

/* ---------- kapsam ---------- */
function p2sc() { return S.p2sc || 'all'; }
function p2secs(sc) {
  if (/^ch:/.test(sc)) { const c = P2_CH.find(x => x.k === sc.slice(3)); if (c) return c.secs; }
  if (/^sec:/.test(sc)) return [+sc.slice(4)];
  return P2_SECS.map(s => s.n);
}
function p2scLabel(sc) {
  if (sc === 'due') return 'Tekrarı gelenler';
  if (/^ch:/.test(sc)) { const c = P2_CH.find(x => x.k === sc.slice(3)); return c ? c.t : 'Bütün not'; }
  if (/^sec:/.test(sc)) { const s = P2_SECS[+sc.slice(4)]; return s ? '§' + s.n + ' ' + s.t : 'Bütün not'; }
  return 'Bütün not';
}
function p2pool(arr, sc, min, P) {
  if (sc === 'due') return arr.filter(x => p2due(x.id));
  let L = arr.filter(x => p2secs(sc).includes(x.s)), used = sc;
  if (min && L.length < min && /^sec:/.test(sc)) { const ch = P2_SECS[+sc.slice(4)].ch; used = 'ch:' + ch.k; L = arr.filter(x => ch.secs.includes(x.s)); }
  if (min && L.length < min) { used = 'all'; L = arr.slice(); }
  if (P && used !== sc) P.label = 'Paper 2 · ' + p2scLabel(used);
  return L;
}
function p2begin(P, noDue) {
  let sc = P.over.p2sc || p2sc();
  if (noDue && sc === 'due') sc = 'all';
  P.sc = sc; P.label = 'Paper 2 · ' + p2scLabel(sc); P.fresh = true;
  return sc;
}

/* ---------- oynatıcı parçaları ---------- */
function p2paper(s, inner, enter) {
  const ch = P2_SECS[s].ch;
  return `<article class="paper p2paper ${enter ? 'enter' : ''}" id="plPaper" style="--cc:${ch.col}"><span class="strip" data-strip="${ch.pig}" aria-hidden="true"></span>${inner}</article>`;
}
function p2kick(s, label) {
  const S0 = P2_SECS[s];
  return `<div class="q-k"><span class="q-label">${esc(label)}</span><button class="chip p2chip" data-pl="p2see" data-k="${S0.n}" style="--cc:${S0.ch.col}" aria-label="Notta aç: bölüm ${S0.n}, ${esc(S0.t)}"><i aria-hidden="true"></i>§${S0.n} ${esc(S0.t)}</button></div>`;
}
function p2opts(list, ans, act) {
  return `<div class="opts">${list.map((o, i) => `<button class="opt ${ans ? (o.ok ? 'ok' : o.picked ? 'no' : 'dim') : ''}" data-pl="${act}" data-k="${i}" ${ans ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${p2fmt(o.t)}</span></button>`).join('')}</div>`;
}
function p2fb(ok, label, body) {
  return `<div class="fb ${ok ? 'good' : 'bad'}" role="status"><div class="fb-h">${ok ? `<span class="badge-ok">${IC('check', 'sm')}${esc(label || pick(['Doğru', 'Tam isabet', 'Kusursuz', 'Aynen öyle']))}</span>` : `<span class="badge-no">${IC('x', 'sm')}${esc(label || 'Yanlış')}</span>`}</div>${body}</div>`;
}
/* her P2 modunun ortak eylemleri: notu aç, başka moda geç */
function p2common(P, a, t) {
  if (a === 'p2see') { p2SecSheet(+t.dataset.k, true); return true; }
  if (a === 'p2go') { stLaunch(t.dataset.v, { p2sc: t.dataset.sc || P.sc }); return true; }
  if (a === 'p2back') { plStop(); PL = null; show('p2'); return true; }
  return false;
}
function p2nextBtns(P, skip) {
  const L = [['p2quiz', 'test', 'Yöntem testi'], ['p2cards', 'cards', 'Not kartları'], ['p2eye', 'eye', 'Değerlendirici gözü'], ['p2order', 'chain', 'Sırala']].filter(x => x[0] !== skip).slice(0, 2);
  return L.map(([k, ic, t]) => `<button class="btn ghost" data-pl="p2go" data-v="${k}">${IC(ic, 'sm')}${t}</button>`).join('') + `<button class="btn ghost" data-pl="p2back">${IC('p2', 'sm')}Paper 2 sekmesi</button>`;
}
function p2keyOpts(e, sel) { if (/^[1-4]$/.test(e.key)) { const b = $(`[data-pl="${sel}"][data-k="${+e.key - 1}"]`); if (b && !b.disabled) b.click(); return true; } return false; }

/* =====================================================================
   MODLAR
   ===================================================================== */
/* ---------- Not kartları ---------- */
MODES.p2cards = {
  tr: 'Not kartları', tag: 'kavram ↔ açıklama', ic: 'cards', grp: 'p2', free: 1, ownSize: 1, ill: '<i class="card1"></i><i class="card2"></i>',
  why: 'Notun her satırı bir kart. Önce içinden söyle, sonra çevir. Bildiklerin aralıklı tekrara girer, bilmediklerin yeni turda gelir.',
  start(P) {
    const sc = p2begin(P);
    const L = p2order(p2pool(P2_CARDS, sc), true).slice(0, P.over.n || 14);
    if (!L.length) { P.abort = sc === 'due' ? 'Tekrarı gelen kart yok.' : 'Bu kapsamda kart yok.'; return; }
    P.o = stOpt('p2cards', { front: 'k' }); P.all = L; P.deck = L.slice(); P.i = 0; P.round = 1; P.again = []; P.known = new Set(); P.first = new Set(); P.graded = new Set(); P.flip = false;
  },
  progress: P => P.known.size / P.all.length,
  hud: P => `<span class="hud" id="plHud">${P.round}. tur · ${P.deck.length - P.i} kart</span>`,
  view(P) {
    const w = P.deck[P.i], sec = P2_SECS[w.s], fk = P.o.front === 'k';
    const kH = w.f ? esc(w.f) : p2fmt(w.k), vH = p2fmt(w.v), kick = `<span class="q-label">§${sec.n} · ${esc(sec.t)}</span>`;
    const front = fk ? `<div class="fl-mid">${kick}<div class="bigterm p2big">${kH}</div>${w.warn ? '<span class="chip no">kaçın</span>' : ''}</div><div class="fl-bot"><span>açıklamayı hatırla, sonra çevir</span></div>`
      : `<div class="fl-mid">${kick}<p class="qdef p2v">${vH}</p></div><div class="fl-bot"><span>kavramı hatırla, sonra çevir</span></div>`;
    const back = `<div class="fl-mid p2back">${kick}<p class="qdef p2v"><b class="p2k ${w.warn ? 'warn' : ''}">${w.f ? esc(w.f) + ':' : p2fmt(w.k)}</b> ${w.f ? '' : '<span class="ar">→</span> '}${vH}</p></div>`;
    return `<div class="row" style="justify-content:center;margin-bottom:12px"><div class="seg" role="group" aria-label="Kartın ön yüzü"><button data-pl="front" data-v="k" aria-pressed="${fk}">Ön yüz: kavram</button><button data-pl="front" data-v="v" aria-pressed="${!fk}">Ön yüz: açıklama</button></div></div>
      <div class="flash p2flash ${P.flip ? 'flip' : ''}" id="flash" data-pl="flip" role="button" tabindex="0" aria-label="Kartı çevir" style="--cc:${sec.ch.col};--cs:${sec.ch.col}">
        <span class="swipe-tag l">TEKRAR</span><span class="swipe-tag r">BİLİYORUM</span>
        <div class="flash-in"><div class="flash-face f"><span class="strip" data-strip="${sec.ch.pig}"></span>${front}</div><div class="flash-face b"><span class="strip" data-strip="${sec.ch.pig}"></span>${back}</div></div>
      </div>
      <div class="decide"><button class="btn ghost lg" data-pl="no">${IC('review')}Tekrar gelsin</button><button class="btn ok lg" data-pl="yes">${IC('check')}Biliyorum</button></div>
      <p class="kbd">Boşluk: çevir · ← tekrar gelsin · → biliyorum · kartı kaydırabilirsin</p>`;
  },
  after(P) { bindDrag($('#flash'), () => p2cardsDecide(P, false), () => p2cardsDecide(P, true)); },
  act(P, a, t) {
    if (p2common(P, a, t)) return;
    if (a === 'flip') { const el = $('#flash'); if (!el || el.dataset.dragged) return; P.flip = !P.flip; el.classList.toggle('flip', P.flip); haptic('tap'); return; }
    if (a === 'yes' || a === 'no') { p2cardsDecide(P, a === 'yes'); return; }
    if (a === 'front') { P.o.front = t.dataset.v; touch(); P.flip = false; plRender(); }
  },
  key(P, e, inInput) { if (inInput) return; if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); MODES.p2cards.act(P, 'flip'); } else if (e.key === 'ArrowRight') p2cardsDecide(P, true); else if (e.key === 'ArrowLeft') p2cardsDecide(P, false); },
  summary(P, early) {
    return { title: early ? 'Ara verdin' : 'Kartlar tamam', big: `${P.first.size}/${P.all.length}`, sub: 'ilk turda bildiğin kartlar',
      rows: [['Tur', P.round], ['Kart', P.all.length], ['Bilmediğin', P.all.length - P.first.size], ['XP', '+' + (S.xp - PL.xp0)]],
      note: 'Bildiğin kartlar 1 gün, 3 gün, 1 hafta aralıklarla geri gelir; bilmediklerin yarın yeniden önünde.', btns: p2nextBtns(P, 'p2cards'), againLabel: 'Aynı kapsamla yeniden', confetti: early ? 0 : 90 };
  }
};
function p2cardsDecide(P, yes) {
  if (P.busy || P.done) return; P.busy = true;
  const w = P.deck[P.i], el = $('#flash');
  if (!P.graded.has(w.id)) { P.graded.add(w.id); p2grade(w.id, yes); }
  if (yes) { P.known.add(w.id); if (P.round === 1) P.first.add(w.id); addXP(1); PL.ok++; PL.combo++; } else { P.again.push(w); PL.no++; PL.combo = 0; }
  countAnswer(yes); touch(); haptic(yes ? 'ok' : 'tap');
  if (yes) splashAt(el, 10, [P2_SECS[w.s].ch.col, '#FFFFFF']);
  outAnim(el, yes ? 'r' : 'l', () => {
    P.busy = false; P.i++; P.flip = false;
    if (P.i >= P.deck.length) {
      if (P.again.length) { P.deck = shuffle(P.again); P.again = []; P.i = 0; P.round++; toast(`${P.round}. tur · bilmediğin ${P.deck.length} kart`); }
      else { addXP(6); plFinish(MODES.p2cards.summary(P, false)); return; }
    }
    plRender();
  });
}

/* ---------- Yöntem testi (ipuçlu) ---------- */
MODES.p2quiz = {
  tr: 'Yöntem testi', tag: 'iki ipuçlu sorular', ic: 'test', grp: 'p2', free: 1, ownSize: 1, ill: '<span class="checks"><i></i><i></i><i></i></span>',
  why: 'Her soruda iki ipucu var: ilki yön gösterir, ikincisi neredeyse söyler. İpucusuz doğru tam puan; yanlışların turun sonunda bir kez daha gelir.',
  start(P) {
    const sc = p2begin(P);
    const L = p2order(p2pool(P2Q, sc), false).slice(0, P.over.n || 10);
    if (!L.length) { P.abort = sc === 'due' ? 'Tekrarı gelen soru yok.' : 'Bu kapsamda soru yok.'; return; }
    P.list = L.map(q => p2mkQ(q, false)); P.i = 0; P.ans = false; P.hn = 0; P.miss = []; P.hints = 0; P.first = 0; P.firstOk = 0; P.clean = 0;
  },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.list.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.list.length}</span>`,
  view(P) {
    const it = P.list[P.i], q = it.q;
    const hints = q.h.slice(0, P.hn).map((h, i) => `<div class="p2hint"><b>${IC('spark', 'sm')}İpucu ${i + 1}</b><span>${p2fmt(h)}</span></div>`).join('');
    const hb = P.ans ? '' : `<div class="p2hrow">${[0, 1].map(i => `<button class="btn sm ${i < P.hn ? 'used' : 'ghost'}" data-pl="hint" ${i !== P.hn ? 'disabled' : ''}>${IC('spark', 'sm')}İpucu ${i + 1}</button>`).join('')}<span class="hint">${['ipucusuz doğru +4 XP', 'bir ipucuyla +2 XP', 'iki ipucuyla +1 XP'][P.hn]}</span></div>`;
    const fb = P.ans ? p2fb(P.ok1, P.ok1 ? (P.hn ? 'Doğru · ipucuyla' : '') : '', `<p class="def">${p2fmt(q.x)}</p>`) : '';
    return p2paper(q.s, `${p2kick(q.s, it.redo ? 'Yeniden · yanlış yaptığın soru' : 'Yöntem sorusu')}<h2 class="p2q">${p2fmt(q.q)}</h2>${hb}${hints ? `<div class="p2hints">${hints}</div>` : ''}${p2opts(it.opts, P.ans, 'qopt')}${fb}`, P.fresh)
      + (P.ans ? plNext(P) : '<p class="kbd">1–4 ile seç · İ: ipucu</p>');
  },
  after(P) { P.fresh = false; plFocusIn(); },
  act(P, a, t) {
    if (p2common(P, a, t)) return;
    const it = P.list[P.i];
    if (a === 'hint' && !P.ans && P.hn < 2) { P.hn++; P.hints++; haptic('tap'); sfx('tick'); plRender(); return; }
    if (a === 'qopt' && !P.ans) {
      const o = it.opts[+t.dataset.k]; if (!o) return;
      o.picked = true; P.ans = true; P.ok1 = !!o.ok;
      const xp = P.ok1 ? [4, 2, 1][P.hn] : 0;
      if (!it.redo) { P.first++; if (P.ok1) P.firstOk++; }
      if (P.ok1) { if (!it.redo) { if (P.hn) p2soft(it.q.id); else { p2grade(it.q.id, true); P.clean++; } } }
      else { if (!it.redo) { p2grade(it.q.id, false); P.miss.push(it.q); } PL.wrong.add(it.q.id); }
      plScore(P.ok1, null, { xp });
      plRender(); plFx($(`[data-pl="qopt"][data-k="${t.dataset.k}"]`), P.ok1, xp, P2_SECS[it.q.s].ch.col);
      return;
    }
    if (a === 'next' && P.ans) p2quizNext(P);
  },
  key(P, e) {
    if (!P.ans && p2keyOpts(e, 'qopt')) return;
    if (!P.ans && /^[iİhH]$/.test(e.key)) MODES.p2quiz.act(P, 'hint');
    else if (P.ans && e.key === 'Enter') { e.preventDefault(); p2quizNext(P); }
  },
  summary(P, early) {
    const acc = P.first ? Math.round(P.firstOk / P.first * 100) : 0;
    return { title: early ? 'Ara verdin' : acc >= 90 ? 'Yöntem elinde' : acc >= 70 ? 'İyi gidiyor' : 'Tekrar zamanı', big: '%' + acc, sub: 'ilk denemede doğru',
      rows: [['İpucusuz doğru', P.clean], ['Kullanılan ipucu', P.hints], ['Yanlış', P.miss.length], ['XP', '+' + (S.xp - PL.xp0)]],
      note: P.miss.length ? 'Yanlış yaptığın sorular aralıklı tekrar listende; Paper 2 sekmesindeki “Tekrar” düğmesiyle yeniden gelir.' : 'İpucusuz doğrular 1 gün, 3 gün, 1 hafta aralıklarla geri gelir.',
      btns: p2nextBtns(P, 'p2quiz'), againLabel: 'Aynı kapsamla yeniden', noWrongList: 1,
      extra: P.miss.length ? `<section class="card" style="margin-top:14px"><div class="card-h"><h2>Gözden geçir</h2><span class="faint" style="font-weight:800">${P.miss.length} soru</span></div><div class="wlist">${P.miss.map(q => `<div class="wl p2wl" style="--cc:${P2_SECS[q.s].ch.col}"><b>${p2fmt(q.q)}</b><span>${p2fmt(q.a)}</span></div>`).join('')}</div></section>` : '',
      confetti: !early && acc >= 80 ? 110 : 0 };
  }
};
function p2mkQ(q, redo) { return { q, redo, opts: shuffle([{ t: q.a, ok: 1 }, ...q.o.map(t => ({ t }))]) }; }
function p2quizNext(P) {
  P.i++; P.ans = false; P.hn = 0; P.fresh = true;
  if (P.i >= P.list.length) {
    if (P.miss.length && !P.redoDone) { P.redoDone = true; P.list.push(...shuffle(P.miss).map(q => p2mkQ(q, true))); toast(`Yanlış yaptığın ${P.miss.length} soru bir kez daha`); }
    else { addXP(5); plFinish(MODES.p2quiz.summary(P, false)); return; }
  }
  plRender();
}

/* ---------- Sırala ---------- */
MODES.p2order = {
  tr: 'Sırala', tag: 'adımları diz', ic: 'chain', grp: 'p2', free: 1, ownSize: 1, ill: '<span class="slots"><i></i><i></i><i></i><b></b><b></b><b></b></span>',
  why: 'Huni, sandviç, 4 halka, harita, 105 dakika: notun bütün sıralı yapıları. Adımlara doğru sırayla dokun; sıra eline yerleşsin.',
  start(P) { const sc = p2begin(P, true); P.list = shuffle(p2pool(P2O, sc, 3, P)).slice(0, P.over.n || 5); P.i = 0; P.miss = 0; p2ordBuild(P); },
  progress: P => (P.i + P.c.got.length / P.c.n) / P.list.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.list.length}</span>`,
  view(P) {
    const o = P.list[P.i], c = P.c, done = c.got.length === c.n;
    const slots = o.steps.map((s, i) => `<li class="oslot ${i < c.got.length ? 'got' : ''} ${i === c.got.length && !done ? 'next' : ''}" style="--i:${i}"><span class="on tnum">${i + 1}</span><span class="ot">${i < c.got.length ? p2fmt(s) : ''}</span></li>`).join('');
    return p2paper(o.s, `${p2kick(o.s, 'Doğru sıraya diz')}<h2 class="p2q">${esc(o.t)}</h2><ol class="oslots ${done ? 'done' : ''}">${slots}</ol>
      ${done ? p2fb(!c.err, c.err ? c.err + ' hatalı dokunuş' : 'Hatasız', `<p class="def">${p2fmt(o.x)}</p>`)
        : `<p class="hint" style="margin:14px 0 8px">Sıradaki: <b>${c.got.length + 1}. adım</b></p><div class="chunks">${c.chunks.map((x, i) => `<button class="chunk ${x.used ? 'used' : ''}" data-pl="chunk" data-k="${i}">${p2fmt(x.t)}</button>`).join('')}</div>`}`, P.fresh) + (done ? plNext(P) : '');
  },
  after(P) { P.fresh = false; },
  act(P, a, t) {
    if (p2common(P, a, t)) return;
    const o = P.list[P.i], c = P.c;
    if (a === 'chunk') {
      const x = c.chunks[+t.dataset.k]; if (!x || x.used) return;
      if (x.r === c.got.length) {
        x.used = true; c.got.push(x.r); haptic('ok'); sfx('tick');
        if (c.got.length === c.n) { const ok = !c.err; if (ok) plScore(true, null, { xp: 6 }); else addXP(2); plRender(); plFx($('.oslots'), true, ok ? 6 : 2, P2_SECS[o.s].ch.col); }
        else plRender();
      } else {
        c.err++; P.miss++; haptic('no'); sfx('no');
        t.classList.remove('bad'); void t.offsetWidth; t.classList.add('bad');
        toast('Bu adım daha sonra gelir.', 1600);
        if (c.err === 1) { PL.no++; PL.combo = 0; countAnswer(false); }
      }
      return;
    }
    if (a === 'next' && c.got.length === c.n) { P.i++; if (P.i >= P.list.length) { addXP(6); plFinish(MODES.p2order.summary(P, false)); } else { p2ordBuild(P); plRender(); } }
  },
  key(P, e) { if (P.c.got.length === P.c.n && e.key === 'Enter') MODES.p2order.act(P, 'next'); },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Sıralar yerinde', big: `${PL.ok}/${P.list.length}`, sub: 'hatasız dizdiğin yapı', rows: [['Hatasız', PL.ok], ['Hatalı dokunuş', P.miss], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Sınavda bu sıralar planın iskeletidir: harita 7 satır, giriş 4 adım, blok 4 halka, sonuç 3 adım.', btns: p2nextBtns(P, 'p2order'), againLabel: 'Yeni sıralar', confetti: !early && !P.miss ? 120 : 0 }; }
};
function p2ordBuild(P) {
  const o = P.list[P.i]; let ch = o.steps.map((t, r) => ({ t, r }));
  for (let k = 0; k < 6; k++) { ch = shuffle(ch); if (ch.some((x, i) => x.r !== i)) break; }
  P.c = { chunks: ch, got: [], err: 0, n: o.steps.length }; P.fresh = true;
}

/* ---------- Kalıbı tamamla ---------- */
MODES.p2gap = {
  tr: 'Kalıbı tamamla', tag: 'eksik parça', ic: 'gap', grp: 'p2', free: 1, ownSize: 1, ill: '<span class="gapl"><i></i><b></b><i></i></span>',
  why: 'Notun mavi italik kalıpları sınavdaki hazır cümle iskeletin. Boşluğa doğru parçayı koy; kalıp kulağına otursun.',
  start(P) { const sc = p2begin(P, true); P.list = shuffle(p2pool(P2G, sc, 4, P)).slice(0, P.over.n || 8).map(g => ({ g, opts: shuffle([{ t: g.a, ok: 1 }, ...g.o.map(t => ({ t }))]) })); P.i = 0; P.ans = false; },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.list.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.list.length}</span>`,
  view(P) {
    const it = P.list[P.i], g = it.g;
    const slot = P.ans ? `<span class="gapslot fill ${P.ok1 ? 'ok' : 'rev'}">${esc(g.a)}</span>` : '<span class="gapslot" aria-label="boşluk">…</span>';
    const line = `<p class="kalipline"><span class="kq" aria-hidden="true">«</span>${g.pre ? esc(g.pre) + ' ' : ''}${slot}${g.post ? ' ' + esc(g.post) : ''}<span class="kq" aria-hidden="true">»</span></p>`;
    const fb = P.ans ? p2fb(P.ok1, '', `${P.ok1 ? '' : `<p class="def">Doğrusu: <b>${esc(g.a)}</b></p>`}<p class="def">${p2fmt(g.x)}</p>`) : '';
    return p2paper(g.s, `${p2kick(g.s, 'Kalıbı tamamla')}${line}<div class="opts two p2gopts">${it.opts.map((o, i) => `<button class="opt ${P.ans ? (o.ok ? 'ok' : o.picked ? 'no' : 'dim') : ''}" data-pl="gopt" data-k="${i}" ${P.ans ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(o.t)}</span></button>`).join('')}</div>${fb}`, P.fresh)
      + (P.ans ? plNext(P) : '<p class="kbd">1–4 ile seçebilirsin</p>');
  },
  after(P) { P.fresh = false; plFocusIn(); },
  act(P, a, t) {
    if (p2common(P, a, t)) return;
    const it = P.list[P.i];
    if (a === 'gopt' && !P.ans) { const o = it.opts[+t.dataset.k]; if (!o) return; o.picked = true; P.ans = true; P.ok1 = !!o.ok; plScore(P.ok1, null, { xp: P.ok1 ? 3 : 0 }); if (!P.ok1) PL.wrong.add(it.g.id); plRender(); plFx($('.gapslot') || t, P.ok1, P.ok1 ? 3 : 0, P2_SECS[it.g.s].ch.col); return; }
    if (a === 'next' && P.ans) { P.i++; P.ans = false; P.fresh = true; if (P.i >= P.list.length) { addXP(5); plFinish(MODES.p2gap.summary(P, false)); } else plRender(); }
  },
  key(P, e) { if (!P.ans && p2keyOpts(e, 'gopt')) return; if (P.ans && e.key === 'Enter') { e.preventDefault(); MODES.p2gap.act(P, 'next'); } },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'Kalıplar yerinde', big: '%' + acc, sub: 'doğru tamamladığın kalıp', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Bütün kalıpları tek listede görmek için Paper 2 sekmesinde “Kalıp defteri”ne bak.', btns: p2nextBtns(P, 'p2gap'), againLabel: 'Yeni kalıplar', confetti: !early && acc >= 85 ? 110 : 0 }; }
};

/* ---------- Değerlendirici gözü ---------- */
MODES.p2eye = {
  tr: 'Değerlendirici gözü', tag: 'hatayı yakala', ic: 'eye', grp: 'p2', free: 1, ownSize: 1, ill: '<span class="redpen"><i></i><i></i><i></i><b></b></span>',
  why: 'Zayıf bir cümle ya da paragraf gelir. Değerlendirici gibi bak: sorun ne, puan nereden gidiyor? Sonra aynı yerin daha iyisini gör.',
  start(P) { const sc = p2begin(P, true); P.list = shuffle(p2pool(P2E, sc, 3, P)).slice(0, P.over.n || 6).map(e => ({ e, opts: shuffle([{ t: e.a, ok: 1 }, ...e.o.map(t => ({ t }))]) })); P.i = 0; P.ans = false; },
  progress: P => (P.i + (P.ans ? 1 : 0)) / P.list.length,
  hud: P => `<span class="hud" id="plHud">${P.i + 1}/${P.list.length}</span>`,
  view(P) {
    const it = P.list[P.i], e = it.e;
    const stud = `${e.ctx ? `<p class="stud-ctx">${p2fmt(e.ctx)}</p>` : ''}<div class="stud ${P.ans ? 'marked' : ''}"><span class="stud-l">Öğrenci kâğıdı</span><p>${p2fmt(e.txt)}</p><svg class="redmark" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 30 C 70 18, 150 36, 296 14"/></svg></div>`;
    const fb = P.ans ? p2fb(P.ok1, P.ok1 ? 'Değerlendirici gibi baktın' : 'Değerlendiricinin gördüğü başka', `${P.ok1 ? '' : `<p class="def"><b>${p2fmt(e.a)}</b></p>`}<p class="def">${p2fmt(e.x)}</p><div class="fix"><span class="fix-l">${IC('pen', 'sm')}Daha iyisi</span><p>${p2fmt(e.fix)}</p></div>`) : '';
    return p2paper(e.s, `${p2kick(e.s, 'Değerlendirici gözü')}${stud}<h2 class="p2q sm">Değerlendirici burada neyi görür?</h2>${p2opts(it.opts, P.ans, 'eopt')}${fb}`, P.fresh)
      + (P.ans ? plNext(P) : '<p class="kbd">1–4 ile seçebilirsin</p>');
  },
  after(P) { P.fresh = false; plFocusIn(); },
  act(P, a, t) {
    if (p2common(P, a, t)) return;
    const it = P.list[P.i];
    if (a === 'eopt' && !P.ans) { const o = it.opts[+t.dataset.k]; if (!o) return; o.picked = true; P.ans = true; P.ok1 = !!o.ok; plScore(P.ok1, null, { xp: P.ok1 ? 4 : 0 }); if (!P.ok1) PL.wrong.add(it.e.id); plRender(); plFx($(`[data-pl="eopt"][data-k="${t.dataset.k}"]`), P.ok1, P.ok1 ? 4 : 0, P2_SECS[it.e.s].ch.col); return; }
    if (a === 'next' && P.ans) { P.i++; P.ans = false; P.fresh = true; if (P.i >= P.list.length) { addXP(6); plFinish(MODES.p2eye.summary(P, false)); } else plRender(); }
  },
  key(P, e) { if (!P.ans && p2keyOpts(e, 'eopt')) return; if (P.ans && e.key === 'Enter') { e.preventDefault(); MODES.p2eye.act(P, 'next'); } },
  summary(P, early) { const acc = PL.ok + PL.no ? Math.round(PL.ok / (PL.ok + PL.no) * 100) : 0; return { title: early ? 'Ara verdin' : 'Kırmızı kalem sende', big: '%' + acc, sub: 'doğru teşhis', rows: [['Doğru', PL.ok], ['Yanlış', PL.no], ['XP', '+' + (S.xp - PL.xp0)]], note: 'Kendi denemeni okurken de aynı soruyu sor: değerlendirici bu cümlede neyi görür?', btns: p2nextBtns(P, 'p2eye'), againLabel: 'Yeni kâğıtlar', confetti: !early && acc >= 80 ? 110 : 0 }; }
};

/* ---------- Eşleştir ---------- */
MODES.p2match = {
  tr: 'Eşleştir', tag: 'süreli eşleştirme', ic: 'match', grp: 'p2', free: 1, ownSize: 1, ill: '<span class="pairsA"><i></i><i></i><i></i><i></i></span>',
  why: 'Kavramı açıklamasıyla olabildiğince hızlı eşleştir. Yanlış dokunuş 2 saniye ekler. Hız, notu otomatikleştirir.',
  fmtBest: v => (v / 1000).toFixed(1) + ' sn',
  start(P) {
    const sc = p2begin(P, true), short = x => (x.f || x.k).length <= 64 && x.v.length <= 104;
    let L = p2pool(P2_CARDS, sc).filter(short); if (L.length < 4 && /^sec:/.test(sc)) { const ch = P2_SECS[+sc.slice(4)].ch; L = P2_CARDS.filter(x => ch.secs.includes(x.s) && short(x)); P.label = 'Paper 2 · ' + ch.t; } if (L.length < 4) { L = P2_CARDS.filter(short); P.label = 'Paper 2 · Bütün not'; }
    const seen = new Set(); L = shuffle(L).filter(x => { const k = x.f || x.k; if (seen.has(k)) return false; seen.add(k); return true; });
    P.pool = L; P.per = Math.min(5, L.length); P.rounds = Math.max(1, Math.min(3, Math.floor(L.length / P.per))); P.round = 0; P.pen = 0; P.miss = 0; P.tStart = Date.now();
    p2mDeal(P);
    P.tm.push(setInterval(() => { const c = $('#mClock'); if (c && PL === P) c.textContent = p2mClock(P); }, 200));
  },
  progress: P => (P.round + (P.L.length - P.left.length) / P.L.length) / P.rounds,
  hud: P => `<span class="hud tnum" id="plHud"><span id="mClock">${p2mClock(P)}</span> · ${Math.min(P.round + 1, P.rounds)}/${P.rounds}</span>`,
  view(P) {
    return `<div class="mgame p2mgame"><div class="mcol">${P.L.map((x, i) => `<button class="mtile term ${x.done ? 'ok' : ''}" data-pl="mt" data-s="L" data-k="${i}" style="--cc:${P2_SECS[x.it.s].ch.col}">${x.it.f ? esc(x.it.f) : p2fmt(x.it.k)}</button>`).join('')}</div>
      <div class="mcol">${P.R.map((x, i) => `<button class="mtile ${x.done ? 'ok' : ''}" data-pl="mt" data-s="R" data-k="${i}">${p2fmt(x.it.v)}</button>`).join('')}</div></div>
      <p class="kbd">Bir kavrama, sonra açıklamasına dokun</p>`;
  },
  act(P, a, t) {
    if (p2common(P, a, t)) return;
    if (a !== 'mt') return;
    const s = t.dataset.s, i = +t.dataset.k, arr = s === 'L' ? P.L : P.R; if (!arr[i] || arr[i].done) return;
    if (!P.pk || P.pk.s === s) { P.pk = { s, i }; $$('.mtile.sel').forEach(x => x.classList.remove('sel')); t.classList.add('sel'); haptic('tap'); return; }
    const a1 = s === 'L' ? arr[i] : P.L[P.pk.i], b1 = s === 'R' ? arr[i] : P.R[P.pk.i];
    const other = $(`[data-pl="mt"][data-s="${P.pk.s}"][data-k="${P.pk.i}"]`);
    P.pk = null;
    if (a1.it.id === b1.it.id) {
      a1.done = b1.done = true; P.left = P.left.filter(k => k !== a1.it.id);
      plScore(true, null, { xp: 1, count: false }); t.classList.add('ok'); if (other) other.classList.add('ok'); $$('.mtile.sel').forEach(x => x.classList.remove('sel'));
      haptic('ok'); sfx('ok'); splashAt(t, 10, [P2_SECS[a1.it.s].ch.col, '#FFFFFF']); plHud();
      if (!P.left.length) { P.round++; if (P.round >= P.rounds) { P.end = Date.now(); p2mEnd(P); } else P.tm.push(setTimeout(() => { if (PL !== P) return; p2mDeal(P); plRender(); }, 450)); }
    } else {
      P.pen += 2000; P.miss++; PL.no++; PL.combo = 0; haptic('no'); sfx('no');
      [t, other].forEach(x => { if (x) { x.classList.remove('sel'); x.classList.add('no'); setTimeout(() => x.classList.remove('no'), 420); } });
    }
  },
  summary(P, early) { return { title: early ? 'Ara verdin' : 'Eşleştirme bitti', big: p2mClock(P), sub: `${P.rounds} tur · ${P.miss} yanlış dokunuş`, rows: [['Süre', p2mClock(P)], ['Ceza', '+' + P.pen / 1000 + ' sn'], ['Doğru', PL.ok], ['XP', '+' + (S.xp - PL.xp0)]], rec: P.isRec, btns: p2nextBtns(P), againLabel: 'Yeni tur', confetti: early ? 0 : 120 }; }
};
function p2mDeal(P) {
  let set = P.pool.slice(P.round * P.per, P.round * P.per + P.per);
  if (set.length < 3) set = set.concat(shuffle(P.pool.filter(w => !set.includes(w))).slice(0, P.per - set.length));
  P.L = shuffle(set).map(it => ({ it, done: false })); P.R = shuffle(set).map(it => ({ it, done: false })); P.left = set.map(x => x.id); P.pk = null;
}
function p2mClock(P) { const ms = (P.end || Date.now()) - P.tStart + P.pen; return (ms / 1000).toFixed(1) + ' sn'; }
function p2mEnd(P) {
  const ms = P.end - P.tStart + P.pen, key = 'p2match:' + P.sc, cur = S.best[key];
  P.isRec = cur !== undefined && ms < cur; if (cur === undefined || ms < cur) S.best[key] = ms;
  addXP(Math.max(4, 14 - Math.round(ms / 10000))); plFinish(MODES.p2match.summary(P, false));
}

/* ---------- Prova saati ---------- */
MODES.p2clock = {
  tr: 'Prova saati', tag: '105 dakika', ic: 'clock', grp: 'p2', free: 1, ownSize: 1, ill: '<span class="clockI"><i></i><b></b></span>',
  why: 'Evde deneme yazarken aç. Hangi dakikada nerede olman gerektiğini ve o aşamada ne yapacağını gösterir; aşama değişince ses ve titreşimle haber verir.',
  start(P) { P.label = 'Paper 2 · 105 dakikalık prova'; P.sc = 'all'; P.run = false; P.el = 0; P.t0 = 0; P.ph = 0; P.total = 105 * 60e3; },
  progress: P => clamp(p2clkEl(P) / P.total, 0, 1),
  hud: P => `<span class="hud tnum" id="plHud">${p2mmss(p2clkEl(P))} / 105:00</span>`,
  view(P) {
    const el = p2clkEl(P), ph = P2_PHASES[P.ph], nx = P2_PHASES[P.ph + 1], R = 118, C = 2 * Math.PI * R;
    const segs = P2_PHASES.map((p, i) => { const a0 = p.a / 105, a1 = p.b / 105; return `<circle class="ck-seg ${i < P.ph ? 'past' : i === P.ph ? 'cur' : ''}" r="${R}" cx="150" cy="150" style="stroke:${p.col}" stroke-dasharray="${Math.max(0, (a1 - a0) * C - 4).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-a0 * C).toFixed(1)}" transform="rotate(-90 150 150)"/>`; }).join('');
    const now = ph.chk ? `<p class="hint" style="margin-bottom:10px">Denemeni baştan sona tara ve her maddeyi işaretle.</p>${p2chkHTML()}`
      : `<ul class="ck-do">${ph.do.map(d => `<li>${p2fmt(d)}</li>`).join('')}</ul>`;
    const list = P2_PHASES.map((p, i) => `<button class="ck-ph ${i === P.ph ? 'cur' : ''} ${i < P.ph ? 'past' : ''}" data-pl="ck-jump" data-k="${i}" style="--c:${p.col}"><i aria-hidden="true">${i < P.ph ? IC('check', 'sm') : ''}</i><b>${esc(p.t)}</b><span class="tnum">${p.a}–${p.b}</span></button>`).join('');
    return `<div class="ck">
      <div class="ck-dial">
        <svg viewBox="0 0 300 300" class="ck-svg" aria-hidden="true">
          <circle class="ck-track" r="${R}" cx="150" cy="150"/>${segs}
          <circle class="ck-prog" id="ckProg" r="${R}" cx="150" cy="150" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - el / P.total)).toFixed(1)}" transform="rotate(-90 150 150)"/>
          <g id="ckMark" style="transform:rotate(${(el / P.total * 360).toFixed(2)}deg);transform-origin:150px 150px"><circle class="ck-dot" cx="150" cy="${150 - R}" r="10" style="fill:${ph.col}"/></g>
        </svg>
        <div class="ck-c"><span class="ck-pn" style="color:${ph.col}">${esc(ph.t)}</span><b class="ck-rem tnum" id="ckRemain">${p2mmss(ph.b * 60e3 - el)}</b><span class="ck-tot tnum" id="ckTotal">${p2mmss(el)} / 105:00</span></div>
      </div>
      <div class="ck-side">
        <div class="ck-ctl"><button class="btn lg ${P.run ? 'ghost' : ''}" data-pl="ck-run">${IC(P.run ? 'pause' : 'play')}${P.run ? 'Duraklat' : el ? 'Devam et' : 'Başlat'}</button>${nx ? `<button class="btn ghost" data-pl="ck-skip">${IC('chev', 'sm')}Sonraki aşama</button>` : ''}${el ? `<button class="btn ghost" data-pl="ck-reset">${IC('review', 'sm')}Sıfırla</button>` : ''}</div>
        <section class="card ck-now" style="--c:${ph.col}"><div class="card-h"><h2>Şimdi: ${esc(ph.t)}</h2><span class="tnum faint" style="font-weight:800">${ph.a}–${ph.b}. dk</span></div>${now}${nx ? `<p class="ck-next">Sıradaki: <b>${esc(nx.t)}</b> · ${nx.a}. dakikada</p>` : ''}</section>
      </div>
    </div>
    <div class="ck-list" role="group" aria-label="Aşamalar">${list}</div>
    <p class="kbd">Boşluk: başlat / duraklat · ekran açık kalır</p>`;
  },
  after(P) { p2clkLoop(P); },
  act(P, a, t) {
    if (p2common(P, a, t)) return;
    if (a === 'ck-run') { if (P.run) { P.el = p2clkEl(P); P.run = false; p2wake(P, false); } else { P.t0 = Date.now(); P.run = true; p2wake(P, true); sfx('tick'); } haptic('tap'); plRender(); return; }
    if (a === 'ck-skip') { const nx = P2_PHASES[P.ph + 1]; if (!nx) return; p2clkSet(P, nx.a * 60e3); return; }
    if (a === 'ck-jump') { const p = P2_PHASES[+t.dataset.k]; if (p) p2clkSet(P, p.a * 60e3); return; }
    if (a === 'ck-reset') { P.el = 0; P.t0 = Date.now(); P.ph = 0; plRender(); }
  },
  stop(P) { p2wake(P, false); },
  key(P, e) { if (e.key === ' ') { e.preventDefault(); MODES.p2clock.act(P, 'ck-run'); } },
  summary(P, early) {
    const el = p2clkEl(P), c = p2chk(), n = c.t.filter(Boolean).length;
    return { title: early ? 'Prova yarıda kaldı' : 'Prova bitti', big: p2mmss(el), sub: 'geçen süre', rows: [['Aşama', `${Math.min(P.ph + 1, 7)}/7`], ['Kontrol', `${n}/8`], ['XP', '+' + (S.xp - PL.xp0)]],
      note: n < 8 ? 'İşaretleyemediğin kontrol maddeleri bir sonraki provanın hedefi.' : 'Sekiz maddenin sekizi tamam: bu deneme sınav düzeninde yazıldı.', btns: p2nextBtns(P), againLabel: 'Yeni prova', confetti: early ? 0 : 140 };
  }
};
function p2clkEl(P) { return clamp(P.el + (P.run ? Date.now() - P.t0 : 0), 0, P.total); }
function p2phaseAt(ms) { const m = ms / 60e3; for (let i = 0; i < P2_PHASES.length; i++) if (m < P2_PHASES[i].b) return i; return P2_PHASES.length - 1; }
function p2clkSet(P, ms) { P.el = ms; P.t0 = Date.now(); const ph = p2phaseAt(ms); if (ph > P.ph) PL.ok += ph - P.ph; P.ph = ph; haptic('tap'); plRender(); }
function p2clkLoop(P) {
  if (P.iv) return;
  P.iv = setInterval(() => {
    if (PL !== P || P.done) { clearInterval(P.iv); return; }
    const el = p2clkEl(P);
    if (el >= P.total) { P.el = P.total; P.run = false; p2wake(P, false); PL.ok++; addXP(15); plFinish(MODES.p2clock.summary(P, false)); return; }
    const ph = p2phaseAt(el);
    if (ph !== P.ph) {
      const n = P2_PHASES[ph]; PL.ok += Math.max(0, ph - P.ph); P.ph = ph;
      if (P.run) { sfx('win'); haptic('big'); toast(`${n.a}. dakika · ${n.t} zamanı`, 3200); }
      plRender(); return;
    }
    const ph0 = P2_PHASES[P.ph], R = 118, C = 2 * Math.PI * R;
    const r = $('#ckRemain'); if (r) r.textContent = p2mmss(ph0.b * 60e3 - el);
    const tt = $('#ckTotal'); if (tt) tt.textContent = p2mmss(el) + ' / 105:00';
    const pr = $('#ckProg'); if (pr) pr.setAttribute('stroke-dashoffset', (C * (1 - el / P.total)).toFixed(1));
    const mk = $('#ckMark'); if (mk) mk.style.transform = `rotate(${(el / P.total * 360).toFixed(2)}deg)`;
    plHud();
  }, 500);
  P.tm.push(P.iv);
}
async function p2wake(P, on) {
  try {
    if (on && 'wakeLock' in navigator && !P.wl) { P.wl = await navigator.wakeLock.request('screen'); P.wl.addEventListener('release', () => { P.wl = null; }); }
    else if (!on && P.wl) { const w = P.wl; P.wl = null; await w.release(); }
  } catch (e) { P.wl = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && PL && PL.k === 'p2clock' && PL.run && !PL.done) p2wake(PL, true); });

/* ---------- kontrol listesi (sayfada ve prova saatinde) ---------- */
function p2chk() { const d = ymd(); if (!S.p2chk || S.p2chk.d !== d || !Array.isArray(S.p2chk.t)) S.p2chk = { d, t: [0, 0, 0, 0, 0, 0, 0, 0], x: 0 }; return S.p2chk; }
function p2chkHTML() {
  const c = p2chk(), items = P2_SECS[13].items;
  return `<div class="chklist">${items.map((x, i) => `<button class="chkb ${c.t[i] ? 'on' : ''}" data-p2chk="${i}" aria-pressed="${!!c.t[i]}"><i aria-hidden="true">${IC('check', 'sm')}</i><span>${p2fmt(x.v)}</span></button>`).join('')}</div>`;
}
function p2chkToggle(i, btn) {
  const c = p2chk(); c.t[i] = c.t[i] ? 0 : 1; touch();
  $$(`[data-p2chk="${i}"]`).forEach(b => { b.classList.toggle('on', !!c.t[i]); b.setAttribute('aria-pressed', String(!!c.t[i])); });
  haptic(c.t[i] ? 'ok' : 'tap');
  if (c.t[i]) { sfx('tick'); splashAt(btn.querySelector('i'), 7, ['#0F8E57', '#FFFFFF']); }
  const n = c.t.filter(Boolean).length;
  $$('[data-chkn]').forEach(e => { e.textContent = n + '/8'; });
  if (n === 8 && !c.x) { c.x = 1; addXP(5); confetti(110); sfx('win'); toast('Kontrol listesi tamam · +5 XP'); updateTop(); }
}

/* =====================================================================
   SAYFA
   ===================================================================== */
function p2SecHTML(sec, opt) {
  opt = opt || {};
  const m = p2mast([sec.n]), nq = P2Q.filter(q => q.s === sec.n).length, nc = sec.items.filter(x => x.card).length;
  const lines = sec.items.map(x => x.chk
    ? `<div class="nl chk">${IC('check', 'sm')}<span>${p2fmt(x.v)}</span></div>`
    : `<div class="nl ${x.warn ? 'warn' : ''}">${x.k ? `<b>${p2fmt(x.k)}</b> <span class="ar">→</span> ` : ''}<span>${p2fmt(x.v)}</span></div>`).join('');
  return `<article class="p2s hl-${sec.hl}" id="p2s${sec.n}" style="--cc:${sec.ch.col}">
    <header class="p2s-h"><h3><mark><span class="tnum">${sec.n}</span> · ${esc(sec.t)}</mark></h3>${m.n ? `<span class="p2s-m" title="Bu bölümde hâkimiyet"><i style="--p:${Math.round(m.pct * 100)}%"></i><b class="tnum">%${Math.round(m.pct * 100)}</b></span>` : ''}</header>
    <div class="p2s-l">${lines}</div>
    ${sec.foot ? `<p class="p2s-foot">${p2fmt(sec.foot)}</p>` : ''}
    ${opt.noBtns ? '' : `<footer class="p2s-f">${nc ? `<button class="btn sm ghost" data-p2run="cards" data-arg="sec:${sec.n}">${IC('cards', 'sm')}Kartlar · ${nc}</button>` : ''}${nq ? `<button class="btn sm ghost" data-p2run="quiz" data-arg="sec:${sec.n}">${IC('test', 'sm')}Test · ${nq}</button>` : ''}${sec.n === 13 ? `<button class="btn sm ghost" data-p2run="clock">${IC('clock', 'sm')}Prova saati</button>` : ''}</footer>`}
  </article>`;
}
function p2SecSheet(n, fromPlay) {
  const sec = P2_SECS[n]; if (!sec) return;
  const nq = P2Q.filter(q => q.s === n).length, nc = sec.items.filter(x => x.card).length;
  openSheet(`<div class="sheet-h"><h2>Notunda</h2><button class="iconbtn" data-close aria-label="Kapat">${IC('x')}</button></div>
    ${p2SecHTML(sec, { noBtns: 1 })}
    ${fromPlay ? '' : `<div class="sess-actions">${nc ? `<button class="btn ghost" data-p2run="cards" data-arg="sec:${n}">${IC('cards', 'sm')}Kartlar · ${nc}</button>` : ''}${nq ? `<button class="btn" data-p2run="quiz" data-arg="sec:${n}">${IC('test', 'sm')}Bu bölümden test · ${nq}</button>` : ''}${n === 13 ? `<button class="btn" data-p2run="clock">${IC('clock', 'sm')}Prova saati</button>` : ''}</div>`}`);
}
function p2Run(kind, arg) {
  closeSheet();
  const map = { cards: 'p2cards', quiz: 'p2quiz', order: 'p2order', gap: 'p2gap', eye: 'p2eye', match: 'p2match', clock: 'p2clock' };
  if (kind === 'due') { const dc = P2_CARDS.some(x => p2due(x.id)); stLaunch(dc ? 'p2cards' : 'p2quiz', { p2sc: 'due' }); return; }
  if (kind === 'next') { const s = p2nextSec(); stLaunch('p2cards', { p2sc: 'sec:' + s }); return; }
  if (map[kind]) { stLaunch(map[kind], { p2sc: arg || p2sc() }); return; }
  show('p2');
}
function p2nextSec() { for (const sec of P2_SECS) if (sec.items.some(x => x.card && !p2S()[x.id])) return sec.n; return P2_SECS.slice().sort((a, b) => p2mast([a.n]).pct - p2mast([b.n]).pct)[0].n; }
function p2BoardTask() {
  const due = p2dueCount(), m = p2mast();
  if (due) return task({ run: 'p2', arg: 'due', ic: 'p2', t: 'Paper 2 tekrarı', s: 'Yöntem notundan kartlar ve sorular: kalıplar unutulmadan', n: due, nl: 'tekrar', col: '#D1337C' });
  if (!m.seen) return task({ run: 'p2', arg: 'go', ic: 'p2', t: 'Paper 2 sekmesi', s: 'Sınavın yapısı, denemenin anatomisi ve notunun tamamı; 7 çalışma yolu', n: 'Yeni', col: '#D1337C' });
  return '';
}

/* ---------- sayfa bölümleri ---------- */
function p2HeroHTML() {
  const m = p2mast(), due = p2dueCount(), C = 2 * Math.PI * 34, nx = P2_SECS[p2nextSec()];
  const cta = due ? `<button class="btn lg p2cta" data-p2run="due">${IC('review')}Paper 2 tekrarı · ${due}</button>`
    : `<button class="btn lg p2cta" data-p2run="next">${IC('spark')}${m.seen ? 'Sıradaki' : 'Başla'}: §${nx.n} ${esc(nx.t)}</button>`;
  return `<section class="p2hero" aria-label="Paper 2">
    <div class="p2hero-art" aria-hidden="true"><canvas id="p2cv"></canvas><span class="p2ab a">A</span><span class="p2ab b">B</span></div>
    <div class="p2hero-in">
      <span class="eyebrow">Türkçe A HL · Paper 2</span>
      <h1>Karşılaştırmalı deneme</h1>
      <p class="p2motto" aria-label="Her paragraf: ne yapıyor, iki uç A ve B, bu ne düşündürüyor">${P2_MOTTO.map((x, i) => `<span style="--i:${i}">${esc(x)}</span>`).join('<i class="ar" aria-hidden="true">→</i>')}</p>
      <div class="p2hero-row">
        <div class="p2ring" title="Yöntem hâkimiyeti"><svg viewBox="0 0 80 80" aria-hidden="true"><circle class="trk" cx="40" cy="40" r="34"/><circle class="val" cx="40" cy="40" r="34" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-ring="${(C * (1 - m.pct)).toFixed(1)}"/></svg><b class="tnum" data-count="${Math.round(m.pct * 100)}" data-pre="%" data-ck="p2m">%0</b></div>
        <div class="p2hero-st"><b>Yöntem hâkimiyeti</b><span>${m.seen}/${m.n} kart ve soru görüldü${due ? ` · <b class="due">${due} tekrar bekliyor</b>` : ''}</span></div>
      </div>
      <div class="p2hero-cta">${cta}<button class="btn ghost lg" data-feed="p2">${IC('reel')}Paper 2 akışı</button><button class="btn ghost lg" data-p2run="clock">${IC('clock')}Prova saati</button></div>
    </div>
  </section>`;
}
function p2FactsHTML() {
  return `<div class="p2facts">${P2_FACTS.map((f, i) => `<div class="p2fact" style="--i:${i}"><span class="ic-w">${IC(f.ic)}</span><b>${esc(f.big)}</b><span class="t">${esc(f.t)}</span><small>${esc(f.d)}</small></div>`).join('')}</div>`;
}
function p2CritHTML() {
  return `<section class="card p2crit" data-mode="new">
    <div class="card-h"><h2>Puanlama</h2><div class="seg" role="group" aria-label="Puanlama düzeni"><button data-p2crit="new" aria-pressed="true">25 puan · şimdi</button><button data-p2crit="old" aria-pressed="false">Eski · 30 puan</button></div></div>
    <div class="cbar" role="img" aria-label="Yeni düzende beş ölçüt, her biri 5 puan">${P2_CRIT.map(c => `<div class="cb ${c.old ? '' : 'z'}" style="--c:${c.col};--n:5;--o:${c.old}"><b>${c.k === 'B1' ? '<span class="nw">B1</span><span class="od">B</span>' : c.k}</b><span class="nw tnum">5</span><span class="od tnum">${c.old}</span></div>`).join('')}</div>
    <p class="cnote nw">Mayıs 2026 sınavlarından beri: <b>25 puan</b>, beş ölçütün her biri 5. Karşılaştırma yalnız <b>B2</b>’de puanlanır.</p>
    <p class="cnote od">2025’e kadar: <b>30 puan</b>, A 10 · B 10 · C 5 · D 5. Eski örnek kâğıtlar bu ölçekle notlanmıştır; okurken buna dikkat et.</p>
    <div class="clist">${P2_CRIT.map(c => `<div class="cl" style="--c:${c.col}"><span class="cl-k">${c.k}</span><div><b>${esc(c.n)}</b> <span class="cl-q">${esc(c.q)}</span><span class="cl-w">${IC('target', 'sm')}${esc(c.w)}</span><small lang="en">${esc(c.en)}</small></div></div>`).join('')}</div>
  </section>`;
}
function p2AnatHTML() {
  const shape = a => {
    if (a.k === 'plan') return `<span class="an-note">${[1, 2, 3, 4, 5, 6, 7].map(i => `<i style="--j:${i}"><em>${i}</em></i>`).join('')}</span>`;
    if (a.k === 'giris') return `<span class="an-fun">${['Kavram', 'Eserler', 'Ana kavram', 'Tez + harita'].map((x, i) => `<i style="--j:${i}">${x}</i>`).join('')}</span>`;
    if (a.k === 'sonuc') return `<span class="an-fun rev">${['Tez, yeni kelimelerle', 'Bağla: günümüz', 'Açık uç ?'].map((x, i) => `<i style="--j:${i}">${x}</i>`).join('')}</span>`;
    if (a.k === 'kontrol') return `<span class="an-chk">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<i style="--j:${i}">${IC('check', 'sm')}</i>`).join('')}</span>`;
    return `<span class="an-sw"><span class="bread">Üst ekmek · anahtar sözcük · A’da … B’de …</span><span class="fill"><i class="r1">İddia</i><i class="r2">Kanıt</i><i class="r3"><em>A</em>↔<em>B</em></i><i class="r4">Yorum</i></span><span class="bread">Alt ekmek · yeni sonuç</span></span>`;
  };
  return `<div class="anat" id="p2anat">${P2_ANAT.map((a, i) => `<button class="an an-${a.k}" data-p2sec="${a.sec}" style="--i:${i}" aria-label="${esc(a.t)}, ${a.a}–${a.b}. dakika: kuralları aç">
    <span class="an-t tnum">${a.a}–${a.b}<small>dk</small></span><span class="an-rail" aria-hidden="true"><i></i></span>
    <span class="an-b"><span class="an-h"><b>${esc(a.t)}</b><small>${esc(a.s)}</small>${IC('chev', 'sm')}</span>${shape(a)}</span>
  </button>`).join('')}</div>`;
}
const P2_MODE_KEYS = ['p2cards', 'p2quiz', 'p2order', 'p2gap', 'p2eye', 'p2match', 'p2clock'];
function p2ModeCard(k) {
  const M = MODES[k], best = k === 'p2match' ? S.best['p2match:' + p2sc()] : undefined;
  return `<button class="mcard g-p2" data-p2mode="${k}">
    <span class="mill" aria-hidden="true">${M.ill}</span>
    <span class="mname">${IC(M.ic, 'sm')}<b>${M.tr}</b></span><span class="mtag">${esc(M.tag)}</span>
    <span class="mwhy">${M.why}</span>
    ${best !== undefined ? `<span class="mfoot"><span class="mbest">${IC('trophy', 'sm')}${M.fmtBest(best)}</span></span>` : ''}
  </button>`;
}
function p2StudyHTML() {
  const sc = p2sc(), due = p2dueCount();
  const chips = [['all', 'Bütün not', null], ...P2_CH.map(c => ['ch:' + c.k, c.t, c.col]), ...(due ? [['due', 'Tekrarı gelenler · ' + due, '#DD3A2A']] : [])];
  const scSec = /^sec:/.test(sc) ? [[sc, p2scLabel(sc), P2_SECS[+sc.slice(4)].ch.col]] : [];
  return `<div class="filters scrollx" role="group" aria-label="Kapsam">${[...chips, ...scSec].map(([k, t, col]) => `<button class="fchip" data-p2sc="${k}" aria-pressed="${sc === k}" ${col ? `style="--cc:${col}"` : ''}>${col ? '<i class="dot"></i>' : ''}${esc(t)}</button>`).join('')}</div>
    <div class="mgrid p2grid">${P2_MODE_KEYS.map(p2ModeCard).join('')}</div>`;
}
function p2NoteHTML() {
  const tab = S.p2tab || 'temel';
  const tabs = [...P2_CH.map(c => [c.k, c.t, c.col]), ['all', 'Hepsi', null]];
  const secs = tab === 'all' ? P2_SECS : P2_SECS.filter(s => s.ch.k === tab);
  return `<div class="p2tabs seg" role="tablist" aria-label="Notun bölümleri">${tabs.map(([k, t, col]) => `<button role="tab" data-p2tab="${k}" aria-pressed="${tab === k}" aria-selected="${tab === k}" ${col ? `style="--cc:${col}"` : ''}>${col ? '<i class="dot" aria-hidden="true"></i>' : ''}${esc(t)}</button>`).join('')}</div>
    ${tab !== 'all' ? `<p class="p2tab-d">${esc(P2_CH.find(c => c.k === tab).d)}</p>` : ''}
    <div class="p2note">${secs.map(s => p2SecHTML(s)).join('')}</div>`;
}
function p2KalipHTML() {
  return `<section class="card p2kalip"><div class="card-h"><h2>Kalıp defteri</h2><span class="faint" style="font-weight:800">${P2_KALIP.length} kalıp</span></div>
    <p class="hint" style="margin-bottom:10px">Notundaki bütün mavi italik cümleler, notundaki sırayla.</p>
    <ol class="klist">${P2_KALIP.map(k => `<li style="--cc:${P2_SECS[k.s].ch.col}"><em class="kalip">${esc(k.t)}</em><small>§${k.s} · ${esc(P2_SECS[k.s].t)}</small></li>`).join('')}</ol>
    <button class="btn ghost wide" data-p2run="gap">${IC('gap', 'sm')}Kalıpları boşluk doldurarak çalış</button></section>`;
}
function p2ChkCardHTML() {
  const n = p2chk().t.filter(Boolean).length;
  return `<section class="card p2chkcard"><div class="card-h"><h2>Kontrol listesi</h2><span class="tnum faint" style="font-weight:800" data-chkn>${n}/8</span></div>
    <p class="hint" style="margin-bottom:10px">Bir deneme yazdıktan sonra işaretle; liste her gün sıfırlanır.</p>${p2chkHTML()}
    <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" data-p2run="clock">${IC('clock', 'sm')}105 dakikalık prova</button><button class="btn ghost sm" data-p2run="eye">${IC('eye', 'sm')}Değerlendirici gözü</button></div></section>`;
}

RENDER.p2 = () => {
  const v = $('#v-p2');
  v.innerHTML = `${p2HeroHTML()}
    <section class="p2part"><div class="p2part-h"><h2>Sınavın yapısı</h2><span class="sub">ne, ne kadar, nasıl puanlanır</span></div>${p2FactsHTML()}${p2CritHTML()}</section>
    <section class="p2part"><div class="p2part-h"><h2>Denemenin yapısı</h2><span class="sub">105 dakika boyunca · bir bölüme dokun, kuralı aç</span></div><div class="card p2anatcard">${p2AnatHTML()}</div></section>
    <section class="p2part" id="p2study"><div class="p2part-h"><h2>Çalış</h2><span class="sub">7 yol · notunun satırları kendi tekrar takvimini tutar</span></div><div id="p2studyIn">${p2StudyHTML()}</div></section>
    <section class="p2part" id="p2notebox"><div class="p2part-h"><h2>Not defteri</h2><span class="sub">16 bölümün tamamı · mavi italik = kalıp cümle</span></div><div id="p2noteIn">${p2NoteHTML()}</div></section>
    <section class="p2part grid2 p2two">${p2KalipHTML()}${p2ChkCardHTML()}</section>
    <section class="p2part"><button class="card p2link" data-cat="p" style="${catStyle('p')}"><span class="sw" data-swatch="p" data-w="220" data-h="120" aria-hidden="true"></span><span><b>Karşılaştırma dili</b><small>Sözlükteki 9 Paper 2 terimi: bütünleşik karşılaştırma, kesişir, ayrışır, … iken …</small></span>${IC('chev')}</button></section>
    <p class="p2src">Kaynak: Paper 2 sınav notun (16 bölüm). Puanlama bilgisi IB’nin Mayıs 2026 güncellemesine göre denetlendi.</p>`;
  paintStrips(v); paintSwatches(v); countUps(v); stSpotlight(v);
  p2HeroMount(); p2AnatObserve();
};
function p2refreshStudy() { const b = $('#p2studyIn'); if (b) { b.innerHTML = p2StudyHTML(); stSpotlight($('#v-p2')); } }
function p2refreshNote() { const b = $('#p2noteIn'); if (b) b.innerHTML = p2NoteHTML(); }

/* ---------- anatomi: görünce çizilir ---------- */
function p2AnatObserve() {
  const el = $('#p2anat'); if (!el) return;
  if (motionLevel() < 1 || !('IntersectionObserver' in window)) { el.classList.add('go'); return; }
  const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { el.classList.add('go'); io.disconnect(); } }); }, { threshold: .18 });
  io.observe(el);
}

/* ---------- hero: iki uç, bir tekne ---------- */
const P2HERO = { key: '', url: '', raf: 0 };
function p2HeroOps(w, h) {
  const r = rng(hashStr('p2:iki-uc')), R = Math.sqrt(w * h), ops = [];
  const A = ['#2A44B8', '#0B97A4', '#FFFFFF', '#2468D9', '#9CC3EA', '#1D3290'], B = ['#DD3A2A', '#E09E06', '#FFFFFF', '#D1337C', '#F4B860', '#A3201A'];
  for (let i = 0; i < 11; i++) {
    ops.push(['d', w * (.02 + r() * .42), h * (.06 + r() * .88), R * (.04 + r() * .05), A[i % A.length]]);
    ops.push(['d', w * (.56 + r() * .42), h * (.06 + r() * .88), R * (.04 + r() * .05), B[i % B.length]]);
  }
  const A2 = ['#FFFFFF', '#2A44B8', '#9CC3EA', '#0B97A4', '#FFFFFF', '#1D3290'], B2 = ['#FFFFFF', '#DD3A2A', '#F4B860', '#D1337C', '#FFFFFF', '#A3201A'];
  A2.forEach((c, i) => ops.push(['d', w * .26, h * .5, R * .19 * (1 - i / 6.6), c]));
  B2.forEach((c, i) => ops.push(['d', w * .74, h * .5, R * .19 * (1 - i / 6.6), c]));
  ops.push(['s', w * .08, h * .34, w * .64, h * .34, R * .03]);
  ops.push(['s', w * .92, h * .66, w * .36, h * .66, R * .03]);
  for (let k = 0; k < 5; k++) { const x = w * (.42 + k * .04), up = k % 2; ops.push(['s', x, up ? h * 1.05 : -h * .05, x, up ? -h * .05 : h * 1.05, R * .014]); }
  return ops;
}
function p2HeroMount() {
  const cv = $('#p2cv'); if (!cv) return;
  cancelAnimationFrame(P2HERO.raf);
  const box = cv.parentElement, w = Math.round(box.clientWidth), h = Math.round(box.clientHeight); if (!w || !h) return;
  const dark = document.documentElement.classList.contains('dark'), bg = dark ? '#0D1638' : '#F7F0E0';
  const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const ctx = cv.getContext('2d'), key = w + 'x' + h + (dark ? 'd' : 'l');
  if (P2HERO.key === key && P2HERO.url) { const im = new Image(); im.onload = () => { ctx.drawImage(im, 0, 0, cv.width, cv.height); box.classList.add('done'); }; im.src = P2HERO.url; return; }
  const T = new EB.Tray(w, h, bg); T.res = 5; T.cap = 2600;
  const ops = p2HeroOps(w, h), draw = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); T.render(ctx, dpr, { veinColor: dark ? '#C9D3FF' : '#FFFBF2', veinAlpha: .5 }); };
  const apply = (op, f0, f1) => {
    if (op[0] === 'd') { T.drop(op[1], op[2], op[3], op[4]); return; }
    const [, x0, y0, x1, y1, sig] = op; T.stroke(x0 + (x1 - x0) * f0, y0 + (y1 - y0) * f0, x0 + (x1 - x0) * f1, y0 + (y1 - y0) * f1, sig);
  };
  const finish = () => { draw(); box.classList.add('done'); try { P2HERO.url = cv.toDataURL('image/jpeg', .9); P2HERO.key = key; } catch (e) {} };
  if (motionLevel() < 2) { ops.forEach(op => apply(op, 0, 1)); finish(); return; }
  let i = 0, sub = 0; const SUB = 9;
  const step = () => {
    if (VIEW !== 'p2' || !document.body.contains(cv)) return;
    let budget = 2;
    while (budget-- > 0 && i < ops.length) {
      const op = ops[i];
      if (op[0] === 'd') { apply(op); i++; if (i < ops.length && ops[i][0] !== 'd') break; }
      else { apply(op, sub / SUB, (sub + 1) / SUB); sub++; if (sub >= SUB) { sub = 0; i++; } break; }
    }
    draw();
    if (i < ops.length) P2HERO.raf = requestAnimationFrame(step); else finish();
  };
  P2HERO.raf = requestAnimationFrame(step);
}

/* ---------- olaylar ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-p2mode],[data-p2run],[data-p2sc],[data-p2tab],[data-p2sec],[data-p2chk],[data-p2crit]');
  if (!t) return;
  const d = t.dataset;
  if (d.p2chk !== undefined) { p2chkToggle(+d.p2chk, t); return; }
  if (d.p2mode) { haptic('tap'); stLaunch(d.p2mode, { p2sc: p2sc() }); return; }
  if (d.p2run) { haptic('tap'); p2Run(d.p2run, d.arg); return; }
  if (d.p2sc) { S.p2sc = d.p2sc; touch(); p2refreshStudy(); haptic('tap'); return; }
  if (d.p2tab) { S.p2tab = d.p2tab; touch(); p2refreshNote(); haptic('tap'); return; }
  if (d.p2sec !== undefined) { haptic('tap'); p2SecSheet(+d.p2sec); return; }
  if (d.p2crit) { const box = t.closest('.p2crit'); if (!box) return; box.dataset.mode = d.p2crit; $$('[data-p2crit]', box).forEach(b => b.setAttribute('aria-pressed', String(b === t))); haptic('tap'); }
});
window.addEventListener('resize', () => { clearTimeout(window.__p2rz); window.__p2rz = setTimeout(() => { if (VIEW === 'p2') p2HeroMount(); }, 250); });
