# DTNoT — AMO gönderim notları (0.2.1)

> Yüklenen dosya: **`dist/dtnot-0.2.1.zip`** (kaynak = paket; derleme adımı yok, bu yüzden ayrıca
> kaynak göndermeye gerek yok). Paket 19 dosya: manifest, 3 sayfa (popup/panel/options),
> `background.js`, `content.js`, `assets/{store,i18n,ui}`, `_locales/{tr,en}`, 5 ikon.

| Alan | Metin | Karakter | Sınır |
|---|---|---|---|
| Version notes | §1 | **2551** | 3000 |
| Notes to Reviewer | §2 | **2888** | 3000 |

## §1 — Version notes (kopyala-yapıştır)

```text
DTNoT — sticky notes on web pages (first public release, v0.2.1)

WHAT THE ADD-ON DOES
- Leave a note on any page; when you come back to that page the note is shown as a sticky note.
- Notes have 6 colours, can be searched/filtered in the "My notes" page, can be shown as a top
  announcement banner (optionally on every page of the same site), remember the position you drag
  them to, and can be exported/imported as JSON.
- Everything stays in Firefox local storage: no account, no server, no network requests.

WHAT IS NEW IN 0.2.1
- Clearer selected-colour indicator: double ring + checkmark + "Selected colour: …" label.
- Banner mode no longer overlaps the site header: the page is now pushed down by the banner height
  (tracked with a ResizeObserver) and restored to its original state when the banner is closed.
- The TR/EN language flags are now side by side in the popup header (they could wrap before).
- Opening "My notes" or Settings closes the popup.
- Added a developer link (DijitalTurk.com, globe icon) at the bottom of the popup; popup is 448px wide.
- Three labels reworded for clarity (About/privacy, hide duration, active-site filter). No behaviour change.
- Bug fixes: the [hidden] attribute was ignored on buttons styled with "all: unset"; search did not match
  Turkish dotted/dotless I (İ/i/I) consistently.

VERSIONS 0.1.0 AND 0.2.0 WERE NOT PUBLISHED (internal development only).

HOW TO TEST (no account or credentials needed)
1. Install the add-on and open any http/https page.
2. Click the DTNoT toolbar icon to open the popup. No broad permission is requested at install time.
3. Click "Not ekle" / "Add note", type a note, choose one of the 6 colours, then save.
4. Reload the page: the sticky note appears (bottom-left by default). Drag it by its header -
   the position is remembered per note.
5. Right-click on any page and choose "DTNoT: not ekle" to add a note for that page.
6. In the note editor tick "Show as a banner": the note becomes a strip at the very top of the page;
   tick "Site-wide" to show it on every page of that site.
7. Open the popup again: "Notlarım" / "My notes" is the full-page list (search + colour filter),
   the gear icon opens Settings (language TR/EN, hide duration, JSON export/import).
8. To have the sticky note drawn on pages, grant the site access offered in the popup
   ("İzin ver" / "Allow"). This is an optional host permission requested at runtime; the add-on
   works and saves notes without it.
9. Export a JSON backup in Settings and import it back (merge or replace).
```

## §2 — Notes to Reviewer (kopyala-yapıştır)

```text
Reviewer notes - DTNoT (sticky notes on web pages)

No test account or credentials are needed: there is no login, account or backend; it works fully offline.

WHAT IT DOES
Click the toolbar icon on any page and write a note. When you revisit that page the note appears as a
sticky note (drawn in a shadow root, so the page's CSS cannot break it). Notes support 6 colours, an
optional "announcement banner" mode (optionally site-wide), drag-and-drop position (stored as a viewport
ratio) and JSON export/import. The "My notes" page lists, searches and filters notes; Settings holds
language (TR/EN), hide duration and backup.

DATA / PRIVACY
- No network requests: nothing is ever sent or received.
- Notes and settings live only in browser.storage.local (keys "web-not-store", "web-not-settings").
- Manifest declares data_collection_permissions.required = ["none"].
- The only URLs in the package: content-script match patterns "http(s)://*/*" (where a note may be
  injected), a developer link in the popup/options footer (opens only if clicked), and an example URL in a
  code comment.
- No eval, no remote code, no minification or bundling: the shipped files are the source (plain JavaScript).

PERMISSIONS
- storage: keep notes and settings locally.
- scripting + optional_host_permissions "*://*/*": the content script that draws the sticky note is
  registered at runtime (scripting.registerContentScripts) and only after the user grants site access from
  the popup - that is why host access is optional and not requested at install time.
- activeTab: read the current tab's address so a note can be saved without broad access.
- contextMenus: right-click "add note" entry.

WHY TWO BACKGROUND KEYS
background.scripts (Firefox MV3 event page) and background.service_worker (Chrome) are both declared so one
package serves both browsers; Firefox ignores service_worker. Chrome's background is a classic service
worker that calls importScripts once for assets/store.js; on Firefox those files are listed in
background.scripts instead. No polyfill is used: promise-based chrome.* calls work on Firefox 127+
(verified on Firefox 155).

HOW TO TEST
1. Install, open any http/https page, click the toolbar icon, then "İzin ver" / "Allow" to grant the
   optional site access (needed to draw the sticky note).
2. "Not ekle" / "Add note": type text, pick a colour, save, close the popup, reload -> the sticky note
   appears. Drag it by its header; the position is remembered.
3. Edit a note in "My notes" and tick "Show as a banner" (optionally "site-wide"): a strip appears at the
   top and the page is pushed down (not overlapped). Close it with x.
4. Right-click any page: "DTNoT: not ekle".
5. Settings: switch TR/EN, change hide duration, export a JSON backup and import it (merge/replace).

Unlisted / self-distribution build, no platform-specific code, no other add-ons involved.
```

## §3 — AMO formundaki diğer sorular

| Soru | Cevap |
|---|---|
| Does this add-on require an account? | **No** — hesap, giriş, sunucu yok; tamamen çevrimdışı |
| Does it collect data? / data_collection | **No** — `data_collection_permissions.required = ["none"]` |
| Category | *Other* (not alma / productivity) — öneri: **Other** ya da **Productivity** |
| License | Kendi seçimin; öneri: **All Rights Reserved** (self-distribution) |
| Source code submission | **Gerekmez** — paket doğrudan kaynaktır (minify/bundle/eval yok) |
| Distribution | **On your own / unlisted** (self-distribution) |

## §4 — İnceleme notları (teknik özet)

- Tek ağ hedefi yok; tek `importScripts` çağrısı yalnız Chrome service worker'ında yerel `assets/store.js` yükler.
- `background.scripts` (Firefox) + `background.service_worker` (Chrome) birlikte; Firefox `service_worker`'ı yok sayar.
- Post-it Shadow DOM içinde çizilir; sayfanın CSS'i ile çakışmaz.
- İçerik betiği runtime'da (`scripting.registerContentScripts`) kaydedilir → kurulumda geniş izin istenmez.
- Notlar `browser.storage.local`'da (`web-not-store`, `web-not-settings`); dışa aktarma kullanıcı tetiklemeli JSON.

## §5 — İmzalandıktan sonra

1. AMO imzalı `.xpi` verir → kalıcı kurulum için o dosya kullanılır (geçici yükleme tarayıcı kapanınca kalkar).
2. Kurulum sonrası popup'tan **İzin ver** ile site erişimi verilir; notlar bunu gerektirmez, post-it çizimi gerektirir.
