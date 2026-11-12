# Terim Atölyesi

IB Türkçe A HL Paper 1 ve Paper 2 için 364 analiz terimini öğreten çalışma uygulaması. 19 alan ("boya"), 33 sık karıştırılan terim çifti ve atölye için yazılmış 48 kısa yakın okuma metni içerir.

Uygulama bir ebru atölyesi gibi kurgulandı. Açılış ekranındaki tekne gerçek bir ebru simülasyonudur: boya damlaları birbirini iterek yayılır, tarak ve bız geçişleri desen çizer. Tekneye dokunarak damla bırakabilir, sürükleyerek bızla desen çekebilirsin. Renk paleti günün saatine göre (şafak, gündüz, ikindi, gece) değişir. Her alan bir boya kavanozudur: terimleri öğrendikçe kavanoz dolar. XP ile dokuz ebru tekniği açılır (Battal'dan Üstat işine) ve her seviyede yeni bir kâğıt koleksiyona eklenir.

## Çalışma yolları

Ana sayfada **Bugün tezgâhta** paneli vadesi gelen tekrarları, sıradaki keşfi, zorlu terimleri ve yarım kalan maratonu gösterir.

- **Keşif**: yeni terimle tanışma kartı. "Zaten biliyorum" diyorsan tek soruyla kanıtlarsın; beş terimde bir kısa kontrol gelir.
- **Tekrar**: aralıklı tekrar (1 gün → 3 gün → 1 hafta → 2 hafta → 1 ay). Soru türü terimin basamağına göre zorlaşır: tanıma, seçme, örnekte bulma, sonunda yazma.

**Stüdyo**'da 18 mod var. Her biri herhangi bir sette çalışır (bütün terimler, bir boya, vadesi gelenler, zorlular, yıldızlılar, notlular, yeniler):

| Grup | Modlar |
|---|---|
| Tanış | Kartlar (çevir, kaydır), Öğren (tanı → seç → yaz), Anlat (kendi sözlerinle) |
| Hatırla ve üret | Yaz, Harf harf, Tanım tamamla |
| Metinde gör | Örnekte bul, Yakın okuma, Cümle kur (kanıt → teknik → etki), İkiz terimler |
| Oyunlar | Eşleştir (süreli), Hafıza (ebru kartları), Şimşek (60 sn), Ebru yağmuru, Raflara diz |
| Sına ve kalıcı yap | Test (geri bildirimsiz), Maraton (bir alanı baştan sona), Bağ kur (kendi notun) |

Sözlük'te arama, durum ve boya filtreleri, yıldız, kişisel not ve sesli okuma bulunur.

## Paper 2 sekmesi

Paper 2 yöntem notunun (16 bölüm) tamamı ve sınavın yapısı ayrı bir sekmede. Esere özgü içerik yok; yalnızca IBDP boyunca kullanılacak genel kurallar ve kalıplar.

- **Sınavın yapısı:** 1 sa 45 dk, 4 genel sorudan 1, iki eser, kitap yok, HL'de %25, yasak eserler. Puanlama: Mayıs 2026'dan beri 25 puan (A, B1, B2, C, D; her biri 5), eski 30 puanlık düzenle karşılaştırmalı.
- **Denemenin yapısı:** 105 dakikalık zaman çizelgesi üzerinde plan, giriş (huni), üç blok (sandviç + 4 halka), sonuç (ters huni) ve kontrol. Her parçaya dokununca notun ilgili bölümü açılır.
- **Not defteri:** 16 bölüm, dört başlık altında (Temel, Plan, Yazım, Sınav günü). Kalıp cümleler mavi italik, kaçınılacaklar kırmızı. Kalıp defteri ve günlük kontrol listesi.
- **7 çalışma yolu:** Not kartları, Yöntem testi (89 soru, her biri iki ipuçlu), Sırala (12 sıralı yapı), Kalıbı tamamla (18 kalıp), Değerlendirici gözü (16 zayıf örnek ve daha iyisi), Eşleştir, Prova saati (105 dakikalık deneme provası; aşama değişince ses ve titreşim, ekran açık kalır).

Not satırları ve sorular kendi aralıklı tekrar kaydını tutar; vadesi gelenler ana sayfada ve sekmenin rozetinde görünür.

## Okuma rahatlığı

Ayarlar: yazı boyutu (kaydırıcı), geniş satır aralığı, yüksek kontrast, açık/koyu/saate göre tema, hareket (tam, sade, kapalı), açılış animasyonu, ses ve titreşim, otomatik ilerleme, sesli okuma ve hızı, günlük XP hedefi. Yazı tipleri: Atkinson Hyperlegible Next (gövde) ve Fraunces (başlıklar). İşletim sisteminde "hareketi azalt" açıksa animasyonlar kendiliğinden sadeleşir.

## Yapı

Derleme adımı yok; düz statik site.

```
index.html             sayfa iskeleti, SVG simgeleri
styles.css             tasarım sistemi, bütün animasyonlar
js/data.js             364 terim [alan, terim, İngilizce, anlam, örnek] + karıştırılan çiftler
js/passages.js         yakın okuma metinleri [terim, metin, kanıt, teknik, etki, özet tuzağı, çeldiriciler]
js/core.js             veri modeli, kayıt, aralıklı tekrar, XP ve seviyeler, soru üretimi, ses
js/ebru.js             ebru motoru (damla, tarak, bız, sarmal), canlı tekne, açılış, parçacıklar
js/ui.js               ana sayfa, boyalar, sözlük, terim sayfası, ayarlar, keşif ve tekrar oturumları
js/studio.js           Stüdyo ve 18 çalışma modu
js/p2data.js           Paper 2 yöntem notu, soru bankası ve alıştırma verisi
js/paper2.js           Paper 2 sekmesi ve 7 çalışma yolu
manifest.webmanifest   uygulama olarak kurulum bilgileri
sw.js                  çevrimdışı çalışma için önbellek
icons/                 uygulama simgeleri (ebru motoruyla üretildi)
```

İlerleme tarayıcının `localStorage`'ında (`terim-atolyesi-v2`) tutulur. Önceki sürümün kaydı (`terim-atolyesi-v1`) ilk açılışta otomatik taşınır. Ayarlar'dan yedek indirip başka cihaza yükleyebilirsin.

Ebru motoru, Aubrey Jaffer'in "Mathematical Marbling" çalışmasındaki dönüşümlere dayanır: damla için P' = C + (P − C)·√(1 + r²/|P − C|²), tarak ve bız için z·λ/(d + λ) ve sarmal için açısal kaydırma.

## Vercel

Framework preset: **Other**, build komutu yok, output directory: kök (`.`).

## Cihaza kurma

Site açıkken Chrome'da üst çubuktaki **Uygulamayı kur** düğmesine ya da Chrome menüsündeki **Uygulamayı yükle / Ana ekrana ekle** seçeneğine dokun. Kurulduktan sonra internet olmadan da açılır. Uygulama simgesine basılı tutunca **Tekrar**, **Stüdyo** ve **Paper 2** kısayolları çıkar.
