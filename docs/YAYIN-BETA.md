# DTNoT 0.3.2 — Beta yayın dosyası (kopyala-yapıştır)

> Durum: **hazır** · sürüm **0.3.2** · paketler: `dist/dtnot-0.3.2.zip` (Firefox/Zen),
> `dist/dtnot-0.3.2-chrome.zip` (Chrome/Edge), `dist/dtnot-0.3.2.xpi` (imzalama öncesi).
> Ölçüm: 111/111 test · Chromium'da uçtan uca (service worker + mesaj köprüsü + depo) ·
> Firefox'ta `.xpi` kurulumu kabul edildi.

## 1) Mağaza metinleri (TR)

**Ad (≤45):** DTNoT — Sayfalara not bırak

**Kısa açıklama (≤132):** Gezindiğin sayfalara not bırak: post-it, banner, footer veya köşe etiketi.
Notlar yalnız senin tarayıcında kalır.

**Uzun açıklama:**
```
DTNoT, web sayfalarına hızlıca not bırakmanı sağlar. Bir sayfaya döndüğünde notun tam bıraktığın
yerde karşına çıkar.

• Dört görünüm: sürüklenebilir POST-IT, sayfa tepesinde BANNER, altta FOOTER, sağ alt köşede
  çapraz ETİKET.
• Sayfa başına sınırsız not; her notu site geneli işaretleyip sitenin tüm sayfalarında gösterebilirsin.
• 6 renk, anında düzenleme: her notun ✎ menüsünden yerinde düzenle veya sil.
• Notlar üst üste binmez: yeni not mevcudun sağına, banner/footer'da altına, etikette üstüne oturur.
• "Notlarım" ekranı: siteye göre gruplu liste, arama, renk filtresi, sayfayı açma, JSON yedekleme.
• Türkçe ve İngilizce arayüz, koyu/açık tema.

GİZLİLİK: Hesap yok, sunucu yok, ağ isteği yok. Notların yalnız kendi bilgisayarında, tarayıcı
deposunda tutulur; hiçbir yere gönderilmez.
```

## 2) Store listing (EN)

**Name:** DTNoT — Notes on any page

**Short description (≤132):** Leave notes on web pages: sticky note, banner, footer or corner tag.
Everything stays in your browser.

**Long description:**
```
DTNoT lets you drop quick notes on any web page and see them exactly where you left them.

• Four layouts: draggable STICKY NOTE, top BANNER, bottom FOOTER, diagonal CORNER TAG.
• Unlimited notes per page; mark any note as site-wide to show it on every page of that site.
• 6 colours and instant editing: use the ✎ menu on any note to edit in place or delete it.
• Notes never overlap: a new note sits to the right of the existing one (below in banners/footers,
  above in corner tags).
• "My notes" screen: grouped by site, search, colour filter, open page, JSON backup.
• Turkish and English interface, dark/light theme.

PRIVACY: No account, no server, no network requests. Your notes stay in your own browser storage
and are never uploaded.
```

## 3) Mağaza formu cevapları

| Soru | Cevap |
|---|---|
| Tek amaç (single purpose) | Kullanıcının web sayfalarına kendi kişisel notlarını bırakmasını ve bu notları sayfa üzerinde göstermesini sağlamak. |
| Veri toplama | **Hayır** — hiçbir veri toplanmaz, saklanmaz, iletilmez (Firefox beyanı: `data_collection_permissions.required = ["none"]`). |
| Uzak kod / eval | **Yok** — paket doğrudan kaynaktır (minify/bundle/eval yok). |
| Kategori | Verimlilik (Productivity) |
| Dil | Türkçe (varsayılan) + İngilizce |
| Ekran görüntüsü | 3 adet 1280×800 (`dist/magaza-*.png`) |
| İkon | 128×128 mevcut (`icons/dtnot-128.png`) |

**İzin gerekçeleri (inceleyiciye):**
- `storage` → notlar ve ayarlar cihazda saklanır.
- `activeTab` → kullanıcı not bırakırken aktif sekmenin adresini okumak için (izin verilmese de not kaydedilebilir).
- `scripting` + `optional_host_permissions: *://*/*` → kullanıcı "İzin ver" dediğinde sayfa üstü not
  katmanı çalışma zamanında kaydedilir; kurulumda geniş izin İSTENMEZ.
- `contextMenus` → sağ tık "Not ekle".
- Ağ isteği yok; hiçbir veri dışarı gitmez.

## 4) AMO (Firefox) — sürüm notları (kopyala-yapıştır)

```
0.3.2 — Notlar artık birbirinin üzerine binmiyor ve her görünümde düzenle/sil çalışıyor.

• Sayfa başına SINIRSIZ not: her not kimlik taşır; bir sayfaya istediğin kadar not bırakabilirsin.
  (Eski sürümden gelen kayıtlar okunurken sessizce taşınır, veri kaybı olmaz.)
• Dört görünüm: post-it (sürüklenebilir), banner (sayfa tepesi), footer (sayfa altı),
  etiket (sağ alt köşede 45° çapraz durak).
• Site geneli artık her görünümde işaretlenebilir.
• Her notta ✎ menüsü: yerinde düzenle (metin + renk + görünüm + site geneli) veya sil.
• Çakışma önleme: yeni post-it mevcudun sağına, banner/footer'da yeni not altına, etikette üstüne;
  sürükleyip bıraktığında not başka bir notun üstüne binmez.
• Post-it'lerin sağ altında küçük DijitalTurk.com bağlantısı.
• Görünüm seçimi popup'ta; "Not ekle" düğmesi not listesinin üstünde; sayfada not yoksa uyarı gösterilir.
• Türkçe/İngilizce, koyu/açık tema. 111 otomatik test + Chrome ve Firefox ölçümleri.
```

## 5) İnceleyici notları (AMO "Notes to Reviewer")

```
Merhaba,

DTNoT tamamen yerel çalışan bir not eklentisidir: hesap, sunucu, giriş ve AĞ İSTEĞİ YOKTUR.
Bu nedenle inceleme için test hesabı veya özel ağ erişimi gerekmez.

Denemek için:
1) İzin ver: eklenti popup'ını aç, "İzin ver" düğmesine bas (isteğe bağlı host izni
   `optional_host_permissions` ile ÇALIŞMA ZAMANINDA istenir; kurulumda geniş izin istenmez).
2) Herhangi bir sayfada popup'tan "Not ekle" → metni yaz, görünüm seç (post-it/banner/footer/etiket),
   istersen "site geneli" işaretle, Kaydet.
3) Not sayfa üzerinde görünür; ✎ menüsünden düzenle/sil, × ile geçici gizle.
4) "Notlarım" ekranında siteye göre gruplu liste, arama ve renk filtresi vardır.

Teknik notlar:
- İçerik betiği klasik betiktir (top-level import yok); `activeTab` izni olmadan da not kaydedilebilir.
- Arka plan iki anahtarla tanımlı: `background.scripts` (Firefox) + `background.service_worker`
  (Chrome). Firefox'ta yalnız `service_worker` yazılırsa kurulum reddediliyor.
- İçerik betiği yalnız DOM'a not çizer; sayfa içeriğini okumaz veya iletmez.
- Minify/bundle/eval yok (paket = kaynak). Depo anahtarları sabittir: web-not-store / web-not-settings.
```

## 6) Beta kanal planı

| Mağaza | Beta yolu | Ücret | Not |
|---|---|---|---|
| **Firefox (AMO)** | "Unlisted" (kendi dağıtımın) olarak imzalat → imzalı `.xpi` linkini test ekibine ver | ücretsiz | AMO'da herkese açık listelemeden de imzalama yapılabilir |
| **Chrome Web Store** | Visibility: **Unlisted** + "Trusted testers" listesi | tek seferlik 5 $ geliştirici ücreti | mağaza sayfası yine de doldurulur |
| **Edge Add-ons** | Visibility: **Unlisted / Hidden** | ücretsiz | aynı `-chrome.zip` yüklenir |

Ortak gerekenler: mağaza metinleri (yukarıda), 3 ekran görüntüsü, 128 ikon, gizlilik/veri beyanı
("veri toplamıyoruz"), izin gerekçeleri.

## 7) Kullanıcının kendi tarayıcısında 1 dakikalık QA (yayın öncesi)

1. **Zen/Firefox:** `about:debugging#/runtime/this-firefox` → Geçici Eklenti Yükle → `dtnot-0.3.2.zip`
   → popup'ı aç, bir sayfaya 2 post-it + 1 banner + 1 etiket ekle, ✎ menülerini dene.
2. **Chrome:** `chrome://extensions` → Geliştirici modu → Paketlenmemiş öğe yükle →
   `dist/chrome-unpacked/` → aynı akış.
3. **Edge:** `edge://extensions` → Geliştirici modu → Paketlenmemiş öğe yükle → aynı klasör.
