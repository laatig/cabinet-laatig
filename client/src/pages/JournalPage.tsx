import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDate, formatNumber } from '../lib/utils';
import api from '../lib/api';
import type { JournalEntry } from '../types';

export default function JournalPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}/journal`)
      .then((r) => setEntries(r.data.data || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const grouped: Record<string, JournalEntry[]> = {};
  for (const entry of entries) {
    const month = entry.date.slice(0, 7);
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(entry);
  }

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('journal.title', lang)}</div>
        <div className="page-gold-rule" />
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
                    <th>Date</th>
                    <th>N°</th>
                    <th>Libellé</th>
                    <th>Compte</th>
                    <th style={{ textAlign: 'right' }}>Débit</th>
                    <th style={{ textAlign: 'right' }}>Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(grouped).map(([month, monthEntries]) => (
                    <>
                      <tr><td colSpan={6} className="journal-month">{month}</td></tr>
                      {monthEntries.map((e, idx) => (
                        <tr key={idx}>
                          <td className="cell-date">{formatDate(e.date)}</td>
                          <td>{e.numero}</td>
                          <td>{e.libelle}</td>
                          <td>{e.compte}</td>
                          <td style={{ textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                            {e.debit ? formatNumber(e.debit) : ''}
                          </td>
                          <td style={{ textAlign: 'right', fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}>
                            {e.credit ? formatNumber(e.credit) : ''}
                          </td>
                        </tr>
                      ))}
                      <tr className="bilan-row subtotal">
                        <td colSpan={4} style={{ textAlign: 'right', fontSize: 12 }}>{t('journal.subtotal', lang)} {month}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(monthEntries.reduce((s, e) => s + e.debit, 0))}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(monthEntries.reduce((s, e) => s + e.credit, 0))}</td>
                      </tr>
                    </>
                  ))}
                  <tr className="bilan-row total">
                    <td colSpan={4} style={{ textAlign: 'right' }}>{t('journal.total', lang)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(totalDebit)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(totalCredit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
