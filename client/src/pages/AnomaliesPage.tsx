import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatCurrency, formatDateTime } from '../lib/utils';
import RiskBadge from '../components/ui/RiskBadge';
import api from '../lib/api';
import {
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Info,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import type { Anomaly } from '../types';

const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertOctagon,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

export default function AnomaliesPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchAnomalies = () => {
    api.get(`/projects/${id}/anomalies`)
      .then((r) => setAnomalies(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnomalies(); }, [id]);

  const openCount = anomalies.filter((a) => a.status === 'open').length;
  const acceptedCount = anomalies.filter((a) => a.status === 'accepted').length;
  const rejectedCount = anomalies.filter((a) => a.status === 'rejected').length;

  const filtered = filter === 'all' ? anomalies : filter === 'critical' ? anomalies.filter((a) => a.severity === 'critical') : anomalies.filter((a) => a.status === filter);

  const handleAction = async (anomalyId: number, action: string) => {
    await api.post(`/anomalies/${anomalyId}/${action}`);
    fetchAnomalies();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('nav.anomalies', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--cl-warning)' }}>{openCount}</div>
          <div className="kpi-label">{t('anomaly.ouvertes', lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: 'var(--cl-success)' }}>{acceptedCount}</div>
          <div className="kpi-label">{t('anomaly.acceptees', lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: '#FF6B6B' }}>{rejectedCount}</div>
          <div className="kpi-label">{t('anomaly.rejetees', lang)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{anomalies.length}</div>
          <div className="kpi-label">Total</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
          <button
            key={sev}
            className={`btn btn-sm ${filter === sev ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(sev)}
          >
            {sev === 'all' ? t('anomaly.all', lang) : t(`anomaly.${sev}`, lang)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <AlertTriangle size={48} />
          <div className="empty-state-title">{t('anomaly.none', lang)}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((a) => {
            const SevIcon = severityIcons[a.severity] || AlertTriangle;
            return (
              <div key={a.id} className="anomaly-item">
                <div className={`anomaly-severity ${a.severity}`}>
                  <SevIcon size={14} />
                </div>
                <div className="anomaly-content">
                  <div className="anomaly-header">
                    <span className="anomaly-type">{a.type}</span>
                    <RiskBadge score={a.severity === 'critical' ? 90 : a.severity === 'high' ? 70 : a.severity === 'medium' ? 40 : 10} />
                    <span className={`status-pill ${a.status === 'open' ? 'pending' : a.status === 'accepted' ? 'verified' : 'rejected'}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="anomaly-desc">{a.description}</div>
                  <div className="anomaly-meta">
                    {a.transaction && (
                      <>
                        <span>{a.transaction.vendorName}</span>
                        <span>{formatCurrency(a.transaction.amount)}</span>
                      </>
                    )}
                    <span>{formatDateTime(a.detectedAt)}</span>
                  </div>
                  <div className="anomaly-actions">
                    {a.status === 'open' && (
                      <>
                        <button className="btn btn-sm btn-outline" onClick={() => handleAction(a.id, 'accept')}>
                          <Check size={14} /> {t('anomaly.accept', lang)}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleAction(a.id, 'reject')}>
                          <X size={14} /> {t('anomaly.reject', lang)}
                        </button>
                      </>
                    )}
                    <button className="btn btn-sm btn-ghost">
                      <MessageSquare size={14} /> {t('anomaly.comment', lang)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
