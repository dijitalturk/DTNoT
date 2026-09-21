/* DTNoT — sayfa içi post-it. Runtime kaydedilen klasik betik (top-level import YOK).
   Not verisi ARKA PLANDAN mesajla alınır (depo tek kaynak; burada normalizeUrl kopyası yok —
   yalnız anahtar karşılaştırması için DTNOT_STORE.normalizeUrl kullanılır). */
(function () {
  'use strict';

  try { if (window.top !== window.self) return; } catch (e) { return; } // yalnız üst pencere

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const t = I ? I.t : function (k) { return k; };
  const HOST_ID = 'dtnot-host';

  let dil = 'tr';
  let gizleMs = 3600 * 1000;
  let sonNot = null;
  let calisiyor = false;

  async function ayarlariTazele() {
    try {
      const a = await S.ayarlariAl();
      dil = a.lang;
      gizleMs = a.gizlemeSaat * 3600 * 1000;
    } catch (e) { /* varsayılanla devam */ }
  }

  const sureMetni = function () { return t('saat.' + Math.round(gizleMs / 3600000)); };

  function kaldir() {
    const e = document.getElementById(HOST_ID);
    if (e) e.remove();
  }

  async function mesaj(tip, veri) {
    try {
      const r = await chrome.runtime.sendMessage(Object.assign({ tip: tip }, veri || {}));
      if (!r || r.__hata) return null;
      return r;
    } catch (e) { return null; }
  }

  async function notSor() {
    const r = await mesaj('NOT_AL', { anahtar: location.href });
    return r ? r.not : null;
  }

  const CSS = ''
    + ':host { all: initial; }'
    + '.kutu { position: fixed; left: 16px; bottom: 16px; z-index: 2147483646; width: 264px;'
    + ' box-sizing: border-box; background: #fdf6c9; color: #2f2b16;'
    + ' border: 1px solid #e6d98a; border-radius: 12px;'
    + ' box-shadow: 0 10px 34px rgba(9,20,45,0.22); padding: 6px 6px 2px;'
    + " font: 13px/1.45 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow-wrap: anywhere; }"
    + '.bas { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }'
    + '.ikon { all: unset; cursor: pointer; box-sizing: border-box; width: 22px; height: 22px;'
    + ' line-height: 20px; text-align: center; border-radius: 7px; color: #6b5f21; background: #f7ecaa;'
    + ' border: 1px solid #e6d98a; font: 13px/1 Inter, sans-serif; }'
    + '.ikon:hover { background: #f2e28f; }'
    + '.ikon:focus-visible { outline: 3px solid #85b8ff; outline-offset: 1px; }'
    + '.metin { padding: 2px 8px 10px; white-space: pre-wrap; max-height: 220px; overflow: auto; }'
    + '.mini { all: unset; position: fixed; left: 16px; bottom: 16px; z-index: 2147483646;'
    + ' cursor: pointer; box-sizing: border-box; width: 42px; height: 42px; border-radius: 12px;'
    + ' text-align: center; background: #fdf6c9; color: #6b5f21; border: 1px solid #e6d98a;'
    + ' box-shadow: 0 10px 34px rgba(9,20,45,0.22); font: 18px/40px Inter, sans-serif; }'
    + '.mini:hover { background: #f7ecaa; }'
    + '.mini:focus-visible { outline: 3px solid #85b8ff; outline-offset: 2px; }';

  function ikonDugme(etiket, metin) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ikon';
    b.setAttribute('aria-label', etiket);
    b.setAttribute('title', etiket);
    b.textContent = metin;
    return b;
  }

  function ciz(not) {
    kaldir();
    const barindirici = document.createElement('div');
    barindirici.id = HOST_ID;
    (document.body || document.documentElement).appendChild(barindirici);
    const golge = barindirici.attachShadow({ mode: 'open' });
    const stil = document.createElement('style');
    stil.textContent = CSS;
    golge.appendChild(stil);

    if (not.kucuk === true) {
      const mini = document.createElement('button');
      mini.type = 'button';
      mini.className = 'mini';
      mini.setAttribute('aria-label', t('icerik.ac'));
      mini.setAttribute('title', t('icerik.ac'));
      mini.textContent = '\u2261';
      mini.addEventListener('click', async () => {
        await mesaj('NOT_GUNCELLE', { anahtar: not.anahtar, patch: { kucuk: false } });
        degerlendir();
      });
      golge.appendChild(mini);
      return;
    }

    const kutu = document.createElement('div');
    kutu.className = 'kutu';

    const bas = document.createElement('div');
    bas.className = 'bas';

    const kucult = ikonDugme(t('icerik.kucult'), '\u2212');
    kucult.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { anahtar: not.anahtar, patch: { kucuk: true } });
      degerlendir();
    });

    const kapat = ikonDugme(t('icerik.gizleSure', { s: sureMetni() }), '\u00d7');
    kapat.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { anahtar: not.anahtar, patch: { gizleUntil: Date.now() + gizleMs } });
      kaldir();
    });

    bas.appendChild(kucult);
    bas.appendChild(kapat);

    const metin = document.createElement('div');
    metin.className = 'metin';
    metin.textContent = String(not.metin == null ? '' : not.metin);

    kutu.appendChild(bas);
    kutu.appendChild(metin);
    golge.appendChild(kutu);
  }

  async function degerlendir() {
    if (calisiyor) return;
    calisiyor = true;
    try {
      const anahtar = S.normalizeUrl(location.href);
      if (!anahtar) { sonNot = null; kaldir(); return; }
      const not = await notSor();
      sonNot = not;
      if (!not) { kaldir(); return; }
      ciz(not);
    } finally {
      calisiyor = false;
    }
  }

  /* Konum değişimi (SPA) + sayfa geri gelme olayları */
  let sonKonum = null;
  function konumDegistiMi() {
    const anahtar = S.normalizeUrl(location.href);
    if (anahtar !== sonKonum) { sonKonum = anahtar; degerlendir(); return; }
    if (sonNot && !document.getElementById(HOST_ID)) degerlendir();
  }

  try {
    const push = history.pushState;
    const replace = history.replaceState;
    history.pushState = function () { const r = push.apply(this, arguments); konumDegistiMi(); return r; };
    history.replaceState = function () { const r = replace.apply(this, arguments); konumDegistiMi(); return r; };
  } catch (e) { /* yamalanamazsa poll yeter */ }

  window.addEventListener('popstate', konumDegistiMi);
  window.addEventListener('hashchange', konumDegistiMi);
  window.addEventListener('focus', degerlendir);
  window.addEventListener('pageshow', degerlendir);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) degerlendir(); });
  setInterval(konumDegistiMi, 2500); // yedek yoklama (SPA + geç yüklenen içerik)

  try {
    chrome.storage.onChanged.addListener(function (degisim, alan) {
      if (alan !== 'local') return;
      if ('web-not-store' in degisim || 'web-not-settings' in degisim) {
        ayarlariTazele().then(degerlendir);
      }
    });
  } catch (e) { /* dinleyici yoksa poll yeter */ }

  try {
    chrome.runtime.onMessage.addListener(function (mesaj, _gonderen, yanitla) {
      if (!mesaj || mesaj.tip !== 'dtnot-yenile') return undefined;
      degerlendir();
      try { yanitla({ canli: true, anahtar: S.normalizeUrl(location.href) }); } catch (e) { /* yut */ }
      return true;
    });
  } catch (e) { /* mesaj kanalı yoksa geç */ }

  ayarlariTazele().then(degerlendir);
})();
