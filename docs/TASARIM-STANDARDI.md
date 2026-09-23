# DTNoT — Tasarım Standardı ("Dashboard / Analytics")

Bu belge DTNoT'nin arayüz kararları için **tek kaynak**tır. Popup, Notlarım
(panel) ve Ayarlar ekranları aynı dili konuşur. Yeni bir ekran/bileşen
eklerken gömülü renk ya da satır içi stil **yazma**; aşağıdaki anlamlı
sınıfları kullan.

- Kaynak standart: **DT BroAgent · `lib/tema.css`**
- DTNoT'daki karşılığı: **`assets/ui.css`** (tokenlar + tüm ortak bileşenler + DTNoT katmanı)
- Ekranlar: `popup.html` · `panel.html` · `options.html` — üçü de yalnız `assets/ui.css` yükler:

```html
<link rel="stylesheet" href="assets/ui.css" />
```

Kural: **renk yalnız `--db-*` değişkenlerinden (ya da hazır sınıftan) gelir.**
Gömülü hex, satır içi `style="…"` ve tema dışı renk yasaktır. Hex'in
yazılabildiği **tek yer** `assets/ui.css`'in token bloklarıdır (kaynak
temadan birebir taşınan sabit tonlar dahil) — ekranlarda ve JS'te asla.

## 1. Palet (CSS değişkenleri)

| Değişken | Değer | Kullanım |
|---|---|---|
| `--db-bg` | `#0B0F19` | sayfa zemini (üstüne hafif yeşil/mavi radial parıltı) |
| `--db-surface` | `#161B22` | kart/panel yüzeyi |
| `--db-surface-2` | `#1A202C` | ikincil yüzey (düğme, giriş, seçici, rozet zemini) |
| `--db-border` | `rgba(255,255,255,.08)` | varsayılan çeper |
| `--db-border-strong` | `rgba(255,255,255,.16)` | vurgulu çeper |
| `--db-text` | `#E6EDF3` | ana metin |
| `--db-muted` | `#8B949E` | ikincil metin |
| `--db-dim` | `#6E7681` | üçüncül/teknik metin (etiket, ipucu, alt bilgi) |
| `--db-accent` → `--db-accent-2` | `#10B981` → `#00E676` | vurgu gradyanı (yeşil) |
| `--db-accent-soft` | `rgba(16,185,129,.14)` | yumuşak yeşil zemin (pill--ok, mesaj) |
| `--db-danger` / `--db-danger-soft` | `#F87171` / `rgba(248,113,113,.14)` | hata |
| `--db-warn` / `--db-warn-soft` | `#FBBF24` / `rgba(251,191,36,.14)` | uyarı (banner bölümü) |
| `--db-bilgi-soft` | `rgba(59,130,246,.12)` | bilgi paneli |
| `--db-radius` | `16px` | panel köşe yarıçapı |

DTNoT'ya özel **türetilmiş** tokenlar da değişkendir (yeni renk uydurulmaz):
`--vurgu` (= `--db-accent`, seçili renk halkası) · `--renk-ic-golge` ·
`--renk-ikon-metin` · `--renk-ikon-golge` · `--not-sari/yesil/mavi/pembe`
(bkz. bölüm 6).

`*` için varsayılan `border-color: var(--db-border)` tanımlıdır — bu yüzden
renksiz `border` koyu temada doğru görünür.

## 2. Bileşen sınıfları (sınıf sözlüğü)

| Sınıf | Ne için |
|---|---|
| `.panel`, `.panel--flush`, `.panel--uyari`, `.panel--bilgi` | kart/panel |
| `.topbar` `.topbar__metin` `.topbar__baslik` `.topbar__alt` `.topbar__sag` `.marka-kutu` | üst bar |
| `.pill` `.pill--ok` `.pill--warn` `.pill--danger` `.pill--soluk` | rozet/badge (BANNER, ✓, sayaç, sürüm) |
| `.btn` `.btn--primary` `.btn--danger` `.btn--pill` `.btn--kucuk` `.btn--secili` `.btn--gri` | düğmeler |
| `.ikon-dugme` (+`--soluk`, `--ok`, `--danger`, `--oynat`, `--duzenle`) | ikon düğmesi (30px) |
| `.mesaj`, `.mesaj--hata` | bildirim/durum şeridi (JS `bildir()` bunu yazar) |
| `.girdi` (`input`, `textarea`) | metin girişi |
| `.secici__etiket` + `select.secici` + `.secici__alt` | kayıt seçici (combobox) |
| `.toolbar` `.toolbar__sag` | aksiyon satırı (solda aksiyonlar, sağda ikincil grup) |
| `.altbilgi` `.altbilgi__link` | alt bilgi + DijitalTurk.com bağlantısı |
| `.katlanir` `.katlanir__baslik` `.katlanir__ok` `.katlanir__ad` `.katlanir__ozet` `.katlanir__govde` | katlanır bölüm (bölüm 4) |
| `.sekmeler` `.sekmeler__dugme` (`aria-pressed`) | segmented sekme |
| `.statlar` / `.stat` / `.stat__etiket` / `.stat__deger(--ok/--kapali/--uyari)` | istatistik şeridi |
| `.bos-durum` `.bos-durum__baslik` `.bos-durum__alt` | boş durum |
| `.onay` (+ `input[type=checkbox]`) | onay kutusu satırı |
| `.yigin` | dikey yığın (gap 12px) |
| `.etiket` `.ipucu` `.bolum-baslik` `.durum` | küçük tipografi |
| `.diller` `.dil-dugme` | TR/EN bayrak düğmeleri (test-kilitli adlar) |
| `.renkler` `.renk-sec` `.renk-nokta` `.renk-secili` | post-it renk seçici (bölüm 6) |
| `.grup` `.grup-bas` `.not-satir` `.not-yol` `.not-metin` `.not-alt` `.not-tarih` | Notlarım liste satırları |
| `.kv-liste` `.kv` | anahtar/değer satırı (Ayarlar → Hakkında) |
| `.truncate` `.min-w-0` `.flex-1` `.flex-wrap` `.mt-1/2/3` `.mb-2` | **yalnız yerleşim** yardımcıları (renk yok) |

Ayarlar ekranındaki `#strateji` gibi satır içi seçiciler `select.secici`
(yalnız yerleşim için `.flex-1` ile) kullanır.

## 3. Hiyerarşi kuralları

- **Başlık**: beyaz, `700`, 17px (`.topbar__baslik`). Alt metin `.topbar__alt` (11px, `--db-dim`).
- **Ana aksiyon**: `.btn--primary` — tam genişlik, yeşil gradyan, **koyu metin** (popup: "Kaydet",
  Ayarlar: "JSON indir").
- **İkincil aksiyonlar**: `.toolbar` içinde `.btn` / `.btn--pill`.
- **Yıkıcı aksiyon**: `.btn--danger` / `.ikon-dugme--danger` (popup "Sil").
- **Durum**: geçici bilgi `.durum` (boşken görünmez) → JS `bildir()` metin verince `.mesaj`
  ya da `.mesaj--hata` yazar; hata ayrıca `data-hata="1"` alır.
- **Teknik metin** (adres/selector): `.ipucu` + `.truncate`.
- Bir ekranda **tek** birincil (yeşil gradyan) düğme olur.

## 4. Katlanır bölüm (accordion) — çok bölümlü ekranlar

Çok bölümlü ekranlarda (Ayarlar) her bölüm katlanır. Amaç: ekranı kısaltmak ama
bilgiyi gizlememek.

```html
<section class="panel katlanir" data-acik="false">
  <button type="button" class="katlanir__baslik" aria-expanded="false" aria-controls="govdeVeri">
    <span class="katlanir__ok" aria-hidden="true">▸</span>
    <span class="katlanir__ad" id="baslikVeri"></span>
    <span class="katlanir__ozet" id="ozetVeri"></span>
  </button>
  <div class="katlanir__govde yigin" id="govdeVeri" hidden>…bölüm içeriği…</div>
</section>
```

Kurallar:

- Açık/kapalı durumu **bölüm başına** `data-acik="true|false"` ile verilir
  (Ayarlar: Dil ve Davranış açık; Veri ve Hakkında kapalı).
- Gövde **DOM'dan silinmez**; yalnız `hidden` + `data-acik` değişir
  (`ui.css`: `[hidden] { display: none !important }` ve
  `.katlanir[data-acik='false'] .katlanir__govde`). Böylece arama/otomasyon
  erişimi bozulmaz.
- Kapalıyken başlıkta **tek satırlık özet** gösterilir, bilgi kaybolmaz:
  Dil → `TR/EN` · Davranış → gizleme süresi ("1 saat") · Veri → "N not" ·
  Hakkında → "Sürüm: 0.2.1".
- Davranışı `options.js` → `katlanirlariKur()` kurar: `.katlanir` bölümlerini
  tarar, `data-acik` / `aria-expanded` / `hidden` / ok (▾ ▸) değerlerini
  yönetir. Özetler `ozetYaz()` ile yazılır (dil değişince ve ayar kaydında
  tazelenir).
- Yeni bölüm eklerken özet metni **mevcut i18n anahtarlarından** üretilir;
  sözlüğe yeni anahtar eklemek gerekirse TR **ve** EN birlikte eklenir
  (`tests/dtnot-test.mjs` anahtar kümelerinin birebir aynı olmasını zorlar).

## 5. Tema (koyu / açık)

Tema, `<html>` köküne **`db-acik`** sınıfı eklenerek uygulanır; renkler
**yalnız** `ui.css` içindeki `html.db-acik { … }` değişken bloğunda değişir
(bg/surface/border/text/muted/dim + `color-scheme: light`). Kural: bu bloğun
dışında tema için renk yazılmaz; bileşenler tema farkını bilmez.

`html.db-acik` altında zemin/çeper düzeltmesi gereken bileşenler (bos-durum,
stat, girdi, secici, katlanir başlık hover, ikon-dugme/btn/dil-dugme hover,
renk-sec seçili halkası, not-satir hover) aynı bloğun **DTNoT eki** başlığı
altında toplanmıştır — yeni bileşen eklerken düzeltmesi oraya yazılır.

Durum: blok hazır ve gelecekteki tema seçimi için test edilebilir; DTNoT'ta
şu an tema değiştirme düğmesi yok, dolayısıyla `db-acik` sınıfı hiçbir yerde
eklenmiyor (varsayılan koyu). Eklenirse tek yapılacak `document.documentElement`
üzerine sınıfı koymaktır.

## 6. Post-it paleti **VERİDİR** (renk kararı CSS'te kalır)

6 renk post-it `assets/store.js → PALET` içinde yaşar (`bg`, `kenar`, `metin`,
`ikon`, `ikonBg`). JS **yalnız değişken geçer**:

```js
b.style.setProperty('--renk-bg', p.bg);
b.style.setProperty('--renk-kenar', p.kenar);
```

Karar `ui.css`'te verilir (`.renk-sec`, `.renk-nokta`, seçili renk halkası
`--vurgu`). Bu yüzden `popup.js` / `panel.js` içindeki `style.setProperty`
kullanımları satır içi stil **değil**, veri aktarımıdır — yasak kapsamına
girmez.

Sayfa üstüne çizilen post-it (içerik betiği) ayrı bir dünyadır: `content.js`
gölge DOM'a kendi stilini enjekte eder (host sayfaya `ui.css` yüklenemez) ve
renkleri yine `PALET` verisinden alır.

## 7. Yapılmaması gerekenler

- ❌ Ekran HTML'inde gömülü renk (`#hex`, `rgb()`) ya da satır içi `style="…"`.
- ❌ JS'te `el.style.background = '#…'` gibi renk yazmak (veri değişkeni geçmek serbest).
- ❌ İkinci bir yeşil tonu uydurmak; vurgu daima `--db-accent…--db-accent-2`.
- ❌ Çeper rengini elle vermek (varsayılan `--db-border`'dır).
- ❌ Eski DTNoT sınıf adlarını (`.kart`, `.ust`, `.dugme`, `.alan`, `.rozet`, `.tamam`, `.hata` …)
  geri getirmek: geçiş katmanı tamamen kaldırıldı, tek dil standart sınıflardır.
- ❌ Sayfaya özel ölçüyü UI dosyalarına yazmak: `body.popup { width: 448px }`,
  `body.tam-sayfa .govde { max-width: 880px }` gibi ölçüler `ui.css`'in DTNoT katmanında kalır.

## 8. Doğrulama (her değişiklikten sonra)

```bash
node tests/dtnot-test.mjs     # 66 test: depo mantığı + i18n + mesajlaşma + manifest/paket kilidi
python3 build.py              # 4 çıktı: zip (Firefox/Zen), xpi, chrome zip, dist/chrome-unpacked
```

Testler arayüzü şu noktalardan kilitler: `assets/ui.css`'in varlığı ve `[hidden]`
kuralı, `.diller`/`.dil-dugme` yerleşimi, seçili renk vurgusu, popup genişliği +
alt bağlantı, kullanılan her i18n anahtarının sözlükte olması, TR/EN anahtar
kümelerinin eşitliği. Sınıf adı değiştirirken bu kilitleri kırmayın; yeni sınıf
eklerken önce standart sözlüğe bakın.

## 9. Dosya haritası

| Dosya | Rol |
|---|---|
| `assets/ui.css` | **tek tasarım kaynağı**: tokenlar + standart bileşenler + açık tema + DTNoT katmanı |
| `assets/store.js` | veri katmanı + post-it `PALET` (veri) |
| `assets/i18n.js` | TR/EN sözlüğü + `.dil-dugme` bayrakları |
| `popup.html` / `popup.js` | popup ekranı (448px) |
| `panel.html` / `panel.js` | Notlarım ekranı (liste, arama, renk filtresi) |
| `options.html` / `options.js` | Ayarlar ekranı (katlanır bölümler, yedekleme) |
| `content.js` | sayfa üstü post-it/banner (gölge DOM, host sayfa) |
