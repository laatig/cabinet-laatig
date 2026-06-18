import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDateTime } from '../lib/utils';
import api from '../lib/api';
import { FileSignature, Search, Download } from 'lucide-react';

interface Signature {
  id: string;
  fullName: string;
  title: string;
  signedAt: string;
  signatureType: string;
  project: { id: string; clientName: string; fiscalYearStart: string };
  user: { fullName: string };
}

export default function OwnerSignaturesPage() {
  const { lang } = useLanguage();
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/owner/signatures')
      .then((r) => setSignatures(r.data.signatures || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? signatures.filter((s) =>
        s.project?.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.fullName?.toLowerCase().includes(search.toLowerCase())
      )
    : signatures;

  const exportCsv = () => {
    const headers = 'Date,Signataire,Titre,Client,Exercice\n';
    const rows = filtered.map((s) =>
      `"${formatDateTime(s.signedAt)}","${s.fullName}","${s.title}","${s.project?.clientName || ''}","${s.project?.fiscalYearStart ? new Date(s.project.fiscalYearStart).getFullYear() : ''}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signatures-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('signatures.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <button className="btn btn-outline btn-sm" onClick={exportCsv}>
            <Download size={16} /> {t('common.download', lang)}
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('table.search', lang)}
          />
        </div>
        <span style={{ fontSize: 12, color: 'var(--cl-text-muted)' }}>
          {filtered.length} signature{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileSignature size={48} />
          <div className="empty-state-title">{t('signatures.empty', lang)}</div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-body" style={{ padding: 0 }}>
            {filtered.map((s) => (
              <div key={s.id} className="audit-trail-item">
                <div className="audit-trail-icon" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--cl-gold)' }}>
                  <FileSignature size={16} />
                </div>
                <div className="audit-trail-content">
                  <div className="audit-trail-action">
                    <strong>{s.fullName}</strong> — {s.project?.clientName || 'Projet'}
                    <span className="status-pill completed" style={{ marginLeft: 8, fontSize: 10 }}>Signé</span>
                  </div>
                  <div className="audit-trail-detail" style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span>{s.title}</span>
                    <span>Exercice {s.project?.fiscalYearStart ? new Date(s.project.fiscalYearStart).getFullYear() : ''}</span>
                    <span>{formatDateTime(s.signedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
