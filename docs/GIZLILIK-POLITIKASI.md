# DTNoT — Gizlilik Politikası

Son güncelleme: 24 Eylül 2026 · Eklenti sürümü: 0.3.3 · Geliştirici: DijitalTurk
İletişim: dtnot@dijitalturk.com · Web: https://dijitalturk.com/dtnot/

## Özet

DTNoT hiçbir kişisel veri toplamaz, sunucuya göndermez, satmaz veya üçüncü taraflarla paylaşmaz.
Notlarınız yalnızca kendi tarayıcınızda, kendi cihazınızda saklanır. Hesap, üyelik veya giriş yoktur;
eklenti internet üzerinden hiçbir istek yapmaz.

## 1. Hangi bilgiler işlenir?

Yalnızca sizin oluşturduğunuz notlar ve notun doğru yerde gösterilebilmesi için gereken teknik bilgiler,
cihazınızda işlenir:

- Not metni
- Notun görünümü (post-it, banner, footer, köşe etiketi), rengi ve sayfadaki konumu
- Notun ait olduğu site adresi (örn. `sahibinden.com`) ve — not "site geneli" işaretlenmediyse — sayfa adresi
- "Site geneli" işareti, gizleme durumu ve tarih bilgileri
- Arayüz tercihleri (dil, tema, "gizle" süresi)

Bu bilgiler yalnızca notunuzu doğru sayfada, doğru görünümle göstermek için kullanılır; başka bir amaçla
kullanılmaz.

## 2. Veriler nerede saklanır?

Tüm veriler tarayıcının eklentiye özel yerel deposunda (`chrome.storage.local`) tutulur. Bu depo
cihazınızda bulunur, tarayıcı hesabınızla senkronize edilmez ve DijitalTurk'ün erişebileceği bir sunucuda
not kopyası tutulmaz.

## 3. Veri toplama, iletme ve paylaşma yoktur

- Sunucu, veritabanı, kullanıcı hesabı yoktur.
- Analitik, çökme raporu, kullanım istatistiği, reklam veya izleme aracı yoktur.
- Eklenti hiçbir ağ isteği (fetch / XMLHttpRequest / WebSocket / beacon) yapmaz; bu, yayınlanan paketin
  kaynak kodunda doğrulanabilir.
- Hiçbir veri satılmaz, kiralanmaz veya üçüncü taraflarla paylaşılmaz.
- Notlar cihazınızdan çıkmadığı için veri aktarımı, paylaşımı veya yurt dışına transfer söz konusu değildir.

## 4. İstenen izinler ve gerekçeleri

| İzin | Neden gerekli |
| --- | --- |
| `storage` | Notlarınızı ve tercihlerinizi cihazınızda saklamak. |
| `activeTab` | Not eklemek/düzenlemek için yalnızca o an açık olan sekmeye erişmek. Kurulumda geniş izin istenmez; erişim sizin işleminizle verilir. |
| `scripting` | Notun sayfada görünebilmesi için arayüzü geçerli sayfaya yerleştirmek. |
| `contextMenus` | Sağ tık menüsüne "Not ekle" kısayolunu eklemek. |
| Sayfa erişimi (http/https) | Notların ilgili sitelerde gösterilebilmesi. Eklenti sayfa içeriğini okumaz, kopyalamaz, kaydetmez veya iletmez; yalnızca kendi not katmanını yerleştirir. |

## 5. Sayfa içeriğine erişim

DTNoT; ziyaret ettiğiniz sayfanın metnini, formlarını, giriş bilgilerini, resimlerini veya çerezlerini
okumaz ve kaydetmez. Sayfaya eklediği tek şey, sizin oluşturduğunuz nottur. (Notların alt köşesinde
dijitalturk.com bağlantısı bulunur; tıklarsanız tarayıcınız o siteyi açar — bu, eklentinin veri aktardığı
anlamına gelmez.)

## 6. Gizli (incognito) mod

Gizli modda kullanım tarayıcınızın kendi ayarına bağlıdır. Kullanılsa bile notlar yine yalnızca cihazınızda
saklanır.

## 7. Kontrol sizde: silme, yedekleme, taşıma

- **Notu silme:** herhangi bir notun ✎ menüsünden.
- **Tüm verileri silme:** eklentiyi kaldırmak, tarayıcıdaki eklenti verilerini silmek veya site verilerini
  tarayıcı ayarlarından temizlemek yeterlidir; bu durumda tüm notlar silinir.
- **Yedekleme / taşıma:** Ayarlar bölümünden "JSON indir" ile dilediğiniz an yedek alabilir, başka bir
  cihazda içe aktarabilirsiniz.

## 8. Çocukların gizliliği

Eklenti hiçbir kişisel veri toplamadığı için çocuklardan da veri toplamaz; yaş doğrulaması gerektiren bir
işlev yoktur.

## 9. Değişiklikler

Bu politika güncellendiğinde "Son güncelleme" tarihi ve sürüm numarası değişir; önemli değişiklikler
mağaza sürüm notlarında duyurulur.

## 10. İletişim

Sorular ve talepler için: **dtnot@dijitalturk.com** · https://dijitalturk.com/dtnot/

**Kapsam notu:** Bu politika yalnızca DTNoT tarayıcı eklentisini kapsar. dijitalturk.com web sitesinin
kendi sayfaları için site gizlilik politikası geçerlidir:
https://dijitalturk.com/veysel/dijitalturk-gizlilik-politikasi/

---

# DTNoT — Privacy Policy (English)

Last updated: September 24, 2026 · Extension version: 0.3.3 · Developer: DijitalTurk
Contact: dtnot@dijitalturk.com · Web: https://dijitalturk.com/dtnot/

## Summary

DTNoT does not collect, transmit, sell, or share any personal data. Your notes are stored only in your own
browser, on your own device. There is no account, no sign-in, and the extension makes no network requests.

## 1. What is processed

Only the notes you create and the technical details needed to display them correctly, processed on your
device: note text; note type (post-it, banner, footer, corner tag), colour and on-page position; the site
address the note belongs to (and the page address unless the note is marked site-wide); site-wide flag,
hidden state and timestamps; interface preferences (language, theme, hide duration). This information is
used solely to show your note in the right place with the right appearance.

## 2. Where data is stored

All data is kept in the browser's extension-local storage (`chrome.storage.local`). It stays on your device,
is not synced with your browser account, and no copy of your notes is kept on any server accessible to
DijitalTurk.

## 3. No collection, no transmission, no sharing

No server, database or user account. No analytics, crash reporting, usage statistics, advertising or
tracking. The extension performs no network requests (fetch / XMLHttpRequest / WebSocket / beacon) — this
is verifiable in the source of the published package. No data is sold, rented or shared with third parties.
Because notes never leave your device, there is no data transfer, sharing or cross-border transfer.

## 4. Permissions and why they are needed

`storage` — store your notes and preferences on your device. `activeTab` — access only the tab you are
actively working in, to add or edit a note (no broad access is requested at install time; access is granted
by your action). `scripting` — place the note interface into the current page so notes can be displayed.
`contextMenus` — add the "Add note" shortcut to the right-click menu. Page access (http/https) — so notes
can appear on the relevant sites. The extension does not read, copy, store or transmit page content; it only
injects its own note layer.

## 5. Access to page content

DTNoT does not read or store the text, forms, credentials, images or cookies of the pages you visit. The
only thing it adds to a page is the note you created. (A dijitalturk.com link appears under your notes;
clicking it opens that site in your browser — this does not mean the extension transmits data.)

## 6. Incognito mode

Use in private/incognito mode depends on your browser's own setting. Even then, notes are stored only on
your device.

## 7. Your control: delete, back up, move

**Delete a note** from any note's ✎ menu. **Delete everything** by removing the extension, clearing the
extension's data in your browser, or clearing site data in your browser settings — all notes are deleted.
**Back up / move** at any time via Settings → "Download JSON", and import on another device.

## 8. Children's privacy

Because the extension collects no personal data, it collects none from children either; no age-verification
feature exists.

## 9. Changes

When this policy changes, the "Last updated" date and version number change; significant changes are
announced in the store release notes.

## 10. Contact

Questions and requests: **dtnot@dijitalturk.com** · https://dijitalturk.com/dtnot/

**Scope note:** This policy covers the DTNoT browser extension only. The dijitalturk.com website pages are
governed by the site privacy policy: https://dijitalturk.com/veysel/dijitalturk-gizlilik-politikasi/
