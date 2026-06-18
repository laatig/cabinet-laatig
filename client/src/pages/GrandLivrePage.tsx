import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDate, formatNumber } from '../lib/utils';
import api from '../lib/api';
import { Download } from 'lucide-react';
import type { GrandLivreEntry } from '../types';

export default function GrandLivrePage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<GrandLivreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/grand-livre`)
      .then((r) => setEntries(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const grouped: Record<string, GrandLivreEntry[]> = {};
  for (const entry of entries) {
    if (!grouped[entry.compte]) grouped[entry.compte] = [];
    grouped[entry.compte].push(entry);
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('grandlivre.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline" onClick={() => window.open(`/api/projects/${id}/export/grand-livre`, '_blank')}>
            <Download size={16} /> {t('common.download', lang)} (Excel)
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>{t('transaction.date', lang)}</th>
                    <th>{t('transaction.description', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('balance.debit', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('balance.credit', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('grandlivre.solde', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([compte, compteEntries]) => (
                    <>
                      <tr><td colSpan={5} className="livre-account-header">{compte} — {compteEntries[0]?.label || ''}</td></tr>
                      {compteEntries.map((e, idx) => (
                        <tr key={idx}>
                          <td className="cell-date">{formatDate(e.date)}</td>
                          <td>{e.libelle}</td>
                          <td style={{ textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                            {e.debit ? formatNumber(e.debit) : ''}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                            {e.credit ? formatNumber(e.credit) : ''}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: 'var(--cl-gold)' }}>
                            {formatNumber(e.solde)}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
