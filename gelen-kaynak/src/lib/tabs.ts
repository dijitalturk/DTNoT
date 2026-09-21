export const SAYFA_ORIGINS = ['*://*/*'];
export const CS_ID = 'web-not-content';

export async function activeTabUrl(): Promise<string> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url ?? '';
  } catch {
    return '';
  }
}

export async function activeTabId(): Promise<number | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
}

export async function hasPagePermission(): Promise<boolean> {
  try {
    return !!(await chrome.permissions.contains({ origins: SAYFA_ORIGINS }));
  } catch {
    return false;
  }
}

export async function requestPagePermission(): Promise<boolean> {
  try {
    return !!(await chrome.permissions.request({ origins: SAYFA_ORIGINS }));
  } catch {
    return false;
  }
}

export type ContentMessage =
  | { tip: 'webnot-ping' }
  | { tip: 'webnot-yenile' };

export interface ContentReply {
  canli: true;
  anahtar: string;
}

/** İçerik betiğine mesaj gönder; betik yoksa/sayfa desteklemiyorsa null döner. */
export async function pingContentScript(
  tabId: number,
  tip: ContentMessage['tip']
): Promise<ContentReply | null> {
  try {
    const reply = (await chrome.tabs.sendMessage(tabId, { tip })) as ContentReply | undefined;
    return reply?.canli ? reply : null;
  } catch {
    return null;
  }
}
