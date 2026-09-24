/* DTNoT tanıtım sayfası — görsel galerisi
   Tıkla → modal açılır; ‹ › düğmeleri, ok tuşları, Esc ve dokunmatik kaydırma ile gezinilir. */
(function () {
  'use strict';

  var kutu = document.getElementById('dtnot-lightbox');
  if (!kutu) { return; }

  var buyukResim = document.getElementById('dtnot-buyuk');
  var altYazi = document.getElementById('dtnot-alt-yazi');
  var sayac = document.getElementById('dtnot-sayac');
  var kapatDugme = document.getElementById('dtnot-kapat');
  var oncekiDugme = document.getElementById('dtnot-onceki');
  var sonrakiDugme = document.getElementById('dtnot-sonraki');
  var dugmeler = [].slice.call(document.querySelectorAll('.dtnot-buyut'));
  if (!dugmeler.length) { return; }

  var sira = 0;
  var geriOdak = null;

  function goster(n) {
    sira = (n + dugmeler.length) % dugmeler.length;
    var dugme = dugmeler[sira];
    var resim = dugme.querySelector('img');
    if (!resim) { return; }
    buyukResim.src = resim.currentSrc || resim.src;
    buyukResim.alt = resim.alt || '';
    var kart = dugme.closest('figure');
    var yazi = kart ? kart.querySelector('figcaption') : null;
    altYazi.textContent = yazi ? yazi.textContent : (resim.alt || '');
    sayac.textContent = (sira + 1) + ' / ' + dugmeler.length;
  }

  function ac(n) {
    geriOdak = document.activeElement;
    goster(n);
    kutu.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    if (kapatDugme) { kapatDugme.focus(); }
  }

  function kapat() {
    kutu.hidden = true;
    document.documentElement.style.overflow = '';
    buyukResim.removeAttribute('src');
    if (geriOdak && geriOdak.focus) { geriOdak.focus(); }
  }

  dugmeler.forEach(function (dugme, n) {
    dugme.addEventListener('click', function () { ac(n); });
  });
  if (kapatDugme) { kapatDugme.addEventListener('click', kapat); }
  if (oncekiDugme) { oncekiDugme.addEventListener('click', function () { goster(sira - 1); }); }
  if (sonrakiDugme) { sonrakiDugme.addEventListener('click', function () { goster(sira + 1); }); }

  kutu.addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-kapat')) { kapat(); }
  });

  document.addEventListener('keydown', function (e) {
    if (kutu.hidden) { return; }
    if (e.key === 'Escape') { kapat(); }
    else if (e.key === 'ArrowLeft') { goster(sira - 1); }
    else if (e.key === 'ArrowRight') { goster(sira + 1); }
  });

  var baslangicX = null;
  kutu.addEventListener('touchstart', function (e) {
    baslangicX = e.touches[0].clientX;
  }, { passive: true });
  kutu.addEventListener('touchend', function (e) {
    if (baslangicX === null) { return; }
    var fark = e.changedTouches[0].clientX - baslangicX;
    if (Math.abs(fark) > 45) { goster(fark > 0 ? sira - 1 : sira + 1); }
    baslangicX = null;
  }, { passive: true });
})();
