# Devir promptu — Web Not eklentisini tamamla

Bu, başka bir asistana (Claude Code, Cursor, vb.) verilmek üzere hazırlanmış
bir görev promptudur. Aşağıdaki metni olduğu gibi o ajana yapıştırabilirsin.

---

## Görev

`web-note-extension/` klasöründe, DT ToolBox adlı çok modüllü bir tarayıcı
eklentisinden **"Web Not"** modülü ayrılarak React + TypeScript + Vite
(`@crxjs/vite-plugin`) ile bağımsız bir MV3 eklentisi olarak yeniden
yazılmaya başlandı. İskelet çalışır durumda (`npm run build` hatasız
geçiyor) ama üretime hazır değil. Görevin bu taslağı bitirmek.

**Uygulamanın amacı:** kullanıcı gezindiği web sayfalarına özel not
bırakabilsin; aynı sayfaya tekrar geldiğinde sol altta bir post-it olarak
görsün. Notlar `chrome.storage.local`'da tutulur, JSON olarak dışa/içe
aktarılabilir.

## Önce oku

1. `README.md` — mimari kararlar ve gerekçeleri (özellikle: içerik
   betiğinin neden ayrı bir esbuild adımıyla paketlendiği, ve
   `optional_host_permissions` + runtime kayıt modelinin neden
   seçildiği — bu iki kararı SEBEPSİZ YERE değiştirme).
2. `src/lib/store.ts` — tek depo/doğrulama kaynağı, hem popup hem content
   script bunu kullanıyor.
3. `src/background/index.ts`, `src/content/webnot-content.ts`,
   `src/popup/App.tsx` — ana akış.

## Yapılacaklar (öncelik sırasıyla)

### 1. Uçtan uca manuel doğrulama (kritik — hiç yapılmadı)
- `npm install && npm run build`, `dist/`'i Chrome'a "paketlenmemiş öğe
  yükle" ile yükle, gerçek bir sitede test et:
  - İzin verme akışı (popup → "İzin ver" → `chrome.permissions.request`)
  - Not ekleme → sayfayı yenileme → post-it görünüyor mu
  - Gizle (×), küçült (−), SPA gezinmede (pushState) post-it doğru
    güncelleniyor mu
  - JSON dışa aktar → başka profilde içe aktar (merge ve replace)
- Aynısını Firefox'ta da dene (`about:debugging` → "Bu Firefox" →
  "Geçici Eklenti Yükle" → `dist/manifest.json`). `browser_specific_settings`
  zaten manifest'te var ama Firefox'un `chrome.*` yerine `browser.*`
  kullanması gerekebilir — MV3 Firefox 127+'ta `chrome` namespace'i
  genelde polyfill'lenmiş oluyor, ama doğrula; gerekirse `webextension-polyfill`
  ekle.
- Bulduğun her hatayı düzelt; bu adım tamamlanmadan diğer maddelere geçme.

### 2. Sağ tık menüsü → popup akışını bağla
`src/background/index.ts` içinde context menu tıklanınca
`web-not-pending` anahtarına `{action:'add', at}` yazılıp popup açılıyor,
ama `src/popup/App.tsx` bu anahtarı hiç okumuyor. Popup açılışında bu
anahtarı oku, `action==='add'` ise `addOpen` state'ini `true` başlat ve
anahtarı temizle (tek seferlik tüketim — orijinal DT ToolBox'taki
`dt-toolbox-pending` deseniyle aynı mantık).

### 3. `chrome.action.openPopup()` başarısız senaryosu
Kullanıcı jesti dışında (bazı context menu tetiklemelerinde) bu API
reddedebilir. Orijinal projedeki gibi bir düşüş (fallback) ekle: başarısız
olursa `chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/index.html') })`
ile popup'ı sekmede aç.

### 4. `chrome.scripting.getRegisteredContentScripts` uyumluluğu
Bu API bazı eski Chromium/Firefox sürümlerinde yok ya da farklı imzada
olabilir. `src/background/index.ts` → `contentScriptKayitliMi()` fonksiyonunu
gerçek cihazlarda/sürümlerde test et; hata durumunda sessiz düşüşün
(try/catch zaten var) beklenen davranışı verip vermediğini doğrula.

### 5. i18n'i `_locales`'e taşı (Chrome Web Store / AMO gereksinimi)
Şu an `src/lib/i18n.ts` içinde sabit bir tr/en sözlüğü var. Mağaza
yerelleştirmesi (extension adı/açıklaması dahil) için
`_locales/tr/messages.json` ve `_locales/en/messages.json` formatına
geçir; `manifest.json`'da `default_locale` ekle. Popup içi metinler
`lib/i18n.ts`'te kalabilir (React tarafında `chrome.i18n.getMessage`
kullanmak şart değil) ama en azından `name`/`description` alanları
`__MSG_xxx__` formatına çevrilmeli.

### 6. Depolama kotası ve büyük not sayısı
`KOTA_UYARI_NOT = 300` eşiği sadece görsel bir uyarı. `chrome.storage.local`
varsayılan olarak ~10MB (unlimitedStorage izni yoksa); `METIN_MAX = 4000`
karakter × yüzlerce not senaryosunu gerçek kotaya karşı test et, gerekirse
`unlimitedStorage` iznini opsiyonel değil gerekli izinlere ekle ya da
kullanıcıyı daha erken uyar.

### 7. Test yok — en azından `lib/store.ts` için birim testi ekle
`normalizeUrl`, `validateStore`, `saveNote`/`removeNote`/`importNotes`
için Vitest ile testler yaz (`chrome.storage.local` mock'lanabilir, basit
bir in-memory obje yeterli). Öncelik: `normalizeUrl` edge-case'leri
(www. korunması, trailing slash, query/hash atılması, localhost, portlu
host) — orijinal projede bu fonksiyon parity testiyle (`tests/test_webnot_depo.py`)
korunuyordu, burada da benzer bir güvenlik ağı olmalı.

### 8. Görsel/markalama
İkonlar (`public/icons/*.png`) orijinal DT ToolBox'tan aynen kopyalandı.
Yeni eklenti için ayrı bir ikon seti/renk paleti gerekip gerekmediğini
kullanıcıya sor; `manifest.config.ts` içindeki `name`/`description`
alanlarını nihai metinle güncelle.

### 9. (Opsiyonel, kullanıcı isterse) Ayarlar ekranını genişlet
Şu an tek popup içinde `<details>` ile gizli duruyor. İstenirse ayrı bir
`options_page` (tam sayfa ayarlar) eklenebilir — özellikle JSON
içe/dışa aktarma büyük not sayısında popup'ın kapanma davranışıyla
(`window` kapanınca indirme/seçim iptal olabilir) çakışabilir; bunu da
test ederken gözlemle (madde 1).

## Kısıtlar / değiştirme

- Depo anahtarları (`web-not-store`, `web-not-settings`) sabit kalsın;
  değiştirirsen mevcut kullanıcı verisi (varsa) kaybolur.
- `normalizeUrl` mantığını değiştirirsen, `lib/store.ts` TEK kaynak
  olduğu için hem popup hem content script otomatik etkilenir — ayrıca
  bir yerde elle kopyalama YAPMA.
- Content script'i asla doğrudan `vite build`'e güvenerek paketlenmiş
  sayma; her değişiklikten sonra `npm run build` çalıştırıp
  `dist/content/webnot-content.js` dosyasının GÜNCELLENDİĞİNİ doğrula
  (esbuild adımı ayrı çalışıyor, unutulması kolay bir hata kaynağı).

## Teslim

İşin sonunda: `npm run build` hatasız, Chrome'da ve Firefox'ta manuel
olarak test edilmiş, `HANDOFF_PROMPT.md`'deki 1–4 maddeleri kesin
tamamlanmış bir sürüm bekleniyor. 5–9 arası maddeler zaman kalırsa
yapılsın; yapılamayanları güncellenmiş bir "Durum" notuyla `README.md`'de
işaretli bırak.
