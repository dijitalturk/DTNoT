#!/usr/bin/env python3
"""Chrome Web Store için eksik görseller: 128x128 mağaza ikonu, 440x280 küçük karo, 1400x560 marquee."""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

DIST = '/home/veysel/dev/DTNoT/dist/'
KOYU = (9, 13, 11)
YESIL = (162, 237, 172)
FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def zemin(w, h, blur=120, alpha=52):
    bg = Image.new('RGB', (w, h), KOYU)
    glow = Image.new('L', (w, h), 0)
    ImageDraw.Draw(glow).ellipse([-w * 0.25, -h * 0.75, w * 1.05, h * 0.95], fill=alpha)
    return Image.composite(Image.new('RGB', (w, h), (26, 40, 30)), bg, glow.filter(ImageFilter.GaussianBlur(blur)))


def karo(w, h, baslik, alt, alt2, gorsel=None, gorsel_yuzde=0.40):
    im = zemin(w, h)
    d = ImageDraw.Draw(im)
    fb = ImageFont.truetype(FB, int(h * 0.24))
    fa = ImageFont.truetype(FR, int(h * 0.085))
    fc = ImageFont.truetype(FR, int(h * 0.062))
    x = int(w * 0.06)
    d.rectangle([x, int(h * 0.22), x + int(w * 0.012), int(h * 0.78)], fill=YESIL)
    tx = x + int(w * 0.035)
    d.text((tx, int(h * 0.24)), baslik, font=fb, fill=(233, 243, 236))
    d.text((tx, int(h * 0.54)), alt, font=fa, fill=YESIL)
    d.text((tx, int(h * 0.70)), alt2, font=fc, fill=(139, 148, 158))
    if gorsel and os.path.exists(gorsel):
        g = Image.open(gorsel).convert('RGB')
        gw = int(w * gorsel_yuzde)
        g = g.resize((gw, round(g.height * gw / g.width)), Image.LANCZOS)
        px, py = w - gw - int(w * 0.045), (h - g.height) // 2
        golge = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(golge).rounded_rectangle([px + 6, py + 8, px + gw + 6, py + g.height + 8], radius=10, fill=(0, 0, 0, 160))
        im = Image.alpha_composite(im.convert('RGBA'), golge.filter(ImageFilter.GaussianBlur(14)))
        maske = Image.new('L', g.size, 0)
        ImageDraw.Draw(maske).rounded_rectangle([0, 0, g.width - 1, g.height - 1], radius=8, fill=255)
        im = im.convert('RGB')
        im.paste(g, (px, py), maske)
    return im


# 1) 128x128 mağaza ikonu
logo = Image.open(DIST + 'edge-logo-300.png').convert('RGB')
logo.resize((128, 128), Image.LANCZOS).save(DIST + 'chrome-icon-128.png', 'PNG', optimize=True)

# 2) 440x280 küçük karo (Chrome'da ZORUNLU)
karo(440, 280, 'DTNoT', 'Sayfalara not bırak', 'dijitalturk.com').save(
    DIST + 'chrome-karo-440x280.png', 'PNG', optimize=True)

# 3) 1400x560 marquee (opsiyonel ama hazır olsun)
karo(1400, 560, 'DTNoT', 'Sayfalara not bırak · post-it · banner · footer · etiket',
     'Ücretsiz · Üyelik yok · Notlar cihazında kalır', DIST + 'magaza-5-site.png', 0.46).save(
    DIST + 'chrome-marquee-1400x560.png', 'PNG', optimize=True)

for ad in ('chrome-icon-128.png', 'chrome-karo-440x280.png', 'chrome-marquee-1400x560.png'):
    im = Image.open(DIST + ad)
    print(f'{ad:32} {im.size}  {os.path.getsize(DIST + ad)//1024} KB')
