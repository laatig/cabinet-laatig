import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatCurrency } from '../lib/utils';
import api from '../lib/api';
import { ClipboardList, ChevronRight, ChevronDown, FileText, Download } from 'lucide-react';
import type { Transaction, PcmAccount } from '../types';

interface PcmClass {
  classNumber: number;
  className: string;
  accounts: PcmAccount[];
  transactions: Transaction[];
  totalDebit: number;
  totalCredit: number;
}

export default function CahierTravailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [pcmClasses, setPcmClasses] = useState<PcmClass[]>([]);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}/transactions`, { params: { limit: 500 } }),
      api.get('/pcm-accounts'),
    ]).then(([txRes, pcmRes]) => {
      const transactions: Transaction[] = txRes.data.transactions || [];
      const accounts: PcmAccount[] = pcmRes.data.accounts || pcmRes.data;

      const classes: Record<number, PcmClass> = {};
      for (const acc of accounts) {
        if (!classes[acc.classNumber]) {
          classes[acc.classNumber] = {
            classNumber: acc.classNumber,
            className: acc.className,
            accounts: [],
            transactions: [],
            totalDebit: 0,
            totalCredit: 0,
          };
        }
        classes[acc.classNumber].accounts.push(acc);
      }

      for (const tx of transactions) {
        if (tx.pcmAccount) {
          const cn = tx.pcmAccount.classNumber;
          if (classes[cn]) {
            classes[cn].transactions.push(tx);
            classes[cn].totalDebit += tx.totalAmount;
            classes[cn].totalCredit += tx.totalAmount;
          }
        }
      }

      setPcmClasses(Object.values(classes).sort((a, b) => a.classNumber - b.classNumber));
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const totalTransactions = pcmClasses.reduce((s, c) => s + c.transactions.length, 0);
  const totalAmount = pcmClasses.reduce((s, c) => s + c.totalDebit, 0);

  const exportCsv = () => {
    const headers = 'Classe,Compte,Libellé,Fournisseur,Montant,Date\n';
    const rows = pcmClasses.flatMap((cls) =>
      cls.transactions.map((tx) =>
        `"${cls.className}","${tx.pcmAccount?.accountNumber || ''}","${tx.pcmAccount?.accountName || ''}","${tx.vendorName || ''}",${tx.totalAmount},"${tx.date || ''}"`
      )
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cahier-travail-${id}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('cahier.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline btn-sm" onClick={exportCsv}>
            <Download size={16} /> {t('common.download', lang)}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : pcmClasses.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <div className="empty-state-title">{t('cahier.empty', lang)}</div>
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="kpi-card">
              <div className="kpi-value">{pcmClasses.length}</div>
              <div className="kpi-label">{t('balance.classe', lang)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{totalTransactions}</div>
              <div className="kpi-label">{t('nav.transactions', lang)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{formatCurrency(totalAmount)}</div>
              <div className="kpi-label">{t('transaction.amount', lang)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pcmClasses.map((cls) => (
              <div key={cls.classNumber} className="panel" style={{ padding: 0 }}>
                <div
                  className="panel-header"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setExpandedClass(expandedClass === cls.classNumber ? null : cls.classNumber)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                      background: 'rgba(201,168,76,0.08)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--cl-gold)', fontWeight: 700,
                      fontSize: 14,
                    }}>
                      {cls.classNumber}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cl-text-primary)' }}>
                        {cls.className}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--cl-text-muted)' }}>
                        {cls.accounts.length} comptes · {cls.transactions.length} écritures · {formatCurrency(cls.totalDebit)}
                      </div>
                    </div>
                  </div>
                  {expandedClass === cls.classNumber ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>

                {expandedClass === cls.classNumber && (
                  <div className="panel-body" style={{ padding: 0 }}>
                    {cls.transactions.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--cl-text-muted)' }}>
                        Aucune écriture pour cette classe
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th>{t('transaction.pcm', lang)}</th>
                              <th>{t('transaction.description', lang)}</th>
                              <th>{t('transaction.vendor', lang)}</th>
                              <th>{t('transaction.date', lang)}</th>
                              <th style={{ textAlign: 'right' }}>{t('transaction.amount', lang)}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cls.transactions.map((tx) => (
                              <tr key={tx.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                  {tx.pcmAccount?.accountNumber || '-'}
                                </td>
                                <td>{tx.pcmAccount?.accountName || tx.description || '-'}</td>
                                <td>{tx.vendorName || '-'}</td>
                                <td className="cell-date">{tx.date ? new Date(tx.date).toLocaleDateString('fr-FR') : '-'}</td>
                                <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                                  {formatCurrency(tx.totalAmount)}
                                </td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: 600, borderTop: '2px solid var(--cl-gold)' }}>
                              <td colSpan={4}>Total {cls.className}</td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(cls.totalDebit)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
