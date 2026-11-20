'use strict';
/* =====================================================================
   TERİM ATÖLYESİ — AKIŞ
   Bütün içerik tam ekran, dikey kaydırılan kartlarda: yeni terimler,
   hızlı sorular, doğru mu, ikizler, yakın okuma, Paper 2 notu, kalıplar,
   değerlendirici gözü, sıralar; araya seri ödülleri, günlük hedef,
   seviye ve ebru molaları girer. Her cevap aralıklı tekrara işlenir.
   ===================================================================== */
const FD = {
  tab: 'mix', cat: null, cards: [], cur: null, sc: null, io: null,
  recent: [], cbs: [], combo: 0, best: 0, ans: 0, ok: 0, xp0: 0, t0: 0, seen: 0,
  from: 'home', nextCalm: 22, raf: 0, intro: new Set(), flags: {}, autoT: 0, lastTap: null, open: false
};
const FD_TABS = [['mix', 'Senin için'], ['terms', 'Terimler'], ['p2', 'Paper 2'], ['due', 'Tekrar']];
const FD_MS = [5, 10, 15, 20, 30, 40, 50, 75, 100];

/* ---------- yardımcılar ---------- */
const fdHandle = c => '@' + PIG[c].n.toLocaleLowerCase('tr-TR').replace(/\s+/g, '');
const fdIdx = card => FD.cards.indexOf(card);
function fdWeighted(W) { const tot = W.reduce((a, w) => a + w[1], 0); if (!tot) return null; let r = Math.random() * tot; for (const w of W) { if ((r -= w[1]) < 0) return w[0]; } return W[W.length - 1][0]; }
function fdRecent(key, n) { return (n ? FD.recent.slice(-n) : FD.recent).includes(key); }
let fdMk = null;
function fdMark(key) { if (!key) return; FD.recent.push(key); if (FD.recent.length > 70) FD.recent.shift(); if (fdMk) fdMk.push(key); }
/* görülmeden atılan kartın izini geri al: önden üretilip hiç izlenmeyen kart "yakın geçmiş" sayılmasın */
function fdUnmark(card) { (card.mk || []).forEach(k => { const i = FD.recent.lastIndexOf(k); if (i >= 0) FD.recent.splice(i, 1); }); card.mk = []; }
function fdLetters(t) {
  const s = String(t);
  if (s.length > 26 || motionLevel() < 2) return `<span class="lw">${s.split(/\s+/).map((w, i) => `<span class="w" style="--i:${i * 3}">${esc(w)}</span>`).join(' ')}</span>`;
  let n = 0;
  return s.split(/\s+/).map(w => `<span class="w">${[...w].map(ch => `<i style="--i:${n++}">${esc(ch)}</i>`).join('')}</span>`).join(' ');
}
function fdWords(t) { let n = 0; return esc(t).split(/(\s+)/).map(w => /^\s+$/.test(w) ? w : `<span class="wd" style="--i:${n++}">${w}</span>`).join(''); }
function fdTerms() { return FD.cat ? BYCAT[FD.cat] : ITEMS; }
function fdFav(card) {
  if (card.it) return !!S.f[card.it.k];
  if (card.p2id) return !!(S.f2 && S.f2[card.p2id]);
  return false;
}
function fdDots(k, fresh) {
  const s = Math.max(0, stageOf(k));
  return `<span class="fd-dots" aria-label="Basamak ${s}/6">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= s ? 'on' : ''} ${fresh && i === s ? 'new' : ''}"></i>`).join('')}</span>`;
}
function fdNextTxt(k) {
  const p = S.p[k]; if (!p) return '';
  if (p.kn) return 'Biliyordum listesinde';
  const d = Math.round((p.d - Date.now()) / DAY);
  return d <= 0 ? 'Bugün yeniden gelecek' : d === 1 ? 'Sonraki tekrar: yarın' : `Sonraki tekrar: ${d} gün sonra`;
}

/* =====================================================================
   KART ÜRETİMİ
   ===================================================================== */
function fdC(kind, o) { return Object.assign({ kind, st: {} }, o || {}); }
function fdTermCard(it, opt) {
  opt = opt || {};
  if (status(it.k) === 'new' && !opt.quiz) return fdC('intro', { it, daily: opt.daily });
  const s = stageOf(it.k);
  let T = s <= 1 ? ['term', 'term', 'tf'] : s === 2 ? ['def', 'ex', 'tf', 'term'] : ['ex', 'en', 'tf', 'def'];
  if (!it.ex || maskTerm(it.ex, it).length < 14) T = T.filter(t => t !== 'ex');
  if (!it.en || norm(it.en) === norm(it.main)) T = T.filter(t => t !== 'en');
  const t = pick(T.length ? T : ['term']);
  return t === 'tf' ? fdC('tf', { it }) : fdC('q', { it, sub: t, daily: opt.daily });
}
function fdGenDueTerm() {
  const L = dueList().filter(x => (!FD.cat || x.c === FD.cat) && !fdRecent('t:' + x.k, 6));
  return L.length ? fdTermCard(L[0]) : null;
}
function fdGenNew() {
  const L = nextNewIn(FD.cat).filter(x => !FD.intro.has(x.k) && !fdRecent('t:' + x.k));
  if (!L.length) return null;
  const it = Math.random() < .7 ? L[0] : pick(L.slice(0, 12));
  return fdTermCard(it);
}
function fdGenFresh() {
  const L = fdTerms().filter(x => status(x.k) !== 'new' && !isDue(x.k) && !fdRecent('t:' + x.k));
  return L.length ? fdTermCard(pick(L), { quiz: 1 }) : null;
}
function fdGenTF() {
  const L = fdTerms().filter(x => !fdRecent('t:' + x.k) && (status(x.k) !== 'new' || FD.intro.has(x.k)));
  const it = L.length ? pick(L) : null;
  return it ? fdC('tf', { it }) : null;
}
function fdGenRead() {
  const L = PASSAGES.filter(p => (!FD.cat || BYK[p.k].c === FD.cat) && !fdRecent('r:' + p.i));
  return L.length ? fdC('read', { pa: pick(L) }) : null;
}
function fdGenTwin() {
  const L = PAIRS.map((p, i) => i).filter(i => !fdRecent('w:' + i) && (!FD.cat || [PAIRS[i][0], PAIRS[i][1]].some(n => { const x = pairItem(n); return x && x.c === FD.cat; })));
  return L.length ? fdC('twin', { pi: pick(L) }) : null;
}
function fdGenP2(dueOnly) {
  const st = p2S(), now = Date.now();
  const pickP2 = (arr, pre) => {
    const ok = arr.filter(x => !fdRecent(pre + x.id, dueOnly ? 6 : 0));
    const due = ok.filter(x => st[x.id] && st[x.id].d <= now); if (due.length) return pick(due);
    if (dueOnly) return null;
    const neu = ok.filter(x => !st[x.id]); if (neu.length && Math.random() < .7) return neu[0];
    return ok.length ? pick(ok) : null;
  };
  const kind = dueOnly ? pick(['p2line', 'p2q']) : fdWeighted([['p2line', 30], ['p2q', 28], ['p2gap', 12], ['p2eye', 12], ['p2order', 9], ['p2crit', 4]]);
  if (kind === 'p2line') { const x = pickP2(P2_CARDS, 'pl:'); return x ? fdC('p2line', { x }) : (dueOnly ? fdGenP2Q(pickP2) : null); }
  if (kind === 'p2q') return fdGenP2Q(pickP2);
  if (kind === 'p2gap') { const L = P2G.filter(g => !fdRecent('pg:' + g.id)); return L.length ? fdC('p2gap', { g: pick(L) }) : null; }
  if (kind === 'p2eye') { const L = P2E.filter(e => !fdRecent('pe:' + e.id)); return L.length ? fdC('p2eye', { e: pick(L) }) : null; }
  if (kind === 'p2order') { const L = P2O.filter(o => !fdRecent('po:' + o.id) && o.steps.length <= 5); return L.length ? fdC('p2order', { o: pick(L) }) : null; }
  return fdRecent('pc:' + ymd()) ? null : fdC('p2crit', { v: pick(['crit', 'time']) });
}
function fdGenP2Q(pickP2) { const x = pickP2(P2Q, 'pq:'); return x ? fdC('p2q', { x }) : null; }
function fdGen() {
  if (FD.tab === 'p2') return fdGenP2(false);
  if (FD.tab === 'due') {
    const W = [['t', dueList().some(x => !FD.cat || x.c === FD.cat) ? 3 : 0], ['p', !FD.cat && p2dueCount() ? 1 : 0]];
    const w = fdWeighted(W);
    const c = w === 't' ? fdGenDueTerm() : w === 'p' ? fdGenP2(true) : null;
    if (c) return c;
    if (!FD.flags.caught) { FD.flags.caught = 1; return fdC('caught'); }
  }
  const hasDue = dueList().some(x => !FD.cat || x.c === FD.cat);
  const W = [['due', hasDue ? 26 : 0], ['new', 18], ['fresh', 14], ['tf', 12], ['read', 9], ['twin', 7]];
  if (FD.tab === 'mix' && !FD.cat) W.push(['p2', p2dueCount() ? 17 : 12]);
  const w = fdWeighted(W);
  return w === 'due' ? fdGenDueTerm() : w === 'new' ? fdGenNew() : w === 'fresh' ? fdGenFresh() : w === 'tf' ? fdGenTF() : w === 'read' ? fdGenRead() : w === 'twin' ? fdGenTwin() : fdGenP2(false);
}
function fdNext() {
  const idx = FD.cards.length;
  const ci = FD.cbs.findIndex(c => c.at <= idx);
  if (ci >= 0) return FD.cbs.splice(ci, 1)[0].card;
  if (idx === 0 && !FD.flags.daily && FD.tab !== 'p2' && FD.tab !== 'due' && !FD.cat) { FD.flags.daily = 1; const it = dayTerm(); return fdTermCard(it, { daily: 1 }); }
  if (idx >= FD.nextCalm) { FD.nextCalm = idx + 24 + (Math.random() * 14 | 0); return fdC('calm'); }
  const last = FD.cards.slice(-2).map(c => c.kind), lastC = FD.cards.length ? FD.cards[FD.cards.length - 1].c : null;
  let c = null;
  for (let t = 0; t < 10; t++) {
    const x = fdGen(); if (!x) continue;
    fdPrep(x);
    if ((t < 6 && last.length && last[last.length - 1] === x.kind) || (t < 9 && last.length === 2 && last[0] === x.kind && last[1] === x.kind) || (t < 5 && x.c && x.c === lastC && FD.tab !== 'p2')) { fdUnmark(x); continue; }
    c = x; break;
  }
  if (!c) { const any = fdGenTF() || fdGenFresh() || fdGenP2(false) || fdC('calm'); c = any; }
  return c;
}

/* ---------- kartı hazırla: renkler, arka plan, başlangıç durumu ---------- */
function fdPrep(card) {
  if (card.ready) return card; card.ready = 1;
  fdMk = card.mk = [];
  const K = card.kind;
  let c = 'p';
  if (card.it) { c = card.it.c; fdMark('t:' + card.it.k); }
  if (card.pa) { c = BYK[card.pa.k].c; fdMark('r:' + card.pa.i); }
  if (card.pi !== undefined) { const A = pairItem(PAIRS[card.pi][0]), B = pairItem(PAIRS[card.pi][1]); c = (A || B || { c: 'p' }).c; card.c2 = (B || A || { c: 'i' }).c; if (card.c2 === c) card.c2 = CAT_KEYS[(CAT_KEYS.indexOf(c) + 6) % CAT_KEYS.length]; fdMark('w:' + card.pi); }
  const p2 = card.x || card.g || card.e || card.o;
  if (p2) { c = P2_SECS[p2.s].ch.pig; card.p2s = p2.s; }
  if (card.x) { card.p2id = card.x.id; fdMark((K === 'p2line' ? 'pl:' : 'pq:') + card.x.id); }
  if (card.g) fdMark('pg:' + card.g.id); if (card.e) fdMark('pe:' + card.e.id); if (card.o) fdMark('po:' + card.o.id);
  if (K === 'p2crit') { c = 'p'; fdMark('pc:' + ymd()); }
  if (K === 'combo') c = pick(['o', 'c', 'd', 'i']);
  if (K === 'goal') c = 's'; if (K === 'level') c = 'e'; if (K === 'caught') c = 's';
  if (K === 'calm') c = pick(CAT_KEYS);
  card.c = c; card.col = PIG[c].h; card.soft = PIG[c].s;
  card.tech = { intro: 'cicek', q: 'tarakli', tf: 'gelgit', twin: 'sal', read: 'battal', p2line: 'tarakli', p2q: 'sal', p2gap: 'gelgit', p2eye: 'battal', p2order: 'tarakli', p2crit: 'sal', combo: 'bulbul', goal: 'hatip', level: 'usta', caught: 'bulbul', calm: 'battal' }[K] || 'gelgit';
  card.seed = hashStr(K + ':' + (card.it ? card.it.k : card.pa ? card.pa.i : card.pi !== undefined ? card.pi : p2 ? p2.id : Math.random())) % 5;
  fdMk = null;
  const M = FDK[K]; if (M.prep) M.prep(card);
  return card;
}
function fdPal(card) {
  const dark = document.documentElement.classList.contains('dark');
  const A = PIG[card.c], B = PIG[card.c2 || CAT_KEYS[(CAT_KEYS.indexOf(card.c) + 4) % CAT_KEYS.length]], C = PIG[CAT_KEYS[(CAT_KEYS.indexOf(card.c) + 9) % CAT_KEYS.length]];
  if (dark) return { bg: '#0B1436', vein: '#C9D3FF', c: [A.h, '#FFFFFF', B.h, A.h, '#0B1436', C.h, A.h, '#1D2A66', B.h] };
  return { bg: '#F7F0E0', vein: '#FFFBF2', c: [A.h, '#FFFFFF', B.h, A.s, A.h, '#F7F0E0', C.h, A.h, B.s] };
}
function fdBgURL(card) {
  const dark = document.documentElement.classList.contains('dark');
  const key = `fd:${card.tech}:${card.c}:${card.c2 || ''}:${card.seed}:${dark ? 'd' : 'l'}`;
  return EB.image(key, card.tech, 300, 540, 4000 + card.seed * 131 + hashStr(card.c), fdPal(card), { cap: 1500 });
}
function fdPaint(card, now) {
  if (!card.el || card.painted) return;
  const run = () => { if (!card.el) return; const url = fdBgURL(card); card.bg = url; card.painted = 1; const i = card.el.querySelector('.fd-bg i'); if (i && url) { i.style.backgroundImage = `url(${url})`; i.classList.add('ok'); } if (card === FD.cur) fdAmbient(card); };
  if (now) run(); else idle(run);
}

/* =====================================================================
   KART TÜRLERİ
   ===================================================================== */
const FD_OPT = (list, st, act, fmt) => `<div class="fd-opts">${list.map((o, i) => `<button class="fd-opt ${st.pick >= 0 ? (o.ok ? 'ok' : st.pick === i ? 'no' : 'dim') : ''}" data-fa="${act}" data-n="${i}" ${st.pick >= 0 ? 'disabled' : ''} style="--j:${i}"><span class="k">${st.pick >= 0 && o.ok ? IC('check', 'sm') : st.pick === i ? IC('x', 'sm') : i + 1}</span><span class="t">${fmt(o)}</span></button>`).join('')}</div>`;
const FD_NEXT = '<span class="fd-next" aria-hidden="true"><svg class="ic sm dn" aria-hidden="true"><use href="#i-chev"/></svg>kaydır</span>';
const FDK = {};

/* ---------- yeni terim ---------- */
FDK.intro = {
  body(card) {
    const it = card.it, st = card.st;
    return `<span class="fd-kick ${card.daily ? 'gold' : ''}">${IC(card.daily ? 'sun' : 'spark', 'sm')}${card.daily ? 'Günün terimi · yeni' : 'Yeni terim'}</span>
      <h2 class="fd-term" aria-label="${esc(it.main)}"><span aria-hidden="true">${fdLetters(it.main)}</span></h2>
      ${it.alts.length > 1 ? `<span class="fd-alt">${esc(it.alts.slice(1).join(' · '))}</span>` : ''}
      <span class="fd-en" lang="en">${esc(it.en)}</span>
      <p class="fd-def">${fdWords(it.m)}</p>
      ${it.ex ? `<blockquote class="fd-ex">${esc(it.ex)}</blockquote>` : ''}
      ${st.dec ? `<p class="fd-done">${IC('check', 'sm')}${st.dec === 'learn' ? 'Tekneye eklendi · birkaç kart sonra sorulacak' : 'Hemen kanıtla: sıradaki kart'}</p>`
        : `<div class="fd-acts"><button class="fd-btn pri" data-fa="learn">${IC('plus', 'sm')}Öğrenmeye ekle</button><button class="fd-btn" data-fa="know">${IC('check', 'sm')}Zaten biliyorum</button></div>`}`;
  },
  say: card => `${card.it.main}. ${card.it.m}`,
  dwell: card => clamp(card.it.m.split(/\s+/).length * 260 + 1600, 4000, 14000),
  act(card, a, t) {
    const it = card.it;
    if (a === 'learn' && !card.st.dec) {
      card.st.dec = 'learn'; FD.intro.add(it.k); learnTerm(it.k, false); addXP(1); touch();
      fdCallback(card, fdC('q', { it, sub: 'term', cb: 1 }), 4 + (Math.random() * 3 | 0));
      splashAt(t, 12, [card.col, '#FFFFFF']); haptic('ok'); sfx('drop');
      fdRebody(card); fdSoon(card, 900); return;
    }
    if (a === 'know' && !card.st.dec) {
      card.st.dec = 'know'; FD.intro.add(it.k);
      fdInsertAfter(card, fdC('q', { it, sub: 'def', proof: 1 }));
      haptic('tap'); fdRebody(card); fdSoon(card, 650);
    }
  },
  off(card) { if (!card.st.dec && !card.st.cb) { card.st.cb = 1; FD.intro.add(card.it.k); fdCallback(card, fdC('q', { it: card.it, sub: 'term', cb: 1 }), 5 + (Math.random() * 3 | 0)); } }
};

/* ---------- hızlı soru (tanım → terim, terim → tanım, örnek, İngilizce) ---------- */
FDK.q = {
  prep(card) { const q = makeQ(card.it, card.sub); card.st.opts = q.options.map(o => ({ x: o.x, ok: o.ok })); card.st.pick = -1; },
  body(card) {
    const it = card.it, st = card.st, sub = card.sub, ans = st.pick >= 0;
    const kick = card.proof ? `${IC('target', 'sm')}Kanıtla` : card.cb ? `${IC('review', 'sm')}Az önce gördün` : card.daily ? `${IC('sun', 'sm')}Günün terimi` : isDue(it.k) ? `${IC('review', 'sm')}Tekrar zamanı` : `${IC('bolt', 'sm')}Hızlı soru`;
    const head = { term: 'Bu tanım hangi terimin?', def: 'Bu terimin tanımı hangisi?', ex: 'Bu örnekte hangi teknik var?', en: 'İngilizcesi bu. Türkçesi hangisi?' }[sub];
    const prompt = sub === 'term' ? `<p class="fd-def big">${fdWords(it.m)}</p>`
      : sub === 'def' ? `<h2 class="fd-term sm" aria-label="${esc(it.main)}"><span aria-hidden="true">${fdLetters(it.main)}</span></h2>`
      : sub === 'ex' ? `<blockquote class="fd-ex big">${esc(maskTerm(it.ex, it))}</blockquote>`
      : `<h2 class="fd-term sm en" lang="en" aria-label="${esc(it.en)}"><span aria-hidden="true">${fdLetters(it.en)}</span></h2>`;
    const fmt = o => esc(sub === 'def' ? shortDef(o.x, 120) : o.x.main);
    let fb = '';
    if (ans) {
      const ok = st.opts[st.pick].ok, other = st.opts[st.pick].x;
      fb = `<div class="fd-fb ${ok ? 'good' : 'bad'}">${ok ? `<b>${IC('check', 'sm')}${esc(card.proof ? 'Kanıtlandı' : pick(['Doğru', 'Tam isabet', 'Aynen öyle', 'Kusursuz']))}</b>` : `<b>${IC('x', 'sm')}Doğrusu: ${esc(it.main)}</b>`}
        ${!ok && other ? `<span>Seçtiğin <em>${esc(other.main)}</em>: ${esc(shortDef(other, 100))}</span>` : sub !== 'term' ? `<span>${esc(shortDef(it, 120))}</span>` : ''}
        <span class="fd-srs">${fdDots(it.k, ok)}<small>${esc(fdNextTxt(it.k))}</small></span></div>${FD_NEXT}`;
    }
    return `<span class="fd-kick">${kick}</span><p class="fd-qh">${head}</p>${prompt}${FD_OPT(st.opts, st, 'opt', fmt)}${fb}`;
  },
  say(card) { const it = card.it; return card.sub === 'term' ? it.m : card.sub === 'def' ? it.main : card.sub === 'ex' ? maskTerm(it.ex, it) : it.en; },
  act(card, a, t) {
    if (a !== 'opt' || card.st.pick >= 0) return;
    const n = +t.dataset.n, o = card.st.opts[n]; if (!o) return;
    card.st.pick = n; const it = card.it, k = it.k, ok = !!o.ok;
    if (card.proof) { if (ok) knowTerm(k); else learnTerm(k, false); }
    else if (card.cb || status(k) === 'new') { learnTerm(k, ok); if (!ok && (card.cbn || 0) < 2) fdCallback(card, fdC('q', { it, sub: 'term', cb: 1, cbn: (card.cbn || 0) + 1 }), 5 + (Math.random() * 3 | 0)); }
    else if (isDue(k)) grade(k, ok);
    else if (!ok) grade(k, false);
    fdScore(card, ok, t, ok ? (card.proof ? 4 : 2) : 0);
    fdRebody(card, true);
  }
};

/* ---------- doğru mu? ---------- */
FDK.tf = {
  prep(card) {
    const it = card.it, truth = Math.random() < .5;
    let other = null; if (!truth) other = distractors(it, 1, { filter: x => x.m !== it.m })[0];
    card.st.truth = truth || !other; card.st.other = other; card.st.pick = -1;
  },
  body(card) {
    const it = card.it, st = card.st, ans = st.pick >= 0;
    const def = st.truth ? it.m : st.other.m;
    const right = ans && ((st.pick === 1) === st.truth);
    let fb = '';
    if (ans) {
      fb = `<div class="fd-fb ${right ? 'good' : 'bad'}"><b>${right ? IC('check', 'sm') : IC('x', 'sm')}${right ? (st.fast ? 'Doğru · ışık hızı' : 'Doğru') : 'Olmadı'}</b>
        ${st.truth ? `<span>Bu tanım gerçekten <em>${esc(it.main)}</em> terimine ait.</span>` : `<span>Bu tanım <em>${esc(st.other.main)}</em> terimine ait. <em>${esc(it.main)}</em>: ${esc(shortDef(it, 110))}</span>`}
        <span class="fd-srs">${fdDots(it.k, right)}<small>${esc(fdNextTxt(it.k))}</small></span></div>${FD_NEXT}`;
    }
    return `<span class="fd-kick">${IC('bolt', 'sm')}Doğru mu?</span>
      <div class="fd-tf ${ans ? 'done ' + (st.pick === 1 ? 'r' : 'l') : ''}" data-tf>
        <span class="stamp ${right ? 'ok' : 'no'}" aria-hidden="true">${ans ? (st.truth ? 'DOĞRU' : 'YANLIŞ') : ''}</span>
        <h2 class="fd-term sm" aria-label="${esc(it.main)}"><span aria-hidden="true">${fdLetters(it.main)}</span></h2>
        <span class="fd-eq" aria-hidden="true">=</span>
        <p class="fd-def">${fdWords(def)}</p>
        ${ans ? '' : '<i class="fd-speed" aria-hidden="true"></i>'}
      </div>
      ${ans ? fb : `<div class="fd-yn"><button class="fd-btn no" data-fa="tf" data-v="0">${IC('x')}Yanlış</button><button class="fd-btn ok" data-fa="tf" data-v="1">${IC('check')}Doğru</button></div><p class="fd-hint">ya da kartı sağa / sola kaydır</p>`}`;
  },
  say(card) { return `${card.it.main}. ${card.st.truth ? card.it.m : card.st.other.m}`; },
  on(card) { card.st.t0 = Date.now(); },
  mount(card, el) { fdBindTF(card, el); },
  act(card, a, t) {
    if (a !== 'tf' || card.st.pick >= 0) return;
    const v = +t.dataset.v, st = card.st, it = card.it, ok = (v === 1) === st.truth;
    st.pick = v; st.fast = ok && st.t0 && Date.now() - st.t0 < 5000;
    if (status(it.k) === 'new') learnTerm(it.k, ok); else if (isDue(it.k)) grade(it.k, ok); else if (!ok) grade(it.k, false);
    fdScore(card, ok, t.closest('.fd-body') ? card.el.querySelector('.fd-tf') : t, ok ? 2 + (st.fast ? 1 : 0) : 0, st.fast ? '⚡ ' : '');
    fdRebody(card, true);
  }
};
function fdBindTF(card, el) {
  const box = el.querySelector('[data-tf]'); if (!box || card.st.pick >= 0) return;
  let p = null;
  box.addEventListener('pointerdown', e => { if (card.st.pick >= 0) return; p = { x: e.clientX, y: e.clientY, id: e.pointerId, dx: 0, lock: 0 }; });
  box.addEventListener('pointermove', e => {
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.lock) { if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) { p.lock = 1; try { box.setPointerCapture(e.pointerId); } catch (er) {} } else if (Math.abs(dy) > 12) { p = null; return; } else return; }
    p.dx = dx; box.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`; box.dataset.lean = dx > 30 ? 'r' : dx < -30 ? 'l' : '';
  });
  const up = e => {
    if (!p || p.id !== e.pointerId) return;
    const dx = p.dx; p = null; box.style.transform = ''; box.dataset.lean = '';
    if (Math.abs(dx) > 90) { const b = card.el.querySelector(`[data-fa="tf"][data-v="${dx > 0 ? 1 : 0}"]`); if (b) FDK.tf.act(card, 'tf', b); }
  };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
}

/* ---------- ikiz terimler ---------- */
FDK.twin = {
  prep(card) {
    const p = PAIRS[card.pi], A = pairItem(p[0]), B = pairItem(p[1]);
    const cand = [['a', A], ['b', B]].filter(([, x]) => x && x.ex && maskTerm(x.ex, x).length > 14);
    const tg = cand.length ? pick(cand) : null;
    card.st = { A, B, tg: tg ? tg[0] : null, pick: -1 };
    if (tg) { let t = maskTerm(tg[1].ex, tg[1]); const o = tg[0] === 'a' ? B : A; if (o) t = maskTerm(t, o); card.st.txt = t; }
  },
  body(card) {
    const p = PAIRS[card.pi], st = card.st, ans = st.pick >= 0;
    const ca = st.A ? PIG[st.A.c].h : card.col, cb = st.B ? PIG[st.B.c].h : PIG[card.c2].h;
    const right = ans && ((st.pick === 0 ? 'a' : 'b') === st.tg);
    const tgt = st.tg === 'a' ? st.A : st.B;
    return `<span class="fd-kick">${IC('twin', 'sm')}İkiz terimler · karıştırma</span>
      <div class="fd-twin"><div class="tw a" style="--tc:${ca}"><b>${esc(p[0])}</b><span>${esc(p[2])}</span></div><span class="vs" aria-hidden="true">≠</span><div class="tw b" style="--tc:${cb}"><b>${esc(p[1])}</b><span>${esc(p[3])}</span></div></div>
      ${st.tg ? `<p class="fd-qh">Bu örnek hangisi?</p><blockquote class="fd-ex">${esc(st.txt)}</blockquote>
        <div class="fd-yn two"><button class="fd-btn ${ans ? (st.tg === 'a' ? 'ok on' : st.pick === 0 ? 'no on' : 'dim') : ''}" data-fa="tw" data-v="0" style="--tc:${ca}" ${ans ? 'disabled' : ''}>${esc(p[0])}</button><button class="fd-btn ${ans ? (st.tg === 'b' ? 'ok on' : st.pick === 1 ? 'no on' : 'dim') : ''}" data-fa="tw" data-v="1" style="--tc:${cb}" ${ans ? 'disabled' : ''}>${esc(p[1])}</button></div>
        ${ans ? `<div class="fd-fb ${right ? 'good' : 'bad'}"><b>${right ? IC('check', 'sm') + 'Ayırdın' : IC('x', 'sm') + 'Bu ' + esc(tgt.main)}</b><span>${esc(shortDef(tgt, 120))}</span></div>${FD_NEXT}` : ''}`
        : (st.seen ? `<p class="fd-done">${IC('check', 'sm')}Ayrım cebinde</p>${FD_NEXT}` : `<div class="fd-acts"><button class="fd-btn pri" data-fa="twok">${IC('check', 'sm')}Ayrımı gördüm</button></div>`)}`;
  },
  say(card) { const p = PAIRS[card.pi]; return `${p[0]}: ${p[2]} ${p[1]}: ${p[3]}`; },
  act(card, a, t) {
    const st = card.st;
    if (a === 'twok' && !st.seen) { st.seen = 1; addXP(1); haptic('ok'); fdRebody(card); fdSoon(card, 900); return; }
    if (a !== 'tw' || st.pick >= 0) return;
    st.pick = +t.dataset.v; const ok = (st.pick === 0 ? 'a' : 'b') === st.tg, it = st.tg === 'a' ? st.A : st.B;
    if (status(it.k) !== 'new') { if (isDue(it.k)) grade(it.k, ok); else if (!ok) grade(it.k, false); }
    fdScore(card, ok, t, ok ? 3 : 0); fdRebody(card, true);
  }
};

/* ---------- yakın okuma ---------- */
FDK.read = {
  prep(card) {
    const P = card.pa, main = BYK[P.k];
    const opts = [{ x: main, ok: 1 }, ...P.dis.map(n => ({ x: BYK[n] || pairItem(n) || { main: n, k: 'x:' + n, m: '' } }))].slice(0, 4);
    card.st = { opts: shuffle(opts), pick: -1 };
  },
  body(card) {
    const P = card.pa, st = card.st, ans = st.pick >= 0, it = BYK[P.k];
    const txt = esc(P.txt).replace(/⟦(.+?)⟧/g, '<mark class="fd-mk">$1</mark>');
    let fb = '';
    if (ans) {
      const ok = st.opts[st.pick].ok;
      fb = `<div class="fd-fb ${ok ? 'good' : 'bad'}"><b>${ok ? IC('check', 'sm') + 'Doğru okudun' : IC('x', 'sm') + 'Doğrusu: ' + esc(it.main)}</b>
        <span class="fd-model"><small>Model cümle</small>${esc(P.kanit)} ${esc(P.teknik)} ${esc(P.etki)}</span>
        <span class="fd-trap"><small>Özet tuzağı · bunu yazma</small><s>${esc(P.ozet)}</s></span></div>${FD_NEXT}`;
    }
    return `<span class="fd-kick">${IC('lens', 'sm')}Yakın okuma · Paper 1</span><p class="fd-pass">${txt}</p><p class="fd-qh">İşaretli yerde hangi teknik var?</p>${FD_OPT(st.opts, st, 'opt', o => esc(o.x.main))}${fb}`;
  },
  say: card => card.pa.txt.replace(/[⟦⟧]/g, ''),
  act(card, a, t) {
    if (a !== 'opt' || card.st.pick >= 0) return;
    const n = +t.dataset.n, o = card.st.opts[n]; if (!o) return;
    card.st.pick = n; const ok = !!o.ok, k = card.pa.k;
    if (status(k) !== 'new') { if (isDue(k)) grade(k, ok); else if (!ok) grade(k, false); }
    fdScore(card, ok, t, ok ? 3 : 0); fdRebody(card, true);
  }
};

/* ---------- Paper 2: not satırı ---------- */
FDK.p2line = {
  prep(card) { card.st.fresh = !p2S()[card.x.id]; card.st.rev = card.st.fresh; },
  body(card) {
    const x = card.x, sec = P2_SECS[x.s], st = card.st;
    const front = x.f ? esc(x.f) : p2fmt(x.k);
    return `<span class="fd-kick hl hl-${sec.hl}"><mark>§${sec.n} · ${esc(sec.t)}</mark></span>
      <h2 class="fd-p2k ${x.warn ? 'warn' : ''}">${front}</h2>
      <span class="fd-arrow" aria-hidden="true"><i></i></span>
      <div class="fd-p2v ${st.rev ? 'open' : ''}">${st.rev ? `<p>${p2fmt(x.v)}</p>` : `<button class="fd-reveal" data-fa="rev">${IC('eye', 'sm')}Önce hatırla, sonra aç</button>`}</div>
      ${st.done ? `<p class="fd-done">${IC('check', 'sm')}${esc(st.done)}</p>${FD_NEXT}`
        : st.rev ? (st.fresh ? `<div class="fd-acts"><button class="fd-btn pri" data-fa="p2ok">${IC('check', 'sm')}Anladım</button></div>`
          : `<div class="fd-yn"><button class="fd-btn" data-fa="p2no">${IC('review', 'sm')}Tekrar gelsin</button><button class="fd-btn ok" data-fa="p2yes">${IC('check', 'sm')}Biliyordum</button></div>`) : ''}`;
  },
  say: card => `${card.x.f || card.x.k}. ${card.x.v}`.replace(/[«»]/g, ''),
  dwell: card => card.st.fresh ? clamp(card.x.v.split(/\s+/).length * 300 + 1800, 3500, 11000) : 0,
  act(card, a, t) {
    const st = card.st, id = card.x.id;
    if (a === 'rev' && !st.rev) { st.rev = 1; haptic('tap'); fdRebody(card); return; }
    if (st.done) return;
    if (a === 'p2ok') { p2soft(id); st.done = 'Not satırı defterinde · yarın yeniden'; addXP(1); fdScoreSoft(card, t, 1); }
    else if (a === 'p2yes') { p2grade(id, true); st.done = 'Kalıcılaşıyor'; fdScore(card, true, t, 2); }
    else if (a === 'p2no') { p2grade(id, false); st.done = 'Yakında yeniden gelecek'; fdScore(card, false, t, 0, '', true); }
    else return;
    touch(); fdRebody(card); fdSoon(card, 1100);
  }
};

/* ---------- Paper 2: yöntem sorusu ---------- */
FDK.p2q = {
  prep(card) { card.st = { opts: shuffle([{ t: card.x.a, ok: 1 }, ...card.x.o.map(t => ({ t }))]), pick: -1, hn: 0 }; },
  body(card) {
    const x = card.x, sec = P2_SECS[x.s], st = card.st, ans = st.pick >= 0;
    const hints = x.h.slice(0, st.hn).map((h, i) => `<span class="fd-hintx"><b>İpucu ${i + 1}</b>${p2fmt(h)}</span>`).join('');
    return `<span class="fd-kick hl hl-${sec.hl}"><mark>Paper 2 · §${sec.n} ${esc(sec.t)}</mark></span>
      <p class="fd-q">${p2fmt(x.q)}</p>
      ${hints ? `<div class="fd-hints">${hints}</div>` : ''}
      ${!ans && st.hn < 2 ? `<button class="fd-chip" data-fa="hint">${IC('spark', 'sm')}İpucu ${st.hn + 1}</button>` : ''}
      ${FD_OPT(st.opts, st, 'opt', o => p2fmt(o.t))}
      ${ans ? `<div class="fd-fb ${st.opts[st.pick].ok ? 'good' : 'bad'}"><b>${st.opts[st.pick].ok ? IC('check', 'sm') + (st.hn ? 'Doğru · ipucuyla' : 'Doğru') : IC('x', 'sm') + 'Yanlış'}</b><span>${p2fmt(x.x)}</span></div>${FD_NEXT}` : ''}`;
  },
  say: card => card.x.q,
  act(card, a, t) {
    const st = card.st;
    if (a === 'hint' && st.pick < 0 && st.hn < 2) { st.hn++; haptic('tap'); sfx('tick'); fdRebody(card); return; }
    if (a !== 'opt' || st.pick >= 0) return;
    const n = +t.dataset.n, o = st.opts[n]; if (!o) return; st.pick = n; const ok = !!o.ok;
    if (ok) { if (st.hn) p2soft(card.x.id); else p2grade(card.x.id, true); } else p2grade(card.x.id, false);
    fdScore(card, ok, t, ok ? [3, 2, 1][st.hn] : 0); fdRebody(card, true);
  }
};

/* ---------- Paper 2: kalıbı tamamla ---------- */
FDK.p2gap = {
  prep(card) { card.st = { opts: shuffle([{ t: card.g.a, ok: 1 }, ...card.g.o.map(t => ({ t }))]), pick: -1 }; },
  body(card) {
    const g = card.g, st = card.st, ans = st.pick >= 0, ok = ans && st.opts[st.pick].ok;
    const slot = ans ? `<span class="gapslot fill ${ok ? 'ok' : 'rev'}">${esc(g.a)}</span>` : '<span class="gapslot">…</span>';
    return `<span class="fd-kick">${IC('gap', 'sm')}Kalıbı tamamla · Paper 2</span>
      <p class="fd-kalip"><span class="kq">«</span>${g.pre ? esc(g.pre) + ' ' : ''}${slot}${g.post ? ' ' + esc(g.post) : ''}<span class="kq">»</span></p>
      <div class="fd-chips">${st.opts.map((o, i) => `<button class="fd-ch ${ans ? (o.ok ? 'ok' : st.pick === i ? 'no' : 'dim') : ''}" data-fa="opt" data-n="${i}" ${ans ? 'disabled' : ''} style="--j:${i}">${esc(o.t)}</button>`).join('')}</div>
      ${ans ? `<div class="fd-fb ${ok ? 'good' : 'bad'}"><b>${ok ? IC('check', 'sm') + 'Kalıp yerinde' : IC('x', 'sm') + 'Doğrusu: ' + esc(g.a)}</b><span>${p2fmt(g.x)}</span></div>${FD_NEXT}` : ''}`;
  },
  say: card => `${card.g.pre} … ${card.g.post}`,
  act(card, a, t) {
    const st = card.st; if (a !== 'opt' || st.pick >= 0) return;
    const n = +t.dataset.n, o = st.opts[n]; if (!o) return; st.pick = n;
    fdScore(card, !!o.ok, t, o.ok ? 2 : 0); fdRebody(card, true);
  }
};

/* ---------- Paper 2: değerlendirici gözü ---------- */
FDK.p2eye = {
  prep(card) { card.st = { opts: shuffle([{ t: card.e.a, ok: 1 }, ...card.e.o.map(t => ({ t }))]), pick: -1 }; },
  body(card) {
    const e = card.e, st = card.st, ans = st.pick >= 0, ok = ans && st.opts[st.pick].ok;
    return `<span class="fd-kick">${IC('eye', 'sm')}Değerlendirici gözü</span>
      ${e.ctx ? `<p class="fd-ctx">${p2fmt(e.ctx)}</p>` : ''}
      <div class="stud fd-stud ${ans ? 'marked' : ''}"><span class="stud-l">Öğrenci kâğıdı</span><p>${p2fmt(e.txt)}</p><svg class="redmark" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 30 C 70 18, 150 36, 296 14"/></svg></div>
      <p class="fd-qh">Değerlendirici burada neyi görür?</p>
      ${FD_OPT(st.opts, st, 'opt', o => p2fmt(o.t))}
      ${ans ? `<div class="fd-fb ${ok ? 'good' : 'bad'}"><b>${ok ? IC('check', 'sm') + 'Kırmızı kalem sende' : IC('x', 'sm') + 'Başka bir şey'}</b><span>${p2fmt(e.x)}</span><span class="fd-fix"><small>${IC('pen', 'sm')}Daha iyisi</small>${p2fmt(e.fix)}</span></div>${FD_NEXT}` : ''}`;
  },
  say: card => card.e.txt,
  act(card, a, t) {
    const st = card.st; if (a !== 'opt' || st.pick >= 0) return;
    const n = +t.dataset.n, o = st.opts[n]; if (!o) return; st.pick = n;
    fdScore(card, !!o.ok, t, o.ok ? 3 : 0); fdRebody(card, true);
  }
};

/* ---------- Paper 2: sırala ---------- */
FDK.p2order = {
  prep(card) { let ch = card.o.steps.map((t, r) => ({ t, r })); for (let k = 0; k < 6; k++) { ch = shuffle(ch); if (ch.some((x, i) => x.r !== i)) break; } card.st = { ch, got: 0, err: 0 }; },
  body(card) {
    const o = card.o, st = card.st, done = st.got === o.steps.length;
    return `<span class="fd-kick">${IC('chain', 'sm')}Sırala · Paper 2</span><h2 class="fd-p2k sm">${esc(o.t)}</h2>
      <ol class="fd-slots">${o.steps.map((s, i) => `<li class="${i < st.got ? 'got' : ''} ${i === st.got && !done ? 'nx' : ''}" style="--j:${i}"><b>${i + 1}</b><span>${i < st.got ? p2fmt(s) : ''}</span></li>`).join('')}</ol>
      ${done ? `<div class="fd-fb ${st.err ? 'bad' : 'good'}"><b>${st.err ? IC('review', 'sm') + st.err + ' hatalı dokunuş' : IC('check', 'sm') + 'Hatasız'}</b><span>${p2fmt(o.x)}</span></div>${FD_NEXT}`
        : `<div class="fd-chips col">${st.ch.map((x, i) => x.r < st.got ? '' : `<button class="fd-ch" data-fa="ord" data-n="${i}" style="--j:${i}">${p2fmt(x.t)}</button>`).join('')}</div>`}`;
  },
  say: card => card.o.t,
  act(card, a, t) {
    const st = card.st, o = card.o; if (a !== 'ord' || st.got === o.steps.length) return;
    const x = st.ch[+t.dataset.n]; if (!x) return;
    if (x.r === st.got) {
      st.got++; haptic('ok'); sfx('tick');
      if (st.got === o.steps.length) { fdScore(card, !st.err, card.el.querySelector('.fd-slots'), st.err ? 1 : 4); }
      fdRebody(card, st.got === o.steps.length);
    } else { st.err++; haptic('no'); sfx('no'); shake(t); if (st.err === 1) { FD.combo = 0; fdHud(); } }
  }
};

/* ---------- Paper 2: ölçütler / 105 dakika ---------- */
FDK.p2crit = {
  body(card) {
    if (card.v === 'time') return `<span class="fd-kick">${IC('clock', 'sm')}Paper 2 · 105 dakika</span><h2 class="fd-p2k">Saat elinde</h2>
      <div class="fd-time">${P2_ANAT.map((a, i) => `<span style="--j:${i};--w:${a.b - a.a};--c:${P2_PHASES[i].col}"><b>${esc(a.t)}</b><small class="tnum">${a.a}–${a.b}</small></span>`).join('')}</div>
      <p class="fd-def">Eşit süre = eşit derinlik. İlk 12 dakika plan; 3 blok × 20 dakika; son 13 dakika sonuç ve kontrol.</p>${FD_NEXT}`;
    return `<span class="fd-kick">${IC('target', 'sm')}Paper 2 · puanlama</span><h2 class="fd-p2k">25 puan, 5 ölçüt</h2>
      <div class="fd-crit">${P2_CRIT.map((c, i) => `<span style="--j:${i};--c:${c.col}"><b>${c.k}</b><small>${esc(c.n)}</small></span>`).join('')}</div>
      <p class="fd-def">Mayıs 2026’dan beri her ölçüt 5 puan. Karşılaştırma yalnız <b>B2</b>’de puanlanır; eski örnekler 30 üzerinden.</p>${FD_NEXT}`;
  },
  say: card => card.v === 'time' ? 'Paper 2, 105 dakika. İlk 12 dakika plan, sonra giriş, üç blok, sonuç ve kontrol.' : 'Paper 2, 25 puan, beş ölçüt. Karşılaştırma yalnız B2 ölçütünde puanlanır.',
  dwell: () => 6500
};

/* ---------- ödüller ---------- */
FDK.combo = {
  body(card) { return `<div class="fd-reward"><span class="fd-kick gold">${IC('flame', 'sm')}Seri</span><canvas class="fd-bloom" aria-hidden="true"></canvas><b class="fd-big tnum">×${card.n}</b><p class="fd-def">${card.n} doğru üst üste. ${card.n >= 20 ? 'Bu artık bir akış hâli.' : card.n >= 10 ? 'Tekne ısınıyor.' : 'Ritmi yakaladın.'}</p><span class="fd-bonus">+${card.bonus} XP seri bonusu</span></div>${FD_NEXT}`; },
  say: card => `Seri. ${card.n} doğru üst üste.`,
  dwell: () => 3800,
  on(card) { if (!card.st.paid) { card.st.paid = 1; addXP(card.bonus); updateTop(); } confetti(motionLevel() > 1 ? 140 : 40); sfx('win'); haptic('big'); fdBloom(card); },
  off(card) { cancelAnimationFrame(card.st.raf); }
};
FDK.goal = {
  body() { const g = S.pref.goal || 150, C = 2 * Math.PI * 54; return `<div class="fd-reward"><span class="fd-kick gold">${IC('target', 'sm')}Günlük hedef</span><div class="fd-ring"><svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="54"/><circle class="val" cx="60" cy="60" r="54" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/></svg><b class="tnum">${g}</b><small>XP</small></div><p class="fd-def">Bugünün hedefi tamam. Seri: <b>${streak()} gün</b>.</p></div>${FD_NEXT}`; },
  say: () => 'Günlük hedef tamam.',
  dwell: () => 3800,
  on(card) { const v = card.el.querySelector('.fd-ring .val'); if (v) requestAnimationFrame(() => { v.style.strokeDashoffset = '0'; }); if (!card.st.c) { card.st.c = 1; confetti(110); sfx('win'); haptic('big'); } }
};
FDK.level = {
  body() { const L = levelInfo(); return `<div class="fd-reward"><span class="fd-kick gold">${IC('comb', 'sm')}Sonraki teknik</span><h2 class="fd-p2k">${esc(L.N ? L.N.e : L.L.e)}</h2><div class="fd-bar"><i style="--p:${Math.round(L.pct * 100)}%"></i></div><p class="fd-def tnum">${L.N ? `${L.left} XP kaldı · ${esc(L.N.t)} unvanı seni bekliyor.` : 'Bütün teknikler açık.'}</p></div>${FD_NEXT}`; },
  say: () => { const L = levelInfo(); return L.N ? `Sonraki teknik ${L.N.e}. ${L.left} XP kaldı.` : ''; },
  dwell: () => 3800,
  on(card) { const b = card.el.querySelector('.fd-bar'); if (b) b.classList.add('go'); }
};
FDK.caught = {
  body() { return `<div class="fd-reward"><span class="fd-check" aria-hidden="true">${IC('check')}</span><h2 class="fd-p2k">Tekrarın bitti</h2><p class="fd-def">Bugün sorulması gereken her şey soruldu. Akış şimdi “Senin için”e geçiyor.</p></div>${FD_NEXT}`; },
  say: () => 'Tekrarın bitti.',
  dwell: () => 3200,
  on() { if (FD.tab === 'due') { FD.tab = 'mix'; fdTabsUI(); } confetti(90); sfx('win'); }
};
FDK.calm = {
  body() { return `<div class="fd-calm"><canvas class="fd-calm-cv" aria-label="Ebru teknesi: dokun, boya damlat; sürükle, bızla çiz"></canvas><div class="fd-calm-t"><span class="fd-kick gold">${IC('comb', 'sm')}Ebru molası</span><h2>Nefes al.</h2><p>Dokun: boya damlat · Sürükle: bızla çiz</p></div></div>${FD_NEXT}`; },
  say: () => '',
  on(card) { fdCalmMount(card); },
  off(card) { cancelAnimationFrame(card.st.raf); }
};

/* =====================================================================
   PUANLAMA, ÖDÜL, GERİ ÇAĞIRMA
   ===================================================================== */
function fdScore(card, ok, src, xp, pre, quiet) {
  FD.ans++; countAnswer(ok);
  if (ok) {
    FD.ok++; FD.combo++; FD.best = Math.max(FD.best, FD.combo);
    if (xp) addXP(xp);
    sfx('ok'); haptic('ok');
    if (src) { splashAt(src, motionLevel() > 1 ? 18 : 6, [card.col, '#FFFFFF', PIG[card.c2 || 'd'].h]); if (xp) flyTo(src, $('#fdXP'), `${pre || ''}+${xp} XP`, 'xp'); }
    if (FD_MS.includes(FD.combo)) fdInsertAfter(card, fdPrep(fdC('combo', { n: FD.combo, bonus: FD.combo >= 20 ? 10 : 5 })));
  } else {
    const had = FD.combo; FD.combo = 0;
    if (!quiet) { sfx('no'); haptic('no'); if (src) shake(src); }
    if (had >= 5) toast(`Seri ×${had} bitti · yeniden başla`);
  }
  fdGoalCheck(card); fdHud(); updateTop(); touch();
  card.answered = 1;
  if (S.pref.fauto) fdSoon(card, ok ? 1700 : 3200);
}
function fdScoreSoft(card, src, xp) { if (src && xp) flyTo(src, $('#fdXP'), `+${xp} XP`, 'xp'); fdHud(); updateTop(); }
function fdGoalCheck(card) {
  const g = S.pref.goal || 150;
  if (!FD.flags.goal && todayXP() >= g && FD.flags.goalFrom < g) { FD.flags.goal = 1; fdInsertAfter(card, fdPrep(fdC('goal'))); }
  const L = levelInfo();
  if (!FD.flags.level && L.N && L.left <= 60 && L.left > 0) { FD.flags.level = 1; fdCallback(card, fdC('level'), 3); }
}
function fdCallback(card, nc, gap) { const i = fdIdx(card); FD.cbs.push({ at: (i < 0 ? FD.cards.length : i) + gap, card: nc }); }

/* =====================================================================
   DOM: slaytlar, gözlem, etkinleştirme
   ===================================================================== */
function fdCapHTML(card) {
  const c = card.c, tags = [];
  const K = card.kind;
  if (card.it) { const s = status(card.it.k); tags.push(s === 'new' ? '#yeni' : isDue(card.it.k) ? '#tekrar' : s === 'learn' ? '#öğreniliyor' : '#kalıcı'); tags.push('#' + (SHELVES.find(x => x.cats.includes(c)) || { k: '' }).k); }
  if (K === 'read') tags.push('#yakınokuma', '#paper1'); if (K === 'twin') tags.push('#ikiz', '#karıştırma');
  if (/^p2/.test(K)) tags.push('#paper2', K === 'p2gap' ? '#kalıp' : K === 'p2eye' ? '#değerlendirici' : K === 'p2order' ? '#sıra' : '#yöntem');
  if (['combo', 'goal', 'level', 'caught', 'calm'].includes(K)) tags.push('#mola', '#ödül');
  const name = /^p2/.test(K) ? '@paper2' : fdHandle(c);
  const sub = /^p2/.test(K) && card.p2s !== undefined ? P2_SECS[card.p2s].t : card.it ? CATS[card.it.c] : card.pa ? CATS[BYK[card.pa.k].c] : card.pi !== undefined ? 'Sık karıştırılan çiftler' : 'Terim Atölyesi';
  return `<span class="fd-av" style="--cc:${card.col}" data-swatch="${c}" data-w="64" data-h="64" aria-hidden="true"></span><span class="fd-ct"><b>${esc(name)}</b><small>${esc(sub)}</small><em>${esc(tags.join(' '))}</em></span>`;
}
function fdRailHTML(card) {
  const fav = fdFav(card), canLike = !!(card.it || card.p2id), more = !!(card.it || card.pa || card.p2s !== undefined || card.pi !== undefined);
  return `${canLike ? `<button class="fd-rb like ${fav ? 'on' : ''}" data-fa="like" aria-pressed="${fav}" aria-label="Kaydet">${IC('heart')}<span>${fav ? 'Kayıtlı' : 'Kaydet'}</span></button>` : ''}
    <button class="fd-rb" data-fa="say" aria-label="Dinle">${IC('speak')}<span>Dinle</span></button>
    ${more ? `<button class="fd-rb" data-fa="more" aria-label="Ayrıntı">${IC('book')}<span>Ayrıntı</span></button>` : ''}
    <button class="fd-disc" data-fa="chan" aria-label="${/^p2/.test(card.kind) ? 'Paper 2 akışı' : esc(PIG[card.c].n) + ' kanalı'}"><i data-swatch="${card.c}" data-w="96" data-h="96"></i></button>`;
}
function fdInner(card) {
  const M = FDK[card.kind];
  return `<div class="fd-stage"><div class="fd-frame">
      <div class="fd-bg" aria-hidden="true"><i ${card.bg ? `class="ok" style="background-image:url(${card.bg})"` : ''}></i></div><div class="fd-veil" aria-hidden="true"></div>
      <div class="fd-body-w"><div class="fd-body">${M.body(card)}</div></div>
      <div class="fd-cap">${fdCapHTML(card)}</div>
      <div class="fd-prog" aria-hidden="true"><i></i></div>
    </div><aside class="fd-rail">${fdRailHTML(card)}</aside></div>`;
}
function fdSlideEl(card) {
  const el = document.createElement('article');
  el.className = `fd-slide k-${card.kind}`; el.setAttribute('aria-roledescription', 'kart');
  el.style.cssText = `--cc:${card.col};--cs:${card.soft};--c2:${PIG[card.c2 || card.c].h}`;
  el._card = card; card.el = el; el.innerHTML = fdInner(card);
  return el;
}
function fdMount(card) {
  const el = card.el, M = FDK[card.kind];
  paintSwatches(el);
  if (M.mount) M.mount(card, el);
  if (card.painted && card.bg) { const i = el.querySelector('.fd-bg i'); if (i) { i.style.backgroundImage = `url(${card.bg})`; i.classList.add('ok'); } }
}
function fdRebody(card, answered) {
  if (!card.el) return;
  const b = card.el.querySelector('.fd-body'); if (!b) return;
  b.classList.remove('enter'); b.innerHTML = FDK[card.kind].body(card);
  if (answered) { b.classList.add('ans'); card.el.classList.add('go'); }
  const M = FDK[card.kind]; if (M.mount) M.mount(card, card.el);
  const r = card.el.querySelector('.fd-rail'); if (r && answered) { r.innerHTML = fdRailHTML(card); paintSwatches(r); }
  fdFit(card);
}
function fdFit(card) {
  const w = card.el && card.el.querySelector('.fd-body-w'), b = w && w.querySelector('.fd-body'); if (!b) return;
  b.style.removeProperty('--fit');
  const avail = w.clientHeight, need = b.scrollHeight;
  if (avail && need > avail) b.style.setProperty('--fit', Math.max(.78, avail / need).toFixed(3));
}
function fdAppend(n) {
  const sc = FD.sc; if (!sc) return;
  for (let j = 0; j < n; j++) {
    const card = fdPrep(fdNext()); FD.cards.push(card);
    const el = fdSlideEl(card); sc.appendChild(el); fdMount(card); FD.io.observe(el);
  }
}
function fdInsertAfter(ref, card) {
  fdPrep(card);
  const i = fdIdx(ref); if (i < 0) { FD.cbs.push({ at: FD.cards.length, card }); return; }
  FD.cards.splice(i + 1, 0, card);
  const el = fdSlideEl(card); ref.el.after(el); fdMount(card); FD.io.observe(el); fdPaint(card);
}
function fdSoon(card, ms) {
  clearTimeout(FD.autoT);
  FD.autoT = setTimeout(() => { if (FD.cur === card && VIEW === 'feed') fdGo(1); }, ms);
}
function fdGo(d) {
  const sc = FD.sc; if (!sc) return;
  const i = fdIdx(FD.cur), t = FD.cards[clamp(i + d, 0, FD.cards.length - 1)];
  if (!t || !t.el) return;
  sc.scrollTo({ top: t.el.offsetTop, behavior: motionLevel() ? 'smooth' : 'auto' });
}
function fdObserve() {
  FD.io = new IntersectionObserver(es => {
    es.forEach(e => {
      const card = e.target._card; if (!card) return;
      const r = e.intersectionRatio;
      if (e.isIntersecting && r >= .1 && !e.target.classList.contains('in')) fdEnter(card);
      if (r >= .6) fdActivate(card);
      if (!e.isIntersecting) { e.target.classList.remove('in'); }
    });
  }, { root: FD.sc, threshold: [0, .1, .6] });
}
function fdEnter(card) {
  const el = card.el; if (!el) return;
  if (el.classList.contains('dry')) { el.classList.remove('dry'); el.innerHTML = fdInner(card); fdMount(card); }
  el.classList.add('in');
  const b = el.querySelector('.fd-body'); if (b && !card.answered) { b.classList.remove('enter'); void b.offsetWidth; b.classList.add('enter'); }
  fdPaint(card, true); fdFit(card);
}
function fdActivate(card) {
  if (FD.cur === card) return;
  const prev = FD.cur;
  if (prev && prev.el) { prev.el.classList.remove('on'); const M0 = FDK[prev.kind]; if (M0.off) try { M0.off(prev); } catch (e) {} }
  clearTimeout(FD.autoT); hush();
  FD.cur = card; const el = card.el, M = FDK[card.kind], i = fdIdx(card);
  if (el.classList.contains('dry')) fdEnter(card);
  el.classList.add('on', 'in');
  if (!card.vis) { card.vis = 1; FD.seen++; }
  if (prev) { haptic('tap'); if (S.pref.sound && S.pref.ftick !== 0) sfx('tick'); }
  fdAmbient(card); fdHud();
  const pr = el.querySelector('.fd-prog i'), dw = M.dwell ? M.dwell(card) : 0;
  el.classList.toggle('dw', !!dw);
  if (pr) { pr.style.animation = 'none'; void pr.offsetWidth; pr.style.animation = ''; pr.style.setProperty('--dw', (dw || 1) + 'ms'); pr.onanimationend = () => { el.classList.add('go'); if (S.pref.fauto && FD.cur === card && !/^(intro|q|tf|twin|read|p2q|p2gap|p2eye|p2order|calm)$/.test(card.kind)) fdGo(1); }; }
  if (M.on) try { M.on(card, el); } catch (e) { console.error(e); }
  if (S.pref.fvoice && M.say) { const t = M.say(card); if (t) setTimeout(() => { if (FD.cur === card) speak(t); }, 380); }
  if (i >= FD.cards.length - 4) fdAppend(6);
  for (let j = i + 1; j <= i + 3 && j < FD.cards.length; j++) fdPaint(FD.cards[j]);
  FD.cards.forEach((c, j) => { if (c.el && Math.abs(j - i) > 12 && !c.el.classList.contains('dry')) { c.el.classList.add('dry'); c.el.classList.remove('in', 'on'); c.el.innerHTML = ''; } });
  if (i > 0) fdCoachOff();
  announce(`${i + 1}. kart`);
}

/* ---------- kaydırmaya bağlı paralaks ---------- */
function fdScroll() {
  if (FD.raf) return;
  FD.raf = requestAnimationFrame(() => {
    FD.raf = 0; const sc = FD.sc; if (!sc || motionLevel() < 2) return;
    const H = sc.clientHeight, top = sc.scrollTop, i = Math.max(0, fdIdx(FD.cur));
    for (let j = Math.max(0, i - 1); j <= Math.min(FD.cards.length - 1, i + 1); j++) {
      const el = FD.cards[j].el; if (!el) continue;
      const o = clamp((el.offsetTop - top) / H, -1, 1);
      el.style.setProperty('--o', o.toFixed(4)); el.style.setProperty('--ao', Math.abs(o).toFixed(4));
    }
  });
}

/* ---------- üst çubuk, sayaçlar, ortam ışığı ---------- */
function fdHud() {
  const c = $('#fdCombo'); if (c) { c.hidden = FD.combo < 2; c.querySelector('b').textContent = '×' + FD.combo; c.style.setProperty('--h', Math.min(1, FD.combo / 20)); if (FD.combo >= 2) bump(c); }
  const x = $('#fdXPn'); if (x) x.textContent = '+' + (S.xp - FD.xp0);
  const n = $('#fdN'); if (n) n.textContent = FD.seen;
}
function fdTabsUI() {
  $$('#v-feed [data-ftab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ftab === FD.tab)));
  const ind = $('#fdTabInd'), cur = $(`#v-feed [data-ftab="${FD.tab}"]`);
  if (ind && cur) { ind.style.width = cur.offsetWidth + 'px'; ind.style.transform = `translateX(${cur.offsetLeft}px)`; }
  const ch = $('#fdChan'); if (ch) { ch.hidden = !FD.cat; if (FD.cat) { ch.style.setProperty('--cc', PIG[FD.cat].h); ch.querySelector('span').textContent = PIG[FD.cat].n + ' kanalı'; } }
  const v = $('#fdVoice'); if (v) { v.setAttribute('aria-pressed', String(!!S.pref.fvoice)); v.innerHTML = IC(S.pref.fvoice ? 'speak' : 'mute'); }
}
let FD_AMB = 0;
function fdAmbient(card) {
  const a = $('#fdAmb'); if (!a || !card.bg) return;
  const ls = a.children, nx = ls[FD_AMB ^ 1], cu = ls[FD_AMB];
  if (!nx) return;
  nx.style.backgroundImage = `url(${card.bg})`; nx.classList.add('on'); cu.classList.remove('on'); FD_AMB ^= 1;
}

/* ---------- ebru molası ve seri çiçeği ---------- */
function fdCalmMount(card) {
  const cv = card.el && card.el.querySelector('.fd-calm-cv'); if (!cv) return;
  const r = cv.getBoundingClientRect(); if (!r.width) return;
  const k = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k);
  const W = 600, H = Math.round(600 * r.height / r.width), pal = fdPal(card);
  const T = card.st.T || (card.st.T = EB.compose(pick(['battal', 'gelgit', 'bulbul']), W, H, hashStr('calm' + Math.random()), pal, { cap: 2400, res: 5 }));
  const ctx = cv.getContext('2d'), sc = cv.width / W;
  const draw = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); T.render(ctx, sc, { veinColor: pal.vein, veinAlpha: .55, veinW: 1.2 }); };
  draw();
  if (card.st.bound) return; card.st.bound = 1;
  const toW = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; };
  let p = null;
  cv.addEventListener('pointerdown', e => { const [x, y] = toW(e); p = { x, y, x0: x, y0: y, m: 0, id: e.pointerId, t: Date.now() }; });
  cv.addEventListener('pointermove', e => {
    if (!p || p.id !== e.pointerId) return;
    const [x, y] = toW(e), dx = x - p.x, dy = y - p.y, L = Math.hypot(dx, dy); if (L < 2) return;
    if (!p.lock) { if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) { p.lock = 1; try { cv.setPointerCapture(e.pointerId); } catch (er) {} } else if (Math.abs(dy) > 10) { p = null; return; } }
    if (!p.lock) return;
    p.m += L; const st = Math.ceil(L / 7);
    for (let s = 0; s < st; s++) { const cx = p.x + dx * s / st, cy = p.y + dy * s / st; T.each(q => pushLocal(q, cx, cy, dx / st * .9, dy / st * .9, 26)); }
    if ((p.n = (p.n || 0) + 1) % 4 === 0) T.refineAll();
    draw(); p.x = x; p.y = y; e.preventDefault();
  });
  const up = e => {
    if (!p || p.id !== e.pointerId) return; const q = p; p = null;
    if (q.m <= 10 && Date.now() - q.t < 500) {
      const c = pick(pal.c.filter(x => x !== pal.bg)), R = 30 + Math.random() * 34; let r0 = 0; const t0 = performance.now(), snap = T.snapshot();
      const step = now => { const e2 = clamp((now - t0) / 700, 0, 1), rr = R * (1 - Math.pow(1 - e2, 3)); T.restore(snap); T.drop(q.x0, q.y0, Math.max(1, rr), c, 48); draw(); if (e2 < 1) card.st.raf = requestAnimationFrame(step); };
      if (motionLevel() > 1) card.st.raf = requestAnimationFrame(step); else { T.drop(q.x0, q.y0, R, c, 48); draw(); }
      haptic('tap'); sfx('drop'); r0++;
    } else { T.refineAll(); draw(); }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.style.touchAction = 'pan-y';
}
function fdBloom(card) {
  const cv = card.el && card.el.querySelector('.fd-bloom'); if (!cv) return;
  const r = cv.getBoundingClientRect(); if (!r.width) return;
  const k = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k);
  const W = 300, H = Math.round(300 * r.height / r.width), T = new EB.Tray(W, H, 'rgba(0,0,0,0)'); T.res = 3.5; T.cap = 1800;
  const ctx = cv.getContext('2d'), sc = cv.width / W, cx = W / 2, cy = H / 2, R = Math.min(W, H) * .32;
  const cols = [card.col, '#FFFFFF', PIG.d.h, PIG.o.h, '#FFFFFF', card.col];
  const ops = cols.map((c, i) => ['d', R * (1 - i / 6.6), c]);
  for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2 - Math.PI / 2; ops.push(['s', cx + Math.cos(a) * R * 1.35, cy + Math.sin(a) * R * 1.35, cx + Math.cos(a) * R * .3, cy + Math.sin(a) * R * .3]); }
  const draw = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); T.render(ctx, sc, { veinColor: '#FFFFFF', veinAlpha: .6 }); };
  if (motionLevel() < 2) { ops.forEach(o => o[0] === 'd' ? T.drop(cx, cy, o[1], o[2], 96) : T.stroke(o[1], o[2], o[3], o[4], R * .2)); draw(); return; }
  let i = 0, sub = 0;
  const step = () => {
    if (FD.cur !== card) return;
    const o = ops[i];
    if (o[0] === 'd') { T.drop(cx, cy, o[1], o[2], 96); i++; }
    else { const f0 = sub / 6, f1 = (sub + 1) / 6; T.stroke(o[1] + (o[3] - o[1]) * f0, o[2] + (o[4] - o[2]) * f0, o[1] + (o[3] - o[1]) * f1, o[2] + (o[4] - o[2]) * f1, R * .2); if (++sub >= 6) { sub = 0; i++; } }
    draw(); if (i < ops.length) card.st.raf = requestAnimationFrame(step);
  };
  card.st.raf = requestAnimationFrame(step);
}

/* ---------- çift dokun: kaydet ---------- */
function fdLike(card, x, y, force) {
  let on;
  if (card.it) { const k = card.it.k; on = force ? true : !S.f[k]; if (on) S.f[k] = 1; else delete S.f[k]; }
  else if (card.p2id) { S.f2 = S.f2 || {}; on = force ? true : !S.f2[card.p2id]; if (on) S.f2[card.p2id] = 1; else delete S.f2[card.p2id]; }
  else return;
  touch();
  const b = card.el.querySelector('[data-fa="like"]'); if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.querySelector('span').textContent = on ? 'Kayıtlı' : 'Kaydet'; if (on) bump(b); }
  if (on) {
    haptic('ok'); sfx('drop');
    if (x !== undefined) {
      const h = document.createElement('div'); h.className = 'fd-heart'; h.innerHTML = IC('heart'); h.style.left = x + 'px'; h.style.top = y + 'px'; h.style.setProperty('--r', (Math.random() * 30 - 15).toFixed(1) + 'deg');
      $('#v-feed').appendChild(h); setTimeout(() => h.remove(), 1100);
      splash(x, y, motionLevel() > 1 ? 22 : 6, ['#FF3B6B', '#FFFFFF', card.col, '#FFC24D']);
    } else if (b) splashAt(b, 12, ['#FF3B6B', '#FFFFFF']);
    if (card.it && !FD.flags.likeTip) { FD.flags.likeTip = 1; toast('Yıldızlılara eklendi · Stüdyo’da “Yıldızlılar” setiyle çalışabilirsin'); }
  }
}

/* ---------- ilk açılış ipucu ---------- */
/* ilk açılışta: günün kartını atlamadan, alttaki kartı bir an gösterip geri yaylanan "kaydır" ipucu */
function fdPeek() {
  const sc = FD.sc; if (!sc || !motionLevel()) return;
  setTimeout(() => { sc.classList.remove('peek'); void sc.offsetWidth; sc.classList.add('peek'); haptic('tap'); setTimeout(() => sc.classList.remove('peek'), 1300); }, 380);
}
function fdCoachOff() { const c = $('#fdCoach'); if (c && !c.hidden) { c.classList.add('out'); setTimeout(() => { c.hidden = true; }, 350); S.pref.fcoach = 1; touch(); } }

/* =====================================================================
   SAYFA
   ===================================================================== */
RENDER.feed = opt => {
  opt = opt || {};
  const v = $('#v-feed');
  if (opt.tab) FD.tab = opt.tab; else if (!opt.keep) FD.tab = 'mix';
  if (opt.cat !== undefined) FD.cat = opt.cat; else if (!opt.keep) FD.cat = null;
  FD.cards.forEach(c => { if (!c.vis) fdUnmark(c); });
  FD.cards = []; FD.cur = null; FD.cbs = []; FD.nextCalm = 20 + (Math.random() * 10 | 0);
  if (!opt.keep) { FD.combo = 0; FD.best = 0; FD.ans = 0; FD.ok = 0; FD.seen = 0; FD.xp0 = S.xp; FD.t0 = Date.now(); FD.flags = { goalFrom: todayXP() }; FD.intro = new Set(); }
  else { FD.flags.daily = 1; FD.flags.caught = 0; }
  v.innerHTML = `<div class="fd-amb" id="fdAmb" aria-hidden="true"><i></i><i></i></div>
    <header class="fd-top">
      <button class="fd-ib" data-fa="close" aria-label="Akıştan çık">${IC('x')}</button>
      <div class="fd-tabs" role="tablist" aria-label="Akış">${FD_TABS.map(([k, t]) => `<button role="tab" data-ftab="${k}" aria-pressed="${FD.tab === k}">${t}${k === 'due' ? `<span class="fd-dueb tnum">${dueList().length + p2dueCount() || ''}</span>` : ''}</button>`).join('')}<i class="fd-tabind" id="fdTabInd" aria-hidden="true"></i></div>
      <div class="fd-tools"><button class="fd-ib" id="fdVoice" data-fa="voice" aria-label="Sesli akış" aria-pressed="${!!S.pref.fvoice}">${IC(S.pref.fvoice ? 'speak' : 'mute')}</button><button class="fd-ib" data-fa="menu" aria-label="Kanallar ve ayarlar">${IC('sliders')}</button></div>
    </header>
    <div class="fd-hud" aria-hidden="true"><span class="fd-pill xp" id="fdXP">${IC('spark', 'sm')}<b id="fdXPn" class="tnum">+0</b></span><span class="fd-pill combo" id="fdCombo" hidden>${IC('flame', 'sm')}<b class="tnum">×0</b></span><button class="fd-pill chan" id="fdChan" data-fa="unchan" hidden><i></i><span></span>${IC('x', 'sm')}</button></div>
    <div class="fd-sc" id="fdSc" tabindex="-1" aria-label="Akış kartları"></div>
    <div class="fd-arrows" aria-hidden="true"><button data-fa="prev" tabindex="-1">${IC('chev', 'up')}</button><button data-fa="next" tabindex="-1">${IC('chev', 'dn')}</button></div>
    <div class="fd-coach" id="fdCoach" ${S.pref.fcoach ? 'hidden' : ''}><div class="fd-coach-in"><span class="hand" aria-hidden="true"></span><b>Yukarı kaydır</b><span>Her kart bir terim, bir soru ya da Paper 2’den bir kural.</span><span>${IC('heart', 'sm')} Çift dokun: kaydet · disk: o boyanın kanalı</span><button class="fd-btn pri" data-fa="coach">Başla</button></div></div>`;
  FD.sc = $('#fdSc');
  if (FD.io) FD.io.disconnect();
  fdObserve();
  FD.sc.addEventListener('scroll', fdScroll, { passive: true });
  fdAppend(5);
  fdPaint(FD.cards[0], true);
  requestAnimationFrame(() => { fdTabsUI(); fdHud(); });
};
function fdOpen(opt) {
  opt = opt || {};
  if (VIEW !== 'feed') FD.from = VIEW === 'play' || VIEW === 'sess' ? 'home' : VIEW;
  try { if (!history.state || !history.state.fd) history.pushState({ fd: 1 }, ''); } catch (e) {}
  FD.open = true; document.body.classList.add('fd-lock');
  show('feed', opt);
}
function fdClose(viaPop) {
  if (VIEW !== 'feed') return;
  if (!viaPop) { try { if (history.state && history.state.fd) { history.back(); return; } } catch (e) {} }
  const xp = S.xp - FD.xp0, mins = Math.max(1, Math.round((Date.now() - FD.t0) / 60000));
  show(FD.from || 'home');
  if (FD.seen > 1) setTimeout(() => toast(`Akış: ${FD.seen} kart · ${FD.ok}/${FD.ans} doğru · +${xp} XP · ${mins} dk${FD.best >= 5 ? ` · en uzun seri ×${FD.best}` : ''}`, 4200), 350);
}
window.addEventListener('popstate', () => { if (VIEW === 'feed') fdClose(true); });

function fdSwitch(tab, cat) {
  if (FD.cur) { const M = FDK[FD.cur.kind]; if (M.off) try { M.off(FD.cur); } catch (e) {} }
  const o = { keep: 1 }; if (tab) o.tab = tab; else o.tab = FD.tab; o.cat = cat !== undefined ? cat : FD.cat;
  RENDER.feed(o); fdHud();
}
function fdLeave() {
  FD.open = false; clearTimeout(FD.autoT); hush();
  if (FD.cur) { const M = FDK[FD.cur.kind]; if (M.off) try { M.off(FD.cur); } catch (e) {} }
  if (FD.io) FD.io.disconnect();
  document.body.classList.remove('fd-lock');
}
function fdMenu() {
  const rows = SHELVES.map(sh => `<div class="fd-chrow"><small>${esc(sh.tr)}</small><div class="fd-stories">${sh.cats.map(c => `<button class="fd-story ${FD.cat === c ? 'on' : ''}" data-fchan="${c}" style="--cc:${PIG[c].h}"><i data-swatch="${c}" data-w="120" data-h="120"></i><span>${esc(PIG[c].n)}</span></button>`).join('')}</div></div>`).join('');
  openSheet(`<div class="sheet-h"><h2>Kanallar</h2><button class="iconbtn" data-close aria-label="Kapat">${IC('x')}</button></div>
    <p class="hint" style="margin-bottom:12px">Bir boya seç: akış yalnız o alanın terimlerini, sorularını ve metinlerini getirir.</p>
    <button class="fd-story all ${!FD.cat ? 'on' : ''}" data-fchan=""><i></i><span>Bütün boyalar</span></button>
    ${rows}
    <div style="margin-top:16px">${[['fvoice', 'Sesli akış', 'Her kart açılınca sesli okunur.', !!S.pref.fvoice], ['fauto', 'Otomatik ilerle', 'Cevaptan ve bilgi kartlarından sonra sonraki karta kendiliğinden geçer.', !!S.pref.fauto], ['ftick', 'Kaydırma tıkı', 'Her kart yerine oturunca hafif bir ses.', S.pref.ftick !== 0]].map(([k, l, d, on]) => `<div class="set-row"><span><span class="lab">${l}</span><small>${d}</small></span><button class="switch" role="switch" aria-checked="${on}" data-fset="${k}" aria-label="${l}"></button></div>`).join('')}</div>
    <p class="hint tnum" style="margin-top:14px">Bu akışta ${FD.seen} kart · ${FD.ok}/${FD.ans} doğru · en uzun seri ×${FD.best}</p>`, sh => paintSwatches(sh));
}

/* ---------- olaylar ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-fa],[data-ftab],[data-fchan],[data-fset],[data-feed]');
  if (!t) return;
  const d = t.dataset;
  if (d.feed !== undefined) { e.preventDefault(); haptic('tap'); fdOpen(d.feed ? { tab: d.feed } : {}); return; }
  if (d.fchan !== undefined) { closeSheet(); fdSwitch(FD.tab === 'p2' ? 'mix' : null, d.fchan || null); if (d.fchan) toast(PIG[d.fchan].n + ' kanalı'); return; }
  if (d.fset) { const k = d.fset; if (k === 'ftick') S.pref.ftick = S.pref.ftick === 0 ? 1 : 0; else S.pref[k] = S.pref[k] ? 0 : 1; touch(); t.setAttribute('aria-checked', String(k === 'ftick' ? S.pref.ftick !== 0 : !!S.pref[k])); if (k === 'fvoice') fdTabsUI(); return; }
  if (VIEW !== 'feed') return;
  if (d.ftab) { if (d.ftab !== FD.tab) { haptic('tap'); fdSwitch(d.ftab, d.ftab === 'p2' ? null : undefined); } return; }
  const a = d.fa, slide = t.closest('.fd-slide'), card = slide ? slide._card : FD.cur;
  if (a === 'close') { fdClose(); return; }
  if (a === 'menu') { fdMenu(); return; }
  if (a === 'voice') { S.pref.fvoice = S.pref.fvoice ? 0 : 1; touch(); fdTabsUI(); if (S.pref.fvoice && FD.cur) { const M = FDK[FD.cur.kind]; if (M.say) speak(M.say(FD.cur)); } else hush(); toast(S.pref.fvoice ? 'Sesli akış açık' : 'Sesli akış kapalı'); return; }
  if (a === 'unchan') { fdSwitch(null, null); return; }
  if (a === 'prev') { fdGo(-1); return; }
  if (a === 'next') { fdGo(1); return; }
  if (a === 'coach') { fdCoachOff(); fdPeek(); return; }
  if (!card) return;
  if (a === 'like') { fdLike(card); return; }
  if (a === 'say') { const M = FDK[card.kind]; const s = M.say ? M.say(card) : ''; if (s) speak(s); bump(t); return; }
  if (a === 'more') {
    if (card.it) termSheet(card.it.k); else if (card.pa) termSheet(card.pa.k);
    else if (card.pi !== undefined) { const x = pairItem(PAIRS[card.pi][0]); if (x) termSheet(x.k); }
    else if (card.p2s !== undefined) p2SecSheet(card.p2s, true);
    return;
  }
  if (a === 'chan') {
    bump(t); haptic('tap');
    if (/^p2/.test(card.kind)) { if (FD.tab !== 'p2') { fdSwitch('p2', null); toast('Paper 2 akışı'); } return; }
    if (FD.cat !== card.c) { fdSwitch(FD.tab === 'p2' ? 'mix' : null, card.c); toast(PIG[card.c].n + ' kanalı · ' + CATS[card.c]); }
    return;
  }
  const M = FDK[card.kind]; if (M.act) M.act(card, a, t, e);
});
/* çift dokunma */
document.addEventListener('pointerup', e => {
  if (VIEW !== 'feed' || e.pointerType === 'mouse' && e.button !== 0) return;
  const fr = e.target.closest('.fd-frame'); if (!fr) return;
  if (e.target.closest('button,a,input,textarea,canvas,.fd-tf')) return;
  const now = Date.now(), L = FD.lastTap;
  if (L && now - L.t < 300 && Math.hypot(e.clientX - L.x, e.clientY - L.y) < 40) { FD.lastTap = null; const card = fr.closest('.fd-slide')._card; if (card) fdLike(card, e.clientX, e.clientY, true); return; }
  FD.lastTap = { t: now, x: e.clientX, y: e.clientY };
});
document.addEventListener('dblclick', e => { if (VIEW === 'feed' && e.target.closest('.fd-frame')) e.preventDefault(); });
document.addEventListener('keydown', e => {
  if (VIEW !== 'feed' || !$('#sheetBg').hidden) return;
  if (e.target.closest && e.target.closest('input,textarea')) return;
  const k = e.key, card = FD.cur;
  if (k === 'ArrowDown' || k === 'PageDown' || k === 'j' || (k === ' ' && card && (card.answered || !/^(q|tf|read|p2q|p2gap|p2eye|twin)$/.test(card.kind)))) { e.preventDefault(); fdGo(1); return; }
  if (k === 'ArrowUp' || k === 'PageUp' || k === 'k') { e.preventDefault(); fdGo(-1); return; }
  if (k === 'Escape') { fdClose(); return; }
  if (!card || !card.el) return;
  if (/^[1-4]$/.test(k)) { const b = card.el.querySelector(`.fd-body [data-fa="opt"][data-n="${+k - 1}"], .fd-body [data-fa="ord"][data-n="${+k - 1}"]`); if (b && !b.disabled) b.click(); return; }
  if (card.kind === 'tf' && (k === 'ArrowRight' || k === 'ArrowLeft')) { const b = card.el.querySelector(`[data-fa="tf"][data-v="${k === 'ArrowRight' ? 1 : 0}"]`); if (b) b.click(); return; }
  if (k === 'l' || k === 'L') { fdLike(card); return; }
  if (k === 'Enter') { const b = card.el.querySelector('.fd-body .fd-btn.pri, .fd-body [data-fa="rev"]'); if (b) b.click(); }
});
window.addEventListener('resize', () => { if (VIEW !== 'feed') return; clearTimeout(window.__fdrz); window.__fdrz = setTimeout(() => { fdTabsUI(); if (FD.cur && FD.cur.el) { FD.sc.scrollTop = FD.cur.el.offsetTop; fdFit(FD.cur); } }, 200); });
