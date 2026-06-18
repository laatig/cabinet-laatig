import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { getStatusClass, formatDate } from '../lib/utils';
import api from '../lib/api';
import { FolderOpen, Search, User, ChevronRight } from 'lucide-react';
import type { Project } from '../types';

export default function OwnerProjectsPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const clientFilter = searchParams.get('clientId');

  useEffect(() => {
    api.get('/owner/projects')
      .then((r) => setProjects(r.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    if (clientFilter && p.user?.id !== clientFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.clientName?.toLowerCase().includes(q) ||
      p.user?.fullName?.toLowerCase().includes(q) ||
      p.auditType?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('ownerProjects.title', lang)}</div>
            {clientFilter && (
              <div className="page-subtitle">Filtré par client</div>
            )}
            <div className="page-gold-rule" />
          </div>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('table.search', lang)}
          />
        </div>
        <span style={{ fontSize: 12, color: 'var(--cl-text-muted)' }}>
          {filtered.length} projet{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={48} />
          <div className="empty-state-title">{t('ownerProjects.empty', lang)}</div>
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((p) => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-card-title">{p.clientName || `Projet #${p.id}`}</div>
              {p.user && (
                <div className="project-card-client" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={12} /> {p.user.fullName}
                </div>
              )}
              <div className="project-card-meta">
                <span className="project-card-attr">
                  {p.fiscalYearStart ? new Date(p.fiscalYearStart).getFullYear() : ''}
                </span>
                <span className="project-card-attr">
                  {p.auditType === 'legal_audit' ? 'Audit Légal' : p.auditType}
                </span>
                <span className={`status-pill ${getStatusClass(p.status)}`}>{p.status}</span>
                <span className={`status-pill ${getStatusClass(p.dossierStatus)}`}>{p.dossierStatus}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--cl-text-muted)' }}>
                <span>{p._count?.documents || 0} doc.</span>
                <span>{p._count?.transactions || 0} trans.</span>
                <span>{p._count?.anomalies || 0} anom.</span>
              </div>
              <ChevronRight size={16} style={{ position: 'absolute', right: 16, top: '50%', marginTop: -8, color: 'var(--cl-text-muted)' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
