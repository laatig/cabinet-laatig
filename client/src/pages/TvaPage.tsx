import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatNumber } from '../lib/utils';
import api from '../lib/api';
import { Download } from 'lucide-react';

interface TvaSection {
  rows: Array<{ label: string; base: number; taux: number; montant: number }>;
  total: number;
}

interface TvaDeclaration {
  id: string;
  period: string;
  declarationType: string;
  status: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  base: number;
  dueDate: string;
  createdAt: string;
  collectee: TvaSection;
  deductible: TvaSection;
  netDue: number;
}

const MONTHS = [
  'common.month.january', 'common.month.february', 'common.month.march',
  'common.month.april', 'common.month.may', 'common.month.june',
  'common.month.july', 'common.month.august', 'common.month.september',
  'common.month.october', 'common.month.november', 'common.month.december',
];

export default function TvaPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [declaration, setDeclaration] = useState<TvaDeclaration | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    api.get(`/projects/${id}/tva`, { params: { period, year } })
      .then((r) => setDeclaration(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, period, year]);

  const renderSection = (title: string, section: TvaDeclaration['collectee'] | null) => (
    <div className="tva-section">
      <div className="tva-section-title">{title}</div>
      {section?.rows.map((row, idx) => (
        <div key={idx} className="tva-row">
          <span>{row.label}</span>
          <div style={{ display: 'flex', gap: 24, fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
            <span style={{ minWidth: 100, textAlign: 'right' }}>{formatNumber(row.base)}</span>
            <span style={{ minWidth: 60, textAlign: 'right', color: 'var(--cl-text-muted)' }}>{row.taux}%</span>
            <span style={{ minWidth: 100, textAlign: 'right' }}>{formatNumber(row.montant)}</span>
          </div>
        </div>
      ))}
      <div className="tva-row total">
        <span>Total</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
          {section ? formatNumber(section.total) : '-'}
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('tva.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline" onClick={() => window.open(`/api/projects/${id}/export/tva?period=${period}&year=${year}`, '_blank')}>
            <Download size={16} /> {t('common.download', lang)} (Excel)
          </button>
        </div>
      </div>

      <div className="form-row" style={{ maxWidth: 400, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{t('tva.period', lang)}</label>
          <select className="form-input form-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {MONTHS.map((m, idx) => (
              <option key={idx} value={idx + 1}>{t(m, lang)}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{t('tva.year', lang)}</label>
          <input className="form-input" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : declaration ? (
        <>
          {renderSection(t('tva.collectee', lang), declaration.collectee)}
          {renderSection(t('tva.deductible', lang), declaration.deductible)}

          <div className="tva-section">
            <div className="tva-section-title">{t('tva.recap', lang)}</div>
            <div className="tva-row total">
              <span>{t('tva.netDue', lang)}</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: 'var(--cl-gold)' }}>
                {formatNumber(declaration.netDue)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">Aucune déclaration</div>
        </div>
      )}
    </div>
  );
}
