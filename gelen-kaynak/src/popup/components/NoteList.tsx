import type { Note } from '../../lib/types';
import { type Lang } from '../../lib/i18n';
import NoteRow from './NoteRow';

export default function NoteList({
  lang,
  groups,
  empty,
  onEditSave,
  onDelete,
  onOpen,
}: {
  lang: Lang;
  groups: { host: string; notlar: Note[] }[];
  empty: string;
  onEditSave: (anahtar: string, metin: string) => void;
  onDelete: (anahtar: string) => void;
  onOpen: (anahtar: string) => void;
}) {
  if (empty) return <p className="wn-empty">{empty}</p>;

  return (
    <div style={{ marginTop: 8 }}>
      {groups.map((g) => (
        <div className="wn-host-group" key={g.host}>
          <div className="wn-host-head">
            <span>{g.host}</span>
            <span className="wn-host-count">({g.notlar.length})</span>
          </div>
          <ul className="wn-list">
            {g.notlar.map((k) => (
              <NoteRow key={k.anahtar} lang={lang} note={k} onEditSave={onEditSave} onDelete={onDelete} onOpen={onOpen} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
