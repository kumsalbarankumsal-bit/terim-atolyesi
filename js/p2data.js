'use strict';
/* =====================================================================
   PAPER 2 — yöntem notu ve alıştırma verisi
   Kaynak: Baran'ın "Paper 2 · sınav notu" (3 sayfa, 16 bölüm). Notun her
   satırı burada; esere özgü içerik yok, yalnızca genel kurallar ve kalıplar.
   Satır biçimi: "kavram → açıklama". «…» = kalıp cümle (notta mavi italik).
   Önek "!" = kaçınılacak şey (notta kırmızı). Önek "✓ " = kontrol maddesi.
   Puanlama bilgisi IB'nin Mayıs 2026 güncellemesiyle karşılaştırıldı.
   ===================================================================== */
const P2_MOTTO = ['ne yapıyor', 'iki uç (A / B)', 'bu ne düşündürüyor'];

const P2_CH = [
  { k: 'temel', t: 'Temel', d: 'Sözlük, sınav, ölçütler', col: '#2A44B8', secs: [0, 1, 2] },
  { k: 'plan', t: 'Plan', d: 'Soru seçimi, soru kalıpları, harita', col: '#0F8E57', secs: [3, 4, 5] },
  { k: 'yazim', t: 'Yazım', d: 'Giriş, blok, 4 halka, bağlaçlar, sonuç', col: '#0B97A4', secs: [6, 7, 8, 9, 10, 11] },
  { k: 'gun', t: 'Sınav günü', d: 'Süre, kontrol, altın kurallar, dersler', col: '#D1337C', secs: [12, 13, 14, 15, 16] }
];

/* n: bölüm no · t: başlık · hl: notun vurgu rengi (y sarı, p pembe, g yeşil, b mavi) */
const P2_SECS = [
  { n: 0, t: 'Bu notun sözlüğü', hl: 'y', lines: [
    'Tez → denemenin tek cümlelik, karşı çıkılabilir iddiası',
    'Harita → tezin sonundaki blok sırası (tema, karakter, teknik)',
    'Blok → gövdedeki bir paragraf; bir boyutu işler',
    'Anahtar sözcük → sorudaki ana kavram (ör. tezatlık, mekân)',
    'Uç → karşılaştırılan iki şeyden biri (A eseri ↔ B eseri)',
    'Sandviç → blok = açılış + iç + kapanış; iki ekmekte anahtar sözcük',
    'Yorum → “neden önemli?” cevabı; puan burada',
    'Temkinli cesaret → iki somut okumayı açık bırakmak (ya … ya da)',
    'Açık uç → sonucu okura bir soru bırakarak bitirmek'
  ], foot: 'Sözlükteki “Blok karşılaştırma” terimi başka bir şeydir: önce A’nın tamamı, sonra B’nin tamamı; zayıf yapı. Bu nottaki her blok iki eseri birlikte işler, yani “bütünleşik karşılaştırma”dır.' },
  { n: 1, t: 'Sınav', hl: 'y', lines: [
    'Paper 2 → iki eseri karşılaştıran deneme',
    'Süre → 1 sa 45 dk · 4 genel sorudan 1',
    'Kitap → sınava girmez · alıntı şart değil · sahneyi doğru anlatmak yeter',
    'Ağırlık → HL notunun %25’i',
    'Yasak eser → IO’da / HL denemesinde kullanılan eser',
    'Puan → 25 = 5 ölçüt × 5 (Mayıs 2026’dan beri; eski örnekler 30 üzerinden)'
  ] },
  { n: 2, t: 'Ölçütler (her biri 5)', hl: 'p', lines: [
    { l: 'A · bilgi, anlama, yorum → eserleri ve soruyu anladın mı? → giriş + tez + somut sahne', f: 'A ölçütü' },
    { l: 'B1 · çözümleme → yazar ne yaptı, neden? → iddia + kanıt + yorum', f: 'B1 ölçütü' },
    { l: 'B2 · karşılaştırma → iki eser yan yana, benzerlik + fark → karşılaştırma halkası', f: 'B2 ölçütü' },
    { l: 'C · odak ve düzen → harita, sandviç, iki esere eşit yer', f: 'C ölçütü' },
    { l: 'D · dil → terim, akademik ton, boş tekrar yok', f: 'D ölçütü' }
  ], foot: 'Karşılaştırma yalnız B2’de puanlanır. Resmî adlar: A Knowledge, understanding and interpretation · B Analysis and evaluation (B1: textual features and/or broader authorial choices; B2: comparative analysis) · C Focus and organization · D Language.' },
  { n: 3, t: 'Soru seçimi (0–12 dk)', hl: 'g', lines: [
    'Tek ölçüt → 3 blok × 2 eser = 6 sahne bulabiliyor musun?',
    'Tanıdık konu → iyi soru demek değil',
    '2 dk’da 6 sahne yok → öbür soruya geç',
    'Soruyu parçala → her kavramın altını çiz → her parça bir blokta',
    'Atlanan parça → A’dan doğrudan puan kaybı'
  ] },
  { n: 4, t: 'Soru kalıbı sözlüğü', hl: 'g', lines: [
    'How / In what ways → nasıl: teknik + anlam → her bloğu bir yazar seçimine bağla',
    'Discuss → tartış: birden çok yön → ya … ya da',
    'Explore → derinlemesine aç → her kanıttan sonra “bu da … düşündürür”',
    'To what extent → ne ölçüde → tez: «büyük ölçüde, ancak …»',
    'Compare and contrast → benzerlik + fark → her blokta A → B → fark',
    'Significance → önem → yorum halkasını büyüt',
    'Present / portray → yazarın seçimleri → «[Yazar] … ederek kurar»',
    'Reader response → okur etkisi → etki + o etkinin anlamı',
    'Two works you have studied → iki esere eşit yer (C)'
  ] },
  { n: 5, t: 'Harita (köşeye 7 satır)', hl: 'g', lines: [
    'Cümle değil → kelime ve ok',
    { l: '1 → Soru parçaları', f: 'Harita · 1. satır' },
    { l: '2 → Kavram tanımı', f: 'Harita · 2. satır' },
    { l: '3 → Tez (A ↔ B → fark ne gösterir)', f: 'Harita · 3. satır' },
    { l: '4 → Tema: A sahnesi ↔ B sahnesi → yorum kelimesi', f: 'Harita · 4. satır' },
    { l: '5 → Karakter: A ↔ B → yorum kelimesi', f: 'Harita · 5. satır' },
    { l: '6 → Teknik: A tekniği ↔ B tekniği → yorum kelimesi', f: 'Harita · 6. satır' },
    { l: '7 → Açık uç sorusu', f: 'Harita · 7. satır' },
    { l: 'Neden? → plansız yazan 2. blokta ne kanıtladığını unutur → özete kayar', f: 'Harita neden şart?' }
  ] },
  { n: 6, t: 'Giriş = huni (6–8 cümle)', hl: 'b', lines: [
    'Huni → genişten dara: kavram → eserler → ana kavram → tez',
    'Adım 1 · soruya bağlan → eserleri ANMADAN kavramı tanımla → «[Kavram], [tanım]dır.»',
    'Adım 2 · eserler + özet → yazar, tür, dönem, bağlam, tek cümle olay',
    'Adım 3 · ana kavram → «Her iki eser de [X] ile [Y] arasındaki çatışmayı işler.»',
    'Adım 4 · tez + harita → «[A], [seçim A] ile … görünür kılarken; [B], [seçim B] ile onu sorgular. Bu fark … açığa çıkarır.»',
    '!Girişe girmez → biyografi · “bu denemede inceleyeceğim” · uzun özet · “… her zaman önemlidir”'
  ] },
  { n: 7, t: 'Blok = sandviç', hl: 'b', lines: [
    'Üst ekmek → «[Anahtar sözcük], [A]’da [anlam A], [B]’de ise [anlam B] anlatmak üzere kullanılmaktadır.»',
    'Formülün 3 parçası → hangi teknik + hangi anlam + kalıp',
    'Anlam parçası yoksa → etiket avcılığı, analiz değil',
    'Edilgen / etken → ikisi de olur («[Yazar] … göstermek için kullanır»)',
    'Alt ekmek → «Bu iki örnekte de görüldüğü üzere [anahtar sözcük], …»',
    'Alt ≠ üst → kopya değil; bloğun kanıtladığı yeni şey',
    'İki ekmekte anahtar sözcük → sadece ilk ve son cümle okunsa bile odak görünür'
  ] },
  { n: 8, t: 'Bloğun içi: 4 halka', hl: 'b', lines: [
    'Avukat benzetmesi → iddia → delil → ikinci delil → jüriye “neden önemli”',
    '1 İddia → yazarın seçimini adlandır → «[Yazar] bunu … ederek kurar.»',
    '2 Kanıt → kısa sahne / kısa alıntı, cümleye gömülü → bir cümlede göster, işine dön',
    '3 Karşılaştırma → öbür uç; benzerlik + fark',
    '4 Yorum → neden önemli? → «Bu da … düşündürür.»',
    '+ Temkinli cesaret → «Ya [yazar] … ya da …» → iki somut okuma; boş “belki” değil',
    'Tek sahne → karşılaştırma yok → tezatlık görünmez'
  ] },
  { n: 9, t: 'Karşılaştırma bağlaçları', hl: 'b', lines: [
    '«… iken …» → farkı tek cümlede kurar',
    '«Her iki eserde de … ancak …» → önce benzerlik, sonra fark',
    '«Buna karşılık … / A’nın aksine B …» → keskin fark',
    '«Benzer biçimde …» → benzerlik',
    '«Bu fark, … açığa çıkarır.» → karşılaştırmadan yoruma geçiş'
  ] },
  { n: 10, t: 'Blok boyutları (hocanın şablonu)', hl: 'b', lines: [
    '1 Tema / içerik → yazarlar temayı nasıl kurguluyor? → fark temayı nasıl zenginleştiriyor?',
    '2 Karakter / ilişki → hangi çatışma? diyalog, eylem → insan doğası / toplum mesajı',
    '3 Teknik / biçim → anlatıcı, bakış açısı, zaman kurgusu, sembol, yapı → farklı teknik = farklı okur etkisi → edebî akım (realizm, modernizm)',
    '4 Bağlam (isteğe bağlı) → tarih, kültür, ideoloji → evrensel mi, yerel mi?'
  ] },
  { n: 11, t: 'Sonuç (4–6 cümle)', hl: 'p', lines: [
    'Stüdyo yorumu benzetmesi → skor → ligdeki anlamı → akıldaki soru',
    '1 Tezi yeni kelimelerle kur → blokların toplamından çıkan daha geniş sonuç',
    'Eşanlamlı kopya → yine kopya → düşünce büyümeli',
    '2 Bağla → günümüz / edebî akım / toplumsal tartışma',
    '3 Açık uç → «Sonuçta okur şu soruyla baş başa kalır: … mıdır, yoksa … mı?»',
    '!Sonuca girmez → yeni kanıt · “inceledim” · başlık tekrarı · olay özeti · tezin aynısı'
  ] },
  { n: 12, t: 'Süre (105 dk)', hl: 'g', lines: [
    { l: '0–12 → soru seç, parçala, harita', f: '0–12. dakika' },
    { l: '12–22 → giriş', f: '12–22. dakika' },
    { l: '22–82 → 3 blok × ~20 dk (eşit süre = eşit derinlik)', f: '22–82. dakika' },
    { l: '82–92 → sonuç', f: '82–92. dakika' },
    { l: '92–100 (+5) → kontrol', f: '92–100 (+5). dakika' }
  ] },
  { n: 13, t: 'Kontrol listesi', hl: 'g', lines: [
    '✓ Soruyu girişte kendi kelimelerimle yazdım',
    '✓ Tez karşılaştırmalı ve analitik',
    '✓ Her blokta A → B → karşılaştırma → yorum',
    '✓ Kanıtlar kısa, analize gömülü',
    '✓ Anahtar sözcük her bloğun ilk + son cümlesinde',
    '✓ Her blokta bir “bu da … düşündürür”',
    '✓ İki esere eşit yer · sorunun her parçası cevaplandı',
    '✓ Sonuç günümüze bağlandı, soruyla bitti · yazım'
  ] },
  { n: 14, t: 'Altın kurallar', hl: 'p', lines: [
    '!“Okuyucuya hüzün hissettirilmiştir” → tek başına puan almaz → hangi seçim, neden, hangi anlam',
    'Edilgen çatı → sorun değil; sorun yorumsuz etki',
    'Odak → her blokta, sadece sonda değil',
    '“Nasıl” → arkasından hep “neden”',
    'Genelleme (“iyi insanlar”) → somut ad, sahne, an',
    'Kural → biçime değil işleve hizmet eder → “bu kural değerlendiriciye neyi kanıtlıyor?” diye sor',
    'Tekrar → yasak değil (anahtar sözcük bilerek) → yasak olan yerinde sayan düşünce',
    '“Ardından … sonra …” → kronolojik özet → yerine iddia + iki uç',
    'Teknik adı tek başına → etiket avcılığı',
    'Bir eser uzun, öbürü iki cümle → B2 ve C’den kayıp'
  ] },
  { n: 15, t: 'Değerlendirici dersleri', hl: 'p', lines: [
    'Ders 1 → C ve D’de tam puan, A’da 7/10 → neden? genellemeler + sadece son paragraf soruya odaklı',
    'Ders 2 → “sempati yaratır” deyip durmuş → sempatinin anlamı ve önemi yok → B’den kayıp',
    'Ders 3 → sorunun bir parçası (“olaylar”) atlanmış → A’dan kayıp',
    '7 kâğıtlarının ortak hamlesi → formüllü açılış + anahtar sözcük iki ekmekte + “ya … ya da”'
  ], foot: 'Ders 1’deki 7/10 eski 30 puanlık ölçekten (A o zaman 10 üzerindendi); bugün A 5 üzerinden.' },
  { n: 16, t: 'Tek eserli okul sınavı', hl: 'y', lines: [
    'Her şey aynı → yalnızca karşılaştırma eserin içinden',
    'İki uç → iki sahne (baş ↔ son) · iki karakter · iki dönem (gençlik ↔ yaşlılık)',
    'Tez → «[Yazar], [kavram] aracılığıyla [ana çatışma]yı gösterir; bunu tema, karakter ve yapı üzerinden kurar.»',
    'Ezber → eser başına 3 blok × 2 uç = 6 sahne → neredeyse her soruda işe yarar'
  ] }
];

/* ---------- sınavın yapısı: kutucuklar ve ölçütler ---------- */
const P2_FACTS = [
  { ic: 'clock', big: '1 sa 45 dk', t: 'Süre', d: '105 dakika; planı ilk 12 dakikada yap' },
  { ic: 'test', big: '4 → 1', t: 'Soru', d: '4 genel edebî sorudan birini seçersin' },
  { ic: 'twin', big: '2 eser', t: 'Eserler', d: 'Derste okuduğun iki eseri karşılaştırırsın' },
  { ic: 'book', big: 'Kitap yok', t: 'Kitap', d: 'Alıntı şart değil; sahneyi doğru anlatmak yeter' },
  { ic: 'target', big: '%25', t: 'Ağırlık', d: 'HL notunun dörtte biri' },
  { ic: 'x', big: 'IO + HL', t: 'Yasak eser', d: 'IO’da ya da HL denemesinde kullandığın eser olmaz' }
];
const P2_CRIT = [
  { k: 'A', n: 'Bilgi, anlama, yorum', en: 'Knowledge, understanding and interpretation', old: 10, q: 'Eserleri ve soruyu anladın mı?', w: 'Giriş + tez + somut sahne', col: '#2A44B8' },
  { k: 'B1', n: 'Çözümleme', en: 'Analysis and evaluation of textual features and/or broader authorial choices', old: 10, q: 'Yazar ne yaptı, neden?', w: 'İddia + kanıt + yorum', col: '#8B3FC6' },
  { k: 'B2', n: 'Karşılaştırma', en: 'Comparative analysis of textual features and/or broader authorial choices', old: 0, q: 'İki eser yan yana mı? Benzerlik + fark var mı?', w: 'Karşılaştırma halkası', col: '#DD3A2A' },
  { k: 'C', n: 'Odak ve düzen', en: 'Focus and organization', old: 5, q: 'Deneme planlı, odaklı, dengeli mi?', w: 'Harita, sandviç, iki esere eşit yer', col: '#0F8E57' },
  { k: 'D', n: 'Dil', en: 'Language', old: 5, q: 'Dil açık, doğru ve akademik mi?', w: 'Terim, akademik ton, boş tekrar yok', col: '#D16C06' }
];

/* ---------- denemenin anatomisi (süreyle birlikte) ---------- */
const P2_ANAT = [
  { k: 'plan', a: 0, b: 12, t: 'Plan', s: 'harita · 7 satır', sec: 5 },
  { k: 'giris', a: 12, b: 22, t: 'Giriş', s: 'huni · 6–8 cümle', sec: 6 },
  { k: 'b1', a: 22, b: 42, t: 'Blok 1', s: 'tema / içerik', sec: 7 },
  { k: 'b2', a: 42, b: 62, t: 'Blok 2', s: 'karakter / ilişki', sec: 8 },
  { k: 'b3', a: 62, b: 82, t: 'Blok 3', s: 'teknik / biçim', sec: 10 },
  { k: 'sonuc', a: 82, b: 92, t: 'Sonuç', s: 'ters huni · 4–6 cümle', sec: 11 },
  { k: 'kontrol', a: 92, b: 105, t: 'Kontrol', s: '8 madde · +5 dk pay', sec: 13 }
];

/* ---------- prova saati: her aşamada ne yapılır ---------- */
const P2_PHASES = [
  { a: 0, b: 12, t: 'Plan', col: '#0F8E57', sec: 3, do: ['Dört soruyu oku; her biri için 6 sahne testini yap: 3 blok × 2 eser', '2 dakikada 6 sahne yoksa öbür soruya geç', 'Seçtiğin sorunun her kavramının altını çiz; her parça bir blokta', 'Köşeye 7 satırlık haritayı yaz: cümle değil, kelime ve ok'] },
  { a: 12, b: 22, t: 'Giriş', col: '#2A44B8', sec: 6, do: ['Huni: kavram → eserler → ana kavram → tez', 'Adım 1: eserleri anmadan kavramı tanımla', 'Adım 3: «Her iki eser de [X] ile [Y] arasındaki çatışmayı işler.»', 'Adım 4: tez + harita; biyografi ve “inceleyeceğim” yok'] },
  { a: 22, b: 42, t: 'Blok 1 · tema', col: '#0B97A4', sec: 7, do: ['Üst ekmek: anahtar sözcük, A’daki anlamı, B’deki anlamı', 'İddia → kanıt → karşılaştırma → yorum', '«Bu da … düşündürür.»', 'Alt ekmek: bloğun kanıtladığı yeni şey, anahtar sözcükle'] },
  { a: 42, b: 62, t: 'Blok 2 · karakter', col: '#8B3FC6', sec: 8, do: ['Hangi çatışma? Diyalog, eylem', 'İki uç: A’nın sahnesi ↔ B’nin sahnesi', 'Temkinli cesaret: «Ya [yazar] … ya da …»', 'İnsan doğası / toplum mesajına bağla'] },
  { a: 62, b: 82, t: 'Blok 3 · teknik', col: '#DD3A2A', sec: 10, do: ['Anlatıcı, bakış açısı, zaman kurgusu, sembol, yapı', 'Farklı teknik = farklı okur etkisi', 'Edebî akıma bağla (realizm, modernizm)', 'Anahtar sözcük ilk ve son cümlede'] },
  { a: 82, b: 92, t: 'Sonuç', col: '#D1337C', sec: 11, do: ['Tezi yeni kelimelerle kur: blokların toplamından çıkan daha geniş sonuç', 'Bağla: günümüz / edebî akım / toplumsal tartışma', 'Açık uç: «Sonuçta okur şu soruyla baş başa kalır: … mıdır, yoksa … mı?»', 'Yeni kanıt yok, “inceledim” yok, tezin aynısı yok'] },
  { a: 92, b: 105, t: 'Kontrol', col: '#D16C06', sec: 13, chk: 1, do: [] }
];

/* ---------- yöntem testi: [bölüm, soru, doğru, [çeldiriciler], ipucu 1, ipucu 2, açıklama] ---------- */
const P2_Q = [
  [0, 'Tez nedir?', 'Denemenin tek cümlelik, karşı çıkılabilir iddiası', ['Eserlerin kısa özeti', 'Sorudaki ana kavram', 'Sonuçtaki açık uç sorusu'], 'Girişin sonunda durur ve bütün denemeyi taşır.', 'Biri ona “hayır, öyle değil” diyebilmeli.', 'Herkesin kabul edeceği bir cümle (“iki eser de önemlidir”) tez değildir; tez karşı çıkılabilir bir iddiadır.'],
  [0, 'Bu notta “harita” ne demek?', 'Tezin sonundaki blok sırası (tema, karakter, teknik)', ['Eserlerdeki mekânların listesi', 'Sonucun son cümlesi', 'Sınavın süre planı'], 'Değerlendiriciye denemenin hangi yoldan gideceğini söyler.', 'Tez cümlesinin hemen arkasında gelir.', 'Harita, okura blokların sırasını önceden gösterir. Köşeye yazılan 7 satırlık plana da harita denir.'],
  [0, '“Anahtar sözcük” nereden gelir?', 'Sorudaki ana kavramdan (ör. tezatlık, mekân)', ['Eserde en sık geçen sözcükten', 'Yazarın kullandığı sembolden', 'Tezin ilk sözcüğünden'], 'Soruya bak, eserlere değil.', 'Örnekler: tezatlık, mekân.', 'Anahtar sözcük sorunun ana kavramıdır; her bloğun ilk ve son cümlesinde geçer.'],
  [0, 'Bu notta “uç” ne demek?', 'Karşılaştırılan iki şeyden biri (A eseri ↔ B eseri)', ['Paragrafın son cümlesi', 'Sonucun okura bıraktığı soru', 'Sorunun en zor parçası'], 'Her paragrafın formülünde iki tane vardır.', 'A / B.', 'Her paragraf: ne yapıyor → iki uç (A / B) → bu ne düşündürüyor.'],
  [0, 'Sandviçte iki ekmek neyi taşır?', 'Anahtar sözcüğü', ['Yazarların adlarını', 'Alıntıları', 'Eser özetlerini'], 'Ekmekler bloğun ilk ve son cümlesidir.', 'Sorudaki ana kavram.', 'Blok = açılış + iç + kapanış. Anahtar sözcük iki ekmekte de geçer; böylece yalnız ilk ve son cümle okunsa bile odak görünür.'],
  [0, 'Puan en çok nerede kazanılır?', 'Yorumda: “neden önemli?” cevabında', ['Uzun alıntılarda', 'Olay özetinde', 'Yazarın biyografisinde'], 'Avukatın jüriye son sözü.', '“Neden önemli?”', 'Notun sözlüğü açık: “Yorum → neden önemli? cevabı; puan burada.”'],
  [0, '“Temkinli cesaret” nedir?', 'İki somut okumayı açık bırakmak (ya … ya da)', ['Hiç kesin konuşmamak, hep “belki” demek', 'Tezi sonuçta değiştirmek', 'Tek bir okumayı kesin savunmak'], 'Cesaret var, ama tek yol yok.', '«Ya [yazar] … ya da …»', 'Temkinli cesaret iki somut okuma sunar; boş “belki” değildir.'],
  [0, 'Açık uç neyle biter?', 'Okura bırakılan bir soruyla', ['Yeni bir kanıtla', 'Tezin aynısıyla', 'Blokların özetiyle'], 'Okur denemeden sonra da düşünmeye devam etmeli.', '«… mıdır, yoksa … mı?»', 'Açık uç, sonucu okura bir soru bırakarak bitirmektir.'],
  [1, 'Paper 2’nin süresi ve soru düzeni hangisi?', '1 sa 45 dk · 4 genel sorudan 1', ['2 saat · 2 sorudan 1', '1 sa 15 dk · 4 sorudan 2', '1 sa 45 dk · 3 sorudan 1'], 'Toplam 105 dakika.', 'Dört soru var, biri seçilir.', 'Paper 2: 1 saat 45 dakika, dört genel sorudan biri, iki eserle karşılaştırmalı deneme.'],
  [1, 'Eserlerin kitapları sınavda ne durumda?', 'Sınava girmez; alıntı şart değil, sahneyi doğru anlatmak yeter', ['Notsuz kitap getirilebilir', 'Yalnızca HL öğrencileri getirebilir', 'Alıntı zorunlu olduğu için uzun ezber şart'], 'Masada kitap yok.', 'Sahneyi doğru anlatmak yeter.', 'Kitap sınava girmez. Kısa alıntı güzeldir ama şart değildir; sahneyi doğru ve somut anlatmak yeter.'],
  [1, 'Paper 2, HL notunun ne kadarı?', '%25', ['%35', '%20', '%30'], 'Dörtte bir.', 'HL’de yüzde yirmi beş.', 'Paper 2 HL notunun %25’idir (SL’de %35).'],
  [1, 'Hangi eser Paper 2’de kullanılamaz?', 'IO’da ya da HL denemesinde kullandığın eser', ['Çeviri bir eser', 'Derste okunan şiir kitabı', 'Kısa öykü kitabı'], 'Bir eseri iki kez değerlendirtmezsin.', 'Sözlü sınav ve HL denemesi.', 'Yasak eser: IO’da ya da HL denemesinde kullandığın eser.'],
  [1, 'Mayıs 2026’dan beri Paper 2 kaç puan üzerinden?', '25 = 5 ölçüt × 5', ['30 = A 10, B 10, C 5, D 5', '20 = 4 ölçüt × 5', '40 = 4 ölçüt × 10'], 'Beş ölçüt, her biri eşit.', 'Beş kere beş.', 'Yeni düzende A, B1, B2, C, D her biri 5 puan: toplam 25. Eski örnekler 30 üzerinden; okurken buna dikkat et.'],
  [2, 'Karşılaştırma hangi ölçütte puanlanır?', 'Yalnız B2’de', ['Her ölçütte', 'A ve C’de', 'Yalnız D’de'], 'B ölçütü iki parçaya ayrıldı.', 'İkinci parça.', 'Yeni düzende karşılaştırma yalnız B2’de puanlanır. Ama iki esere eşit yer vermek C’yi de etkiler.'],
  [2, 'A ölçütü ne sorar?', 'Eserleri ve soruyu anladın mı?', ['Yazar ne yaptı, neden?', 'İki eser yan yana mı?', 'Dil akademik mi?'], 'Bilgi, anlama, yorum.', 'Giriş + tez + somut sahne.', 'A: bilgi, anlama, yorum. Puan giriş, tez ve somut sahnelerle gelir.'],
  [2, 'B1 neyi ölçer?', 'Çözümlemeyi: yazar ne yaptı, neden?', ['İki eseri karşılaştırmayı', 'Paragraf düzenini', 'Yazım ve noktalamayı'], 'İddia + kanıt + yorum.', 'Yazarın seçimi ve nedeni.', 'B1 çözümlemedir: yazarın seçimini adlandırır, kanıtla gösterir, neden önemli olduğunu söylersin.'],
  [2, 'C ölçütünde puanı ne getirir?', 'Harita, sandviç, iki esere eşit yer', ['Uzun alıntılar', 'Çok sayıda teknik adı', 'Ayrıntılı biyografi'], 'Odak ve düzen.', 'Plan + blok yapısı + denge.', 'C: odak ve düzen. Harita, sandviç ve iki esere eşit yer bu puanı getirir.'],
  [2, 'D ölçütü neye bakar?', 'Terim, akademik ton, boş tekrar yok', ['Alıntıların uzunluğuna', 'Eserlerin dönemine', 'Blok sayısına'], 'Dil.', 'Terim ve akademik ton.', 'D: dil. Doğru terim, akademik ton, boş tekrarın olmaması.'],
  [2, 'Bir paragrafta yalnızca A eserini çok iyi çözümledin, B hiç yok. En doğrudan hangi ölçütten kaybedersin?', 'B2 · karşılaştırma', ['D · dil', 'A · bilgi', 'B1 · çözümleme'], 'Çözümleme iyi; eksik olan başka.', 'Öbür uç nerede?', 'Karşılaştırma halkası yoksa B2’den kaybedersin. Tek eser uzun, öbürü yoksa C de etkilenir.'],
  [3, 'Bir soruyu seçmeden önce yapman gereken test hangisi?', '3 blok × 2 eser = 6 sahne bulabiliyor muyum?', ['Konu bana tanıdık geliyor mu?', 'Soru kısa mı?', 'Sorudaki terimleri biliyor muyum?'], 'Tanıdık konu, iyi soru demek değil.', 'Sahne say.', 'Tek ölçüt: 3 blok × 2 eser = 6 sahne. Bulamıyorsan o soru sana göre değil.'],
  [3, '2 dakikada 6 sahne bulamadın. Ne yaparsın?', 'Öbür soruya geçerim', ['Bulduğum 3 sahneyle yazarım', 'Tek eserden 6 sahne bulurum', 'Önce girişi yazar, sahneleri sonra düşünürüm'], 'Zaman kaybı ikiye katlanır.', 'Not açık: öbür soru.', '2 dk’da 6 sahne yoksa öbür soruya geç. Yarım malzemeyle başlanan deneme 2. blokta tıkanır.'],
  [3, 'Soruyu parçalamak ne demek?', 'Her kavramın altını çizip her parçayı bir bloğa vermek', ['Soruyu kendi kelimelerimle kısaltmak', 'Soruyu iki eserden birine uyarlamak', 'Sorudaki zor kelimeyi atlamak'], 'Altını çiz.', 'Her parça bir blokta.', 'Soruyu parçala → her kavramın altını çiz → her parça bir blokta.'],
  [3, 'Sorunun bir parçasını atlarsan ne olur?', 'A’dan doğrudan puan kaybedersin', ['Yalnız D’den kaybedersin', 'Tez güçlüyse puan kaybı olmaz', 'Yalnız C’den kaybedersin'], 'Soruyu anladın mı?', 'Değerlendirici dersi 3.', 'Atlanan parça A’dan doğrudan puan kaybıdır (Ders 3: “olaylar” atlanmış).'],
  [4, 'Soruda “To what extent” var. Tez nasıl kurulur?', '«Büyük ölçüde, ancak …»', ['«Kesinlikle evet»', '«Bu denemede inceleyeceğim»', '«Her iki eser de önemlidir»'], 'Ne ölçüde? Bir ölçü ver.', 'Evet ama…', '“To what extent” bir derece ister: «büyük ölçüde, ancak …» ile hem cevap hem sınır verirsin.'],
  [4, '“Discuss” ne ister?', 'Birden çok yönü tartışmayı (ya … ya da)', ['Yalnız benzerlikleri', 'Olay özetini', 'Tek bir okumayı savunmayı'], 'Tartış.', 'Ya … ya da.', '“Discuss” birden çok yön ister; temkinli cesaretin yeri burası.'],
  [4, '“Explore” gördün. Her kanıttan sonra ne eklersin?', '«Bu da … düşündürür.»', ['Bir alıntı daha', 'Yazarın biyografisi', 'Olayın devamı'], 'Derinlemesine aç.', 'Yorum halkası.', '“Explore” derinlik ister: her kanıttan sonra “bu da … düşündürür”.'],
  [4, '“How / In what ways” sorusunda her blok neye bağlanır?', 'Bir yazar seçimine (teknik + anlam)', ['Bir olaya', 'Yazarın hayatına', 'Uzun bir alıntıya'], 'Nasıl?', 'Teknik + anlam.', '“Nasıl” sorusu yazarın seçimlerini sorar: her blok bir teknik ve onun anlamı üzerine kurulur.'],
  [4, '“Compare and contrast” her blokta ne ister?', 'A → B → fark', ['Önce A’nın tamamı, sonra B’nin tamamı', 'Yalnız benzerlikler', 'Yalnız farklar, sonda'], 'Benzerlik + fark.', 'Her blokta iki uç ve fark.', 'Her blokta A → B → fark. Önce A’nın tamamı sonra B’nin tamamı (blok karşılaştırma) zayıf yapıdır.'],
  [4, '“Significance” görünce hangi halkayı büyütürsün?', 'Yorum halkasını', ['Kanıt halkasını', 'İddia halkasını', 'Girişi'], 'Önem = neden önemli?', '4. halka.', '“Significance” önem sorar; “neden önemli?” cevabı yorum halkasıdır.'],
  [4, '“Present / portray” için hangi kalıp uygun?', '«[Yazar] … ederek kurar»', ['«Okuyucuya … hissettirilmiştir»', '«Bu denemede … inceleyeceğim»', '«Ardından … sonra …»'], 'Yazarın seçimleri.', 'Kurar.', '“Present / portray” yazarın seçimlerini sorar: «[Yazar] … ederek kurar».'],
  [4, '“Reader response” sorusunda yeterli cevap hangisi?', 'Etki + o etkinin anlamı', ['Yalnızca “okur üzülür” demek', 'Okurun kim olduğunu tahmin etmek', 'Yazarın niyetini anlatmak'], 'Etki tek başına puan almaz.', 'Etkinin anlamı.', 'Okur etkisi soruluyorsa etkiyi söyle, sonra o etkinin neyi düşündürdüğünü açıkla.'],
  [4, '“Two works you have studied” ifadesi hangi kuralı hatırlatır?', 'İki esere eşit yer (C)', ['Kitabı sınava getirmeyi', 'Tek eseri derinlemesine işlemeyi', 'Eserleri kronolojik sıralamayı'], 'Denge.', 'C ölçütü.', 'İki eser: iki esere eşit yer. Dengesizlik B2 ve C’den kaybettirir.'],
  [5, 'Harita kaç satır ve nasıl yazılır?', '7 satır; cümle değil, kelime ve ok', ['3 satır; tam cümlelerle', '7 satır; tam cümlelerle', 'Satır yok; akılda tutulur'], 'Köşeye.', 'Kelime ve ok.', 'Harita köşeye 7 satır; cümle değil, kelime ve ok.'],
  [5, 'Haritanın 3. satırı hangisi?', 'Tez (A ↔ B → fark ne gösterir)', ['Kavram tanımı', 'Tema: A ↔ B', 'Açık uç sorusu'], 'Önce soru parçaları, sonra kavram tanımı.', 'Fark ne gösterir?', 'Sıra: 1 soru parçaları · 2 kavram tanımı · 3 tez · 4 tema · 5 karakter · 6 teknik · 7 açık uç.'],
  [5, 'Plansız yazan öğrenciye ne olur?', '2. blokta ne kanıtladığını unutur, özete kayar', ['Giriş uzun olur ama sorun çıkmaz', 'Daha yaratıcı yazar', 'Yalnız D’den puan kaybeder'], 'Notun “Neden?” satırı.', 'Özet.', 'Plansız yazan 2. blokta ne kanıtladığını unutur ve özete kayar. Harita bu yüzden şart.'],
  [5, 'Haritanın 7. satırı hangisi?', 'Açık uç sorusu', ['Teknik: A ↔ B', 'Tez', 'Kontrol listesi'], 'Sonuç nasıl bitiyordu?', 'Okura bir soru.', '7. satır açık uç sorusu: sonucu baştan bilerek yazarsın.'],
  [5, 'Haritanın 4–6. satırlarının ortak biçimi hangisi?', 'Boyut: A ↔ B → yorum kelimesi', ['Boyut: alıntı → alıntı', 'Olay → olay → olay', 'Yazar → dönem → tür'], 'Her blok iki uçtan oluşur.', 'Sonunda tek bir yorum kelimesi.', 'Tema, karakter ve teknik satırları aynı biçimde: A ↔ B → yorum kelimesi.'],
  [6, 'Girişin 1. adımında ne yaparsın?', 'Eserleri anmadan kavramı tanımlarım', ['Yazarların biyografisini veririm', 'Tezimi yazarım', 'Eserlerin olay özetini anlatırım'], 'Huni genişten başlar.', '«[Kavram], [tanım]dır.»', 'Adım 1: soruya bağlan; eserleri ANMADAN kavramı tanımla.'],
  [6, 'Giriş kaç cümle, hangi biçimde?', '6–8 cümle; huni: genişten dara', ['2–3 cümle; doğrudan tez', '10–12 cümle; uzun özet', '4–6 cümle; ters huni'], 'Huni.', 'Kavram → eserler → ana kavram → tez.', 'Giriş 6–8 cümlelik bir huni: kavram → eserler → ana kavram → tez.'],
  [6, 'Hangisi girişe girmez?', '“Bu denemede … inceleyeceğim”', ['Kavramın tanımı', 'Eserlerin türü ve dönemi', 'Tez + harita'], 'Notta kırmızı satır.', 'Duyuru cümlesi.', 'Girişe girmez: biyografi · “bu denemede inceleyeceğim” · uzun özet · “… her zaman önemlidir”.'],
  [6, 'Girişin 3. adımındaki kalıp hangisi?', '«Her iki eser de [X] ile [Y] arasındaki çatışmayı işler.»', ['«Bu denemede [X] ve [Y] inceleyeceğim.»', '«[X] her zaman önemlidir.»', '«Ardından [X], sonra [Y] gelir.»'], 'Ana kavram.', 'Çatışma.', 'Adım 3 ana kavramı iki eserin ortak çatışması olarak kurar.'],
  [6, 'Girişin 2. adımında ne verilir?', 'Yazar, tür, dönem, bağlam, tek cümle olay', ['Uzun olay özeti', 'Yazarın hayat hikâyesi', 'Bütün karakterlerin listesi'], 'Kısa tanıtım.', 'Tek cümle olay.', 'Adım 2: eserler + özet → yazar, tür, dönem, bağlam, tek cümle olay. Uzun özet girişe girmez.'],
  [6, 'Tez kalıbının ikinci cümlesi hangisi?', '«Bu fark … açığa çıkarır.»', ['«Bu iki eser çok önemlidir.»', '«Şimdi bunları inceleyelim.»', '«Ardından sonuca geçeceğim.»'], 'Karşılaştırmadan yoruma.', 'Fark neyi gösterir?', 'Tez iki cümledir: A şunu görünür kılarken B onu sorgular. Bu fark … açığa çıkarır.'],
  [7, 'Üst ekmek formülünde hangi parça eksikse yazdığın şey “etiket avcılığı” olur?', 'Anlam parçası', ['Teknik parçası', 'Kalıp', 'Yazar adı'], 'Formülün 3 parçası: teknik + anlam + kalıp.', 'Teknik adı var ama…', 'Anlam parçası yoksa yazdığın etiket avcılığıdır, analiz değil.'],
  [7, 'Alt ekmek nasıl olmalı?', 'Üstün kopyası değil; bloğun kanıtladığı yeni şey', ['Üst ekmeğin aynısı', 'Yeni bir kanıt', 'Bir sonraki bloğun özeti'], 'Alt ≠ üst.', 'Blok ne kanıtladı?', 'Alt ekmek bloğun kanıtladığı yeni şeyi söyler; eşanlamlı kopya da kopyadır.'],
  [7, 'Anahtar sözcük neden iki ekmekte de geçer?', 'Yalnız ilk ve son cümle okunsa bile odak görünsün diye', ['Kelime sayısını artırmak için', 'D ölçütü tekrar istediği için', 'Kalıp böyle olduğu için'], 'Değerlendirici hızlı okur.', 'Odak.', 'İki ekmekte anahtar sözcük: sadece ilk ve son cümle okunsa bile odak görünür.'],
  [7, 'Edilgen çatı (…kullanılmaktadır) hakkında doğru olan hangisi?', 'İkisi de olur: edilgen de etken de', ['Yasak; mutlaka etken çatı', 'D’den puan kaybettirir', 'Yalnız girişte kullanılabilir'], 'Sorun çatıda değil.', '«[Yazar] … göstermek için kullanır» da olur.', 'Edilgen / etken ikisi de olur. Sorun yorumsuz etkidir.'],
  [7, 'Bloğun formülündeki 3 parça hangisi?', 'Hangi teknik + hangi anlam + kalıp', ['Alıntı + özet + kalıp', 'Yazar + dönem + tür', 'Giriş + gelişme + sonuç'], 'Üst ekmeğin formülü.', 'Teknik + anlam.', 'Formülün 3 parçası: hangi teknik + hangi anlam + kalıp.'],
  [8, 'Bloğun içindeki 4 halkanın sırası hangisi?', 'İddia → Kanıt → Karşılaştırma → Yorum', ['Kanıt → İddia → Yorum → Karşılaştırma', 'Özet → Kanıt → İddia → Yorum', 'İddia → Yorum → Kanıt → Karşılaştırma'], 'Avukat: önce iddia.', 'Yorum en sonda.', '4 halka: iddia → kanıt → karşılaştırma → yorum.'],
  [8, 'Kanıt nasıl verilir?', 'Kısa sahne ya da kısa alıntı, cümleye gömülü', ['Uzun alıntı, ayrı paragrafta', 'Olayın baştan sona özeti', 'Yalnız sayfa numarası'], 'Bir cümlede göster.', 'İşine dön.', 'Kanıt kısa ve cümleye gömülüdür: bir cümlede göster, işine dön.'],
  [8, 'Temkinli cesaret ile boş “belki” arasındaki fark ne?', 'Temkinli cesaret iki somut okuma sunar', ['Hiçbir fark yok', 'Boş “belki” daha akademiktir', 'Temkinli cesaret tek okumayı savunur'], 'Ya … ya da.', 'İkisi de somut.', '«Ya [yazar] … ya da …» iki somut okumadır; boş “belki” hiçbir şey söylemez.'],
  [8, 'Bir blokta tek sahne kullanırsan ne olur?', 'Karşılaştırma olmaz, tezatlık görünmez', ['Blok daha odaklı olur', 'Daha çok puan alırsın', 'Yalnız D etkilenir'], 'İki uç gerekir.', 'Tezatlık.', 'Tek sahne → karşılaştırma yok → tezatlık görünmez.'],
  [8, 'Avukat benzetmesinde jüriye söylenen “neden önemli” hangi halkadır?', 'Yorum', ['İddia', 'Kanıt', 'Karşılaştırma'], 'Son söz.', '4. halka.', 'Avukat: iddia → delil → ikinci delil → jüriye “neden önemli”. Sonuncusu yorumdur.'],
  [8, '1. halkada (iddia) ne yaparsın?', 'Yazarın seçimini adlandırırım', ['Olayı özetlerim', 'Alıntı yaparım', 'Okurun duygusunu söylerim'], '«[Yazar] bunu … ederek kurar.»', 'Seçim.', 'İddia: yazarın seçimini adlandır → «[Yazar] bunu … ederek kurar.»'],
  [9, 'Farkı tek cümlede kuran kalıp hangisi?', '«… iken …»', ['«Benzer biçimde …»', '«Bu fark, … açığa çıkarır.»', '«Her iki eserde de …»'], 'Tek cümle, iki uç.', '“A şunu yaparken…”', '«… iken …» farkı tek cümlede kurar.'],
  [9, 'Karşılaştırmadan yoruma geçiş kalıbı hangisi?', '«Bu fark, … açığa çıkarır.»', ['«Buna karşılık …»', '«Benzer biçimde …»', '«… iken …»'], 'Fark neyi gösterir?', 'Açığa çıkarır.', '«Bu fark, … açığa çıkarır.» karşılaştırmadan yoruma geçer.'],
  [9, 'Önce benzerlik, sonra fark kuran kalıp hangisi?', '«Her iki eserde de … ancak …»', ['«Buna karşılık …»', '«… iken …»', '«Benzer biçimde …»'], 'Önce ortak nokta.', 'Ancak.', '«Her iki eserde de … ancak …» önce benzerliği, sonra farkı verir.'],
  [9, 'Keskin farkı hangi kalıp kurar?', '«Buna karşılık … / A’nın aksine B …»', ['«Benzer biçimde …»', '«Her iki eserde de …»', '«Bu da … düşündürür.»'], 'Zıtlık.', 'Aksine.', '«Buna karşılık …» ya da «A’nın aksine B …» keskin fark kurar.'],
  [10, 'Hocanın şablonundaki üç temel blok boyutu hangisi?', 'Tema/içerik · Karakter/ilişki · Teknik/biçim', ['Giriş · Gelişme · Sonuç', 'Bağlam · Biyografi · Özet', 'Mekân · Zaman · Dil'], 'Haritanın 4–6. satırları.', 'Tema, karakter, teknik.', 'Üç boyut: tema/içerik, karakter/ilişki, teknik/biçim. Dördüncüsü bağlam, isteğe bağlı.'],
  [10, 'Teknik/biçim bloğunda farklı tekniklerin sonucu ne?', 'Farklı okur etkisi; edebî akıma bağlanabilir', ['Aynı etki; fark önemsiz', 'Yalnız yazarın üslubu', 'Olay örgüsünün değişmesi'], 'Farklı teknik = ?', 'Realizm, modernizm.', 'Farklı teknik = farklı okur etkisi → edebî akım (realizm, modernizm).'],
  [10, 'Bağlam bloğunun sorusu hangisi?', 'Evrensel mi, yerel mi?', ['Yazar kaç yaşında yazdı?', 'Eser kaç sayfa?', 'Hangi ödülü aldı?'], 'Tarih, kültür, ideoloji.', 'Evrensel / yerel.', 'Bağlam (isteğe bağlı): tarih, kültür, ideoloji → evrensel mi, yerel mi?'],
  [10, 'Karakter/ilişki bloğu neye ulaşır?', 'İnsan doğası / toplum mesajına', ['Karakterin fiziksel tarifine', 'Olayın tarihine', 'Yazarın biyografisine'], 'Hangi çatışma?', 'İnsan ve toplum.', 'Karakter / ilişki → hangi çatışma? diyalog, eylem → insan doğası / toplum mesajı.'],
  [10, 'Tema bloğunun yorum sorusu hangisi?', 'Fark temayı nasıl zenginleştiriyor?', ['Tema kaç kez geçiyor?', 'Hangi eser daha iyi?', 'Tema ne zaman ortaya çıktı?'], 'Yazarlar temayı nasıl kurguluyor?', 'Zenginleştirme.', 'Tema / içerik → yazarlar temayı nasıl kurguluyor? → fark temayı nasıl zenginleştiriyor?'],
  [11, 'Sonuç kaç cümle?', '4–6', ['1–2', '6–8', '10–12'], 'Girişten kısa.', 'Dört ile altı arası.', 'Sonuç 4–6 cümle; giriş 6–8.'],
  [11, 'Sonucun üç adımının sırası hangisi?', 'Tezi yeni kelimelerle kur → bağla → açık uç', ['Özet → tez → teşekkür', 'Açık uç → tez → bağla', 'Yeni kanıt → tez → açık uç'], 'Stüdyo yorumu: skor → ligdeki anlamı → akıldaki soru.', 'Açık uç en sonda.', 'Sonuç: 1 tezi yeni kelimelerle kur · 2 bağla · 3 açık uç.'],
  [11, 'Tezi eşanlamlı sözcüklerle yeniden yazmak?', 'Yine kopya; düşünce büyümeli', ['Yeterli; tez tekrarlanmalı', 'Tavsiye edilir', 'Yalnız D’yi etkiler'], 'Eşanlamlı kopya.', 'Düşünce büyümeli.', 'Eşanlamlı kopya yine kopyadır; sonuç blokların toplamından çıkan daha geniş sonucu söyler.'],
  [11, 'Hangisi sonuca girmez?', 'Yeni kanıt', ['Günümüze bağlantı', 'Açık uç sorusu', 'Blokların toplamından çıkan geniş sonuç'], 'Kırmızı satır.', 'Kanıt bloklarda kaldı.', 'Sonuca girmez: yeni kanıt · “inceledim” · başlık tekrarı · olay özeti · tezin aynısı.'],
  [11, 'Sonucun 2. adımında neye bağlarsın?', 'Günümüze / edebî akıma / toplumsal tartışmaya', ['Yazarın hayatına', 'Bir sonraki sınava', 'Yeni bir esere'], 'Ligdeki anlamı.', 'Günümüz.', 'Bağla → günümüz / edebî akım / toplumsal tartışma.'],
  [12, '22. ile 82. dakika arasında ne yaparsın?', '3 blok, her biri ~20 dk', ['Giriş', 'Plan ve harita', 'Sonuç ve kontrol'], '60 dakika.', 'Üç eşit parça.', '22–82: 3 blok × ~20 dk. Eşit süre = eşit derinlik.'],
  [12, 'Bloklara neden eşit süre verirsin?', 'Eşit süre = eşit derinlik', ['Kural böyle olduğu için', 'Son blok en önemli olduğu için', 'Kelime sayısı eşit olsun diye'], 'Denge.', 'Derinlik.', 'Eşit süre eşit derinlik getirir; son blok yarım kalmaz.'],
  [12, 'İlk 12 dakikada ne yaparsın?', 'Soru seç, parçala, harita', ['Girişi yaz', 'İlk bloğu yaz', 'Sonucu planla, girişi yaz'], 'Plan.', 'Harita.', '0–12: soru seç, parçala, harita.'],
  [12, 'Sonuç hangi dakikalarda yazılır?', '82–92', ['72–82', '92–100', '60–70'], 'Bloklardan hemen sonra.', '10 dakika.', '82–92 sonuç; 92–100 (+5) kontrol.'],
  [13, 'Kontrol listesine göre anahtar sözcük nerede olmalı?', 'Her bloğun ilk + son cümlesinde', ['Yalnız girişte', 'Yalnız sonuçta', 'Her cümlede'], 'Sandviç.', 'İki ekmek.', 'Anahtar sözcük her bloğun ilk ve son cümlesinde.'],
  [13, 'Kontrol listesine göre sonuç nasıl bitmeli?', 'Günümüze bağlanmış, soruyla bitmiş', ['Tezin aynısıyla', 'Yeni bir kanıtla', 'Teşekkür cümlesiyle'], 'Bağla + açık uç.', 'Soru.', 'Sonuç günümüze bağlandı, soruyla bitti. Ardından yazım kontrolü.'],
  [13, 'Kontrol listesine göre her blokta hangi cümle olmalı?', 'Bir “bu da … düşündürür”', ['Bir “ardından … sonra …”', 'Bir “bu denemede”', 'Bir “her zaman önemlidir”'], 'Yorum.', 'Düşündürür.', 'Her blokta bir “bu da … düşündürür”: yorum halkası.'],
  [14, '“Okuyucuya hüzün hissettirilmiştir” cümlesinin asıl sorunu ne?', 'Yorumsuz etki: hangi seçim, neden, hangi anlam yok', ['Edilgen çatı', 'Çok kısa olması', 'Akademik olmaması'], 'Çatı sorun değil.', 'Hangi seçim? Neden?', 'Edilgen çatı sorun değil; sorun yorumsuz etki. Hangi seçimin hüznü kurduğunu ve bunun anlamını söyle.'],
  [14, '“Nasıl”ın arkasından hep ne gelir?', '“Neden”', ['“Ardından”', '“Örneğin”', '“Sonuç olarak”'], 'Yorum.', 'Neden önemli?', '“Nasıl” → arkasından hep “neden”.'],
  [14, '“İyi insanlar” gibi bir genellemenin yerine ne koyarsın?', 'Somut ad, sahne, an', ['Daha genel bir ifade', 'Yazarın görüşü', 'Bir ünlü sözü'], 'Somutluk.', 'Ad, sahne, an.', 'Genelleme yerine somut ad, sahne, an. Ders 1 bu yüzden A’dan kaybetti.'],
  [14, 'Tekrar hakkında doğru olan hangisi?', 'Anahtar sözcüğü bilerek tekrar etmek serbest; yasak olan yerinde sayan düşünce', ['Her tekrar yasaktır', 'Tekrar her zaman puan getirir', 'Yalnız sonuçta tekrar serbest'], 'Anahtar sözcük.', 'Yerinde sayan düşünce.', 'Tekrar yasak değil (anahtar sözcük bilerek); yasak olan yerinde sayan düşünce.'],
  [14, '“Ardından … sonra …” ile kurulan paragrafın sorunu ne?', 'Kronolojik özettir; yerine iddia + iki uç gelmeli', ['Bağlaçlar yanlıştır', 'Çok kısadır', 'Edilgen çatıdadır'], 'Olay sırası.', 'Özet.', '“Ardından … sonra …” → kronolojik özet → yerine iddia + iki uç.'],
  [14, 'Bir kuralı uygularken kendine hangi soruyu sorarsın?', '“Bu kural değerlendiriciye neyi kanıtlıyor?”', ['“Bu kural kaç puan?”', '“Bu kuralı herkes uyguluyor mu?”', '“Bu kural kitapta var mı?”'], 'Kural biçime değil…', 'İşleve.', 'Kural biçime değil işleve hizmet eder: “bu kural değerlendiriciye neyi kanıtlıyor?” diye sor.'],
  [14, 'Bir eser uzun, öbürü iki cümle. Hangi ölçütlerden kaybedersin?', 'B2 ve C', ['Yalnız D', 'Yalnız A', 'A ve D'], 'Karşılaştırma + denge.', 'B’nin ikinci parçası ve düzen.', 'Dengesizlik B2 (karşılaştırma) ve C’den (iki esere eşit yer) kaybettirir.'],
  [15, 'Ders 1: C ve D tam puan, A düşük. Neden?', 'Genellemeler + yalnız son paragraf soruya odaklı', ['Yazım hataları', 'Alıntı yok', 'Giriş çok kısa'], 'A soruyu ve eserleri anlamayı ölçer.', 'Odak yalnız sonda.', 'Ders 1: genellemeler ve sadece son paragrafın soruya odaklı olması A’dan kaybettirdi. Odak her blokta.'],
  [15, 'Ders 2: “sempati yaratır” deyip duran öğrenci nereden kaybetti?', 'B’den: sempatinin anlamı ve önemi yok', ['D’den: tekrar yasak', 'C’den: paragraf sırası', 'A’dan: eser yanlış'], 'Etki var, anlam yok.', 'Çözümleme.', 'Ders 2: etkiyi söyleyip durmak çözümleme değildir; sempatinin anlamı ve önemi yoksa B’den kaybedersin.'],
  [15, 'Ders 3: sorunun “olaylar” parçasını atlayan öğrenci nereden kaybetti?', 'A’dan', ['B2’den', 'D’den', 'Hiçbir yerden'], 'Soruyu anladın mı?', 'Atlanan parça.', 'Atlanan parça A’dan doğrudan puan kaybıdır.'],
  [15, '7 alan kâğıtların ortak hamlesi hangisi?', 'Formüllü açılış + anahtar sözcük iki ekmekte + “ya … ya da”', ['Uzun alıntılar + ayrıntılı biyografi', 'Çok sayıda teknik adı', 'Uzun olay özeti + kısa sonuç'], 'Sandviç + temkinli cesaret.', 'Formül.', '7 kâğıtları: formüllü açılış + anahtar sözcük iki ekmekte + “ya … ya da”.'],
  [16, 'Tek eserli okul sınavında karşılaştırma nereden gelir?', 'Eserin içinden: iki sahne, iki karakter, iki dönem', ['Başka bir eserden', 'Yazarın hayatından', 'Karşılaştırma yapılmaz'], 'Her şey aynı, yalnız…', 'Baş ↔ son, gençlik ↔ yaşlılık.', 'Tek eserde iki uç eserin içinden gelir: iki sahne (baş ↔ son), iki karakter, iki dönem (gençlik ↔ yaşlılık).'],
  [16, 'Tek eserli sınav için tez kalıbı hangisi?', '«[Yazar], [kavram] aracılığıyla [ana çatışma]yı gösterir; bunu tema, karakter ve yapı üzerinden kurar.»', ['«[A], [seçim A] ile … görünür kılarken; [B] onu sorgular.»', '«Bu eserde … inceleyeceğim.»', '«[Yazar] her zaman önemlidir.»'], 'Tek yazar.', 'Tema, karakter ve yapı.', 'Tek eserli tez: «[Yazar], [kavram] aracılığıyla [ana çatışma]yı gösterir; bunu tema, karakter ve yapı üzerinden kurar.»'],
  [16, 'Tek eser için ne ezberlersin?', '3 blok × 2 uç = 6 sahne', ['Bütün eserin özeti', '20 alıntı', 'Yazarın biyografisi'], 'Neredeyse her soruda işe yarar.', 'Altı sahne.', 'Ezber: eser başına 3 blok × 2 uç = 6 sahne.']
];

/* ---------- kalıbı tamamla: [bölüm, önce, cevap, sonra, [çeldiriciler], açıklama] ---------- */
const P2_GAP = [
  [6, 'Her iki eser de [X] ile [Y] arasındaki', 'çatışmayı', 'işler.', ['benzerliği', 'özeti', 'konuyu'], 'Girişin 3. adımı: ana kavramı iki eserin ortak çatışması olarak kur.'],
  [6, '[A], [seçim A] ile … görünür kılarken; [B], [seçim B] ile onu', 'sorgular.', 'Bu fark … açığa çıkarır.', ['anlatır.', 'özetler.', 'tekrarlar.'], 'Tez + harita: iki uç aynı şeye farklı seçimlerle bakar; biri görünür kılar, öbürü sorgular.'],
  [6, 'Adım 1: eserleri', 'ANMADAN', 'kavramı tanımla.', ['anarak', 'özetleyerek', 'karşılaştırarak'], 'Huni genişten başlar: önce kavram, eserler ancak 2. adımda gelir.'],
  [7, '[Anahtar sözcük], [A]’da [anlam A], [B]’de ise [anlam B] anlatmak üzere', 'kullanılmaktadır.', '', ['inceleyeceğim.', 'özetlenmiştir.', 'hissettirilmiştir.'], 'Üst ekmek: anahtar sözcük + A’daki anlamı + B’deki anlamı. Edilgen çatı burada sorun değil.'],
  [7, 'Bu iki örnekte de', 'görüldüğü üzere', '[anahtar sözcük], …', ['belki de', 'ardından', 'ilk olarak'], 'Alt ekmek: bloğun kanıtladığı yeni şeyi anahtar sözcükle söyler.'],
  [7, '[Yazar] … göstermek için', 'kullanır.', '', ['hisseder.', 'özetler.', 'inceler.'], 'Etken çatı da olur: «[Yazar] … göstermek için kullanır».'],
  [8, '[Yazar] bunu … ederek', 'kurar.', '', ['hissettirir.', 'özetler.', 'anlatmak ister.'], '1. halka, iddia: yazarın seçimini adlandır.'],
  [8, 'Bu da …', 'düşündürür.', '', ['anlatır.', 'hissettirilmiştir.', 'özetlenir.'], '4. halka, yorum: neden önemli?'],
  [8, 'Ya [yazar] …', 'ya da', '…', ['belki', 've', 'sonra'], 'Temkinli cesaret: iki somut okuma; boş “belki” değil.'],
  [11, 'Sonuçta okur şu soruyla baş başa kalır: … mıdır,', 'yoksa', '… mı?', ['ve', 'belki', 'sonra'], 'Açık uç: sonucu okura bir soru bırakarak bitir.'],
  [9, '[A] kimliği bir hapishane olarak kurar', 'iken', '[B] onu bir yolculuğa dönüştürür.', ['ve', 'sonra', 'gibi'], '«… iken …» farkı tek cümlede kurar.'],
  [9, 'Her iki eserde de …', 'ancak', '…', ['ardından', 'örneğin', 'yani'], 'Önce benzerlik, sonra fark.'],
  [9, 'Buna', 'karşılık', '… / A’nın aksine B …', ['göre', 'rağmen', 'benzer'], 'Keskin fark.'],
  [9, '', 'Benzer biçimde', '…', ['Buna karşılık', 'Ardından', 'Sonuç olarak'], 'Benzerlik kuran bağlaç.'],
  [9, 'Bu fark, …', 'açığa çıkarır.', '', ['özetlenir.', 'hissettirilmiştir.', 'inceleyeceğim.'], 'Karşılaştırmadan yoruma geçiş.'],
  [4, 'To what extent → tez:', 'büyük ölçüde,', 'ancak …', ['kesinlikle,', 'hiçbir ölçüde,', 'bu denemede,'], '“Ne ölçüde” sorusu derece ister: hem cevap hem sınır.'],
  [16, '[Yazar], [kavram] aracılığıyla [ana çatışma]yı gösterir; bunu tema, karakter ve', 'yapı', 'üzerinden kurar.', ['özet', 'biyografi', 'alıntı'], 'Tek eserli sınavın tez kalıbı.'],
  [4, 'Present / portray →', '[Yazar] … ederek kurar', '', ['okura … hissettirilmiştir', 'bu denemede … inceleyeceğim', 'ardından … sonra …'], '“Present / portray” yazarın seçimlerini sorar.']
];

/* ---------- sırala: [bölüm, başlık, adımlar (doğru sırayla), açıklama] ---------- */
const P2_ORDER = [
  [6, 'Giriş · huni', ['Kavramı tanımla (eserleri anmadan)', 'Eserler: yazar, tür, dönem, tek cümle olay', 'Ana kavram: iki eserin ortak çatışması', 'Tez + harita'], 'Huni genişten dara iner: kavram → eserler → ana kavram → tez.'],
  [8, 'Bloğun içi · 4 halka', ['İddia: yazarın seçimini adlandır', 'Kanıt: kısa sahne, cümleye gömülü', 'Karşılaştırma: öbür uç, benzerlik + fark', 'Yorum: neden önemli?'], 'Avukat gibi: iddia, delil, ikinci delil, jüriye “neden önemli”.'],
  [7, 'Blok = sandviç', ['Üst ekmek: anahtar sözcük + A’daki anlam + B’deki anlam', 'İç: 4 halka', 'Alt ekmek: bloğun kanıtladığı yeni şey'], 'İki ekmekte anahtar sözcük; alt ekmek üstün kopyası değil.'],
  [5, 'Harita · 7 satır', ['Soru parçaları', 'Kavram tanımı', 'Tez (A ↔ B → fark ne gösterir)', 'Tema: A sahnesi ↔ B sahnesi', 'Karakter: A ↔ B', 'Teknik: A tekniği ↔ B tekniği', 'Açık uç sorusu'], 'Harita denemenin sırasını aynen izler: giriş, üç blok, sonuç.'],
  [12, '105 dakika', ['0–12 · soru seç, parçala, harita', '12–22 · giriş', '22–82 · 3 blok × ~20 dk', '82–92 · sonuç', '92–100 (+5) · kontrol'], 'Eşit süre = eşit derinlik.'],
  [11, 'Sonuç', ['Tezi yeni kelimelerle kur', 'Bağla: günümüz / edebî akım / toplumsal tartışma', 'Açık uç sorusu'], 'Stüdyo yorumu gibi: skor → ligdeki anlamı → akıldaki soru.'],
  [0, 'Her paragrafın omurgası', ['Ne yapıyor (yazarın seçimi)', 'İki uç (A / B)', 'Bu ne düşündürüyor (yorum)'], 'Notun en üstündeki cümle: her paragraf bu üç adımla yürür.'],
  [11, 'Stüdyo yorumu benzetmesi', ['Skor', 'Ligdeki anlamı', 'Akıldaki soru'], 'Sonucun üç adımının benzetmesi: tez, bağlam, açık uç.'],
  [8, 'Avukat benzetmesi', ['İddia', 'Delil', 'İkinci delil', 'Jüriye “neden önemli”'], 'İkinci delil, öbür uçtur: karşılaştırma halkası.'],
  [10, 'Blok boyutları', ['Tema / içerik', 'Karakter / ilişki', 'Teknik / biçim', 'Bağlam (isteğe bağlı)'], 'Hocanın şablonu; haritada 4–6. satırlar.'],
  [3, 'Soru seçimi', ['Her soru için 6 sahne testi (3 blok × 2 eser)', '2 dk’da 6 sahne yoksa öbür soruya geç', 'Seçtiğin sorunun her kavramının altını çiz', 'Her parçayı bir bloğa ver'], 'Tanıdık konu iyi soru demek değil; sahne sayısı karar verir.'],
  [10, 'Teknik bloğunun zinciri', ['Teknik: anlatıcı, bakış açısı, zaman, sembol, yapı', 'Farklı teknik = farklı okur etkisi', 'Edebî akıma bağla (realizm, modernizm)'], 'Teknik adı tek başına etiket avcılığıdır; etkiye ve akıma bağla.']
];

/* ---------- değerlendirici gözü: [bölüm, bağlam, öğrenci metni, doğru teşhis, [çeldiriciler], açıklama, düzeltme] ---------- */
const P2_EYE = [
  [14, '', 'Yazar bu sahnede okuyucuya hüzün hissettirmiştir.', 'B1 · etki var; hangi seçim, neden, hangi anlam yok', ['D · cümle edilgen çatıda', 'C · paragraf çok kısa', 'A · eserin adı verilmemiş'], 'Çatı sorun değil. Sorun yorumsuz etki: hüznü hangi yazar seçiminin kurduğu ve bunun neyi düşündürdüğü yok.', '«[Yazar] sahneyi kısa, yüklemsiz cümlelerle keserek kurar; bu da karakterin yasını dile getiremediğini düşündürür.»'],
  [15, 'Soru: Eserlerde olaylar ve karakterler bir değişimi nasıl yansıtır?', 'Denemenin üç bloğu da yalnızca karakterlerin değişimini inceliyor.', 'A · sorunun “olaylar” parçası atlanmış', ['D · terim kullanılmamış', 'B2 · karşılaştırma eksik', 'C · harita yazılmamış'], 'Sorunun her parçası bir blokta karşılık bulmalı. Atlanan parça A’dan doğrudan puan kaybettirir (Ders 3).', 'Haritaya “olaylar” için bir blok koy: A’nın dönüm sahnesi ↔ B’nin dönüm sahnesi → yorum kelimesi.'],
  [14, '', 'A eserine üç uzun paragraf ayrılmış; B eseri yalnızca son paragrafta iki cümleyle anılmış.', 'B2 ve C · iki esere eşit yer yok', ['A · tez yok', 'D · yazım hataları', 'B1 · kanıt yok'], 'Bir eser uzun, öbürü iki cümle → B2 ve C’den kayıp.', 'Her bloğu iki uçla kur: A’nın sahnesi, B’nin sahnesi, ardından «Bu fark, … açığa çıkarır.»'],
  [15, '', 'İyi insanlar her iki eserde de sonunda kaybeder. (Bloklar soruyu anmıyor; soru yalnız son paragrafta geçiyor.)', 'A · genelleme + odak yalnız sonda', ['D · cümle çok kısa', 'B2 · iki eser anılmış', 'C · paragraf sayısı az'], 'Ders 1: C ve D tam olsa da A düşer. Genelleme yerine somut ad, sahne, an; odak her blokta.', 'Anahtar sözcüğü her bloğun ilk ve son cümlesine koy; “iyi insanlar” yerine karakterin adını ve sahnesini ver.'],
  [14, '', 'Yazar bu bölümde metafor, tekrar ve sembol kullanmıştır.', 'B1 · etiket avcılığı: teknik adı var, anlam yok', ['D · akademik olmayan dil', 'A · eser yanlış anlaşılmış', 'C · harita yok'], 'Formülün 3 parçası: hangi teknik + hangi anlam + kalıp. Anlam parçası yoksa analiz değil.', '«[Yazar], kapı imgesini tekrar ederek kurar; bu da karakterin hiç geçemediği bir eşiği düşündürür.»'],
  [14, '', 'Ardından kahraman şehre gider, sonra eski evine döner ve en sonunda annesiyle konuşur.', 'B1 · kronolojik özet: iddia ve iki uç yok', ['D · bağlaçlar yanlış', 'C · olaylar yanlış sırada', 'A · olaylar yanlış aktarılmış'], '“Ardından … sonra …” kronolojik özettir. Yerine iddia + iki uç.', '«[Yazar] eve dönüşü döngüsel bir yapıyla kurar; [B]’de ise dönüş hiç gerçekleşmez. Bu fark, …»'],
  [15, '', 'Bu sahne okurda sempati yaratır. Bu diyalog da sempati yaratır. Son sahne de sempati yaratır.', 'B1 · sempatinin anlamı ve önemi yok', ['D · aynı sözcük tekrarlandığı için', 'C · paragraf düzeni bozuk', 'A · sahneler yanlış seçilmiş'], 'Ders 2. Tekrarın kendisi yasak değil; yasak olan yerinde sayan düşünce. Etki söylenip bırakılmış, anlamı ve önemi yok.', '«… sempati uyandırır; bu da okuru karakterin yanılgısına ortak eder ve suçun kimde olduğu sorusunu açar.»'],
  [6, 'Girişin ilk cümleleri:', 'Bu denemede iki eseri inceleyeceğim. Yazar İstanbul’da doğmuş, gençliğinde gazetecilik yapmıştır.', 'Girişe girmeyenler: “inceleyeceğim” ve biyografi', ['Giriş çok kısa, uzun özet eklenmeli', 'Hiçbir sorun yok', 'Tez ilk cümlede olmalı'], 'Girişe girmez: biyografi · “bu denemede inceleyeceğim” · uzun özet · “… her zaman önemlidir”. Huni kavramla başlar.', '«[Kavram], [tanım]dır.» ile başla; eserleri ancak 2. adımda an.'],
  [11, 'Sonuç paragrafından:', 'Son olarak, A eserinin beşinci bölümünde de bu durum görülür. Bu denemede iki eseri inceledim.', 'Sonuca girmeyenler: yeni kanıt ve “inceledim”', ['Sonuç çok kısa, uzatılmalı', 'Açık uç eksik ama başka sorun yok', 'Tezin aynısı eksik'], 'Sonuca girmez: yeni kanıt · “inceledim” · başlık tekrarı · olay özeti · tezin aynısı.', '«Birlikte okunduklarında iki eser, … gösterir. Bu, bugün … tartışmasına da ışık tutar. Sonuçta okur şu soruyla baş başa kalır: … mıdır, yoksa … mı?»'],
  [0, 'Tez cümlesi:', 'Her iki eser de çok önemli eserlerdir ve birçok benzerlik ve farklılık içerir.', 'A · tez değil: karşı çıkılabilir, karşılaştırmalı bir iddia yok', ['D · cümle uzun', 'C · harita tezden önce gelmeli', 'B1 · alıntı yok'], 'Tez tek cümlelik, karşı çıkılabilir bir iddiadır. “Önemli eserler” cümlesine kimse karşı çıkmaz.', '«[A], [seçim A] ile … görünür kılarken; [B], [seçim B] ile onu sorgular. Bu fark … açığa çıkarır.»'],
  [7, 'Bir bloğun ilk ve son cümlesi:', 'Üst: “Mekân, A’da tutsaklığı, B’de ise özgürlüğü anlatmak üzere kullanılmaktadır.” Alt: “Böylece mekân A’da tutsaklığı, B’de özgürlüğü anlatır.”', 'Alt ekmek üstün kopyası; yeni bir şey kanıtlanmamış', ['Üst ekmek edilgen olduğu için yanlış', 'Anahtar sözcük iki kez geçtiği için tekrar hatası', 'Blok kanıtla bitmeli, alt ekmek gereksiz'], 'Alt ≠ üst. Eşanlamlı kopya yine kopyadır; alt ekmek bloğun kanıtladığı yeni şeyi söyler.', '«Bu iki örnekte de görüldüğü üzere mekân, karakterlerin seçimlerini önceden belirleyen bir güce dönüşür.»'],
  [8, '', 'Belki yazar bunu bilerek yapmıştır, belki de yapmamıştır.', 'Boş “belki”: temkinli cesaret iki somut okuma ister', ['Hiçbir sorun yok, akademik bir temkin', 'D · “belki” sözcüğü yasak', 'C · cümle yanlış yerde'], 'Temkinli cesaret iki somut okumayı açık bırakır; boş “belki” hiçbir şey söylemez.', '«Ya [yazar] sessizliği bir direniş olarak kurar ya da karakterin yenilgisini gösterir.»'],
  [8, '', 'Paragraf yalnızca A eserindeki düğün sahnesini çözümlüyor; B eseri hiç anılmıyor.', 'B2 · karşılaştırma halkası yok, tezatlık görünmez', ['B1 · çözümleme yok', 'D · dil yanlış', 'A · sahne yanlış seçilmiş'], 'Tek sahne → karşılaştırma yok → tezatlık görünmez. Her blokta A → B → karşılaştırma → yorum.', 'B’den bir karşı sahne ekle ve «Buna karşılık …» ile bağla; ardından «Bu fark, … açığa çıkarır.»'],
  [2, '', 'Yazar burada süper bir şey yapmış, bence çok güzel olmuş.', 'D · akademik ton ve terim yok', ['A · eser anlaşılmamış', 'B2 · karşılaştırma yok', 'C · harita yok'], 'D: terim, akademik ton, boş tekrar yok. “Süper”, “çok güzel” değerlendirme değil, izlenimdir.', '«[Yazar], [teknik] aracılığıyla … kurar; bu da … düşündürür.»'],
  [4, 'Soru: To what extent … ?', 'Tez: Her iki eser de bunu tamamen gösterir.', '“Ne ölçüde” sorusuna mutlak cevap; tez derece vermeli', ['Hiçbir sorun yok', 'Tez çok uzun', 'Tezde yazar adı olmalı'], '“To what extent” bir derece ister: «büyük ölçüde, ancak …».', '«İki eser bunu büyük ölçüde gösterir, ancak [B] … noktasında ayrışır.»'],
  [14, '', 'Yazar geriye dönüş tekniğini kullanır. Böylece geçmiş anlatılır.', '“Nasıl” var, “neden” yok: yorum halkası eksik', ['Teknik yanlış adlandırılmış', 'Cümleler çok kısa', 'Edilgen çatı kullanılmış'], '“Nasıl” → arkasından hep “neden”. Geçmişin anlatılması bir etki değil, bir olgu; neyi düşündürdüğü yok.', '«… geriye dönüşlerle kurar; bu da karakterin geçmişten hiç çıkamadığını düşündürür.»']
];
