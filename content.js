/* DTNoT — sayfa içi katman: post-it · banner · footer · etiket.
   Runtime kaydedilen klasik betik (top-level import YOK). Not verisi ARKA PLANDAN
   mesajla alınır (depo tek kaynak; normalizeUrl kopyası yok).

   Şema v2: sayfa başına SINIRSIZ not. Tek bir gölge kök (`dtnot-kok`) içinde dört
   görünüm çizilir:
     · postit  → sürüklenebilir kart (konum oranı saklanır), sağ altında DijitalTurk.com
     · banner  → sayfanın en tepesinde şerit (sayfayı aşağı ittirir)
     · footer  → sayfanın en altında şerit
     · etiket  → sağ alt köşede çapraz durak (bir ucu alta, bir ucu sağa dayalı)
   Her görünümde ✎ düğmesi bir menü açar: Düzenle (yerinde) / Sil. */
(function () {
  'use strict';

  try { if (window.top !== window.self) return; } catch (e) { return; } // yalnız üst pencere

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const t = (k, v) => (I ? I.t(k, v) : k);
  const KOK_ID = 'dtnot-kok';
  const BANNER_ID = 'dtnot-bannerlar';
  const FOOTER_ID = 'dtnot-footerlar';
  const ETIKET_ID = 'dtnot-etiketler';
  const POSTIT_ID = 'dtnot-postitler';
  /** Marka bağlantısı: post-it'lerin sağ altında (tek kaynak store.js). */
  const MARKA = (S && S.SAYFA_LINK) || 'https://dijitalturk.com';
  /** Köşe durağının ölçüsü — kenar uzunluğu; şerit bu kutunun köşegenine oturur. */
  const KOSE = 230;

  /** 6 renk paleti — TEK KAYNAK: assets/store.js (DTNOT_STORE.PALET). */
  const PALET = (S && S.PALET) || { sari: { bg: '#fdf6c9', kenar: '#e6d98a', metin: '#2f2b16', ikon: '#6b5f21', ikonBg: '#f7ecaa' } };
  const palet = (ad) => PALET[ad] || PALET.sari;

  let dil = 'tr';
  let gizleMs = 3600 * 1000;
  let imza = '';          // çizilen hâlin imzası (aynıysa yeniden çizilmez → sürükleme bozulmaz)
  let calisiyor = false;
  let bannerYuksek = 0;   // sayfaya eklenen üst boşluk
  let footerYuksek = 0;   // sayfaya eklenen alt boşluk
  let bannerRO = null;
  let footerRO = null;

  /* ---------- Sayfa ittirme (banner/footer üstüne binmesin) ---------- */
  function sayfaIttir(ustPx, altPx) {
    const el = document.documentElement;
    if (!el) return;
    if (el.dataset.dtnotTaban === undefined) el.dataset.dtnotTaban = el.style.paddingTop || '';
    if (el.dataset.dtnotTabanAlt === undefined) el.dataset.dtnotTabanAlt = el.style.paddingBottom || '';
    const taban = el.dataset.dtnotTaban || '';
    const tabanAlt = el.dataset.dtnotTabanAlt || '';
    const px = Math.max(0, Math.round(Number(ustPx) || 0));
    if (px > 0) {
      el.style.paddingTop = taban ? 'calc(' + taban + ' + ' + px + 'px)' : px + 'px';
      bannerYuksek = px;
    } else {
      el.style.paddingTop = taban;
      bannerYuksek = 0;
      delete el.dataset.dtnotTaban;
    }
    // Footer şeridi sayfanın ALTINI örtmesin: aynı mantık alt boşluk için.
    const pxAlt = Math.max(0, Math.round(Number(altPx) || 0));
    if (pxAlt > 0) {
      el.style.paddingBottom = tabanAlt ? 'calc(' + tabanAlt + ' + ' + pxAlt + 'px)' : pxAlt + 'px';
      footerYuksek = pxAlt;
    } else {
      el.style.paddingBottom = tabanAlt;
      footerYuksek = 0;
      delete el.dataset.dtnotTabanAlt;
    }
  }

  function kaldir(id) {
    const e = document.getElementById(id);
    if (e) e.remove();
  }

  function izlemeyiBirak() {
    if (bannerRO) { try { bannerRO.disconnect(); } catch (e) { /* yut */ } bannerRO = null; }
    if (footerRO) { try { footerRO.disconnect(); } catch (e) { /* yut */ } footerRO = null; }
    // Ölçüm için eklenen resize dinleyicileri birikmesin (her yeniden çizimde temizlenir).
    try { window.removeEventListener('resize', olcumDinleyicisi); } catch (e) { /* yut */ }
  }

  function bannerKaldir() {
    izlemeyiBirak();
    kaldir(BANNER_ID);
    kaldir(FOOTER_ID);
    sayfaIttir(0, 0);
  }

  async function ayarlariTazele() {
    try {
      const a = await S.ayarlariAl();
      dil = a.lang;
      gizleMs = a.gizlemeSaat * 3600 * 1000;
    } catch (e) { /* varsayılanla devam */ }
  }

  const sureMetni = function () { return t('saat.' + Math.round(gizleMs / 3600000)); };

  async function mesaj(tip, veri) {
    try {
      const r = await chrome.runtime.sendMessage(Object.assign({ tip: tip }, veri || {}));
      if (!r || r.__hata) return null;
      return r;
    } catch (e) { return null; }
  }

  async function sayfaNotlariniSor() {
    const bos = { postit: [], banner: [], footer: [], etiket: [], tumu: [] };
    const r = await mesaj('SAYFA_NOTLARI', { url: location.href });
    if (!r) return bos;
    return {
      postit: r.postit || [], banner: r.banner || [],
      footer: r.footer || [], etiket: r.etiket || [], tumu: r.tumu || [],
    };
  }

  /* ---------- Gölge kök + ortak parçalar ---------- */
  function golgeOlustur() {
    kaldir(KOK_ID);
    const barindirici = document.createElement('div');
    barindirici.id = KOK_ID;
    (document.body || document.documentElement).appendChild(barindirici);
    const golge = barindirici.attachShadow({ mode: 'open' });
    const stil = document.createElement('style');
    stil.textContent = stilMetni();
    golge.appendChild(stil);
    return golge;
  }

  function stilMetni() {
    return ''
      + ':host { all: initial; }'
      /* `hidden` her bileşeni ezmeli: .menu/.duzen gibi `display` tanımlı
         sınıflar tarayıcının varsayılan `[hidden]` kuralını (UA) yener —
         ui.css'te olduğu gibi burada da açıkça verilir. */
      + '[hidden] { display: none !important; }'
      + '.bannerlar { position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647; display: flex; flex-direction: column; }'
      + '.footerlar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 2147483647; display: flex; flex-direction: column; }'
      + '.serit { box-sizing: border-box; background: var(--bg); color: var(--metin);'
      + ' border-bottom: 1px solid var(--kenar); box-shadow: 0 6px 20px rgba(9,20,45,0.16);'
      + ' padding: 9px 12px; display: flex; flex-direction: column; gap: 8px;'
      + " font: 13.5px/1.45 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }"
      + '.footerlar .serit { border-bottom: 0; border-top: 1px solid var(--kenar); box-shadow: 0 -6px 20px rgba(9,20,45,0.16); }'
      + '.serit__ust { position: relative; display: block; padding: 0 58px; }'
      + '.serit__metin { text-align: center; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 40vh; overflow: auto; }'
      + '.serit__dugme { position: absolute; right: 0; top: 0; display: flex; gap: 4px; }'
      + '.etiket-ad { font-size: 10.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; opacity: .7; margin-right: 6px; }'
      + '.ikon { all: unset; cursor: pointer; box-sizing: border-box; width: 24px; height: 24px; flex: none;'
      + ' line-height: 22px; text-align: center; border-radius: 7px; color: var(--ikon); background: var(--ikonBg);'
      + ' border: 1px solid var(--kenar); font: 13px/1 Inter, sans-serif; }'
      + '.ikon:hover { filter: brightness(0.96); }'
      + '.ikon:focus-visible { outline: 3px solid #85b8ff; outline-offset: 1px; }'
      + '.ikon--mini { width: 20px; height: 20px; line-height: 18px; font-size: 11px; }'
      /* post-it */
      + '.kutu { position: fixed; z-index: 2147483646; width: 264px; box-sizing: border-box;'
      + ' background: var(--bg); color: var(--metin); border: 1px solid var(--kenar);'
      + ' border-radius: 12px; box-shadow: 0 10px 34px rgba(9,20,45,0.22); padding: 6px 6px 2px;'
      + " font: 13px/1.45 Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; overflow-wrap: anywhere; }"
      + '.bas { display: flex; align-items: center; justify-content: flex-end; gap: 4px; cursor: grab; touch-action: none; }'
      + '.bas.tut { cursor: grabbing; }'
      + '.tutamak { margin-right: auto; font-size: 12px; color: var(--ikon); opacity: .7; padding-left: 5px; letter-spacing: -1px; }'
      + '.metin { padding: 2px 8px 6px; white-space: pre-wrap; max-height: 240px; overflow: auto; }'
      + '.alt { display: flex; justify-content: flex-end; padding: 0 8px 6px; }'
      + '.marka { font-size: 10px; color: var(--ikon); opacity: .75; text-decoration: none; border-bottom: 1px solid transparent; }'
      + '.marka:hover { opacity: 1; border-bottom-color: currentColor; }'
      + '.mini { all: unset; position: fixed; left: 16px; bottom: 16px; z-index: 2147483646;'
      + ' cursor: pointer; box-sizing: border-box; width: 44px; height: 44px; border-radius: 12px;'
      + ' text-align: center; background: var(--bg); color: var(--ikon); border: 1px solid var(--kenar);'
      + ' box-shadow: 0 10px 34px rgba(9,20,45,0.22); font: 18px/42px Inter, sans-serif; }'
      + '.mini:focus-visible { outline: 3px solid #85b8ff; outline-offset: 2px; }'
      /* etiket (köşe durağı) */
      + '.kose { position: fixed; right: 0; bottom: 0; width: ' + KOSE + 'px; height: ' + KOSE + 'px;'
      + ' overflow: hidden; z-index: 2147483645; pointer-events: none; }'
      + '.kose__serit { position: absolute; left: 50%; top: 50%; width: ' + Math.round(KOSE * 1.4142) + 'px; height: 40px;'
      + ' transform: translate(-50%, -50%) rotate(-45deg); box-sizing: border-box;'
      + ' background: var(--bg); color: var(--metin); border-top: 1px solid var(--kenar); border-bottom: 1px solid var(--kenar);'
      + ' display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 12px;'
      + ' font: 12px/1.2 Inter, sans-serif; pointer-events: auto; }'
      + '.kose__metin { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; padding: 0 46px; }'
      + '.kose__dugme { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); display: flex; gap: 4px; }'
      + '.kose__menu { position: fixed; right: 12px; bottom: 12px; width: 230px; z-index: 2147483647; }'
      /* menü + düzenleyici (dört görünümde ortak) */
      + '.menu { display: flex; flex-direction: column; gap: 2px; background: var(--ikonBg); border: 1px solid var(--kenar);'
      + ' border-radius: 10px; padding: 4px; box-shadow: 0 8px 22px rgba(9,20,45,0.25); }'
      + '.menu__og { all: unset; cursor: pointer; padding: 6px 10px; border-radius: 7px; font: 12px/1.2 Inter, sans-serif; color: var(--metin); }'
      + '.menu__og:hover { background: rgba(0,0,0,0.08); }'
      + '.menu__og--sil { color: #b91c1c; font-weight: 600; }'
      + '.duzen { display: flex; flex-direction: column; gap: 8px; }'
      + '.duzen__metin { box-sizing: border-box; width: 100%; min-height: 78px; resize: vertical; border-radius: 9px;'
      + ' border: 1px solid var(--kenar); background: rgba(255,255,255,0.6); color: var(--metin); padding: 7px 9px;'
      + ' font: 12.5px/1.4 Inter, sans-serif; }'
      + '.duzen__satir { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }'
      + '.duzen__ad { font-size: 9.5px; text-transform: uppercase; letter-spacing: .08em; font-weight: 700; opacity: .7; }'
      + '.renk-sec { all: unset; cursor: pointer; box-sizing: border-box; width: 20px; height: 20px; border-radius: 999px;'
      + ' background: var(--r-bg); border: 2px solid var(--r-kenar); }'
      + '.renk-sec[data-secili="1"] { box-shadow: 0 0 0 2px var(--metin); }'
      + '.dug-sec { all: unset; cursor: pointer; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--kenar);'
      + ' font: 11.5px/1.2 Inter, sans-serif; color: var(--metin); }'
      + '.dug-sec[data-secili="1"] { background: rgba(0,0,0,0.12); font-weight: 700; }'
      + '.duzen__alt { display: flex; gap: 8px; }'
      + '.dug { all: unset; cursor: pointer; padding: 6px 13px; border-radius: 9px; border: 1px solid var(--kenar);'
      + ' font: 12px/1.2 Inter, sans-serif; font-weight: 600; color: var(--metin); text-align: center; }'
      + '.dug--kaydet { background: var(--ikonBg); }'
      + '.dug:hover { filter: brightness(0.96); }'
      + '.onay { display: inline-flex; align-items: center; gap: 6px; font: 11.5px/1.3 Inter, sans-serif; color: var(--metin); }'
      + '.onay input { accent-color: #10b981; }';
  }

  function stilUygula(el, not) {
    const p = palet(not.renk);
    el.style.setProperty('--bg', p.bg);
    el.style.setProperty('--kenar', p.kenar);
    el.style.setProperty('--metin', p.metin);
    el.style.setProperty('--ikon', p.ikon);
    el.style.setProperty('--ikonBg', p.ikonBg);
    return el;
  }

  function ikonDugme(etiket, metin, ekSinif) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ikon' + (ekSinif ? ' ' + ekSinif : '');
    b.setAttribute('aria-label', etiket);
    b.setAttribute('title', etiket);
    b.textContent = metin;
    return b;
  }

  function markaLinki() {
    const a = document.createElement('a');
    a.className = 'marka';
    a.href = MARKA;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'DijitalTurk.com';
    // Sayfanın tıklama dinleyicileri bağlantıyı yutmasın.
    a.addEventListener('click', (e) => e.stopPropagation());
    a.addEventListener('pointerdown', (e) => e.stopPropagation());
    return a;
  }

  /* ---------- Kaydet / sil / gizle eylemleri ---------- */
  async function kaydetVeTazele(id, patch) {
    const r = await mesaj('NOT_GUNCELLE', { id: id, patch: patch });
    if (r) { imza = ''; await degerlendir(); }
    return !!r;
  }

  async function silOnayi(not) {
    let onay = true;
    try { onay = window.confirm(t('ortak.silOnay')); } catch (e) { onay = true; }
    if (!onay) return false;
    const r = await mesaj('NOT_SIL', { id: not.id });
    return !!r;
  }

  /* ---------- Ortak çizim parçaları ---------- */
  /** ✎ düğmesi + açılır menü (Düzenle / Sil). `duzenle` çağrısı düzenleyiciyi açar. */
  function menuKur(not, kap, duzenle) {
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.hidden = true;

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'menu__og';
    edit.dataset.eylem = 'duzenle';
    edit.textContent = t('ortak.duzenle');
    edit.addEventListener('click', () => { menu.hidden = true; duzenle(); });

    const sil = document.createElement('button');
    sil.type = 'button';
    sil.className = 'menu__og menu__og--sil';
    sil.dataset.eylem = 'sil';
    sil.textContent = t('ortak.sil');
    sil.addEventListener('click', async () => {
      menu.hidden = true;
      if (await silOnayi(not)) { imza = ''; await degerlendir(); }
    });

    menu.appendChild(edit);
    menu.appendChild(sil);

    const dugme = ikonDugme(t('icerik.duzenle'), '\u270e');
    dugme.dataset.eylem = 'menu';
    dugme.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    kap.appendChild(dugme);
    return { dugme: dugme, menu: menu };
  }

  /** Yerinde düzenleyici: metin + renk + görünüm + site geneli + Kaydet/Vazgeç. */
  function duzenleyici(not, kapat) {
    const kap = document.createElement('div');
    kap.className = 'duzen';
    const yerel = {
      metin: String(not.metin || ''),
      renk: not.renk || 'sari',
      gorunum: (S && S.gorunumOf) ? S.gorunumOf(not) : 'postit',
      siteGeneli: not.siteGeneli === true,
    };

    const alan = document.createElement('textarea');
    alan.className = 'duzen__metin';
    alan.value = yerel.metin;
    alan.maxLength = (S && S.METIN_MAX) || 4000;
    kap.appendChild(alan);

    const renkSatir = document.createElement('div');
    renkSatir.className = 'duzen__satir';
    const renkAd = document.createElement('span');
    renkAd.className = 'duzen__ad';
    renkAd.textContent = t('not.renk');
    renkSatir.appendChild(renkAd);
    const renkDugmeleri = [];
    ((S && S.RENKLER) || ['sari']).forEach((r) => {
      const p = palet(r);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'renk-sec';
      b.style.setProperty('--r-bg', p.bg);
      b.style.setProperty('--r-kenar', p.kenar);
      b.dataset.renk = r;
      b.setAttribute('data-secili', yerel.renk === r ? '1' : '0');
      b.setAttribute('aria-label', t('renk.' + r));
      b.title = t('renk.' + r);
      b.addEventListener('click', () => {
        yerel.renk = r;
        renkDugmeleri.forEach((d) => d.setAttribute('data-secili', d.dataset.renk === r ? '1' : '0'));
      });
      renkDugmeleri.push(b);
      renkSatir.appendChild(b);
    });
    kap.appendChild(renkSatir);

    const gorSatir = document.createElement('div');
    gorSatir.className = 'duzen__satir';
    const gorAd = document.createElement('span');
    gorAd.className = 'duzen__ad';
    gorAd.textContent = t('not.gorunum');
    gorSatir.appendChild(gorAd);
    const gorDugmeleri = [];
    ((S && S.GORUNUMLER) || ['postit']).forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dug-sec';
      b.dataset.gorunum = g;
      b.setAttribute('data-secili', yerel.gorunum === g ? '1' : '0');
      b.textContent = t('gorunum.' + g);
      b.addEventListener('click', () => {
        yerel.gorunum = g;
        gorDugmeleri.forEach((d) => d.setAttribute('data-secili', d.dataset.gorunum === g ? '1' : '0'));
      });
      gorDugmeleri.push(b);
      gorSatir.appendChild(b);
    });
    kap.appendChild(gorSatir);

    const siteKutu = document.createElement('label');
    siteKutu.className = 'onay';
    const siteChk = document.createElement('input');
    siteChk.type = 'checkbox';
    siteChk.checked = yerel.siteGeneli;
    siteChk.addEventListener('change', () => { yerel.siteGeneli = siteChk.checked; });
    const siteYazi = document.createElement('span');
    siteYazi.textContent = t('not.siteGeneli');
    siteKutu.appendChild(siteChk);
    siteKutu.appendChild(siteYazi);
    kap.appendChild(siteKutu);

    const alt = document.createElement('div');
    alt.className = 'duzen__alt';
    const kaydet = document.createElement('button');
    kaydet.type = 'button';
    kaydet.className = 'dug dug--kaydet';
    kaydet.dataset.eylem = 'kaydet';
    kaydet.textContent = t('ortak.kaydet');
    kaydet.addEventListener('click', async () => {
      const metin = String(alan.value || '');
      if (!metin.trim()) return;
      await kaydetVeTazele(not.id, {
        metin: metin,
        renk: yerel.renk,
        gorunum: yerel.gorunum,
        siteGeneli: yerel.siteGeneli,
        kucuk: false,
        gizleUntil: 0,
      });
    });
    const vazgec = document.createElement('button');
    vazgec.type = 'button';
    vazgec.className = 'dug';
    vazgec.dataset.eylem = 'vazgec';
    vazgec.textContent = t('ortak.vazgec');
    vazgec.addEventListener('click', () => kapat());
    alt.appendChild(kaydet);
    alt.appendChild(vazgec);
    kap.appendChild(alt);
    return kap;
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
      await mesaj('NOT_GUNCELLE', { id: not.id, patch: { konum: oran } });
    }
    baslik.addEventListener('pointerup', bitir);
    baslik.addEventListener('pointercancel', bitir);
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

  /* ---------------- POST-IT (sürüklenebilir, görünümü değiştirilebilir) ---------------- */
  function cizPostit(not) {
    if (not.kucuk === true) {
      const mini = document.createElement('button');
      mini.type = 'button';
      mini.className = 'mini';
      mini.setAttribute('aria-label', t('icerik.ac'));
      mini.setAttribute('title', t('icerik.ac'));
      mini.textContent = '\u2261';
      stilUygula(mini, not);
      konumUygula(mini, not, 44, 44);
      mini.addEventListener('click', async () => {
        await mesaj('NOT_GUNCELLE', { id: not.id, patch: { kucuk: false } });
        imza = '';
        degerlendir();
      });
      return mini;
    }

    const kutu = stilUygula(document.createElement('div'), not);
    kutu.className = 'kutu';

    const bas = document.createElement('div');
    bas.className = 'bas';
    const tutamak = document.createElement('span');
    tutamak.className = 'tutamak';
    tutamak.textContent = '\u22ee\u22ee';
    tutamak.title = t('not.tasi');
    bas.appendChild(tutamak);

    const kucult = ikonDugme(t('icerik.kucult'), '\u2212');
    kucult.dataset.eylem = 'kucult';
    kucult.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { id: not.id, patch: { kucuk: true } });
      imza = '';
      degerlendir();
    });
    bas.appendChild(kucult);

    const govde = document.createElement('div');
    const metin = document.createElement('div');
    metin.className = 'metin';
    metin.textContent = String(not.metin == null ? '' : not.metin);
    const alt = document.createElement('div');
    alt.className = 'alt';
    alt.appendChild(markaLinki());
    govde.appendChild(metin);
    govde.appendChild(alt);

    let duzenAcik = false;
    const duzenKap = document.createElement('div');
    duzenKap.hidden = true;
    const duzenle = () => {
      if (duzenAcik) return;
      duzenAcik = true;
      duzenKap.textContent = '';
      govde.hidden = true;
      duzenKap.hidden = false;
      duzenKap.appendChild(duzenleyici(not, () => {
        duzenAcik = false;
        duzenKap.hidden = true;
        govde.hidden = false;
      }));
    };

    const kapat = ikonDugme(t('icerik.gizleSure', { s: sureMetni() }), '\u00d7');
    kapat.dataset.eylem = 'kapat';
    kapat.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { id: not.id, patch: { gizleUntil: Date.now() + gizleMs } });
      imza = '';
      degerlendir();
    });

    const menu = menuKur(not, bas, duzenle);
    bas.appendChild(menu.dugme);
    bas.appendChild(kapat);

    kutu.appendChild(bas);
    kutu.appendChild(menu.menu);
    kutu.appendChild(govde);
    kutu.appendChild(duzenKap);
    // Konum, öğe DOM'a girdikten SONRA uygulanır (gerçek ölçüyle) → degerlendir().
    suruklenebilirYap(kutu, bas, not);
    return kutu;
  }

  /* ---------------- BANNER / FOOTER şeridi ---------------- */
  function cizSerit(not) {
    const serit = stilUygula(document.createElement('div'), not);
    serit.className = 'serit';

    const ust = document.createElement('div');
    ust.className = 'serit__ust';
    const metin = document.createElement('div');
    metin.className = 'serit__metin';
    const ad = document.createElement('span');
    ad.className = 'etiket-ad';
    ad.textContent = not.siteGeneli === true ? 'DTNoT \u00b7 site' : 'DTNoT';
    metin.appendChild(ad);
    metin.appendChild(document.createTextNode(String(not.metin == null ? '' : not.metin)));
    ust.appendChild(metin);

    let duzenAcik = false;
    const duzenKap = document.createElement('div');
    duzenKap.hidden = true;
    duzenKap.className = 'duzen';
    const duzenle = () => {
      if (duzenAcik) return;
      duzenAcik = true;
      duzenKap.textContent = '';
      ust.hidden = true;
      duzenKap.hidden = false;
      duzenKap.appendChild(duzenleyici(not, () => {
        duzenAcik = false;
        duzenKap.hidden = true;
        ust.hidden = false;
      }));
    };

    // Düğmeler SAĞ UÇTA mutlak konumda: metin tam ORTADA kalsın.
    const dugmeler = document.createElement('div');
    dugmeler.className = 'serit__dugme';
    const menu = menuKur(not, dugmeler, duzenle);
    const kapat = ikonDugme(t('icerik.gizleSure', { s: sureMetni() }), '\u00d7');
    kapat.dataset.eylem = 'kapat';
    kapat.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { id: not.id, patch: { gizleUntil: Date.now() + gizleMs } });
      imza = '';
      degerlendir();
    });
    dugmeler.appendChild(kapat);
    ust.appendChild(dugmeler);

    serit.appendChild(ust);
    serit.appendChild(menu.menu);
    serit.appendChild(duzenKap);
    return serit;
  }

  /* ---------------- ETİKET (sağ alt köşede çapraz durak) ---------------- */
  function cizEtiket(not, golge) {
    const p = palet(not.renk);
    const kose = document.createElement('div');
    kose.className = 'kose';

    const serit = document.createElement('div');
    serit.className = 'kose__serit';
    serit.style.setProperty('--bg', p.bg);
    serit.style.setProperty('--kenar', p.kenar);
    serit.style.setProperty('--metin', p.metin);
    serit.style.setProperty('--ikon', p.ikon);
    serit.style.setProperty('--ikonBg', p.ikonBg);

    const metin = document.createElement('span');
    metin.className = 'kose__metin';
    metin.textContent = String(not.metin == null ? '' : not.metin);
    metin.title = String(not.metin == null ? '' : not.metin);
    serit.appendChild(metin);

    // Menü ve düzenleyici döndürülmüş şeridin DIŞINDA durur (okunur kalsın).
    const disKap = document.createElement('div');
    disKap.className = 'kose__menu';
    disKap.style.setProperty('--bg', p.bg);
    disKap.style.setProperty('--kenar', p.kenar);
    disKap.style.setProperty('--metin', p.metin);
    disKap.style.setProperty('--ikon', p.ikon);
    disKap.style.setProperty('--ikonBg', p.ikonBg);

    let duzenAcik = false;
    const duzenKap = document.createElement('div');
    duzenKap.hidden = true;
    const duzenle = () => {
      if (duzenAcik) return;
      duzenAcik = true;
      duzenKap.textContent = '';
      duzenKap.hidden = false;
      duzenKap.appendChild(duzenleyici(not, () => {
        duzenAcik = false;
        duzenKap.hidden = true;
        duzenKap.textContent = '';
      }));
    };

    // Düğmeler şeridin SAĞ UCUNDA mutlak konumda: metin tam ORTADA kalsın.
    const dugmeler = document.createElement('div');
    dugmeler.className = 'kose__dugme';
    const menu = menuKur(not, dugmeler, duzenle);
    menu.dugme.classList.add('ikon--mini');

    const kapat = ikonDugme(t('icerik.gizleSure', { s: sureMetni() }), '\u00d7', 'ikon--mini');
    kapat.dataset.eylem = 'kapat';
    kapat.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { id: not.id, patch: { gizleUntil: Date.now() + gizleMs } });
      imza = '';
      degerlendir();
    });
    dugmeler.appendChild(kapat);
    serit.appendChild(dugmeler);

    disKap.appendChild(menu.menu);
    disKap.appendChild(duzenKap);
    kose.appendChild(serit);
    golge.appendChild(kose);
    golge.appendChild(disKap);
    return null;
  }

  /* ---------------- Değerlendirme döngüsü ---------------- */
  function notImzasi(notlar) {
    return (notlar || []).map((n) => [
      n.id, n.renk, (S && S.gorunumOf) ? S.gorunumOf(n) : n.gorunum,
      n.kucuk === true ? 1 : 0, n.metin, n.siteGeneli === true ? 1 : 0, n.anahtar,
    ].join('\u0001')).join('\u0002');
  }

  async function degerlendir() {
    if (calisiyor) return;
    calisiyor = true;
    try {
      const anahtar = S.normalizeUrl(location.href);
      if (!anahtar) { bannerKaldir(); kaldir(KOK_ID); imza = ''; return; }
      const veri = await sayfaNotlariniSor();
      const yeniImza = notImzasi(veri.tumu);
      if (yeniImza === imza && document.getElementById(KOK_ID)) return;
      imza = yeniImza;

      if (!veri.tumu.length) { bannerKaldir(); kaldir(KOK_ID); return; }

      const golge = golgeOlustur();

      // post-it'ler
      if (veri.postit.length) {
        const kap = document.createElement('div');
        kap.id = POSTIT_ID;
        veri.postit.forEach((n) => kap.appendChild(cizPostit(n)));
        golge.appendChild(kap);
        // Öğeler artık yerleşimde: konum GERÇEK ölçüyle uygulanır (kart yüksekliği değişebilir).
        Array.prototype.forEach.call(kap.children, (el, i) => {
          const n = veri.postit[i];
          if (!n || !el.classList || !el.classList.contains('kutu')) return;
          konumUygula(el, n, el.offsetWidth || 264, el.offsetHeight || 110);
        });
      }
      // etiketler (sağ alt köşe durakları)
      if (veri.etiket.length) {
        const kap = document.createElement('div');
        kap.id = ETIKET_ID;
        veri.etiket.forEach((n) => cizEtiket(n, kap));
        golge.appendChild(kap);
      }
      // footer şeritleri
      if (veri.footer.length) {
        const kap = document.createElement('div');
        kap.id = FOOTER_ID;
        kap.className = 'footerlar';
        veri.footer.forEach((n) => kap.appendChild(cizSerit(n)));
        golge.appendChild(kap);
        olcVeIttir(kap, 'alt');
      } else { sayfaIttir(bannerYuksek, 0); }
      // banner şeritleri
      if (veri.banner.length) {
        const kap = document.createElement('div');
        kap.id = BANNER_ID;
        kap.className = 'bannerlar';
        veri.banner.forEach((n) => kap.appendChild(cizSerit(n)));
        golge.appendChild(kap);
        olcVeIttir(kap, 'ust');
      } else { sayfaIttir(0, footerYuksek); }
    } finally {
      calisiyor = false;
    }
  }

  /** Şerit yüksekliğini ölç → sayfayı it (metin kaydırılınca da güncelle).
      Tek bir resize dinleyicisi kullanılır; yeni ölçüm kurulurken öncekiler bırakılır. */
  let olcumDinleyicisi = null;
  function olcVeIttir(kap, yon) {
    const olc = () => {
      const h = Math.ceil(kap.getBoundingClientRect().height);
      if (h <= 0) return;
      if (yon === 'ust') sayfaIttir(h, footerYuksek);
      else sayfaIttir(bannerYuksek, h);
    };
    try { requestAnimationFrame(olc); } catch (e) { olc(); }
    try {
      if (globalThis.ResizeObserver) {
        const ro = new ResizeObserver(olc);
        ro.observe(kap);
        if (yon === 'ust') bannerRO = ro; else footerRO = ro;
      }
    } catch (e) { /* yut */ }
    if (olcumDinleyicisi) { try { window.removeEventListener('resize', olcumDinleyicisi); } catch (e) { /* yut */ } }
    olcumDinleyicisi = olc;
    window.addEventListener('resize', olcumDinleyicisi);
  }

  /* Konum değişimi (SPA) + sayfa geri gelme olayları */
  let sonKonum = null;
  function konumDegistiMi() {
    const anahtar = S.normalizeUrl(location.href);
    if (anahtar !== sonKonum) {
      sonKonum = anahtar;
      imza = '';
      degerlendir();
      return;
    }
    if (!document.getElementById(KOK_ID)) degerlendir();
  }

  try {
    const push = history.pushState;
    const replace = history.replaceState;
    history.pushState = function () { const r = push.apply(this, arguments); konumDegistiMi(); return r; };
    history.replaceState = function () { const r = replace.apply(this, arguments); konumDegistiMi(); return r; };
  } catch (e) { /* yamalanamazsa poll yeter */ }

  window.addEventListener('popstate', konumDegistiMi);
  window.addEventListener('hashchange', konumDegistiMi);
  window.addEventListener('focus', function () { imza = ''; degerlendir(); });
  window.addEventListener('pageshow', function () { imza = ''; degerlendir(); });
  window.addEventListener('resize', function () { imza = ''; degerlendir(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { imza = ''; degerlendir(); } });
  setInterval(konumDegistiMi, 2500); // yedek yoklama (SPA + geç yüklenen içerik)

  try {
    chrome.storage.onChanged.addListener(function (degisim, alan) {
      if (alan !== 'local') return;
      if ('web-not-store' in degisim || 'web-not-settings' in degisim) {
        ayarlariTazele().then(function () { imza = ''; return degerlendir(); });
      }
    });
  } catch (e) { /* dinleyici yoksa poll yeter */ }

  try {
    chrome.runtime.onMessage.addListener(function (mesaj, _gonderen, yanitla) {
      if (!mesaj || mesaj.tip !== 'dtnot-yenile') return undefined;
      imza = '';
      degerlendir();
      try { yanitla({ canli: true, anahtar: S.normalizeUrl(location.href) }); } catch (e) { /* yut */ }
      return true;
    });
  } catch (e) { /* mesaj kanalı yoksa geç */ }

  ayarlariTazele().then(degerlendir);
})();
