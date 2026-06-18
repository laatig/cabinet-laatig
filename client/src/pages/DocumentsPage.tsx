import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDate, getStatusClass } from '../lib/utils';
import UploadZone from '../components/documents/UploadZone';
import CsvMappingModal from '../components/documents/CsvMappingModal';
import DataTable from '../components/ui/DataTable';
import api from '../lib/api';
import { FileText } from 'lucide-react';
import type { Document } from '../types';

export default function DocumentsPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMapping, setShowMapping] = useState(false);
  const [importColumns, setImportColumns] = useState<string[]>([]);

  const fetchDocs = () => {
    api.get(`/projects/${id}/documents`)
      .then((r) => setDocs(r.data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocs(); }, [id]);

  const handleMappingConfirm = async (mapping: Record<string, string>) => {
    await api.post(`/projects/${id}/documents/import`, { mapping });
    setShowMapping(false);
    fetchDocs();
  };

  const columns = [
    { key: 'fileName', label: 'Nom', render: (d: Document) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileText size={16} style={{ color: 'var(--cl-gold)', flexShrink: 0 }} />
        <span className="cell-vendor-name">{d.fileName}</span>
      </div>
    )},
    { key: 'status', label: 'Statut', render: (d: Document) => (
      <span className={`status-pill ${getStatusClass(d.status)}`}>{d.status}</span>
    )},
    { key: 'createdAt', label: 'Date', render: (d: Document) => <span className="cell-date">{formatDate(d.createdAt)}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('upload.title', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      <UploadZone projectId={id!} onUploadComplete={fetchDocs} />

      <div style={{ marginTop: 28 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">{t('nav.documents', lang)}</span>
          </div>
          <div className="panel-body" style={{ padding: docs.length === 0 ? undefined : 0 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
            ) : docs.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <div className="empty-state-title">{t('upload.title', lang)}</div>
                <div className="empty-state-desc">{t('table.noData', lang)}</div>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={docs}
                searchable={false}
                pageSize={20}
              />
            )}
          </div>
        </div>
      </div>

      <CsvMappingModal
        open={showMapping}
        onClose={() => setShowMapping(false)}
        columns={importColumns}
        onConfirm={handleMappingConfirm}
      />
    </div>
  );
}
