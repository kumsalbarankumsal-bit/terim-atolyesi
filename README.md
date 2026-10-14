# Terim Atölyesi

IB Türkçe A HL Paper 1 ve Paper 2 için 364 analiz terimini öğreten çalışma uygulaması. 19 alan, 33 sık karıştırılan terim çifti.

Çalışma yolları: aralıklı tekrar (1 gün → 3 gün → 1 hafta → 2 hafta → 1 ay), keşif kartları, hızlı kartlar, sınav modu, karıştırılanlar, serbest pratik, zorlu terimler. Sesli okuma, yazı boyutu, geniş satır aralığı, yüksek kontrast, hareket azaltma ve klavye kısayolları var.

## Yapı

Derleme adımı yok; düz statik site.

```
index.html             sayfa iskeleti
styles.css             tasarım sistemi (açık ve koyu tema)
js/data.js             364 terim [alan, terim, İngilizce, anlam, örnek] + karıştırılan çiftler
js/app.js              ekranlar, aralıklı tekrar, soru üretimi, ayarlar
manifest.webmanifest   uygulama olarak kurulum bilgileri
sw.js                  çevrimdışı çalışma için önbellek
icons/                 uygulama simgeleri
```

İlerleme tarayıcının `localStorage`'ında (`terim-atolyesi-v1`) tutulur; her cihaz ve tarayıcı kendi ilerlemesini saklar.

## Vercel

Framework preset: **Other**, build komutu yok, output directory: kök (`.`).

## Cihaza kurma

Site açıkken Chrome'da üst çubuktaki **Uygulamayı kur** düğmesine ya da Chrome menüsündeki **Uygulamayı yükle / Ana ekrana ekle** seçeneğine dokun. Kurulduktan sonra internet olmadan da açılır.
