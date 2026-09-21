import { t, type Lang } from '../../lib/i18n';

export default function PermissionBanner({ lang, onGrant }: { lang: Lang; onGrant: () => void }) {
  return (
    <div className="wn-card">
      <p className="wn-perm-banner">{t(lang, 'permHelp')}</p>
      <button type="button" className="wn-btn wn-btn--primary" onClick={onGrant} style={{ marginTop: 6 }}>
        {t(lang, 'permButton')}
      </button>
    </div>
  );
}
