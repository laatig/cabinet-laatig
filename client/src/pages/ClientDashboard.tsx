import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDateTime } from '../lib/utils';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Project, Notification } from '../types';

const dossierLabels: Record<string, { label: string; color: string }> = {
  DOCUMENTS_RECEIVED: { label: 'Documents reçus', color: 'info' },
  EXTRACTION_IN_PROGRESS: { label: 'Extraction en cours', color: 'processing' },
  AI_ANALYSIS: { label: 'Analyse IA terminée', color: 'processing' },
  IN_REVIEW: { label: 'En révision', color: 'pending' },
  AWAITING_CLIENT_CORRECTION: { label: 'Correction demandée', color: 'anomaly' },
  VALIDATED: { label: 'Validé', color: 'verified' },
  SIGNED: { label: 'Signé', color: 'completed' },
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/client/dashboard'),
      api.get('/client/notifications'),
    ]).then(([pRes, nRes]) => {
      setProjects(pRes.data.projects);
      setNotifications(nRes.data.notifications);
    }).catch(() => setError(t('common.error', lang))).finally(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="gold-spinner" />
    </div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('project.list', lang)}</h1>
          <p className="page-subtitle">{t('login.welcome', lang)}, {user?.fullName}</p>
        </div>
        <div className="page-gold-rule" />
      </div>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      <div className="dashboard-kpis" style={{ marginBottom: 32 }}>
        <div className="kpi-card">
          <div className="kpi-value">{projects.length}</div>
          <div className="kpi-label">{t('nav.projects', lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{projects.filter(p => p.dossierStatus === 'SIGNED').length}</div>
          <div className="kpi-label">Signés</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{projects.filter(p => p.dossierStatus === 'AWAITING_CLIENT_CORRECTION').length}</div>
          <div className="kpi-label">Corrections</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{notifications.filter(n => !n.isRead).length}</div>
          <div className="kpi-label">{t('nav.notifications', lang)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--cl-gold)' }}>
            {t('nav.projects', lang)}
          </h2>
          {projects.length === 0 ? (
            <div className="empty-state">
              <p>{t('clients.empty', lang)}</p>
              <p style={{ marginTop: 8, color: 'var(--cl-text-secondary)' }}>
                Votre dossier sera créé par votre expert-comptable.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map(p => {
                const ds = dossierLabels[p.dossierStatus] || { label: p.dossierStatus, color: 'pending' };
                return (
                  <Link to={`/client/projects/${p.id}`} key={p.id} className="data-row" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', borderRadius: 'var(--radius-md)',
                    background: 'var(--cl-navy-card)', textDecoration: 'none', color: 'inherit',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.clientName}</div>
                      <div style={{ fontSize: 13, color: 'var(--cl-text-secondary)', marginTop: 4 }}>
                        Exercice {new Date(p.fiscalYearStart).getFullYear()} - {new Date(p.fiscalYearEnd).getFullYear()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`status-badge ${ds.color}`}>{ds.label}</span>
                      <div style={{ fontSize: 12, color: 'var(--cl-text-muted)', marginTop: 4 }}>
                        {p._count?.documents || 0} {t('nav.documents', lang)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--cl-gold)' }}>
            {t('notif.title', lang)}
          </h2>
          {notifications.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 14 }}>{t('notif.empty', lang)}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.slice(0, 10).map(n => (
                <div key={n.id} className="data-row" style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: n.isRead ? 'transparent' : 'var(--cl-navy-card)',
                  borderLeft: n.isRead ? 'none' : '3px solid var(--cl-gold)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--cl-text-muted)', marginTop: 4 }}>
                    {formatDateTime(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
