import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatNumber } from '../lib/utils';
import api from '../lib/api';
import { AlertTriangle, CheckCircle, Download } from 'lucide-react';
import type { BilanEntry } from '../types';

export default function BilanPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<BilanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/bilan`)
      .then((r) => setEntries(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const actifEntries = entries.filter((e) => e.type === 'actif');
  const passifEntries = entries.filter((e) => e.type === 'passif');
  const totalActif = actifEntries.find((e) => e.isTotal)?.net || 0;
  const totalPassif = passifEntries.find((e) => e.isTotal)?.net || 0;
  const isBalanced = Math.abs(totalActif - totalPassif) < 0.01;

  const renderSection = (title: string, items: BilanEntry[]) => (
    <div className="bilan-section">
      <div className="bilan-section-title">{title}</div>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`bilan-row ${item.isTotal ? 'total' : ''} ${item.isSubtotal ? 'subtotal' : ''} ${item.level > 0 ? 'indent' : ''}`}
        >
          <span className="bilan-label">{item.label}</span>
          <span className="bilan-amount">
            {item.level < 2 ? formatNumber(item.net) : ''}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('bilan.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline" onClick={() => window.open(`/api/projects/${id}/export/bilan`, '_blank')}>
            <Download size={16} /> {t('common.download', lang)} (Excel)
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : (
        <>
          <div className="bilan-grid">
            {renderSection(t('bilan.actif', lang), actifEntries)}
            {renderSection(t('bilan.passif', lang), passifEntries)}
          </div>

          {isBalanced ? (
            <div className="balance-assert success">
              <CheckCircle size={20} />
              {t('bilan.balanceOk', lang)}
            </div>
          ) : (
            <div className="balance-assert fail">
              <AlertTriangle size={20} />
              {t('bilan.balanceFail', lang)} — Actif: {formatNumber(totalActif)} / Passif: {formatNumber(totalPassif)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
