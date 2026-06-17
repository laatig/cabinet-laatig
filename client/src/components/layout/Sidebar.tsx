import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { t } from '../../lib/translations';
import { getInitials } from '../../lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  ArrowLeftRight,
  AlertTriangle,
  ScrollText,
  BarChart3,
  BookOpen,
  BookText,
  Scale,
  Receipt,
  FileSearch,
  FileCheck,
  ClipboardList,
  Download,
  History,
  Settings,
  Info,
  Bell,
  LogOut,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lang } = useLanguage();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyIcon = any;

  interface NavItemDef {
    path: string;
    label: string;
    icon: AnyIcon;
    exact?: boolean;
    needsProject?: boolean;
    badge?: boolean;
  }

  const isOwner = user?.role === 'OWNER';

  const navItems: { section: string; items: NavItemDef[] }[] = isOwner ? [
    { section: 'nav.main', items: [
      { path: '/owner', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
      { path: '/owner/clients', label: 'Clients', icon: FolderOpen },
      { path: '/owner/projects', label: 'Dossiers', icon: FileText },
      { path: '/owner/signatures', label: 'Signatures', icon: FileCheck },
    ]},
    { section: 'ÉTATS FINANCIERS', items: [
      { path: '/projects', label: 'nav.projects', icon: FolderOpen },
    ]},
    { section: 'nav.statements', items: [
      { path: '/projects', label: 'nav.transactions', icon: ArrowLeftRight, needsProject: true },
      { path: '/bilan', label: 'Bilan', icon: Scale, needsProject: true },
      { path: '/cpc', label: 'CPC', icon: Receipt, needsProject: true },
      { path: '/balance', label: 'Balance', icon: BookOpen, needsProject: true },
      { path: '/journal', label: 'Journal', icon: BookText, needsProject: true },
      { path: '/grand-livre', label: 'Grand Livre', icon: ScrollText, needsProject: true },
      { path: '/tva', label: 'TVA', icon: FileCheck, needsProject: true },
      { path: '/sig', label: 'SIG', icon: TrendingUp, needsProject: true },
      { path: '/liasse-fiscale', label: 'Liasse Fiscale', icon: FileText, needsProject: true },
    ]},
    { section: 'nav.audit', items: [
      { path: '/anomalies', label: 'nav.anomalies', icon: AlertTriangle, needsProject: true, badge: true },
      { path: '/audit-report', label: 'nav.audit-report', icon: FileSearch, needsProject: true },
      { path: '/synthese', label: 'nav.synthese', icon: FileCheck, needsProject: true },
      { path: '/cahier-travail', label: 'nav.cahier-travail', icon: ClipboardList, needsProject: true },
    ]},
    { section: 'nav.export-other', items: [
      { path: '/export', label: 'nav.export', icon: Download, needsProject: true },
      { path: '/audit-trail', label: 'nav.audit-trail', icon: History },
      { path: '/settings', label: 'nav.settings', icon: Settings },
      { path: '/about', label: 'nav.about', icon: Info },
    ]},
  ] : [
    { section: 'MON ESPACE', items: [
      { path: '/client', label: 'Mes dossiers', icon: LayoutDashboard, exact: true },
      { path: '/profile', label: 'Mon profil', icon: Settings },
    ]},
  ];

  const navigateTo = (item: NavItemDef) => {
    if (item.needsProject) {
      const match = location.pathname.match(/\/projects\/(\d+)/);
      if (match) {
        navigate(`/projects/${match[1]}${item.path}`);
      }
      return;
    }
    navigate(item.path);
    onCloseMobile();
  };

  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-logo">
        <div className="logo-icon">CL</div>
        {!collapsed && (
          <div>
            <div className="logo-wordmark">CABINET LAATIG</div>
            <div className="logo-tagline">Intelligence Artificielle • Expertise Humaine • Certification Marocaine</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((group) => (
          <div key={group.section}>
            {!collapsed && <div className="nav-section-label">{t(group.section, lang)}</div>}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.exact
                ? location.pathname === item.path
                : isActive(item.path);
              return (
                <div
                  key={item.path}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => navigateTo(item)}
                >
                  <Icon />
                  {!collapsed && <span>{t(item.label, lang)}</span>}
                  {!collapsed && item.badge && (
                    <span className="nav-badge">3</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">{user ? getInitials(user.fullName) : 'MA'}</div>
        {!collapsed && (
          <div className="user-info">
            <div className="user-name">{user?.fullName || 'Mustapha Atiq'}</div>
            <div className="user-title">{user?.role === 'OWNER' ? 'Expert-Comptable' : 'Client'}</div>
          </div>
        )}
        {!collapsed && (
          <button className="btn btn-ghost btn-sm" onClick={logout} title="Déconnexion">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
