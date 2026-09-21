/* DTNoT — sayfa içi post-it + banner. Runtime kaydedilen klasik betik (top-level import YOK).
   Not verisi ARKA PLANDAN mesajla alınır (depo tek kaynak; normalizeUrl kopyası yok).
   İki görünüm: post-it (sürüklenebilir, konum hatırlanır) ve banner (en tepede, site geneli olabilir). */
(function () {
  'use strict';

  try { if (window.top !== window.self) return; } catch (e) { return; } // yalnız üst pencere

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const t = I ? I.t : function (k) { return k; };
  const HOST_ID = 'dtnot-host';
  const BANNER_ID = 'dtnot-banner';

  /** 6 renk paleti — TEK KAYNAK: assets/store.js (DTNOT_STORE.PALET). */
  const PALET = (S && S.PALET) || { sari: { bg: '#fdf6c9', kenar: '#e6d98a', metin: '#2f2b16', ikon: '#6b5f21', ikonBg: '#f7ecaa' } };
  const palet = (ad) => PALET[ad] || PALET.sari;

  let dil = 'tr';
  let gizleMs = 3600 * 1000;
  let sonPostit = null;
  let sonBanner = null;
  let calisiyor = false;
  let bannerYuksek = 0;
  let bannerRO = null;

  /* Banner sayfayı AŞAĞI İTTİRİR (sitenin header'ının üstüne binmez): sayfanın mevcut
     üst boşluğu saklanır, banner yüksekliği eklenir; banner kalkınca eski hâle döner. */
  function sayfaIttir(yukseklik) {
    const el = document.documentElement;
    if (!el) return;
    if (el.dataset.dtnotTaban === undefined) el.dataset.dtnotTaban = el.style.paddingTop || '';
    const taban = el.dataset.dtnotTaban || '';
    const px = Math.max(0, Math.round(Number(yukseklik) || 0));
    if (px > 0) {
      el.style.paddingTop = taban ? 'calc(' + taban + ' + ' + px + 'px)' : px + 'px';
      bannerYuksek = px;
    } else {
      el.style.paddingTop = taban;
      bannerYuksek = 0;
      delete el.dataset.dtnotTaban;
    }
  }

  function bannerKaldir() {
    if (bannerRO) {
      try { bannerRO.disconnect(); } catch (e) { /* yut */ }
      bannerRO = null;
    }
    kaldir(BANNER_ID);
    sayfaIttir(0);
  }

  async function ayarlariTazele() {
    try {
      const a = await S.ayarlariAl();
      dil = a.lang;
      gizleMs = a.gizlemeSaat * 3600 * 1000;
    } catch (e) { /* varsayılanla devam */ }
  }

  const sureMetni = function () { return t('saat.' + Math.round(gizleMs / 3600000)); };

  function kaldir(id) {
    const e = document.getElementById(id);
    if (e) e.remove();
  }

  async function mesaj(tip, veri) {
    try {
      const r = await chrome.runtime.sendMessage(Object.assign({ tip: tip }, veri || {}));
      if (!r || r.__hata) return null;
      return r;
    } catch (e) { return null; }
  }

  async function sayfaNotunuSor() {
    const r = await mesaj('SAYFA_NOTU', { url: location.href });
    return r ? { postit: r.postit || null, banner: r.banner || null } : { postit: null, banner: null };
  }

  function golgeOlustur(id, css) {
    kaldir(id);
    const barindirici = document.createElement('div');
    barindirici.id = id;
    (document.body || document.documentElement).appendChild(barindirici);
    const golge = barindirici.attachShadow({ mode: 'open' });
    const stil = document.createElement('style');
    stil.textContent = css;
    golge.appendChild(stil);
    return golge;
  }

  function ikonDugme(etiket, metin) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ikon';
    b.setAttribute('aria-label', etiket);
    b.setAttribute('title', etiket);
    b.textContent = metin;
    return b;
  }

  /* ---------------- POST-IT (sürüklenebilir) ---------------- */
  function postitCss(p) {
    return ''
      + ':host { all: initial; }'
      + '.kutu { position: fixed; z-index: 2147483646; width: 264px; box-sizing: border-box;'
      + ' background: ' + p.bg + '; color: ' + p.metin + '; border: 1px solid ' + p.kenar + ';'
      + ' border-radius: 12px; box-shadow: 0 10px 34px rgba(9,20,45,0.22); padding: 6px 6px 2px;'
      + " font: 13px/1.45 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow-wrap: anywhere; }"
      + '.bas { display: flex; align-items: center; justify-content: flex-end; gap: 4px; cursor: grab; touch-action: none; }'
      + '.bas.tut { cursor: grabbing; }'
      + '.tutamak { margin-right: auto; font-size: 12px; color: ' + p.ikon + '; opacity: .7; padding-left: 5px; letter-spacing: -1px; }'
      + '.ikon { all: unset; cursor: pointer; box-sizing: border-box; width: 24px; height: 24px;'
      + ' line-height: 22px; text-align: center; border-radius: 7px; color: ' + p.ikon + '; background: ' + p.ikonBg + ';'
      + ' border: 1px solid ' + p.kenar + '; font: 13px/1 Inter, sans-serif; }'
      + '.ikon:hover { filter: brightness(0.96); }'
      + '.ikon:focus-visible { outline: 3px solid #85b8ff; outline-offset: 1px; }'
      + '.metin { padding: 2px 8px 10px; white-space: pre-wrap; max-height: 240px; overflow: auto; }'
      + '.mini { all: unset; position: fixed; left: 16px; bottom: 16px; z-index: 2147483646;'
      + ' cursor: pointer; box-sizing: border-box; width: 44px; height: 44px; border-radius: 12px;'
      + ' text-align: center; background: ' + p.bg + '; color: ' + p.ikon + '; border: 1px solid ' + p.kenar + ';'
      + ' box-shadow: 0 10px 34px rgba(9,20,45,0.22); font: 18px/42px Inter, sans-serif; }'
      + '.mini:focus-visible { outline: 3px solid #85b8ff; outline-offset: 2px; }';
  }

  function konumUygula(el, not, genislik, yukseklik) {
    const k = not.konum;
    if (k && typeof k.x === 'number' && typeof k.y === 'number') {
      el.style.left = Math.round(k.x * Math.max(0, window.innerWidth - genislik)) + 'px';
      el.style.top = Math.round(k.y * Math.max(0, window.innerHeight - yukseklik)) + 'px';
      el.style.bottom = 'auto';
    } else {
      el.style.left = '16px';
      el.style.bottom = '16px';
      el.style.top = 'auto';
    }
  }

  function suruklenebilirYap(kutu, baslik, not) {
    let surukluyor = false;
    let basX = 0;
    let basY = 0;
    let ilkSol = 0;
    let ilkUst = 0;

    baslik.addEventListener('pointerdown', function (e) {
      if (e.target && e.target.closest && e.target.closest('.ikon')) return; // düğmeler sürüklemez
      surukluyor = true;
      baslik.classList.add('tut');
      try { baslik.setPointerCapture(e.pointerId); } catch (err) { /* yut */ }
      const r = kutu.getBoundingClientRect();
      basX = e.clientX;
      basY = e.clientY;
      ilkSol = r.left;
      ilkUst = r.top;
      kutu.style.left = ilkSol + 'px';
      kutu.style.top = ilkUst + 'px';
      kutu.style.bottom = 'auto';
      e.preventDefault();
    });

    baslik.addEventListener('pointermove', function (e) {
      if (!surukluyor) return;
      const maxSol = Math.max(0, window.innerWidth - kutu.offsetWidth);
      const maxUst = Math.max(0, window.innerHeight - kutu.offsetHeight);
      const sol = Math.min(maxSol, Math.max(0, ilkSol + (e.clientX - basX)));
      const ust = Math.min(maxUst, Math.max(0, ilkUst + (e.clientY - basY)));
      kutu.style.left = Math.round(sol) + 'px';
      kutu.style.top = Math.round(ust) + 'px';
    });

    async function bitir(e) {
      if (!surukluyor) return;
      surukluyor = false;
      baslik.classList.remove('tut');
      try { baslik.releasePointerCapture(e.pointerId); } catch (err) { /* yut */ }
      const r = kutu.getBoundingClientRect();
      const oran = {
        x: Math.min(1, Math.max(0, r.left / Math.max(1, window.innerWidth - r.width))),
        y: Math.min(1, Math.max(0, r.top / Math.max(1, window.innerHeight - r.height))),
      };
      not.konum = oran; // aynı oturumda yeniden çizilirse yer korunsun
      await mesaj('NOT_GUNCELLE', { anahtar: not.anahtar, patch: { konum: oran } });
    }
    baslik.addEventListener('pointerup', bitir);
    baslik.addEventListener('pointercancel', bitir);
  }

  function cizPostit(not) {
    const p = palet(not.renk);
    const golge = golgeOlustur(HOST_ID, postitCss(p));

    if (not.kucuk === true) {
      const mini = document.createElement('button');
      mini.type = 'button';
      mini.className = 'mini';
      mini.setAttribute('aria-label', t('icerik.ac'));
      mini.setAttribute('title', t('icerik.ac'));
      mini.textContent = '\u2261';
      konumUygula(mini, not, 44, 44);
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
    const tutamak = document.createElement('span');
    tutamak.className = 'tutamak';
    tutamak.textContent = '\u22ee\u22ee';
    tutamak.title = t('not.tasi');
    bas.appendChild(tutamak);

    const kucult = ikonDugme(t('icerik.kucult'), '\u2212');
    kucult.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { anahtar: not.anahtar, patch: { kucuk: true } });
      degerlendir();
    });
    const kapat = ikonDugme(t('icerik.gizleSure', { s: sureMetni() }), '\u00d7');
    kapat.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { anahtar: not.anahtar, patch: { gizleUntil: Date.now() + gizleMs } });
      kaldir(HOST_ID);
    });
    bas.appendChild(kucult);
    bas.appendChild(kapat);

    const metin = document.createElement('div');
    metin.className = 'metin';
    metin.textContent = String(not.metin == null ? '' : not.metin);

    kutu.appendChild(bas);
    kutu.appendChild(metin);
    golge.appendChild(kutu);
    konumUygula(kutu, not, kutu.offsetWidth || 264, kutu.offsetHeight || 90);
    suruklenebilirYap(kutu, bas, not);
  }

  /* ---------------- BANNER (en tepede; site geneli olabilir) ---------------- */
  function cizBanner(not) {
    const p = palet(not.renk);
    const golge = golgeOlustur(BANNER_ID, ''
      + ':host { all: initial; }'
      + '.serit { position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647; box-sizing: border-box;'
      + ' background: ' + p.bg + '; color: ' + p.metin + '; border-bottom: 1px solid ' + p.kenar + ';'
      + ' box-shadow: 0 6px 20px rgba(9,20,45,0.16); padding: 9px 12px; display: flex; gap: 10px; align-items: flex-start;'
      + " font: 13.5px/1.45 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }"
      + '.metin { margin-right: auto; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 40vh; overflow: auto; }'
      + '.etiket { font-size: 10.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;'
      + ' opacity: .7; margin-right: 6px; }'
      + '.ikon { all: unset; cursor: pointer; width: 24px; height: 24px; line-height: 22px; text-align: center;'
      + ' border-radius: 7px; color: ' + p.ikon + '; background: ' + p.ikonBg + '; border: 1px solid ' + p.kenar + ';'
      + ' font: 13px/1 Inter, sans-serif; flex: 0 0 auto; }'
      + '.ikon:focus-visible { outline: 3px solid #85b8ff; outline-offset: 1px; }');

    const serit = document.createElement('div');
    serit.className = 'serit';

    const metin = document.createElement('div');
    metin.className = 'metin';
    const etiket = document.createElement('span');
    etiket.className = 'etiket';
    etiket.textContent = not.siteGeneli ? 'DTNoT · site' : 'DTNoT';
    metin.appendChild(etiket);
    metin.appendChild(document.createTextNode(String(not.metin == null ? '' : not.metin)));

    const kapat = ikonDugme(t('icerik.gizleSure', { s: sureMetni() }), '\u00d7');
    kapat.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { anahtar: not.anahtar, patch: { gizleUntil: Date.now() + gizleMs } });
      bannerKaldir();
    });

    serit.appendChild(metin);
    serit.appendChild(kapat);
    golge.appendChild(serit);

    // Yüksekliği ölç → sayfayı aşağı it (metin kaydırınca da güncelle)
    const olcVeIttir = () => {
      const h = Math.ceil(serit.getBoundingClientRect().height);
      if (h > 0 && h !== bannerYuksek) sayfaIttir(h);
    };
    try { requestAnimationFrame(olcVeIttir); } catch (e) { olcVeIttir(); }
    try {
      if (globalThis.ResizeObserver) {
        bannerRO = new ResizeObserver(olcVeIttir);
        bannerRO.observe(serit);
      }
    } catch (e) { /* yut */ }
    window.addEventListener('resize', olcVeIttir);
  }

  /* ---------------- Değerlendirme döngüsü ---------------- */
  async function degerlendir() {
    if (calisiyor) return;
    calisiyor = true;
    try {
      const anahtar = S.normalizeUrl(location.href);
      if (!anahtar) {
        sonPostit = null;
        sonBanner = null;
        kaldir(HOST_ID);
        bannerKaldir();
        return;
      }
      const { postit, banner } = await sayfaNotunuSor();
      sonPostit = postit;
      sonBanner = banner;

      if (postit) {
        const mevcut = document.getElementById(HOST_ID);
        const imza = [postit.renk, postit.kucuk === true, String(postit.metin).slice(0, 80), postit.guncelleme].join('|');
        if (!mevcut || mevcut.dataset.imza !== imza) {
          cizPostit(postit);
          const yeni = document.getElementById(HOST_ID);
          if (yeni) yeni.dataset.imza = imza;
        }
      } else {
        kaldir(HOST_ID);
      }

      if (banner) {
        const imzaB = [banner.anahtar, banner.renk, banner.guncelleme, banner.siteGeneli === true].join('|');
        const mevcutB = document.getElementById(BANNER_ID);
        if (!mevcutB || mevcutB.dataset.imza !== imzaB) {
          cizBanner(banner);
          const yeniB = document.getElementById(BANNER_ID);
          if (yeniB) yeniB.dataset.imza = imzaB;
        }
      } else {
        bannerKaldir();
      }
    } finally {
      calisiyor = false;
    }
  }

  /* Konum değişimi (SPA) + sayfa geri gelme olayları */
  let sonKonum = null;
  function konumDegistiMi() {
    const anahtar = S.normalizeUrl(location.href);
    if (anahtar !== sonKonum) {
      sonKonum = anahtar;
      degerlendir();
      return;
    }
    if ((sonPostit || sonBanner) && !document.getElementById(HOST_ID) && !document.getElementById(BANNER_ID)) degerlendir();
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
  window.addEventListener('resize', function () { if (sonPostit) degerlendir(); });
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
