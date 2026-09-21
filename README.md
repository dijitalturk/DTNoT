# DTNoT

> **Durum:** kurulum — kapsam prompt'u bekleniyor (2026-09-21).
> **UX temeli:** DT AI ProductHunter (DTAI Tool) tasarım yapısı — [[DT-AI-ProductHunter]].
> Kapsam netleşince iskelet (klasör düzeni, ilk sürüm, paketleme) kurulacak.

## UX temeli — DTAI Tool'dan devralınacaklar

| Katman | Kaynak (referans dosya) |
|---|---|
| Tasarım sistemi (renk, boşluk, buton, badge, kart) | `dtai-tool/assets/ui-CZC4WHNU.css` |
| Ana menü/popup yerleşimi (TR/EN bayrakları, ayar çarkı, tek ana eylem, uyarı satırı) | `dtai-tool/popup.*` |
| Sonuç/panel ekranı — **kart ızgarası değil, düz satır listesi** | `dtai-tool/dashboard.*` + `assets/dashboard.css` |
| Ayarlar sayfası (saf JS, ölçülü form, salt-okunur durum gösterimi) | `dtai-tool/options.*` |
| TR/EN i18n modülü (tek sözlük, dil kalıcı) | `dtai-tool/assets/i18n.js` |
| Mimari iskelet (katmanlar, LLM kullanımı, performans, tuzaklar) | `dtai-tool/docs/MIMARI-REFERANS.md` |
| İki tarayıcı için paketleme (Firefox + Chrome temiz manifest) | `dtai-tool/build.py` |
| Test disiplini (mantık / DOM / panel katmanları + gerçek tarayıcı ölçümü) | `dtai-tool/tests/` |

## Devralınan çalışma kuralları

- Siteye özel (DOM'a özel) kod **yok** — genel, katmanlı algılama
- Yetki/anahtar yoksa ağ isteği **atılmaz**; hata olursa mevcut akış bozulmaz (temiz başarısızlık)
- Sır yalnız `.env`/oturum belleğinde; loglara veya dışa aktarmalara **asla** yazılmaz
- Tüm arayüz **TR + EN**
- Eksik/ölçülmemiş bilgi, uydurma bilgiden iyidir
- Her sürümde testler + gerçek tarayıcıda ölçüm; sürüm notu ve commit mesajı açıklayıcı

## Bekleyen

- Kapsam prompt'u → netleşince: klasör düzeni, ilk sürüm iskeleti, testler, paketleme
- GitHub: **private** repo açılacak (henüz açılmadı)
