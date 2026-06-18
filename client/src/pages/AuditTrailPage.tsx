import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDateTime } from '../lib/utils';
import api from '../lib/api';
import { History, Download, Filter, ChevronRight } from 'lucide-react';
import type { AuditLog } from '../types';

export default function AuditTrailPage() {
  const { lang } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/audit-logs', { params: { limit: 100 } })
      .then((r) => setLogs(r.data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? logs.filter((l) => l.action.toLowerCase().includes(filter.toLowerCase())) : logs;

  const exportCsv = () => {
    const headers = 'Date,Utilisateur,Action,Détails\n';
    const rows = filtered.map((l) =>
      `"${formatDateTime(l.timestamp)}","${l.user?.fullName || ''}","${l.action}","${JSON.stringify(l.details || {})}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('auditTrail.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline" onClick={exportCsv}>
            <Download size={16} /> {t('auditTrail.exportCsv', lang)}
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Filter size={16} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('auditTrail.filter', lang)}
          />
        </div>
        <span style={{ fontSize: 12, color: 'var(--cl-text-muted)' }}>
          {filtered.length} entrée{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <History size={48} />
              <div className="empty-state-title">{t('table.noData', lang)}</div>
            </div>
          ) : (
            <div style={{ padding: '0 20px' }}>
              {filtered.map((log) => (
                <div key={log.id} className="audit-trail-item">
                  <div className="audit-trail-icon">
                    <ChevronRight size={14} />
                  </div>
                  <div className="audit-trail-content">
                    <div className="audit-trail-action">
                      <strong>{log.user?.fullName || 'Système'}</strong> — {log.action}
                    </div>
                    <div className="audit-trail-detail">{log.details}</div>
                    <div className="audit-trail-time">{formatDateTime(log.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
