#!/usr/bin/env python3
"""DTNoT paketleyici.

Üretir:
  dist/dtnot-<sürüm>.zip / .xpi   → Firefox / Zen (gecko anahtarları dolu manifest)
  dist/dtnot-<sürüm>-chrome.zip   → Chrome / Edge (gecko'ya özel anahtarlar çıkarılır)
  dist/chrome-unpacked/           → Chrome'da "Paketlenmemiş öğe yükle" için klasör

Her paket: manifest arşivin KÖKÜNDE, yalnız çalışma zamanı dosyaları, tüm yerel
referanslar (manifest + HTML + script src) doğrulanır. Gelistirme dosyaları (.py/.md) girmez."""
import json
import os
import re
import shutil
import sys
import zipfile

KOK = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(KOK, 'dist')
HARIC_DIR = {'tests', 'dist', 'node_modules', '.git', '.github', 'docs', 'gelen-kaynak', 'gelen-dist'}
HARIC_UZANTI = ('.py', '.pyc', '.md', '.log', '.tsbuildinfo')


def calisma_dosyalari():
    for ad in sorted(os.listdir(KOK)):
        if ad in HARIC_DIR or ad.endswith(HARIC_UZANTI):
            continue
        if ad.startswith('.') or ad in ('package.json', 'package-lock.json'):
            continue
        yol = os.path.join(KOK, ad)
        if os.path.isdir(yol):
            for kok2, _alt, dosyalar in os.walk(yol):
                if any(p in HARIC_DIR for p in os.path.relpath(kok2, KOK).split(os.sep)):
                    continue
                for d in sorted(dosyalar):
                    if d.endswith(HARIC_UZANTI) or d.startswith('.'):
                        continue
                    yield os.path.join(kok2, d)
        else:
            yield yol


def chrome_manifesti(m):
    ch = json.loads(json.dumps(m))
    ch.pop('browser_specific_settings', None)
    return ch


def dogrula(hedef, m):
    with zipfile.ZipFile(hedef) as z:
        icerik = z.namelist()
        assert 'manifest.json' in icerik, 'manifest.json arşivin kökünde değil!'
        assert not any(n.startswith(('tests/', 'dist/', 'docs/', 'gelen-kaynak/')) for n in icerik), 'geliştirme klasörü arşive girmiş'
        assert not any(n.endswith(('.md', '.py', '.log', '.pyc')) for n in icerik), 'geliştirme dosyası arşive girmiş'
        a = json.loads(z.read('manifest.json'))
        assert a['version'] == m['version'], 'paket sürümü manifest ile uyuşmuyor'

        # manifest'in işaret ettiği her yerel dosya pakette mi?
        gerekli = set()
        gerekli.add(m['action']['default_popup'])
        gerekli |= set(m.get('icons', {}).values())
        gerekli |= set(m.get('action', {}).get('default_icon', {}).values())
        gerekli |= set(m.get('background', {}).get('scripts', []) or [])
        if m.get('background', {}).get('service_worker'):
            gerekli.add(m['background']['service_worker'])
        opt = m.get('options_ui', {}).get('page')
        if opt:
            gerekli.add(opt)
        for yol in sorted(gerekli):
            assert yol in icerik, f'manifest şunu gösteriyor ama pakette yok: {yol}'

        # i18n: default_locale + her dilin messages.json'u
        if m.get('default_locale'):
            dl = m['default_locale']
            assert f'_locales/{dl}/messages.json' in icerik, f'varsayılan dil dosyası yok: {dl}'
            for n in icerik:
                if n.startswith('_locales/') and n.endswith('/messages.json'):
                    json.loads(z.read(n))  # geçerli JSON mu?
            # __MSG_ ile başlayan alanlar karşılık buluyor mu?
            for alan in ('name', 'description'):
                deger = str(m.get(alan, ''))
                if deger.startswith('__MSG_'):
                    anahtar = deger.strip('_').replace('MSG_', '', 1).rstrip('_')
                    for n in [x for x in icerik if x.startswith('_locales/') and x.endswith('/messages.json')]:
                        sozluk = json.loads(z.read(n))
                        assert anahtar in sozluk, f'{n} içinde {anahtar} anahtarı yok'

        # sayfaların gösterdiği her script + css pakette mi?
        sayfalar = [n for n in icerik if n.endswith('.html')]
        for sayfa in sayfalar:
            html = z.read(sayfa).decode('utf-8')
            for yol in re.findall(r'(?:src|href)="([^"]+)"', html):
                if yol.startswith(('http://', 'https://', '#')):
                    continue
                temiz = yol.split('?')[0]
                assert temiz in icerik, f'{sayfa} şunu istiyor ama pakette yok: {yol}'
    return icerik


def paket_yaz(hedef, manifest):
    if os.path.exists(hedef):
        os.remove(hedef)
    with zipfile.ZipFile(hedef, 'w', zipfile.ZIP_DEFLATED) as z:
        for yol in calisma_dosyalari():
            z.write(yol, os.path.relpath(yol, KOK))
    icerik = dogrula(hedef, manifest)
    print(f'✓ {os.path.basename(hedef)} — {len(icerik)} dosya, manifest kökte, referanslar tam')
    return hedef


def main():
    os.makedirs(DIST, exist_ok=True)
    m = json.load(open(os.path.join(KOK, 'manifest.json'), encoding='utf-8'))
    surum = m['version']

    # manifest'in gösterdiği dosyalar diskte mi?
    isaretli = [m['action'].get('default_popup'), m.get('options_ui', {}).get('page')]
    isaretli += list(m.get('icons', {}).values()) + list(m.get('action', {}).get('default_icon', {}).values())
    isaretli += m.get('background', {}).get('scripts', []) or []
    if m.get('background', {}).get('service_worker'):
        isaretli.append(m['background']['service_worker'])
    for yol in [x for x in isaretli if x]:
        if not os.path.exists(os.path.join(KOK, yol)):
            sys.exit(f'HATA: manifest şu dosyayı gösteriyor ama diskte yok: {yol}')
    if m.get('default_locale'):
        dl = os.path.join(KOK, '_locales', m['default_locale'], 'messages.json')
        if not os.path.exists(dl):
            sys.exit(f'HATA: _locales/{m["default_locale"]}/messages.json yok')

    adlar = []
    for uzanti in ('zip', 'xpi'):
        adlar.append(paket_yaz(os.path.join(DIST, f'dtnot-{surum}.{uzanti}'), m))
    adlar.append(paket_yaz(os.path.join(DIST, f'dtnot-{surum}-chrome.zip'), chrome_manifesti(m)))

    klasor = os.path.join(DIST, 'chrome-unpacked')
    if os.path.exists(klasor):
        shutil.rmtree(klasor)
    os.makedirs(klasor)
    ch = chrome_manifesti(m)
    sayi = 0
    for yol in calisma_dosyalari():
        rel = os.path.relpath(yol, KOK)
        hedef = os.path.join(klasor, rel)
        os.makedirs(os.path.dirname(hedef), exist_ok=True)
        if rel == 'manifest.json':
            json.dump(ch, open(hedef, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        else:
            shutil.copy2(yol, hedef)
        sayi += 1
    print(f'✓ dist/chrome-unpacked/ — {sayi} dosya (chrome://extensions → Paketlenmemiş öğe yükle)')
    print('Paketler:', ', '.join(adlar))


if __name__ == '__main__':
    main()
