/* DTNoT — arka plan (Chrome: service worker → importScripts; Firefox: event page →
   manifest background.scripts zaten yükler). DEPO TEK KAYNAK: not okuma/yazma burada;
   içerik betiği ve arayüz yalnız mesajla sorar (normalizeUrl kopyası YOK). */
if (typeof DTNOT_STORE === 'undefined' && typeof importScripts === 'function') {
  try { importScripts('assets/store.js'); } catch (e) { /* aşağıda kontrol edilir */ }
}
if (typeof DTNOT_I18N === 'undefined' && typeof importScripts === 'function') {
  try { importScripts('assets/i18n.js'); } catch (e) { /* yut */ }
}

const S = globalThis.DTNOT_STORE;
const I18N = globalThis.DTNOT_I18N;

const CS_ID = 'dtnot-content';
const CS_JS = ['assets/store.js', 'assets/i18n.js', 'content.js'];
const CS_MATCHES = ['http://*/*', 'https://*/*'];
const SAYFA_ORIGINS = ['*://*/*'];
const PENDING_KEY = 'dtnot-pending';
const MENU_ID = 'dtnot:add';

/* ---------- İçerik betiği kaydı (izin varsa kayıtlı olmalı, yoksa kayıt silinir) ---------- */
async function izinVarMi() {
  try { return !!(await chrome.permissions.contains({ origins: SAYFA_ORIGINS })); } catch (e) { return false; }
}

async function icerikKayitliMi() {
  try {
    const kayitli = await chrome.scripting.getRegisteredContentScripts({ ids: [CS_ID] });
    return kayitli.length > 0;
  } catch (e) { return false; }
}

async function icerikEsle() {
  const izin = await izinVarMi();
  const kayitli = await icerikKayitliMi();
  try {
    if (izin && !kayitli) {
      await chrome.scripting.registerContentScripts([{
        id: CS_ID, js: CS_JS, matches: CS_MATCHES, runAt: 'document_idle', persistAcrossSessions: true,
      }]);
    } else if (!izin && kayitli) {
      await chrome.scripting.unregisterContentScripts({ ids: [CS_ID] });
    }
    return { izin, kayitli: await icerikKayitliMi() };
  } catch (e) {
    return { izin, kayitli, hata: String((e && e.message) || e) };
  }
}

/* ---------- Sağ tık menüsü ---------- */
async function menuKur() {
  try {
    if (chrome.contextMenus.removeAll) await chrome.contextMenus.removeAll();
    await chrome.contextMenus.create({
      id: MENU_ID,
      title: (I18N ? I18N.t('popup.ekle') : 'Not ekle') + ' — DTNoT',
      contexts: ['all'],
    });
  } catch (e) { /* menü kurulamazsa popup ikonu yine çalışır */ }
}

chrome.runtime.onInstalled.addListener(async () => {
  if (I18N) { try { await I18N.hazirla(); } catch (e) { /* yut */ } }
  await icerikEsle();
  await menuKur();
});

if (chrome.runtime.onStartup && chrome.runtime.onStartup.addListener) {
  chrome.runtime.onStartup.addListener(async () => { await icerikEsle(); await menuKur(); });
}

if (chrome.permissions && chrome.permissions.onAdded) {
  chrome.permissions.onAdded.addListener(() => { icerikEsle(); });
  chrome.permissions.onRemoved.addListener(() => { icerikEsle(); });
}

if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== MENU_ID) return;
    // Popup'ı "ekle" modunda aç: tek seferlik anahtar (tüketilir).
    try { await chrome.storage.local.set({ [PENDING_KEY]: { action: 'add', at: Date.now() } }); } catch (e) { /* yut */ }
    try {
      await chrome.action.openPopup();
    } catch (e) {
      // Bazı platformlarda kullanıcı jesti dışında reddedilir → sekmede aç (düşüş).
      try { await chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?ekle=1') }); } catch (e2) { /* yut */ }
    }
  });
}

/* ---------- Mesajlar (Chrome + Firefox: sendResponse + return true) ---------- */
const ISLER = {
  async AKTIF_SAYFA() {
    try {
      const sekme = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
      const url = (sekme && sekme.url) || '';
      return { url, anahtar: S.normalizeUrl(url), tabId: (sekme && sekme.id != null) ? sekme.id : null };
    } catch (e) { return { url: '', anahtar: '', tabId: null }; }
  },
  async DURUM() {
    const izin = await izinVarMi();
    const kayitli = await icerikKayitliMi();
    const store = await S.hepsiniAl();
    return { izin, kayitli, toplam: store.notlar.length, recovered: store.recovered };
  },
  async NOT_AL(m) {
    const not = await S.notuAl(m.anahtar || m.url || '');
    return { not: S.gorunurMu(not) ? not : null, ham: not };
  },
  async NOT_EKLE(m) { return { not: await S.ekle(m.url, m.metin) }; },
  async NOT_GUNCELLE(m) { return { not: await S.guncelle(m.anahtar, m.patch || {}) }; },
  async NOT_SIL(m) { return { anahtar: await S.sil(m.anahtar) }; },
  async NOTLAR() {
    const store = await S.hepsiniAl();
    return { notlar: store.notlar, recovered: store.recovered };
  },
  async AYARLAR_AL() { return { ayarlar: await S.ayarlariAl() }; },
  async AYARLAR_KAYDET(m) {
    const ayarlar = await S.ayarlariKaydet(m.patch || {});
    await menuKur(); // menü başlığı dile bağlı
    return { ayarlar };
  },
  async SAYFA_AC(m) {
    const not = await S.notuAl(m.anahtar);
    const url = S.sayfaUrl(not) || ('https://' + String(m.anahtar || ''));
    try { await chrome.tabs.create({ url }); return { ok: true, url }; } catch (e) { return { ok: false, url }; }
  },
  async ICERIK_YENILE(m) {
    try { await chrome.tabs.sendMessage(m.tabId, { tip: 'dtnot-yenile' }); return { ok: true }; } catch (e) { return { ok: false }; }
  },
  async DISA_AKTAR() { return { json: S.disaAktarMetni(await S.hepsiniAl()) }; },
  async ICE_AKTAR(m) {
    const gelen = S.iceAktarCoz(m.json);
    const mevcut = await S.hepsiniAl();
    const birlesik = S.birlestir(mevcut.notlar, gelen, m.strateji === 'replace' ? 'replace' : 'merge');
    await S.yaz(birlesik);
    return { sayi: birlesik.notlar.length };
  },
  async MENU_YENILE() { await menuKur(); return { ok: true }; },
};

if (chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitla) => {
    if (!mesaj || !mesaj.tip || !Object.prototype.hasOwnProperty.call(ISLER, mesaj.tip)) return undefined;
    ISLER[mesaj.tip](mesaj)
      .then((sonuc) => { try { yanitla(sonuc); } catch (e) { /* kanal kapanmış */ } })
      .catch((hata) => {
        try { yanitla({ __hata: String((hata && hata.message) || hata) }); } catch (e) { /* yut */ }
      });
    return true; // kanalı açık tut (Chrome şart; Firefox kabul eder)
  });
}
