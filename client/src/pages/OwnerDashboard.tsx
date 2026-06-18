import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import api from '../lib/api';
import MiniChart from '../components/ui/MiniChart';
import type { DashboardStats } from '../types';

export default function OwnerDashboard() {
  const { lang } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/owner/dashboard'),
      api.get('/owner/validation-queue'),
    ]).then(([sRes, qRes]) => {
      setStats(sRes.data);
      setQueue(qRes.data.documents);
    }).catch(() => setError(t('common.error', lang))).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/owner/documents/${id}/approve`);
      setQueue(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    const comment = prompt(t('common.error', lang));
    if (!comment) return;
    try {
      await api.post(`/owner/documents/${id}/reject`, { comment });
      setQueue(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="gold-spinner" />
    </div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.title', lang)}</h1>
          <p className="page-subtitle">{t('nav.main', lang)}</p>
        </div>
        <div className="page-gold-rule" />
      </div>

      <div className="dashboard-kpis" style={{ marginBottom: 32 }}>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.totalClients || 0}</div>
          <div className="kpi-label">{t('clients.title', lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.totalProjects || 0}</div>
          <div className="kpi-label">{t('nav.projects', lang)}</div>
        </div>
        <div className="kpi-card" style={{ borderColor: queue.length > 0 ? 'var(--cl-gold)' : undefined }}>
          <div className="kpi-value">{stats?.pendingReviews || 0}</div>
          <div className="kpi-label">{t('project.revision', lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.signedProjects || 0}</div>
          <div className="kpi-label">{t('project.validate', lang)}</div>
        </div>
      </div>

      {stats?.monthlyLabels && (
        <div className="section-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--cl-gold)' }}>
            {t('dashboard.title', lang)}
          </h2>
          <MiniChart
            data={stats.monthlyLabels.map((label: string, i: number) => ({
              label,
              value: stats.monthlyCounts[i] || 0,
            }))}
            height={120}
          />
        </div>
      )}

      <div className="section-card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--cl-gold)' }}>
          {t('nav.documents', lang)} ({queue.length})
        </h2>
        {queue.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 14 }}>{t('table.noData', lang)}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {queue.map((doc: any) => (
              <div key={doc.id} className="data-row" style={{
                padding: 16, borderRadius: 'var(--radius-md)',
                background: 'var(--cl-navy-card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{doc.fileName}</div>
                    <div style={{ fontSize: 13, color: 'var(--cl-text-secondary)', marginTop: 4 }}>
                      Client : {doc.project?.user?.fullName || doc.project?.clientName} —
                      Catégorie : {doc.category} — v{doc.version}
                    </div>
                    {doc.extractions?.[0] && (
                      <div style={{ fontSize: 13, color: 'var(--cl-info)', marginTop: 4 }}>
                        Confiance IA : {(doc.extractions[0].confidence * 100).toFixed(0)}% —
                        {doc.extractions[0].fields.length} champs extraits
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/review/${doc.id}`} className="table-action-btn" style={{ textDecoration: 'none' }}>
                      {t('common.view', lang)}
                    </Link>
                    <button className="table-action-btn" style={{ color: 'var(--cl-success)' }}
                      onClick={() => handleApprove(doc.id)}>
                      {t('common.confirm', lang)}
                    </button>
                    <button className="table-action-btn" style={{ color: 'var(--cl-danger)' }}
                      onClick={() => handleReject(doc.id)}>
                      {t('common.delete', lang)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Link to="/owner/clients" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          {t('clients.title', lang)}
        </Link>
        <Link to="/owner/projects" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          {t('ownerProjects.title', lang)}
        </Link>
        <Link to="/owner/signatures" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          {t('signatures.title', lang)}
        </Link>
      </div>
    </div>
  );
}
