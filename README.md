# DTNoT — sayfalara not bırakma eklentisi

Gezindiğin web sayfalarına not bırak; aynı sayfaya döndüğünde notun **sol altta post-it** olarak
karşına çıkar. Notlar yalnız tarayıcıda tutulur — hesap, sunucu, anahtar gerekmez.

**Yığın:** saf JavaScript (derleme adımı YOK) · Manifest V3 · Firefox + Chrome.
UX, kardeş proje **DTAI Tool**'un tasarım sistemi üzerine kuruldu (tek tip bileşenler, satır listesi,
TR/EN bayraklı dil değişimi, ayrı panel ve ayarlar sayfaları).

> **Kaynak:** `web-note-extension` (React 18 + TypeScript + Vite + `@crxjs`) taslağından portlandı.
> Gerekçe ve ölçümler: `docs/INCELEME-2026-09-21.md`. Taslağın kopyası `gelen-kaynak/` altında duruyor.

## Kurulum

| Tarayıcı | Yol |
|---|---|
| **Firefox / Zen** | `about:debugging#/runtime/this-firefox` → **Geçici Eklenti Yükle** → `dist/dtnot-0.1.0.zip` |
| **Chrome / Edge** | `chrome://extensions` → **Geliştirici modu** → **Paketlenmemiş öğe yükle** → `dist/chrome-unpacked/` (ya da zip'i çıkartıp aynı yoldan) |

İlk kurulumda eklenti **geniş izin istemez**: notlar `activeTab` ile hemen çalışır; sayfa üstünde
post-it çizmek için popup'taki **"İzin ver"** düğmesiyle site erişimi verilir.

## Geliştirme

Derleme adımı yok — dosyayı düzenle, eklentiyi yenile:

```bash
node tests/dtnot-test.mjs   # 37 test: depo mantığı · i18n bütünlüğü · mesajlaşma deseni · manifest kilidi
python3 build.py            # paketle: Firefox .zip/.xpi + Chrome -chrome.zip + chrome-unpacked/
python3 ikon-uret.py        # ikon setini yeniden üret (16/32/48/96/128)
```

Dosya düzeni:

| Dosya | Görevi |
|---|---|
| `assets/store.js` | **Tek kaynak**: normalizeUrl, doğrulama, not/ayar CRUD, JSON yedekleme |
| `assets/i18n.js` | TR/EN sözlüğü + dil değişimi + bayrak düğmeleri |
| `assets/ui.css` | Tek tasarım sistemi (popup · panel · ayarlar) |
| `background.js` | İçerik betiği kaydı (izne bağlı), sağ tık menüsü, **tüm depo işlemleri** |
| `content.js` | Sayfa içi post-it (Shadow DOM); notu **mesajla** arka plandan ister |
| `popup.*` | Aktif sayfanın notu + hızlı ekleme + izin/panel/ayarlar |
| `panel.*` | Notlarım: site grupları, arama, satır içi düzenle/sil/sayfayı aç |
| `options.*` | Dil, gizleme süresi, panel davranışı, **JSON dışa/içe aktarma** |
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

## 0.1.0 — gelen taslaktan farklar

- React + TypeScript + Vite + `@crxjs` **kaldırıldı** → saf JS, derleme adımı yok (bundle 159 KB → 50 KB)
- Firefox'a **kurulamama** hatası giderildi (çift arka plan anahtarı)
- İzin verilmeden **not eklenememesi** giderildi (`activeTab`)
- İçerik betiği esbuild adımı gerektirmiyor; `normalizeUrl` kopyası yok (mesajlaşma mimarisi)
- "Sayfayı aç" http ile kaydedilen notu doğru adrese götürür (şema saklanır)
- Menüden "not ekle" akışı bağlandı (tek seferlik anahtar), `openPopup` düşüşü eklendi
- TR/EN arayüz + `_locales` mağaza yerelleştirmesi · yeni DTNoT ikon seti · 37 test
- Tespit edilen iki hata düzeltildi: `all: unset` yüzünden `[hidden]` çalışmaması · aramada TR İ eşleşmesi
