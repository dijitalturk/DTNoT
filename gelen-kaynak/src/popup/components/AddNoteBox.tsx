import { useState } from 'react';
import { t, type Lang } from '../../lib/i18n';

export default function AddNoteBox({
  lang,
  initialText,
  onSave,
  onCancel,
}: {
  lang: Lang;
  initialText: string;
  onSave: (metin: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialText);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave(value);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        className="wn-input"
        rows={3}
        placeholder={t(lang, 'addPlaceholder')}
        aria-label={t(lang, 'addPlaceholder')}
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="wn-row" style={{ marginTop: 6 }}>
        <button type="button" className="wn-btn wn-btn--primary" onClick={() => onSave(value)}>
          {t(lang, 'save')}
        </button>
        <button type="button" className="wn-btn" onClick={onCancel}>
          {t(lang, 'cancel')}
        </button>
      </div>
    </div>
  );
}
