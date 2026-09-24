# AMO YÜKLEME FÖYÜ — DTNoT 0.3.4 (listelenmiş / public)

Bu dosya birebir kopyalanacak değerleri sırayla verir. Tahmin yok, hepsi hazır.
**Kararlar:** Lisans = *Tüm hakları saklı* · Destek e-postası = `dtnot@dijitalturk.com` ·
Dağıtım = *On this site* (herkese açık listeleme).

---

## 0) Elinde olması gereken dosyalar

| Ne | Dosya |
|---|---|
| Yüklenecek paket | `dist/dtnot-0.3.4.zip` (**Firefox** paketi — `-chrome.zip` DEĞİL) |
| Ekran görüntüleri (1280×800) | `dist/magaza-popup.png`, `dist/magaza-icerik.png`, `dist/magaza-panel.png` |

---

## 1) Akış (6 adım)

> ⚠️ **ÖNEMLİ 1 —** `dtnot@dijitalturk` kimliği AMO'da **zaten kayıtlı** (daha önce kendi kullanımın için
> yüklediğin sürümden). Bu yüzden "Submit a New Add-on" formu **"Duplicate extension ID detected"**
> hatası verir. Doğru yol: mevcut kaydın sayfasından **"Upload New Version"** (yeni sürüm yükle).
>
> ⚠️ **ÖNEMLİ 2 — Kanal değiştirme.** Kayıt şu an hem dış API'de (mağaza sayfası 404, aramada yok) hem de
> büyük olasılıkla dev-panelinde **"On your own" (unlisted)** kanalında görünüyor. Bu kanalda "onay"
> yalnızca *senin için imzalandı* demektir; mağazada **hiç** görünmez. Listelenmişe geçiş:
> **Upload New Version** sayfasında **"Where to Host Version"** başlığının altındaki
> **"Change"** bağlantısı → açılan **"How to Distribute this Version"** sayfasında **"On this site"** →
> *Continue* → sonra dosyayı yükle. (Radyo, yükleme formunda satır içi çıkmaz; hep bu "Change"
> bağlantısının arkasındadır — kod: `devhub/addons/submit/upload.html` → `devhub.submit.version.distribution`.)
> - **"Change" bağlantısı hiç görünmüyorsa** ve sayfa *"On your own is the only distribution method
>   available"* diyorsa: eklenti **"Invisible"** yapılmış ya da **listeleme reddedilmiş** (status=rejected)
>   demektir. Kod (`can_submit_listed_versions`) bu iki durumda listelenmiş sürümü kapatır; önce o durum
>   düzeltilmelidir.

1. `https://addons.mozilla.org/tr/developers/` → **Firefox Hesabı ile giriş yap**.
2. Sağ üstteki kullanıcı menüsü → **Uzantıları gönder veya yönet** → DTNoT satırı →
   **Upload New Version** (yeni sürüm yükle). *"Submit a New Add-on" formu KULLANILMAZ.*
3. **Where to Host Version** başlığı → **Change** → **"On this site"** seç → *Continue*.
4. **Upload**: `dtnot-0.3.4.zip` dosyasını seç. AMO otomatik doğrular; sürümü `0.3.4`,
   kimliği `dtnot@dijitalturk` olarak görür. (Doğrulama geçmiş olmalı: `web-ext lint` 0 hata/0 uyarı.)
5. Aşağıdaki §2 tablosundaki alanları doldur/yapıştır. İnceleyici notları ve sürüm notları §3–§4.
6. **Submit version** → Mozilla incelemesi başlar. Onaylanınca mağaza sayfası yayına girer.

> İnceleme genelde otomatik doğrulama + insan incelemesi; sıra 1–3 gün sürebilir.
> Reddedilirse AMO gerekçe yazar ve düzeltip yeniden yükleyebiliriz.

---

## 2) Listeleme alanları (kopyala-yapıştır)

**Ad (Name)**
```
DTNoT — Sayfalara not bırak
```

**Özet (Summary, ≤250)**
```
Gezindiğin sayfalara not bırak: post-it, banner, footer veya köşe etiketi. Notlar yalnız senin tarayıcında kalır.
```

**Açıklama (Description)**
```
DTNoT, web sayfalarına hızlıca not bırakmanı sağlar. Bir sayfaya döndüğünde notun tam bıraktığın yerde karşına çıkar.

• Dört görünüm: sürüklenebilir POST-IT, sayfa tepesinde BANNER, altta FOOTER, sağ alt köşede çapraz ETİKET.
• Sayfa başına sınırsız not; her notu site geneli işaretleyip sitenin tüm sayfalarında gösterebilirsin.
• 6 renk ve anında düzenleme: her notun ✎ menüsünden yerinde düzenle veya sil.
• Notlar üst üste binmez: yeni not mevcudun sağına, banner/footer'da altına, etikette üstüne oturur.
• Sürükle-bırak: post-it'leri sayfada istediğin yere taşı, konum hatırlanır.
• "Notlarım" ekranı: siteye göre gruplu liste, arama, renk filtresi, sayfayı açma, JSON yedekleme.
• Türkçe ve İngilizce arayüz, koyu/açık tema.

GİZLİLİK: Hesap yok, sunucu yok, ağ isteği yok. Notların yalnız kendi bilgisayarında, tarayıcı deposunda tutulur; hiçbir yere gönderilmez.
```

**Kategori (Category)**
```
Productivity
```

**Lisans (License)**
```
All Rights Reserved  (Tüm hakları saklı)
```

**Destek e-postası (Support email)**
```
dtnot@dijitalturk.com
```

**Destek sitesi (Support site)**
```
https://dijitalturk.com
```

**Gizlilik politikası (Privacy policy)**
```
DTNoT hiçbir veri toplamaz, saklamaz veya iletmez. Hesap, sunucu ve ağ isteği yoktur. Notlar ve ayarlar yalnız kullanıcının kendi tarayıcı deposunda tutulur. Eklenti yalnız sayfaya not çizer; sayfa içeriğini okumaz veya hiçbir yere göndermez.
```

**Ekran görüntüleri (Screenshots)** — sırayla yükle:
```
dist/magaza-popup.png      → "Sayfalara not bırak — post-it, banner, footer, etiket"
dist/magaza-icerik.png     → "Notlar sayfada seni bekler — sürüklenebilir post-it ve şeritler"
dist/magaza-panel.png      → "Notlarım — siteye göre gruplu liste, arama, renk filtresi"
```

---

## 3) Sürüm notları (Release notes — 0.3.3)

```
Açıklama metni güncellendi: dört görünüm (post-it, banner, footer, etiket) + sayfa başına sınırsız not anlatımı.

Notlar artık birbirinin üzerine binmiyor ve her görünümde düzenle/sil çalışıyor.

• Sayfa başına SINIRSIZ not: her not kimlik taşır; bir sayfaya istediğin kadar not bırakabilirsin (eski kayıtlar okunurken taşınır, veri kaybı olmaz).
• Dört görünüm: post-it (sürüklenebilir), banner (sayfa tepesi), footer (sayfa altı), etiket (sağ alt köşede 45° çapraz durak).
• Site geneli artık her görünümde işaretlenebilir.
• Her notta ✎ menüsü: yerinde düzenle (metin + renk + görünüm + site geneli) veya sil.
• Çakışma önleme: yeni post-it mevcudun sağına, banner/footer'da yeni not altına, etikette üstüne; sürükleyip bıraktığında not başka bir notun üstüne binmez.
• Popup'ta "Not ekle" düğmesi not listesinin üstünde; sayfada not yoksa uyarı gösterilir.
• Post-it'lerin sağ altında küçük DijitalTurk.com bağlantısı.
• Türkçe/İngilizce arayüz, koyu/açık tema.
```

---

## 4) İnceleyici notları (Notes to Reviewer)

```
Merhaba,

DTNoT tamamen yerel çalışan bir not eklentisidir: hesap, sunucu, giriş ve AĞ İSTEĞİ YOKTUR. Bu nedenle inceleme için test hesabı veya özel ağ erişimi gerekmez.

Denemek için:
1) Eklenti popup'ını aç, "İzin ver" düğmesine bas — isteğe bağlı host izni (`optional_host_permissions`) ÇALIŞMA ZAMANINDA istenir; kurulumda geniş izin istenmez.
2) Herhangi bir sayfada popup'tan "Not ekle" → metni yaz, görünüm seç (post-it / banner / footer / etiket), istersen "site geneli" işaretle, Kaydet.
3) Not sayfa üzerinde görünür; ✎ menüsünden düzenle/sil, × ile geçici gizle.
4) "Notlarım" ekranında siteye göre gruplu liste, arama ve renk filtresi vardır.

Teknik notlar:
- İçerik betiği klasik betiktir (top-level import yok); `activeTab` izni sayesinde izin verilmese de not kaydedilebilir.
- Arka plan Firefox'ta `background.scripts` ile tanımlıdır (Chrome paketinde `service_worker`).
- İçerik betiği yalnız DOM'a not çizer; sayfa içeriğini okumaz veya iletmez.
- Minify/bundle/eval yoktur (paket doğrudan kaynaktır). Depo anahtarları sabittir: web-not-store / web-not-settings.
- Kaynak kodu gönderimi gerekmez. Depodaki manifest.json ile paketteki manifest.json arasındaki TEK fark: Firefox paketinde background.service_worker anahtarı çıkarılmıştır (Firefox bu anahtarı yok sayar); JS/CSS/HTML dosyaları depodakiyle birebir aynıdır (bkz. build.py).
- Not: Ürün sayfasındaki ekran görüntüleri, AMO'nun resim bloğu yalnız onaylanmış bir sürüm yayına girdiğinde göründüğü için onay sonrası eklenecektir.
```

---

## 5) Yüklemeden sonra

- AMO "My Add-ons" sayfasında durum: *Awaiting review* → *Approved*.
- Onaylanınca mağaza adresi şu kalıpta olur: `https://addons.mozilla.org/tr/firefox/addon/<slug>/`
  (slug büyük olasılıkla `dtnot`).
- Sonraki sürümlerde aynı **Upload** akışı; sürüm numarasını artır (`0.3.3`, `0.4.0`…).
- Chrome ve Edge'e yüklemek istediğinde: `dist/dtnot-0.3.3-chrome.zip` kullanılır (aynı metinler,
  aynı ekran görüntüleri).

> ⚠️ `dtnot@dijitalturk.com` adresinin gerçekten e-posta aldığından emin ol — AMO adresi
> doğrulamaz ama kullanıcılar bu adrese yazabilir. Almıyorsa ya bir yönlendirme kur ya da
> destek alanına yalnız siteyi bırak.
