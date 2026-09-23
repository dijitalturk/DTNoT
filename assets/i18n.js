/* DTNoT — TR/EN sözlüğü + dil yardımcıları (klasik script; sayfa betiğinden ÖNCE yüklenir).
   Dil `web-not-settings` içinde saklanır (DTNOT_STORE). Kullanım:
     await DTNOT_I18N.hazirla();  document.title = t('popup.baslik');
     DTNOT_I18N.abone(ciz);       // dil değişince yeniden çiz
     DTNOT_I18N.bayraklar(el);    // TR/EN düğmeleri */
(function () {
  'use strict';

  const DICT = {
    tr: {
      'ortak.kaydet': 'Kaydet',
      'ortak.vazgec': 'Vazgeç',
      'ortak.sil': 'Sil',
      'ortak.duzenle': 'Düzenle',
      'ortak.kapat': 'Kapat',
      'ortak.ayarlar': 'Ayarlar',
      'ortak.panel': 'Notlarım',
      'ortak.silOnay': 'Bu not silinsin mi?',
      'ortak.evetSil': 'Evet, sil',
      'ortak.dil': 'Dil',
      'ortak.renk': 'Renk',
      'ortak.tumu': 'Tümü',
      'renk.sari': 'Sarı',
      'renk.yesil': 'Yeşil',
      'renk.mavi': 'Mavi',
      'renk.pembe': 'Pembe',
      'renk.mor': 'Mor',
      'renk.turuncu': 'Turuncu',
      'not.renk': 'Post-it rengi',
      'not.renkSecili': 'Seçili renk: {renk}',
      'not.gorunum': 'Görünüm',
      'gorunum.postit': 'Post-it',
      'gorunum.banner': 'Banner',
      'gorunum.footer': 'Footer',
      'gorunum.etiket': 'Etiket',
      'not.siteGeneli': 'Site geneli — bu sitenin tüm sayfalarında göster',
      'not.siteGeneliNot': 'İşaretlenirse not, bu sitenin tüm sayfalarında görünür.',
      'not.tasi': 'Başlıktan tutup sürükleyerek taşı',
      'panel.renkFiltre': 'Renk filtresi',
      'panel.siteGeneliRozet': 'SİTE',

      'popup.baslik': 'DTNoT',
      'popup.aciklama': 'Sayfaya not bırak, döndüğünde sayfada gör.',
      'popup.ekle': 'Not ekle',
      'popup.eklePlaceholder': 'Bu sayfaya bırakacağın not…',
      'popup.buSayfa': 'Bu sayfa',
      'popup.sayfaYok': 'Not bırakmak için normal bir web sayfası aç.',
      'popup.buSayfadakiNotlar': 'Bu sayfadaki notlar',
      'popup.sayfaNotYok': 'Bu sayfada not yok.',
      'popup.yeniNot': 'Yeni not',
      'popup.duzenleBaslik': 'Notu düzenle',
      'popup.kaydedildi': '✓ Not kaydedildi.',
      'popup.silindi': 'Not silindi.',
      'popup.metinGerekli': 'Not metni boş olamaz.',
      'popup.kaydetHata': 'Kaydedilemedi (depo hatası). Yeniden dene.',
      'popup.izinBaslik': 'Sayfada not çizmek için izin gerekli',
      'popup.izinMetin': 'Notların her durumda kaydedilir. Post-it/banner çizmek için site erişim izni ver.',
      'popup.izinVer': 'İzin ver',
      'popup.izinOk': '✓ İzin verildi — sayfa üstü notlar etkin.',
      'popup.izinRed': 'İzin verilmedi — sayfa üstü notlar kapalı kalır.',
      'popup.canli': 'Bu sayfada hazır — not bırakırsan sayfada görünür.',
      'popup.canliDegil': 'Bu sayfada not çizilemiyor — sayfayı yenile (F5) ya da izin ver.',

      'panel.baslik': 'Notlarım',
      'panel.altbaslik': 'Site bazlı gruplar · düzenle, sil, sayfayı aç',
      'panel.ara': 'Notlarda ara…',
      'panel.sadeceAktif': 'Yalnız aktif site',
      'panel.bos': 'Henüz not yok — popup’tan “Not ekle” ile başla.',
      'panel.bosSite': 'Bu sitede kayıtlı not yok.',
      'panel.bosArama': '“{q}” için sonuç yok.',
      'panel.toplam': '{n} not',
      'panel.sonGuncelleme': 'Son güncelleme',
      'panel.olusturma': 'Oluşturma',
      'panel.sayfaAc': 'Sayfayı aç',
      'panel.yedekUyari': '⚠ {n} not birikti — yedek almanı öneririm.',
      'panel.kurtarildi': 'Bozuk kayıtlar onarılarak açıldı.',

      'ayar.baslik': 'Ayarlar',
      'ayar.dil': 'Dil',
      'ayar.dilNot': 'Arayüz dili; seçim hatırlanır.',
      'ayar.davranis': 'Davranış',
      'ayar.gizlemeSuresi': '“Gizle” süresi',
      'ayar.gizlemeNot': 'Notu kapattığınızda belirlediğiniz süre boyunca notunuz görünmez olur.',
      'ayar.sadeceAktif': 'Notlarım ekranındayken, o anda bulunduğunuz site için alınmış notları otomatik olarak filtreleyip gösterir.',
      'ayar.tema': 'Tema',
      'ayar.temaKoyu': 'Koyu',
      'ayar.temaAcik': 'Açık',
      'ayar.veri': 'Veri',
      'ayar.veriNot': 'Notlar yalnız bu cihazda tutulur; hiçbir yere gönderilmez.',
      'ayar.disaAktar': 'JSON indir',
      'ayar.veriTamSayfa': 'JSON yedeğini içe aktarmak için en alttaki “Sayfada göster” ile tam ayar sayfasını aç.',
      'ayar.iceAktar': 'Dosya seç…',
      'ayar.iceMerge': 'Birleştir (çakışmada en güncel kazanır)',
      'ayar.iceReplace': 'Değiştir (mevcut notların YERİNE geçer)',
      'ayar.iceUyari': '“Değiştir” seçeneği mevcut notları siler.',
      'ayar.iceOk': '✓ {n} not içe aktarıldı.',
      'ayar.iceHata': 'Dosya okunamadı — geçerli bir DTNoT yedeği mi?',
      'ayar.surum': 'Sürüm: {0}',
      'ayar.surumEtiket': 'Sürüm',
      'ayar.hakkinda': 'Hakkında',
      'ayar.hakkindaMetin': 'DTNoT gizliliğine önem verir; hiçbir veriniz dışarı sızdırılmaz, tüm notlarınız kişisel bilgisayarınızda kalır.',
      'ayar.gelistirici': 'Geliştirici: DijitalTurk.com',
      'ayar.sayfadaGoster': 'Sayfada göster',

      'icerik.gizle': 'Notu gizle',
      'icerik.gizleSure': 'Notu {s} gizle',
      'icerik.kucult': 'Notu küçült',
      'icerik.ac': 'Notu aç',
      'icerik.duzenle': 'Notu düzenle',
      'saat.1': '1 saat',
      'saat.4': '4 saat',
      'saat.24': '1 gün',
      'saat.168': '1 hafta',
    },
    en: {
      'ortak.kaydet': 'Save',
      'ortak.vazgec': 'Cancel',
      'ortak.sil': 'Delete',
      'ortak.duzenle': 'Edit',
      'ortak.kapat': 'Close',
      'ortak.ayarlar': 'Settings',
      'ortak.panel': 'My notes',
      'ortak.silOnay': 'Delete this note?',
      'ortak.evetSil': 'Yes, delete',
      'ortak.dil': 'Language',
      'ortak.renk': 'Colour',
      'ortak.tumu': 'All',
      'renk.sari': 'Yellow',
      'renk.yesil': 'Green',
      'renk.mavi': 'Blue',
      'renk.pembe': 'Pink',
      'renk.mor': 'Purple',
      'renk.turuncu': 'Orange',
      'not.renk': 'Sticky note colour',
      'not.renkSecili': 'Selected colour: {renk}',
      'not.gorunum': 'View',
      'gorunum.postit': 'Sticky note',
      'gorunum.banner': 'Banner',
      'gorunum.footer': 'Footer',
      'gorunum.etiket': 'Corner tag',
      'not.siteGeneli': 'Site-wide — show on every page of this site',
      'not.siteGeneliNot': 'When checked, the note appears on every page of this site.',
      'not.tasi': 'Drag by the header to move',
      'panel.renkFiltre': 'Colour filter',
      'panel.siteGeneliRozet': 'SITE',

      'popup.baslik': 'DTNoT',
      'popup.aciklama': 'Leave a note on the page; see it on the page when you return.',
      'popup.ekle': 'Add note',
      'popup.eklePlaceholder': 'Your note for this page…',
      'popup.buSayfa': 'This page',
      'popup.sayfaYok': 'Open a regular web page to leave a note.',
      'popup.buSayfadakiNotlar': 'Notes on this page',
      'popup.sayfaNotYok': 'No notes on this page.',
      'popup.yeniNot': 'New note',
      'popup.duzenleBaslik': 'Edit note',
      'popup.kaydedildi': '✓ Note saved.',
      'popup.silindi': 'Note deleted.',
      'popup.metinGerekli': 'Note text cannot be empty.',
      'popup.kaydetHata': 'Could not save (storage error). Try again.',
      'popup.izinBaslik': 'Permission needed to draw notes on the page',
      'popup.izinMetin': 'Your notes are always saved. Grant site access to draw sticky notes/banners.',
      'popup.izinVer': 'Grant permission',
      'popup.izinOk': '✓ Permission granted — on-page notes are active.',
      'popup.izinRed': 'Permission not granted — on-page notes stay off.',
      'popup.canli': 'Ready on this page — your note will show on the page.',
      'popup.canliDegil': 'Notes cannot be drawn here — refresh the page (F5) or grant permission.',

      'panel.baslik': 'My notes',
      'panel.altbaslik': 'Grouped by site · edit, delete, open page',
      'panel.ara': 'Search notes…',
      'panel.sadeceAktif': 'Active site only',
      'panel.bos': 'No notes yet — start with “Add note” in the popup.',
      'panel.bosSite': 'No notes saved on this site.',
      'panel.bosArama': 'No results for “{q}”.',
      'panel.toplam': '{n} note(s)',
      'panel.sonGuncelleme': 'Last updated',
      'panel.olusturma': 'Created',
      'panel.sayfaAc': 'Open page',
      'panel.yedekUyari': '⚠ {n} notes piled up — a backup is recommended.',
      'panel.kurtarildi': 'Damaged records were repaired on load.',

      'ayar.baslik': 'Settings',
      'ayar.dil': 'Language',
      'ayar.dilNot': 'Interface language; the choice is remembered.',
      'ayar.davranis': 'Behaviour',
      'ayar.gizlemeSuresi': '“Hide” duration',
      'ayar.gizlemeNot': 'When you close a note, it stays hidden for the period you choose.',
      'ayar.sadeceAktif': 'While on the My Notes screen, automatically filters and shows the notes taken for the site you are currently on.',
      'ayar.tema': 'Theme',
      'ayar.temaKoyu': 'Dark',
      'ayar.temaAcik': 'Light',
      'ayar.veri': 'Data',
      'ayar.veriNot': 'Notes stay on this device only; nothing is uploaded anywhere.',
      'ayar.disaAktar': 'Download JSON',
      'ayar.veriTamSayfa': 'To import a JSON backup, open the full settings page with “Show in full page” at the bottom.',
      'ayar.iceAktar': 'Choose file…',
      'ayar.iceMerge': 'Merge (newest wins on conflict)',
      'ayar.iceReplace': 'Replace (overwrites existing notes)',
      'ayar.iceUyari': '“Replace” deletes your existing notes.',
      'ayar.iceOk': '✓ {n} notes imported.',
      'ayar.iceHata': 'Could not read the file — is it a valid DTNoT backup?',
      'ayar.surum': 'Version: {0}',
      'ayar.surumEtiket': 'Version',
      'ayar.hakkinda': 'About',
      'ayar.hakkindaMetin': 'DTNoT cares about your privacy: none of your data is leaked anywhere, and all your notes stay on your personal computer.',
      'ayar.gelistirici': 'Developer: DijitalTurk.com',
      'ayar.sayfadaGoster': 'Show in full page',

      'icerik.gizle': 'Hide note',
      'icerik.gizleSure': 'Hide note for {s}',
      'icerik.kucult': 'Minimize note',
      'icerik.ac': 'Open note',
      'icerik.duzenle': 'Edit note',
      'saat.1': '1 hour',
      'saat.4': '4 hours',
      'saat.24': '1 day',
      'saat.168': '1 week',
    },
  };

  let aktifDil = 'tr';
  const dinleyiciler = [];

  function t(anahtar, vars) {
    let s = (DICT[aktifDil] && DICT[aktifDil][anahtar]) || DICT.tr[anahtar] || anahtar;
    if (vars) {
      Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(String(vars[k])); });
    }
    return s;
  }

  async function hazirla() {
    try {
      const a = await DTNOT_STORE.ayarlariAl();
      if (a && a.lang) aktifDil = a.lang;
    } catch (e) { /* varsayılan tr */ }
    return aktifDil;
  }

  function dil() { return aktifDil; }

  async function dilAyarla(yeni) {
    aktifDil = yeni === 'en' ? 'en' : 'tr';
    try { await DTNOT_STORE.ayarlariKaydet({ lang: aktifDil }); } catch (e) { /* yut */ }
    dinleyiciler.forEach((fn) => { try { fn(aktifDil); } catch (e) { /* yut */ } });
    return aktifDil;
  }

  function abone(fn) { if (typeof fn === 'function') dinleyiciler.push(fn); }

  /** TR/EN bayrak düğmeleri (DTAI UX'iyle aynı düzen). */
  function bayraklar(kapsayici) {
    if (!kapsayici) return;
    kapsayici.textContent = '';
    [['tr', '🇹🇷'], ['en', '🇬🇧']].forEach(([kod, bayrak]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dil-dugme';
      b.setAttribute('aria-pressed', String(aktifDil === kod));
      b.setAttribute('aria-label', kod === 'tr' ? 'Türkçe' : 'English');
      b.title = kod === 'tr' ? 'Türkçe' : 'English';
      b.textContent = bayrak;
      b.addEventListener('click', () => { dilAyarla(kod); });
      kapsayici.appendChild(b);
    });
  }

  globalThis.DTNOT_I18N = { t, hazirla, dil, dilAyarla, abone, bayraklar, DICT };
  globalThis.t = t; // sayfa betiklerinde kısa kullanım
})();
