// DTNoT — test paketi (npm bağımlılığı YOK; `node tests/dtnot-test.mjs`).
// Bölümler: 1) depo mantığı  2) i18n bütünlüğü  3) mesajlaşma deseni  4) manifest/paket kilidi
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const oku = (p) => fs.readFileSync(path.join(KOK, p), 'utf8');

let gecen = 0;
let kalan = 0;
async function test(ad, fn) {
  try { await fn(); gecen += 1; console.log(`  ✓ ${ad}`); }
  catch (e) { kalan += 1; console.log(`  ✗ ${ad}\n      ${e.message}`); }
}

/* ---------- Sahte chrome.storage.local ---------- */
const mem = {};
globalThis.chrome = {
  storage: {
    local: {
      async get(k) {
        if (k == null) return Object.assign({}, mem);
        if (typeof k === 'string') return (k in mem) ? { [k]: mem[k] } : {};
        if (Array.isArray(k)) { const o = {}; k.forEach((x) => { if (x in mem) o[x] = mem[x]; }); return o; }
        return {};
      },
      async set(o) { Object.assign(mem, o); },
      async remove(k) { delete mem[k]; },
    },
  },
};

// store.js + i18n.js klasik script → bu bağlamda yükle
new Function('chrome', oku('assets/store.js'))(globalThis.chrome);
globalThis.DTNOT_STORE = globalThis.DTNOT_STORE; // no-op (okunabilirlik)
new Function('chrome', oku('assets/i18n.js'))(globalThis.chrome);

const S = globalThis.DTNOT_STORE;
const I = globalThis.DTNOT_I18N;

/* ================= 1) Depo mantığı ================= */
console.log('1) Depo mantığı (assets/store.js)');

await test('normalizeUrl: www korunur, sorgu/hash atılır, sondaki / kırpılır',
  () => assert.equal(S.normalizeUrl('https://www.Example.com/urun/123/?q=1#x'), 'www.example.com/urun/123'));
await test('normalizeUrl: port korunur (localhost)', () => assert.equal(S.normalizeUrl('http://localhost:3000/'), 'localhost:3000/'));
await test('normalizeUrl: kök yol "/" olur', () => assert.equal(S.normalizeUrl('https://a.com'), 'a.com/'));
await test('normalizeUrl: şema farkı anahtarı değiştirmez (http/https aynı not)',
  () => assert.equal(S.normalizeUrl('http://x.com/y'), S.normalizeUrl('https://x.com/y')));
await test('normalizeUrl: geçersiz/özel şemalar boş döner',
  () => ['', 'chrome://extensions', 'about:blank', '   '].forEach((x) => assert.equal(S.normalizeUrl(x), '')));
await test('hostOf/yolOf ayrıştırması', () => {
  assert.equal(S.hostOf('a.com/x/y'), 'a.com');
  assert.equal(S.yolOf('a.com/x/y'), '/x/y');
  assert.equal(S.yolOf('a.com'), '/');
});

await test('dogrula: bozuk kayıtları atar, recovered bayrağı verir', () => {
  const s = S.dogrula({ version: 1, notlar: [null, {}, { anahtar: '', metin: 'x' }, { anahtar: 'a.com/', metin: '  ' }, { anahtar: 'a.com/', metin: 'geçerli' }] });
  assert.equal(s.notlar.length, 1);
  assert.equal(s.recovered, true);
});
await test('dogrula: aynı anahtarın en günceli kalır', () => {
  const s = S.dogrula({ version: 1, notlar: [
    { anahtar: 'a.com/', metin: 'eski', guncelleme: 100 },
    { anahtar: 'a.com/', metin: 'yeni', guncelleme: 200 },
  ] });
  assert.equal(s.notlar.length, 1);
  assert.equal(s.notlar[0].metin, 'yeni');
});
await test('dogrula: güncellemeye göre azalan sıralar', () => {
  const s = S.dogrula({ version: 1, notlar: [
    { anahtar: 'a.com/', metin: 'a', guncelleme: 1 },
    { anahtar: 'b.com/', metin: 'b', guncelleme: 9 },
  ] });
  assert.deepEqual(s.notlar.map((x) => x.anahtar), ['b.com/', 'a.com/']);
});
await test('dogrula: null/bozuk gövde boş depo döner (çökmez)', () => {
  assert.equal(S.dogrula(null).notlar.length, 0);
  assert.equal(S.dogrula('metin').recovered, true);
});

await test('ekle + hepsiniAl + notuAl', async () => {
  await S.ekle('https://example.com/a', 'ilk not');
  const s = await S.hepsiniAl();
  assert.equal(s.notlar.length, 1);
  const n = await S.notuAl('https://example.com/a');
  assert.equal(n.metin, 'ilk not');
  assert.equal(n.host, 'example.com');
  assert.equal(n.yol, '/a');
  assert.equal(n.sema, 'https');
});
await test('ekle: http şeması saklanır (sayfa aç düzeltmesi)', async () => {
  await S.ekle('http://oldsite.com/x', 'http notu');
  const n = await S.notuAl('http://oldsite.com/x');
  assert.equal(n.sema, 'http');
  assert.equal(S.sayfaUrl(n), 'http://oldsite.com/x');
  const h = await S.notuAl('https://example.com/a');
  assert.equal(S.sayfaUrl(h), 'https://example.com/a');
});
await test('ekle: aynı sayfaya ikinci kayıt güncelleme yapar, kucuk/gizle sıfırlanır', async () => {
  await S.guncelle('example.com/a', { kucuk: true, gizleUntil: Date.now() + 10000 });
  const onceki = await S.notuAl('example.com/a');
  await S.ekle('https://example.com/a', 'güncellenmiş not');
  const son = await S.notuAl('example.com/a');
  assert.equal(son.metin, 'güncellenmiş not');
  assert.equal(son.kucuk, false);
  assert.equal(son.gizleUntil, 0);
  assert.ok(son.guncelleme >= onceki.guncelleme);
  assert.equal((await S.hepsiniAl()).notlar.length, 2);
});
await test('ekle: geçersiz sayfa ve boş metin hata verir', async () => {
  await assert.rejects(() => S.ekle('chrome://x', 'y'), /gecersiz-sayfa/);
  await assert.rejects(() => S.ekle('https://yeni.com/', '   '), /metin-gerekli/);
});
await test('metin 4000 karaktere kırpılır', async () => {
  const uzun = 'a'.repeat(5000);
  await S.ekle('https://uzun.com/', uzun);
  const n = await S.notuAl('https://uzun.com/');
  assert.equal(n.metin.length, S.METIN_MAX);
});
await test('sil: kayıt yoksa hata, varsa siler', async () => {
  await assert.rejects(() => S.sil('yok.com/'), /kayit-yok/);
  const anahtar = await S.sil('uzun.com/');
  assert.equal(anahtar, 'uzun.com/');
  assert.equal(await S.notuAl('uzun.com/'), null);
});
await test('gorunurMu: gizleme süresi geçmişse görünür', () => {
  const gecmis = { gizleUntil: Date.now() - 10 };
  const gelecek = { gizleUntil: Date.now() + 10000 };
  assert.equal(S.gorunurMu(gecmis), true);
  assert.equal(S.gorunurMu(gelecek), false);
  assert.equal(S.gorunurMu(null), false);
});
await test('birlestir/merge: çakışmada en güncel kazanır', () => {
  const birlesik = S.birlestir(
    [{ anahtar: 'a.com/', metin: 'mevcut', guncelleme: 100 }],
    [{ anahtar: 'a.com/', metin: 'gelen', guncelleme: 300 }],
    'merge');
  assert.equal(birlesik.notlar.length, 1);
  assert.equal(birlesik.notlar[0].metin, 'gelen');
});
await test('birlestir/replace: mevcut notları değiştirir', () => {
  const sonuc = S.birlestir(
    [{ anahtar: 'a.com/', metin: 'mevcut', guncelleme: 100 }],
    [{ anahtar: 'z.com/', metin: 'gelen', guncelleme: 1 }],
    'replace');
  assert.deepEqual(sonuc.notlar.map((x) => x.anahtar), ['z.com/']);
});
await test('JSON dışa aktar → içe aktar turu bozulmadan döner', async () => {
  const metin = S.disaAktarMetni(await S.hepsiniAl());
  const geri = S.iceAktarCoz(metin);
  assert.equal(geri.length, (await S.hepsiniAl()).notlar.length);
});
await test('içe aktarma: bozuk JSON ve şema dışı dosya hata verir', () => {
  assert.throws(() => S.iceAktarCoz('{bozuk'), /gecersiz-json/);
  assert.throws(() => S.iceAktarCoz('{"app":"x"}'), /gecersiz-sema/);
});
await test('grupla: site bazlı gruplar', () => {
  const g = S.grupla([
    { anahtar: 'a.com/x', host: 'a.com' }, { anahtar: 'a.com/y', host: 'a.com' }, { anahtar: 'b.com/', host: 'b.com' },
  ]);
  assert.equal(g.length, 2);
  assert.equal(g[0].notlar.length, 2);
});

/* ================= 2) i18n bütünlüğü ================= */
console.log('\n2) i18n bütünlüğü (assets/i18n.js)');

await test('TR ve EN sözlüklerinde anahtar kümeleri birebir aynı', () => {
  const tr = Object.keys(I.DICT.tr).sort();
  const en = Object.keys(I.DICT.en).sort();
  const eksik = tr.filter((k) => !en.includes(k));
  const fazla = en.filter((k) => !tr.includes(k));
  assert.deepEqual(eksik, [], 'EN sözlüğünde eksik: ' + eksik.join(', '));
  assert.deepEqual(fazla, [], 'TR sözlüğünde eksik: ' + fazla.join(', '));
});
await test('arayüzlerde kullanılan her anahtar sözlükte var', () => {
  const kaynaklar = ['popup.js', 'panel.js', 'options.js', 'content.js', 'background.js'];
  const eksikler = [];
  for (const dosya of kaynaklar) {
    const kod = oku(dosya);
    const bulunan = kod.match(/[^a-zA-Z]T?t\(\s*'([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)'/g) || [];
    bulunan.forEach((eslesme) => {
      const anahtar = (eslesme.match(/'([^']+)'/) || [])[1];
      if (anahtar && !(anahtar in I.DICT.tr)) eksikler.push(`${dosya}: ${anahtar}`);
    });
  }
  assert.deepEqual(eksikler, []);
});
await test('t(): değişken yerleştirme ve dil düşüşü çalışır', () => {
  assert.equal(I.t('panel.toplam', { n: 3 }), '3 not');
  assert.equal(I.t('yok.boyle.anahtar'), 'yok.boyle.anahtar');
});
await test('_locales: TR/EN messages.json anahtar kümeleri aynı (mağaza metinleri)', () => {
  const tr = JSON.parse(oku('_locales/tr/messages.json'));
  const en = JSON.parse(oku('_locales/en/messages.json'));
  assert.deepEqual(Object.keys(tr).sort(), Object.keys(en).sort(), 'TR/EN mağaza sözlükleri ayrışmış');
  assert.equal(tr.ayarYeniSayfada.message, 'Yeni sayfada aç');
  assert.equal(en.ayarYeniSayfada.message, 'Open in new tab');
});

/* ================= 3) Mesajlaşma deseni (Chrome + Firefox) ================= */
console.log('\n3) Mesajlaşma deseni');

await test('background.js: sendResponse + return true, async dinleyici YOK', () => {
  const kod = oku('background.js');
  assert.ok(!/onMessage\.addListener\(\s*async/.test(kod), 'async dinleyici → Chrome yanıtı taşımaz');
  assert.match(kod, /yanitla\(sonuc\)/, 'sendResponse kullanılmıyor');
  assert.match(kod, /return true; \/\/ kanalı açık tut/, 'kanal açık tutulmuyor');
});
await test('content.js: Promise dönüşü yok, sendResponse var', () => {
  const kod = oku('content.js');
  assert.ok(!/return Promise\.resolve/.test(kod));
  assert.match(kod, /yanitla\(\{ canli: true/);
});
await test('içerik betiği depo/normalizeUrl kopyası İÇERMİYOR (tek kaynak)', () => {
  const kod = oku('content.js');
  assert.ok(!/function normalizeUrl/.test(kod), 'content.js içinde normalizeUrl kopyası var!');
  assert.match(kod, /S\.normalizeUrl/);
});

/* ================= 4) Manifest / paket kilidi ================= */
console.log('\n4) Manifest ve paket kilidi');

const m = JSON.parse(oku('manifest.json'));

await test('manifest: Chrome (service_worker) + Firefox (scripts) birlikte tanımlı', () => {
  assert.equal(m.background.service_worker, 'background.js');
  assert.deepEqual(m.background.scripts, ['assets/store.js', 'assets/i18n.js', 'background.js']);
  assert.ok(!m.background.type, 'type: module olmamalı (importScripts ile klasik yükleme)');
});
await test('manifest: aktif sayfa URL’si için activeTab izni var', () => {
  assert.ok(m.permissions.includes('activeTab'), 'activeTab yoksa izin verilmeden not eklenemez');
  assert.ok(m.permissions.includes('scripting'));
  assert.ok(m.permissions.includes('contextMenus'));
  assert.ok(m.permissions.includes('storage'));
});
await test('manifest: geniş host izni ZORUNLU değil, opsiyonel', () => {
  assert.ok(!m.host_permissions, 'host_permissions zorunlu olmamalı');
  assert.deepEqual(m.optional_host_permissions, ['*://*/*']);
});
await test('manifest: mağaza yerelleştirmesi (default_locale + __MSG__)', () => {
  assert.equal(m.default_locale, 'tr');
  assert.match(m.name, /^__MSG_appName__$/);
  assert.match(m.description, /^__MSG_appDesc__$/);
  const tr = JSON.parse(oku('_locales/tr/messages.json'));
  const en = JSON.parse(oku('_locales/en/messages.json'));
  ['appName', 'appDesc'].forEach((k) => {
    assert.ok(tr[k] && tr[k].message, `tr/${k} yok`);
    assert.ok(en[k] && en[k].message, `en/${k} yok`);
  });
});
await test('manifest: her sayfa i18n + store betiklerini yüklüyor', () => {
  ['popup.html', 'panel.html', 'options.html'].forEach((sayfa) => {
    const html = oku(sayfa);
    assert.match(html, /src="assets\/store\.js"/, `${sayfa}: store.js yok`);
    assert.match(html, /src="assets\/i18n\.js"/, `${sayfa}: i18n.js yok`);
    assert.match(html, /src="assets\/ui\.css"|href="assets\/ui\.css"/, `${sayfa}: ui.css yok`);
  });
});
await test('manifest: gösterilen dosyalar diskte var', () => {
  const listesi = [m.action.default_popup, m.options_ui.page].concat(Object.values(m.icons), Object.values(m.action.default_icon));
  listesi.forEach((y) => assert.ok(fs.existsSync(path.join(KOK, y)), `yok: ${y}`));
});
await test('ikonlar üretilmiş (16/32/48/96/128)', () => {
  [16, 32, 48, 96, 128].forEach((b) => assert.ok(fs.existsSync(path.join(KOK, `icons/dtnot-${b}.png`)), `ikon yok: ${b}`));
});
await test('ui.css: [hidden] kuralı var (all: unset gizlemeyi ezmesin)', () => {
  const css = oku('assets/ui.css');
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/, '[hidden] kuralı yok → gizli bölümler görünür');
});
await test('panel.js: arama katlaması store.katla üzerinden (tek kaynak)', () => {
  const kod = oku('panel.js');
  const depo = oku('assets/store.js');
  assert.match(kod, /S\.filtrele\(/, 'panel store.filtrele kullanmıyor');
  assert.match(depo, /function katla/, 'store.js içinde katla yok');
  assert.ok(!/function katla/.test(kod), 'panel.js içinde katla kopyası var');
});

/* ================= 5) Renk · banner · site geneli · konum ================= */
console.log('\n5) Renk / banner / konum kuralları');

await test('palet: her rengin 5 alanı dolu (bg, kenar, metin, ikon, ikonBg)', () => {
  S.RENKLER.forEach((r) => {
    const p = S.PALET[r];
    assert.ok(p, `palet yok: ${r}`);
    ['bg', 'kenar', 'metin', 'ikon', 'ikonBg'].forEach((a) => assert.match(String(p[a]), /^#[0-9a-f]{6}$/i, `${r}.${a}`));
  });
  assert.equal(S.RENKLER.length, 6, '6 renk olmalı');
});
await test('renk: geçersiz/eksik değer varsayılana düşer (şema bozulmaz)', () => {
  assert.equal(S.temizRenk(undefined), 'sari');
  assert.equal(S.temizRenk('neon'), 'sari');
  assert.equal(S.temizRenk('mavi'), 'mavi');
  const s = S.dogrula({ notlar: [{ anahtar: 'a.com/', metin: 'x' }] });
  assert.equal(s.notlar[0].renk, 'sari');
  assert.equal(s.notlar[0].banner, false);
  assert.equal(s.notlar[0].siteGeneli, false);
  assert.equal(s.notlar[0].konum, null);
});
await test('banner kapalıysa siteGeneli YOK SAYILIR', () => {
  const s = S.dogrula({ notlar: [{ anahtar: 'a.com/', metin: 'x', banner: false, siteGeneli: true }] });
  assert.equal(s.notlar[0].banner, false);
  assert.equal(s.notlar[0].siteGeneli, false, 'banner kapalıyken siteGeneli true kalmamalı');
  const s2 = S.dogrula({ notlar: [{ anahtar: 'a.com/', metin: 'x', banner: true, siteGeneli: true }] });
  assert.equal(s2.notlar[0].siteGeneli, true);
});
await test('konum: 0..1 aralığına kırpılır, bozuk değer null olur', () => {
  assert.deepEqual(S.temizKonum({ x: 0.5, y: 2 }), { x: 0.5, y: 1 });
  assert.deepEqual(S.temizKonum({ x: -1, y: 0.25 }), { x: 0, y: 0.25 });
  assert.equal(S.temizKonum({ x: 'abc', y: 0.5 }), null);
  assert.equal(S.temizKonum(null), null);
});
await test('ekle: renk/banner/siteGeneli birlikte kaydedilir', async () => {
  await S.ekle('https://renkli.com/a', 'mavi not', { renk: 'mavi', banner: true, siteGeneli: true });
  const n = await S.notuAl('renkli.com/a');
  assert.equal(n.renk, 'mavi');
  assert.equal(n.banner, true);
  assert.equal(n.siteGeneli, true);
  await S.ekle('https://renkli.com/a', 'pembe not', { renk: 'pembe', banner: true, siteGeneli: false });
  const n2 = await S.notuAl('renkli.com/a');
  assert.equal(n2.renk, 'pembe');
  assert.equal(n2.siteGeneli, false);
});
await test('guncelle: banner kapatılınca siteGeneli de kapanır', async () => {
  await S.guncelle('renkli.com/a', { banner: true, siteGeneli: true });
  assert.equal((await S.notuAl('renkli.com/a')).siteGeneli, true);
  await S.guncelle('renkli.com/a', { banner: false });
  const n = await S.notuAl('renkli.com/a');
  assert.equal(n.banner, false);
  assert.equal(n.siteGeneli, false);
});
await test('kisaltOrtadan: kısa metin aynen, uzun metin ortadan kısaltılır', () => {
  assert.equal(S.kisaltOrtadan('kisa', 20), 'kisa');
  const uzun = 'https://cok-uzun-bir-site-adi.com/ve/uzun/bir/yol/urun-adi-12345';
  const kisa = S.kisaltOrtadan(uzun, 30);
  assert.equal(kisa.length, 30);
  assert.ok(kisa.indexOf('…') !== -1, 'ortada … olmalı');
  assert.ok(kisa.startsWith('https://'), 'baş kısmı korunmalı');
  assert.ok(kisa.endsWith('12345'), 'son kısmı korunmalı');
});

/* ================= 6) Sayfada ne gösterilecek (sayfaNotu) ================= */
console.log('\n6) Sayfa görünümü seçimi');

function depo(notlar) { return S.dogrula({ version: 1, notlar: notlar }); }

await test('sayfaNotu: normal not post-it olur, banner olmaz', () => {
  const d = depo([{ anahtar: 'a.com/x', metin: 'normal' }]);
  const r = S.sayfaNotu(d, 'https://a.com/x');
  assert.equal(r.postit.metin, 'normal');
  assert.equal(r.banner, null);
});
await test('sayfaNotu: banner notu post-it yerine geçer', () => {
  const d = depo([{ anahtar: 'a.com/x', metin: 'duyuru', banner: true }]);
  const r = S.sayfaNotu(d, 'https://a.com/x');
  assert.equal(r.postit, null, 'banner açıkken post-it gösterilmez');
  assert.equal(r.banner.metin, 'duyuru');
});
await test('sayfaNotu: site geneli banner AYNI SİTENİN başka sayfasında da görünür', () => {
  const d = depo([{ anahtar: 'a.com/x', metin: 'site duyurusu', banner: true, siteGeneli: true }]);
  const r = S.sayfaNotu(d, 'https://a.com/tamamen/baska/sayfa');
  assert.ok(r.banner, 'site geneli banner başka sayfada görünmeli');
  assert.equal(r.banner.metin, 'site duyurusu');
});
await test('sayfaNotu: site geneli YALNIZ aynı sitede; farklı sitede görünmez', () => {
  const d = depo([{ anahtar: 'a.com/x', metin: 'a duyurusu', banner: true, siteGeneli: true }]);
  assert.equal(S.sayfaNotu(d, 'https://baska.com/y').banner, null);
  assert.equal(S.sayfaNotu(d, 'https://a.com/y').banner.metin, 'a duyurusu');
  // www ayrı site sayılır (normalizeUrl kuralı)
  assert.equal(S.sayfaNotu(d, 'https://www.a.com/y').banner, null);
});
await test('sayfaNotu: gizlenen (snooze) banner gösterilmez', () => {
  const d = depo([{ anahtar: 'a.com/x', metin: 'duyuru', banner: true, gizleUntil: Date.now() + 60000 }]);
  assert.equal(S.sayfaNotu(d, 'https://a.com/x').banner, null);
});
await test('sayfaNotu: tam sayfa bannerı site genelinden önce gelir', () => {
  const d = depo([
    { anahtar: 'a.com/x', metin: 'bu sayfanın', banner: true, guncelleme: 1 },
    { anahtar: 'a.com/y', metin: 'site geneli', banner: true, siteGeneli: true, guncelleme: 9 },
  ]);
  assert.equal(S.sayfaNotu(d, 'https://a.com/x').banner.metin, 'bu sayfanın');
  assert.equal(S.sayfaNotu(d, 'https://a.com/z').banner.metin, 'site geneli');
});

/* ================= 7) Panel süzgeci (renk + arama + site) ================= */
console.log('\n7) Panel süzgeci');

const ornekler = [
  { anahtar: 'a.com/urun', host: 'a.com', metin: 'İkinci not', renk: 'mavi' },
  { anahtar: 'a.com/diger', host: 'a.com', metin: 'başka', renk: 'sari' },
  { anahtar: 'b.com/', host: 'b.com', metin: 'üçüncü', renk: 'mavi' },
];
await test('filtrele: renk filtresi', () => {
  assert.equal(S.filtrele(ornekler, { renk: 'mavi' }).length, 2);
  assert.equal(S.filtrele(ornekler, { renk: 'sari' }).length, 1);
  assert.equal(S.filtrele(ornekler, { renk: 'tumu' }).length, 3);
});
await test('filtrele: arama TR İ tuzağı olmadan çalışır', () => {
  assert.equal(S.filtrele(ornekler, { q: 'İkinci' }).length, 1);
  assert.equal(S.filtrele(ornekler, { q: 'ikinci' }).length, 1);
  assert.equal(S.filtrele(ornekler, { q: 'IKINCI' }).length, 1);
  assert.equal(S.filtrele(ornekler, { q: 'yok' }).length, 0);
});
await test('filtrele: renk + arama + site birlikte', () => {
  assert.equal(S.filtrele(ornekler, { renk: 'mavi', host: 'a.com' }).length, 1);
  assert.equal(S.filtrele(ornekler, { renk: 'mavi', host: 'b.com', q: 'üç' }).length, 1);
});
await test('i18n: 6 rengin adı iki dilde de tanımlı', () => {
  S.RENKLER.forEach((r) => {
    assert.ok(I.DICT.tr['renk.' + r], `tr renk.${r} yok`);
    assert.ok(I.DICT.en['renk.' + r], `en renk.${r} yok`);
  });
});

/* ================= 8) İçerik betiği: banner + sürükleme kilidi ================= */
console.log('\n8) İçerik betiği kilidi');

await test('content.js: banner çizimi + SAYFA_NOTU mesajı', () => {
  const kod = oku('content.js');
  assert.match(kod, /cizBanner/);
  assert.match(kod, /BANNER_ID = 'dtnot-banner'/);
  assert.match(kod, /mesaj\('SAYFA_NOTU'/, 'SAYFA_NOTU kullanılmıyor');
  assert.match(kod, /siteGeneli/, 'site geneli etiketi yok');
});
await test('content.js: sürükle-bırak konum kaydediyor (oran olarak)', () => {
  const kod = oku('content.js');
  assert.match(kod, /pointerdown/);
  assert.match(kod, /pointermove/);
  assert.match(kod, /konum: oran/, 'konum kaydedilmiyor');
  assert.match(kod, /innerWidth - r\.width/, 'konum oranı yanlış hesaplanıyor');
});
await test('panel.js: renk filtresi store.filtrele üzerinden (tek kaynak)', () => {
  const kod = oku('panel.js');
  assert.match(kod, /S\.filtrele\(/);
  assert.ok(!/function katla/.test(kod), 'katla kopyası kalmış (store tek kaynak olmalı)');
});
await test('popup.js: 6 renk seçici + banner/siteGeneli akışı bağlı', () => {
  const kod = oku('popup.js');
  assert.match(kod, /renkSeciciCiz/);
  assert.match(kod, /S\.RENKLER/);
  assert.match(kod, /siteGeneliChk'\)\.disabled = !form\.banner/);
  assert.match(kod, /renk: form\.renk/);
});
await test('options.js: sürüm etiketi ayrı anahtardan (bozuk görünüm düzeltildi)', () => {
  const kod = oku('options.js');
  assert.match(kod, /T\('ayar\.surumEtiket'\)/);
  assert.ok(!/T\('ayar\.surum', ''\)/.test(kod), 'eski bozuk kullanım kalmış');
});

/* ================= 9) Arayüz ince ayarları (0.2.1) ================= */
console.log('\n9) Arayüz ince ayarları');

await test('ui.css: dil bayrakları YAN YANA (flex + nowrap)', () => {
  const css = oku('assets/ui.css');
  assert.match(css, /\.diller\s*\{[^}]*display:\s*flex/, '.diller flex değil');
  assert.match(css, /\.diller\s*\{[^}]*flex:\s*none/, '.diller sıkışıp alt satıra kayabilir');
  assert.match(css, /\.diller\s*\{[^}]*white-space:\s*nowrap/, 'nowrap yok');
  assert.match(css, /\.dil-dugme\s*\{[^}]*display:\s*inline-flex/, 'bayrak düğmesi inline-flex değil');
});
await test('ui.css: seçili renk vurgusu net (çift halka + ✓)', () => {
  const css = oku('assets/ui.css');
  assert.match(css, /\.renk-sec\[aria-pressed="true"\]\s*\{[^}]*transform:\s*scale\(1\.1[0-9]?\)/, 'seçili renk büyümüyor');
  assert.match(css, /\.renk-sec\[aria-pressed="true"\]\s*\{[^}]*0 0 0 4px var\(--vurgu\)/, 'vurgu halkası yok');
  assert.match(css, /\.renk-sec\[aria-pressed="true"\]::after\s*\{[^}]*content:\s*'✓'/, '✓ işareti yok');
});
await test('popup: genişlik artırıldı (448px) + alt bağlantı var', () => {
  const css = oku('assets/ui.css');
  const html = oku('popup.html');
  assert.match(css, /body\.popup\s*\{\s*width:\s*448px/);
  assert.match(html, /id="dtLink"/, 'DijitalTurk.com bağlantısı yok');
  assert.match(html, /DijitalTurk\.com/);
  assert.match(html, /<svg/, 'bağlantı ikonu (svg) yok');
  assert.match(html, /id="renkSecili"/, 'seçili renk etiketi yok');
});
await test('ui.css: üst bar ikonları bayraklarla AYNI ölçüde (34×30, flex:none)', () => {
  const css = oku('assets/ui.css');
  const blok = css.match(/\.topbar__sag \.ikon-dugme[\s\S]{0,420}?\}/);
  assert.ok(blok, 'üst bar ikon kutusu kuralı yok');
  assert.match(blok[0], /flex:\s*none/, 'ikonlar flex:none değil (sıkışabilir)');
  assert.match(blok[0], /width:\s*34px/, 'ikon genişliği bayrakla eşit değil');
  assert.match(blok[0], /height:\s*30px/, 'ikon yüksekliği bayrakla eşit değil');
  assert.match(blok[0], /\.topbar__sag \.dil-dugme/, 'bayrak düğmesi de aynı kutuya alınmalı');
});
await test('popup.js: YALNIZ panel (Notlarım) yeni sekmede açılıp popup kapanıyor', () => {
  const kod = oku('popup.js');
  assert.match(kod, /async function sekmeAc[\s\S]{0,400}window\.close\(\)/, 'window.close() yok');
  assert.match(kod, /\$\('panelAc'\)\.addEventListener\('click', \(\) => sekmeAc\('panel\.html'\)\)/, 'panel yeni sekmede açılmıyor');
  assert.ok(!/sekmeAc\('options\.html'\)/.test(kod), 'Ayarlar hâlâ sekme açıp popup’ı kapatıyor');
  assert.match(kod, /renkSecili.*not\.renkSecili|not\.renkSecili/, 'seçili renk etiketi güncellenmiyor');
});
await test('popup: Ayarlar POPUP İÇİNDE açılıyor (yeni pencere/sekme yok, popup kapanmaz)', () => {
  const html = oku('popup.html');
  const kod = oku('popup.js');
  assert.match(html, /id="ayarKutu"[\s\S]{0,200}?hidden/, 'popup içinde kapalı Ayarlar bölümü yok');
  assert.match(html, /id="gizleme" class="secici"/, 'popup’ta gizleme süresi seçicisi yok');
  assert.match(html, /id="sadeceAktif"/, 'popup’ta Notlarım davranışı onayı yok');
  assert.match(html, /id="ayarAc"[^>]*aria-pressed="false"/, 'Ayarlar düğmesi etkin durumu bildirmiyor');
  assert.match(kod, /async function ayarModu[\s\S]{0,400}\$\('ayarKutu'\)\.hidden = !ac/, 'ayarModu bölümü açmıyor');
  assert.match(kod, /\$\('ayarAc'\)\.addEventListener\('click', \(\) => ayarModu\(/, 'Ayarlar düğmesi popup içi görünümü açmıyor');
  assert.match(kod, /S\.ayarlariKaydet\(\{ gizlemeSaat: yeni \}\)/, 'gizleme süresi kaydedilmiyor');
  assert.match(kod, /S\.ayarlariKaydet\(\{ sadeceAktif: e\.target\.checked \}\)/, 'Notlarım davranışı kaydedilmiyor');
});
await test('popup: “Yeni sayfada aç” bağlantısı openOptionsPage + tabs.create yedeği', () => {
  const html = oku('popup.html');
  const kod = oku('popup.js');
  assert.match(html, /id="yeniSayfadaAc" class="altbilgi__link"/, 'standart .altbilgi__link sınıfı yok');
  assert.match(html, /href="options\.html"/, 'tam ayar sayfası bağlantısı yok');
  assert.match(kod, /runtime\.openOptionsPage\(\)/, 'openOptionsPage kullanılmıyor');
  assert.match(kod, /tabs\.create\(\{ url: rt\.getURL\('options\.html'\) \}\)/, 'tabs.create yedeği yok');
  assert.match(kod, /\$\('yeniSayfadaAc'\)\.addEventListener\('click',[\s\S]{0,140}e\.preventDefault\(\)/, 'bağlantı varsayılan davranışa bırakılmış (çift sekme riski)');
});
await test('Ayarlar: DİL bölümü/seçici kaldırıldı (i18n altyapısı durur)', () => {
  const html = oku('options.html');
  const kod = oku('options.js');
  assert.ok(!/govdeDil|baslikDil|ozetDil|dilSatir/.test(html), 'options.html içinde Dil bölümü kalmış');
  assert.ok(!/baslikDil|ozetDil|dilNot|dilSatir/.test(kod), 'options.js hâlâ Dil bölümünü dolduruyor');
  assert.ok(!/id="diller"/.test(html), 'Ayarlar üst barında TR/EN bayrakları kalmış (dil seçici tamamen kalkmalı)');
  assert.ok(!/I\.bayraklar\(/.test(kod), 'options.js hâlâ bayrak düğmeleri çiziyor');
  assert.match(kod, /I\.hazirla\(\)/, 'i18n altyapısı (hazirla) kaldırılmış');
  assert.match(oku('assets/i18n.js'), /'ayar\.dil'/, 'i18n sözlüğü korunmalı');
  assert.match(oku('assets/i18n.js'), /'ayar\.dilNot'/, 'i18n sözlüğü korunmalı');
});
await test('Ayarlar: “Hakkında” bölümü VARSAYILAN AÇIK, diğer varsayılanlar korunuyor', () => {
  const html = oku('options.html');
  const hakkinda = html.match(/<section[^>]*data-acik="true"[^>]*>\s*<button[^>]*aria-controls="govdeHakkinda"[\s\S]{0,900}?<\/section>/);
  assert.ok(hakkinda, 'Hakkında bölümü bulunamadı / data-acik="true" değil');
  assert.match(hakkinda[0], /aria-expanded="true"/, 'aria-expanded true değil');
  assert.match(hakkinda[0], /id="govdeHakkinda"(?![^>]*hidden)/, 'Hakkında gövdesi hâlâ hidden');
  assert.match(hakkinda[0], /class="katlanir__ok"[^>]*>▾/, 'ok açık duruma (▾) getirilmemiş');
  // Diğer bölümlerin varsayılanları korunmalı: Davranış açık, Veri kapalı
  assert.match(html, /<section[^>]*data-acik="true"[^>]*>\s*<button[^>]*aria-controls="govdeDavranis"/, 'Davranış varsayılanı bozulmuş (açık olmalı)');
  assert.match(html, /<section[^>]*data-acik="false"[^>]*>\s*<button[^>]*aria-controls="govdeVeri"/, 'Veri varsayılanı bozulmuş (kapalı olmalı)');
  assert.match(html, /id="govdeVeri" hidden/, 'Veri gövdesi kapalı gelmiyor');
  assert.match(oku('options.js'), /uygula\(bolum\.dataset\.acik !== 'false'\)/, 'katlanir varsayılanı data-acik üzerinden kurulmuyor');
});
await test('content.js: banner sayfayı aşağı ittiriyor (üstüne binmiyor)', () => {
  const kod = oku('content.js');
  assert.match(kod, /function sayfaIttir/, 'sayfaIttir yok');
  assert.match(kod, /paddingTop/, 'sayfa padding-top ayarlanmıyor');
  assert.match(kod, /dtnotTaban/, 'sayfanın eski boşluğu saklanmıyor');
  assert.match(kod, /ResizeObserver/, 'banner yüksekliği izlenmiyor');
  assert.match(kod, /function bannerKaldir[\s\S]{0,200}sayfaIttir\(0\)/, 'banner kalkınca sayfa eski hâline dönmüyor');
});
await test('i18n: kullanıcının verdiği yeni metinler iki dilde de var', () => {
  const tr = I.DICT.tr;
  const en = I.DICT.en;
  assert.match(tr['ayar.hakkindaMetin'], /gizliliğine önem verir/);
  assert.match(tr['ayar.hakkindaMetin'], /kişisel bilgisayarınızda kalır/);
  assert.match(tr['ayar.gizlemeNot'], /Notu kapattığınızda belirlediğiniz süre boyunca notunuz görünmez olur/);
  assert.match(tr['ayar.sadeceAktif'], /otomatik olarak filtreleyip gösterir/);
  assert.match(en['ayar.hakkindaMetin'], /privacy/);
  assert.match(en['ayar.gizlemeNot'], /stays hidden for the period/);
  assert.match(en['ayar.sadeceAktif'], /automatically filters/);
  assert.equal(tr['not.renkSecili'], 'Seçili renk: {renk}');
  assert.equal(en['not.renkSecili'], 'Selected colour: {renk}');
});
await test('i18n: eski metinler kalmadı', () => {
  const metin = oku('assets/i18n.js');
  assert.ok(!metin.includes('hesap, sunucu veya anahtar gerekmez'), 'eski hakkında metni kalmış');
  assert.ok(!metin.includes('Panel açılırken yalnız aktif siteyi göster'), 'eski sadeceAktif metni kalmış');
  assert.ok(!metin.includes('Post-it’i gizle dediğinde'), 'eski gizlemeNot metni kalmış');
});

/* ================= 10) Tema (koyu / açık) ================= */
console.log('\n10) Tema (koyu / açık)');

// Kök element taklidi: tema YALNIZ `html.db-acik` sınıfıyla uygulanır.
const siniflar = new Set();
/** Minimal <select> taklidi: seçenekleri, değeri ve olay dinleyicilerini tutar. */
function sahteSecici() {
  return {
    children: [],
    value: '',
    dinleyiciler: {},
    get textContent() { return this.children.map((c) => c.textContent).join(''); },
    set textContent(_v) { this.children = []; },
    appendChild(o) { this.children.push(o); },
    addEventListener(tip, fn) { (this.dinleyiciler[tip] = this.dinleyiciler[tip] || []).push(fn); },
    tetikle(tip) { (this.dinleyiciler[tip] || []).forEach((fn) => fn({ target: this })); },
  };
}
globalThis.document = {
  createElement: (etiket) => ({ etiket, value: '', textContent: '', appendChild() {} }),
  documentElement: {
    classList: {
      add: (c) => siniflar.add(c),
      remove: (c) => siniflar.delete(c),
      contains: (c) => siniflar.has(c),
      toggle: (c, on) => {
        const ac = (on === undefined) ? !siniflar.has(c) : !!on;
        if (ac) siniflar.add(c); else siniflar.delete(c);
        return ac;
      },
    },
  },
};
new Function('chrome', 'document', oku('assets/tema.js'))(globalThis.chrome, globalThis.document);
const TM = globalThis.DTNOT_TEMA;

await test('tema: varsayılan KOYU (ayar modeli + kök elemanda db-acik yok)', async () => {
  assert.equal(S.VARSAYILAN_AYAR.tema, 'koyu');
  assert.equal((await S.ayarlariAl()).tema, 'koyu');
  await TM.hazirla();
  assert.equal(globalThis.document.documentElement.classList.contains('db-acik'), false, 'varsayılan açık temaya düşmüş');
});
await test('tema: bilinmeyen/bozuk değer güvenle KOYUya düşer', async () => {
  assert.equal(S.temizTema('acik'), 'acik');
  assert.equal(S.temizTema('koyu'), 'koyu');
  ['mor', '', null, undefined, 42].forEach((v) => assert.equal(S.temizTema(v), 'koyu', 'bozuk değer koyuya düşmedi: ' + String(v)));
  await S.ayarlariKaydet({ tema: 'neon' });
  assert.equal((await S.ayarlariAl()).tema, 'koyu', 'depodaki bozuk tema normalize edilmedi');
  assert.equal(TM.temiz('neon'), 'koyu');
  await S.ayarlariKaydet({ tema: 'koyu' });
});
await test('tema: acik → kök elemanda db-acik VAR; koyu → YOK (anında uygulanır)', () => {
  const el = globalThis.document.documentElement;
  assert.equal(TM.uygula('acik'), 'acik');
  assert.equal(el.classList.contains('db-acik'), true, 'açık temada db-acik eklenmiyor');
  assert.equal(TM.uygula('koyu'), 'koyu');
  assert.equal(el.classList.contains('db-acik'), false, 'koyu temada db-acik kaldırılmıyor');
  TM.uygula('bozuk');
  assert.equal(el.classList.contains('db-acik'), false, 'bozuk değer açık temaya sokmamalı');
});
await test('tema: kayıtlı tema sayfa açılışında uygulanıyor (hazirla)', async () => {
  const el = globalThis.document.documentElement;
  await S.ayarlariKaydet({ tema: 'acik' });
  await TM.hazirla();
  assert.equal(el.classList.contains('db-acik'), true);
  await S.ayarlariKaydet({ tema: 'koyu' });
  await TM.hazirla();
  assert.equal(el.classList.contains('db-acik'), false);
});
await test('tema: seçici popup + Ayarlar’da ORTAK render yolundan (kopya kod yok)', () => {
  ['popup.js', 'options.js'].forEach((dosya) => {
    const kod = oku(dosya);
    assert.match(kod, /(?:DTNOT_TEMA|TM)\.seciciKur\(\$\('tema'\)/, dosya + ': ortak tema seçici kurulmuyor');
    assert.match(kod, /\.hazirla\(\)/, dosya + ': kayıtlı tema uygulanmıyor');
    assert.ok(!/temaKoyu|temaAcik/.test(kod), dosya + ': tema seçenekleri kopyalanmış (assets/tema.js kullanılmalı)');
  });
  assert.match(oku('panel.js'), /DTNOT_TEMA\.hazirla\(\)/, 'Notlarım ekranı temayı uygulamıyor');
  ['popup.html', 'panel.html', 'options.html'].forEach((sayfa) => {
    assert.match(oku(sayfa), /src="assets\/tema\.js"/, sayfa + ': tema.js yüklenmiyor');
  });
  ['popup.html', 'options.html'].forEach((sayfa) => {
    assert.match(oku(sayfa), /id="tema" class="secici"/, sayfa + ': tema seçicisi (select.secici) yok');
    assert.match(oku(sayfa), /id="temaEtiket"/, sayfa + ': tema etiketi yok');
  });
});
await test('tema: i18n anahtarları iki dilde (sözlük + _locales)', () => {
  ['ayar.tema', 'ayar.temaKoyu', 'ayar.temaAcik'].forEach((k) => {
    assert.ok(I.DICT.tr[k], 'tr/' + k + ' yok');
    assert.ok(I.DICT.en[k], 'en/' + k + ' yok');
  });
  assert.equal(I.DICT.tr['ayar.temaKoyu'], 'Koyu');
  assert.equal(I.DICT.en['ayar.temaAcik'], 'Light');
  const tr = JSON.parse(oku('_locales/tr/messages.json'));
  const en = JSON.parse(oku('_locales/en/messages.json'));
  ['ayarTema', 'ayarTemaKoyu', 'ayarTemaAcik'].forEach((k) => {
    assert.ok(tr[k] && tr[k].message, 'tr/' + k + ' yok');
    assert.ok(en[k] && en[k].message, 'en/' + k + ' yok');
  });
});
await test('tema: ortak seçici (seciciKur) çizer, değişimde ANINDA uygular + kaydeder', async () => {
  const el = sahteSecici();
  TM.seciciKur(el);
  assert.deepEqual(el.children.map((o) => o.value), ['koyu', 'acik'], 'seçenekler yanlış');
  assert.deepEqual(el.children.map((o) => o.textContent), ['Koyu', 'Açık'], 'seçenek metinleri i18n’den gelmiyor');
  assert.equal(el.value, 'koyu', 'kayıtlı değer seçili değil');
  el.value = 'acik';
  el.tetikle('change');
  assert.equal(globalThis.document.documentElement.classList.contains('db-acik'), true, 'seçim ANINDA uygulanmıyor');
  await new Promise((r) => setTimeout(r, 0));
  assert.equal((await S.ayarlariAl()).tema, 'acik', 'seçim depoya yazılmadı');
  await I.dilAyarla('en'); // dil değişince seçenek metinleri tazelenir (tek abonelik)
  assert.deepEqual(el.children.map((o) => o.textContent), ['Dark', 'Light'], 'dil değişince metinler tazelenmiyor');
  assert.equal(el.value, 'acik', 'dil değişince seçim kayboluyor');
  await I.dilAyarla('tr');
  TM.uygula('koyu');
  await S.ayarlariKaydet({ tema: 'koyu' });
});
await test('tema: ui.css açık tema bloğu (tokenlar + color-scheme) ve okunurluk düzeltmeleri', () => {
  const css = oku('assets/ui.css');
  const blok = css.match(/html\.db-acik\s*\{[\s\S]{0,600}?\}/);
  assert.ok(blok, 'html.db-acik bloğu yok (kaynak tema.css bloğu taşınmamış)');
  ['--db-bg', '--db-surface', '--db-surface-2', '--db-border', '--db-border-strong', '--db-text', '--db-muted', '--db-dim'].forEach((v) => {
    assert.ok(blok[0].includes(v + ':'), 'açık temada eksik token: ' + v);
  });
  assert.match(blok[0], /color-scheme:\s*light/, 'color-scheme: light yok');
  assert.match(css, /html\.db-acik \.topbar__baslik\s*\{[^}]*var\(--db-text\)/, 'açık temada başlık beyaz kalıyor (okunmaz)');
  assert.match(css, /html\.db-acik \.girdi/, 'açık temada girdi zemini düzeltilmemiş');
  assert.match(css, /html\.db-acik \.secici/, 'açık temada seçici zemini düzeltilmemiş');
  assert.match(css, /html\.db-acik \.btn:hover/, 'açık temada düğme hover zemini düzeltilmemiş');
  assert.match(css, /html\.db-acik \.ikon-dugme:hover/, 'açık temada ikon düğmesi hover zemini düzeltilmemiş');
});

await test('sayfa betiklerinin aradığı her id kendi HTML’inde var (kopuk bağ yok)', () => {
  const ciftler = [['popup.html', 'popup.js'], ['panel.html', 'panel.js'], ['options.html', 'options.js']];
  const eksikler = [];
  ciftler.forEach(([html, js]) => {
    const kod = oku(js);
    const htmlMetni = oku(html);
    const idler = new Set((kod.match(/\$\('([a-zA-Z0-9_-]+)'\)/g) || []).map((s) => s.slice(3, -2)));
    idler.forEach((id) => {
      if (!htmlMetni.includes('id="' + id + '"')) eksikler.push(js + ' → #' + id);
    });
  });
  assert.deepEqual(eksikler, [], 'HTML’de olmayan id çağrılıyor: ' + eksikler.join(', '));
});

/* ================= 11) Popup Ayarlar görünümü (katlanır bölümler) ================= */
console.log('\n11) Popup Ayarlar görünümü');

const popupHtml = oku('popup.html');
const popupKod = oku('popup.js');

/** Ayarlar görünümü = popup.html içinde AYARLAR-BASLANGIC … AYARLAR-BITIS arası.
    (Popup'ın iki görünümü: not işlemleri · Ayarlar.) */
function ayarBloguAl() {
  const bas = popupHtml.indexOf('<!-- AYARLAR-BASLANGIC');
  const son = popupHtml.indexOf('<!-- AYARLAR-BITIS');
  return (bas !== -1 && son > bas) ? popupHtml.slice(bas, son) : '';
}
const ayarBlogu = ayarBloguAl();

await test('popup Ayarlar: not ekleme/liste alanları YOK (notlar Notlarım ekranında)', () => {
  assert.ok(ayarBlogu.length > 300, 'Ayarlar görünümü işaretleri (AYARLAR-BASLANGIC/BITIS) bulunamadı');
  ['ekleAc', 'ekleKutu', 'metin', 'renkler', 'renkSecili', 'renkEtiket', 'bannerChk', 'siteGeneliChk',
    'kaydet', 'vazgec', 'silDugme', 'notOnizleme', 'havuzBaslik', 'havuzNotu', 'panelDugme',
    'toplamRozet', 'sayfaAdres'].forEach((id) => {
    assert.ok(ayarBlogu.indexOf('id="' + id + '"') === -1, 'popup Ayarlar içinde not alanı var: #' + id);
  });
  // Not alanları SİLİNMEDİ: popup'ın normal (not) görünümünde duruyorlar
  ['ekleAc', 'metin', 'havuzBaslik', 'panelDugme', 'renkSecili'].forEach((id) => {
    assert.ok(popupHtml.indexOf('id="' + id + '"') !== -1, 'not alanı tamamen kayboldu: #' + id);
  });
  // Ayarlar açıkken not görünümü tümüyle gizlenir: notlar panel.html'de yönetilir
  assert.match(popupHtml, /id="notGorunum"/, 'not görünümü sarmalayıcısı yok');
  assert.match(popupKod, /async function ayarModu[\s\S]{0,400}\$\('notGorunum'\)\.hidden = !!ac/,
    'Ayarlar açılınca not görünümü gizlenmiyor');
});

await test('popup Ayarlar: bölümler katlanır, varsayılanlar options ile AYNI', () => {
  const bolumBul = (html, kontrol) => {
    const re = new RegExp('<section[^>]*data-acik="(true|false)"[^>]*>\\s*<button[^>]*aria-expanded="(true|false)"[^>]*aria-controls="' + kontrol + '"');
    const m = html.match(re);
    return m ? { acik: m[1], aria: m[2] } : null;
  };
  ['govdeDavranis', 'govdeVeri', 'govdeHakkinda'].forEach((k) => {
    const o = bolumBul(oku('options.html'), k);
    const p = bolumBul(ayarBlogu, k);
    assert.ok(o, 'options.html: ' + k + ' katlanır bölümü yok');
    assert.ok(p, 'popup.html: ' + k + ' katlanır bölümü yok (Ayarlar options ile aynı bölümleri göstermeli)');
    assert.equal(p.acik, o.acik, 'varsayılan options ile aynı değil: ' + k);
    assert.equal(p.aria, o.aria, 'aria-expanded tutarsız: ' + k);
  });
  // Gövdeler DOM'da kalır, yalnız `hidden` ile gizlenir (arama/otomasyon bozulmaz)
  ['govdeDavranis', 'govdeHakkinda'].forEach((id) => {
    assert.match(ayarBlogu, new RegExp('id="' + id + '"'), id + ' gövdesi yok');
  });
  assert.match(ayarBlogu, /id="govdeVeri" hidden/, 'kapalı Veri gövdesi hidden değil');
  assert.match(ayarBlogu, /class="katlanir__ok" aria-hidden="true">▸/, 'kapalı bölüm ok işareti ▸ değil');
  assert.match(ayarBlogu, /class="katlanir__ok" aria-hidden="true">▾/, 'açık bölüm ok işareti ▾ değil');
  // Davranış kodu: options.js ile AYNI .katlanir sözleşmesi
  assert.match(popupKod, /uygula\(bolum\.dataset\.acik !== 'false'\)/, 'varsayılan data-acik üzerinden kurulmuyor');
  assert.match(popupKod, /baslik\.setAttribute\('aria-expanded', String\(acik\)\)/, 'aria-expanded güncellenmiyor');
  assert.match(popupKod, /govde\.hidden = !acik/, 'gövde hidden ile gizlenmiyor');
  assert.match(popupKod, /ok\.textContent = acik \? '▾' : '▸'/, 'ok göstergesi çevrilmiyor');
  // Başlıkta TEK satırlık özet (kapalıyken de bilgi görünür)
  ['ozetDavranis', 'ozetVeri', 'ozetHakkinda'].forEach((id) => {
    assert.ok(ayarBlogu.indexOf('class="katlanir__ozet" id="' + id + '"') !== -1, 'bölüm özeti yok: #' + id);
  });
  assert.match(popupKod, /ozetDavranis\.textContent = T\(saatAnahtar\(/, 'Davranış özeti (gizleme süresi) yazılmıyor');
  assert.match(popupKod, /ozetVeri\.textContent = T\('panel\.toplam'/, 'Veri özeti (not sayısı) yazılmıyor');
  assert.match(popupKod, /ozetHakkinda\.textContent = T\('ayar\.surum'/, 'Hakkında özeti (sürüm) yazılmıyor');
});

await test('popup Ayarlar: ✕ kapatma düğmesi KALDIRILDI (kapanma yine ⚙ ile)', () => {
  assert.ok(popupHtml.indexOf('ayarKapat') === -1, 'popup.html içinde ✕ düğmesi kaldı');
  assert.ok(popupKod.indexOf('ayarKapat') === -1, 'popup.js hâlâ ✕ düğmesini bağlıyor');
  assert.ok(!/>\s*✕\s*</.test(popupHtml), 'popup.html içinde ✕ düğmesi kaldı');
  assert.match(popupKod, /\$\('ayarAc'\)\.addEventListener\('click', \(\) => ayarModu\(/,
    'Ayarlar ⚙ düğmesiyle açılıp kapanmıyor');
  assert.match(popupKod, /async function ayarModu[\s\S]{0,400}\$\('ayarAc'\)\.setAttribute\('aria-pressed', String\(!!ac\)\)/,
    '⚙ düğmesi etkin durumu (aria-pressed) bildirmiyor');
});

await test('popup Ayarlar: tema seçici Ayarlar içinde + ORTAK render yolundan', () => {
  const davranis = ayarBlogu.match(/id="govdeDavranis"[\s\S]*?<\/div>\s*<\/section>/);
  assert.ok(davranis, 'Davranış bölümü gövdesi bulunamadı');
  assert.match(davranis[0], /id="tema" class="secici"/, 'tema seçicisi Davranış bölümünde değil');
  assert.match(davranis[0], /id="temaEtiket"/, 'tema etiketi yok');
  assert.match(popupKod, /TM\.seciciKur\(\$\('tema'\)/, 'tema seçici ortak yoldan (assets/tema.js) kurulmuyor');
  assert.ok(!/style=/.test(ayarBlogu), 'Ayarlar görünümünde gömülü stil (style=) var');
});

await test('popup Ayarlar: “Sayfada göster” linki EN ALTTA + openOptionsPage', () => {
  assert.match(ayarBlogu, /id="yeniSayfadaAc" class="altbilgi__link"/, 'standart .altbilgi__link sınıfı yok');
  assert.match(ayarBlogu, /href="options\.html"/, 'tam ayar sayfası bağlantısı yok');
  assert.ok(ayarBlogu.lastIndexOf('yeniSayfadaAc') > ayarBlogu.lastIndexOf('govdeHakkinda'),
    'link en altta değil (son bölümden sonra olmalı)');
  assert.match(popupKod, /runtime\.openOptionsPage\(\)/, 'openOptionsPage kullanılmıyor');
  assert.match(popupKod, /tabs\.create\(\{ url: rt\.getURL\('options\.html'\) \}\)/, 'tabs.create yedeği yok');
  assert.match(popupKod, /\$\('yeniSayfadaAc'\)\.addEventListener\('click',[\s\S]{0,140}e\.preventDefault\(\)/,
    'bağlantı varsayılan davranışa bırakılmış (çift sekme riski)');
  assert.match(popupKod, /T\('ayar\.sayfadaGoster'\)/, 'link metni i18n anahtarından gelmiyor');
  assert.equal(I.DICT.tr['ayar.sayfadaGoster'], 'Sayfada göster');
  assert.ok(I.DICT.en['ayar.sayfadaGoster'], 'EN link metni yok');
  assert.ok(I.DICT.tr['ayar.veriTamSayfa'] && I.DICT.en['ayar.veriTamSayfa'], 'Veri ipucu iki dilde yok');
  const tr = JSON.parse(oku('_locales/tr/messages.json'));
  const en = JSON.parse(oku('_locales/en/messages.json'));
  assert.equal(tr.ayarSayfadaGoster.message, 'Sayfada göster', '_locales/tr: yeni link anahtarı yok');
  assert.ok(en.ayarSayfadaGoster && en.ayarSayfadaGoster.message, '_locales/en: yeni link anahtarı yok');
  assert.ok(tr.ayarVeriTamSayfa && en.ayarVeriTamSayfa, '_locales: Veri ipucu anahtarı iki dilde yok');
});

console.log(`\nSONUÇ: ${gecen} geçti, ${kalan} kaldı`);
process.exit(kalan ? 1 : 0);
