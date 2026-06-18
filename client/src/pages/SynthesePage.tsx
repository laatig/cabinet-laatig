import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatCurrency } from '../lib/utils';
import api from '../lib/api';
import { FileCheck, AlertTriangle, CheckCircle, TrendingUp, Shield, Target } from 'lucide-react';
import type { Anomaly } from '../types';

export default function SynthesePage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}/anomalies`).then((r) => setAnomalies(r.data.anomalies || [])).catch(() => {}),
      api.get(`/projects/${id}/stats`).then((r) => setStats(r.data.stats || r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length;
  const highCount = anomalies.filter((a) => a.severity === 'high').length;
  const mediumCount = anomalies.filter((a) => a.severity === 'medium').length;
  const acceptedCount = anomalies.filter((a) => a.status === 'accepted').length;

  const sections = [
    {
      key: 'execSummary',
      icon: <FileCheck size={18} />,
      text: `Nous avons procédé à l'examen des états financiers dans le cadre de notre mission. ${stats ? `Au total, ${stats.totalTransactions || 0} transactions ont été analysées pour un montant total de ${formatCurrency(stats.totalAmount || 0)}.` : ''} Ce rapport de synthèse présente les principaux constats et recommandations.`,
    },
    {
      key: 'scope',
      icon: <Target size={18} />,
      text: `Nos travaux ont porté sur l'ensemble des transactions comptables de l'exercice. ${stats ? `${stats.verifiedTransactions || 0} transactions ont été vérifiées, ${stats.flaggedTransactions || 0} signalées et ${stats.disputedTransactions || 0} contestées.` : ''} Les contrôles ont été effectués par sondage et selon une approche par les risques.`,
    },
    {
      key: 'observations',
      icon: <AlertTriangle size={18} style={{ color: 'var(--cl-warning)' }} />,
      text: anomalies.length > 0
        ? `Au total, ${anomalies.length} anomalie${anomalies.length !== 1 ? 's' : ''} ont été identifiée${anomalies.length !== 1 ? 's' : ''} : ${criticalCount} critique${criticalCount !== 1 ? 's' : ''}, ${highCount} élevée${highCount !== 1 ? 's' : ''}, ${mediumCount} moyenne${mediumCount !== 1 ? 's' : ''}. ${acceptedCount} anomalie${acceptedCount !== 1 ? 's' : ''} ont été acceptée${acceptedCount !== 1 ? 's' : ''}.`
        : 'Aucune anomalie significative n\'a été identifiée au cours de nos travaux.',
    },
    {
      key: 'risks',
      icon: <Shield size={18} />,
      text: anomalies.length > 0
        ? `Les principaux risques identifiés concernent : ${anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 5).map(a => a.type).join(', ')}. Des contrôles complémentaires sont recommandés.`
        : 'Les principaux risques identifiés concernent la gestion des comptes fournisseurs, la TVA collectée et le suivi des immobilisations.',
    },
    {
      key: 'recommendations',
      icon: <CheckCircle size={18} style={{ color: 'var(--cl-success)' }} />,
      text: anomalies.filter(a => a.status === 'accepted').length > 0
        ? `Les recommandations suivantes ont été formulées et acceptées : ${anomalies.filter(a => a.status === 'accepted').map(a => a.type).join(', ')}.`
        : 'Renforcer les procédures de contrôle interne, automatiser le rapprochement bancaire, mettre en place un tableau de bord de suivi des échéances fiscales.',
    },
    {
      key: 'plan',
      icon: <TrendingUp size={18} />,
      text: `1. Mise en place d'un plan de remédiation sur 3 mois. 2. Suivi trimestriel des indicateurs. 3. Révision des procédures comptables. ${anomalies.length > 0 ? `4. Traitement des ${anomalies.length} anomalie${anomalies.length !== 1 ? 's' : ''} identifiée${anomalies.length !== 1 ? 's' : ''}.` : ''}`,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('synthese.title', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : (
        <>
          {stats && (
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
              <div className="kpi-card">
                <div className="kpi-value">{stats.totalTransactions || 0}</div>
                <div className="kpi-label">{t('nav.transactions', lang)}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{stats.totalAnomalies || 0}</div>
                <div className="kpi-label">{t('nav.anomalies', lang)}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value" style={{ color: 'var(--cl-success)' }}>{stats.verifiedTransactions || 0}</div>
                <div className="kpi-label">{t('transaction.verify', lang)}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-value">{formatCurrency(stats.totalAmount || 0)}</div>
                <div className="kpi-label">{t('transaction.amount', lang)}</div>
              </div>
            </div>
          )}

          <div className="panel" style={{ padding: 28 }}>
            {sections.map((s) => (
              <div key={s.key} className="synth-section" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(201,168,76,0.08)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  {s.icon}
                  {t(`synthese.${s.key}`, lang)}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--cl-text-secondary)', margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
