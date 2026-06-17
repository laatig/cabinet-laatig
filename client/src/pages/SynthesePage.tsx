import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import api from '../lib/api';
import { FileCheck } from 'lucide-react';
import type { Anomaly } from '../types';

export default function SynthesePage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/anomalies`)
      .then((r) => setAnomalies(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const sections = [
    { key: 'execSummary', text: 'Nous avons procédé à l\'examen des états financiers de l\'exercice dans le cadre de notre mission. Ce rapport de synthèse présente les principaux constats et recommandations issus de nos travaux.' },
    { key: 'scope', text: 'Nos travaux ont porté sur l\'ensemble des transactions comptables de l\'exercice. Les contrôles ont été effectués par sondage et selon une approche par les risques.' },
    { key: 'observations', text: anomalies.length > 0 ? `Au total, ${anomalies.length} anomalies ont été identifiées, dont ${anomalies.filter(a => a.severity === 'critical').length} critiques et ${anomalies.filter(a => a.severity === 'high').length} élevées.` : 'Aucune anomalie significative n\'a été identifiée au cours de nos travaux.' },
    { key: 'risks', text: 'Les principaux risques identifiés concernent la gestion des comptes fournisseurs, la TVA collectée et le suivi des immobilisations. Des contrôles complémentaires sont recommandés.' },
    { key: 'recommendations', text: 'Renforcer les procédures de contrôle interne, automatiser le rapprochement bancaire, mettre en place un tableau de bord de suivi des échéances fiscales.' },
    { key: 'plan', text: '1. Mise en place d\'un plan de remédiation sur 3 mois. 2. Suivi trimestriel des indicateurs. 3. Révision des procédures comptables.' },
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
        <div className="panel" style={{ padding: 28 }}>
          {sections.map((s) => (
            <div key={s.key} className="synth-section">
              <h3>{t(`synthese.${s.key}`, lang)}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
