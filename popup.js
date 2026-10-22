/* DTNoT — popup: İKİ görünüm.
   (1) NOT görünümü (varsayılan): aktif sayfanın adresi → **Not ekle** (listenin ÜSTÜNDE)
       → bu sayfadaki notların listesi (yoksa "Bu sayfada not yok.").
   (2) AYARLAR görünümü (⚙ ile, popup İÇİNDE açılır; popup kapanmaz): options.html ile
       AYNI katlanır bölümler (tema + Davranış · Veri · Hakkında), en altta
       "Sayfada göster" bağlantısı (openOptionsPage + tabs.create yedeği).
   Not ekleme formu TEK: yeni not ekler; listedeki "Düzenle" aynı formu doldurup
   kaydı günceller. Tüm metinler TR/EN; dil değişince yeniden çizilir. */
(function () {
  'use strict';

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const T = (k, v) => I.t(k, v);
  const $ = (id) => document.getElementById(id);
  const saatAnahtar = (s) => 'saat.' + s;

  let durum = { url: '', anahtar: '', tabId: null, izin: null, kayitli: false, toplam: 0, notlar: [], ayarlar: {} };
  const form = { renk: 'sari', gorunum: 'postit', siteGeneli: false };
  let duzenlenenId = null; // null → yeni not; dolu → o kaydı güncelle

  /* ---------- Renk seçici (6 renk, palet tek kaynaktan) ---------- */
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

  /* ---------- Görünüm seçici (post-it · banner · footer · etiket) ---------- */
  function gorunumSeciciCiz() {
    const kap = $('gorunumSec');
    if (!kap) return;
    kap.textContent = '';
    (S.GORUNUMLER || ['postit']).forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tur-dugme';
      b.dataset.gorunum = g;
      b.setAttribute('aria-pressed', String(form.gorunum === g));
      b.setAttribute('aria-label', T('gorunum.' + g));
      b.title = T('gorunum.' + g);
      b.textContent = T('gorunum.' + g);
      b.addEventListener('click', () => { form.gorunum = g; gorunumSeciciCiz(); });
      kap.appendChild(b);
    });
  }

  /** Formu başlangıç durumuna al (yeni not) ya da bir kaydın değerleriyle doldur. */
  function formuYukle(not) {
    duzenlenenId = not ? not.id : null;
    form.renk = (not && not.renk) || S.RENK_VARSAYILAN || 'sari';
    form.gorunum = not ? ((S.gorunumOf ? S.gorunumOf(not) : not.gorunum) || 'postit') : 'postit';
    form.siteGeneli = !!(not && not.siteGeneli === true);
    $('metin').value = not ? String(not.metin || '') : '';
    $('siteGeneliChk').checked = form.siteGeneli;
    $('formBaslik').textContent = not ? T('popup.duzenleBaslik') : T('popup.yeniNot');
    renkSeciciCiz();
    gorunumSeciciCiz();
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
    $('gorunumEtiket').textContent = T('not.gorunum');
    $('siteGeneliEtiket').textContent = T('not.siteGeneli');
    $('siteGeneliNotu').textContent = T('not.siteGeneliNot');
    $('kaydet').textContent = T('ortak.kaydet');
    $('vazgec').textContent = T('ortak.vazgec');
    $('sayfaNotBaslik').textContent = T('popup.buSayfadakiNotlar');
    $('sayfaNotYok').textContent = T('popup.sayfaNotYok');
    $('havuzBaslik').textContent = T('ortak.panel');
    $('panelDugme').textContent = T('panel.baslik');
    $('ayarAc').title = T('ortak.ayarlar');
    $('ayarAc').setAttribute('aria-label', T('ortak.ayarlar'));
    $('panelAc').title = T('panel.baslik');
    $('panelAc').setAttribute('aria-label', T('panel.baslik'));
    /* Popup içindeki Ayarlar görünümü — options.html ile AYNI bölümler/anahtarlar */
    $('ayarBaslik').textContent = T('ortak.ayarlar');
    $('baslikDavranis').textContent = T('ayar.davranis');
    $('gizlemeEtiket').textContent = T('ayar.gizlemeSuresi');
    $('gizlemeNot').textContent = T('ayar.gizlemeNot');
    $('sadeceAktifEtiket').textContent = T('ayar.sadeceAktif');
    $('temaEtiket').textContent = T('ayar.tema');
    $('baslikVeri').textContent = T('ayar.veri');
    $('veriNot').textContent = T('ayar.veriNot');
    $('disaAktar').textContent = T('ayar.disaAktar');
    $('veriTamSayfa').textContent = T('ayar.veriTamSayfa');
    $('baslikHakkinda').textContent = T('ayar.hakkinda');
    $('hakkindaMetin').textContent = T('ayar.hakkindaMetin');
    $('gelistiriciEtiket').textContent = T('ayar.gelistirici').split(':')[0];
    try { $('surum').textContent = chrome.runtime.getManifest().version; } catch (e) { $('surum').textContent = '—'; }
    $('surumEtiket').textContent = T('ayar.surumEtiket');
    $('yeniSayfadaAcMetin').textContent = T('ayar.sayfadaGoster');
    $('yeniSayfadaAc').title = T('ayar.sayfadaGoster');
    gizlemeSecenekleriCiz();
    try { $('altBilgi').textContent = 'DTNoT v' + chrome.runtime.getManifest().version; } catch (e) { /* yut */ }
    I.bayraklar($('diller'));
    // Form açıkken başlık/etiketler dil değişiminde tazelensin
    if (!$('ekleKutu').hidden) $('formBaslik').textContent = duzenlenenId ? T('popup.duzenleBaslik') : T('popup.yeniNot');
  }

  /* ---------- Görünüm ---------- */
  function dugme(etiket, sinif, tiklama) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn ' + sinif;
    b.textContent = etiket;
    b.addEventListener('click', tiklama);
    return b;
  }

  /** Bu sayfadaki bir notun satırı: renk · görünüm · site geneli · metin · Düzenle/Sil. */
  function notSatiri(k) {
    const kutu = document.createElement('div');
    kutu.className = 'not-kart';

    const ust = document.createElement('div');
    ust.className = 'not-kart__ust';
    const nokta = document.createElement('span');
    nokta.className = 'renk-nokta';
    nokta.style.setProperty('--renk-bg', ((S.PALET || {})[k.renk] || {}).bg || '');
    nokta.title = T('renk.' + (k.renk || 'sari'));
    ust.appendChild(nokta);
    const tur = document.createElement('span');
    tur.className = 'pill pill--soluk';
    tur.textContent = T('gorunum.' + ((S.gorunumOf ? S.gorunumOf(k) : k.gorunum) || 'postit'));
    ust.appendChild(tur);
    if (k.siteGeneli === true) {
      const sg = document.createElement('span');
      sg.className = 'pill pill--warn';
      sg.textContent = T('panel.siteGeneliRozet');
      ust.appendChild(sg);
      const nik = document.createElement('span');
      nik.className = 'not-kart__yol truncate';
      nik.textContent = S.kisaltOrtadan(k.anahtar, 40);
      nik.title = k.anahtar;
      ust.appendChild(nik);
    }
    kutu.appendChild(ust);

    const metin = document.createElement('div');
    metin.className = 'not-kart__metin';
    metin.textContent = String(k.metin == null ? '' : k.metin);
    kutu.appendChild(metin);

    const alt = document.createElement('div');
    alt.className = 'not-alt';
    alt.appendChild(dugme(T('ortak.duzenle'), 'btn--kucuk', () => duzenleBasla(k)));
    alt.appendChild(dugme(T('ortak.sil'), 'btn--danger btn--kucuk', () => sil(k)));
    kutu.appendChild(alt);
    return kutu;
  }

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

    // Bu sayfadaki notlar — liste "Not ekle" düğmesinin ALTINDA kalır.
    $('sayfaNotSayi').textContent = String(durum.notlar.length);
    $('sayfaNotYok').hidden = !(varSayfa && durum.notlar.length === 0);
    const kap = $('sayfaNotlar');
    kap.textContent = '';
    durum.notlar.forEach((k) => kap.appendChild(notSatiri(k)));
  }

  /* ---------- Veri ---------- */
  async function tazele(mesajGoster) {
    const [sayfa, durumR] = await Promise.all([
      mesaj('AKTIF_SAYFA'),
      mesaj('DURUM'),
    ]);
    if (sayfa) { durum.url = sayfa.url; durum.anahtar = sayfa.anahtar; durum.tabId = sayfa.tabId; }
    if (durumR) { durum.izin = durumR.izin; durum.kayitli = durumR.kayitli; durum.toplam = durumR.toplam || 0; }
    const r = durum.anahtar ? await mesaj('SAYFA_NOTLARI', { url: durum.url }) : null;
    durum.notlar = (r && r.tumu) ? r.tumu : [];
    ciz();
    ozetYaz();
    if (mesajGoster) bildir(mesajGoster.metin, mesajGoster.tur);
  }

  /* ---------- Eylemler ---------- */
  function ekleModu(ac, not) {
    $('ekleKutu').hidden = !ac;
    $('ekleAc').hidden = !!ac; // form açıkken "Not ekle" düğmesi görünmez
    if (ac) {
      formuYukle(not || null);
      $('metin').focus();
    } else {
      formuYukle(null);
    }
  }

  function duzenleBasla(k) {
    ekleModu(true, k);
    $('ekleKutu').scrollIntoView({ block: 'nearest' });
  }

  async function kaydet() {
    const metin = $('metin').value;
    if (!metin.trim()) { bildir(T('popup.metinGerekli'), 'hata'); return; }
    const ortak = { metin: metin, renk: form.renk, gorunum: form.gorunum, siteGeneli: form.siteGeneli };
    const r = duzenlenenId
      ? await mesaj('NOT_GUNCELLE', { id: duzenlenenId, patch: Object.assign({ kucuk: false, gizleUntil: 0 }, ortak) })
      : await mesaj('NOT_EKLE', Object.assign({ url: durum.url }, ortak));
    if (!r || !r.not) { bildir(T('popup.kaydetHata'), 'hata'); return; }
    ekleModu(false);
    await tazele({ metin: T('popup.kaydedildi'), tur: 'tamam' });
    if (durum.tabId != null) mesaj('ICERIK_YENILE', { tabId: durum.tabId });
  }

  async function sil(k) {
    if (!k) return;
    if (!window.confirm(T('ortak.silOnay'))) return;
    const r = await mesaj('NOT_SIL', { id: k.id });
    if (!r) { bildir(T('popup.kaydetHata'), 'hata'); return; }
    if (duzenlenenId === k.id) ekleModu(false);
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

  /* ---------- Ayarlar görünümü (popup'ın İÇİNDE açılır; popup kapanmaz) ---------- */
  /** Gizleme süresi seçenekleri — tek kaynak S.GIZLEME_SAAT (tam sayfayla aynı liste). */
  function gizlemeSecenekleriCiz() {
    const g = $('gizleme');
    if (!g) return;
    const secili = g.value || String((durum.ayarlar || {}).gizlemeSaat || S.VARSAYILAN_AYAR.gizlemeSaat || 1);
    g.textContent = '';
    S.GIZLEME_SAAT.forEach((saat) => {
      const o = document.createElement('option');
      o.value = String(saat);
      o.textContent = T(saatAnahtar(saat));
      g.appendChild(o);
    });
    g.value = secili;
  }

  /** Katlanır bölümler (standart .katlanir — options.js ile aynı sözleşme):
      başlık tıklanınca gövde açılır/kapanır. Gövde DOM'dan SİLİNMEZ; yalnız
      `hidden` + data-acik + aria-expanded değişir (arama/otomasyon bozulmaz). */
  function katlanirlariKur() {
    document.querySelectorAll('.katlanir').forEach((bolum) => {
      const baslik = bolum.querySelector('.katlanir__baslik');
      const govde = bolum.querySelector('.katlanir__govde');
      const ok = bolum.querySelector('.katlanir__ok');
      if (!baslik || !govde) return;
      const uygula = (acik) => {
        bolum.dataset.acik = acik ? 'true' : 'false';
        baslik.setAttribute('aria-expanded', String(acik));
        govde.hidden = !acik;
        if (ok) ok.textContent = acik ? '▾' : '▸';
      };
      uygula(bolum.dataset.acik !== 'false');
      baslik.addEventListener('click', () => { uygula(bolum.dataset.acik === 'false'); });
    });
  }

  /** Bölüm başlıklarındaki TEK satırlık özetler (kapalıyken de bilgi görünür). */
  function ozetYaz() {
    const a = durum.ayarlar || {};
    const ozetDavranis = $('ozetDavranis');
    if (ozetDavranis) ozetDavranis.textContent = T(saatAnahtar(a.gizlemeSaat || 1));
    const ozetVeri = $('ozetVeri');
    if (ozetVeri) ozetVeri.textContent = T('panel.toplam', { n: durum.toplam || 0 });
    const ozetHakkinda = $('ozetHakkinda');
    if (!ozetHakkinda) return;
    try { ozetHakkinda.textContent = T('ayar.surum', { 0: chrome.runtime.getManifest().version }); }
    catch (e) { ozetHakkinda.textContent = ''; }
  }

  /** Popup'ta gösterilen ayarlar: gizleme süresi + tema + Notlarım davranışı.
      Ağır veri yönetimi (JSON geri yükleme) tam sayfada kalır — dosya seçici
      popup kapanınca iptal olabilir (bkz. options.js). */
  async function ayarlariYukle() {
    const a = await S.ayarlariAl();
    durum.ayarlar = a;
    gizlemeSecenekleriCiz();
    $('gizleme').value = String(a.gizlemeSaat);
    $('sadeceAktif').checked = a.sadeceAktif === true;
    ozetYaz();
  }

  /** Ayarlar görünümünü popup içinde aç/kapa (popup AÇIK kalır).
      Açıkken NOT görünümü tümüyle gizlenir: Ayarlar'da not alanı görünmez. */
  async function ayarModu(ac) {
    $('ayarKutu').hidden = !ac;
    $('notGorunum').hidden = !!ac;
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

  function indir(metin, dosyaAdi) {
    const blob = new Blob([metin], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dosyaAdi;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  /** Veri bölümü: tarihli JSON yedeği indir (tam sayfayla aynı arka plan yolu). */
  async function veriyiIndir() {
    const r = await mesaj('DISA_AKTAR');
    if (!r || !r.json) { bildir(T('ayar.iceHata'), 'hata'); return; }
    indir(r.json, 'dtnot-yedek-' + new Date().toISOString().slice(0, 10) + '.json');
    bildir(T('popup.kaydedildi'), 'tamam');
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
    const TM = globalThis.DTNOT_TEMA;
    await Promise.all([I.hazirla(), TM ? TM.hazirla() : Promise.resolve()]); // kayıtlı tema (kök elemanda `db-acik`)
    etiketle();
    katlanirlariKur(); // Ayarlar bölümleri: varsayılan açık/kapalı hâlleri data-acik'tan
    // Tema seçici: ORTAK render yolu (assets/tema.js) — sayfada kopya kod yok.
    if (TM) TM.seciciKur($('tema'), () => bildir(T('popup.kaydedildi'), 'tamam'));
    ekleModu(false);

    $('ekleAc').addEventListener('click', () => ekleModu($('ekleKutu').hidden));
    $('siteGeneliChk').addEventListener('change', (e) => { form.siteGeneli = e.target.checked; });
    $('kaydet').addEventListener('click', kaydet);
    $('vazgec').addEventListener('click', () => ekleModu(false));
    $('izinVer').addEventListener('click', izinAl);
    $('panelAc').addEventListener('click', () => sekmeAc('panel.html'));
    $('panelDugme').addEventListener('click', () => sekmeAc('panel.html'));
    // Ayarlar: popup İÇİNDE açılır — sekme açılmaz, popup kapanmaz. Kapanma YİNE ⚙ ile
    // (✕ düğmesi yok): ayarAc aria-pressed durumu bildirir.
    $('ayarAc').addEventListener('click', () => ayarModu($('ayarKutu').hidden));
    // Ayarların EN ALTINDAKİ bağlantı: tam sayfa YENİ SEKMEDE (openOptionsPage + yedek)
    $('yeniSayfadaAc').addEventListener('click', (e) => { e.preventDefault(); tamAyarlariAc(); });
    $('gizleme').addEventListener('change', async (e) => {
      const yeni = Number(e.target.value);
      durum.ayarlar = Object.assign({}, durum.ayarlar, { gizlemeSaat: yeni });
      await S.ayarlariKaydet({ gizlemeSaat: yeni });
      ozetYaz();
      bildir(T('popup.kaydedildi'), 'tamam');
    });
    $('sadeceAktif').addEventListener('change', async (e) => {
      durum.ayarlar = Object.assign({}, durum.ayarlar, { sadeceAktif: e.target.checked });
      await S.ayarlariKaydet({ sadeceAktif: e.target.checked });
      ozetYaz();
      bildir(T('popup.kaydedildi'), 'tamam');
    });
    $('disaAktar').addEventListener('click', veriyiIndir);
    $('metin').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) kaydet();
    });
    I.abone(() => { etiketle(); ciz(); ozetYaz(); });
    // Kontroller veri yüklenmesini beklemeden kullanılabilir olsun.
    await Promise.all([tazele(), ayarlariYukle()]);
    if (await bekleyeniTüket()) ekleModu(true);
    // Depo başka yerden değişirse (panel/başka sekme) liste tazelensin
    try {
      chrome.storage.onChanged.addListener((degisim, alan) => {
        if (alan === 'local' && 'web-not-store' in degisim) tazele();
      });
    } catch (e) { /* yut */ }
  })();
})();
