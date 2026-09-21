# Web Not — tarayıcı eklentisi (React + TypeScript + Vite)

DT ToolBox'ın "Web Not" modülünün, bağımsız bir eklenti olarak yeniden yazılmış hâli.
Mimari: **@crxjs/vite-plugin + React 18 + TypeScript**, MV3.

> Bu depo yarım bırakılmış bir taslaktır. Neyin bitip neyin bitmediği için
> aşağıdaki **"Durum"** bölümüne ve depo köküyle birlikte verilen
> `HANDOFF_PROMPT.md` dosyasına bakın.

## Geliştirme

```bash
npm install
npm run dev     # crxjs HMR ile geliştirme derlemesi -> dist/
npm run build   # üretim derlemesi (tsc + vite build + content script esbuild paketi)
```

`npm run build` sonrası `dist/` klasörünü tarayıcıya "paketlenmemiş öğe yükle"
ile yükleyin (`chrome://extensions` veya `about:debugging` → Firefox).

## Mimari notları

- `src/background/index.ts` — service worker. Kurulumda geniş host izni
  İSTEMİYOR (`optional_host_permissions`). İzin, popup'taki "İzin ver"
  düğmesiyle istenir; verilince içerik betiği **runtime'da**
  `chrome.scripting.registerContentScripts` ile kaydedilir. Bu, Firefox
  127+'nin statik `content_scripts`'i kurulum ekranında zorunlu host izni
  olarak göstermesini engellemek için bilinçli bir tercihtir (orijinal
  DT ToolBox'tan devralındı).
- `src/content/webnot-content.ts` — sayfada post-it'i çizen betik.
  `lib/store.ts`'ten import ediyor ama **ayrı bir esbuild adımıyla**
  (`scripts/build-content.mjs`) tek dosyalık IIFE'ye paketleniyor, çünkü
  runtime'da kaydedilen içerik betikleri top-level `import` kullanamaz.
  `npm run build` bu adımı otomatik çalıştırır; `vite build` bunu
  KENDİLİĞİNDEN paketlemez (giriş noktası olarak görmez) — unutulursa
  `dist/content/webnot-content.js` oluşmaz ve post-it hiç çalışmaz.
- `src/lib/store.ts` — TEK depo/doğrulama kaynağı; hem popup hem content
  script buradan besleniyor (orijinaldeki "iki kopyayı elle senkron tut"
  kısıtı kalktı).
- `src/lib/backup.ts` — JSON dışa/içe aktarma. İçe aktarmada `merge`
  (çakışmada en güncel kazanır) veya `replace` (tamamen değiştirir) seçilebilir.

## Durum (ne yapıldı / ne kaldı)

**Yapıldı ve doğrulandı (`npm run build` hatasız geçiyor):**
- Proje iskeleti, manifest, background, content script, popup (React) uçtan uca çalışıyor
- Not CRUD (ekle/düzenle/sil/gizle/küçült), site bazlı gruplama, arama, "yalnız aktif site" filtresi
- JSON dışa/içe aktarma (merge/replace)
- tr/en dil desteği (sabit sözlük, `lib/i18n.ts`)

**Yapılmadı / gözden geçirilmedi — devralan ajanın tamamlaması gerekiyor:**
Ayrıntılı, önceliklendirilmiş liste için `HANDOFF_PROMPT.md` dosyasına bakın.
Özetle: gerçek tarayıcıda manuel test edilmedi, otomatik test yok, sağ tık
menüsü popup'ı otomatik "not ekle" moduna açmıyor (pending-action akışı
bağlanmadı), `chrome.action.openPopup()` kullanıcı jesti dışı senaryoda
başarısız olabilir, `getRegisteredContentScripts` API'sinin bazı eski
Chromium sürümlerinde kısıtı var, i18n `strings` mesajlar `_locales` yerine
JS sözlüğünde (Web Store yerelleştirmesi için `_locales/*/messages.json`'a
taşınmalı), ikonlar orijinal DT ToolBox'tan aynen kopyalandı (yeni marka
için değiştirilebilir).
