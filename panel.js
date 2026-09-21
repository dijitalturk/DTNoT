/* DTNoT — Notlarım paneli: site bazlı gruplar, arama, satır içi düzenleme/silme/açma.
   Satır listesi (kart ızgarası değil), tek tip tasarım. */
(function () {
  'use strict';

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const T = (k, v) => I.t(k, v);
  const $ = (id) => document.getElementById(id);

  let notlar = [];
  let arama = '';
  let sadeceAktif = false;
  let aktifHost = '';
  let renkFiltre = 'tumu';
  let duzenlenen = null; // anahtar
  let mesaj = { metin: '', tur: '' };

  async function cagri(tip, veri) {
    try {
      const r = await chrome.runtime.sendMessage(Object.assign({ tip: tip }, veri || {}));
      if (!r || r.__hata) return null;
      return r;
    } catch (e) { return null; }
  }

  const tarih = (ms) => {
    try {
      return new Date(ms).toLocaleString(I.dil() === 'tr' ? 'tr-TR' : 'en-GB',
        { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  };

  function etiketle() {
    document.title = 'DTNoT — ' + T('panel.baslik');
    $('altBaslik').textContent = T('panel.altbaslik');
    $('arama').placeholder = T('panel.ara');
    $('sadeceAktifEtiket').textContent = T('panel.sadeceAktif');
    $('renkFiltreEtiket').textContent = T('panel.renkFiltre');
    $('ayarAc').title = T('ortak.ayarlar');
    I.bayraklar($('diller'));
    renkFiltreCiz();
  }

  /** Renk filtresi düğmeleri: "Tümü" + 6 renk (palet tek kaynaktan). */
  function renkFiltreCiz() {
    const kap = $('renkFiltre');
    kap.textContent = '';
    const secenekler = [['tumu', null]].concat((S.RENKLER || []).map((r) => [r, (S.PALET || {})[r] || {}]));
    secenekler.forEach(([deger, p]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'renk-sec';
      if (p) {
        b.style.background = p.bg;
        b.style.borderColor = p.kenar;
      } else {
        b.style.background = 'linear-gradient(135deg,#fdf6c9 0 25%,#dcf5e4 25% 50%,#dbeafe 50% 75%,#fde2ef 75% 100%)';
        b.style.borderColor = 'var(--cizgi)';
      }
      b.setAttribute('aria-pressed', String(renkFiltre === deger));
      b.setAttribute('aria-label', deger === 'tumu' ? T('ortak.tumu') : T('renk.' + deger));
      b.title = deger === 'tumu' ? T('ortak.tumu') : T('renk.' + deger);
      b.addEventListener('click', () => { renkFiltre = deger; renkFiltreCiz(); ciz(); });
      kap.appendChild(b);
    });
  }

  function bildir() {
    const el = $('bildirim');
    el.className = (mesaj.tur === 'tamam') ? 'tamam' : (mesaj.tur === 'hata') ? 'hata' : 'durum';
    el.dataset.hata = mesaj.tur === 'hata' ? '1' : '';
    el.textContent = mesaj.metin || '';
  }

  function suzulmus() {
    return S.filtrele(notlar, {
      q: arama,
      renk: renkFiltre,
      host: sadeceAktif ? aktifHost : '',
      dil: I.dil(),
    });
  }

  function dugme(etiket, sinif, tiklama) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dugme ' + sinif;
    b.textContent = etiket;
    b.addEventListener('click', tiklama);
    return b;
  }

  function notSatiri(k) {
    const satir = document.createElement('div');
    satir.className = 'not-satir';

    const sol = document.createElement('div');
    const ust = document.createElement('div');
    ust.className = 'flex items-center gap-2';
    const nokta = document.createElement('span');
    nokta.className = 'renk-nokta';
    nokta.style.background = ((S.PALET || {})[k.renk] || {}).bg || '';
    nokta.title = T('renk.' + (k.renk || 'sari'));
    ust.appendChild(nokta);
    const yol = document.createElement('div');
    yol.className = 'not-yol truncate';
    yol.title = k.anahtar;
    yol.textContent = S.kisaltOrtadan(k.yol, 58);
    ust.appendChild(yol);
    if (k.banner === true) {
      const rb = document.createElement('span');
      rb.className = 'rozet rozet-banner';
      rb.textContent = k.siteGeneli === true ? 'BANNER · SITE' : 'BANNER';
      ust.appendChild(rb);
    }
    sol.appendChild(ust);

    if (duzenlenen === k.anahtar) {
      const alan = document.createElement('textarea');
      alan.className = 'alan';
      alan.value = k.metin;
      alan.style.marginTop = '6px';
      sol.appendChild(alan);

      const yerel = { renk: k.renk || 'sari', banner: k.banner === true, siteGeneli: k.siteGeneli === true };

      const satirRenk = document.createElement('div');
      satirRenk.className = 'flex items-center gap-2 flex-wrap';
      satirRenk.style.marginTop = '8px';
      const etiketRenk = document.createElement('span');
      etiketRenk.className = 'etiket';
      etiketRenk.textContent = T('not.renk');
      satirRenk.appendChild(etiketRenk);
      const renkKap = document.createElement('div');
      renkKap.className = 'renkler';
      (S.RENKLER || []).forEach((r) => {
        const p = (S.PALET || {})[r] || {};
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'renk-sec';
        b.style.background = p.bg;
        b.style.borderColor = p.kenar;
        b.setAttribute('aria-pressed', String(yerel.renk === r));
        b.title = T('renk.' + r);
        b.addEventListener('click', () => {
          yerel.renk = r;
          Array.from(renkKap.children).forEach((c, i) => c.setAttribute('aria-pressed', String((S.RENKLER[i] || '') === r)));
        });
        renkKap.appendChild(b);
      });
      satirRenk.appendChild(renkKap);
      sol.appendChild(satirRenk);

      const kutuBanner = document.createElement('label');
      kutuBanner.className = 'onay';
      const chkBanner = document.createElement('input');
      chkBanner.type = 'checkbox';
      chkBanner.checked = yerel.banner;
      const spBanner = document.createElement('span');
      spBanner.textContent = T('not.banner');
      kutuBanner.appendChild(chkBanner);
      kutuBanner.appendChild(spBanner);
      sol.appendChild(kutuBanner);

      const kutuSite = document.createElement('label');
      kutuSite.className = 'onay';
      const chkSite = document.createElement('input');
      chkSite.type = 'checkbox';
      chkSite.checked = yerel.siteGeneli;
      chkSite.disabled = !yerel.banner;
      const spSite = document.createElement('span');
      spSite.textContent = T('not.siteGeneli');
      kutuSite.appendChild(chkSite);
      kutuSite.appendChild(spSite);
      sol.appendChild(kutuSite);

      const ipucuSite = document.createElement('p');
      ipucuSite.className = 'ipucu';
      ipucuSite.textContent = T('not.siteGeneliNot');
      sol.appendChild(ipucuSite);

      chkBanner.addEventListener('change', () => {
        yerel.banner = chkBanner.checked;
        chkSite.disabled = !yerel.banner;
        if (!yerel.banner) { chkSite.checked = false; yerel.siteGeneli = false; }
      });
      chkSite.addEventListener('change', () => { yerel.siteGeneli = chkSite.checked; });

      const alt = document.createElement('div');
      alt.className = 'not-alt';
      alt.appendChild(dugme(T('ortak.kaydet'), '', async () => {
        if (!alan.value.trim()) { mesaj = { metin: T('popup.metinGerekli'), tur: 'hata' }; bildir(); return; }
        const r = await cagri('NOT_GUNCELLE', {
          anahtar: k.anahtar,
          patch: {
            metin: alan.value,
            renk: yerel.renk,
            banner: yerel.banner,
            siteGeneli: yerel.siteGeneli,
            kucuk: false,
            gizleUntil: 0,
          },
        });
        duzenlenen = null;
        mesaj = r ? { metin: T('popup.kaydedildi'), tur: 'tamam' } : { metin: T('popup.kaydetHata'), tur: 'hata' };
        await yukle();
      }));
      alt.appendChild(dugme(T('ortak.vazgec'), 'dugme--ikincil', () => { duzenlenen = null; ciz(); }));
      sol.appendChild(alt);
      satir.appendChild(sol);
      satir.appendChild(document.createElement('div'));
      return satir;
    }

    const metin = document.createElement('div');
    metin.className = 'not-metin';
    metin.textContent = k.metin;
    sol.appendChild(metin);
    satir.appendChild(sol);

    const sag = document.createElement('div');
    satir.appendChild(sag);

    const alt = document.createElement('div');
    alt.className = 'not-alt';
    const t = document.createElement('span');
    t.className = 'not-tarih';
    t.textContent = T('panel.sonGuncelleme') + ': ' + tarih(k.guncelleme);
    alt.appendChild(t);
    alt.appendChild(dugme(T('panel.sayfaAc'), 'dugme--ikincil dugme--kucuk', async () => {
      const r = await cagri('SAYFA_AC', { anahtar: k.anahtar });
      if (!r || !r.ok) { mesaj = { metin: T('popup.kaydetHata'), tur: 'hata' }; bildir(); }
    }));
    alt.appendChild(dugme(T('ortak.duzenle'), 'dugme--ikincil dugme--kucuk', () => { duzenlenen = k.anahtar; ciz(); }));
    alt.appendChild(dugme(T('ortak.sil'), 'dugme--tehlike dugme--kucuk', async () => {
      if (!window.confirm(T('ortak.silOnay'))) return;
      const r = await cagri('NOT_SIL', { anahtar: k.anahtar });
      mesaj = r ? { metin: T('popup.silindi'), tur: 'tamam' } : { metin: T('popup.kaydetHata'), tur: 'hata' };
      await yukle();
    }));
    satir.appendChild(alt);
    return satir;
  }

  function ciz() {
    const liste = $('liste');
    liste.textContent = '';
    const gorunen = suzulmus();

    if (!gorunen.length) {
      const bos = document.createElement('div');
      bos.className = 'bos';
      bos.textContent = notlar.length
        ? (arama.trim() ? T('panel.bosArama', { q: arama.trim() }) : T('panel.bosSite'))
        : T('panel.bos');
      liste.appendChild(bos);
      return;
    }

    S.grupla(gorunen).forEach((grup) => {
      const kutu = document.createElement('div');
      kutu.className = 'grup';
      const bas = document.createElement('div');
      bas.className = 'grup-bas';
      const host = document.createElement('span');
      host.className = 'host';
      host.textContent = grup.host || '—';
      bas.appendChild(host);
      const rozet = document.createElement('span');
      rozet.className = 'rozet';
      rozet.textContent = T('panel.toplam', { n: grup.notlar.length });
      bas.appendChild(rozet);
      kutu.appendChild(bas);
      grup.notlar.forEach((k) => kutu.appendChild(notSatiri(k)));
      liste.appendChild(kutu);
    });
  }

  async function yukle() {
    const r = await cagri('NOTLAR');
    notlar = r ? (r.notlar || []) : [];
    if (r && r.recovered) mesaj = { metin: T('panel.kurtarildi'), tur: '' };
    ciz();
    bildir();
  }

  (async () => {
    await I.hazirla();
    etiketle();
    const a = await S.ayarlariAl();
    sadeceAktif = a.sadeceAktif === true;
    $('sadeceAktif').checked = sadeceAktif;
    const sayfa = await cagri('AKTIF_SAYFA');
    aktifHost = sayfa ? S.hostOf(sayfa.anahtar) : '';
    await yukle();

    $('arama').addEventListener('input', (e) => { arama = e.target.value; ciz(); });
    $('sadeceAktif').addEventListener('change', async (e) => {
      sadeceAktif = e.target.checked;
      try { await S.ayarlariKaydet({ sadeceAktif: sadeceAktif }); } catch (err) { /* yut */ }
      ciz();
    });
    $('ayarAc').addEventListener('click', async () => {
      try { await chrome.tabs.create({ url: chrome.runtime.getURL('options.html') }); } catch (e) { /* yut */ }
    });
    I.abone(() => { etiketle(); ciz(); bildir(); });

    try {
      chrome.storage.onChanged.addListener((degisim, alan) => {
        if (alan === 'local' && 'web-not-store' in degisim) yukle();
      });
    } catch (e) { /* yut */ }
  })();
})();
