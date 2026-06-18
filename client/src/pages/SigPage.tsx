import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatNumber } from '../lib/utils';
import api from '../lib/api';
import { Download, ArrowLeft, TrendingUp } from 'lucide-react';
import type { SigEntry } from '../types';

const sectionColors: Record<string, string> = {
  'I': '#1a5276', 'II': '#1e8449', 'III': '#b7950b',
  'IV': '#c0392b', 'V': '#6c3483', 'VI': '#2e86c1',
  'VII': '#117a65', 'VIII': '#d35400', 'IX': '#2c3e50',
};

export default function SigPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<SigEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/sig`)
      .then((r) => setEntries(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const renderRow = (entry: SigEntry, idx: number) => {
    const sectionMatch = entry.label.match(/^([IVX]+)/);
    const sectionKey = sectionMatch ? sectionMatch[1] : '';
    const borderColor = sectionColors[sectionKey] || 'transparent';

    return (
      <div
        key={idx}
        className="sig-row"
        style={{
          padding: entry.isTotal ? '10px 0' : entry.isSubtotal ? '8px 0' : '5px 0',
          borderBottom: entry.isTotal ? '2px solid #1a1a2e' : entry.isSubtotal ? '1px solid #e0e0e0' : 'none',
          borderLeft: entry.isSubtotal ? `3px solid ${borderColor}` : 'none',
          paddingLeft: entry.isSubtotal ? 12 : entry.level > 1 ? 32 : 12,
          opacity: entry.level > 1 ? 0.75 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontWeight: entry.isTotal ? 700 : entry.isSubtotal ? 600 : 400,
            fontSize: entry.isTotal ? 15 : 14,
            color: entry.isTotal ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}>
            {entry.label}
          </span>
          <span style={{
            fontWeight: entry.isTotal || entry.isSubtotal ? 600 : 400,
            fontSize: 14,
            color: entry.montant < 0 ? '#e74c3c' : entry.montant > 0 ? '#27ae60' : 'var(--text-secondary)',
          }}>
            {formatNumber(entry.montant)} DH
          </span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="page-title">SIG</div>
              <div className="page-gold-rule" />
            </div>
          </div>
          <button className="btn btn-outline" onClick={() => window.open(`/api/projects/${id}/export/sig`, '_blank')}>
            <Download size={16} /> {t('common.download', lang)}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="gold-spinner" />
        </div>
      ) : entries.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 40 }}>
          <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('table.noData', lang)}
          </p>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-body" style={{ padding: '20px 24px' }}>
            {entries.map((entry, idx) => renderRow(entry, idx))}
          </div>
        </div>
      )}
    </div>
  );
}