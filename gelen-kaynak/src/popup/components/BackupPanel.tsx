import { useRef, useState } from 'react';
import { t, type Lang } from '../../lib/i18n';
import { downloadNotesJSON, importNotesFromFile } from '../../lib/backup';

export default function BackupPanel({
  lang,
  onImported,
  onStatus,
}: {
  lang: Lang;
  onImported: () => void;
  onStatus: (msg: string, err?: boolean) => void;
}) {
  const [strategy, setStrategy] = useState<'merge' | 'replace'>('merge');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      await downloadNotesJSON();
    } catch {
      onStatus(t(lang, 'saveError'), true);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const n = await importNotesFromFile(file, strategy);
      onImported();
      onStatus(t(lang, 'importOk', { n }));
    } catch {
      onStatus(t(lang, 'importError'), true);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <details className="wn-details">
      <summary>{t(lang, 'exportTitle')} / {t(lang, 'importTitle')}</summary>
      <div style={{ marginTop: 6 }}>
        <button type="button" className="wn-btn" onClick={handleExport}>
          {t(lang, 'exportButton')}
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <div className="wn-row">
          <label style={{ fontSize: 12.5 }}>
            <input
              type="radio"
              name="wn-import-strategy"
              checked={strategy === 'merge'}
              onChange={() => setStrategy('merge')}
            />{' '}
            {t(lang, 'importMerge')}
          </label>
        </div>
        <div className="wn-row" style={{ marginTop: 4 }}>
          <label style={{ fontSize: 12.5 }}>
            <input
              type="radio"
              name="wn-import-strategy"
              checked={strategy === 'replace'}
              onChange={() => setStrategy('replace')}
            />{' '}
            {t(lang, 'importReplace')}
          </label>
        </div>
        <button type="button" className="wn-btn" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()}>
          {t(lang, 'importButton')}
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleFile} />
      </div>
    </details>
  );
}
