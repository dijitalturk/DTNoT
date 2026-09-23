/* DTNoT — Ayarlar: gizleme süresi, panel davranışı, JSON yedekleme/geri yükleme.
   Dil seçici bu ekrandan KALDIRILDI (dil popup'taki TR/EN bayraklarıyla değişir);
   i18n altyapısı (assets/i18n.js + _locales) aynen durur.
   İçe/dışa aktarma BİLİNÇLİ olarak buradadır: popup kapanınca dosya seçici iptal olabilir. */
(function () {
  'use strict';

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const T = (k, v) => I.t(k, v);
  const $ = (id) => document.getElementById(id);

  const saatAnahtar = (s) => 'saat.' + s;

  /* Ekran durumu: ayarlar + not sayısı (bölüm özetleri bunlardan beslenir). */
  const durum = { ayarlar: {}, sayi: 0 };

  async function cagri(tip, veri) {
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

  function etiketle() {
    document.title = 'DTNoT — ' + T('ayar.baslik');
    $('altBaslik').textContent = T('ayar.baslik');
    $('baslikDavranis').textContent = T('ayar.davranis');
    $('gizlemeEtiket').textContent = T('ayar.gizlemeSuresi');
    $('gizlemeNot').textContent = T('ayar.gizlemeNot');
    $('sadeceAktifEtiket').textContent = T('ayar.sadeceAktif');
    $('baslikVeri').textContent = T('ayar.veri');
    $('veriNot').textContent = T('ayar.veriNot');
    $('disaAktar').textContent = T('ayar.disaAktar');
    $('iceAktar').textContent = T('ayar.iceAktar');
    $('iceUyari').textContent = T('ayar.iceUyari');
    $('baslikHakkinda').textContent = T('ayar.hakkinda');
    $('hakkindaMetin').textContent = T('ayar.hakkindaMetin');
    $('gelistiriciEtiket').textContent = T('ayar.gelistirici').split(':')[0];
    try { $('surum').textContent = chrome.runtime.getManifest().version; } catch (e) { $('surum').textContent = '—'; }
    $('surumEtiket').textContent = T('ayar.surumEtiket');
    try { $('altBilgi').textContent = 'DTNoT v' + chrome.runtime.getManifest().version; } catch (e) { /* yut */ }
    I.bayraklar($('diller'));
    // seçenekler (dil değişince metinleri tazelenir)
    const strateji = $('strateji');
    const secili = strateji.value || 'merge';
    strateji.textContent = '';
    [['merge', T('ayar.iceMerge')], ['replace', T('ayar.iceReplace')]].forEach(([deger, metin]) => {
      const o = document.createElement('option');
      o.value = deger;
      o.textContent = metin;
      strateji.appendChild(o);
    });
    strateji.value = secili;
    const g = $('gizleme');
    const gSecili = g.value || '1';
    g.textContent = '';
    S.GIZLEME_SAAT.forEach((saat) => {
      const o = document.createElement('option');
      o.value = String(saat);
      o.textContent = T(saatAnahtar(saat));
      g.appendChild(o);
    });
    g.value = gSecili;
  }

  /** Toplam not sayısı (Veri bölümü özeti) — arka planın NOTLAR yanıtından (panel ile aynı yol). */
  async function notSayisiAl() {
    const r = await cagri('NOTLAR');
    return (r && r.notlar) ? r.notlar.length : 0;
  }

  /** Katlanır bölümler (standart .katlanir): başlık tıklanınca gövde açılır/kapanır.
      Gövde DOM'dan SİLİNMEZ; yalnız `hidden` + data-acik değişir (otomasyon/arama bozulmaz). */
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

  /** Bölüm başlıklarındaki TEK satırlık özetler: kapalıyken de bilgi görünür kalır. */
  function ozetYaz() {
    const a = durum.ayarlar || {};
    $('ozetDavranis').textContent = T(saatAnahtar(a.gizlemeSaat || 1));
    $('ozetVeri').textContent = T('panel.toplam', { n: durum.sayi });
    try { $('ozetHakkinda').textContent = T('ayar.surum', { 0: chrome.runtime.getManifest().version }); }
    catch (e) { $('ozetHakkinda').textContent = ''; }
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

  (async () => {
    await I.hazirla();
    const ayarlar = await S.ayarlariAl();
    durum.ayarlar = ayarlar;
    durum.sayi = await notSayisiAl();
    etiketle();
    ozetYaz();
    katlanirlariKur();
    $('gizleme').value = String(ayarlar.gizlemeSaat);
    $('sadeceAktif').checked = ayarlar.sadeceAktif === true;

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

    $('disaAktar').addEventListener('click', async () => {
      const r = await cagri('DISA_AKTAR');
      if (!r || !r.json) { bildir(T('ayar.iceHata'), 'hata'); return; }
      const tarih = new Date().toISOString().slice(0, 10);
      indir(r.json, 'dtnot-yedek-' + tarih + '.json');
      bildir(T('popup.kaydedildi'), 'tamam');
    });

    $('iceAktar').addEventListener('click', () => $('dosya').click());
    $('dosya').addEventListener('change', async (e) => {
      const dosya = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!dosya) return;
      let metin = '';
      try { metin = await dosya.text(); } catch (err) { bildir(T('ayar.iceHata'), 'hata'); return; }
      const strateji = $('strateji').value === 'replace' ? 'replace' : 'merge';
      if (strateji === 'replace' && !window.confirm(T('ayar.iceUyari'))) return;
      const r = await cagri('ICE_AKTAR', { json: metin, strateji: strateji });
      if (!r) { bildir(T('ayar.iceHata'), 'hata'); return; }
      try { durum.sayi = await notSayisiAl(); } catch (err) { /* özet sayısı eski kalır */ }
      ozetYaz();
      bildir(T('ayar.iceOk', { n: r.sayi }), 'tamam');
    });

    I.abone(() => { etiketle(); ozetYaz(); });
  })();
})();
