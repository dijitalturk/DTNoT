import type { Settings } from './types';

export const SETTINGS_KEY = 'web-not-settings';
export const GIZLEME_SECENEKLERI = [1, 4, 24, 168] as const;

export const DEFAULT_SETTINGS: Settings = {
  lang: 'tr',
  gizlemeSaat: 1,
  onlyActive: false,
};

export async function loadSettings(): Promise<Settings> {
  try {
    const got = await chrome.storage.local.get(SETTINGS_KEY);
    const a = (got as any)?.[SETTINGS_KEY];
    if (!a || typeof a !== 'object') return { ...DEFAULT_SETTINGS };
    const saat = Number(a.gizlemeSaat);
    return {
      lang: a.lang === 'en' ? 'en' : 'tr',
      gizlemeSaat: (GIZLEME_SECENEKLERI as readonly number[]).includes(saat)
        ? (saat as Settings['gizlemeSaat'])
        : DEFAULT_SETTINGS.gizlemeSaat,
      onlyActive: a.onlyActive === true,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}
