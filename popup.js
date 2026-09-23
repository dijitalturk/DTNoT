/* DTNoT — popup: aktif sayfanın notu + hızlı ekleme + izin/panel + popup İÇİNDE
   Ayarlar görünümü (gizleme süresi, Notlarım davranışı) ve tam sayfayı yeni
   sekmede açan bağlantı. Tüm metinler TR/EN; dil değişince yeniden çizilir. */
(function () {
  'use strict';

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const T = (k, v) => I.t(k, v);
  const $ = (id) => document.getElementById(id);

  let durum = { url: '', anahtar: '', tabId: null, izin: null, kayitli: false, toplam: 0, not: null, ayarlar: {} };
  const form = { renk: 'sari', banner: false, siteGeneli: false };

  /** 6 renk seçici — palet tek kaynaktan gelir (DTNOT_STORE.PALET). */
  function renkSeciciCiz() {
    const kap = $('renkler');
    kap.textContent = '';
    (S.RENKLER || ['sari']).forEach((renk) => {
      const p = (S.PALET || {})[renk] || {};
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'renk-sec';
      // Renk VERİDİR (PALET): karar CSS'te; burada yalnız değişken geçilir.
      b.style.setProperty('--renk-bg', p.bg || '');
      b.style.setProperty('--renk-kenar', p.kenar || '');
      b.setAttribute('aria-pressed', String(form.renk === renk));
      b.setAttribute('aria-label', T('renk.' + renk));
      b.title = T('renk.' + renk);
      b.addEventListener('click', () => { form.renk = renk; renkSeciciCiz(); });
      kap.appendChild(b);
    });
    const etiket = $('renkSecili');
    if (etiket) etiket.textContent = T('not.renkSecili', { renk: T('renk.' + form.renk) });
  }

  /** Formu mevcut nota göre doldur (yeni notta varsayılanlar). */
  function formuYukle(not) {
    form.renk = (not && not.renk) || S.RENK_VARSAYILAN || 'sari';
    form.banner = !!(not && not.banner === true);
    form.siteGeneli = !!(not && not.siteGeneli === true);
    $('bannerChk').checked = form.banner;
    $('siteGeneliChk').checked = form.siteGeneli;
    $('siteGeneliChk').disabled = !form.banner;
    renkSeciciCiz();
  }

  async function mesaj(tip, veri) {
    try {
      const r = await chrome.runtime.sendMessage(Object.assign({ tip: tip }, veri || {}));
      if (!r || r.__hata) return null;
      return r;
    } catch (e) { return null; }
  }

  function bildir(metin, tur) {
    const el = $('bildirim');
    el.className = (tur === 'tamam') ? 'mesaj' : (tur === 'hata') ? 'mesaj mesaj--hata' : 'durum';
    el.dataset.hata = tur === 'hata' ? '1' : '';
    el.textContent = metin || '';
  }

  /* ---------- Statik etiketler (dil ile) ---------- */
  function etiketle() {
    document.title = 'DTNoT — ' + T('popup.baslik');
    $('altBaslik').textContent = T('popup.aciklama');
    $('sayfaEtiket').textContent = T('popup.buSayfa');
    $('izinBaslik').textContent = T('popup.izinBaslik');
    $('izinMetin').textContent = T('popup.izinMetin');
    $('izinVer').textContent = T('popup.izinVer');
    $('ekleAc').textContent = T('popup.ekle');
    $('metin').placeholder = T('popup.eklePlaceholder');
    $('renkEtiket').textContent = T('not.renk');
    $('bannerEtiket').textContent = T('not.banner');
    $('bannerNotu').textContent = T('not.bannerNot');
    $('siteGeneliEtiket').textContent = T('not.siteGeneli');
    $('siteGeneliNotu').textContent = T('not.siteGeneliNot');
    $('kaydet').textContent = T('ortak.kaydet');
    $('vazgec').textContent = T('ortak.vazgec');
    $('silDugme').textContent = T('ortak.sil');
    $('havuzBaslik').textContent = T('ortak.panel');
    $('panelDugme').textContent = T('panel.baslik');
    $('ayarAc').title = T('ortak.ayarlar');
    $('ayarAc').setAttribute('aria-label', T('ortak.ayarlar'));
    $('panelAc').title = T('panel.baslik');
    $('panelAc').setAttribute('aria-label', T('panel.baslik'));
    /* Popup içindeki Ayarlar görünümü */
    $('ayarBaslik').textContent = T('ortak.ayarlar');
    $('ayarKapat').title = T('ortak.kapat');
    $('ayarKapat').setAttribute('aria-label', T('ortak.kapat'));
    $('gizlemeEtiket').textContent = T('ayar.gizlemeSuresi');
    $('gizlemeNot').textContent = T('ayar.gizlemeNot');
    $('sadeceAktifEtiket').textContent = T('ayar.sadeceAktif');
    $('temaEtiket').textContent = T('ayar.tema');
    $('yeniSayfadaAcMetin').textContent = T('ayar.yeniSayfada');
    $('yeniSayfadaAc').title = T('ayar.yeniSayfada');
    gizlemeSecenekleriCiz();
    try { $('altBilgi').textContent = 'DTNoT v' + chrome.runtime.getManifest().version; } catch (e) { /* yut */ }
    I.bayraklar($('diller'));
  }

  /* ---------- Görünüm ---------- */
  function ciz() {
    const varSayfa = !!durum.anahtar;
    $('sayfaAdres').textContent = varSayfa ? S.kisaltOrtadan(durum.anahtar, 46) : T('popup.sayfaYok');
    $('sayfaAdres').title = varSayfa ? durum.anahtar : '';
    $('ekleAc').disabled = !varSayfa;
    $('toplamRozet').textContent = String(durum.toplam);
    $('havuzNotu').textContent = durum.toplam ? T('panel.toplam', { n: durum.toplam }) : T('panel.bos');

    const izinYok = durum.izin === false;
    $('izinKutu').hidden = !izinYok;
    $('canliRozet').hidden = !(durum.izin === true && durum.kayitli);

    const not = durum.not;
    $('silDugme').hidden = !not;
    $('notOnizleme').hidden = !not;
    $('notRenk').hidden = !not;
    if (not) $('notRenk').style.setProperty('--renk-bg', ((S.PALET || {})[not.renk] || {}).bg || '');
    $('bannerRozet').hidden = !(not && not.banner === true);
    if (not) {
      $('notOnizleme').textContent = not.metin.length > 180 ? not.metin.slice(0, 180) + '…' : not.metin;
    }
  }

  /* ---------- Veri ---------- */
  async function tazele(mesajGoster) {
    const [sayfa, durumR] = await Promise.all([
      mesaj('AKTIF_SAYFA'),
      mesaj('DURUM'),
    ]);
    if (sayfa) { durum.url = sayfa.url; durum.anahtar = sayfa.anahtar; durum.tabId = sayfa.tabId; }
    if (durumR) { durum.izin = durumR.izin; durum.kayitli = durumR.kayitli; durum.toplam = durumR.toplam || 0; }
    const notR = durum.anahtar ? await mesaj('NOT_AL', { anahtar: durum.anahtar }) : null;
    durum.not = notR ? notR.not : null;
    if (!durum.not && durum.anahtar) {
      const ham = notR ? notR.ham : null;
      if (ham) $('notOnizleme').textContent = '';
    }
    ciz();
    if (mesajGoster) bildir(mesajGoster.metin, mesajGoster.tur);
  }

  /* ---------- Eylemler ---------- */
  async function ekleModu(ac) {
    $('ekleKutu').hidden = !ac;
    if (ac) {
      formuYukle(durum.not);
      $('metin').value = durum.not ? durum.not.metin : '';
      $('metin').focus();
    }
  }

  async function kaydet() {
    const metin = $('metin').value;
    if (!metin.trim()) { bildir(T('popup.metinGerekli'), 'hata'); return; }
    const r = await mesaj('NOT_EKLE', {
      url: durum.url,
      metin: metin,
      renk: form.renk,
      banner: form.banner,
      siteGeneli: form.siteGeneli,
    });
    if (!r || !r.not) { bildir(T('popup.kaydetHata'), 'hata'); return; }
    await ekleModu(false);
    await tazele({ metin: T('popup.kaydedildi'), tur: 'tamam' });
    if (durum.tabId != null) mesaj('ICERIK_YENILE', { tabId: durum.tabId });
  }

  async function sil() {
    if (!durum.not) return;
    if (!window.confirm(T('ortak.silOnay'))) return;
    const r = await mesaj('NOT_SIL', { anahtar: durum.not.anahtar });
    if (!r) { bildir(T('popup.kaydetHata'), 'hata'); return; }
    await tazele({ metin: T('popup.silindi'), tur: 'tamam' });
    if (durum.tabId != null) mesaj('ICERIK_YENILE', { tabId: durum.tabId });
  }

  async function izinAl() {
    try {
      const verildi = await chrome.permissions.request({ origins: ['*://*/*'] });
      if (!verildi) { bildir(T('popup.izinRed'), 'hata'); return; }
    } catch (e) { bildir(T('popup.izinRed'), 'hata'); return; }
    await tazele({ metin: T('popup.izinOk'), tur: 'tamam' });
    if (durum.tabId != null) mesaj('ICERIK_YENILE', { tabId: durum.tabId });
  }

  async function sekmeAc(yol) {
    try { await chrome.tabs.create({ url: chrome.runtime.getURL(yol) }); } catch (e) { /* yut */ }
    // Sayfa yeni sekmede açıldı → popup kapansın (aksi hâlde arkada boş duruyor)
    try { window.close(); } catch (e) { /* yut */ }
  }

  /* ---------- Ayarlar: popup'ın İÇİNDE açılır (popup kapanmaz) ---------- */
  /** Gizleme süresi seçenekleri — tek kaynak S.GIZLEME_SAAT (tam sayfayla aynı liste). */
  function gizlemeSecenekleriCiz() {
    const g = $('gizleme');
    if (!g) return;
    const secili = g.value || String((durum.ayarlar || {}).gizlemeSaat || S.VARSAYILAN_AYAR.gizlemeSaat || 1);
    g.textContent = '';
    S.GIZLEME_SAAT.forEach((saat) => {
      const o = document.createElement('option');
      o.value = String(saat);
      o.textContent = T('saat.' + saat);
      g.appendChild(o);
    });
    g.value = secili;
  }

  /** Popup'ta gösterilen ayarlar: gizleme süresi + Notlarım davranışı.
      Karmaşık veri yönetimi (yedekleme/geri yükleme) yalnız tam sayfada kalır. */
  async function ayarlariYukle() {
    const a = await S.ayarlariAl();
    durum.ayarlar = a;
    gizlemeSecenekleriCiz();
    $('gizleme').value = String(a.gizlemeSaat);
    $('sadeceAktif').checked = a.sadeceAktif === true;
  }

  /** Ayarlar görünümünü popup içinde aç/kapa (popup AÇIK kalır). */
  async function ayarModu(ac) {
    $('ayarKutu').hidden = !ac;
    $('ayarAc').setAttribute('aria-pressed', String(!!ac));
    if (ac) await ayarlariYukle();
  }

  /** Tam ayar sayfası YENİ SEKMEDE: önce openOptionsPage, olmazsa tabs.create. */
  async function tamAyarlariAc() {
    const B = (typeof browser !== 'undefined' && browser.runtime) ? browser : null;
    try {
      if (B && B.runtime.openOptionsPage) { await B.runtime.openOptionsPage(); return true; }
      if (chrome.runtime.openOptionsPage) { await chrome.runtime.openOptionsPage(); return true; }
    } catch (e) { /* yedek yola düş */ }
    try {
      const tabs = (B && B.tabs) ? B.tabs : chrome.tabs;
      const rt = (B && B.runtime) ? B.runtime : chrome.runtime;
      await tabs.create({ url: rt.getURL('options.html') });
      return true;
    } catch (e) { return false; }
  }

  /* ---------- Sağ tık menüsünden gelen "ekle" isteği (tek seferlik) ---------- */
  async function bekleyeniTüket() {
    const anahtar = 'dtnot-pending';
    try {
      const d = await chrome.storage.local.get(anahtar);
      const bekleyen = d ? d[anahtar] : null;
      if (bekleyen && bekleyen.action === 'add') {
        await chrome.storage.local.remove(anahtar);
        return true;
      }
    } catch (e) { /* yut */ }
    const p = new URLSearchParams(location.search);
    return p.get('ekle') === '1';
  }

  /* ---------- Başlat ---------- */
  (async () => {
    await I.hazirla();
    const TM = globalThis.DTNOT_TEMA;
    if (TM) await TM.hazirla(); // kayıtlı tema (kök elemanda `db-acik`)
    etiketle();
    // Tema seçici: ORTAK render yolu (assets/tema.js) — sayfada kopya kod yok.
    if (TM) TM.seciciKur($('tema'), () => bildir(T('popup.kaydedildi'), 'tamam'));
    formuYukle(null);
    await tazele();
    if (await bekleyeniTüket()) await ekleModu(true);

    $('ekleAc').addEventListener('click', () => ekleModu($('ekleKutu').hidden));
    $('bannerChk').addEventListener('change', (e) => {
      form.banner = e.target.checked;
      $('siteGeneliChk').disabled = !form.banner;
      if (!form.banner) {
        $('siteGeneliChk').checked = false;
        form.siteGeneli = false;
      }
    });
    $('siteGeneliChk').addEventListener('change', (e) => { form.siteGeneli = e.target.checked; });
    $('kaydet').addEventListener('click', kaydet);
    $('vazgec').addEventListener('click', () => ekleModu(false));
    $('silDugme').addEventListener('click', sil);
    $('izinVer').addEventListener('click', izinAl);
    $('panelAc').addEventListener('click', () => sekmeAc('panel.html'));
    $('panelDugme').addEventListener('click', () => sekmeAc('panel.html'));
    // Ayarlar: popup İÇİNDE açılır — sekme açılmaz, popup kapanmaz.
    $('ayarAc').addEventListener('click', () => ayarModu($('ayarKutu').hidden));
    $('ayarKapat').addEventListener('click', () => ayarModu(false));
    // Ayarların altındaki bağlantı: tam sayfa YENİ SEKMEDE (openOptionsPage + yedek)
    $('yeniSayfadaAc').addEventListener('click', (e) => { e.preventDefault(); tamAyarlariAc(); });
    $('gizleme').addEventListener('change', async (e) => {
      const yeni = Number(e.target.value);
      durum.ayarlar = Object.assign({}, durum.ayarlar, { gizlemeSaat: yeni });
      await S.ayarlariKaydet({ gizlemeSaat: yeni });
      bildir(T('popup.kaydedildi'), 'tamam');
    });
    $('sadeceAktif').addEventListener('change', async (e) => {
      durum.ayarlar = Object.assign({}, durum.ayarlar, { sadeceAktif: e.target.checked });
      await S.ayarlariKaydet({ sadeceAktif: e.target.checked });
      bildir(T('popup.kaydedildi'), 'tamam');
    });
    $('metin').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) kaydet();
    });
    I.abone(() => { etiketle(); ciz(); });
  })();
})();
