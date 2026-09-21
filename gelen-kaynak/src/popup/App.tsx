import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Note } from '../lib/types';
import type { Lang } from '../lib/i18n';
import { t } from '../lib/i18n';
import { loadNotes, saveNote, removeNote, normalizeUrl, hostOf, groupByHost, KOTA_UYARI_NOT } from '../lib/store';
import { loadSettings, saveSettings, GIZLEME_SECENEKLERI } from '../lib/settings';
import { activeTabUrl, activeTabId, hasPagePermission, requestPagePermission, pingContentScript } from '../lib/tabs';
import PermissionBanner from './components/PermissionBanner';
import AddNoteBox from './components/AddNoteBox';
import NoteList from './components/NoteList';
import BackupPanel from './components/BackupPanel';

export default function App() {
  const [lang, setLang] = useState<Lang>('tr');
  const [notlar, setNotlar] = useState<Note[]>([]);
  const [currentKey, setCurrentKey] = useState('');
  const [permVar, setPermVar] = useState<boolean | null>(null);
  const [canli, setCanli] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [gizlemeSaat, setGizlemeSaat] = useState<number>(1);
  const [status, setStatus] = useState<{ msg: string; err: boolean }>({ msg: '', err: false });
  const [addOpen, setAddOpen] = useState(false);

  const say = (msg: string, err = false) => setStatus({ msg, err });

  const refresh = useCallback(async () => {
    const [store, settings, url, izin] = await Promise.all([
      loadNotes(),
      loadSettings(),
      activeTabUrl(),
      hasPagePermission(),
    ]);
    setNotlar(store.notlar);
    if (store.recovered) say(t(settings.lang, 'recovered'));
    setLang(settings.lang);
    setOnlyActive(settings.onlyActive);
    setGizlemeSaat(settings.gizlemeSaat);
    setCurrentKey(normalizeUrl(url));
    setPermVar(izin);

    const tabId = await activeTabId();
    if (tabId != null) {
      const reply = await pingContentScript(tabId, 'webnot-yenile');
      setCanli(!!reply);
    } else {
      setCanli(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const currentHost = hostOf(currentKey);

  const filtered = useMemo(() => {
    let liste = notlar;
    if (onlyActive && currentHost) liste = liste.filter((k) => (k.host || hostOf(k.anahtar)) === currentHost);
    const q = search.trim().toLocaleLowerCase(lang === 'tr' ? 'tr' : 'en');
    if (q) liste = liste.filter((k) => k.anahtar.toLowerCase().includes(q) || k.metin.toLowerCase().includes(q));
    return liste;
  }, [notlar, onlyActive, currentHost, search, lang]);

  const grouped = useMemo(() => groupByHost(filtered), [filtered]);

  async function onSave(metin: string) {
    if (!metin.trim()) {
      say(t(lang, 'required'), true);
      return;
    }
    if (!currentKey) {
      say(t(lang, 'noPage'), true);
      return;
    }
    try {
      await saveNote({ url: currentKey, metin });
      setAddOpen(false);
      await refresh();
      say(t(lang, 'saved'));
    } catch {
      say(t(lang, 'saveError'), true);
    }
  }

  async function onEditSave(anahtar: string, metin: string) {
    if (!metin.trim()) {
      say(t(lang, 'required'), true);
      return;
    }
    try {
      await saveNote({ url: anahtar, metin });
      await refresh();
      say(t(lang, 'saved'));
    } catch {
      say(t(lang, 'saveError'), true);
    }
  }

  async function onDelete(anahtar: string) {
    try {
      await removeNote(anahtar);
      await refresh();
      say(t(lang, 'deleted'));
    } catch {
      say(t(lang, 'saveError'), true);
    }
  }

  function onOpen(anahtar: string) {
    chrome.tabs.create({ url: `https://${anahtar}` });
  }

  async function onGrantPermission() {
    const ok = await requestPagePermission();
    if (!ok) {
      say(lang === 'tr' ? 'İzin verilmedi.' : 'Permission not granted.', true);
      return;
    }
    await refresh();
    say(t(lang, 'permOk'));
  }

  async function onLangChange(next: Lang) {
    setLang(next);
    await saveSettings({ lang: next });
  }

  async function onOnlyActiveChange(v: boolean) {
    setOnlyActive(v);
    await saveSettings({ onlyActive: v });
  }

  async function onGizlemeChange(saat: number) {
    setGizlemeSaat(saat);
    await saveSettings({ gizlemeSaat: saat as 1 | 4 | 24 | 168 });
  }

  const mevcutNot = notlar.find((x) => x.anahtar === currentKey) ?? null;
  const toplam = notlar.length;

  return (
    <div className="wn-shell">
      <div className="wn-header">
        <h1 className="wn-title">{t(lang, 'title')}</h1>
        <div className="wn-lang" role="group" aria-label={t(lang, 'langLabel')}>
          <button type="button" aria-pressed={lang === 'tr'} onClick={() => onLangChange('tr')}>TR</button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => onLangChange('en')}>EN</button>
        </div>
      </div>

      {permVar === false && <PermissionBanner lang={lang} onGrant={onGrantPermission} />}

      <div className="wn-card">
        <div className="wn-row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="wn-btn wn-btn--primary" onClick={() => setAddOpen((v) => !v)}>
            {t(lang, 'add')}
          </button>
          <span className="wn-current" title={currentKey}>
            {currentKey ? `${t(lang, 'thisPage')}: ${currentKey}` : t(lang, 'noPage')}
          </span>
        </div>
        {addOpen && (
          <AddNoteBox
            lang={lang}
            initialText={mevcutNot?.metin ?? ''}
            onSave={onSave}
            onCancel={() => setAddOpen(false)}
          />
        )}
        {permVar === true && canli !== null && (
          <p className="wn-perm-banner" style={{ marginTop: 8 }}>
            {canli ? t(lang, 'liveOk') : t(lang, 'liveNo')}
          </p>
        )}
      </div>

      <div className="wn-card">
        <div className="wn-checkbox-row">
          <input
            type="checkbox"
            id="wn-onlyactive"
            checked={onlyActive}
            onChange={(e) => onOnlyActiveChange(e.target.checked)}
          />
          <label htmlFor="wn-onlyactive">{t(lang, 'onlyActive')}</label>
        </div>
        <input
          className="wn-input"
          style={{ marginTop: 8 }}
          type="search"
          placeholder={t(lang, 'searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {toplam >= KOTA_UYARI_NOT && !search.trim() && (
          <p className="wn-pile-notice">{t(lang, 'pile', { n: toplam })}</p>
        )}
        <NoteList
          lang={lang}
          groups={grouped}
          empty={
            toplam === 0
              ? t(lang, 'empty')
              : onlyActive && currentHost && filtered.length === 0 && !search.trim()
                ? t(lang, 'emptySite')
                : search.trim() && filtered.length === 0
                  ? t(lang, 'emptySearch', { q: search.trim() })
                  : ''
          }
          onEditSave={onEditSave}
          onDelete={onDelete}
          onOpen={onOpen}
        />
      </div>

      <details className="wn-details">
        <summary>{t(lang, 'settings')}</summary>
        <div className="wn-row" style={{ marginTop: 4 }}>
          <label htmlFor="wn-gizleme">{t(lang, 'hideDuration')}</label>
          <select
            id="wn-gizleme"
            className="wn-input"
            value={gizlemeSaat}
            onChange={(e) => onGizlemeChange(Number(e.target.value))}
          >
            {GIZLEME_SECENEKLERI.map((saat) => (
              <option key={saat} value={saat}>
                {t(lang, `h${saat}`)}
              </option>
            ))}
          </select>
        </div>
      </details>

      <BackupPanel lang={lang} onImported={refresh} onStatus={say} />

      <p className="wn-status" data-err={status.err}>
        {status.msg}
      </p>
    </div>
  );
}
