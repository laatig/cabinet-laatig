import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t as tr } from '../lib/translations';
import { formatCurrency, formatDate, getRiskLevel, getStatusClass } from '../lib/utils';
import DataTable from '../components/ui/DataTable';
import RiskBadge from '../components/ui/RiskBadge';
import PcmSelector from '../components/transactions/PcmSelector';
import Modal from '../components/ui/Modal';
import api from '../lib/api';
import type { Transaction } from '../types';

const statusLabel: Record<string, string> = {
  pending: 'En attente',
  verified: 'Vérifié',
  flagged: 'Flagué',
  anomaly: 'Anomalie',
};

export default function TransactionsPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingPcm, setEditingPcm] = useState<Transaction | null>(null);

  const fetchTxns = () => {
    api.get(`/projects/${id}/transactions`)
      .then((r) => setTxns(r.data.transactions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTxns(); }, [id]);

  const toggleSelect = (txnId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(txnId)) next.delete(txnId);
      else next.add(txnId);
      return next;
    });
  };

  const bulkAction = async (action: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await api.post(`/projects/${id}/transactions/bulk`, { ids, action });
    fetchTxns();
    setSelected(new Set());
  };

  const columns = [
    { key: 'select', label: '', width: '40px', sortable: false, render: (t: Transaction) => (
      <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} style={{ accentColor: 'var(--cl-gold)' }} />
    )},
    { key: 'date', label: 'transaction.date', render: (row: Transaction) => <span className="cell-date">{formatDate(row.date || '')}</span> },
    { key: 'documentNumber', label: 'transaction.docNum' },
    { key: 'vendorName', label: 'transaction.vendor', render: (row: Transaction) => <span className="cell-vendor-name">{row.vendorName}</span> },
    { key: 'description', label: 'transaction.description' },
    { key: 'totalAmount', label: 'transaction.amount', render: (row: Transaction) => <span className="cell-amount">{formatCurrency(row.totalAmount)}</span> },
    { key: 'pcmAccount', label: 'transaction.pcm', render: (row: Transaction) => (
      <div>
        <span style={{ color: 'var(--cl-gold)', fontWeight: 600, fontSize: 12 }}>{row.pcmAccount?.accountNumber}</span>
        {row.pcmAccount?.accountName && <div style={{ fontSize: 11, color: 'var(--cl-text-muted)' }}>{row.pcmAccount.accountName}</div>}
      </div>
    )},
    { key: 'riskScore', label: 'transaction.risk', render: (row: Transaction) => <RiskBadge score={row.riskScore} /> },
    { key: 'status', label: 'transaction.status', render: (row: Transaction) => (
      <span className={`status-pill ${getStatusClass(row.status)}`}>{statusLabel[row.status] || row.status}</span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{tr('nav.transactions', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            {tr('nav.transactions', lang)}
            <span style={{ fontSize: 12, color: 'var(--cl-text-muted)', marginLeft: 8 }}>({txns.length})</span>
          </span>
          {selected.size > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-outline" onClick={() => bulkAction('VERIFIED')}>
                {tr('transaction.bulkVerify', lang)}
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => bulkAction('FLAGGED')}>
                {tr('transaction.bulkFlag', lang)}
              </button>
            </div>
          )}
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <DataTable
            columns={columns}
            data={txns}
            searchKeys={['vendorName', 'description', 'documentNumber']}
            pageSize={25}
            isLoading={loading}
          />
        </div>
      </div>

      <Modal
        open={editingPcm != null}
        onClose={() => setEditingPcm(null)}
        title="Modifier le compte PCM"
        footer={
          <button className="btn btn-primary" onClick={() => setEditingPcm(null)}>{tr('common.close', lang)}</button>
        }
      >
        {editingPcm && (
          <div>
            <div className="form-group">
              <label className="form-label">Transaction</label>
              <div style={{ fontSize: 14, color: 'var(--cl-text-primary)' }}>
                {editingPcm.vendorName} — {formatCurrency(editingPcm.totalAmount)}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{tr('transaction.pcm', lang)}</label>
              <PcmSelector
                value={`${editingPcm.pcmAccount?.accountNumber || ''} - ${editingPcm.pcmAccount?.accountName || ''}`}
                onChange={(code, label) => {
                  api.put(`/transactions/${editingPcm.id}`, { pcmAccountId: code })
                    .then(fetchTxns);
                  setEditingPcm(null);
                }}
                confidence={editingPcm.pcmAccount ? undefined : 0}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
