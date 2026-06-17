import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDate } from '../lib/utils';
import api from '../lib/api';
import { Download } from 'lucide-react';
import type { Anomaly } from '../types';

export default function AuditReportPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}/anomalies`).then((r) => setAnomalies(r.data.data || r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  const acceptedAnomalies = anomalies.filter((a) => a.status === 'accepted');
  const keyAuditQuestions = anomalies.filter((a) => a.severity === 'critical' || a.severity === 'high');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('audit.title', lang)}</div>
            <div className="page-subtitle">{t('audit.generated', lang)} : {formatDate(new Date().toISOString())}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline"><Download size={16} /> {t('common.download', lang)}</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : (
        <div className="panel" style={{ padding: 28 }}>
          <div className="audit-opinion">
            <h3>{t('audit.opinion', lang)}</h3>
            <p>{t('audit.opinionText', lang)}</p>
          </div>

          <div className="audit-section">
            <h3>{t('audit.scope', lang)}</h3>
            <p>{t('audit.scopeText', lang)}</p>
          </div>

          <div className="audit-section">
            <h3>{t('audit.keyQuestions', lang)}</h3>
            {keyAuditQuestions.length === 0 ? (
              <p>Aucun point clé d'audit identifié.</p>
            ) : (
              keyAuditQuestions.map((a, idx) => (
                <div key={a.id} className="anomaly-item" style={{ marginBottom: 10 }}>
                  <div className="anomaly-content">
                    <div className="anomaly-header">
                      <span className="anomaly-type">{idx + 1}. {a.type}</span>
                    </div>
                    <div className="anomaly-desc">{a.description}</div>
                    {a.transaction && (
                      <div className="anomaly-meta">
                        {a.transaction.vendorName} — {a.transaction.documentNumber}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="audit-section">
            <h3>{t('audit.recommendations', lang)}</h3>
            {acceptedAnomalies.length === 0 ? (
              <p>Aucune recommandation.</p>
            ) : (
              acceptedAnomalies.map((a, idx) => (
                <p key={a.id}>{idx + 1}. {a.type} : {a.description}</p>
              ))
            )}
          </div>

          <div className="audit-section">
            <h3>{t('audit.conclusions', lang)}</h3>
            <p>{t('audit.conclusionsText', lang)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
