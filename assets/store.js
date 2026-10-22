/* DTNoT — depo ve doğrulama (TEK KAYNAK).
   Klasik script: popup/panel/ayarlar `<script>` ile yükler; arka plan Chrome'da
   importScripts, Firefox'ta manifest background.scripts ile yükler; Node testleri
   `vm` ile koşar. Depo anahtarları SABİT tutulur (web-not-store / web-not-settings) —
   değiştirmek mevcut kullanıcı verisini kaybettirir.

   ŞEMA v2 (0.3.0): sayfa başına SINIRSIZ not. Her not artık `id` ile ayrılır
   (eskiden anahtar = host+path tekilliği vardı). `gorunum` alanı dört görünümden
   birini taşır: postit · banner · footer · etiket. `siteGeneli` artık banner'a
   BAĞLI DEĞİL — her not her görünümde site geneli işaretlenebilir.
   Eski kayıtlar (id ve gorunum yok) okuma anında sessizce taşınır:
   id = 'k:' + anahtar · gorunum = banner ? 'banner' : 'postit'. */
(function () {
  'use strict';

  const STORAGE_KEY = 'web-not-store';
  const SETTINGS_KEY = 'web-not-settings';
  const STORE_VERSION = 2;
  const METIN_MAX = 4000;
  const UYARI_NOT = 300;
  const GIZLEME_SAAT = [1, 4, 24, 168];
  const VARSAYILAN_AYAR = { lang: 'tr', gizlemeSaat: 1, sadeceAktif: false, tema: 'koyu' };
  /** 6 post-it rengi (tek alan: `renk`; eski kayıtlar varsayılana düşer → şema bozulmaz). */
  const RENKLER = ['sari', 'yesil', 'mavi', 'pembe', 'mor', 'turuncu'];
  const RENK_VARSAYILAN = 'sari';
  /** Dört görünüm — not nasıl çizilecek? (post-it · banner · footer · etiket) */
  const GORUNUMLER = ['postit', 'banner', 'footer', 'etiket'];
  const GORUNUM_VARSAYILAN = 'postit';
  /** Geliştirici bağlantısı: post-it'lerin sağ altında ve arayüzlerin alt bilgisinde. */
  const SAYFA_LINK = 'https://dijitalturk.com';
  /** Palet TEK KAYNAK: post-it, banner, arayüzdeki renk seçici ve listedeki nokta buradan beslenir. */
  const PALET = {
    sari: { bg: '#fdf6c9', kenar: '#e6d98a', metin: '#2f2b16', ikon: '#6b5f21', ikonBg: '#f7ecaa' },
    yesil: { bg: '#dcf5e4', kenar: '#a9dcbd', metin: '#123322', ikon: '#1d6b40', ikonBg: '#c8eed6' },
    mavi: { bg: '#dbeafe', kenar: '#a9c7f5', metin: '#132a4d', ikon: '#1d4ed8', ikonBg: '#c7dcfb' },
    pembe: { bg: '#fde2ef', kenar: '#f0b3d0', metin: '#4a1330', ikon: '#b0357a', ikonBg: '#fbcfe3' },
    mor: { bg: '#eae0fd', kenar: '#c6b1f2', metin: '#2c1a52', ikon: '#6d28d9', ikonBg: '#ddcffb' },
    turuncu: { bg: '#ffe8d1', kenar: '#f5c191', metin: '#4a2410', ikon: '#c2410c', ikonBg: '#ffd9b3' },
  };

  /* ---------- URL normalizasyonu ----------
     Anahtar = host (küçük harf, `www.` KORUNUR, port korunur) + pathname.
     query (?...) ve hash (#...) atılır; kök hariç sondaki '/' kırpılır. */
  function yoluDuzle(yol) {
    let p = String(yol == null ? '/' : yol);
    if (!p.startsWith('/')) p = '/' + p;
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p || '/';
  }

  function normalizeUrl(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return '';
    let u = null;
    try { u = new URL(s); } catch (e) { u = null; }
    if (u && (u.protocol === 'http:' || u.protocol === 'https:')) {
      const host = String(u.host || '').toLowerCase();
      if (host) return host + yoluDuzle(String(u.pathname || '/'));
    }
    const m = s.match(/^([a-z0-9-]+(?:\.[a-z0-9-]+)+|localhost)(:\d+)?(\/.*)?$/i);
    if (!m) return '';
    return (m[1] + (m[2] || '')).toLowerCase() + yoluDuzle(m[3] || '/');
  }

  function hostOf(anahtar) {
    const s = String(anahtar == null ? '' : anahtar);
    const at = s.indexOf('/');
    return at === -1 ? s : s.slice(0, at);
  }

  function yolOf(anahtar) {
    const s = String(anahtar == null ? '' : anahtar);
    const at = s.indexOf('/');
    return at === -1 ? '/' : (s.slice(at) || '/');
  }

  /* ---------- Doğrulama ---------- */
  function temizRenk(v) {
    return RENKLER.indexOf(String(v)) !== -1 ? String(v) : RENK_VARSAYILAN;
  }

  /** Görünüm doğrulama. `eskiBanner` yalnız şema v1 kayıtları için (banner alanı). */
  function temizGorunum(v, eskiBanner) {
    const s = String(v == null ? '' : v);
    if (GORUNUMLER.indexOf(s) !== -1) return s;
    return eskiBanner === true ? 'banner' : GORUNUM_VARSAYILAN;
  }

  /** Not nesnesinden görünümü güvenle oku (bozuk/eksik → postit). */
  function gorunumOf(not) {
    return temizGorunum(not && not.gorunum, not && not.banner === true);
  }

  /** Kimlik: harf/rakam + `-` `_` `:`; boş/bozuksa null. */
  function temizId(v) {
    const s = String(v == null ? '' : v).trim();
    if (!s || s.length > 80) return null;
    return /^[A-Za-z0-9:_-]+$/.test(s) ? s : null;
  }

  /** Yeni not kimliği: zaman damgası (36'lık) + rastgele kuyruk → çakışma pratikte yok. */
  function yeniId() {
    return 'n' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /** Sürükle-bırak konumu: görünüm alanına göre 0..1 oran (pencere boyutu değişse de yer korunur). */
  function temizKonum(v) {
    if (!v || typeof v !== 'object') return null;
    const k = (x) => {
      const n = Number(x);
      if (!Number.isFinite(n)) return null;
      return Math.min(1, Math.max(0, n));
    };
    const x = k(v.x);
    const y = k(v.y);
    return (x === null || y === null) ? null : { x, y };
  }

  function temizNot(ham) {
    if (!ham || typeof ham !== 'object') return null;
    const anahtar = normalizeUrl(ham.anahtar);
    if (!anahtar) return null;
    const metin = String(ham.metin == null ? '' : ham.metin).slice(0, METIN_MAX);
    if (!metin.trim()) return null;
    const sayi = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const gorunum = temizGorunum(ham.gorunum, ham.banner === true);
    // Şema v1 kayıtlarında id yok → anahtardan türetilir (sabit: her okumada aynı kalır).
    const id = temizId(ham.id) || ('k:' + anahtar);
    return {
      id,
      anahtar,
      host: hostOf(anahtar),
      yol: yolOf(anahtar),
      metin,
      sema: ham.sema === 'http' ? 'http' : 'https',
      renk: temizRenk(ham.renk),
      gorunum,
      // Türetilmiş alan: eski sürümler/araçlar `banner` okursa doğru görsün.
      banner: gorunum === 'banner',
      // "site geneli" artık BAĞIMSIZ: her görünümde işaretlenebilir.
      siteGeneli: ham.siteGeneli === true,
      konum: temizKonum(ham.konum),
      olusturma: sayi(ham.olusturma, Date.now()),
      guncelleme: sayi(ham.guncelleme, sayi(ham.olusturma, Date.now())),
      kucuk: gorunum === 'postit' && ham.kucuk === true,
      gizleUntil: sayi(ham.gizleUntil, 0),
    };
  }

  /** Ham depoyu doğrula: bozuk kayıtları atar, aynı KİMLİĞİN en güncelini tutar.
      (Şema v2: tekillik anahtar değil `id` üzerindedir → sayfa başına sınırsız not.) */
  function dogrula(ham) {
    const bos = { version: STORE_VERSION, notlar: [], recovered: false };
    if (ham == null || typeof ham !== 'object') return ham == null ? bos : Object.assign({}, bos, { recovered: true });
    const liste = Array.isArray(ham.notlar) ? ham.notlar : null;
    if (!liste) return Object.assign({}, bos, { recovered: true });
    const harita = new Map();
    let atilan = 0;
    liste.forEach((k) => {
      const t = temizNot(k);
      if (!t) { atilan += 1; return; }
      const varolan = harita.get(t.id);
      if (varolan && varolan.guncelleme >= t.guncelleme) { atilan += 1; return; }
      if (varolan) atilan += 1;
      harita.set(t.id, t);
    });
    const notlar = Array.from(harita.values()).sort((a, b) => b.guncelleme - a.guncelleme);
    return { version: STORE_VERSION, notlar, recovered: atilan > 0 };
  }

  function grupla(notlar) {
    const m = new Map();
    (notlar || []).forEach((k) => {
      const h = k.host || hostOf(k.anahtar);
      if (!m.has(h)) m.set(h, []);
      m.get(h).push(k);
    });
    return Array.from(m.entries()).map(([host, liste]) => ({ host, notlar: liste }));
  }

  /** İçe aktarma: 'merge' (çakışmada en güncel kazanır) | 'replace' (tamamen değiştirir). */
  function birlestir(mevcutNotlar, gelenNotlar, strateji) {
    if (strateji === 'replace') return dogrula({ version: STORE_VERSION, notlar: gelenNotlar });
    return dogrula({ version: STORE_VERSION, notlar: [].concat(gelenNotlar || [], mevcutNotlar || []) });
  }

  function gorunurMu(not, simdi) {
    if (!not) return false;
    return !(Number(not.gizleUntil || 0) > (simdi || Date.now()));
  }

  /** Notun tam adresi (şema saklanmışsa onunla). */
  function sayfaUrl(not) {
    const anahtar = (not && not.anahtar) || '';
    if (!anahtar) return '';
    return ((not && not.sema === 'http') ? 'http' : 'https') + '://' + anahtar;
  }

  /* ---------- Ortak yardımcılar (saf, test edilir) ---------- */

  /** ekle()/guncelle() için isteğe bağlı alanları doğrula (renk · görünüm · siteGeneli · konum). */
  function temizAlanlar(ek) {
    const e = (ek && typeof ek === 'object') ? ek : {};
    const cikti = {};
    if ('renk' in e) cikti.renk = temizRenk(e.renk);
    if ('gorunum' in e) cikti.gorunum = temizGorunum(e.gorunum, e.banner === true);
    else if ('banner' in e) cikti.gorunum = e.banner === true ? 'banner' : 'postit';
    if ('siteGeneli' in e) cikti.siteGeneli = e.siteGeneli === true;
    if ('konum' in e) cikti.konum = temizKonum(e.konum);
    return cikti;
  }

  /** Uzun metnin ORTASINDAN kısalt: "https://site.com/…/urun-adi". */
  function kisaltOrtadan(s, enFazla) {
    const m = String(s == null ? '' : s);
    const n = Number(enFazla) > 8 ? Number(enFazla) : 42;
    if (m.length <= n) return m;
    const bas = Math.ceil((n - 1) / 2);
    const son = Math.floor((n - 1) / 2);
    return m.slice(0, bas) + '…' + m.slice(m.length - son);
  }

  /** Aramada kullanılan katlama: TR/EN + aksan/özel harf duyarsız.
      'İkinci' ≈ 'ikinci' ≈ 'IKINCI' ≈ 'ıkıncı' — kullanıcı hangi biçimde yazarsa yazsın bulur. */
  function katla(s, dil) {
    return String(s == null ? '' : s)
      .toLocaleLowerCase(dil === 'en' ? 'en' : 'tr')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  }

  /** Bu SAYFADA gösterilecek TÜM notlar: tam sayfa notları + (site geneli işaretli)
      aynı host'un notları. Görünüm tipine göre gruplanır (postit/banner/footer/etiket).
      Sıra: en yeni güncelleme önce. */
  function sayfaNotlari(store, anahtar, simdi) {
    const key = normalizeUrl(anahtar);
    const cikti = { anahtar: key, postit: [], banner: [], footer: [], etiket: [], tumu: [] };
    if (!key) return cikti;
    const t = simdi || Date.now();
    const host = hostOf(key);
    const tumu = ((store && store.notlar) || []).filter((x) =>
      gorunurMu(x, t) && (x.anahtar === key || (x.siteGeneli === true && x.host === host)));
    tumu.sort((a, b) => b.guncelleme - a.guncelleme);
    cikti.tumu = tumu;
    tumu.forEach((n) => {
      const g = gorunumOf(n);
      (cikti[g] || cikti.postit).push(n);
    });
    return cikti;
  }

  /** Panel süzgeci: arama + renk + site + görünüm. */
  function filtrele(notlar, secenekler) {
    const o = secenekler || {};
    let liste = Array.isArray(notlar) ? notlar.slice() : [];
    if (o.renk && o.renk !== 'tumu') liste = liste.filter((n) => temizRenk(n.renk) === o.renk);
    if (o.gorunum && o.gorunum !== 'tumu') liste = liste.filter((n) => gorunumOf(n) === o.gorunum);
    if (o.host) liste = liste.filter((n) => (n.host || hostOf(n.anahtar)) === o.host);
    const q = katla(String(o.q || '').trim(), o.dil);
    if (q) {
      liste = liste.filter((n) => katla(n.anahtar, o.dil).indexOf(q) !== -1 || katla(n.metin, o.dil).indexOf(q) !== -1);
    }
    return liste;
  }

  /* ---------- Depo erişimi ---------- */
  async function hamOku() {
    const d = await chrome.storage.local.get(STORAGE_KEY);
    return d ? d[STORAGE_KEY] : undefined;
  }

  async function yaz(store) {
    const yuk = { version: STORE_VERSION, notlar: store.notlar, recovered: false };
    // Kota hatası YUTULMAZ: çağıran arayüze iletir, kullanıcı "kaydedildi" sanmasın.
    await chrome.storage.local.set({ [STORAGE_KEY]: yuk });
    return yuk;
  }

  async function hepsiniAl() { return dogrula(await hamOku()); }

  /** Kimliğe göre bul; bulunamazsa (eski çağrılar) anahtar eşleşmesine düş. */
  function bulId(store, id) {
    const s = String(id == null ? '' : id);
    if (!s) return null;
    const notlar = (store && store.notlar) || [];
    const byId = notlar.find((x) => x.id === s);
    if (byId) return byId;
    const key = normalizeUrl(s);
    return key ? (notlar.find((x) => x.anahtar === key) || null) : null;
  }

  /** YENİ not ekler (sayfa başına sınırsız). Boş metin hata verir. */
  async function ekle(url, metin, ekAlan) {
    const anahtar = normalizeUrl(url);
    if (!anahtar) throw new Error('gecersiz-sayfa');
    // Şema da saklanır: "sayfayı aç" http ile kaydedilen notu doğru adrese götürsün.
    const sema = /^http:\/\//i.test(String(url == null ? '' : url)) ? 'http' : 'https';
    const temiz = String(metin == null ? '' : metin).slice(0, METIN_MAX);
    if (!temiz.trim()) throw new Error('metin-gerekli');
    const alan = temizAlanlar(ekAlan);
    const store = await hepsiniAl();
    const simdi = Date.now();
    const gorunum = alan.gorunum !== undefined ? alan.gorunum : GORUNUM_VARSAYILAN;
    const kayit = {
      id: yeniId(),
      anahtar, host: hostOf(anahtar), yol: yolOf(anahtar), metin: temiz, sema,
      renk: alan.renk !== undefined ? alan.renk : RENK_VARSAYILAN,
      gorunum,
      banner: gorunum === 'banner',
      siteGeneli: alan.siteGeneli === true,
      konum: alan.konum !== undefined ? alan.konum : null,
      olusturma: simdi, guncelleme: simdi, kucuk: false, gizleUntil: 0,
    };
    store.notlar.unshift(kayit);
    await yaz(store);
    return kayit;
  }

  async function notuAl(id) {
    const store = await hepsiniAl();
    return bulId(store, id);
  }

  async function sil(id) {
    const store = await hepsiniAl();
    const hedef = bulId(store, id);
    if (!hedef) throw new Error('kayit-yok');
    const at = store.notlar.indexOf(hedef);
    store.notlar.splice(at, 1);
    await yaz(store);
    return hedef.id;
  }

  async function guncelle(id, patch) {
    const store = await hepsiniAl();
    const k = bulId(store, id);
    if (!k) throw new Error('kayit-yok');
    const p = Object.assign({}, patch || {});
    if ('metin' in p && !String(p.metin == null ? '' : p.metin).trim()) throw new Error('metin-gerekli');
    if ('metin' in p) k.metin = String(p.metin == null ? '' : p.metin).slice(0, METIN_MAX);
    if ('renk' in p) k.renk = temizRenk(p.renk);
    if ('gorunum' in p) k.gorunum = temizGorunum(p.gorunum, p.banner === true);
    else if ('banner' in p) k.gorunum = p.banner === true ? 'banner' : 'postit';
    if ('siteGeneli' in p) k.siteGeneli = p.siteGeneli === true;
    if ('konum' in p) k.konum = temizKonum(p.konum);
    if ('kucuk' in p) k.kucuk = p.kucuk === true;
    if ('gizleUntil' in p) {
      const g = Number(p.gizleUntil);
      k.gizleUntil = Number.isFinite(g) ? g : 0;
    }
    // Küçültme YALNIZ post-it görünümünde anlamlı.
    if (k.gorunum !== 'postit') k.kucuk = false;
    // Türetilmiş alan: görünüm değişince `banner` de güncel kalsın.
    k.banner = k.gorunum === 'banner';
    k.guncelleme = Date.now();
    await yaz(store);
    return k;
  }

  /* ---------- Ayarlar ---------- */
  /** Tema doğrulama: yalnız 'acik' açık tema; bilinmeyen/bozuk değer 'koyu'ya düşer. */
  function temizTema(v) {
    return v === 'acik' ? 'acik' : 'koyu';
  }

  async function ayarlariAl() {
    try {
      const d = await chrome.storage.local.get(SETTINGS_KEY);
      const a = d ? d[SETTINGS_KEY] : null;
      if (!a || typeof a !== 'object') return Object.assign({}, VARSAYILAN_AYAR);
      const saat = Number(a.gizlemeSaat);
      return {
        lang: a.lang === 'en' ? 'en' : 'tr',
        gizlemeSaat: GIZLEME_SAAT.indexOf(saat) !== -1 ? saat : VARSAYILAN_AYAR.gizlemeSaat,
        sadeceAktif: a.sadeceAktif === true,
        tema: temizTema(a.tema),
      };
    } catch (e) {
      return Object.assign({}, VARSAYILAN_AYAR);
    }
  }

  async function ayarlariKaydet(patch) {
    const son = Object.assign({}, await ayarlariAl(), patch || {});
    await chrome.storage.local.set({ [SETTINGS_KEY]: son });
    return son;
  }

  /* ---------- Yedekleme (JSON) ---------- */
  function disaAktarMetni(store) {
    const s = store || { notlar: [] };
    return JSON.stringify({
      app: 'dtnot',
      schema: STORE_VERSION,
      exportedAt: new Date().toISOString(),
      notlar: s.notlar || [],
    }, null, 2);
  }

  /** Dışa aktarılan JSON'u çöz; şema dışı/bozuk dosyada hata fırlatır. */
  function iceAktarCoz(metin) {
    let v = null;
    try { v = JSON.parse(String(metin || '')); } catch (e) { throw new Error('gecersiz-json'); }
    const liste = v && Array.isArray(v.notlar) ? v.notlar : null;
    if (!liste) throw new Error('gecersiz-sema');
    return liste;
  }

  globalThis.DTNOT_STORE = {
    STORAGE_KEY, SETTINGS_KEY, STORE_VERSION, METIN_MAX, UYARI_NOT, GIZLEME_SAAT, VARSAYILAN_AYAR,
    RENKLER, RENK_VARSAYILAN, PALET, GORUNUMLER, GORUNUM_VARSAYILAN, SAYFA_LINK,
    normalizeUrl, hostOf, yolOf, yoluDuzle,
    temizNot, dogrula, grupla, birlestir, gorunurMu, sayfaUrl,
    temizRenk, temizGorunum, gorunumOf, temizId, yeniId, temizKonum, temizAlanlar,
    kisaltOrtadan, katla, sayfaNotlari, filtrele,
    hepsiniAl, ekle, notuAl, sil, guncelle, yaz, bulId,
    ayarlariAl, ayarlariKaydet, temizTema,
    disaAktarMetni, iceAktarCoz,
  };
})();
