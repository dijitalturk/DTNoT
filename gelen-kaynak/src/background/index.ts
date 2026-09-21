/**
 * background/index.ts — Web Not arka plan servis çalışanı.
 *
 * Görev: içerik betiğini (post-it çizen script) yalnızca kullanıcı izin
 * verdiğinde RUNTIME'da kaydetmek. Kurulumda geniş host izni istemiyoruz
 * (optional_host_permissions modeli) — izin, popup'taki "İzin ver"
 * düğmesine basılınca `chrome.permissions.request` ile istenir; kabul
 * edilince burada dinlenen `onAdded` olayı içerik betiğini kaydeder.
 *
 * Ayrıca sağ tık menüsüne "Web Not ekle" seçeneği eklenir; seçilince popup
 * açılır (popup kendi state'inde ekle kutusunu otomatik açar).
 */
import { CS_ID } from '../lib/tabs';

const CS_MATCHES = ['http://*/*', 'https://*/*'];
const SAYFA_ORIGINS = ['*://*/*'];
const PENDING_KEY = 'web-not-pending';
const MENU_ID = 'web-not:add';

async function contentScriptKayitliMi(): Promise<boolean> {
  try {
    const kayitli = await chrome.scripting.getRegisteredContentScripts({ ids: [CS_ID] });
    return kayitli.length > 0;
  } catch {
    return false;
  }
}

/** İzin VARSA ve kayıt YOKSA kaydet; izin YOKSA ve kayıt VARSA sil. */
async function icerikBetigiEsle(): Promise<void> {
  let izinVar = false;
  try {
    izinVar = !!(await chrome.permissions.contains({ origins: SAYFA_ORIGINS }));
  } catch {
    return;
  }
  const kayitli = await contentScriptKayitliMi();
  try {
    if (izinVar && !kayitli) {
      await chrome.scripting.registerContentScripts([
        {
          id: CS_ID,
          js: ['content/webnot-content.js'],
          matches: CS_MATCHES,
          runAt: 'document_idle',
          persistAcrossSessions: true,
        },
      ]);
    } else if (!izinVar && kayitli) {
      await chrome.scripting.unregisterContentScripts({ ids: [CS_ID] });
    }
  } catch {
    /* kayıt/silme başarısızsa sessiz geç — eklentinin geri kalanı buna bağlı değil */
  }
}

chrome.runtime.onInstalled.addListener(() => {
  icerikBetigiEsle();
  try {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Web Not ekle',
      contexts: ['all'],
    });
  } catch {
    /* menü kurulamazsa popup ikonu yine çalışır */
  }
});
chrome.runtime.onStartup?.addListener(() => icerikBetigiEsle());
chrome.permissions.onAdded.addListener(() => icerikBetigiEsle());
chrome.permissions.onRemoved.addListener(() => icerikBetigiEsle());

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  await chrome.storage.local.set({ [PENDING_KEY]: { action: 'add', at: Date.now() } });
  try {
    await chrome.action.openPopup();
  } catch {
    /* bazı platformlarda openPopup kullanıcı jesti dışında çalışmaz; simgeden açılır */
  }
});
