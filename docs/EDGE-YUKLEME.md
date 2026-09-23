# EDGE YÜKLEME FÖYÜ — DTNoT 0.3.3 (Microsoft Edge Add-ons)

Edge tarafı AMO'dan **bağımsız** ilerler; ikisi paralel yürüyebilir.
**Durum:** paket hazır ve Chromium motorunda uçtan uca doğrulandı ✓ · mağaza logosu yeni üretildi ✓

| Ne | Dosya |
|---|---|
| Yüklenecek paket (**Edge/Chrome**) | `dist/dtnot-0.3.3-chrome.zip` |
| Mağaza logosu (**300×300**, 1:1) | `dist/edge-logo-300.png` |
| Ekran görüntüleri (1280×800 ×3) | `dist/magaza-popup.png` · `dist/magaza-icerik.png` · `dist/magaza-panel.png` |

> ⚠️ Edge'e **`dtnot-0.3.3.zip` DEĞİL**, `dtnot-0.3.3-chrome.zip` yüklenir (Firefox paketi Edge'de kurulmaz).

---

## 1) Hesap + akış (6 adım)

1. `https://partner.microsoft.com/dashboard/microsoftedge/overview` → **Microsoft hesabıyla giriş**
   (Edge programına kayıt **ücretsiz**; Chrome'un aksine ücret yok)
2. **Create new extension** → eklenti adını yaz → *Create*
3. **Packages** → `dtnot-0.3.3-chrome.zip` dosyasını yükle
4. **Store listings** → dil seç (Türkçe; istersen İngilizce de ekle) → §2 alanlarını doldur
5. **Properties** → kategori + veri beyanı + inceleme notları (§3)
6. **Submit** → Microsoft sertifikasyonu (genelde 1–7 gün). Onaylanınca mağazada yayına girer.

---

## 2) Store listing alanları (kopyala-yapıştır)

**Ad (Name)**
```
DTNoT — Sayfada Not Bırak
```
*(Paketteki adla birebir aynı — sertifikasyonda sürtüşme olmasın)*

**Kısa açıklama (Short description, ≤132)**
```
Sayfalara not bırak: post-it, banner, footer, köşe etiketi. Sınırsız not, site geneli, sürükle-bırak. Notlar cihazında kalır.
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

**Kategori**
```
Productivity (Verimlilik)
```

**Arama terimleri (Search terms — isteğe bağlı)**
```
not, post-it, yapışkan not, sayfa notu, note
```

**Ekran görüntüleri (sırayla)**
```
dist/magaza-popup.png    → "Sayfalara not bırak — post-it, banner, footer, etiket"
dist/magaza-icerik.png   → "Notlar sayfada seni bekler — sürüklenebilir post-it ve şeritler"
dist/magaza-panel.png    → "Notlarım — siteye göre gruplu liste, arama, renk filtresi"
```

**Logo**
```
dist/edge-logo-300.png
```

**Görünürlük (Visibility)**
```
Public   (mağazada listelensin)  ·  alternatif: Hidden (yalnız link ile erişilir)
```

---

## 3) Properties / beyanlar

- **Does your extension collect personal data?** → **No**
  (Hiçbir veri toplanmaz, saklanmaz, iletilmez; tüm notlar cihazda kalır.)
- **Notes for certification** (inceleme notları) — aşağıdaki bloğu yapıştır:

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

## 4) Sonrası

- Güncelleme: `manifest.json` sürümünü artır → `python3 build.py` → yeni `-chrome.zip` → **Packages → Upload** → Submit.
- Edge'de sertifikasyon bazen 1 gün, bazen 1 hafta sürer; ret gelirse gerekçe Partner Center'da görünür, düzeltip yeniden gönderebiliriz.
- Aynı paket **Chrome Web Store** için de geçerlidir (tek fark: 5 $ tek seferlik geliştirici ücreti + Google hesabı).
