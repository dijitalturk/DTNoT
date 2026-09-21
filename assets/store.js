/* DTNoT — depo ve doğrulama (TEK KAYNAK).
   Klasik script: popup/panel/ayarlar `<script>` ile yükler; arka plan Chrome'da
   importScripts, Firefox'ta manifest background.scripts ile yükler; Node testleri
   `vm` ile koşar. Depo anahtarları SABİT tutulur (web-not-store / web-not-settings) —
   değiştirmek mevcut kullanıcı verisini kaybettirir. */
(function () {
  'use strict';

  const STORAGE_KEY = 'web-not-store';
  const SETTINGS_KEY = 'web-not-settings';
  const STORE_VERSION = 1;
  const METIN_MAX = 4000;
  const UYARI_NOT = 300;
  const GIZLEME_SAAT = [1, 4, 24, 168];
  const VARSAYILAN_AYAR = { lang: 'tr', gizlemeSaat: 1, sadeceAktif: false };

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
  function temizNot(ham) {
    if (!ham || typeof ham !== 'object') return null;
    const anahtar = normalizeUrl(ham.anahtar);
    if (!anahtar) return null;
    const metin = String(ham.metin == null ? '' : ham.metin).slice(0, METIN_MAX);
    if (!metin.trim()) return null;
    const sayi = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
    return {
      anahtar,
      host: hostOf(anahtar),
      yol: yolOf(anahtar),
      metin,
      sema: ham.sema === 'http' ? 'http' : 'https',
      olusturma: sayi(ham.olusturma, Date.now()),
      guncelleme: sayi(ham.guncelleme, sayi(ham.olusturma, Date.now())),
      kucuk: ham.kucuk === true,
      gizleUntil: sayi(ham.gizleUntil, 0),
    };
  }

  /** Ham depoyu doğrula: bozuk kayıtları atar, aynı anahtarın en güncelini tutar. */
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
      const varolan = harita.get(t.anahtar);
      if (varolan && varolan.guncelleme >= t.guncelleme) { atilan += 1; return; }
      if (varolan) atilan += 1;
      harita.set(t.anahtar, t);
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

  async function ekle(url, metin) {
    const anahtar = normalizeUrl(url);
    if (!anahtar) throw new Error('gecersiz-sayfa');
    // Şema da saklanır: "sayfayı aç" http ile kaydedilen notu doğru adrese götürsün.
    const sema = /^http:\/\//i.test(String(url == null ? '' : url)) ? 'http' : 'https';
    const temiz = String(metin == null ? '' : metin).slice(0, METIN_MAX);
    const store = await hepsiniAl();
    const simdi = Date.now();
    const varolan = store.notlar.find((x) => x.anahtar === anahtar);
    if (!temiz.trim()) {
      if (!varolan) throw new Error('metin-gerekli');
      return varolan;
    }
    if (varolan) {
      varolan.metin = temiz;
      varolan.sema = sema;
      varolan.guncelleme = simdi;
      varolan.kucuk = false;
      varolan.gizleUntil = 0;
      await yaz(store);
      return varolan;
    }
    const kayit = {
      anahtar, host: hostOf(anahtar), yol: yolOf(anahtar), metin: temiz, sema,
      olusturma: simdi, guncelleme: simdi, kucuk: false, gizleUntil: 0,
    };
    store.notlar.unshift(kayit);
    await yaz(store);
    return kayit;
  }

  async function notuAl(anahtar) {
    const store = await hepsiniAl();
    const k = store.notlar.find((x) => x.anahtar === normalizeUrl(anahtar));
    return k || null;
  }

  async function sil(anahtar) {
    const store = await hepsiniAl();
    const hedef = normalizeUrl(anahtar);
    const at = store.notlar.findIndex((x) => x.anahtar === hedef);
    if (at === -1) throw new Error('kayit-yok');
    const [giden] = store.notlar.splice(at, 1);
    await yaz(store);
    return giden.anahtar;
  }

  async function guncelle(anahtar, patch) {
    const store = await hepsiniAl();
    const k = store.notlar.find((x) => x.anahtar === normalizeUrl(anahtar));
    if (!k) throw new Error('kayit-yok');
    Object.assign(k, patch || {});
    if (k.metin != null) k.metin = String(k.metin).slice(0, METIN_MAX);
    k.guncelleme = Date.now();
    await yaz(store);
    return k;
  }

  /* ---------- Ayarlar ---------- */
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
    normalizeUrl, hostOf, yolOf, yoluDuzle,
    temizNot, dogrula, grupla, birlestir, gorunurMu, sayfaUrl,
    hepsiniAl, ekle, notuAl, sil, guncelle, yaz,
    ayarlariAl, ayarlariKaydet,
    disaAktarMetni, iceAktarCoz,
  };
})();
