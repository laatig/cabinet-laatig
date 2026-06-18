import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDate } from '../lib/utils';
import api from '../lib/api';
import { Download, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { Anomaly } from '../types';

export default function AuditReportPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [project, setProject] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}/anomalies`).then((r) => setAnomalies(r.data.anomalies || [])).catch(() => {}),
      api.get(`/projects/${id}`).then((r) => setProject(r.data.project || r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');
  const highAnomalies = anomalies.filter((a) => a.severity === 'high');
  const mediumAnomalies = anomalies.filter((a) => a.severity === 'medium');
  const acceptedCount = anomalies.filter((a) => a.status === 'accepted').length;
  const rejectedCount = anomalies.filter((a) => a.status === 'rejected').length;
  const openCount = anomalies.filter((a) => a.status === 'open').length;

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/projects/${id}/reports/generate/audit-report`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-audit-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      const res = await api.get(`/projects/${id}/anomalies`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-audit-${id}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    setGenerating(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('audit.title', lang)}</div>
            <div className="page-subtitle">
              {t('audit.generated', lang)} : {formatDate(new Date().toISOString())}
              {project?.clientName && ` · ${project.clientName}`}
            </div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline" onClick={handleDownloadPdf} disabled={generating}>
            <Download size={16} />             {generating ? t('export.generating', lang) : t('common.download', lang)}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : (
        <div className="panel" style={{ padding: 28 }}>
          <div className="audit-opinion" style={{ marginBottom: 28, padding: 20, background: 'rgba(201,168,76,0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(201,168,76,0.12)' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--cl-gold)' }}>{t('audit.opinion', lang)}</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--cl-text-secondary)' }}>
              {t('audit.opinionText', lang)}
            </p>
          </div>

          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 28 }}>
            <div className="kpi-card">
              <div className="kpi-value" style={{ color: '#FF6B6B' }}>{criticalAnomalies.length + highAnomalies.length}</div>
              <div className="kpi-label">{t('audit.keyQuestions', lang)}</div>
            </div>
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
          </div>

          <div className="audit-section" style={{ marginBottom: 24 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} /> {t('audit.scope', lang)}
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--cl-text-secondary)' }}>
              {t('audit.scopeText', lang)}
            </p>
            {project && (
              <div style={{ fontSize: 13, color: 'var(--cl-text-muted)', marginTop: 8 }}>
                {t('project.auditType', lang)} — Exercice {project.fiscalYearStart ? new Date(project.fiscalYearStart).getFullYear() : ''}
              </div>
            )}
          </div>

          <div className="audit-section" style={{ marginBottom: 24 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} style={{ color: 'var(--cl-warning)' }} /> {t('audit.keyQuestions', lang)}
            </h3>
            {criticalAnomalies.length === 0 && highAnomalies.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--cl-text-muted)' }}>{t('anomaly.none', lang)}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {criticalAnomalies.map((a, idx) => (
                  <div key={a.id} className="anomaly-item" style={{ borderLeft: '3px solid #FF6B6B' }}>
                    <div className="anomaly-content">
                      <div className="anomaly-header">
                        <span className="anomaly-type" style={{ color: '#FF6B6B' }}>CRITIQUE · {a.type}</span>
                      </div>
                      <div className="anomaly-desc">{a.description}</div>
                      {a.transaction && (
                        <div className="anomaly-meta">{a.transaction.vendorName} · {a.transaction.documentNumber} · {a.transaction.totalAmount} {a.transaction.currency}</div>
                      )}
                    </div>
                  </div>
                ))}
                {highAnomalies.map((a, idx) => (
                  <div key={a.id} className="anomaly-item" style={{ borderLeft: '3px solid var(--cl-warning)' }}>
                    <div className="anomaly-content">
                      <div className="anomaly-header">
                        <span className="anomaly-type" style={{ color: 'var(--cl-warning)' }}>ÉLEVÉ · {a.type}</span>
                      </div>
                      <div className="anomaly-desc">{a.description}</div>
                      {a.transaction && (
                        <div className="anomaly-meta">{a.transaction.vendorName} · {a.transaction.documentNumber}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {mediumAnomalies.length > 0 && (
            <div className="audit-section" style={{ marginBottom: 24 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                <AlertTriangle size={16} /> Observations supplémentaires ({mediumAnomalies.length})
              </h3>
              <div style={{ fontSize: 13, color: 'var(--cl-text-secondary)' }}>
                {mediumAnomalies.map((a) => a.description).join('; ')}
              </div>
            </div>
          )}

          <div className="audit-section" style={{ marginBottom: 24 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} style={{ color: 'var(--cl-success)' }} /> {t('audit.recommendations', lang)}
            </h3>
            {acceptedCount === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--cl-text-muted)' }}>Aucune recommandation formulée.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {anomalies.filter((a) => a.status === 'accepted').map((a, idx) => (
                  <div key={a.id} style={{ display: 'flex', gap: 8, fontSize: 14, color: 'var(--cl-text-secondary)' }}>
                    <span style={{ color: 'var(--cl-gold)', fontWeight: 600, minWidth: 24 }}>{idx + 1}.</span>
                    <div>
                      <strong>{a.type}</strong> : {a.description}
                      {a.explanation && <div style={{ fontSize: 12, color: 'var(--cl-text-muted)', marginTop: 2 }}>Plan d'action : {a.explanation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="audit-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={18} /> {t('audit.conclusions', lang)}
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--cl-text-secondary)' }}>
              {t('audit.conclusionsText', lang)}
              {anomalies.length > 0 && ` Au total, ${anomalies.length} anomalies ont été identifiées dont ${criticalAnomalies.length + highAnomalies.length} de niveau élevé.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
