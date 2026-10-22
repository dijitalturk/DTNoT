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

  if (globalThis.__dtnotContentLoaded) return;
  globalThis.__dtnotContentLoaded = true;

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
  /** Notlar arasında bırakılacak boşluk (px) — çakışma önleme. */
  const ARALIK = 10;
  /** Köşe durakları arası dikey aralık: her yeni etiket bir öncekinin ÜSTÜNE. */
  const KOSE_ADIM = 68;

  /** 6 renk paleti — TEK KAYNAK: assets/store.js (DTNOT_STORE.PALET). */
  const PALET = (S && S.PALET) || { sari: { bg: '#fdf6c9', kenar: '#e6d98a', metin: '#2f2b16', ikon: '#6b5f21', ikonBg: '#f7ecaa' } };
  const palet = (ad) => PALET[ad] || PALET.sari;

  let dil = 'tr';
  let gizleMs = 3600 * 1000;
  let imza = '';          // çizilen hâlin imzası (aynıysa yeniden çizilmez → sürükleme bozulmaz)
  let calisiyor = false;
  let yenileBekliyor = false;
  let postitRO = null;
  let gosterimZamani = null;
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
    if (postitRO) { postitRO.disconnect(); postitRO = null; }
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
    const r = await mesaj('SAYFA_NOTLARI', { url: location.href });
    if (!r) return null;
    return {
      postit: r.postit || [], banner: r.banner || [],
      footer: r.footer || [], etiket: r.etiket || [], tumu: r.tumu || [],
      sonrakiGosterim: Number(r.sonrakiGosterim) || 0,
    };
  }

  /* ---------- Gölge kök + ortak parçalar ---------- */
  function golgeOlustur() {
    izlemeyiBirak();
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
      // Şeritteki menü, ✎ düğmesinin altında DERLİ TOPLU bir kart olsun (tam genişlik olmasın).
      + '.serit .menu { align-self: flex-end; min-width: 170px; }'
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
      + '.kutu { max-width: 100vw; max-height: 100vh; overflow: auto; }'
      + '.bannerlar, .footerlar { max-height: 100vh; overflow: auto; }'
      + '.kose__menu { max-width: calc(100vw - 24px); max-height: calc(100vh - 24px); overflow: auto; }'
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
      + '.kose { position: fixed; right: 0; bottom: 0; overflow: hidden; z-index: 2147483645; pointer-events: none; }'
      + '.kose__serit { position: absolute; height: 40px;'
      + ' transform: translate(-50%, -50%) rotate(-45deg); box-sizing: border-box;'
      + ' background: var(--bg); color: var(--metin); border-top: 1px solid var(--kenar); border-bottom: 1px solid var(--kenar);'
      + ' display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 12px;'
      + ' font: 12px/1.2 Inter, sans-serif; pointer-events: auto; }'
      + '.kose__metin { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; padding: 0 46px; }'
      + '.kose__dugme { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); display: flex; gap: 4px; }'
      + '.kose__menu { position: fixed; right: 12px; bottom: 12px; width: 230px; z-index: 2147483647;'
      + ' box-sizing: border-box; background: var(--bg); color: var(--metin); border: 1px solid var(--kenar);'
      + ' border-radius: 12px; padding: 10px; box-shadow: 0 10px 34px rgba(9,20,45,0.22); }'
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
  function menuKur(not, kap, duzenle, degisti = () => {}) {
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.hidden = true;

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'menu__og';
    edit.dataset.eylem = 'duzenle';
    edit.textContent = t('ortak.duzenle');
    edit.addEventListener('click', () => { menu.hidden = true; duzenle(); degisti(); });

    const sil = document.createElement('button');
    sil.type = 'button';
    sil.className = 'menu__og menu__og--sil';
    sil.dataset.eylem = 'sil';
    sil.textContent = t('ortak.sil');
    sil.addEventListener('click', async () => {
      menu.hidden = true;
      degisti();
      if (await silOnayi(not)) { imza = ''; await degerlendir(); }
    });

    menu.appendChild(edit);
    menu.appendChild(sil);
    const vazgec = document.createElement('button');
    vazgec.type = 'button';
    vazgec.className = 'menu__og';
    vazgec.dataset.eylem = 'vazgec';
    vazgec.textContent = t('ortak.vazgec');
    vazgec.addEventListener('click', () => { menu.hidden = true; degisti(); });
    menu.appendChild(vazgec);

    const dugme = ikonDugme(t('icerik.duzenle'), '\u270e');
    dugme.dataset.eylem = 'menu';
    dugme.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      degisti();
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
    const hata = document.createElement('div');
    hata.setAttribute('role', 'alert');
    kap.appendChild(hata);
    kaydet.addEventListener('click', async () => {
      const metin = String(alan.value || '');
      if (!metin.trim()) return;
      if (kaydet.disabled) return;
      kaydet.disabled = true;
      hata.textContent = '';
      const basarili = await kaydetVeTazele(not.id, {
        metin: metin,
        renk: yerel.renk,
        gorunum: yerel.gorunum,
        siteGeneli: yerel.siteGeneli,
        kucuk: false,
        gizleUntil: 0,
      });
      kaydet.disabled = false;
      if (basarili) kapat();
      else hata.textContent = t('popup.kaydetHata');
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
      // Bırakılan yer başka bir notun üstündeyse en yakın BOŞ konuma oturt (üst üste binmesin).
      const digerleri = yerlesim.filter((b) => b.id !== not.id).concat(kapliBolge);
      const yer = yerBul(digerleri, r.width, r.height, { left: r.left, top: r.top });
      kutu.style.left = yer.sol + 'px';
      kutu.style.top = yer.ust + 'px';
      kutu.style.bottom = 'auto';
      const mevcut = yerlesim.findIndex((b) => b.id === not.id);
      const bilgi = kutuYap(yer.sol, yer.ust, r.width, r.height, not.id);
      if (mevcut === -1) yerlesim.push(bilgi); else yerlesim[mevcut] = bilgi;
      const oran = konumOrani(yer.sol, yer.ust, r.width, r.height);
      not.konum = oran; // aynı oturumda yeniden çizilirse yer korunsun
      await mesaj('NOT_GUNCELLE', { id: not.id, patch: { konum: oran } });
    }
    baslik.addEventListener('pointerup', bitir);
    baslik.addEventListener('pointercancel', bitir);
  }

  /* ---------------- YERLEŞİM (notlar birbirinin üzerine binmesin) ----------------
     Kural: yeni not mevcudun SAĞINA eklenme eğilimindedir; sürükleyip bırakıldığında da
     başka bir notun üstüne binemez — en yakın boş konuma oturtulur. */
  let yerlesim = [];     // çizilmiş post-it'lerin viewport kutuları
  let kapliBolge = [];   // şeritlerin/köşe durağının kapladığı bölgeler (post-it bunlara da binmez)

  function kutuYap(sol, ust, w, h, id) {
    return { id: id || null, sol: sol, ust: ust, sag: sol + w, alt: ust + h };
  }

  function kutuCakisir(a, b) {
    return !(a.sag + ARALIK <= b.sol || b.sag + ARALIK <= a.sol ||
             a.alt + ARALIK <= b.ust || b.alt + ARALIK <= a.ust);
  }

  /** Kayıtlı konum oranını piksele çevir (yoksa null → varsayılan sol alt). */
  function konumPx(not, w, h) {
    const k = not && not.konum;
    if (!k || typeof k.x !== 'number' || typeof k.y !== 'number') return null;
    return {
      left: Math.round(k.x * Math.max(0, window.innerWidth - w)),
      top: Math.round(k.y * Math.max(0, window.innerHeight - h)),
    };
  }

  /** Piksel konumunu pencere oranına çevir (depoya yazılan biçim). */
  function konumOrani(sol, ust, w, h) {
    return {
      x: Math.min(1, Math.max(0, sol / Math.max(1, window.innerWidth - w))),
      y: Math.min(1, Math.max(0, ust / Math.max(1, window.innerHeight - h))),
    };
  }

  /** ÇAKIŞMAYAN yer bul. Tercih sırası: aday konum → en yakın notun SAĞI → ALTI → ÜSTÜ → SOLU
      → ızgara taraması (sol alttan başlayıp sağa ve yukarı). */
  function yerBul(dolu, w, h, aday) {
    const vw = Math.max(0, window.innerWidth);
    const vh = Math.max(0, window.innerHeight);
    const sigar = (x, y) => x >= 0 && y >= 0 && x + w <= vw && y + h <= vh;
    const musait = (x, y) => sigar(x, y) && !(dolu || []).some((b) => kutuCakisir(kutuYap(x, y, w, h), b));

    const denemeler = [];
    if (aday) {
      const x = Math.min(Math.max(0, Math.round(aday.left)), Math.max(0, vw - w));
      const y = Math.min(Math.max(0, Math.round(aday.top)), Math.max(0, vh - h));
      if (musait(x, y)) return { sol: x, ust: y };
    }
    const hedefX = aday ? aday.left : 16;
    const hedefY = aday ? aday.top : (vh - h - 16);
    (dolu || []).slice().sort((a, b) =>
      (Math.abs(a.sag - hedefX) + Math.abs(a.ust - hedefY)) -
      (Math.abs(b.sag - hedefX) + Math.abs(b.ust - hedefY))
    ).forEach((b) => {
      denemeler.push([Math.round(b.sag + ARALIK), Math.round(b.ust)]);          // SAĞI
      denemeler.push([Math.round(b.sol), Math.round(b.alt + ARALIK)]);          // ALTI
      denemeler.push([Math.round(b.sol), Math.round(b.ust - h - ARALIK)]);      // ÜSTÜ
      denemeler.push([Math.round(b.sol - w - ARALIK), Math.round(b.ust)]);      // SOLU
    });
    for (const [x, y] of denemeler) {
      if (musait(x, y)) return { sol: x, ust: y };
    }
    for (let y = vh - h - 16; y >= 4; y -= (h + ARALIK)) {
      for (let x = 16; x + w <= vw - 4; x += (w + ARALIK)) {
        if (musait(Math.round(x), Math.round(y))) return { sol: Math.round(x), ust: Math.round(y) };
      }
    }
    // Hiç boş yer yoksa: adayı görünür alana sıkıştır (üst üste binse bile ekran dışına taşma).
    const x = aday ? aday.left : 16;
    const y = aday ? aday.top : (vh - h - 16);
    return {
      sol: Math.round(Math.min(Math.max(0, x), Math.max(0, vw - w))),
      ust: Math.round(Math.min(Math.max(0, y), Math.max(0, vh - h))),
    };
  }

  /** Eskiden yeniye sıra: yeni notlar SAĞA (post-it) / ALTA (şerit) / ÜSTE (etiket) eklenir. */
  function eskidenYeniye(liste) {
    return (liste || []).slice().sort((a, b) =>
      ((Number(a.olusturma) || 0) - (Number(b.olusturma) || 0)) || String(a.id).localeCompare(String(b.id)));
  }

  // Menü/editör büyüdüğünde mevcut kartı görünür alana taşı; taslağı yeniden çizme.
  function postitSigdir(el, id) {
    if (!el.isConnected) return;
    const r = el.getBoundingClientRect();
    const sol = Math.min(Math.max(0, r.left), Math.max(0, window.innerWidth - r.width));
    const ust = Math.min(Math.max(0, r.top), Math.max(0, window.innerHeight - r.height));
    el.style.left = sol + 'px';
    el.style.top = ust + 'px';
    el.style.bottom = 'auto';
    const i = yerlesim.findIndex((b) => b.id === id);
    const kutu = kutuYap(sol, ust, r.width, r.height, id);
    if (i < 0) yerlesim.push(kutu); else yerlesim[i] = kutu;
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
      // Konum yerleşim motorunda verilir (degerlendir) — başka notun üstüne binmesin.
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
        postitSigdir(kutu, not.id);
      }));
    };

    const kapat = ikonDugme(t('icerik.gizleSure', { s: sureMetni() }), '\u00d7');
    kapat.dataset.eylem = 'kapat';
    kapat.addEventListener('click', async () => {
      await mesaj('NOT_GUNCELLE', { id: not.id, patch: { gizleUntil: Date.now() + gizleMs } });
      imza = '';
      degerlendir();
    });

    const menu = menuKur(not, bas, duzenle, () => postitSigdir(kutu, not.id));
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
  function cizEtiket(not, kap, sira, toplam, altBosluk) {
    const p = palet(not.renk);
    // Her etiket köşeden biraz daha UZAĞA (yukarı-sola) oturur: yeni not ÜSTTE kalır.
    const d = KOSE + Math.max(0, sira) * KOSE_ADIM;
    const S = KOSE + Math.max(0, (toplam || 1) - 1) * KOSE_ADIM;

    const kose = document.createElement('div');
    kose.className = 'kose';
    kose.style.width = S + 'px';
    kose.style.height = S + 'px';
    // Footer şeridi varsa köşe durağı onun ÜSTÜNE oturur (şeritle çakışmasın).
    kose.style.bottom = Math.round(Math.max(0, Number(altBosluk) || 0)) + 'px';

    const serit = document.createElement('div');
    serit.className = 'kose__serit';
    // Şerit, alt ve sağ kenara dayanır: merkez köşeden d/2 uzakta, boy d*√2.
    serit.style.left = (S - d / 2) + 'px';
    serit.style.top = (S - d / 2) + 'px';
    serit.style.width = Math.round(d * 1.4142) + 'px';
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
    // Footer şeridi varsa menü/düzenleyici kartı da onun ÜSTÜNDE dursun.
    disKap.style.bottom = (12 + Math.round(Math.max(0, Number(altBosluk) || 0))) + 'px';
    disKap.style.setProperty('--bg', p.bg);
    disKap.style.setProperty('--kenar', p.kenar);
    disKap.style.setProperty('--metin', p.metin);
    disKap.style.setProperty('--ikon', p.ikon);
    disKap.style.setProperty('--ikonBg', p.ikonBg);

    let duzenAcik = false;
    const duzenKap = document.createElement('div');
    duzenKap.hidden = true;
    // Boşken kutu görünmesin (sayfa tıklamalarını da engellemesin): yalnız menü ya da
    // düzenleyici AÇIKKEN görünür. Arka plan notun KENDİ rengidir → yazı okunur kalır.
    // DİKKAT: araya görünürlüğü yönetilmeyen bir sarmalayıcı KOYMA — menü gizli kalır
    // ("minik boş alan açılıyor" hatası: kutu açılıyor, içindeki menü hidden sarmalayıcıda).
    const gorunumGuncelle = () => { disKap.hidden = duzenKap.hidden && menu.menu.hidden; };
    const duzenle = () => {
      if (duzenAcik) return;
      duzenAcik = true;
      duzenKap.textContent = '';
      duzenKap.hidden = false;
      duzenKap.appendChild(duzenleyici(not, () => {
        duzenAcik = false;
        duzenKap.hidden = true;
        duzenKap.textContent = '';
        gorunumGuncelle();
      }));
      gorunumGuncelle();
    };

    // Düğmeler şeridin SAĞ UCUNDA mutlak konumda: metin tam ORTADA kalsın.
    const dugmeler = document.createElement('div');
    dugmeler.className = 'kose__dugme';
    const menu = menuKur(not, dugmeler, duzenle, gorunumGuncelle);
    menu.dugme.classList.add('ikon--mini');
    // Menü DOĞRUDAN karta girer (araya sarmalayıcı yok) + görünürlüğü bağlanır.
    menu.dugme.addEventListener('click', gorunumGuncelle);

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
    disKap.hidden = true; // boşken görünmez (menü/düzenleyici açılınca gorunumGuncelle açar)
    kose.appendChild(serit);
    kap.appendChild(kose);
    kap.appendChild(disKap);
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
    if (calisiyor) { yenileBekliyor = true; return; }
    calisiyor = true;
    try {
      const anahtar = S.normalizeUrl(location.href);
      if (!anahtar) { bannerKaldir(); kaldir(KOK_ID); imza = ''; return; }
      const veri = await sayfaNotlariniSor();
      if (!veri) return; // Geçici bağlantı hatası mevcut notları kaldırmamalı.
      clearTimeout(gosterimZamani);
      if (veri.sonrakiGosterim) gosterimZamani = setTimeout(degerlendir, Math.min(2147483647, Math.max(1, veri.sonrakiGosterim - Date.now())));
      const yeniImza = notImzasi(veri.tumu);
      if (veri.tumu.length && yeniImza === imza && document.getElementById(KOK_ID)) return;
      imza = yeniImza;

      if (!veri.tumu.length) { bannerKaldir(); kaldir(KOK_ID); return; }

      // Aynı sayfada kalan kartların gerçek konumlarını koru. Silme/ekleme sırasında
      // baştan yerleştirmek, kayıtlı konumu olmayan kartları başka boşluklara taşır.
      const oncekiKonumlar = new Map();
      const oncekiKok = document.getElementById(KOK_ID);
      if (oncekiKok && oncekiKok.dataset.anahtar === anahtar && oncekiKok.shadowRoot) {
        oncekiKok.shadowRoot.querySelectorAll('[data-not-id]').forEach((el) => {
          const r = el.getBoundingClientRect();
          oncekiKonumlar.set(el.dataset.notId, {
            left: r.left, top: r.top, width: r.width, height: r.height,
            kucuk: el.classList.contains('mini'),
          });
        });
      }
      const golge = golgeOlustur();
      golge.host.dataset.anahtar = anahtar;
      kapliBolge = [];
      yerlesim = [];
      const bolgeEkle = (el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) kapliBolge.push(kutuYap(r.left, r.top, r.width, r.height));
      };

      // 1) FOOTER şeritleri: eskiden yeniye → YENİ not ALTTA (ölçü alınır)
      let altYuksek = 0;
      if (veri.footer.length) {
        const kap = document.createElement('div');
        kap.id = FOOTER_ID;
        kap.className = 'footerlar';
        eskidenYeniye(veri.footer).forEach((n) => kap.appendChild(cizSerit(n)));
        golge.appendChild(kap);
        olcVeIttir(kap, 'alt');
        bolgeEkle(kap);
        altYuksek = Math.ceil(kap.getBoundingClientRect().height) || 0;
      } else { sayfaIttir(bannerYuksek, 0); }
      // 2) BANNER şeritleri: eskiden yeniye → YENİ not ALTTA
      if (veri.banner.length) {
        const kap = document.createElement('div');
        kap.id = BANNER_ID;
        kap.className = 'bannerlar';
        eskidenYeniye(veri.banner).forEach((n) => kap.appendChild(cizSerit(n)));
        golge.appendChild(kap);
        olcVeIttir(kap, 'ust');
        bolgeEkle(kap);
      } else { sayfaIttir(0, footerYuksek); }
      // 3) ETİKETLER (sağ alt köşe durakları): eskiden yeniye → YENİ not ÜSTTE.
      //    Footer şeridi varsa onun ÜSTÜNE oturur (üstüne binmez).
      if (veri.etiket.length) {
        const sirali = eskidenYeniye(veri.etiket);
        const kap = document.createElement('div');
        kap.id = ETIKET_ID;
        sirali.forEach((n, i) => cizEtiket(n, kap, i, sirali.length, altYuksek));
        golge.appendChild(kap);
        bolgeEkle(kap.querySelector('.kose'));
      }

      // 4) POST-IT'ler: eskiden yeniye yerleştir → yeni not mevcudun SAĞINA oturur,
      //    hiçbiri diğerinin (ya da şeritlerin) üstüne binmez.
      if (veri.postit.length) {
        if (globalThis.ResizeObserver) postitRO = new ResizeObserver((entries) => {
          entries.forEach(({ target }) => postitSigdir(target, target.dataset.notId));
        });
        const kap = document.createElement('div');
        kap.id = POSTIT_ID;
        golge.appendChild(kap);
        const kartlar = eskidenYeniye(veri.postit).map((n) => {
          const el = cizPostit(n);
          el.dataset.notId = n.id;
          kap.appendChild(el);
          if (postitRO) postitRO.observe(el);
          const w = el.offsetWidth || (n.kucuk === true ? 44 : 264);
          const h = el.offsetHeight || (n.kucuk === true ? 44 : 110);
          const onceki = oncekiKonumlar.get(n.id);
          const ayniTur = !!onceki && onceki.kucuk === (n.kucuk === true);
          const koru = ayniTur && Math.abs(onceki.width - w) < 1 && Math.abs(onceki.height - h) < 1
            && !kapliBolge.some((b) => kutuCakisir(kutuYap(onceki.left, onceki.top, w, h, n.id), b));
          return { n, el, w, h, onceki: ayniTur ? onceki : null, koru };
        });
        // Değişmeyen kartların yerlerini önce ayır; yeni/boyutu değişen kartlar
        // bu alanları boş sanıp mevcut bir notu yerinden etmesin.
        kartlar.sort((a, b) => Number(b.koru) - Number(a.koru)).forEach(({ n, el, w, h, onceki, koru }) => {
          const yer = koru ? {
            sol: Math.min(Math.max(0, onceki.left), Math.max(0, window.innerWidth - w)),
            ust: Math.min(Math.max(0, onceki.top), Math.max(0, window.innerHeight - h)),
          } : yerBul(kapliBolge.concat(yerlesim), w, h, onceki || konumPx(n, w, h));
          el.style.left = yer.sol + 'px';
          el.style.top = yer.ust + 'px';
          el.style.bottom = 'auto';
          yerlesim.push(kutuYap(yer.sol, yer.ust, w, h, n.id));
        });
      }
    } finally {
      calisiyor = false;
      if (yenileBekliyor) { yenileBekliyor = false; await degerlendir(); }
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
  let sonKonum = S.normalizeUrl(location.href);
  function konumDegistiMi() {
    const anahtar = S.normalizeUrl(location.href);
    if (anahtar !== sonKonum) {
      sonKonum = anahtar;
      imza = '';
      degerlendir();
      return;
    }
    if (imza && !document.getElementById(KOK_ID)) degerlendir();
  }

  try {
    const push = history.pushState;
    const replace = history.replaceState;
    history.pushState = function () { const r = push.apply(this, arguments); konumDegistiMi(); return r; };
    history.replaceState = function () { const r = replace.apply(this, arguments); konumDegistiMi(); return r; };
  } catch (e) { /* yamalanamazsa poll yeter */ }

  window.addEventListener('popstate', konumDegistiMi);
  window.addEventListener('hashchange', konumDegistiMi);
  window.addEventListener('focus', function () { degerlendir(); });
  window.addEventListener('pageshow', function () { degerlendir(); });
  window.addEventListener('resize', function () {
    const kok = document.getElementById(KOK_ID);
    if (kok && kok.shadowRoot) kok.shadowRoot.querySelectorAll('[data-not-id]').forEach((el) => postitSigdir(el, el.dataset.notId));
    degerlendir();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) degerlendir(); });
  setInterval(konumDegistiMi, 2500); // yedek yoklama (SPA + geç yüklenen içerik)

  try {
    chrome.storage.onChanged.addListener(function (degisim, alan) {
      if (alan !== 'local') return;
      if ('web-not-settings' in degisim) {
        ayarlariTazele().then(function () { imza = ''; return degerlendir(); });
      } else if ('web-not-store' in degisim) {
        degerlendir();
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
