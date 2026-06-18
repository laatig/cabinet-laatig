import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatCurrency, formatDateTime } from '../lib/utils';
import KpiCard from '../components/ui/KpiCard';
import api from '../lib/api';
import {
  FolderOpen,
  CheckCircle,
  ArrowLeftRight,
  AlertTriangle,
  Receipt,
  Plus,
  Eye,
} from 'lucide-react';
import type { Project, AuditLog } from '../types';

export default function DashboardPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects').then((r) => setProjects(r.data.projects || [])).catch(() => {}),
      api.get('/audit-logs?limit=10').then((r) => setLogs(r.data.logs || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'REVIEW');
  const anomalyCount = projects.reduce((sum, p) => sum + (p._count?.anomalies || 0), 0);
  const totalTva = 45230.50;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('dashboard.title', lang)}</div>
        <div className="page-subtitle">{t('dashboard.hero', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : (
        <>
          <div className="kpi-grid">
            <KpiCard
              label={t('project.total', lang)}
              value={String(projects.length)}
              icon={<FolderOpen />}
            />
            <KpiCard
              label={t('project.active', lang)}
              value={String(activeProjects.length)}
              icon={<CheckCircle />}
            />
            <KpiCard
              label={t('project.transactionsMonth', lang)}
              value="1 234"
              sub="Ce mois-ci"
              icon={<ArrowLeftRight />}
            />
            <KpiCard
              label={t('project.anomaliesOpen', lang)}
              value={String(anomalyCount)}
              sub="Non résolues"
              icon={<AlertTriangle />}
            />
            <KpiCard
              label={t('project.tvaDue', lang)}
              value={formatCurrency(totalTva)}
              sub="Ce trimestre"
              icon={<Receipt />}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('dashboard.recentActivity', lang)}</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                {logs.length === 0 ? (
                  <div className="empty-state" style={{ padding: 32 }}>
                    <Eye size={40} />
                    <div className="empty-state-title" style={{ fontSize: 16 }}>Aucune activité</div>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="audit-trail-item" style={{ padding: '12px 20px' }}>
                      <div className="audit-trail-icon">
                        <CheckCircle size={14} />
                      </div>
                      <div className="audit-trail-content">
                        <div className="audit-trail-action">{log.action}</div>
                        <div className="audit-trail-detail">{log.details}</div>
                        <div className="audit-trail-time">{formatDateTime(log.timestamp)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{t('dashboard.quickActions', lang)}</span>
              </div>
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-primary" onClick={() => navigate('/projects')}>
                  <Plus size={16} /> {t('project.create', lang)}
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/projects')}>
                  <FolderOpen size={16} /> {t('nav.projects', lang)}
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/audit-trail')}>
                  <Eye size={16} /> {t('nav.audit-trail', lang)}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
