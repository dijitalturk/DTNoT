#!/usr/bin/env python3
"""Chrome mağaza görselleri v3 — satırlar AÇIKÇA verilir, metin alanı görsele sınırlı."""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

DIST = '/home/veysel/dev/DTNoT/dist/'
KOYU = (9, 13, 11)
YESIL = (162, 237, 172)
SOLUK = (139, 148, 158)
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def zemin(w, h, blur=120, alpha=52):
    bg = Image.new('RGB', (w, h), KOYU)
    glow = Image.new('L', (w, h), 0)
    ImageDraw.Draw(glow).ellipse([-w * 0.25, -h * 0.75, w * 1.05, h * 0.95], fill=alpha)
    return Image.composite(Image.new('RGB', (w, h), (26, 40, 30)), bg, glow.filter(ImageFilter.GaussianBlur(blur)))


def olcu(d, font, metin):
    k = d.textbbox((0, 0), metin, font=font, anchor='lt')
    return k[3] - k[1]


def karo(w, h, satirlar, gorsel=None, gorsel_yuzde=0.42):
    """satirlar: [(metin, rol)] — rol: 'baslik' | 'vurgu' | 'not' | 'kucuk'"""
    im = zemin(w, h)
    d = ImageDraw.Draw(im)
    fontlar = {
        'baslik': ImageFont.truetype(FB, int(h * 0.215)),
        'vurgu': ImageFont.truetype(FR, int(h * 0.062)),
        'not': ImageFont.truetype(FR, int(h * 0.048)),
        'kucuk': ImageFont.truetype(FR, int(h * 0.040)),
    }
    renkler = {'baslik': (233, 243, 236), 'vurgu': YESIL, 'not': SOLUK, 'kucuk': SOLUK}

    sol, ic = int(w * 0.06), int(w * 0.035)
    rezerve = (int(w * gorsel_yuzde) + int(w * 0.09)) if gorsel else 0
    metin_w = w - sol - ic - rezerve - int(w * 0.04)
    for metin, rol in satirlar:
        if d.textlength(metin, font=fontlar[rol]) > metin_w:
            raise SystemExit(f'TAŞMA: "{metin}" {d.textlength(metin, font=fontlar[rol]):.0f}px > {metin_w}px')

    bosluk = int(h * 0.040)
    toplam = sum(olcu(d, fontlar[r], m) for m, r in satirlar) + bosluk * (len(satirlar) - 1)
    y = (h - toplam) // 2
    d.rectangle([sol, y + int(h * 0.012), sol + max(6, int(w * 0.010)), y + toplam - int(h * 0.012)], fill=YESIL)
    for metin, rol in satirlar:
        d.text((sol + ic, y), metin, font=fontlar[rol], fill=renkler[rol], anchor='lt')
        y += olcu(d, fontlar[rol], metin) + bosluk

    if gorsel and os.path.exists(gorsel):
        g = Image.open(gorsel).convert('RGB')
        gw = int(w * gorsel_yuzde)
        g = g.resize((gw, round(g.height * gw / g.width)), Image.LANCZOS)
        px, py = w - gw - int(w * 0.045), (h - g.height) // 2
        golge = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(golge).rounded_rectangle([px + 6, py + 8, px + gw + 6, py + g.height + 8],
                                                radius=10, fill=(0, 0, 0, 160))
        im = Image.alpha_composite(im.convert('RGBA'), golge.filter(ImageFilter.GaussianBlur(14)))
        maske = Image.new('L', g.size, 0)
        ImageDraw.Draw(maske).rounded_rectangle([0, 0, g.width - 1, g.height - 1], radius=8, fill=255)
        im = im.convert('RGB')
        im.paste(g, (px, py), maske)
    return im


Image.open(DIST + 'edge-logo-300.png').convert('RGB').resize((128, 128), Image.LANCZOS).save(
    DIST + 'chrome-icon-128.png', 'PNG', optimize=True)

karo(440, 280, [('DTNoT', 'baslik'), ('Sayfalara not bırak', 'vurgu'),
                ('post-it · banner · footer · etiket', 'kucuk')]).save(
    DIST + 'chrome-karo-440x280.png', 'PNG', optimize=True)

karo(1400, 560, [('DTNoT', 'baslik'), ('Sayfalara not bırak', 'vurgu'),
                 ('post-it · banner · footer · köşe etiketi', 'not'),
                 ('Ücretsiz · Üyelik yok · Notlar cihazında kalır', 'kucuk')],
     DIST + 'magaza-5-site.png', 0.42).save(DIST + 'chrome-marquee-1400x560.png', 'PNG', optimize=True)

for ad in ('chrome-icon-128.png', 'chrome-karo-440x280.png', 'chrome-marquee-1400x560.png'):
    im = Image.open(DIST + ad)
    print(f'{ad:34} {im.size}  {os.path.getsize(DIST + ad)//1024} KB')
