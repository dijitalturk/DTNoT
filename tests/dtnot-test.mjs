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
  assert.match(kod, /DTNOT_STORE\.normalizeUrl/);
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
await test('panel.js: arama TR/EN katlama ile yapılıyor (İkinci ↔ ikinci)', () => {
  const kod = oku('panel.js');
  assert.match(kod, /function katla/, 'katla() yok');
  assert.match(kod, /normalize\('NFD'\)/, 'aksan temizliği yok');
  const kullanim = (kod.match(/katla\(/g) || []).length;
  assert.ok(kullanim >= 3, 'sorgu ve metin aynı fonksiyondan geçmiyor (kullanım: ' + kullanim + ')');
});

console.log(`\nSONUÇ: ${gecen} geçti, ${kalan} kaldı`);
process.exit(kalan ? 1 : 0);
