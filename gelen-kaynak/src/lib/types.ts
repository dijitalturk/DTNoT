export interface Note {
  anahtar: string; // normalize URL key: host + pathname
  host: string;
  yol: string;
  metin: string;
  olusturma: number; // created (ms epoch)
  guncelleme: number; // updated (ms epoch)
  kucuk: boolean; // minimized state
  gizleUntil: number; // snoozed until (ms epoch), 0 = not snoozed
}

export interface NoteStore {
  version: number;
  notlar: Note[];
  recovered: boolean;
}

export interface Settings {
  lang: 'tr' | 'en';
  gizlemeSaat: 1 | 4 | 24 | 168;
  onlyActive: boolean;
}
