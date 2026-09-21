/**
 * lib/store.ts — Web Not deposu (TEK YAZMA NOKTASI).
 *
 * Sayfa-bazlı notlar: anahtar = normalize edilmiş URL (host + pathname).
 *   - host küçük harfe çevrilir; `www.` KORUNUR (subdomain ayrı not sayılır).
 *   - query (?...) ve hash (#...) atılır.
 *   - kök hariç sondaki '/' kırpılır (/urun/123/ -> /urun/123).
 *
 * Depo: chrome.storage.local, anahtar STORAGE_KEY.
 *
 * ÖNEMLİ: normalizeUrl burada ve content script'te (content/webnot-content.ts)
 * BİREBİR AYNI olmalı. Biri değişirse diğeri de güncellenmeli — aksi halde
 * popup'ta eklenen not sayfada görünmez (parity kırılır).
 */
import type { Note, NoteStore } from './types';

export const STORAGE_KEY = 'web-not-store';
export const STORE_VERSION = 1;
export const SNOOZE_MS_DEFAULT = 3600 * 1000;
export const METIN_MAX = 4000;
export const KOTA_UYARI_NOT = 300;

export function normalizeUrl(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  let u: URL | null = null;
  try {
    u = new URL(s);
  } catch {
    u = null;
  }
  if (u && (u.protocol === 'http:' || u.protocol === 'https:')) {
    const host = String(u.host ?? '').toLowerCase();
    if (host) return host + yoluDuzle(String(u.pathname ?? '/'));
  }
  const m = s.match(/^([a-z0-9-]+(?:\.[a-z0-9-]+)+|localhost)(:\d+)?(\/.*)?$/i);
  if (!m) return '';
  return (m[1] + (m[2] || '')).toLowerCase() + yoluDuzle(m[3] || '/');
}

function yoluDuzle(path: string): string {
  let p = String(path ?? '/');
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

export function hostOf(anahtar: string): string {
  const s = String(anahtar ?? '');
  const at = s.indexOf('/');
  return at === -1 ? s : s.slice(0, at);
}

export function yolOf(anahtar: string): string {
  const s = String(anahtar ?? '');
  const at = s.indexOf('/');
  return at === -1 ? '/' : s.slice(at) || '/';
}

function cleanNote(raw: unknown): Note | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const anahtar = normalizeUrl(r.anahtar as string);
  if (!anahtar) return null;
  const metin = String(r.metin ?? '').slice(0, METIN_MAX);
  if (!metin.trim()) return null;
  const sayi = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    anahtar,
    host: hostOf(anahtar),
    yol: yolOf(anahtar),
    metin,
    olusturma: sayi(r.olusturma, Date.now()),
    guncelleme: sayi(r.guncelleme, sayi(r.olusturma, Date.now())),
    kucuk: r.kucuk === true,
    gizleUntil: sayi(r.gizleUntil, 0),
  };
}

/** Ham depo verisini doğrula; bozuk kayıtta çökmeden güvenli varsayılana düşer. */
export function validateStore(raw: unknown): NoteStore {
  const empty: NoteStore = { version: STORE_VERSION, notlar: [], recovered: false };
  if (raw === undefined || raw === null) return empty;
  if (typeof raw !== 'object') return { ...empty, recovered: true };
  const list = Array.isArray((raw as any).notlar) ? ((raw as any).notlar as unknown[]) : null;
  if (!list) return { ...empty, recovered: true };
  const harita = new Map<string, Note>();
  let dropped = 0;
  for (const k of list) {
    const clean = cleanNote(k);
    if (!clean) {
      dropped += 1;
      continue;
    }
    const varolan = harita.get(clean.anahtar);
    if (varolan && varolan.guncelleme >= clean.guncelleme) {
      dropped += 1;
      continue;
    }
    if (varolan) dropped += 1;
    harita.set(clean.anahtar, clean);
  }
  const notlar = [...harita.values()].sort((a, b) => b.guncelleme - a.guncelleme);
  return { version: STORE_VERSION, notlar, recovered: dropped > 0 };
}

export function visibleNote(store: NoteStore, anahtar: string, now = Date.now()): Note | null {
  const k = store.notlar.find((x) => x.anahtar === anahtar);
  if (!k) return null;
  if (Number(k.gizleUntil ?? 0) > now) return null;
  return k;
}

export function groupByHost(notlar: Note[]): { host: string; notlar: Note[] }[] {
  const gruplar = new Map<string, Note[]>();
  for (const k of notlar) {
    const host = k.host || hostOf(k.anahtar);
    if (!gruplar.has(host)) gruplar.set(host, []);
    gruplar.get(host)!.push(k);
  }
  return [...gruplar.entries()].map(([host, items]) => ({ host, notlar: items }));
}

async function readRaw(): Promise<unknown> {
  const got = await chrome.storage.local.get(STORAGE_KEY);
  return (got as any)?.[STORAGE_KEY];
}

export async function writeRaw(store: NoteStore): Promise<NoteStore> {
  const payload: NoteStore = { version: STORE_VERSION, notlar: store.notlar, recovered: false };
  // Not: yazma başarısızsa (kota vb.) hata YUTULMAZ — çağıran arayüze iletilir,
  // kullanıcı "kaydedildi" görüp sonra kayıp yaşamasın.
  await chrome.storage.local.set({ [STORAGE_KEY]: payload });
  return payload;
}

export async function loadNotes(): Promise<NoteStore> {
  return validateStore(await readRaw());
}

export async function saveNote({ url, metin }: { url: string; metin: string }): Promise<Note> {
  const anahtar = normalizeUrl(url);
  if (!anahtar) throw new Error('gecersiz sayfa');
  const temiz = String(metin ?? '').slice(0, METIN_MAX);
  const store = await loadNotes();
  const simdi = Date.now();
  const varolan = store.notlar.find((x) => x.anahtar === anahtar);
  if (!temiz.trim()) {
    if (!varolan) throw new Error('metin gerekli');
    return varolan;
  }
  if (varolan) {
    varolan.metin = temiz;
    varolan.guncelleme = simdi;
    varolan.kucuk = false;
    varolan.gizleUntil = 0;
    await writeRaw(store);
    return varolan;
  }
  const kayit: Note = {
    anahtar,
    host: hostOf(anahtar),
    yol: yolOf(anahtar),
    metin: temiz,
    olusturma: simdi,
    guncelleme: simdi,
    kucuk: false,
    gizleUntil: 0,
  };
  store.notlar.unshift(kayit);
  await writeRaw(store);
  return kayit;
}

export async function removeNote(anahtar: string): Promise<string> {
  const store = await loadNotes();
  const key = normalizeUrl(anahtar);
  const at = store.notlar.findIndex((x) => x.anahtar === key);
  if (at === -1) throw new Error('kayit bulunamadi');
  const [gone] = store.notlar.splice(at, 1);
  await writeRaw(store);
  return gone.anahtar;
}

export async function setKucuk(anahtar: string, kucuk: boolean): Promise<Note> {
  const store = await loadNotes();
  const k = store.notlar.find((x) => x.anahtar === normalizeUrl(anahtar));
  if (!k) throw new Error('kayit bulunamadi');
  k.kucuk = kucuk === true;
  await writeRaw(store);
  return k;
}

export async function setSnooze(anahtar: string, ms = SNOOZE_MS_DEFAULT): Promise<Note> {
  const store = await loadNotes();
  const k = store.notlar.find((x) => x.anahtar === normalizeUrl(anahtar));
  if (!k) throw new Error('kayit bulunamadi');
  k.gizleUntil = Date.now() + Math.max(0, Number(ms) || 0);
  await writeRaw(store);
  return k;
}

/**
 * İçe aktarılan notları mevcut depoyla birleştir.
 * strateji 'merge': anahtar çakışmasında en güncel (guncelleme) kazanır.
 * strateji 'replace': tüm depo, içe aktarılan liste ile DEĞİŞTİRİLİR.
 */
export async function importNotes(
  incoming: Note[],
  strategy: 'merge' | 'replace' = 'merge'
): Promise<NoteStore> {
  if (strategy === 'replace') {
    const cleaned = validateStore({ version: STORE_VERSION, notlar: incoming });
    return writeRaw(cleaned);
  }
  const mevcut = await loadNotes();
  const merged = validateStore({
    version: STORE_VERSION,
    notlar: [...incoming, ...mevcut.notlar],
  });
  return writeRaw(merged);
}
