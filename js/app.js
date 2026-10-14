document.documentElement.lang="tr";
const I=D.map(r=>({k:r[1],c:r[0],t:r[1],en:r[2],m:r[3],ex:r[4],main:r[1].split(" / ")[0]}));
const BY={};I.forEach(x=>BY[x.k]=x);
const CC={t:"#1E4FC2",a:"#0A8A86",k:"#7A3FB0",o:"#D23A2C",c:"#C8650A",s:"#13874E",i:"#B5317F",z:"#2D3E9E",d:"#B07C00",g:"#0F6E5C",n:"#C24477",r:"#A8452B",e:"#5157D0",m:"#8A47C9",l:"#0B6F8A",y:"#8B5A2B",b:"#D99000",f:"#5E7D1E",p:"#2F86C9"};
const DAY=864e5, IV=[1,3,7,14,30];
const LEVELS=[[0,"Okur"],[300,"Dikkatli okur"],[900,"Yakın okuyucu"],[2000,"Yorumcu"],[4000,"Eleştirmen"],[7000,"Kuramcı"],[11000,"Usta eleştirmen"]];
const PRAISE=["Doğru!","Harika!","Çok iyi!","Tam isabet!","Aynen öyle!","Kusursuz!"];
const LS="terim-atolyesi-v1";
const DEF={p:{},xp:0,days:{},fs:19,exam:null,upd:0,theme:"light",hc:0,lh:0,motion:1,auto:0,rate:0.95,goal:150,ta:0,tc:0};
let S=Object.assign({},DEF);
try{const s=JSON.parse(localStorage.getItem(LS));if(s){S=Object.assign({},DEF,s);if(!s.theme)S.fs=Math.max(S.fs,19)}}catch(e){}
const $=s=>document.querySelector(s), app=$("#app");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.random()*a.length|0];
const today=()=>new Date().toLocaleDateString("sv");
const ic=n=>`<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const catChip=c=>`<span class="cchip" style="--cc:${CC[c]}"><i aria-hidden="true"></i>${CATS[c]}</span>`;
function render(h){app.innerHTML=h;app.onclick=null}
function announce(t){const e=$("#sr");e.textContent="";setTimeout(()=>e.textContent=t,40)}
function toast(t){const e=$("#toast");e.textContent=t;e.hidden=false;clearTimeout(e._t);e._t=setTimeout(()=>e.hidden=true,2200)}
function applyPrefs(){const r=document.documentElement;r.style.setProperty("--fs",S.fs+"px");r.style.setProperty("--lh",S.lh?"1.85":"1.6");
 if(S.theme==="system")r.removeAttribute("data-theme");else r.setAttribute("data-theme",S.theme);
 r.toggleAttribute("data-hc",!!S.hc);r.toggleAttribute("data-still",!S.motion)}
applyPrefs();

/* ---------- sesli okuma ---------- */
const TTS={ok:"speechSynthesis" in window,v:null};
function pickVoice(){try{const vs=speechSynthesis.getVoices();TTS.v=vs.find(v=>/^tr/i.test(v.lang))||null}catch(e){}}
if(TTS.ok){pickVoice();try{speechSynthesis.onvoiceschanged=pickVoice}catch(e){}}
function speak(t){if(!TTS.ok||!t)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="tr-TR";if(TTS.v)u.voice=TTS.v;u.rate=S.rate;speechSynthesis.speak(u)}catch(e){}}
const sayBtn=()=>TTS.ok?`<button class="btn ghost icon" id="say" aria-label="Sesli oku" title="Sesli oku (S)">${ic("speak")}</button>`:"";
let SAY="";
function bindSay(){const b=$("#say");if(b)b.onclick=()=>speak(SAY)}

/* ---------- kayıt (cihaz) ---------- */
function save(){S.upd=Date.now();try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}

/* ---------- ilerleme ---------- */
const P=k=>S.p[k];
const isMast=k=>P(k)&&P(k).s>=6, isLearn=k=>P(k)&&P(k).s<6;
const isDue=k=>isLearn(k)&&P(k).d<=Date.now();
const hard=k=>P(k)&&P(k).w>=2;
function counts(list=I){let seen=0,learn=0,mast=0,due=0;list.forEach(x=>{if(P(x.k)){seen++;isMast(x.k)?mast++:learn++;isDue(x.k)&&due++}});return{seen,learn,mast,due,total:list.length}}
function grade(k,ok){const p=S.p[k]||(S.p[k]={s:0,d:0,w:0});
 if(ok){const s=Math.min(p.s,4);p.d=Date.now()+IV[s]*DAY;p.s=Math.min(6,p.s+1)}else{p.s=0;p.d=Date.now();p.w=(p.w||0)+1}}
function addXP(n){if(!n)return;S.xp+=n;const t=today();S.days[t]=(S.days[t]||0)+n}
function streak(){let n=0,d=new Date();if(!S.days[today()])d.setDate(d.getDate()-1);while(S.days[d.toLocaleDateString("sv")]){n++;d.setDate(d.getDate()-1)}return n}
function level(){let i=0;while(i+1<LEVELS.length&&S.xp>=LEVELS[i+1][0])i++;const N=LEVELS[i+1];return{name:LEVELS[i][1],from:LEVELS[i][0],to:N?N[0]:null,next:N?N[1]:null}}
function forecast(){const out=Array(7).fill(0),t0=new Date();t0.setHours(0,0,0,0);
 I.forEach(x=>{if(isLearn(x.k)){const d=Math.max(0,Math.floor((P(x.k).d-t0.getTime())/DAY));if(d<7)out[d]++}});return out}

/* ---------- yanıt kontrolü ---------- */
const norm=s=>s.toLocaleLowerCase("tr").replace(/\(.*?\)/g,"").replace(/[çğıöşüâîû]/g,c=>"cgiosuaiu"["çğıöşüâîû".indexOf(c)]).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
function lev(a,b){const m=a.length,n=b.length,d=Array.from({length:m+1},(_,i)=>[i]);for(let j=1;j<=n;j++)d[0][j]=j;for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[m][n]}
function check(it,ans){const a=norm(ans);if(!a)return 0;const forms=it.t.split(" / ").map(norm);
 if(forms.includes(a))return 2;for(const f of forms){if(f.length>5&&lev(a,f)<=1)return 1;if(f.length>10&&lev(a,f)<=2)return 1}return 0}

/* ---------- soru üretimi ---------- */
function distract(it,n=3){const same=shuf(I.filter(x=>x.c===it.c&&x.k!==it.k)),other=shuf(I.filter(x=>x.c!==it.c));return same.concat(other).slice(0,n)}
const TYPES={dt:"Tanımdan terimi bul",td:"Terimin anlamını seç",et:"Örnekteki tekniği bul",en:"İngilizcesinden bul",ty:"Terimi yaz",th:"Terimi yaz · ipuçlu"};
function typeFor(it,mode){const s=P(it.k)?P(it.k).s:0;
 if(mode==="mix")return pick(["dt","td","et","en","ty"]);
 if(mode==="exam")return pick(["dt","td","et"]);
 return["dt","td",Math.random()<.6?"et":"en","th","ty","ty"][Math.min(s,5)]}
function makeQ(it,type){
 if(type==="td"){const o=shuf([it,...distract(it)]);return{say:it.main,prompt:`<p class="term">${esc(it.main)}</p><p class="en" lang="en">${esc(it.en)}</p>`,opts:o.map(x=>({x,txt:x.m}))}}
 if(type==="ty"||type==="th")return{say:it.m,input:true,prompt:`<p class="prompt">${esc(it.m)}</p>`+(type==="th"?`<div class="hint"><span>İlk harf: ${esc(it.main[0])}</span><span>${it.main.length} karakter</span><span lang="en">${esc(it.en)}</span></div>`:"")};
 const o=shuf([it,...distract(it)]);
 const prompt=type==="et"?`<p class="ex">${esc(it.ex)}</p><p class="muted">Bu örnek hangi terimi gösteriyor?</p>`:type==="en"?`<p class="term" lang="en">${esc(it.en)}</p><p class="muted">Türkçe terim hangisi?</p>`:`<p class="prompt">${esc(it.m)}</p>`;
 return{say:type==="et"?it.ex:type==="en"?"":it.m,prompt,opts:o.map(x=>({x,txt:x.t}))}}

/* ---------- yönlendirme ---------- */
let cur="home",SES=null,dictF={q:"",c:"",st:""};
function route(r,arg){cur=r;SES=null;try{speechSynthesis.cancel()}catch(e){}
 document.querySelectorAll(".tab").forEach(b=>b.dataset.go===r||(r==="cat"&&b.dataset.go==="home")?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current"));
 ({home:Home,cat:Cat,dict:Dict,set:Settings}[r]||Home)(arg);window.scrollTo(0,0);app.focus({preventScroll:true})}
document.querySelector("nav.tabs").onclick=e=>{const b=e.target.closest("[data-go]");if(b)route(b.dataset.go)};
$("#brand").onclick=()=>route("home");

function ring(v,max,top,cap,aria,col){const r=50,C=2*Math.PI*r,p=max?Math.min(1,v/max):0;
 return`<div class="ring" role="img" aria-label="${aria}" style="--rc:${col||"var(--safran)"}"><div class="ring-box"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="bg" cx="60" cy="60" r="${r}" stroke-width="12" fill="none"/><circle class="fg" cx="60" cy="60" r="${r}" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}"/></svg><div><b>${top}</b><span>${cap}</span></div></div></div>`}
const modeBtn=(k,n,i,col,d,dis,b)=>`<button class="mode" data-m="${k}" style="--mc:${col}" ${dis?"disabled":""}><span class="mi" aria-hidden="true">${ic(i)}</span><span><b>${n}</b><span>${d}</span>${b&&!dis?`<span class="badge">${b}</span>`:""}</span></button>`;

function Home(){const c=counts(),L=level(),st=streak(),t=S.days[today()]||0,hd=I.filter(x=>hard(x.k)).length,acc=S.ta?Math.round(S.tc/S.ta*100):null;
 const h=new Date().getHours(),hi=h<5?"İyi geceler":h<12?"Günaydın":h<18?"İyi çalışmalar":"İyi akşamlar";
 const main=c.due?{m:"review",b:"Tekrara başla",h:`${c.due} terim tekrarını bekliyor`}:c.seen<I.length?{m:"discover",b:c.seen?"Yeni terimler öğren":"İlk terimle başla",h:c.seen?"Bugünkü tekrarların bitti":"364 terim seni bekliyor"}:{m:"mix",b:"Pratik yap",h:"Bütün terimleri gördün"};
 const fc=forecast(),mx=Math.max(1,...fc),dn=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"],d0=new Date().getDay(),dl=i=>i?dn[(d0+i)%7]:"Bugün";
 const lp=L.to?Math.round((S.xp-L.from)/(L.to-L.from)*100):100;
 render(`<div class="stack">
 <section class="hero" aria-labelledby="hh"><div class="hero-main"><p class="eyebrow">${hi}</p><h1 id="hh">${main.h}</h1>
  <p class="lead">${t>=S.goal?"Bugünkü hedefini tamamladın. Devam etmek kalıcılığı artırır.":`Bugünkü hedefe ${S.goal-t} XP kaldı.`}</p>
  <button class="btn primary big" data-m="${main.m}">${ic("play")}${main.b}</button></div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:6px">${ring(t,S.goal,t,`/ ${S.goal} XP`,`Günlük hedef: ${t} / ${S.goal} XP`)}<p style="font-size:.82rem;font-weight:800;color:var(--ink-2)">${t>=S.goal?"Hedef tamam":"Günlük hedef"}</p></div></section>
 <div class="chips-row"><span class="pchip">${ic("flame")}${st} günlük seri</span><span class="pchip lvl">${ic("star")}${L.name}<span class="mini-bar" role="progressbar" aria-label="Seviye ilerlemesi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${lp}"><i style="width:${lp}%"></i></span><span class="muted">${L.next?`${L.to-S.xp} XP sonra ${L.next}`:"En üst seviye"}</span></span></div>
 <div class="stats"><div class="stat" style="--sc:var(--zumrut)"><b>${c.mast}</b><span>ustalaşılan</span></div><div class="stat" style="--sc:var(--kobalt)"><b>${c.learn}</b><span>öğreniliyor</span></div><div class="stat" style="--sc:var(--safran)"><b>${c.total-c.seen}</b><span>yeni</span></div><div class="stat" style="--sc:var(--lale)"><b>${acc==null?"–":"%"+acc}</b><span>genel doğruluk</span></div></div>
 <section aria-labelledby="mh"><div class="sec-h"><h2 id="mh">Çalışma yolları</h2></div><div class="modes">
  ${modeBtn("review","Tekrar","refresh","var(--kobalt)",c.due?`${c.due} vadesi gelen terim`:"Şu an vadesi gelen terim yok",!c.due,c.due)}
  ${modeBtn("discover","Keşfet","spark","var(--firuze)","Yeni kartlar; her 5 kartta kısa kontrol",c.seen>=I.length,c.total-c.seen)}
  ${modeBtn("cards","Hızlı kartlar","cards","#C8650A","Kartı çevir; bildin mi, bilmedin mi söyle",false,0)}
  ${modeBtn("exam","Sınav modu","clip","var(--mercan)",S.exam?`Kaldığın yer: ${S.exam.scopeName}, %${examPct()}`:"Bir alanın tamamını öğret ve sına",false,0)}
  ${modeBtn("pairs","Karıştırılanlar","split","var(--lale)",`${PAIRS.length} çift: bu tanım hangisinin?`,false,0)}
  ${modeBtn("mix","Serbest pratik","shuffle","var(--zumrut)","Karışık sorular; tekrar takvimini bozmaz",false,0)}
  ${modeBtn("hard","Zorlu terimler","target","#8A47C9",hd?`${hd} terimde iki ve daha fazla hata`:"İki kez yanlış yaptığın terimler burada toplanır",!hd,hd)}</div></section>
 <section class="panel" aria-labelledby="fh"><div class="sec-h"><h2 id="fh">Önümüzdeki 7 gün</h2><span class="muted">tekrar sayısı</span></div>
  ${fc.some(Boolean)?`<div class="fc" role="img" aria-label="${fc.map((v,i)=>dl(i)+" "+v).join(", ")}">${fc.map((v,i)=>`<div><b>${v}</b><i style="height:${Math.round(v/mx*96)}px"></i><span>${dl(i)}</span></div>`).join("")}</div>`:`<p class="muted">Henüz planlanmış tekrar yok. Yeni terim öğrendikçe tekrar günleri burada görünür.</p>`}</section>
 <section aria-labelledby="kh"><div class="sec-h"><h2 id="kh">Kitaplık</h2><span class="muted">${Object.keys(CATS).length} alan</span></div><div class="shelf">${Object.keys(CATS).map(k=>{const cc=counts(I.filter(x=>x.c===k));return`<button class="book" data-c="${k}" style="--cc:${CC[k]}" aria-label="${CATS[k]}: ${cc.total} terimin ${cc.mast} tanesi ustalaşıldı, ${cc.learn} tanesi öğreniliyor"><span class="spine" aria-hidden="true"><i style="height:${cc.mast/cc.total*100}%"></i><i class="l" style="height:${cc.learn/cc.total*100}%"></i></span><span><span class="bt">${CATS[k]}</span><span class="bm">${cc.mast}/${cc.total} ustalaşıldı${cc.due?` · ${cc.due} tekrar`:""}</span></span></button>`}).join("")}</div></section>
 </div>`);
 app.onclick=e=>{const m=e.target.closest("[data-m]"),c=e.target.closest("[data-c]");
  if(m&&!m.disabled){const k=m.dataset.m;k==="exam"?ExamStart():startMode(k,null)}
  if(c)route("cat",c.dataset.c)}}

function stPill(x){const p=P(x.k);if(!p)return`<span class="pill">Yeni</span>`;if(p.s>=6)return`<span class="pill m">Ustalaşıldı</span>`;return`<span class="pill ${hard(x.k)?"h":"l"}">${hard(x.k)?"Zorlu · ":""}Basamak ${p.s}/6</span>`}
function entryHTML(x){return`<article class="entry" style="--cc:${CC[x.c]}"><div class="e-top"><h3>${esc(x.t)}</h3>${stPill(x)}</div><p class="en" lang="en">${esc(x.en)}</p><p>${esc(x.m)}</p><p class="ex">${esc(x.ex)}</p><div class="e-foot">${catChip(x.c)}<span class="sp"></span>${TTS.ok?`<button class="btn ghost sm" data-say="${esc(x.k)}" aria-label="${esc(x.main)}: sesli oku">${ic("speak")}Dinle</button>`:""}${P(x.k)?"":`<button class="btn sm" data-add="${esc(x.k)}">${ic("plus")}Öğrenmeye ekle</button>`}</div></article>`}
function entryClicks(e,redraw){const s=e.target.closest("[data-say]"),a=e.target.closest("[data-add]");
 if(s){const x=BY[s.dataset.say];speak(`${x.main}. ${x.m}. Örnek: ${x.ex}`)}
 if(a){S.p[a.dataset.add]={s:0,d:Date.now(),w:0};save();toast("Tekrar listene eklendi");redraw()}}

function Cat(k){const L=I.filter(x=>x.c===k),c=counts(L);
 render(`<div class="stack"><button class="btn ghost" style="align-self:flex-start" id="bk">${ic("back")}Kitaplık</button>
 <section class="hero" style="border-top:8px solid ${CC[k]}"><div class="hero-main"><p class="eyebrow">Alan</p><h1>${CATS[k]}</h1><p class="lead">${c.total} terim · ${c.mast} ustalaşılan · ${c.learn} öğreniliyor · ${c.due} tekrar</p></div>
  ${ring(c.mast,c.total,"%"+Math.round(c.mast/c.total*100),"ustalaşıldı",`${c.total} terimin ${c.mast} tanesi ustalaşıldı`,"var(--zumrut)")}</section>
 <div class="modes">
  ${modeBtn("discover","Keşfet","spark","var(--firuze)",`${c.total-c.seen} yeni terim`,c.seen>=c.total,0)}
  ${modeBtn("review","Tekrar","refresh","var(--kobalt)",`${c.due} vadesi gelen`,!c.due,0)}
  ${modeBtn("cards","Hızlı kartlar","cards","#C8650A","Bu alanı kartlarla gözden geçir",false,0)}
  ${modeBtn("exam","Sınav modu","clip","var(--mercan)","Alanın tamamını öğret ve sına",false,0)}
  ${modeBtn("mix","Pratik","shuffle","var(--zumrut)","Bu alandan karışık sorular",false,0)}</div>
 <section aria-labelledby="th"><div class="sec-h"><h2 id="th">Terimler</h2></div><div class="list">${L.map(entryHTML).join("")}</div></section></div>`);
 $("#bk").onclick=()=>route("home");
 app.onclick=e=>{const m=e.target.closest("[data-m]");if(m&&!m.disabled){m.dataset.m==="exam"?ExamBegin(k):startMode(m.dataset.m,k);return}entryClicks(e,()=>Cat(k))}}

function Dict(){render(`<div class="stack"><div><p class="eyebrow">364 terim</p><h1 class="page-h">Sözlük</h1></div>
 <div class="search">${ic("search")}<label for="q" class="sr-only">Sözlükte ara</label><input type="search" id="q" placeholder="Terim, anlam ya da İngilizce ara" value="${esc(dictF.q)}"></div>
 <div class="chips" id="fc" role="group" aria-label="Alan süzgeci"><button data-c="" aria-pressed="${!dictF.c}">Bütün alanlar</button>${Object.keys(CATS).map(k=>`<button data-c="${k}" aria-pressed="${dictF.c===k}">${CATS[k]}</button>`).join("")}</div>
 <div class="chips" id="fs" role="group" aria-label="Durum süzgeci">${[["","Hepsi"],["new","Yeni"],["learn","Öğreniliyor"],["mast","Ustalaşılan"],["hard","Zorlu"]].map(([v,t])=>`<button data-s="${v}" aria-pressed="${dictF.st===v}">${t}</button>`).join("")}</div>
 <p class="muted" id="cnt" aria-live="polite"></p><div class="list" id="dl"></div></div>`);
 const draw=()=>{const q=norm(dictF.q);const L=I.filter(x=>(!dictF.c||x.c===dictF.c)&&(!q||norm(x.t+" "+x.en+" "+x.m).includes(q))&&(!dictF.st||(dictF.st==="new"?!P(x.k):dictF.st==="learn"?isLearn(x.k):dictF.st==="mast"?isMast(x.k):hard(x.k))));
  $("#cnt").textContent=L.length+" terim bulundu";$("#dl").innerHTML=L.map(entryHTML).join("")};draw();
 $("#q").oninput=e=>{dictF.q=e.target.value;draw()};
 const grp=(id,key,attr)=>$(id).onclick=e=>{const b=e.target.closest("button");if(!b)return;dictF[key]=b.dataset[attr];$(id).querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()};
 grp("#fc","c","c");grp("#fs","st","s");
 $("#dl").onclick=e=>entryClicks(e,draw)}

function Settings(){
 const seg=(id,lab,opts,val)=>`<div class="seg" role="group" aria-label="${lab}" id="${id}">${opts.map(([v,t])=>`<button data-v="${v}" aria-pressed="${String(v)===String(val)}">${t}</button>`).join("")}</div>`;
 const sw=(id,on,t,sub)=>`<button class="switch" role="switch" id="${id}" aria-checked="${!!on}"><span>${t}${sub?`<small>${sub}</small>`:""}</span><span class="tr" aria-hidden="true"></span></button>`;
 render(`<div class="set"><h1 class="page-h">Ayarlar</h1>
 <section class="panel" aria-labelledby="s1"><h2 id="s1">Görünüm</h2>${seg("th","Tema",[["light","Açık"],["dark","Koyu"],["system","Cihaza uy"]],S.theme)}</section>
 <section class="panel" aria-labelledby="s2"><h2 id="s2">Okuma rahatlığı</h2>
  <div class="row"><span style="font-weight:700">Yazı boyutu</span><button class="btn icon" id="fm" aria-label="Yazıyı küçült">A−</button><b id="fv" aria-live="polite">${S.fs} px</b><button class="btn icon" id="fp" aria-label="Yazıyı büyüt">A+</button></div>
  <div class="row"><span style="font-weight:700">Satır aralığı</span>${seg("lh","Satır aralığı",[[0,"Normal"],[1,"Geniş"]],S.lh)}</div>
  ${sw("hc",S.hc,"Yüksek kontrast","Soluk yazıları ve çizgileri koyulaştırır.")}
  ${sw("mo",!S.motion,"Hareketleri azalt","Kart geçişlerindeki ve rozetlerdeki animasyonları kapatır.")}
  <p class="ex">Önizleme: Şiir öznesi yitirilmiş bir geçmişe özlem duyar; okur bu özlemi soğuk ve metalik imgeler yoluyla hisseder.</p></section>
 <section class="panel" aria-labelledby="s3"><h2 id="s3">Sesli okuma</h2>${TTS.ok?`
  ${sw("au",S.auto,"Soruları otomatik oku","Her yeni soru ve kart açıldığında sesli okunur.")}
  <div class="row"><span style="font-weight:700">Hız</span>${seg("rt","Okuma hızı",[[0.8,"Yavaş"],[0.95,"Normal"],[1.15,"Hızlı"]],S.rate)}<button class="btn" id="tt">${ic("speak")}Dene</button></div>
  <p class="muted">${TTS.v?"Türkçe ses bulundu.":"Cihazında Türkçe ses görünmüyor; okuma tarayıcının varsayılan sesiyle yapılır."}</p>`:`<p class="muted">Bu tarayıcı sesli okumayı desteklemiyor.</p>`}</section>
 <section class="panel" aria-labelledby="s4"><h2 id="s4">Günlük hedef</h2>${seg("gl","Günlük hedef",[[100,"100 XP"],[150,"150 XP"],[250,"250 XP"],[400,"400 XP"]],S.goal)}<p class="muted">Doğru cevap 10 XP, kontrol sorusu 8 XP, yeni kart 5 XP; üst üste 3 doğrudan sonra her doğruya 2 XP ek.</p></section>
 <section class="panel" aria-labelledby="s5"><h2 id="s5">Klavye kısayolları</h2><div class="keys"><kbd>1–4</kbd><span>Seçeneği işaretle</span><kbd>Enter</kbd><span>Devam et ya da kontrol et</span><kbd>B</kbd><span>Bilmiyorum</span><kbd>S</kbd><span>Sesli oku</span><kbd>Boşluk</kbd><span>Hızlı kartta kartı çevir</span><kbd>Esc</kbd><span>Oturumu bitir</span></div></section>
 <section class="panel" aria-labelledby="s6"><h2 id="s6">Aralıklı tekrar nasıl işler?</h2><p>Öğrenmeye aldığın terim 1 gün, 3 gün, 1 hafta, 2 hafta ve 1 ay sonra geri gelir; altı basamağı da doğru geçersen ustalaşılmış sayılır. Soru tipi basamakla zorlaşır: tanımdan terim, terimden anlam, örnekten ya da İngilizceden terim, ipuçlu yazma, ipucusuz yazma. Yanlış yanıt terimi başa döndürür ve birkaç soru sonra yeniden sorulur.</p></section>
 <section class="panel" aria-labelledby="s7"><h2 id="s7">İlerlemeyi sıfırla</h2><div class="row" id="rs"><button class="btn" id="r1">Tüm ilerlemeyi sil</button></div></section></div>`);
 const segBind=(id,f)=>{const g=$("#"+id);if(g)g.onclick=e=>{const b=e.target.closest("button");if(!b)return;g.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));f(b.dataset.v);applyPrefs();save()}};
 segBind("th",v=>S.theme=v);segBind("lh",v=>S.lh=+v);segBind("rt",v=>S.rate=+v);segBind("gl",v=>S.goal=+v);
 const swBind=(id,f)=>{const b=$("#"+id);if(b)b.onclick=()=>{const on=b.getAttribute("aria-checked")!=="true";b.setAttribute("aria-checked",on);f(on);applyPrefs();save()}};
 swBind("hc",on=>S.hc=on?1:0);swBind("mo",on=>S.motion=on?0:1);swBind("au",on=>S.auto=on?1:0);
 const fs=d=>{S.fs=Math.max(15,Math.min(28,S.fs+d));applyPrefs();$("#fv").textContent=S.fs+" px";save()};
 $("#fm").onclick=()=>fs(-1);$("#fp").onclick=()=>fs(1);
 if($("#tt"))$("#tt").onclick=()=>speak("Anjambman: cümlenin dize sonunda bitmeyip bir sonraki dizeye taşması.");
 $("#r1").onclick=()=>{$("#rs").innerHTML=`<span style="font-weight:700">Emin misin? Bu geri alınamaz.</span><button class="btn warn" id="r2">Evet, sil</button><button class="btn ghost" id="r3">Vazgeç</button>`;$("#r3").focus();
  $("#r2").onclick=()=>{Object.assign(S,{p:{},xp:0,days:{},exam:null,ta:0,tc:0});save();toast("İlerleme silindi");route("home")};$("#r3").onclick=()=>Settings()}}

/* ---------- oturum motoru ---------- */
function newSes(kind,title,scope){return{kind,title,scope,q:[],a:0,c:0,combo:0,best:0,newL:0,start:Date.now(),done:0,total:0,miss:new Set(),sub:"",batch:[]}}
const scopeList=scope=>scope?I.filter(x=>x.c===scope):I;
function startMode(kind,scope){const L=scopeList(scope);let s;
 if(kind==="review"){s=newSes(kind,"Tekrar",scope);s.q=L.filter(x=>isDue(x.k)).sort((a,b)=>P(a.k).d-P(b.k).d).map(x=>({it:x}));s.total=s.q.length}
 if(kind==="discover"){s=newSes(kind,"Keşfet",scope);s.pool=L.filter(x=>!P(x.k));s.total=s.pool.length;if(!s.pool.length){toast("Bu alanda yeni terim kalmadı");return}}
 if(kind==="mix"){s=newSes(kind,"Serbest pratik",scope);s.pool=L.filter(x=>P(x.k));if(s.pool.length<4)s.pool=L}
 if(kind==="hard"){s=newSes(kind,"Zorlu terimler",null);s.q=shuf(I.filter(x=>hard(x.k))).map(x=>({it:x}));s.total=s.q.length}
 if(kind==="pairs")s=newSes(kind,"Karıştırılanlar",null);
 if(kind==="cards"){s=newSes(kind,"Hızlı kartlar",scope);const r=x=>isLearn(x.k)?0:!P(x.k)?1:2;s.deck=shuf(L).sort((a,b)=>r(a)-r(b));s.total=s.deck.length}
 SES=s;cur="ses";nextStep()}

function head(){const s=SES,pct=s.total?Math.min(100,Math.round(s.done/s.total*100)):null;
 return`<div class="sess-top"><button class="btn ghost" id="quit" aria-label="Oturumu bitir (Esc)">${ic("back")}Bitir</button>
 <div class="pbar" ${pct!=null?`role="progressbar" aria-label="Oturum ilerlemesi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"`:`aria-hidden="true"`}><i id="pbi" style="width:${pct??0}%"></i></div>
 <span class="score" id="sc" aria-label="${s.c} doğru, ${s.a} soru">${s.c}/${s.a}</span><span id="cb">${s.combo>=3?`<span class="combo">${ic("flame")}${s.combo} seri</span>`:""}</span></div>
 <p class="eyebrow" style="margin-bottom:12px">${esc(s.title)}${s.sub?" · "+esc(s.sub):""}</p>`}
function updHead(){const s=SES;if(!s)return;const sc=$("#sc");if(sc){sc.textContent=`${s.c}/${s.a}`;sc.setAttribute("aria-label",`${s.c} doğru, ${s.a} soru`)}
 const cb=$("#cb");if(cb)cb.innerHTML=s.combo>=3?`<span class="combo">${ic("flame")}${s.combo} seri</span>`:"";
 const pi=$("#pbi");if(pi&&s.total){const p=Math.min(100,Math.round(s.done/s.total*100));pi.style.width=p+"%";pi.parentNode.setAttribute("aria-valuenow",p)}}
function sesView(h){render(head()+h);$("#quit").onclick=()=>Summary();window.scrollTo(0,0)}
function focusQ(){const q=$("#qh");q&&q.focus({preventScroll:true});if(S.auto&&SAY)speak(SAY)}

function nextStep(){const s=SES;
 if(s.kind==="exam")return examNext();
 if(s.kind==="pairs")return askPair();
 if(s.kind==="cards")return flash();
 if(s.q.length){const n=s.q.shift();return ask(n.it,n.type||typeFor(n.it,s.kind==="mix"?"mix":"srs"),n)}
 if(s.kind==="discover"){if(s.batch.length>=5||(!s.pool.length&&s.batch.length)){s.q=s.batch.map(x=>({it:x,type:"dt",check:1}));s.batch=[];s.sub="kısa kontrol";return nextStep()}
  s.sub="";if(s.pool.length)return showCard(s.pool.shift());return Summary("Bu kapsamda keşfedilecek yeni terim kalmadı.")}
 if(s.kind==="mix"){const w=s.pool.slice().sort((a,b)=>((P(b.k)||{}).w||0)-((P(a.k)||{}).w||0));const it=Math.random()<.35?w[Math.random()*Math.min(10,w.length)|0]:pick(s.pool);return ask(it,typeFor(it,"mix"),{free:1})}
 if(s.kind==="review"){const more=scopeList(s.scope).filter(x=>isDue(x.k));if(more.length){s.q=more.map(x=>({it:x}));return nextStep()}return Summary("Vadesi gelen bütün terimleri bitirdin.")}
 return Summary("Zorlu terimlerin hepsinden geçtin.")}

function termBlock(it){return`<div class="qbody"><div><p class="term">${esc(it.t)}</p><p class="en" lang="en">${esc(it.en)}</p></div><p class="prompt">${esc(it.m)}</p><p class="ex">${esc(it.ex)}</p></div>`}
function showCard(it){const s=SES;SAY=`${it.main}. ${it.m}`;
 sesView(`<article class="card" style="--cc:${CC[it.c]}" aria-labelledby="qt"><div class="q-top"><span class="qtype" id="qt">Yeni terim</span>${catChip(it.c)}</div>
 <div id="qh" tabindex="-1">${termBlock(it)}</div>
 <div class="row"><button class="btn primary big" id="learn">${ic("plus")}Öğrenmeliyim</button><button class="btn big" id="know">${ic("check")}Biliyorum, sına</button>${sayBtn()}</div></article>`);
 focusQ();bindSay();
 $("#learn").onclick=()=>{S.p[it.k]={s:0,d:Date.now(),w:0};s.newL++;s.done++;addXP(5);s.batch.push(it);save();announce("Tekrar listene eklendi");nextStep()};
 $("#know").onclick=()=>{s.done++;ask(it,"dt",{known:1})}}

function applyRes(it,ok,meta){const s=SES;s.a++;S.ta++;let xp=0;
 if(ok){s.c++;S.tc++;s.combo++;s.best=Math.max(s.best,s.combo)}else{s.combo=0;s.miss.add(it.k)}
 if(meta.known){if(ok){S.p[it.k]={s:3,d:Date.now()+7*DAY,w:0};xp=10}else{S.p[it.k]={s:0,d:Date.now(),w:1};s.newL++;s.batch.push(it)}}
 else if(meta.exam){if(ok)xp=8;examResult(it,ok)}
 else if(meta.free){if(ok)xp=5;else{const p=S.p[it.k];if(p)p.w=(p.w||0)+1}}
 else if(meta.check){if(ok){xp=8;const p=S.p[it.k];if(p&&p.s===0){p.s=1;p.d=Date.now()+DAY}}else s.q.push({it,type:"dt",check:1})}
 else{if(ok)xp=10;grade(it.k,ok);if(!ok)s.q.splice(Math.min(s.q.length,3+(Math.random()*3|0)),0,{it,type:"dt",retry:1});if(!meta.retry)s.done++}
 if(ok&&s.combo>=3)xp+=2;addXP(xp);s.lastXP=xp;save()}

function ask(it,type,meta={}){const s=SES,Q=makeQ(it,type);SAY=Q.say;
 const tools=`<button class="btn ghost" id="idk" title="Bilmiyorum (B)">Bilmiyorum</button>${sayBtn()}`;
 sesView(`<article class="card" style="--cc:${CC[it.c]}" aria-labelledby="qt"><div class="q-top"><span class="qtype" id="qt">${TYPES[type]}</span>${catChip(it.c)}</div>
 <div id="qh" class="qbody" tabindex="-1">${Q.prompt}</div>
 ${Q.input?`<label for="ti" class="sr-only">Terimi yaz</label><input type="text" id="ti" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" placeholder="Terimi yaz"><div class="row"><button class="btn primary" id="go">Kontrol et</button>${tools}</div>`
 :`<div class="opts" role="group" aria-label="Seçenekler">${Q.opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="n" aria-hidden="true">${i+1}</span><span>${esc(o.txt)}</span><span class="st"></span></button>`).join("")}</div><div class="row">${tools}</div>`}
 <div id="fb"></div></article>`);
 bindSay();let done=false,snap=null;
 const takeSnap=()=>({p:JSON.stringify(S.p[it.k]||null),q:s.q.slice(),ex:JSON.stringify(S.exam),a:s.a,c:s.c,combo:s.combo,best:s.best,done:s.done,newL:s.newL,batch:s.batch.slice(),miss:new Set(s.miss),xp:S.xp,day:S.days[today()]||0,ta:S.ta,tc:S.tc});
 const restore=n=>{const p=JSON.parse(n.p);if(p)S.p[it.k]=p;else delete S.p[it.k];S.exam=JSON.parse(n.ex);Object.assign(s,{q:n.q,a:n.a,c:n.c,combo:n.combo,best:n.best,done:n.done,newL:n.newL,batch:n.batch,miss:n.miss});S.xp=n.xp;S.days[today()]=n.day;S.ta=n.ta;S.tc=n.tc};
 const showFb=(ok,note,picked,canOv)=>{
  const praise=ok?(s.combo>=5&&s.combo%5===0?`${s.combo} doğru üst üste!`:pick(PRAISE)):"Doğrusu: "+esc(it.t);
  $("#fb").innerHTML=`<div class="fb ${ok?"ok":"bad"}"><div class="fb-h"><span class="fb-ic" aria-hidden="true">${ic(ok?"check":"x")}</span><b>${praise}</b>${s.lastXP?`<span class="xp">+${s.lastXP} XP</span>`:""}</div>
   ${note?`<p>${note} Doğru yazım: <b>${esc(it.main)}</b></p>`:""}<p><b>${esc(it.main)}</b> <span class="en" lang="en">(${esc(it.en)})</span>: ${esc(it.m)}</p><p class="ex">${esc(it.ex)}</p>
   ${picked&&picked!==it?`<p class="fb-other"><b>Senin seçtiğin, ${esc(picked.main)}:</b> ${esc(picked.m)}</p>`:""}</div>
   <div class="row" style="margin-top:12px"><button class="btn primary" id="nx">Devam <kbd aria-hidden="true">Enter</kbd></button>${canOv?`<button class="btn ghost" id="ov">Aslında doğruydu</button>`:""}</div>`;
  announce((ok?"Doğru. ":"Yanlış. Doğru cevap: ")+it.main+". "+it.m);
  $("#nx").focus({preventScroll:true});$("#fb").scrollIntoView({block:"nearest",behavior:S.motion?"smooth":"auto"});$("#nx").onclick=nextStep;
  const ov=$("#ov");if(ov)ov.onclick=()=>{restore(snap);applyRes(it,true,meta);updHead();showFb(true,"Cevabın doğru sayıldı.",null,false)}};
 const fin=(ok,note,picked)=>{if(done)return;done=true;if(Q.input)snap=takeSnap();applyRes(it,ok,meta);updHead();showFb(ok,note,picked,Q.input&&!ok&&$("#ti").value.trim())};
 if(Q.input){const ti=$("#ti");ti.focus();if(S.auto&&SAY)speak(SAY);const go=()=>{if(done)return;const r=check(it,ti.value);ti.disabled=true;fin(r>0,r===1?"Kabul edildi, küçük bir yazım farkı var.":null)};$("#go").onclick=go;ti.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();go()}}}
 else{focusQ();app.querySelector(".opts").onclick=e=>{const b=e.target.closest(".opt");if(!b||done)return;const o=Q.opts[+b.dataset.i];markOpts(Q.opts.map(z=>z.x===it),b);fin(o.x===it,null,o.x)}}
 $("#idk").onclick=()=>{if(done)return;if(!Q.input)markOpts(Q.opts.map(z=>z.x===it),null);else $("#ti").disabled=true;fin(false)}}
function markOpts(right,chosen){app.querySelectorAll(".opt").forEach((x,i)=>{x.disabled=true;if(right[i]){x.classList.add("ok");x.querySelector(".st").textContent="Doğru cevap"}});
 if(chosen&&!chosen.classList.contains("ok")){chosen.classList.add("bad");chosen.querySelector(".st").textContent="Senin seçimin"}}

document.addEventListener("keydown",e=>{if(!SES||e.target.tagName==="INPUT"||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key;
 if(k==="Escape"){e.preventDefault();return Summary()}
 if(SES.kind==="cards"){if(k===" "){const f=$("#flip");if(f){e.preventDefault();f.click()}}if(k==="1"){const b=$("#nk");b&&b.click()}if(k==="2"){const b=$("#yk");b&&b.click()}}
 if(/^[1-4]$/.test(k)){const b=app.querySelector(`.opt[data-i="${k-1}"]:not(:disabled)`);b&&b.click()}
 if(k==="Enter"){const n=$("#nx");if(n&&document.activeElement!==n){e.preventDefault();n.click()}}
 if(k==="b"||k==="B"){const b=$("#idk");b&&b.click()}
 if(k==="s"||k==="S")speak(SAY)});

/* ---------- hızlı kartlar ---------- */
function flash(){const s=SES;if(!s.deck.length)return Summary("Destedeki bütün kartlardan geçtin.");const it=s.deck[0];SAY=it.main;
 sesView(`<article class="card flip" style="--cc:${CC[it.c]}" aria-labelledby="qt"><span class="qtype" id="qt">Kart ${s.done+1} / ${s.total}</span>${catChip(it.c)}<div id="qh" tabindex="-1"><p class="term">${esc(it.t)}</p><p class="en" lang="en">${esc(it.en)}</p></div>
 <div id="back" class="back" hidden><p class="prompt">${esc(it.m)}</p><p class="ex">${esc(it.ex)}</p></div>
 <div class="row" id="fr" style="justify-content:center"><button class="btn primary big" id="flip">Kartı çevir <kbd aria-hidden="true">Boşluk</kbd></button>${sayBtn()}</div></article>`);
 focusQ();bindSay();
 $("#flip").onclick=()=>{$("#back").hidden=false;SAY=`${it.main}. ${it.m}`;if(S.auto)speak(SAY);announce(`${it.main}: ${it.m}`);
  $("#fr").innerHTML=`<button class="btn big warn" id="nk">${ic("x")}Bilmiyordum <kbd aria-hidden="true">1</kbd></button><button class="btn primary big" id="yk">${ic("check")}Biliyordum <kbd aria-hidden="true">2</kbd></button>${sayBtn()}`;bindSay();$("#yk").focus({preventScroll:true});
  const go=ok=>{s.deck.shift();s.done++;s.a++;S.ta++;if(ok){s.c++;S.tc++;s.combo++;s.best=Math.max(s.best,s.combo);addXP(3)}else{s.combo=0;s.miss.add(it.k);const p=S.p[it.k];
    if(!p){S.p[it.k]={s:0,d:Date.now(),w:0};s.newL++}else{p.w=(p.w||0)+1;if(p.s>=6)p.s=3;p.d=Date.now()}}save();flash()};
  $("#nk").onclick=()=>go(false);$("#yk").onclick=()=>go(true)}}

/* ---------- karıştırılanlar ---------- */
function askPair(){const s=SES,pr=pick(PAIRS),side=Math.random()<.5?0:1,right=pr[side],def=pr[2+side],opts=shuf([pr[0],pr[1]]);SAY=def;
 sesView(`<article class="card" style="--cc:var(--lale)" aria-labelledby="qt"><div class="q-top"><span class="qtype" id="qt">Bu ayırt edici tanım hangisinin?</span></div>
 <div id="qh" class="qbody" tabindex="-1"><p class="prompt">${esc(def)}</p></div>
 <div class="opts" role="group" aria-label="Seçenekler">${opts.map((o,i)=>`<button class="opt" data-i="${i}"><span class="n" aria-hidden="true">${i+1}</span><span>${esc(o)}</span><span class="st"></span></button>`).join("")}</div><div class="row">${sayBtn()}</div><div id="fb"></div></article>`);
 focusQ();bindSay();let done=false;
 app.querySelector(".opts").onclick=e=>{const b=e.target.closest(".opt");if(!b||done)return;done=true;const ok=opts[+b.dataset.i]===right;s.a++;S.ta++;
  if(ok){s.c++;S.tc++;s.combo++;s.best=Math.max(s.best,s.combo);addXP(6+(s.combo>=3?2:0))}else{s.combo=0}save();updHead();markOpts(opts.map(o=>o===right),b);
  $("#fb").innerHTML=`<div class="fb ${ok?"ok":"bad"}"><div class="fb-h"><span class="fb-ic" aria-hidden="true">${ic(ok?"check":"x")}</span><b>${ok?pick(PRAISE):"Bu tanım "+esc(right)+" için."}</b></div><p><b>${esc(pr[0])}:</b> ${esc(pr[2])}</p><p><b>${esc(pr[1])}:</b> ${esc(pr[3])}</p></div><div class="row" style="margin-top:12px"><button class="btn primary" id="nx">Devam <kbd aria-hidden="true">Enter</kbd></button></div>`;
  announce((ok?"Doğru. ":"Yanlış. ")+`${pr[0]}: ${pr[2]}. ${pr[1]}: ${pr[3]}`);$("#nx").focus({preventScroll:true});$("#fb").scrollIntoView({block:"nearest"});$("#nx").onclick=nextStep}}

/* ---------- sınav modu ---------- */
const BATCH=8;
function examPct(){const e=S.exam;if(!e)return 0;const n=e.keys.length;return Math.round((e.phase==="final"?(n+(n-e.final.length))/(2*n):e.pos/(2*n))*100)}
function ExamStart(){if(S.exam)return examResume();
 render(`<div class="stack"><button class="btn ghost" style="align-self:flex-start" id="bk">${ic("back")}Geri</button>
 <section class="hero" style="border-top:8px solid var(--mercan)"><div class="hero-main"><p class="eyebrow">Sınav modu</p><h1>Hangi kapsamı çalışacaksın?</h1><p class="lead">Seçtiğin kapsamdaki bütün terimler ${BATCH}'erli gruplar hâlinde öğretilir. Her grubun ardından kontrol testi gelir; yanlışlar doğru bilinene kadar geri döner. Her üç grupta bir karışık tekrar, en sonda zayıf terimlere ağırlık veren final sınavı var. İstediğin an çıkabilirsin; kaldığın gruptan devam edersin.</p></div></section>
 <div class="shelf"><button class="book" data-c="" style="--cc:var(--mercan)"><span class="spine" aria-hidden="true"></span><span><span class="bt">Bütün terimler</span><span class="bm">${I.length} terim</span></span></button>${Object.keys(CATS).map(k=>`<button class="book" data-c="${k}" style="--cc:${CC[k]}"><span class="spine" aria-hidden="true"></span><span><span class="bt">${CATS[k]}</span><span class="bm">${I.filter(x=>x.c===k).length} terim</span></span></button>`).join("")}</div></div>`);
 $("#bk").onclick=()=>route("home");app.onclick=e=>{const c=e.target.closest("[data-c]");if(c)ExamBegin(c.dataset.c||null)}}
function ExamBegin(scope){if(S.exam&&S.exam.scope===scope)return examResume();S.exam={scope,scopeName:scope?CATS[scope]:"Bütün terimler",keys:scopeList(scope).map(x=>x.k),pos:0,phase:"teach",batchNo:0,final:null,ea:0,ec:0};save();examResume()}
function examResume(){const e=S.exam;SES=newSes("exam","Sınav modu · "+e.scopeName,e.scope);SES.total=e.keys.length*2;SES.done=e.phase==="final"?e.keys.length+(e.keys.length-e.final.length):e.pos;cur="ses";examPrep();nextStep()}
function examPrep(){const e=S.exam,s=SES;
 if(e.phase==="teach"){if(e.pos>=e.keys.length){e.phase="final";e.final=shuf(e.keys).sort((a,b)=>((P(b)||{}).w||0)-((P(a)||{}).w||0));save();return examPrep()}
  s.cards=e.keys.slice(e.pos,e.pos+BATCH);s.stage="cards";s.ci=0;s.sub=`grup ${e.batchNo+1} / ${Math.ceil(e.keys.length/BATCH)}`}
 else{s.stage="final";s.sub="final sınavı";s.q=e.final.map(k=>({it:BY[k],type:typeFor(BY[k],"exam")}))}}
function examNext(){const e=S.exam,s=SES;if(!e)return Summary();
 if(s.stage==="cards"){if(s.ci<s.cards.length){const it=BY[s.cards[s.ci]];SAY=`${it.main}. ${it.m}`;
   sesView(`<article class="card" style="--cc:${CC[it.c]}" aria-labelledby="qt"><div class="q-top"><span class="qtype" id="qt">Öğren · ${s.ci+1} / ${s.cards.length}</span>${catChip(it.c)}</div><div id="qh" tabindex="-1">${termBlock(it)}</div>
   <div class="row"><button class="btn primary big" id="nx">Anladım <kbd aria-hidden="true">Enter</kbd></button>${s.ci?`<button class="btn ghost" id="pv">${ic("back")}Önceki</button>`:""}${sayBtn()}</div></article>`);
   focusQ();bindSay();$("#nx").onclick=()=>{s.ci++;examNext()};const pv=$("#pv");if(pv)pv.onclick=()=>{s.ci--;examNext()};return}
  s.stage="check";s.sub="kontrol testi";s.q=shuf(s.cards).map(k=>({it:BY[k],type:"dt"}))}
 if(s.q.length){const n=s.q.shift();return ask(n.it,n.type,{exam:1})}
 if(s.stage==="check"){e.pos=Math.min(e.keys.length,e.pos+BATCH);e.batchNo++;s.done=e.pos;save();
  if(e.batchNo%3===0&&e.pos>BATCH){s.stage="mixrev";s.sub="karışık tekrar";s.q=shuf(e.keys.slice(0,e.pos)).slice(0,BATCH).map(k=>({it:BY[k],type:typeFor(BY[k],"exam")}));return examNext()}
  examPrep();return examNext()}
 if(s.stage==="mixrev"){examPrep();return examNext()}
 if(s.stage==="final"){const a=e.ea,c=e.ec;S.exam=null;save();return Summary(`Final sınavını bitirdin. Kapsamın tamamında doğruluk %${a?Math.round(c/a*100):0}.`)}}
function examResult(it,ok){const s=SES,e=S.exam;e.ea++;
 if(ok){e.ec++;const p=S.p[it.k];if(!p)S.p[it.k]={s:1,d:Date.now()+DAY,w:0};else if(p.s===0){p.s=1;p.d=Date.now()+DAY}
  if(s.stage==="final"){e.final=e.final.filter(k=>k!==it.k);s.done++}}
 else{const p=S.p[it.k]||(S.p[it.k]={s:0,d:Date.now(),w:0});p.w=(p.w||0)+1;if(p.s>0&&p.s<6){p.s=0;p.d=Date.now()}
  s.q.splice(Math.min(s.q.length,2+(Math.random()*3|0)),0,{it,type:"dt"})}}

/* ---------- özet ---------- */
function Summary(msg){const s=SES;if(!s)return route("home");try{speechSynthesis.cancel()}catch(e){}
 const min=Math.max(1,Math.round((Date.now()-s.start)/60000)),pct=s.a?Math.round(s.c/s.a*100):0;SES=null;cur="sum";const miss=[...s.miss].map(k=>BY[k]);
 render(`<div class="stack"><section class="hero"><div class="hero-main"><p class="eyebrow">${esc(s.title)}</p><h1 id="hh" tabindex="-1">${msg?esc(msg):s.a?(pct>=80?"Çok iyi bir oturumdu.":pct>=50?"Güzel ilerliyorsun.":"Zor bir oturumdu; tekrar en iyi ilaç."):"Oturum kaydedildi."}</h1>
  ${S.exam&&s.kind==="exam"?`<p class="lead">Sınav modu %${examPct()} noktasında; kaldığın yerden sürdürebilirsin.</p>`:""}
  <div class="row"><button class="btn primary big" id="ag">${ic("play")}${s.kind==="exam"?"Sürdür":"Devam et"}</button><button class="btn big" id="h">Ana sayfa</button></div></div>
  ${s.a?ring(s.c,s.a,"%"+pct,`${s.c} / ${s.a} doğru`,`${s.a} sorunun ${s.c} tanesi doğru`,"var(--zumrut)"):""}</section>
 <div class="stats"><div class="stat" style="--sc:var(--kobalt)"><b>${s.a}</b><span>soru</span></div><div class="stat" style="--sc:var(--safran)"><b>${s.best}</b><span>en uzun seri</span></div><div class="stat" style="--sc:var(--firuze)"><b>${s.newL}</b><span>yeni terim</span></div><div class="stat" style="--sc:var(--lale)"><b>${min}</b><span>dakika</span></div></div>
 ${miss.length?`<section aria-labelledby="ms"><div class="sec-h"><h2 id="ms">Bu oturumda zorlandıkların</h2><span class="muted">${miss.length} terim</span></div><div class="list">${miss.map(entryHTML).join("")}</div></section>`:""}</div>`);
 $("#hh").focus({preventScroll:true});window.scrollTo(0,0);
 $("#h").onclick=()=>route("home");$("#ag").onclick=()=>{if(s.kind==="exam")return S.exam?examResume():ExamStart();startMode(s.kind==="review"&&!counts().due?"mix":s.kind,s.scope)};
 app.onclick=e=>entryClicks(e,()=>{})}

/* ---------- uygulama olarak kur ---------- */
let INSTALL=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();INSTALL=e;const b=$("#inst");if(b)b.hidden=false});
window.addEventListener("appinstalled",()=>{INSTALL=null;const b=$("#inst");if(b)b.hidden=true;toast("Terim Atölyesi cihazına kuruldu")});
$("#inst").onclick=async()=>{if(!INSTALL)return;INSTALL.prompt();try{await INSTALL.userChoice}catch(e){}INSTALL=null;$("#inst").hidden=true};
if("serviceWorker" in navigator&&location.protocol!=="file:")window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

route("home");
