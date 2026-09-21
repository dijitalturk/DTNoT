import { useState } from 'react';
import type { Note } from '../../lib/types';
import { t, type Lang } from '../../lib/i18n';
import { yolOf } from '../../lib/store';

export default function NoteRow({
  lang,
  note,
  onEditSave,
  onDelete,
  onOpen,
}: {
  lang: Lang;
  note: Note;
  onEditSave: (anahtar: string, metin: string) => void;
  onDelete: (anahtar: string) => void;
  onOpen: (anahtar: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [value, setValue] = useState(note.metin);

  const yol = yolOf(note.anahtar);
  const yolLabel = yol === '/' ? t(lang, 'home') : yol;
  const zamanLabel = note.guncelleme > note.olusturma ? t(lang, 'updated') : t(lang, 'created');
  const zaman = new Date(note.guncelleme || note.olusturma).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');

  if (editing) {
    return (
      <li className="wn-note-row">
        <textarea
          className="wn-input"
          rows={3}
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              onEditSave(note.anahtar, value);
              setEditing(false);
            }
          }}
        />
        <div className="wn-row" style={{ marginTop: 6 }}>
          <button
            type="button"
            className="wn-btn wn-btn--primary"
            onClick={() => {
              onEditSave(note.anahtar, value);
              setEditing(false);
            }}
          >
            {t(lang, 'save')}
          </button>
          <button type="button" className="wn-btn" onClick={() => setEditing(false)}>
            {t(lang, 'cancel')}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="wn-note-row">
      <div className="wn-note-top">
        <button type="button" className="wn-note-path" title={t(lang, 'open')} onClick={() => onOpen(note.anahtar)}>
          {yolLabel}
        </button>
        {confirmingDelete ? (
          <div className="wn-row">
            <span style={{ fontSize: 12 }}>{t(lang, 'deleteConfirm')}</span>
            <button type="button" className="wn-btn wn-btn--danger" onClick={() => onDelete(note.anahtar)}>
              {t(lang, 'deleteYes')}
            </button>
            <button type="button" className="wn-btn" onClick={() => setConfirmingDelete(false)}>
              {t(lang, 'deleteNo')}
            </button>
          </div>
        ) : (
          <div className="wn-note-actions">
            <button type="button" className="wn-icon" title={t(lang, 'edit')} onClick={() => setEditing(true)}>
              ✏️
            </button>
            <button type="button" className="wn-icon" title={t(lang, 'delete')} onClick={() => setConfirmingDelete(true)}>
              −
            </button>
          </div>
        )}
      </div>
      <div className="wn-note-text">{note.metin}</div>
      <div className="wn-current" title={zamanLabel} style={{ marginTop: 4 }}>
        {zamanLabel}: {zaman}
      </div>
    </li>
  );
}
