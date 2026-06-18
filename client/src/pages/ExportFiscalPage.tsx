import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDateTime } from '../lib/utils';
import api from '../lib/api';
import {
  Download,
  FileText,
  BarChart3,
  BookOpen,
  ScrollText,
  Scale,
  Receipt,
  FileSearch,
  FileCheck,
  ClipboardList,
  Archive,
} from 'lucide-react';

interface ReportItem {
  type: string;
  label: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  generatedAt?: string;
}

const REPORT_CONFIG: { type: string; label: string; icon: typeof FileText }[] = [
  { type: 'bilan', label: 'export.bilan', icon: BarChart3 },
  { type: 'cpc', label: 'export.cpc', icon: ScrollText },
  { type: 'journal', label: 'export.journal', icon: BookOpen },
  { type: 'grand-livre', label: 'export.grand-livre', icon: BookOpen },
  { type: 'balance', label: 'export.balance', icon: Scale },
  { type: 'tva', label: 'export.tva', icon: Receipt },
  { type: 'audit-report', label: 'export.audit-report', icon: FileSearch },
  { type: 'synthese', label: 'export.synthese', icon: FileCheck },
  { type: 'cahier-travail', label: 'export.cahier-travail', icon: ClipboardList },
];

export default function ExportFiscalPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [reports, setReports] = useState<ReportItem[]>(
    REPORT_CONFIG.map((r) => ({ type: r.type, label: r.label, status: 'pending' }))
  );
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateAll = async () => {
    setGenerating(true);
    setProgress(0);
    for (let i = 0; i < reports.length; i++) {
      setReports((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'generating' } : r));
      try {
        await api.post(`/projects/${id}/reports/generate/${reports[i].type}`);
        setReports((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'ready', generatedAt: new Date().toISOString() } : r));
      } catch {
        setReports((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'error' } : r));
      }
      setProgress(((i + 1) / reports.length) * 100);
    }
    setGenerating(false);
  };

  const handleDownload = async (type: string) => {
    try {
      const res = await api.get(`/reports/download/${type}_${id}.pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      try {
        const res = await api.get(`/projects/${id}/export/${type}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${id}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch { /* ignore */ }
    }
  };

  const handleDownloadZip = async () => {
    try {
      const res = await api.post(`/projects/${id}/reports/export-zip`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-fiscal-${id}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('export.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <div className="page-header-actions" style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" onClick={handleDownloadZip} disabled={generating}>
              <Archive size={16} /> ZIP
            </button>
            {!generating && (
              <button className="btn btn-primary" onClick={generateAll}>
                <Download size={16} /> {t('export.generate', lang)}
              </button>
            )}
          </div>
        </div>
      </div>

      {generating && (
        <div className="panel" style={{ marginBottom: 24 }}>
          <div className="panel-body">
            <div className="generation-title">{t('export.generating', lang)}</div>
            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
            <div className="progress-text">{Math.round(progress)}% — {reports.filter((r) => r.status === 'ready').length}/{reports.length}</div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="report-list" style={{ padding: 16 }}>
            {reports.map((report) => {
              const Icon = REPORT_CONFIG.find((r) => r.type === report.type)?.icon || FileText;
              const statusLabel = report.status === 'ready' ? t('export.ready', lang) : report.status === 'generating' ? t('export.generatingStatus', lang) : report.status === 'error' ? t('export.error', lang) : t('export.pending', lang);
              return (
                <div key={report.type} className="report-item">
                  <div className="report-item-left">
                    <div className="report-item-icon"><Icon size={18} /></div>
                    <div>
                      <div className="report-item-name">{t(report.label, lang)}</div>
                      <div className="report-item-status">
                        <span className={`status-pill ${report.status === 'ready' ? 'completed' : report.status === 'generating' ? 'processing' : report.status === 'error' ? 'rejected' : 'pending'}`}>
                          {statusLabel}
                        </span>
                        {report.generatedAt && (
                          <span style={{ fontSize: 11, color: 'var(--cl-text-muted)', marginLeft: 8 }}>
                            {formatDateTime(report.generatedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" disabled={report.status !== 'ready'} onClick={() => handleDownload(report.type)}>
                    <Download size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {reports.every((r) => r.status === 'ready') && !generating && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={handleDownloadZip}>
            <Archive size={20} /> {t('export.downloadZip', lang)}
          </button>
        </div>
      )}
    </div>
  );
}
