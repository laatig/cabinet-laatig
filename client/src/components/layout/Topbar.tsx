import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/translations';
import NotificationBell from '../notifications/NotificationBell';
import { Menu } from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
}

const breadcrumbMap: Record<string, string> = {
  '': 'nav.dashboard',
  'projects': 'nav.projects',
  'documents': 'nav.documents',
  'transactions': 'nav.transactions',
  'anomalies': 'nav.anomalies',
  'bilan': 'nav.bilan',
  'cpc': 'nav.cpc',
  'journal': 'nav.journal',
  'grand-livre': 'nav.grand-livre',
  'balance': 'nav.balance',
  'tva': 'nav.tva',
  'audit-report': 'nav.audit-report',
  'synthese': 'nav.synthese',
  'cahier-travail': 'nav.cahier-travail',
  'export': 'nav.export',
  'audit-trail': 'nav.audit-trail',
  'settings': 'nav.settings',
  'about': 'nav.about',
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const location = useLocation();
  const { lang, setLang } = useLanguage();

  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [{ label: 'nav.dashboard', path: '/' }];

  let currentPath = '';
  for (const seg of segments) {
    if (/^\d+$/.test(seg)) {
      crumbs.push({ label: `#${seg}`, path: currentPath + '/' + seg });
      currentPath += '/' + seg;
      continue;
    }
    currentPath += '/' + seg;
    const key = breadcrumbMap[seg] || seg;
    crumbs.push({ label: key, path: currentPath });
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="breadcrumb">
          {crumbs.map((crumb, idx) => (
            <span key={crumb.path}>
              {idx > 0 && <span className="breadcrumb-sep">/</span>}
              {idx === crumbs.length - 1 ? (
                <span className="current">{t(crumb.label, lang)}</span>
              ) : (
                <Link to={crumb.path}>{t(crumb.label, lang)}</Link>
              )}
            </span>
          ))}
        </div>
      </div>
      <div className="topbar-right">
        <button className="lang-toggle" onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}>
          {lang === 'fr' ? 'ع' : 'FR'}
        </button>
        <NotificationBell />
      </div>
    </header>
  );
}
