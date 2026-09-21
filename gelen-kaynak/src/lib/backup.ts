import { loadNotes, importNotes, STORE_VERSION } from './store';
import type { Note } from './types';

export interface BackupFile {
  app: 'web-not';
  schema: number;
  exportedAt: string;
  notlar: Note[];
}

/** Notları JSON string'e çevirir (dışa aktarma). */
export async function exportNotesJSON(): Promise<string> {
  const store = await loadNotes();
  const payload: BackupFile = {
    app: 'web-not',
    schema: STORE_VERSION,
    exportedAt: new Date().toISOString(),
    notlar: store.notlar,
  };
  return JSON.stringify(payload, null, 2);
}

/** Tarayıcıda indirme tetikler (popup içinden <a download> ile). */
export async function downloadNotesJSON(): Promise<void> {
  const json = await exportNotesJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const tarih = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `web-not-yedek-${tarih}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Dosyadan içe aktarır; şema dışı/bozuk dosyada hata fırlatır (çağıran yakalar). */
export async function importNotesFromFile(file: File, strategy: 'merge' | 'replace'): Promise<number> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  const obj = parsed as Partial<BackupFile> & { notlar?: unknown };
  const list = Array.isArray(obj?.notlar) ? obj.notlar : null;
  if (!list) throw new Error('invalid-schema');
  const store = await importNotes(list as Note[], strategy);
  return store.notlar.length;
}
