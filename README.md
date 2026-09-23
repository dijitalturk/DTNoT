# DTNoT — sayfalara not bırakma eklentisi

Sayfalara not bırak: **post-it** (sürüklenebilir), **banner**, **footer** ve **köşe etiketi**.
Sayfa başına sınırsız not, site geneli işaretleme, yerinde düzenleme. Notlar yalnız tarayıcıda
tutulur — hesap, sunucu, anahtar gerekmez.

**Yığın:** saf JavaScript (derleme adımı YOK) · Manifest V3 · Firefox + Chrome.
UX, kardeş proje **DTAI Tool**'un tasarım sistemi üzerine kuruldu (tek tip bileşenler, satır listesi,
TR/EN bayraklı dil değişimi, ayrı panel ve ayarlar sayfaları).

> **Kaynak:** `web-note-extension` (React 18 + TypeScript + Vite + `@crxjs`) taslağından portlandı.
> Gerekçe ve ölçümler: `docs/INCELEME-2026-09-21.md`. Taslağın kopyası `gelen-kaynak/` altında duruyor.

## Kurulum

| Tarayıcı | Yol |
|---|---|
| **Firefox / Zen** | `about:debugging#/runtime/this-firefox` → **Geçici Eklenti Yükle** → `dist/dtnot-0.3.3.zip` |
| **Chrome / Edge** | `chrome://extensions` → **Geliştirici modu** → **Paketlenmemiş öğe yükle** → `dist/chrome-unpacked/` (ya da zip'i çıkartıp aynı yoldan) |

İlk kurulumda eklenti **geniş izin istemez**: notlar `activeTab` ile hemen çalışır; sayfa üstünde
post-it çizmek için popup'taki **"İzin ver"** düğmesiyle site erişimi verilir.

## Geliştirme

Derleme adımı yok — dosyayı düzenle, eklentiyi yenile:

```bash
node tests/dtnot-test.mjs   # 111 test: depo mantığı · i18n · mesajlaşma deseni · manifest · renk/görünüm/konum · sayfa görünümü · popup · tema
python3 build.py            # paketle: Firefox .zip/.xpi + Chrome -chrome.zip + chrome-unpacked/
python3 ikon-uret.py        # ikon setini yeniden üret (16/32/48/96/128)
```

Dosya düzeni:

| Dosya | Görevi |
|---|---|
| `assets/store.js` | **Tek kaynak**: normalizeUrl, doğrulama, not/ayar CRUD, JSON yedekleme |
| `assets/i18n.js` | TR/EN sözlüğü + dil değişimi + bayrak düğmeleri |
| `assets/ui.css` | Tek tasarım sistemi (popup · panel · ayarlar) + koyu/açık tema |
| `assets/tema.js` | Tema: `db-acik` sınıfını uygular, popup ve Ayarlar aynı seçiciyi buradan kurar |
| `background.js` | İçerik betiği kaydı (izne bağlı), sağ tık menüsü, **tüm depo işlemleri** |
| `content.js` | Sayfa içi post-it (Shadow DOM); notu **mesajla** arka plandan ister |
| `popup.*` | Aktif sayfanın notu + hızlı ekleme + izin/panel + **popup içi Ayarlar** (options ile aynı katlanır bölümler) |
| `panel.*` | Notlarım: site grupları, arama, satır içi düzenle/sil/sayfayı aç |
| `options.*` | Gizleme süresi, tema, panel davranışı, **JSON dışa/içe aktarma** |
| `_locales/tr|en` | Mağaza adı/açıklaması (`__MSG_…__`), `default_locale` |
| `tests/dtnot-test.mjs` | Testler (npm bağımlılığı yok) |
| `build.py` · `ikon-uret.py` | Paketleme · ikon üretimi |

## Mimari kararlar

- **Depo tek kaynak, arayüz mesajla sorar.** İçerik betiği runtime'da kaydedildiği için klasik betiktir
  (top-level `import` kullanamaz); bu yüzden `normalizeUrl` kopyası **yoktur** — not verisi arka plandan
  `NOT_AL` / `NOT_GÜNCELLE` mesajlarıyla alınır. Test bunu kilitler.
- **Mesajlaşma iki tarayıcıda çalışır:** yanıt `sendResponse` ile verilir + `return true` (Chrome,
  dinleyiciden Promise dönüşünü desteklemez; Firefox ikisini de kabul eder).
- **Arka plan iki anahtarla tanımlı:** `background.scripts` (Firefox event page) **ve**
  `background.service_worker` (Chrome). Yalnız `service_worker` yazılırsa Firefox eklentiyi **kurmayı
  reddeder** (`service_worker is currently disabled. Add background.scripts.` — ölçüldü, bkz. inceleme raporu).
- **İzin modeli:** `optional_host_permissions` + runtime `registerContentScripts` → kurulumda geniş izin
  istenmez; `activeTab` sayesinde izin verilmese de **not kaydedilebilir**.
- **Post-it Shadow DOM** içinde çizilir → sayfanın CSS'i ile çakışmaz.
- **JSON içe/dışa aktarma ayarlar sayfasında**: popup kapanınca dosya seçici iptal olabilir.
- **Depo anahtarları sabit:** `web-not-store` / `web-not-settings` (mevcut veri korunur).

## Gizlilik

- Hiçbir ağ isteği yok; notlar `chrome.storage.local`'da kalır, hiçbir yere gönderilmez.
- Manifest veri beyanı: `data_collection_permissions.required = ["none"]` (doğru beyan).
- İçerik betiği yalnız DOM'a post-it çizer; sayfa içeriğini hiçbir yere iletmez.

## 0.2.1 — arayüz ince ayarları

- **Seçili renk artık net belli:** çift halka + ortasında **✓** işareti + %16 büyüme; yanında
  "Seçili renk: Mavi" etiketi (popup ve panelde aynı).
- **Banner siteyi aşağı ittiriyor:** duyuru şeridi sitenin header'ının üstüne binmiyor; sayfa banner
  yüksekliği kadar aşağı kaydırılıyor (yükseklik `ResizeObserver` ile izlenir), banner kapanınca sayfa
  eski hâline dönüyor.
- **Popup'ta TR/EN bayrakları yan yana** (eski durumda `#diller` sıkışıp bayraklar alt satıra kayıyordu).
- **"Notlarım" açılınca popup kapanıyor** (arkada boş durmuyor); **Ayarlar ise popup'ın içinde** açılır.
- **Popup altına DijitalTurk.com bağlantısı** (küre ikonu ile) eklendi; popup genişliği **448 px**.
- **Metinler güncellendi:** Hakkında → gizlilik vurgusu ("hiçbir veriniz dışarı sızdırılmaz, tüm
  notlarınız kişisel bilgisayarınızda kalır"), "Gizle" süresi → "Notu kapattığınızda belirlediğiniz süre
  boyunca notunuz görünmez olur", "Yalnız aktif site" → "Notlarım ekranındayken… otomatik olarak
  filtreleyip gösterir".
- **86 test** · Chrome ve Firefox'ta ölçüldü.

## 0.3.0 — sınırsız not · dört görünüm · yerinde düzenleme

- **Sayfa başına SINIRSIZ not.** Her not artık bir **kimlik** (`id`) taşır; eskiden bir sayfada tek not
  olabiliyordu (anahtar = host+yol tekildi). Depo şeması **v2**; eski kayıtlar okunurken sessizce taşınır
  (`id = 'k:' + anahtar`, `gorunum = banner ? 'banner' : 'postit'`) — **veri kaybı yok**.
- **Dört görünüm seçimi:** not eklerken/düzenlerken **Post-it · Banner · Footer · Etiket**.
  - *Post-it:* sürüklenebilir kart (konum pencere oranı olarak saklanır).
  - *Banner:* sayfanın en tepesinde şerit; sayfayı aşağı ittirir (header'ın üstüne binmez).
  - *Footer:* sayfanın en altında şerit; sayfanın altına boşluk eklenir (içeriği örtmez).
  - *Etiket:* **sağ alt köşede çapraz durak** — bir ucu alt kenara, bir ucu sağ kenara dayalı 45° şerit.
- **Her not site geneli işaretlenebilir** — artık banner'a bağlı değil; post-it/footer/etiket de
  işaretlenince o sitenin tüm sayfalarında görünür.
- **✎ düğmesi ×'in yanında:** her notta menü açılır → **Düzenle** (metin + renk + görünüm + site geneli,
  yerinde) / **Sil**.
- **Post-it'lerin sağ altında küçük `DijitalTurk.com` bağlantısı** (yeni sekmede açılır).
- **Banner · footer · etiket yazıları ORTALANIR:** ✎ / × düğmeleri şeridin sağ ucunda mutlak konumdadır,
  metin şeridin tam ortasında durur (ölçüldü: merkez sapması 0 px).
- **Popup düzeni düzeltildi:** "Not ekle" düğmesi artık **not listesinin üstünde**; sayfada not yoksa
  **"Bu sayfada not yok."** uyarısı görünür; bu sayfadaki notlar kart listesi olarak (renk · görünüm ·
  site geneli rozeti · Düzenle/Sil) altında listelenir.
- **Notlarım paneli:** satır rozetinde görünüm + `SİTE` etiketi; satır içi düzenleme görünüm seçici sunar.
- **Ölçüm:** 105/105 test · Chrome (uçtan uca: SW + 4 not + site geneli + güncelle/sil) ·
  sayfa katmanı gerçek Chromium'da (2 post-it · banner · footer · etiket · ✎ menüsü · yerinde düzenleyici) ·
  popup (not ekle üstte · 3 kart · boş durum uyarısı) · panel (gruplar · rozetler · düzenleme formu).
- Paket: `dist/dtnot-0.3.0.{zip,xpi}` + `-chrome.zip` · 20 dosya.

## Ayarlar / tema güncellemeleri (0.2.1)

- **Ayarlar popup İÇİNDE açılıyor** (sekme açılmıyor, popup kapanmıyor) ve **options.html ile aynı
  katlanır bölümleri** gösterir: **Davranış** (gizleme süresi · "Yalnız aktif site" · tema seçici) ·
  **Veri** · **Hakkında** — varsayılanlar da aynı (Davranış ve Hakkında açık, Veri kapalı).
- **Ayarlar açıkken popup'ın not görünümü gizlenir:** not ekleme kutusu, not listesi ve not işlemleri
  Ayarlar'da **görünmez** — onların yeri **Notlarım** ekranıdır (`panel.html` / `panel.js`).
- **✕ kapatma düğmesi kaldırıldı:** Ayarlar yine ⚙ düğmesiyle açılıp kapanır (⚙ açıkken "etkin"
  görünür, `aria-pressed` durumu korunur).
- **Ayarlar'ın EN ALTINDA "Sayfada göster" linki:** tam ayar sayfasını **yeni sekmede** açar
  (`runtime.openOptionsPage()`; desteklenmezse `tabs.create({ url: runtime.getURL('options.html') })`).
  Karmaşık veri yönetimi (JSON geri yükleme) bilinçli olarak tam sayfada kaldı — dosya seçici popup
  kapanınca iptal olabilir; popup'ın Veri bölümünde **"JSON indir"** ve tam sayfa ipucu bulunur.
- **Popup üst bar ikonları** (Notlarım ≡ · Ayarlar ⚙) bayrak düğmeleriyle **aynı ölçüde** (34×30 +
  `flex: none`); Ayarlar popup içinde açıkken ⚙ "etkin" görünür.
- **Ayarlar'daki dil seçimi kaldırıldı**: "Dil" katlanır bölümü, başlıktaki `TR/EN` özeti ve üst bardaki
  bayraklar çıktı. Dil, popup/panel üst barındaki bayraklarla değişir; `assets/i18n.js` ve `_locales`
  altyapısı aynen durur.
- **Ayarlar'da "Hakkında" bölümü varsayılan AÇIK** (Davranış açık, Veri kapalı kalır).
- **Tema (Koyu / Açık) seçimi:** `ayar.tema` (`koyu` varsayılan; bozuk değer koyuya düşer) ve kök elemanda
  `db-acik` sınıfı. Popup ve Ayarlar **aynı** seçiciyi `assets/tema.js` üzerinden kurar; seçim anında
  uygulanır. Açık temada başlık/bağlantı/rozet metinleri için okunurluk karşılıkları `ui.css`'e eklendi.
  **Kapsam yalnız DTNoT yüzeyleri**: sayfaya çizilen post-it/banner gölge DOM'u tema dışıdır (palet VERİ).

## 0.2.0 — yeni özellikler

- **6 renkli post-it:** not eklerken/düzenlerken renk seçimi (sarı · yeşil · mavi · pembe · mor · turuncu).
  Not tipine tek alan (`renk`) eklendi → eski kayıtlar varsayılana düşer, **şema bozulmaz**.
  Palet tek kaynakta (`assets/store.js → PALET`); post-it, banner, seçici ve listedeki nokta aynı yerden beslenir.
- **Renk filtresi:** panelde "Tümü + 6 renk" düğmeleri; arama + renk + site filtreleri birlikte çalışır.
- **Banner modu:** düzenleme ekranında "Banner olarak göster" kutusu → not, sayfanın en tepesinde duyuru şeridi
  olarak görünür (post-it yerine geçer). Bu kutu açılınca **"Site geneli"** kutusu etkinleşir: seçilirse not
  o sitenin **tüm sayfalarında** görünür (tam sayfa bannerı site genelinden önce gelir).
- **Sürükle-bırak:** post-it'i başlığından tutup sayfada istenen yere taşıyabilirsin; konum **pencere oranı**
  olarak saklanır, pencere boyutu değişse de yer korunur.
- **Anında görünüm:** not kaydedildiği anda içerik betiği yoksa sayfaya enjekte edilir ve post-it/banner
  **sayfa yenilenmeden** görünür.
- **Uzun link kısaltma:** popup ve panelde adresler ortadan kısaltılır (`…`), tam hâli `title`'da.
- **Popup genişletildi** (336 → 404 px), başlıktaki ≡/⚙ düğmeleri büyütüldü (28 → 38 px).
- **Tailwind-esinli yardımcı katman:** `assets/ui.css` içinde Tailwind isim/ölçeğiyle yardımcı sınıflar
  (`flex`, `gap-2`, `p-3`, `text-sm`, `rounded-xl`, `truncate`, `text-muted`…). Derleme adımı olmadığı için
  Tailwind'in kendisi kullanılmıyor; bileşenler bu katmanla kuruluyor.
- **Ayarlar sürüm satırı düzeltildi** (`Sürüm: {0}` görünüyordu).
- **Arama iyileştirmesi:** `İkinci` / `ikinci` / `IKINCI` artık eşleşir (Türkçe İ/I + aksan duyarsız katlama).

## 0.1.0 — gelen taslaktan farklar

- React + TypeScript + Vite + `@crxjs` **kaldırıldı** → saf JS, derleme adımı yok (bundle 159 KB → 50 KB)
- Firefox'a **kurulamama** hatası giderildi (çift arka plan anahtarı)
- İzin verilmeden **not eklenememesi** giderildi (`activeTab`)
- İçerik betiği esbuild adımı gerektirmiyor; `normalizeUrl` kopyası yok (mesajlaşma mimarisi)
- "Sayfayı aç" http ile kaydedilen notu doğru adrese götürür (şema saklanır)
- Menüden "not ekle" akışı bağlandı (tek seferlik anahtar), `openPopup` düşüşü eklendi
- TR/EN arayüz + `_locales` mağaza yerelleştirmesi · yeni DTNoT ikon seti · 37 test
- Tespit edilen iki hata düzeltildi: `all: unset` yüzünden `[hidden]` çalışmaması · aramada TR İ eşleşmesi
