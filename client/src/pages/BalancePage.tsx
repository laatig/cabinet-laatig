import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatNumber } from '../lib/utils';
import api from '../lib/api';
import { AlertTriangle, CheckCircle, Download } from 'lucide-react';
import type { BalanceEntry } from '../types';

export default function BalancePage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/balance`)
      .then((r) => setEntries(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const classes = ['1', '2', '3', '4', '5'];
  const grouped: Record<string, BalanceEntry[]> = {};
  for (const cls of classes) {
    grouped[cls] = entries.filter((e) => e.classe === cls);
  }

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
  const totalSoldeDebit = entries.reduce((s, e) => s + e.soldeDebit, 0);
  const totalSoldeCredit = entries.reduce((s, e) => s + e.soldeCredit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const renderRows = (items: BalanceEntry[]) => items.map((e, idx) => (
    <tr key={idx}>
      <td>{e.code}</td>
      <td>{e.label}</td>
      <td style={{ textAlign: 'right' }}>{formatNumber(e.debit)}</td>
      <td style={{ textAlign: 'right' }}>{formatNumber(e.credit)}</td>
      <td style={{ textAlign: 'right' }}>{formatNumber(e.soldeDebit)}</td>
      <td style={{ textAlign: 'right' }}>{formatNumber(e.soldeCredit)}</td>
    </tr>
  ));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('balance.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline" onClick={() => window.open(`/api/projects/${id}/export/balance`, '_blank')}>
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
                    <th>{t('balance.classe', lang)}</th>
                    <th>Libellé</th>
                    <th style={{ textAlign: 'right' }}>{t('balance.debit', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('balance.credit', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('balance.soldeDebit', lang)}</th>
                    <th style={{ textAlign: 'right' }}>{t('balance.soldeCredit', lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    grouped[cls]?.length > 0 ? (
                      <>
                        <tr><td colSpan={6} className="livre-account-header">Classe {cls}</td></tr>
                        {renderRows(grouped[cls])}
                        <tr className="bilan-row subtotal">
                          <td colSpan={2} style={{ textAlign: 'right' }}>Sous-total Classe {cls}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(grouped[cls].reduce((s, e) => s + e.debit, 0))}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(grouped[cls].reduce((s, e) => s + e.credit, 0))}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(grouped[cls].reduce((s, e) => s + e.soldeDebit, 0))}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(grouped[cls].reduce((s, e) => s + e.soldeCredit, 0))}</td>
                        </tr>
                      </>
                    ) : null
                  ))}
                  <tr className="bilan-row total">
                    <td colSpan={2} style={{ textAlign: 'right' }}>{t('balance.totalDebit', lang)} / {t('balance.totalCredit', lang)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(totalDebit)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(totalCredit)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(totalSoldeDebit)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(totalSoldeCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!loading && (
        isBalanced ? (
          <div className="balance-assert success">
            <CheckCircle size={20} />
            {t('balance.assertOk', lang)}
          </div>
        ) : (
          <div className="balance-assert fail">
            <AlertTriangle size={20} />
            {t('balance.assertFail', lang)}
          </div>
        )
      )}
    </div>
  );
}
