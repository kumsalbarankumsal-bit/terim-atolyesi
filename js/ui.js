'use strict';
/* =====================================================================
   TERİM ATÖLYESİ — ekranlar
   Atölye (ana sayfa), Boyalar, boya ayrıntısı, Sözlük, paneller, ayarlar,
   keşif ve aralıklı tekrar oturumları, seviye atlama.
   ===================================================================== */
const PAGES = ['home', 'studio', 'boya', 'lex', 'p2'];
let VIEW = 'home', CAT = null;

/* ---------- genel ---------- */
function toast(msg, ms) {
  const box = $('#toasts'); if (!box) return;
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms || 2600);
}
function announce(t) { const e = $('#sr'); if (!e) return; e.textContent = ''; setTimeout(() => { e.textContent = t; }, 40); }
function catStyle(c) { const P0 = PIG[c]; return `--cc:${P0.h};--cs:${P0.s}`; }
function catChip(c, extra) { return `<span class="chip cat" style="${catStyle(c)}"><i aria-hidden="true"></i>${esc(extra || CATS[c])}</span>`; }
function stageDots(k) { const s = stageOf(k); return `<span class="stage" aria-label="Basamak ${Math.max(0, s)}/6">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= s ? 'on' : ''}"></i>`).join('')}</span>`; }
function statusChip(k) {
  const s = status(k);
  if (s === 'new') return '<span class="chip">Yeni</span>';
  if (s === 'known') return '<span class="chip ok">Biliyordum</span>';
  if (s === 'master') return '<span class="chip ok">Ustalaşıldı</span>';
  return `<span class="chip ${isHard(k) ? 'no' : 'lac'}">${isHard(k) ? 'Zorlu · ' : ''}${isDue(k) ? 'Tekrar zamanı' : 'Öğreniliyor'}</span>`;
}
function phaseName(ph) { return { dawn: 'seher teknesi', day: 'gündüz teknesi', golden: 'akşam teknesi', night: 'gece teknesi' }[ph] || ''; }
function greeting(d) { const h = d.getHours(); if (h >= 5 && h < 11) return 'Günaydın'; if (h >= 11 && h < 17) return 'İyi günler'; if (h >= 17 && h < 22) return 'İyi akşamlar'; return 'Gece kuşu'; }
function trDate(d) { return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }); }

/* ---------- tercihler ---------- */
function applyPrefs() {
  const r = document.documentElement, p = S.pref;
  r.style.setProperty('--fsz', clamp(+p.fs || 19, 15, 28) + 'px');
  r.style.setProperty('--lh', p.lh ? '1.85' : '1.6');
  const dark = p.theme === 'dark' || (p.theme === 'auto' && (EB.phaseOf() === 'night' || (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches && EB.phaseOf() !== 'day')));
  r.classList.toggle('dark', dark);
  r.classList.toggle('hc', !!p.hc);
  const m = motionLevel(); r.classList.toggle('calm', m === 1); r.classList.toggle('still', m === 0);
  const tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', dark ? '#0A1230' : '#F7F1E4');
}

/* ---------- üst çubuk, sekmeler ---------- */
function moveInd() {
  [['.nav', '.nav-ind'], ['.tabbar', '.tab-ind']].forEach(([n, i]) => {
    const nav = $(n), ind = $(i); if (!nav || !ind) return;
    const cur = nav.querySelector('[aria-current="page"]');
    if (!cur || !nav.offsetWidth) { ind.style.width = '0px'; return; }
    ind.style.width = cur.offsetWidth + 'px'; ind.style.transform = `translateX(${cur.offsetLeft}px)`;
  });
}
function updateTop() {
  const st = streak(), due = dueList().length;
  const s = $('#topStreak'); if (s) s.textContent = st;
  const ch = $('.chip-streak'); if (ch) ch.classList.toggle('lit', !!todayXP());
  const x = $('#topXPn'); if (x) x.textContent = S.xp.toLocaleString('tr-TR');
  $$('[data-due]').forEach(b => { b.hidden = !due; b.textContent = due > 99 ? '99+' : due; });
  if (typeof p2dueCount === 'function') { const d2 = p2dueCount(); $$('[data-p2due]').forEach(b => { b.hidden = !d2; b.textContent = d2 > 99 ? '99+' : d2; }); }
  const bm = $('.brand-mark'); if (bm && !bm.dataset.p) { bm.dataset.p = 1; idle(() => { const u = EB.image('brand:' + ymd(), 'gelgit', 88, 88, hashStr(ymd()), EB.phaseOf(), { cap: 900 }); if (u) bm.style.backgroundImage = `url(${u})`; }); }
}
const RENDER = {};
function show(v, opt) {
  opt = opt || {};
  if (v !== 'sess' && SES && !SES.done && VIEW === 'sess' && !opt.force) { sesQuit(); return; }
  const from = VIEW, dir = PAGES.indexOf(v) >= 0 && PAGES.indexOf(from) >= 0 ? (PAGES.indexOf(v) < PAGES.indexOf(from) ? 'l' : 'r') : (v === 'home' ? 'l' : 'r');
  if (v !== 'play' && typeof plStop === 'function' && VIEW === 'play') { plStop(); }
  hush();
  vt(() => {
    VIEW = v; document.documentElement.dataset.view = v;
    $$('.view').forEach(s => { s.hidden = s.id !== 'v-' + v; });
    const page = PAGES.includes(v) ? v : v === 'cat' ? 'boya' : null;
    $$('[data-go]').forEach(b => { if (b.dataset.go === page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if (v !== 'home') tekneStop();
    (RENDER[v] || (() => {}))(opt);
    moveInd(); updateTop();
    window.scrollTo(0, 0);
  }, dir);
}

/* =====================================================================
   ATÖLYE — ana sayfa
   ===================================================================== */
function heroHTML() {
  const d = new Date(), ph = EB.phaseOf(d), dc = dayCat(d), L = LEVELS[levelIndex(S.xp)];
  return `<section class="hero" id="hero" aria-label="Ebru teknesi">
    <div class="hero-rim" aria-hidden="true"></div>
    <div class="hero-label">
      <div class="hero-hi">${greeting(d)}<em>.</em></div>
      <div class="hero-meta"><time id="heroClock" class="tnum">${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</time><span>${esc(trDate(d))}</span></div>
      <div class="hero-chips">${catChip(dc, 'Bugünün boyası · ' + PIG[dc].n)}<span class="chip lac">${IC('comb', 'sm')}${esc(L.e)}<span class="hide-phone"> teknen</span></span></div>
    </div>
    <span class="hero-phase" aria-hidden="true">${IC(ph === 'night' ? 'moon' : 'sun', 'sm')}${phaseName(ph)}</span>
    <span class="tekne-hint" aria-hidden="true"><i class="tap"></i>Dokun: boya damlat · Sürükle: bızla çiz</span>
  </section>`;
}
function task(o) {
  return `<button class="task" ${o.dis ? 'disabled' : ''} data-run="${o.run}" ${o.arg ? `data-arg="${esc(o.arg)}"` : ''} style="--cc:${o.col || 'var(--lac)'}">
    <span class="tk-ic" aria-hidden="true">${IC(o.ic)}</span>
    <span class="tk-txt"><b>${esc(o.t)}</b><small>${esc(o.s)}</small></span>
    ${o.n !== undefined ? `<span class="tk-n tnum">${o.n}<small>${esc(o.nl || '')}</small></span>` : ''}${IC('chev', 'sm')}
  </button>`;
}
function boardHTML() {
  const due = dueList().length, f = forecast(), nc = nextCat(), c = counts(), hard = c.hard;
  const d = new Date(), rows = [];
  rows.push(due ? task({ run: 'review', ic: 'review', t: 'Tekrar zamanı', s: 'Vadesi gelen terimler: unutmaya başladığın yerden yakala', n: due, nl: 'terim', col: '#DD3A2A' })
    : task({ run: 'review', dis: 1, ic: 'review', t: 'Tekrar yok', s: f[1] ? `Yarın ${f[1]} terim tekrara gelecek` : 'Öğrendiğin terimler ertesi gün buraya düşer', n: '—', col: '#737A90' }));
  if (nc) { const left = nextNewIn(nc).length; rows.push(task({ run: 'disc', arg: nc, ic: 'spark', t: (BYCAT[nc].some(x => status(x.k) !== 'new') ? 'Keşfe devam: ' : 'Keşfet: ') + CATS[nc], s: `${PIG[nc].n} boyası · ${BYCAT[nc].length} terimden ${left} yeni`, n: left, nl: 'yeni', col: PIG[nc].h })); }
  if (hard) rows.push(task({ run: 'hard', ic: 'target', t: 'Zorlu terimler', s: 'İki kez yanlış yaptıkların; Öğren moduyla üç basamakta pekiştir', n: hard, nl: 'zorlu', col: '#8B3FC6' }));
  if (typeof p2BoardTask === 'function') { const t2 = p2BoardTask(); if (t2) rows.push(t2); }
  if (S.exam && S.exam.pos < S.exam.keys.length) rows.push(task({ run: 'exam', ic: 'flag', t: 'Maratona devam', s: `${S.exam.name} · ${S.exam.pos}/${S.exam.keys.length} terim`, n: Math.round(S.exam.pos / S.exam.keys.length * 100) + '%', col: '#2A44B8' }));
  const pk = pick(PASSAGES);
  rows.push(task({ run: 'mode', arg: c.seen > 15 ? 'lens' : 'cards', ic: c.seen > 15 ? 'lens' : 'cards', t: c.seen > 15 ? 'Yakın okuma' : 'Kartlarla tanış', s: c.seen > 15 ? `Kısa metinde terimi bul: “${trunc(pk.txt.replace(/[⟦⟧]/g, ''), 54)}”` : 'Bir boyanın terimlerini çevir, bilmediklerin yeni turda gelsin', col: '#0B97A4' }));
  return `<section class="card board" aria-label="Bugün tezgâhta">
    <div class="board-h"><h2>Bugün tezgâhta</h2><span class="clock tnum" id="boardClock">${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</span></div>
    ${rows.join('')}
  </section>`;
}
function wotdHTML() {
  const it = dayTerm(), P0 = PIG[it.c];
  return `<section class="card wotd" style="${catStyle(it.c)}" data-swatch="${it.c}" data-w="640" data-h="300" aria-label="Günün terimi">
    <div class="tools">${TTS.ok ? `<button class="iconbtn" data-say="${esc(it.k)}" aria-label="Sesli oku">${IC('speak')}</button>` : ''}<button class="iconbtn" data-term="${esc(it.k)}" aria-label="Terim kartını aç">${IC('book')}</button></div>
    <div class="wotd-in">
      <span class="eyebrow">Günün terimi · ${esc(P0.n)}</span>
      <h3>${esc(it.t)}</h3>
      <span class="en" lang="en">${esc(it.en)}</span>
      <div class="reveal hid" id="wotdReveal" role="button" tabindex="0" aria-label="Önce anlamını tahmin et, sonra açmak için dokun">${esc(it.m)}</div>
      <p style="margin-top:8px;font-size:.84rem;font-weight:700;opacity:.85" id="wotdHint">Önce anlamını içinden söyle, sonra aç: hatırlamaya çalışmak öğrenmenin kendisidir.</p>
    </div>
  </section>`;
}
function todayHTML() {
  const goal = S.pref.goal || 150, x = todayXP(), pct = Math.min(1, x / goal), C = 2 * Math.PI * 52;
  const c = counts(), acc = S.ta ? Math.round(S.tc / S.ta * 100) : null, st = streak();
  const note = x >= goal ? 'Bugünün hedefi tamam. Kalıcı öğrenme için yarın tekrarlara geri dön.' : x ? `Hedefe ${goal - x} XP kaldı. Tekrarlar ve yeni terimler en çok XP getirir.` : 'Bugün henüz boya damlatmadın. Tek bir tekrar bile seriyi sürdürür.';
  return `<section class="card" aria-label="Bugün">
    <div class="card-h"><h2>Bugün</h2><span class="faint" style="font-weight:800">${esc(new Date().toLocaleDateString('tr-TR', { weekday: 'long' }))}</span></div>
    <div class="today">
      <div class="ring" role="img" aria-label="Günlük hedef: ${x} / ${goal} XP">
        <svg viewBox="0 0 120 120"><defs><linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0B97A4"/><stop offset=".5" stop-color="#2A44B8"/><stop offset="1" stop-color="#D1337C"/></linearGradient></defs>
          <circle class="bg" cx="60" cy="60" r="52" fill="none" stroke-width="12"/>
          <circle class="fg" cx="60" cy="60" r="52" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" data-ring="${(C * (1 - pct)).toFixed(1)}"/></svg>
        <div class="ring-c"><div><b class="tnum" data-count="${x}" data-ck="tx">0</b><small>/ ${goal} XP</small></div></div>
      </div>
      <div class="stats">
        <div class="stat"><b class="tnum" data-count="${st}" data-ck="st">0</b><span>gün seri</span></div>
        <div class="stat"><b class="tnum" data-count="${todayAns()}" data-ck="ta">0</b><span>bugün cevap</span></div>
        <div class="stat"><b class="tnum" data-count="${c.solid}" data-ck="so">0</b><span>kalıcı terim</span></div>
        <div class="stat"><b class="tnum">${acc === null ? '—' : '%' + acc}</b><span>genel doğruluk</span></div>
      </div>
      <p class="today-note">${esc(note)}</p>
    </div>
  </section>`;
}
function levelHTML() {
  const I = levelInfo(), ph = EB.phaseOf();
  const papers = LEVELS.map((L, i) => `<button class="${i > I.i ? 'locked' : ''} ${i === I.i ? 'cur' : ''}" data-paper="${i}" ${i <= I.i ? `data-lvimg="${i}" data-w="116" data-h="84" data-pal="${ph}"` : ''} aria-label="${esc(L.e)}${i > I.i ? ', kilitli' : ''}"></button>`).join('');
  return `<section class="card lv-card" aria-label="Ebru basamağın">
    <div class="lv-paper" data-lvimg="${I.i}" data-w="640" data-h="300" data-pal="${ph}"><div class="lv-name"><small>${I.i + 1}. basamak · ${esc(I.L.t)}</small><b>${esc(I.L.e)}</b></div></div>
    <div class="lv-body">
      <p class="muted" style="font-size:.92rem">${esc(I.L.d)}</p>
      <div class="lv-bar"><i data-w="${(I.pct * 100).toFixed(1)}%"></i></div>
      <div class="lv-row"><span class="tnum">${S.xp.toLocaleString('tr-TR')} XP</span><span>${I.N ? `${I.left.toLocaleString('tr-TR')} XP sonra: ${esc(I.N.e)}` : 'Bütün kâğıtlar senin'}</span></div>
      <div class="papers" aria-label="Kâğıt koleksiyonu">${papers}</div>
    </div>
  </section>`;
}
function forecastHTML() {
  const f = forecast(), mx = Math.max(4, ...f), days = ['Bugün', 'Yarın'];
  const d = new Date();
  const lab = i => { if (i < 2) return days[i]; const x = new Date(d); x.setDate(d.getDate() + i); return x.toLocaleDateString('tr-TR', { weekday: 'short' }); };
  return `<section class="card" aria-label="Önümüzdeki 7 gün">
    <div class="card-h"><h2>Önümüzdeki 7 gün</h2><span class="faint" style="font-weight:800">tekrar takvimi</span></div>
    <div class="fc">${f.map((n, i) => `<div class="fc-col"><b class="tnum">${n}</b><i style="height:${Math.max(4, n / mx * 92)}px;animation-delay:${i * 60}ms"></i><span>${esc(lab(i))}</span></div>`).join('')}</div>
  </section>`;
}
function heatHTML() {
  const days = 7 * 18, d0 = new Date(); d0.setDate(d0.getDate() - days + 1 + ((6 - ((d0.getDay() + 6) % 7))));
  const cells = [], t = ymd();
  const start = new Date(); start.setDate(start.getDate() - (days - 1) + (6 - ((start.getDay() + 6) % 7)));
  for (let i = 0; i < days; i++) {
    const x = new Date(start); x.setDate(start.getDate() + i);
    const k = ymd(x), v = S.days[k] || 0, l = !v ? '' : v < 30 ? 'l1' : v < 80 ? 'l2' : v < 160 ? 'l3' : 'l4';
    cells.push(`<i class="${l} ${k === t ? 'tdy' : ''}" title="${esc(x.toLocaleDateString('tr-TR'))}: ${v} XP"></i>`);
  }
  const active = Object.keys(S.days).filter(k => S.days[k] > 0).length;
  return `<section class="card" aria-label="Çalışma düzeni">
    <div class="card-h"><h2>Düzen</h2><span class="faint" style="font-weight:800">${active} aktif gün</span></div>
    <div class="heat" aria-hidden="true">${cells.join('')}</div>
    <p class="faint" style="font-size:.82rem;margin-top:10px;font-weight:700">Her kare bir gün; renk koyulaştıkça o gün daha çok XP kazanmışsın.</p>
  </section>`;
}
function firstStepsHTML() {
  if (counts().seen > 12) return '';
  return `<section class="card" aria-label="Nasıl çalışır">
    <div class="card-h"><h2>Atölyeye hoş geldin</h2></div>
    <div class="grid3">
      <div><span class="eyebrow">1 · Keşfet</span><p class="muted" style="margin-top:4px">Bir boyayı seç, terimlerle tek tek tanış. Bildiğini söylersen uygulama kısa bir soruyla dürüstçe sınar.</p></div>
      <div><span class="eyebrow">2 · Tekrar et</span><p class="muted" style="margin-top:4px">Öğrendiğin terim 1 gün, 3 gün, 1 hafta, 2 hafta ve 1 ay sonra farklı bir soruyla geri gelir.</p></div>
      <div><span class="eyebrow">3 · Metinde kullan</span><p class="muted" style="margin-top:4px">Stüdyo'da terimi kısa metinlerde bul, kanıt → teknik → etki cümlesi kur, oyunlarla hızlan.</p></div>
    </div>
  </section>`;
}
function homeStudioHTML() {
  const c = counts();
  const pickModes = c.seen < 10 ? ['cards', 'learn', 'rain', 'shelf'] : c.seen < 60 ? ['learn', 'example', 'lens', 'rain'] : ['lens', 'chain', 'twin', 'test'];
  return `<section aria-label="Stüdyo önerileri">
    <div class="card-h" style="margin:4px 2px 12px"><h2>Stüdyo'dan</h2><button class="more" data-go="studio">Bütün modlar (${Object.keys(MODES).length}) ${IC('chev', 'sm')}</button></div>
    <div class="mgrid">${pickModes.map(k => modeCard(k, true)).join('')}</div>
  </section>`;
}
function miniJarsHTML() {
  return `<section class="card" aria-label="Boyalar">
    <div class="card-h"><h2>Boyalar</h2><button class="more" data-go="boya">Raflara git ${IC('chev', 'sm')}</button></div>
    <div class="mini-jars">${CAT_KEYS.map(c => { const n = counts(BYCAT[c]); return `<button class="mjar" data-cat="${c}" style="${catStyle(c)}"><span class="sw" data-swatch="${c}" data-w="76" data-h="76"></span><span><b>${esc(CATS[c])}</b><small class="tnum">${n.solid}/${n.total}${n.due ? ' · ' + n.due + ' tekrar' : ''}</small></span></button>`; }).join('')}</div>
  </section>`;
}
let CLOCK_T = 0;
RENDER.home = () => {
  const v = $('#v-home');
  v.innerHTML = heroHTML() + `<div class="home-grid">
      <div class="home-col">${boardHTML()}${wotdHTML()}${homeStudioHTML()}${firstStepsHTML()}</div>
      <div class="home-col">${todayHTML()}${levelHTML()}${forecastHTML()}${heatHTML()}${miniJarsHTML()}</div>
    </div>`;
  tekneMount($('#hero'));
  paintSwatches(v); countUps(v);
  if (typeof stSpotlight === 'function') stSpotlight(v);
  clearInterval(CLOCK_T);
  CLOCK_T = setInterval(() => {
    if (VIEW !== 'home') { clearInterval(CLOCK_T); return; }
    const d = new Date(), s = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    ['#heroClock', '#boardClock'].forEach(id => { const e = $(id); if (e) e.textContent = s; });
  }, 15000);
};
document.addEventListener('click', e => {
  const r = e.target.closest('#wotdReveal'); if (!r) return;
  if (r.classList.contains('hid')) {
    r.classList.remove('hid'); const it = dayTerm(); const h = $('#wotdHint'); if (h) h.textContent = 'Örnek: ' + it.ex;
    splashAt(r, 12, [PIG[it.c].h, '#FFFFFF']); haptic('tap');
  }
});

/* =====================================================================
   BOYALAR
   ===================================================================== */
function jarHTML(c) {
  const n = counts(BYCAT[c]), pct = Math.round((n.solid + n.learn * .4) / n.total * 100);
  return `<button class="jar" data-cat="${c}" style="${catStyle(c)}" aria-label="${esc(CATS[c])}: ${n.solid} / ${n.total} kalıcı">
    ${n.due ? `<span class="badge due">${n.due}</span>` : ''}
    <span class="jar-glass" aria-hidden="true"><span class="jar-paint" data-swatch="${c}" data-w="220" data-h="160" style="--fill:0" data-fill="${Math.max(pct, n.seen ? 6 : 0)}"></span><span class="jar-pct ${pct < 34 ? 'lo' : ''} tnum">%${pct}</span></span>
    <span class="jar-name"><small>${esc(PIG[c].n)}</small><b>${esc(CATS[c])}</b></span>
    <span class="jar-meta tnum">${n.total} terim · ${n.solid} kalıcı · ${n.new} yeni</span>
  </button>`;
}
RENDER.boya = () => {
  const c = counts(), v = $('#v-boya');
  v.innerHTML = `<div class="page-h"><h1>Boyalar</h1><span class="sub tnum">19 boya · ${c.total} terim · ${c.solid} kalıcı</span></div>
    <p class="lead">Her alan bir boya kavanozu. Terimleri öğrendikçe kavanoz dolar; kalıcı olanlar tam, öğrenilmekte olanlar yarım sayılır. Bir kavanoza dokun, o boyanın terimleriyle çalış.</p>
    ${SHELVES.map(sh => `<section class="shelf"><div class="shelf-h"><h2>${esc(sh.tr)}</h2><p>${esc(sh.d)}</p></div><div class="shelf-wood"><div class="jars">${sh.cats.map(jarHTML).join('')}</div></div></section>`).join('')}`;
  paintSwatches(v); countUps(v);
};
RENDER.cat = () => {
  const c = CAT || 't', L = BYCAT[c], n = counts(L), v = $('#v-cat');
  v.innerHTML = `<section class="cat-hero" style="${catStyle(c)}" data-swatch="${c}" data-w="960" data-h="320">
      <button class="iconbtn back" data-go="boya" aria-label="Boyalara dön">${IC('back')}</button>
      <span class="eyebrow">${esc(PIG[c].n)} boyası · ${SHELVES.find(s => s.cats.includes(c)).tr}</span>
      <h1>${esc(CATS[c])}</h1>
    </section>
    <div class="pills"><span class="chip">${n.total} terim</span><span class="chip">${n.new} yeni</span><span class="chip lac">${n.learn} öğreniliyor</span><span class="chip ok">${n.solid} kalıcı</span>${n.due ? `<span class="chip no">${n.due} tekrar</span>` : ''}${n.hard ? `<span class="chip no">${n.hard} zorlu</span>` : ''}</div>
    <div class="actions">
      <button class="btn" data-run="disc" data-arg="${c}" ${n.new ? '' : 'disabled'}>${IC('spark')}Keşfet${n.new ? ` (${n.new})` : ''}</button>
      <button class="btn ghost" data-run="review" data-arg="${c}" ${n.due ? '' : 'disabled'}>${IC('review')}Tekrar (${n.due})</button>
      <button class="btn ghost" data-run="studio" data-arg="${c}">${IC('studio')}Stüdyo'da çalış</button>
      <button class="btn ghost" data-run="mode" data-arg="test" data-src="${c}">${IC('test')}Hızlı test</button>
    </div>
    <div class="tlist">${L.map(x => `<button class="tl" data-term="${esc(x.k)}" style="${catStyle(c)}"><span class="st">${stageDots(x.k)}</span><b>${esc(x.t)}</b><span class="en" lang="en">${esc(x.en)}</span><p>${esc(shortDef(x, 120))}</p></button>`).join('')}</div>`;
  paintSwatches(v);
};

/* =====================================================================
   SÖZLÜK
   ===================================================================== */
const LEX = { q: '', st: 'all', c: '', tab: 'terms', n: 40 };
function lexFilter() {
  const q = stripTr(LEX.q);
  return ITEMS.filter(x => {
    if (LEX.c && x.c !== LEX.c) return false;
    const s = status(x.k);
    if (LEX.st === 'new' && s !== 'new') return false;
    if (LEX.st === 'learn' && s !== 'learn') return false;
    if (LEX.st === 'solid' && !isSolid(x.k)) return false;
    if (LEX.st === 'hard' && !isHard(x.k)) return false;
    if (LEX.st === 'fav' && !S.f[x.k]) return false;
    if (LEX.st === 'note' && !S.notes[x.k]) return false;
    if (q && !stripTr(x.t + ' ' + x.en + ' ' + x.m + ' ' + x.ex).includes(q)) return false;
    return true;
  });
}
function entryHTML(x) {
  const note = S.notes[x.k];
  return `<article class="entry" style="${catStyle(x.c)}">
    <div class="e-top"><div><h3>${esc(x.t)}</h3><span class="en" lang="en">${esc(x.en)}</span></div><span class="spacer"></span>
      <button class="starbtn" data-star="${esc(x.k)}" aria-pressed="${!!S.f[x.k]}" aria-label="Yıldızla">${IC('star')}</button></div>
    <p class="def">${esc(x.m)}</p>
    <p class="ex">${esc(x.ex)}</p>
    ${note ? `<div class="note"><b>Benim notum</b>${esc(note)}</div>` : ''}
    <div class="e-foot">${catChip(x.c)}${statusChip(x.k)}<span class="spacer"></span>
      ${TTS.ok ? `<button class="btn ghost sm" data-say="${esc(x.k)}" aria-label="${esc(x.main)}: sesli oku">${IC('speak', 'sm')}Dinle</button>` : ''}
      <button class="btn ghost sm" data-term="${esc(x.k)}">${IC('pen', 'sm')}Not · ayrıntı</button>
    </div>
  </article>`;
}
function lexListHTML() {
  if (LEX.tab === 'pairs') {
    const q = stripTr(LEX.q);
    const ps = PAIRS.filter(p => !q || stripTr(p.join(' ')).includes(q));
    return `<div class="pairs">${ps.map(p => `<div class="pair"><div><b>${esc(p[0])}</b><p>${esc(p[2])}</p></div><div><b>${esc(p[1])}</b><p>${esc(p[3])}</p></div></div>`).join('') || '<p class="muted">Eşleşen çift yok.</p>'}</div>`;
  }
  const L = lexFilter();
  return `<p class="faint" style="font-weight:800;margin:4px 2px 10px">${L.length} terim</p>
    <div class="lexlist">${L.slice(0, LEX.n).map(entryHTML).join('') || '<p class="muted">Aramana uyan terim yok.</p>'}</div>
    ${L.length > LEX.n ? `<div class="more-row"><button class="btn ghost" data-lexmore>${IC('plus')}Daha fazla göster (${L.length - LEX.n})</button></div>` : ''}`;
}
RENDER.lex = () => {
  const v = $('#v-lex');
  const sts = [['all', 'Hepsi'], ['new', 'Yeni'], ['learn', 'Öğreniliyor'], ['solid', 'Kalıcı'], ['hard', 'Zorlu'], ['fav', 'Yıldızlı'], ['note', 'Notlu']];
  v.innerHTML = `<div class="page-h"><h1>Sözlük</h1><span class="sub">${ITEMS.length} terim · ${PAIRS.length} karıştırılan çift</span></div>
    <div class="seg" role="group" aria-label="Görünüm" style="margin-bottom:12px"><button data-lextab="terms" aria-pressed="${LEX.tab === 'terms'}">Terimler</button><button data-lextab="pairs" aria-pressed="${LEX.tab === 'pairs'}">Karıştırılanlar</button></div>
    <div class="search">${IC('search')}<input id="lexQ" type="search" placeholder="Terim, İngilizcesi, anlamı ya da örnekte ara…" value="${esc(LEX.q)}" aria-label="Sözlükte ara" autocomplete="off"></div>
    <div ${LEX.tab === 'pairs' ? 'hidden' : ''}>
      <div class="filters scrollx" role="group" aria-label="Durum" style="margin-bottom:8px">${sts.map(([k, t]) => `<button class="fchip" data-lexst="${k}" aria-pressed="${LEX.st === k}">${t}</button>`).join('')}</div>
      <div class="filters scrollx" role="group" aria-label="Boya" style="margin-bottom:14px"><button class="fchip" data-lexc="" aria-pressed="${!LEX.c}">Bütün boyalar</button>${CAT_KEYS.map(c => `<button class="fchip" data-lexc="${c}" aria-pressed="${LEX.c === c}" style="${catStyle(c)}"><i class="dot"></i>${esc(CATS[c])}</button>`).join('')}</div>
    </div>
    <div id="lexList">${lexListHTML()}</div>`;
  const q = $('#lexQ'); let t = 0;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { LEX.q = q.value; LEX.n = 40; $('#lexList').innerHTML = lexListHTML(); }, 140); });
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-lexst],[data-lexc],[data-lextab],[data-lexmore],[data-star],[data-say]'); if (!t) return;
  const d = t.dataset;
  if (d.say !== undefined) { const it = BYK[d.say]; if (it) speak(`${it.main}. ${it.m}`); return; }
  if (d.star !== undefined) { const k = d.star; if (S.f[k]) delete S.f[k]; else S.f[k] = 1; touch(); t.setAttribute('aria-pressed', !!S.f[k]); if (S.f[k]) { splashAt(t, 10, ['#E09E06', '#FFFFFF']); haptic('tap'); } return; }
  if (d.lexmore !== undefined) { LEX.n += 60; $('#lexList').innerHTML = lexListHTML(); return; }
  if (d.lextab) { LEX.tab = d.lextab; RENDER.lex(); return; }
  if (d.lexst) { LEX.st = d.lexst; LEX.n = 40; RENDER.lex(); return; }
  if (d.lexc !== undefined) { LEX.c = d.lexc; LEX.n = 40; RENDER.lex(); }
});

/* =====================================================================
   PANEL: ayarlar, terim kartı, kâğıt
   ===================================================================== */
let SHEET_BACK = null;
function openSheet(html, mount) {
  const bg = $('#sheetBg'), sh = $('#sheet');
  SHEET_BACK = document.activeElement;
  sh.innerHTML = html; bg.hidden = false; document.body.style.overflow = 'hidden';
  setTimeout(() => sh.focus({ preventScroll: true }), 30);
  if (mount) mount(sh);
}
function closeSheet() {
  const bg = $('#sheetBg'); if (bg.hidden) return;
  bg.hidden = true; $('#sheet').innerHTML = ''; document.body.style.overflow = '';
  if (SHEET_BACK && SHEET_BACK.focus) try { SHEET_BACK.focus({ preventScroll: true }); } catch (e) {}
  if (VIEW === 'home' || VIEW === 'cat' || VIEW === 'lex') { const L = $('#lexList'); if (VIEW === 'lex' && L) L.innerHTML = lexListHTML(); }
}
document.addEventListener('click', e => { if (e.target.id === 'sheetBg' || e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#sheetBg').hidden) { closeSheet(); e.stopPropagation(); } }, true);

function termSheet(k) {
  const x = BYK[k]; if (!x) return;
  const s = status(k);
  openSheet(`<div class="tsheet" style="${catStyle(x.c)}">
      <div class="strip" data-swatch="${x.c}" data-w="640" data-h="140"></div>
      <div class="sheet-h"><div>${catChip(x.c)}</div><button class="iconbtn" data-close aria-label="Kapat">${IC('x')}</button></div>
      <h2>${esc(x.t)}</h2><span class="en-tag" lang="en">${esc(x.en)}</span>
      <p style="margin-top:12px;font-size:1.08rem">${esc(x.m)}</p>
      <p class="qex" style="margin-top:12px;font-size:1.08rem">${esc(x.ex)}</p>
      <div class="row" style="margin:14px 0;flex-wrap:wrap">${statusChip(k)}${s !== 'new' ? stageDots(k) : ''}${isLearn(k) ? `<span class="faint" style="font-weight:700;font-size:.85rem">Sonraki tekrar: ${esc(new Date(S.p[k].d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }))}</span>` : ''}</div>
      <div class="notebox"><label for="noteIn" class="q-label">Benim notum · kendi örneğin ya da çağrışımın</label><textarea id="noteIn" placeholder="Örneğin Paper 2 kitaplarından bir sahne, kendi cümlen ya da bir hafıza ipucu…">${esc(S.notes[k] || '')}</textarea></div>
      <div class="sess-actions" style="justify-content:flex-start">
        ${s === 'new' ? `<button class="btn" data-tadd="${esc(k)}">${IC('plus')}Öğrenmeye ekle</button><button class="btn ghost" data-tknow="${esc(k)}">${IC('check')}Zaten biliyorum</button>` : ''}
        <button class="btn ghost" data-tmode="atelier" data-k="${esc(k)}">${IC('pen')}Bağ kur</button>
        ${TTS.ok ? `<button class="btn ghost" data-say="${esc(k)}">${IC('speak')}Dinle</button>` : ''}
        <button class="starbtn" data-star="${esc(k)}" aria-pressed="${!!S.f[k]}" aria-label="Yıldızla">${IC('star')}</button>
      </div></div>`, sh => {
    paintSwatches(sh);
    const ta = $('#noteIn', sh); let t = 0;
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const v = ta.value.trim(); if (v) S.notes[k] = v; else delete S.notes[k]; touch(); }, 300); });
  });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-term],[data-tadd],[data-tknow],[data-tmode],[data-paper]'); if (!t) return;
  const d = t.dataset;
  if (d.term !== undefined) { termSheet(d.term); return; }
  if (d.tadd) { learnTerm(d.tadd, false); addXP(2); touch(); toast('Öğrenme listene eklendi · ilk tekrar yarın'); closeSheet(); rerender(); return; }
  if (d.tknow) { knowTerm(d.tknow); touch(); toast('Biliyordum olarak işaretlendi'); closeSheet(); rerender(); return; }
  if (d.tmode) { closeSheet(); stLaunch(d.tmode, { ids: [d.k], label: 'Tek terim' }); return; }
  if (d.paper !== undefined) { paperSheet(+d.paper); }
});
function paperSheet(i) {
  const L = LEVELS[i], I = levelInfo(), open = i <= I.i, ph = EB.phaseOf();
  openSheet(`<div class="sheet-h"><div><span class="eyebrow">${i + 1}. basamak · ${esc(L.t)}</span><h2>${esc(L.e)}</h2></div><button class="iconbtn" data-close aria-label="Kapat">${IC('x')}</button></div>
    <div class="sum-paper" style="height:240px;${open ? '' : 'filter:grayscale(1) blur(3px);opacity:.6'}" data-lvimg="${i}" data-w="640" data-h="300" data-pal="${ph}"></div>
    <p class="muted">${esc(L.d)}</p>
    <p style="margin-top:10px;font-weight:800">${open ? 'Bu kâğıt koleksiyonunda. Ana sayfadaki tekne bu basamağın tekniğiyle çalışır.' : `${(L.xp - S.xp).toLocaleString('tr-TR')} XP sonra açılır.`}</p>`, sh => paintSwatches(sh));
}
function rerender() { (RENDER[VIEW] || (() => {}))(); updateTop(); }

/* ---------- ayarlar ---------- */
function sw(key, label, sub) { return `<div class="set-row"><span><span class="lab">${label}</span>${sub ? `<small>${sub}</small>` : ''}</span><button class="switch" role="switch" aria-checked="${!!S.pref[key]}" data-pref="${key}" aria-label="${label}"></button></div>`; }
function segP(key, opts, label, sub) { return `<div class="set-row"><span><span class="lab">${label}</span>${sub ? `<small>${sub}</small>` : ''}</span><div class="seg" role="group" aria-label="${label}">${opts.map(([v, t]) => `<button data-pseg="${key}" data-v="${v}" aria-pressed="${String(S.pref[key]) === String(v)}">${t}</button>`).join('')}</div></div>`; }
function settingsSheet() {
  openSheet(`<div class="sheet-h"><h2>Ayarlar</h2><button class="iconbtn" data-close aria-label="Kapat">${IC('x')}</button></div>
    <div class="set-g"><h3>Okuma rahatlığı</h3>
      <div class="set-row"><span><span class="lab">Yazı boyutu</span><small>Bütün uygulama büyür ya da küçülür</small></span><input type="range" min="15" max="28" step="1" value="${S.pref.fs}" id="fsIn" aria-label="Yazı boyutu"></div>
      <p class="preview-text">Örnek: <b>Serbest dolaylı anlatım</b>, karakterin iç sesini anlatıcının cümlesine karıştırır.</p>
      ${sw('lh', 'Geniş satır aralığı', 'Uzun tanımlarda gözü yormaz')}
      ${sw('hc', 'Yüksek kontrast', 'Gri yazıları koyulaştırır')}
      ${segP('theme', [['light', 'Açık'], ['dark', 'Koyu'], ['auto', 'Saate göre']], 'Tema', 'Saate göre: gece koyu tekne')}
    </div>
    <div class="set-g"><h3>Hareket ve ses</h3>
      ${segP('motion', [['full', 'Tam'], ['calm', 'Sade'], ['off', 'Kapalı']], 'Hareketler', 'Sade: tekne durur, kutlamalar küçülür')}
      ${segP('intro', [['day', 'Günde bir'], ['always', 'Her açılışta'], ['off', 'Kapalı']], 'Açılış animasyonu', 'Boyalar serpilir, kâğıt kaldırılır')}
      ${sw('sound', 'Ses efektleri', 'Doğru, yanlış ve damla sesleri')}
      ${sw('haptic', 'Titreşim', 'Android cihazlarda dokunsal geri bildirim')}
      ${sw('adv', 'Doğruysa otomatik ilerle', 'Yanlışta her zaman durur ve açıklar')}
    </div>
    ${TTS.ok ? `<div class="set-g"><h3>Sesli okuma</h3>${sw('auto', 'Soruları otomatik oku', 'Terim ve tanımı Türkçe sesle okur')}
      <div class="set-row"><span class="lab">Okuma hızı</span><input type="range" min="0.6" max="1.4" step="0.05" value="${S.pref.rate}" id="rateIn" aria-label="Okuma hızı"></div></div>` : ''}
    <div class="set-g"><h3>Hedef</h3>${segP('goal', [[50, '50'], [100, '100'], [150, '150'], [250, '250']], 'Günlük XP hedefi', 'Bir tekrar 3, yeni bir terim 5 XP getirir')}</div>
    <div class="set-g"><h3>Kayıt</h3>
      <p class="muted" style="font-size:.92rem;margin-bottom:10px">İlerlemen bu cihazın tarayıcısında saklanır. Başka bir cihaza taşımak için yedeği indir, öbür cihazda geri yükle.</p>
      <div class="sess-actions" style="justify-content:flex-start;margin-top:0"><button class="btn ghost sm" id="bkDown">${IC('down', 'sm')}Yedeği indir</button><label class="btn ghost sm" for="bkUp">${IC('up', 'sm')}Yedeği yükle</label><input type="file" id="bkUp" accept="application/json,.json" hidden><button class="btn no sm" id="bkReset">Sıfırla</button></div>
    </div>
    <p class="faint" style="font-size:.8rem;font-weight:700;margin-top:6px">Terim Atölyesi · sürüm 2 · ${ITEMS.length} terim, ${PASSAGES.length} yakın okuma metni</p>`, sh => {
    const fs = $('#fsIn', sh); fs.oninput = () => { S.pref.fs = +fs.value; applyPrefs(); touch(); moveInd(); };
    const rt = $('#rateIn', sh); if (rt) rt.onchange = () => { S.pref.rate = +rt.value; touch(); speak('Serbest dolaylı anlatım'); };
    $('#bkDown', sh).onclick = () => {
      flush(); const blob = new Blob([JSON.stringify(S)], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `terim-atolyesi-yedek-${ymd()}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('Yedek indirildi');
    };
    $('#bkUp', sh).onchange = ev => {
      const f = ev.target.files && ev.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { try { const o = JSON.parse(rd.result); if (!o || o.v !== 2 || typeof o.p !== 'object') throw 0; localStorage.setItem(LS2, JSON.stringify(o)); toast('Yedek yüklendi · yeniden açılıyor'); setTimeout(() => location.reload(), 700); } catch (er) { toast('Bu dosya bir Terim Atölyesi yedeği değil'); } };
      rd.readAsText(f);
    };
    $('#bkReset', sh).onclick = () => { if (confirm('Bütün ilerleme, notlar ve yıldızlar silinsin mi? Bu geri alınamaz.')) { const pref = S.pref; S = freshState(); S.pref = pref; flush(); closeSheet(); show('home', { force: true }); toast('Atölye sıfırlandı'); } };
  });
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-pref],[data-pseg]'); if (!t) return;
  if (t.dataset.pref) { const k = t.dataset.pref; S.pref[k] = S.pref[k] ? 0 : 1; t.setAttribute('aria-checked', !!S.pref[k]); applyPrefs(); touch(); haptic('tap'); return; }
  const k = t.dataset.pseg, raw = t.dataset.v, v = /^\d+$/.test(raw) ? +raw : raw;
  S.pref[k] = v; $$(`[data-pseg="${k}"]`).forEach(b => b.setAttribute('aria-pressed', b === t)); applyPrefs(); touch();
  if (k === 'motion' && VIEW === 'home') { tekneStop(); RENDER.home(); }
  if (k === 'theme' && VIEW === 'home') { RENDER.home(); }
});

/* =====================================================================
   OTURUM — keşif ve aralıklı tekrar
   ===================================================================== */
let SES = null;
function sesBase(kind, title, extra) { return Object.assign({ kind, title, ok: 0, no: 0, combo: 0, maxCombo: 0, xp0: S.xp, t0: Date.now(), wrong: new Set(), done: false, ans: false, q: null }, extra || {}); }
function discStart(c) {
  const pool = nextNewIn(c);
  if (!pool.length) { toast(c ? 'Bu boyada yeni terim kalmadı' : 'Bütün terimleri keşfettin'); return; }
  SES = sesBase('disc', c ? 'Keşif · ' + CATS[c] : 'Keşif', { cat: c, pool: pool.slice(), batch: [], checkQ: [], phase: 'meet', met: 0, added: 0, known: 0, firstOk: {} });
  discNext(); show('sess');
}
function discNext() {
  const s = SES;
  if (s.phase === 'check' && s.checkQ.length) { s.q = makeQ(s.checkQ[0], 'term'); s.ans = false; return; }
  if (s.phase === 'check') {
    s.batch.forEach(it => { learnTerm(it.k, !!s.firstOk[it.k]); s.added++; });
    addXP(5 * s.batch.length); s.batch = []; s.phase = 'meet'; touch();
    if (s.added && s.added % 10 === 0) toast(`${s.added} terim öğrenme listende · ilk tekrarları yarın`);
  }
  if (s.phase === 'meet' || s.phase === 'proof') {
    if (!s.pool.length) { if (s.batch.length) { s.phase = 'check'; s.checkQ = shuffle(s.batch); return discNext(); } sesFinish(); return; }
    s.cur = s.pool[0]; s.phase = 'meet'; s.ans = false; s.q = null;
  }
}
function revStart(list, title) {
  const q = list || dueList();
  if (!q.length) { toast('Şu an vadesi gelen terim yok'); return; }
  SES = sesBase('rev', title || 'Tekrar', { queue: q.slice(), graded: new Set(), total: q.length, list: !!list });
  revNext(); show('sess');
}
function revNext() {
  const s = SES;
  if (!s.queue.length) {
    if (!s.list) { const more = dueList().filter(x => !s.graded.has(x.k)); if (more.length) { s.queue = more; s.total += more.length; } }
    if (!s.queue.length) { sesFinish(); return; }
  }
  const it = s.queue[0];
  s.q = makeQ(it, s.graded.has(it.k) ? 'term' : typeForStage(it)); s.ans = false; s.typed = '';
}
function sesFinish() { SES.done = true; flush(); if (VIEW === 'sess') renderSess(); }
function sesQuit() {
  if (!SES || SES.done) { SES = null; show('home', { force: true }); return; }
  if (SES.kind === 'disc' && SES.batch.length) { SES.batch.forEach(it => { learnTerm(it.k, !!SES.firstOk[it.k]); SES.added++; }); SES.batch = []; }
  sesFinish();
}

/* ---------- soru görünümü (ortak) ---------- */
function qPromptHTML(q) {
  const it = q.it;
  if (q.type === 'def') return `<div class="q-k"><span class="q-label">Bu terim ne demek?</span>${catChip(it.c)}</div><div class="bigterm">${esc(it.t)}</div><div class="en-tag" lang="en">${esc(it.en)}</div>`;
  if (q.type === 'term') return `<div class="q-k"><span class="q-label">Hangi terim?</span>${catChip(it.c)}</div><p class="qdef">${esc(it.m)}</p>`;
  if (q.type === 'ex') return `<div class="q-k"><span class="q-label">Bu örnek hangi terimi gösteriyor?</span>${catChip(it.c)}</div><p class="qex">${esc(maskTerm(it.ex, it))}</p>`;
  if (q.type === 'en') return `<div class="q-k"><span class="q-label">İngilizcesi verilen terim</span>${catChip(it.c)}</div><div class="bigterm md" lang="en">${esc(it.en)}</div>`;
  return `<div class="q-k"><span class="q-label">Terimi yaz</span>${catChip(it.c)}</div><p class="qdef">${esc(it.m)}</p>`;
}
/* optsHTML: studio.js'te (oturum ve Stüdyo ortak) */
const TR_KEYS = ['ç', 'ğ', 'ı', 'İ', 'ö', 'ş', 'ü', 'â', 'î'];
function typeHTML(ans, typed, cls) {
  return `<div class="typein"><input id="ansIn" class="${cls || ''}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="Terimi yaz…" ${ans ? `disabled value="${esc(typed || '')}"` : ''} aria-label="Cevabın"><button class="btn" data-sact="check" ${ans ? 'disabled' : ''}>Kontrol et</button></div>
    ${ans ? '' : `<div class="trkeys" aria-label="Türkçe harfler">${TR_KEYS.map(k => `<button data-trk="${k}" tabindex="-1">${k}</button>`).join('')}</div>`}`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-trk]'); if (!b) return;
  const i = $('#ansIn') || $('#plIn'); if (!i || i.disabled) return;
  const s = i.selectionStart ?? i.value.length, en = i.selectionEnd ?? i.value.length;
  i.value = i.value.slice(0, s) + b.dataset.trk + i.value.slice(en); i.focus(); i.setSelectionRange(s + 1, s + 1);
});
function diffHTML(given, target) {
  const a = [...lowerTr(given)], b = [...target], n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === lowerTr(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0, out = '';
  while (j < m) {
    if (i < n && a[i] === lowerTr(b[j])) { out += esc(b[j]); i++; j++; }
    else if (i < n && dp[i + 1][j] >= dp[i][j + 1]) i++;
    else { out += `<mark class="miss">${esc(b[j])}</mark>`; j++; }
  }
  return out;
}
function fbHTML(ok, it, note, extra) {
  return `<div class="fb ${ok ? 'good' : 'bad'}" role="status">
    <div class="fb-h">${ok ? `<span class="badge-ok">${IC('check', 'sm')}${esc(note || pick(['Doğru', 'Harika', 'Tam isabet', 'Kusursuz', 'Aynen öyle']))}</span>` : `<span class="badge-no">${IC('x', 'sm')}${esc(note || 'Yanlış')}</span>`}</div>
    ${extra || ''}
    <div class="ans">${esc(it.t)}</div><p class="def">${esc(it.m)}</p><p class="ex">${esc(it.ex)}</p>
  </div>`;
}
function sesHeader() {
  const s = SES; let p = null, hud = '';
  if (s.kind === 'disc') { const tot = s.met + s.pool.length; p = tot ? s.met / tot : 1; hud = `${s.added} öğrenildi · ${s.known} biliyordun`; }
  if (s.kind === 'rev') { p = s.total ? s.graded.size / s.total : 1; hud = `${s.queue.length} kaldı`; }
  return `<div class="pl-top">
    <button class="iconbtn" data-sact="quit" aria-label="${s.done ? 'Kapat' : 'Bitir'}">${IC('x')}</button>
    <div class="pl-t"><b>${IC(s.kind === 'disc' ? 'spark' : 'review', 'sm')}${esc(s.kind === 'disc' ? 'Keşif' : 'Tekrar')}</b><span>${esc(s.title)}</span></div>
    ${s.done ? '' : `<span class="hud">${esc(hud)}</span>`}
    <span class="combo" id="sCombo" ${s.combo >= 3 && !s.done ? '' : 'hidden'}>${IC('flame', 'sm')}<span>×${s.combo}</span></span>
    <span class="pl-xp tnum" id="sXP">+${S.xp - s.xp0} XP</span>
  </div>${p !== null ? `<div class="prog"><span style="width:${(s.done ? 100 : p * 100).toFixed(1)}%"></span></div>` : ''}`;
}
function renderSess() {
  const v = $('#v-sess'), s = SES; if (!s) { show('home', { force: true }); return; }
  if (s.done) { v.innerHTML = sesHeader() + sesSummaryHTML(); countUps(v); paintSwatches(v); return; }
  let body = '';
  if (s.kind === 'disc' && s.phase === 'meet') {
    const it = s.cur;
    body = `<article class="paper meet enter" style="${catStyle(it.c)}" id="paperQ">
      <span class="strip" data-strip="${it.c}" aria-hidden="true"></span>
      <div class="cat-line">${catChip(it.c)}<span class="chip">${s.met + 1}. terim</span><span class="spacer"></span>${TTS.ok ? `<button class="iconbtn plain" data-say="${esc(it.k)}" aria-label="Sesli oku">${IC('speak')}</button>` : ''}</div>
      <div class="bigterm">${esc(it.t)}</div><div class="en-tag" lang="en">${esc(it.en)}</div>
      <p class="def">${esc(it.m)}</p>
      <p class="qex ex">${esc(it.ex)}</p>
      <div class="decide"><button class="btn ghost lg" data-sact="know">${IC('check')}Zaten biliyorum</button><button class="btn lg" data-sact="learn">${IC('plus')}Öğrenmeye al</button></div>
      <p class="kbd">← biliyorum · → öğrenmeye al · Sonraki ${Math.max(0, 5 - s.batch.length)} terimden sonra kısa kontrol</p>
    </article>`;
  } else {
    const q = s.q, it = q.it;
    const label = s.kind === 'disc' ? (s.phase === 'proof' ? '<p class="hint" style="margin-bottom:8px">Bildiğini kanıtla: tek soru.</p>' : `<p class="hint" style="margin-bottom:8px">Kısa kontrol · ${s.batch.length - s.checkQ.length + 1}/${s.batch.length}</p>`) : '';
    let ansArea = q.type === 'type' ? typeHTML(s.ans, s.typed, s.ans ? (s.ok1 ? 'ok' : 'no') : '') + (s.ans ? '' : `<div class="row" style="margin-top:10px"><span class="hint">İpucu: «${esc(it.main.charAt(0))}…», ${it.main.length} harf</span><span class="spacer"></span><button class="linkbtn" data-sact="idk">Bilmiyorum</button></div>`) : optsHTML(q, s.ans, 'sopt');
    const extra = q.type === 'type' && s.ans && s.typed && (!s.ok1 || s.near) ? `<p>Doğrusu: <b>${diffHTML(s.typed, it.main)}</b></p>` : '';
    body = `<article class="paper ${s.ans ? '' : 'enter'}" style="${catStyle(it.c)}" id="paperQ"><span class="strip" data-strip="${it.c}" aria-hidden="true"></span>
      ${label}${qPromptHTML(q)}${ansArea}
      ${s.ans ? fbHTML(s.ok1, it, s.near ? 'Neredeyse' : s.ok1 ? '' : (s.typed ? 'Yanlış' : 'Doğrusu bu'), extra) : ''}
    </article>
    ${s.ans ? `<div class="sess-actions">${s.canOv ? `<button class="btn ghost" data-sact="override">${IC('check')}Aslında doğru yazdım</button>` : ''}<button class="btn lg" data-sact="next" id="nextBtn">Devam ${IC('arrow')}</button></div><p class="kbd">Enter: devam</p>` : `<p class="kbd">${q.type === 'type' ? 'Enter: kontrol et' : '1–4 tuşlarıyla seçebilirsin'}</p>`}`;
  }
  v.innerHTML = sesHeader() + `<div class="stagewrap">${body}</div>`;
  paintStrips(v);
  const i = $('#ansIn'); if (i && !i.disabled) setTimeout(() => i.focus({ preventScroll: true }), 60);
  const nb = $('#nextBtn'); if (nb) setTimeout(() => nb.focus({ preventScroll: true }), 30);
  if (S.pref.auto && !s.ans) { const say = s.kind === 'disc' && s.phase === 'meet' ? `${s.cur.main}. ${s.cur.m}` : s.q && (s.q.type === 'def' ? s.q.it.main : s.q.type === 'ex' ? maskTerm(s.q.it.ex, s.q.it) : s.q.it.m); setTimeout(() => speak(say), 200); }
}
RENDER.sess = renderSess;
function paintStrips(root) {
  $$('[data-strip]', root).forEach(el => { const c = el.dataset.strip; idle(() => { const u = stripURL(c); if (u) el.style.backgroundImage = `url(${u})`; }); });
}
function sesFx(el, ok, xp) {
  haptic(ok ? 'ok' : 'no'); sfx(ok ? 'ok' : 'no');
  const s = SES, it = s.q ? s.q.it : s.cur;
  const done = () => { const x = $('#sXP'); if (x && SES === s) x.textContent = '+' + (S.xp - s.xp0) + ' XP'; };
  if (ok) {
    if (el) splashAt(el, 16, [PIG[it.c].h, '#FFFFFF', PIG[it.c].h]);
    if (xp && el) flyTo(el, $('#sXP'), '+' + xp, 'xp', done); else done();
    const c = $('#sCombo');
    if (c && s.combo >= 3) { c.hidden = false; c.querySelector('span').textContent = '×' + s.combo; if (s.combo % 5 === 0) { bump(c); splashAt(c, 20, ['#E09E06', '#DD3A2A', '#FFFFFF']); haptic('big'); } }
  } else { if (el) shake(el); done(); }
}
function sesAnswer(ok, el, extra) {
  const s = SES, it = s.q.it;
  s.ans = true; s.ok1 = ok; countAnswer(ok);
  if (ok) { s.ok++; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo); } else { s.no++; s.combo = 0; s.wrong.add(it.k); }
  let xp = 0;
  if (s.kind === 'rev') {
    if (!s.graded.has(it.k)) { grade(it.k, ok); s.graded.add(it.k); if (ok) xp = 3; }
    else if (ok) xp = 1;
    s.queue.shift();
    if (!ok) s.queue.splice(Math.min(3, s.queue.length), 0, it);
  } else if (s.kind === 'disc') {
    if (s.phase === 'proof') {
      if (ok) { knowTerm(it.k); s.known++; xp = 4; }
      else { s.batch.push(it); }
    } else {
      if (!(it.k in s.firstOk)) s.firstOk[it.k] = ok;
      s.checkQ.shift(); if (ok) xp = 2; else s.checkQ.push(it);
    }
  }
  if (xp) addXP(xp);
  touch(); renderSess();
  const pq = $('#paperQ');
  const el2 = (el && el.dataset && el.dataset.sopt !== undefined) ? $(`[data-sopt="${el.dataset.sopt}"]`) : $('#ansIn') || pq;
  sesFx(el2, ok, xp);
  if (ok && !s.near && S.pref.adv) { const q = s.q; setTimeout(() => { if (SES === s && s.q === q && s.ans && VIEW === 'sess') sesGo(); }, 1100); }
}
function sesGo() {
  const s = SES; if (!s || s.done) return;
  s.near = false; s.canOv = false; s.typed = '';
  if (s.kind === 'rev') revNext();
  else { if (s.phase === 'proof') { s.pool.shift(); s.met++; s.phase = 'meet'; } if (s.phase === 'meet' && s.batch.length >= 5) { s.phase = 'check'; s.checkQ = shuffle(s.batch); } discNext(); }
  if (VIEW === 'sess') renderSess();
}
function sesAct(a, t) {
  const s = SES; if (!s) return;
  if (a === 'quit') { if (s.done) { SES = null; show('home', { force: true }); } else sesQuit(); return; }
  if (s.done) {
    if (a === 'again-rev') { revStart(); return; }
    if (a === 'again-disc') { discStart(s.cat); return; }
    if (a === 'wrong') { const ids = [...s.wrong]; SES = null; stLaunch('learn', { ids, label: 'Yanlışların' }); return; }
    if (a === 'home') { SES = null; show('home', { force: true }); }
    return;
  }
  if (s.kind === 'disc' && s.phase === 'meet') {
    const it = s.cur;
    if (a === 'know') { s.phase = 'proof'; s.q = makeQ(it, 'def'); s.ans = false; renderSess(); return; }
    if (a === 'learn') {
      s.batch.push(it); s.pool.shift(); s.met++;
      const el = $('#paperQ'); haptic('tap'); sfx('drop');
      outAnim(el, 'r', () => { if (s.batch.length >= 5) { s.phase = 'check'; s.checkQ = shuffle(s.batch); } discNext(); renderSess(); });
      return;
    }
    return;
  }
  if (s.ans) {
    if (a === 'next') { sesGo(); return; }
    if (a === 'override' && s.canOv) {
      const it = s.q.it; s.canOv = false; s.ok1 = true; s.no--; s.ok++; s.wrong.delete(it.k);
      if (s.kind === 'rev') { const p = S.p[it.k]; if (p) { p.w = Math.max(0, p.w - 1); p.s = Math.max(p.s, 1); grade(it.k, true); } s.queue = s.queue.filter((x, i) => !(x.k === it.k && i < 4)); }
      else if (s.kind === 'disc') { s.firstOk[it.k] = true; s.checkQ = s.checkQ.filter(x => x.k !== it.k); }
      toast('Doğru sayıldı'); renderSess(); return;
    }
    return;
  }
  if (a === 'check' || a === 'idk') {
    const it = s.q.it, v = a === 'idk' ? '' : (($('#ansIn') || {}).value || '').trim();
    if (a === 'check' && !v) return;
    const res = a === 'idk' ? 'no' : checkTyped(v, it);
    s.typed = v; s.near = res === 'near'; s.canOv = res === 'no' && a === 'check';
    sesAnswer(res !== 'no', null);
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-sact],[data-sopt]'); if (!t || !SES) return;
  if (t.dataset.sact) { sesAct(t.dataset.sact, t); return; }
  const s = SES; if (s.ans || !s.q) return;
  const o = s.q.options[+t.dataset.sopt]; if (!o) return; o.picked = true; sesAnswer(o.ok, t);
});
document.addEventListener('keydown', e => {
  if (VIEW !== 'sess' || !SES || !$('#sheetBg').hidden) return;
  const s = SES, inInput = !!(e.target && /INPUT|TEXTAREA/.test(e.target.tagName));
  if (e.key === 'Escape') { sesAct('quit'); return; }
  if (s.done) return;
  if (s.kind === 'disc' && s.phase === 'meet') { if (e.key === 'ArrowLeft') sesAct('know'); else if (e.key === 'ArrowRight' || e.key === 'Enter') sesAct('learn'); return; }
  if (inInput) { if (e.key === 'Enter') { e.preventDefault(); sesAct(s.ans ? 'next' : 'check'); } return; }
  if (!s.ans && /^[1-4]$/.test(e.key) && s.q && s.q.options) { const b = $(`[data-sopt="${+e.key - 1}"]`); if (b) b.click(); }
  else if (s.ans && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sesGo(); }
});
function sesSummaryHTML() {
  const s = SES, acc = s.ok + s.no ? Math.round(s.ok / (s.ok + s.no) * 100) : 0, xp = S.xp - s.xp0, wrong = [...s.wrong].map(k => BYK[k]).filter(Boolean);
  const I = levelInfo();
  let title, big, sub, rows, btns, note = '';
  if (s.kind === 'disc') {
    title = s.added + s.known ? 'Tekneye yeni boyalar' : 'Ara verdin'; big = s.added + s.known; sub = 'terimle tanıştın';
    rows = [['Öğrenmeye alınan', s.added], ['Zaten biliyordun', s.known], ['Doğruluk', '%' + acc], ['XP', '+' + xp]];
    note = s.added ? `${s.added} terim aralıklı tekrar listende. İlk tekrarları yarın; doğru bildikçe 3 gün, 1 hafta, 2 hafta ve 1 ay sonra geri gelecekler.` : '';
    btns = `${nextNewIn(s.cat).length ? `<button class="btn lg" data-sact="again-disc">${IC('spark')}Keşfe devam</button>` : ''}`;
  } else {
    title = s.no ? 'Tekrar tamam' : 'Kusursuz tekrar'; big = '%' + acc; sub = `${s.graded.size} terim tekrarlandı`;
    rows = [['Doğru', s.ok], ['Yanlış', s.no], ['En uzun seri', s.maxCombo], ['XP', '+' + xp]];
    note = s.no ? 'Yanlış yaptığın terimler en baştan başladı ve yarın yeniden gelecek. Şimdi Öğren moduyla üç basamakta pekiştirebilirsin.' : 'Hepsi bir basamak yukarı çıktı; bir sonraki tekrarları daha uzun aralıkla gelecek.';
    btns = dueList().length ? `<button class="btn lg" data-sact="again-rev">${IC('review')}Kalan tekrarlar (${dueList().length})</button>` : '';
  }
  if (!s.cele && (s.ok >= 8 || s.added >= 5)) { s.cele = 1; setTimeout(() => { confetti(140); sfx('win'); }, 150); }
  return `<div class="stagewrap"><section class="card sum rise">
      <div class="sum-paper" data-lvimg="${I.i}" data-w="760" data-h="300" data-pal="${EB.phaseOf()}"></div>
      <h1>${esc(title)}</h1><div class="sum-big tnum">${big}</div><p class="muted">${esc(sub)}</p>
      <div class="sum-stats">${rows.map(([a, b]) => `<div class="stat"><b class="tnum">${b}</b><span>${a}</span></div>`).join('')}</div>
      ${note ? `<p class="note">${esc(note)}</p>` : ''}
      <div class="sess-actions" style="justify-content:center">${btns}${wrong.length ? `<button class="btn no lg" data-sact="wrong">${IC('learn')}Yanlışlarla Öğren (${wrong.length})</button>` : ''}<button class="btn ghost lg" data-sact="home">${IC('home')}Atölyeye dön</button></div>
    </section>
    ${wrong.length ? `<section class="card" style="margin-top:14px"><div class="card-h"><h2>Gözden geçir</h2><span class="faint" style="font-weight:800">${wrong.length} terim</span></div><div class="wlist">${wrong.map(x => `<div class="wl" style="${catStyle(x.c)}"><b>${esc(x.t)}</b><span>${esc(x.m)}</span></div>`).join('')}</div></section>` : ''}</div>`;
}

/* =====================================================================
   SEVİYE ATLAMA — yeni ebru kâğıdı
   ===================================================================== */
ON_LEVEL = i => {
  const L = LEVELS[i], ph = EB.phaseOf();
  const box = document.createElement('div'); box.className = 'lvup'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Yeni basamak');
  box.innerHTML = `<div class="lvup-card"><div class="lvup-paper" id="lvupP"></div><div class="lvup-in">
      <span class="eyebrow">Yeni basamak · ${i + 1}/${LEVELS.length}</span><h2>${esc(L.e)}</h2>
      <p><b>${esc(L.t)}</b> oldun. ${esc(L.d)}</p>
      <p class="faint" style="margin-top:8px;font-weight:700;font-size:.88rem">Ana sayfadaki teknen artık bu teknikle çalışıyor.</p>
      <div class="sess-actions" style="justify-content:center"><button class="btn lg" data-lvok>${IC('check')}Kâğıdı al</button></div></div></div>`;
  document.body.appendChild(box);
  const url = EB.image('lv:' + i + ':800x340:' + ph, L.tech, 800, 340, 1000 + i * 37, ph);
  $('#lvupP', box).style.backgroundImage = `url(${url})`;
  setTimeout(() => { confetti(170); sfx('win'); haptic('big'); }, 500);
  const close = () => { box.remove(); if (VIEW === 'home') RENDER.home(); updateTop(); };
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('[data-lvok]')) close(); });
  setTimeout(() => { const b = $('[data-lvok]', box); if (b) b.focus(); }, 300);
};

/* =====================================================================
   YÖNLENDİRME, AÇILIŞ
   ===================================================================== */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); haptic('tap'); show(g.dataset.go); return; }
  const c = e.target.closest('[data-cat]'); if (c && !e.target.closest('[data-run]')) { CAT = c.dataset.cat; show('cat'); return; }
  const r = e.target.closest('[data-run]'); if (!r || r.disabled) return;
  const a = r.dataset.arg || '';
  switch (r.dataset.run) {
    case 'review': revStart(a ? dueList().filter(x => x.c === a) : null, a ? 'Tekrar · ' + CATS[a] : null); break;
    case 'disc': discStart(a || null); break;
    case 'hard': stLaunch('learn', { ids: ITEMS.filter(x => isHard(x.k)).map(x => x.k), label: 'Zorlu terimler' }); break;
    case 'exam': stLaunch('exam', {}); break;
    case 'studio': { const st = stSet(); st.src = a ? 'c:' + a : 'all'; touch(); show('studio'); break; }
    case 'mode': stLaunch(a, r.dataset.src ? { set: { src: 'c:' + r.dataset.src } } : {}); break;
    case 'p2': p2Run(a || 'go'); break;
  }
});
$('#brand').addEventListener('click', () => show('home'));
$('#btnSettings').addEventListener('click', settingsSheet);
let INSTALL = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); INSTALL = e; const b = $('#btnInstall'); if (b) b.hidden = false; });
window.addEventListener('appinstalled', () => { INSTALL = null; const b = $('#btnInstall'); if (b) b.hidden = true; toast('Terim Atölyesi cihazına kuruldu'); });
$('#btnInstall').addEventListener('click', async () => { if (!INSTALL) return; INSTALL.prompt(); try { await INSTALL.userChoice; } catch (e) {} INSTALL = null; $('#btnInstall').hidden = true; });
window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(moveInd, 120); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { applyPrefs(); updateTop(); } });

function boot() {
  applyPrefs();
  if (MIGRATED) { flush(); setTimeout(() => toast('Önceki sürümdeki ilerlemen yeni atölyeye taşındı'), 2400); }
  VIEW = 'home'; document.documentElement.dataset.view = 'home';
  RENDER.home(); moveInd(); updateTop();
  maybeIntro();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
  try {
    const go = new URLSearchParams(location.search).get('go');
    if (go) {
      history.replaceState(null, '', location.pathname);
      setTimeout(() => { if (go === 'review') { if (dueList().length) revStart(); else show('studio'); } else if (PAGES.includes(go)) show(go); }, 300);
    }
  } catch (e) {}
}
