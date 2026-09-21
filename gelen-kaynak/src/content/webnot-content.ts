/**
 * content/webnot-content.ts — sayfa başına kendi kendine çalışan içerik betiği.
 *
 * Sayfa yüklenince geçerli URL için not arar; varsa ve gizleme süresi
 * geçmişse SOL ALTTA post-it çizer (Shadow DOM, sayfa CSS'iyle çakışmaz).
 *
 * normalizeUrl / storage okuma-yazma, popup ile AYNI `lib/store.ts`
 * modülünden gelir — iki ayrı kopya elle senkron tutulmak zorunda değil.
 */
import { loadNotes, writeRaw, normalizeUrl, STORAGE_KEY } from '../lib/store';
import { loadSettings } from '../lib/settings';
import type { Note } from '../lib/types';

(() => {
  'use strict';

  try {
    if (window.top !== window.self) return; // yalnız üst pencere
  } catch {
    return; // cross-origin erişim -> iframe say
  }

  const HOST_ID = 'web-not-host';
  const SNOOZE_MS_DEFAULT = 3600 * 1000;

  let gizleMs = SNOOZE_MS_DEFAULT;
  let dil: 'tr' | 'en' = 'tr';
  async function ayarlariYukle() {
    try {
      const s = await loadSettings();
      dil = s.lang;
      gizleMs = s.gizlemeSaat * 3600 * 1000;
    } catch {
      /* varsayılanla devam */
    }
  }

  const sureMetni = () => {
    const n = Math.round(gizleMs / 3600000);
    if (dil === 'en') return n === 24 ? '1 day' : n === 168 ? '1 week' : n === 1 ? '1 hour' : `${n} hours`;
    return n === 24 ? '1 gün' : n === 168 ? '1 hafta' : n === 1 ? '1 saat' : `${n} saat`;
  };

  function kaldir() {
    document.getElementById(HOST_ID)?.remove();
  }

  const CSS = `
    :host { all: initial; }
    .kutu {
      position: fixed; left: 16px; bottom: 16px; z-index: 2147483646;
      width: 260px; box-sizing: border-box;
      background: #fef3a0; color: #3a3320;
      border: 1px solid #e3d47a; border-radius: 10px;
      box-shadow: 0 8px 32px #091e4233, 0 1px 0 #fff inset;
      font: 13px/1.45 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow-wrap: anywhere;
    }
    .bas { display: flex; align-items: center; justify-content: flex-end; gap: 4px; padding: 5px 6px 0; }
    .ikon {
      all: unset; cursor: pointer; box-sizing: border-box;
      width: 20px; height: 20px; line-height: 18px; text-align: center;
      border-radius: 5px; color: #6b5f2a; background: #f6e88c;
      border: 1px solid #e3d47a; font: 13px/1 Inter, sans-serif;
    }
    .ikon:hover { background: #efe07e; }
    .ikon:focus-visible { outline: 3px solid #85b8ff; outline-offset: 1px; }
    .metin { padding: 4px 12px 12px; white-space: pre-wrap; max-height: 220px; overflow: auto; }
    .mini {
      position: fixed; left: 16px; bottom: 16px; z-index: 2147483646;
      all: unset; cursor: pointer; box-sizing: border-box;
      width: 40px; height: 40px; border-radius: 10px; text-align: center;
      background: #fef3a0; color: #6b5f2a; border: 1px solid #e3d47a;
      box-shadow: 0 8px 32px #091e4233;
      font: 18px/38px Inter, sans-serif;
    }
    .mini:hover { background: #f6e88c; }
    .mini:focus-visible { outline: 3px solid #85b8ff; outline-offset: 2px; }
  `;

  function ikonButon(etiket: string, metin: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ikon';
    b.setAttribute('aria-label', etiket);
    b.setAttribute('title', etiket);
    b.textContent = metin;
    return b;
  }

  async function yazPatch(anahtar: string, patch: Partial<Note>) {
    const store = await loadNotes();
    const mevcut = store.notlar.find((x) => x.anahtar === anahtar);
    if (!mevcut) return;
    Object.assign(mevcut, patch);
    await writeRaw(store);
  }

  function ciz(kayit: Note) {
    kaldir();
    const barindirici = document.createElement('div');
    barindirici.id = HOST_ID;
    (document.body || document.documentElement).append(barindirici);
    const golge = barindirici.attachShadow({ mode: 'open' });
    const stil = document.createElement('style');
    stil.textContent = CSS;
    golge.append(stil);

    if (kayit.kucuk === true) {
      const mini = document.createElement('button');
      mini.type = 'button';
      mini.className = 'mini';
      mini.setAttribute('aria-label', 'Notu aç');
      mini.setAttribute('title', 'Notu aç');
      mini.textContent = '\u2261';
      mini.addEventListener('click', async () => {
        await yazPatch(kayit.anahtar, { kucuk: false });
        await degerlendir();
      });
      golge.append(mini);
      return;
    }

    const kutu = document.createElement('div');
    kutu.className = 'kutu';

    const bas = document.createElement('div');
    bas.className = 'bas';
    const kapat = ikonButon(dil === 'en' ? `Hide note for ${sureMetni()}` : `Notu ${sureMetni()} gizle`, '\u00d7');
    kapat.addEventListener('click', async () => {
      await yazPatch(kayit.anahtar, { gizleUntil: Date.now() + gizleMs });
      kaldir();
    });
    const kucult = ikonButon(dil === 'en' ? 'Minimize note' : 'Notu küçült', '\u2212');
    kucult.addEventListener('click', async () => {
      await yazPatch(kayit.anahtar, { kucuk: true });
      await degerlendir();
    });
    bas.append(kucult);
    bas.append(kapat);

    const metin = document.createElement('div');
    metin.className = 'metin';
    metin.textContent = String(kayit.metin ?? '');

    kutu.append(bas);
    kutu.append(metin);
    golge.append(kutu);
  }

  let sonAnahtar: string | null = null;
  let calisiyor = false;
  let sonNotVar = false;

  async function degerlendir() {
    if (calisiyor) return;
    calisiyor = true;
    try {
      const anahtar = normalizeUrl(location.href);
      sonAnahtar = anahtar;
      if (!anahtar) {
        sonNotVar = false;
        kaldir();
        return;
      }
      const store = await loadNotes();
      const kayit = store.notlar.find((x) => x.anahtar === anahtar) ?? null;
      if (!kayit || Number(kayit.gizleUntil ?? 0) > Date.now()) {
        sonNotVar = false;
        kaldir();
        return;
      }
      sonNotVar = true;
      ciz(kayit);
    } finally {
      calisiyor = false;
    }
  }

  function konumDegistiMi() {
    const anahtar = normalizeUrl(location.href);
    if (anahtar !== sonAnahtar) {
      sonAnahtar = anahtar;
      degerlendir();
      return;
    }
    if (sonNotVar && !document.getElementById(HOST_ID)) degerlendir();
  }

  try {
    const { pushState, replaceState } = history;
    history.pushState = function (...args: Parameters<History['pushState']>) {
      const r = pushState.apply(this, args);
      konumDegistiMi();
      return r;
    };
    history.replaceState = function (...args: Parameters<History['replaceState']>) {
      const r = replaceState.apply(this, args);
      konumDegistiMi();
      return r;
    };
  } catch {
    /* history yamalanamazsa poll + popstate yeter */
  }
  window.addEventListener('popstate', konumDegistiMi);
  window.addEventListener('hashchange', konumDegistiMi);
  setInterval(konumDegistiMi, 1000);

  try {
    chrome.storage.onChanged.addListener((degisim, alan) => {
      if (alan !== 'local') return;
      if (!(STORAGE_KEY in degisim)) return;
      degerlendir();
    });
  } catch {
    /* dinleyici yoksa poll yeter */
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) degerlendir();
  });
  window.addEventListener('focus', () => degerlendir());
  window.addEventListener('pageshow', () => degerlendir());

  try {
    chrome.runtime.onMessage.addListener((mesaj, _gonderen, yanitla) => {
      if (!mesaj || typeof mesaj !== 'object') return undefined;
      if (mesaj.tip === 'webnot-ping' || mesaj.tip === 'webnot-yenile') {
        if (mesaj.tip === 'webnot-yenile') degerlendir();
        yanitla({ canli: true, anahtar: normalizeUrl(location.href) });
        return true;
      }
      return undefined;
    });
  } catch {
    /* mesaj kanalı yoksa geç */
  }

  ayarlariYukle().finally(() => degerlendir());
})();
