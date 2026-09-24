# CHROME WEB STORE YÜKLEME FÖYÜ — DTNoT 0.3.3

**Durum:** geliştirici hesabı açıldı ve 5 $ kayıt ücreti ödendi ✓ (panel erişilebilir)
**Paket:** `dist/dtnot-0.3.3-chrome.zip` — Manifest V3, `manifest.json` zip **kökünde** ✓, Chromium'da uçtan uca test edildi ✓

| Ne | Dosya | Not |
|---|---|---|
| Yüklenecek paket | `dist/dtnot-0.3.3-chrome.zip` | Edge ile aynı paket |
| Mağaza ikonu (128×128) | `dist/chrome-icon-128.png` | zorunlu |
| **Küçük promosyon karosu (440×280)** | `dist/chrome-karo-440x280.png` | **Chrome'da zorunlu** |
| Marquee (1400×560) | `dist/chrome-marquee-1400x560.png` | opsiyonel (listede iyi durur) |
| Ekran görüntüleri — **en fazla 5** | `magaza-5-site.png` · `magaza-icerik.png` · `magaza-1-notlar.png` · `magaza-2-panel.png` · `magaza-3-duzenle.png` | hepsi 1280×800, sırayla yükle |

> ⚠️ Chrome **en fazla 5** ekran görüntüsü kabul ediyor (Edge'de 7'ydi) — yukarıdaki 5'i kullan, `magaza-4-ayarlar.png`'ı şimdilik dışarıda bırak.

---

## 1) Sekiz adım

1. `https://chrome.google.com/webstore/devconsole` → giriş yap.
2. Sol menü **Account**: **Publisher name** = `DijitalTurk` · **Verify email** → *Add email* → `dtnot@dijitalturk.com` → gelen kutudaki doğrulama bağlantısına bas (**zorunlu**).
3. **Items → Yeni öğe (Add new item)** → `dtnot-0.3.3-chrome.zip` → **Upload**.
   *(Paket geçerliyse doğrudan düzenleme sayfası açılır.)*
4. **Store listing** sekmesi → §2'deki metinler + §3'teki görseller.
5. **Privacy practices** sekmesi → §4 (tek amaç · izin gerekçeleri · uzaktan kod · veri beyanı · gizlilik URL'si).
6. **Distribution** → **Public**, tüm ülkeler, **ücretsiz**.
7. **Test instructions** → §5'teki inceleyici notu (isteğe bağlı ama önerilir).
8. **Submit for Review** → çıkan pencerede **“yayınla” kutusunu KALDIR** (inceleme geçince kendiliğinden yayına girmez; sen onaylayınca yayınlanır).

---

## 2) Store listing — kopyala-yapıştır

### Türkçe (locale: *Türkçe*)

**Ad** (paketten gelir): `DTNoT — Sayfada Not Bırak`

**Açıklama (uzun):**
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

### English (locale: *English*)

**Ad** (paketten gelir): `DTNoT — Notes on Web Pages`

**Description:**
```
DTNoT lets you drop quick notes on any web page and see them exactly where you left them.

• Four layouts: draggable STICKY NOTE, top BANNER, bottom FOOTER, diagonal CORNER TAG.
• Unlimited notes per page; mark any note as site-wide to show it on every page of that site.
• 6 colours and instant editing: use the ✎ menu on any note to edit in place or delete it.
• Notes never overlap: a new note sits to the right of the existing one (below in banners/footers, above in corner tags).
• Drag and drop: move sticky notes anywhere on the page; the position is remembered.
• "My notes" screen: grouped by site, search, colour filter, open page, JSON backup.
• Turkish and English interface, dark/light theme.

PRIVACY: No account, no server, no network requests. Your notes stay in your own browser storage and are never uploaded.
```

### Ortak alanlar
```
Kategori            : Productivity
Dil                 : Türkçe + İngilizce
Resmî site (URL)    : https://dijitalturk.com/dtnot/
Destek e-postası    : dtnot@dijitalturk.com
Yetişkin içerik     : Hayır
```

---

## 3) Görseller (sırayla)

```
Mağaza ikonu (128×128)              : dist/chrome-icon-128.png
Küçük promosyon karosu (440×280)    : dist/chrome-karo-440x280.png
Marquee (1400×560, opsiyonel)       : dist/chrome-marquee-1400x560.png
Ekran görüntüsü 1                   : dist/magaza-5-site.png      (gerçek sayfada DTNoT notu)
Ekran görüntüsü 2                   : dist/magaza-icerik.png      (post-it · banner · footer · etiket)
Ekran görüntüsü 3                   : dist/magaza-1-notlar.png    (popup — sayfanın notları)
Ekran görüntüsü 4                   : dist/magaza-2-panel.png     (Notlarım — gruplu liste, arama)
Ekran görüntüsü 5                   : dist/magaza-3-duzenle.png   (yerinde düzenleme — renk, görünüm)
```

---

## 4) Privacy practices

**Single purpose description:**
```
Create and manage personal notes on web pages: sticky notes, banners, footers and corner tags.
All data stays on the user's device; there is no account, no server and no network request.
```

**Permission justifications:**
```
storage — Notes and settings are stored locally in the browser.
activeTab — Reads the current tab's address only when the user adds a note from the popup.
scripting — Registers the optional in-page note layer at runtime, after the user grants permission.
contextMenus — Adds a right-click "Add note" menu entry.
Host permission — Requested at RUNTIME (not at install) to draw notes over the pages the user chooses.
```

**Remote code:** `No, I am not using remote code.`

**Data usage (veri beyanı):**
```
DTNoT does not collect, store, or transmit any personal data. There is no account, no server and no network request of any kind. Notes and settings are stored only in the user's own browser storage. The content script only draws notes into the DOM; it does not read or transmit page content.
```
→ Hiçbir veri kategorisi **işaretlenmez**; üç sertifika kutusu **işaretlenir** (veri satmama / amaç dışı kullanmama / kredi değerlendirmesi için kullanmama).

**Privacy policy URL:**
```
https://dijitalturk.com/blog/dtnot-gizlilik-politikasi/
```

---

## 5) Test instructions (inceleyici notu)

```
DTNoT works fully locally: no account, no server, no network requests at all, so no test credentials or special network access are needed.

How to test:
1) Open the extension popup and click "İzin ver" (Allow) to grant the optional host permission — it is requested AT RUNTIME via optional_host_permissions; the install itself asks for no broad permissions.
2) On any page, click "Not ekle" (Add note) in the popup, type text, choose a layout (sticky note / banner / footer / corner tag), optionally mark it site-wide, and Save.
3) The note appears on the page; use the ✎ menu to edit or delete it, and × to hide it temporarily.
4) The "Notlarım" (My notes) screen lists notes grouped by site, with search and a colour filter.

Technical notes:
- The content script is a classic script (no top-level import); notes can be saved even without the host permission thanks to activeTab.
- Background is declared with service_worker (Chrome/Edge package).
- The content script only draws DOM nodes; it does not read or transmit page content.
- No minification, bundling or eval: the package is the source. Storage keys: web-not-store / web-not-settings.
```

---

## 6) Edge ile farklar (kısa)

| Konu | Edge | Chrome |
|---|---|---|
| Ücret | yok | **5 $ tek seferlik** (hesap başına, iade yok) |
| Yayın limiti | — | yeni hesapta **2 yayınlanmış eklenti** |
| Ekran görüntüsü | 7'ye kadar | **en fazla 5** |
| 440×280 karo | opsiyonel | **zorunlu** |
| Hesap e-postası | değiştirilebilir | **değiştirilemez**, doğrulanmalı |
| Paket | `dtnot-0.3.3-chrome.zip` | aynı paket ✓ |

---

## 7) Sonrası / güncelleme

- Yeni sürüm: `manifest.json` sürümünü artır → `python3 build.py` → yeni `dtnot-<sürüm>-chrome.zip` → panelde **Package → Upload new package** → **Submit for Review**.
- İnceleme süresi genelde birkaç gün (Edge'de olduğu gibi 1 gün – 1 hafta arası).
- Ret gelirse gerekçe panelde görünür; düzeltip aynı akışla yeniden gönderilir.
- Yayına girdikten sonra: `/dtnot` sayfasındaki "GOOGLE CHROME · YAKINDA" rozetini **mağaza bağlantısıyla** değiştiririz.
