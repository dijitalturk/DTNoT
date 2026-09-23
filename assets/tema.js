/* DTNoT — TEMA (koyu / açık) · TEK KAYNAK.
   ---------------------------------------------------------------------------
   Tema kararı kök elemanda `html.db-acik` sınıfıyla verilir; RENKLER
   assets/ui.css içindeki açık tema bloğunda yaşar — bu dosya renk yazmaz.

   Kapsam: yalnız DTNoT'un KENDİ yüzeyleri (popup · Notlarım · Ayarlar).
   Host sayfaya enjekte edilen post-it/banner gölge DOM'u tema DIŞIDIR:
   post-it paleti VERİDİR (assets/store.js → PALET) ve tasarım standardı gereği
   sayfa tarafındaki görünüm kullanıcı temasından bağımsız kalır.

   Kullanım (her sayfa):
     await DTNOT_TEMA.hazirla();                  // kayıtlı temayı oku + uygula
     DTNOT_TEMA.seciciKur($('tema'), geriBildirim) // ortak seçici (popup + Ayarlar) */
(function () {
  'use strict';

  const S = globalThis.DTNOT_STORE;
  const I = globalThis.DTNOT_I18N;
  const SINIF = 'db-acik';
  /** Seçenek listesi: değer + i18n anahtarı (metin sözlükten gelir). */
  const TEMALAR = [['koyu', 'ayar.temaKoyu'], ['acik', 'ayar.temaAcik']];

  let kayitli = 'koyu';
  const seciciler = [];

  /** Değer doğrulama — kural tek yerde: assets/store.js → temizTema. */
  function temiz(v) {
    if (S && typeof S.temizTema === 'function') return S.temizTema(v);
    return v === 'acik' ? 'acik' : 'koyu';
  }

  /** Temayı ANINDA uygula (seçici değişince yeniden açmayı beklemez). */
  function uygula(tema) {
    const t = temiz(tema);
    try { document.documentElement.classList.toggle(SINIF, t === 'acik'); } catch (e) { /* yut */ }
    return t;
  }

  /** Seçenekleri çiz (popup ve Ayarlar AYNI yolu kullanır). */
  function ciz(el) {
    if (!el) return;
    el.textContent = '';
    TEMALAR.forEach(([deger, anahtar]) => {
      const o = document.createElement('option');
      o.value = deger;
      o.textContent = I.t(anahtar);
      el.appendChild(o);
    });
    el.value = kayitli;
  }

  /** Sayfa açılışında: kayıtlı temayı oku, uygula, kayıtlı seçicileri doldur. */
  async function hazirla() {
    try {
      const a = await S.ayarlariAl();
      kayitli = temiz(a && a.tema);
    } catch (e) { kayitli = 'koyu'; }
    uygula(kayitli);
    seciciler.forEach(ciz);
    return kayitli;
  }

  /** Ortak seçici kurulumu: seçenekleri çiz, kayıtlı değeri seç, değişimde
      ANINDA uygula + kaydet. `geriBildirim` (opsiyonel) kayıttan sonra çağrılır. */
  function seciciKur(el, geriBildirim) {
    if (!el || seciciler.indexOf(el) !== -1) return;
    seciciler.push(el);
    ciz(el);
    el.addEventListener('change', async (e) => {
      kayitli = uygula(e.target.value);
      ciz(el);
      try { await S.ayarlariKaydet({ tema: kayitli }); } catch (err) { /* yut */ }
      if (typeof geriBildirim === 'function') geriBildirim(kayitli);
    });
  }

  /* Dil değişince seçenek metinleri tazelenir (tek abonelik, tüm seçiciler). */
  if (I && typeof I.abone === 'function') I.abone(() => seciciler.forEach(ciz));

  globalThis.DTNOT_TEMA = { SINIF, TEMALAR, temiz, uygula, ciz, hazirla, seciciKur, secili: () => kayitli };
})();
