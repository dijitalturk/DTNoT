#!/usr/bin/env python3
"""DTNoT ikon seti (16/32/48/96/128) — DTAI ailesi stili:
koyu lacivert zemin + sarı post-it (kıvrık köşe) + iki kısa satır."""
from PIL import Image, ImageDraw

KOYU = (11, 16, 32, 255)
SARI = (253, 246, 201, 255)
SARI_KENAR = (230, 217, 138, 255)
KIVRIK = (240, 226, 150, 255)
CIZGI = (96, 105, 130, 255)

BOYUTLAR = [16, 32, 48, 96, 128]
KOK = "/home/veysel/dev/DTNoT/icons"


def ciz(boyut):
    n = boyut * 8  # yüksek çözünürlükte çiz, sonra küçült (kenarlar temiz olsun)
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # zemin: yuvarlatılmış kare
    yaricap = int(n * 0.22)
    d.rounded_rectangle([0, 0, n - 1, n - 1], radius=yaricap, fill=KOYU)

    # post-it kâğıdı (hafif sağa yatık değil, sade)
    m = int(n * 0.22)
    kivrik = int(n * 0.24)
    kutu = [m, m, n - m, n - m]
    d.rectangle(kutu, fill=SARI, outline=SARI_KENAR, width=max(1, int(n * 0.015)))

    # kıvrık köşe (sağ üst) — zeminden üçgen kesip kıvrımı çiz
    d.polygon([(kutu[2] - kivrik, kutu[1]), (kutu[2], kutu[1] + kivrik), (kutu[2], kutu[1])], fill=KOYU)
    d.polygon([(kutu[2] - kivrik, kutu[1]), (kutu[2], kutu[1] + kivrik), (kutu[2] - kivrik, kutu[1] + kivrik)], fill=KIVRIK)

    # iki kısa satır
    sol = m + int(n * 0.10)
    genislik = (n - 2 * m) - int(n * 0.22)
    kalinlik = max(1, int(n * 0.045))
    y1 = m + int(n * 0.30)
    y2 = y1 + int(n * 0.16)
    d.rounded_rectangle([sol, y1, sol + genislik, y1 + kalinlik], radius=kalinlik // 2, fill=CIZGI)
    d.rounded_rectangle([sol, y2, sol + int(genislik * 0.66), y2 + kalinlik], radius=kalinlik // 2, fill=CIZGI)

    return img.resize((boyut, boyut), getattr(Image, 'Resampling', Image).LANCZOS)


for b in BOYUTLAR:
    ciz(b).save(f"{KOK}/dtnot-{b}.png")
    print(f"✓ icons/dtnot-{b}.png")
print("ikon seti hazır")
