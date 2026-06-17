import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatNumber } from '../lib/utils';
import api from '../lib/api';
import type { CpcEntry } from '../types';

export default function CpcPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<CpcEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/cpc`)
      .then((r) => setEntries(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const produits = entries.filter((e) => e.type === 'produits');
  const charges = entries.filter((e) => e.type === 'charges');
  const totalProduits = produits.find((e) => e.isTotal)?.montant || 0;
  const totalCharges = charges.find((e) => e.isTotal)?.montant || 0;
  const resultatNet = totalProduits - totalCharges;

  const renderSection = (title: string, items: CpcEntry[], total: number) => (
    <div className="bilan-section">
      <div className="bilan-section-title">{title}</div>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={`bilan-row ${item.isTotal ? 'total' : ''} ${item.isSubtotal ? 'subtotal' : ''} ${item.level > 0 ? 'indent' : ''}`}
        >
          <span className="bilan-label">{item.label}</span>
          <span className="bilan-amount">{item.level < 2 ? formatNumber(item.montant) : ''}</span>
        </div>
      ))}
      <div className="bilan-row total">
        <span className="bilan-label">Total {title}</span>
        <span className="bilan-amount">{formatNumber(total)}</span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('cpc.title', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : (
        <>
          <div className="bilan-grid">
            {renderSection(t('cpc.produits', lang), produits, totalProduits)}
            {renderSection(t('cpc.charges', lang), charges, totalCharges)}
          </div>

          <div className="bilan-section" style={{ marginTop: 24 }}>
            <div className="bilan-row total">
              <span className="bilan-label">{t('cpc.resultatNet', lang)}</span>
              <span className="bilan-amount" style={{ color: resultatNet >= 0 ? 'var(--cl-success)' : '#FF6B6B' }}>
                {formatNumber(resultatNet)}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
