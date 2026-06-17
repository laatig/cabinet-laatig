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
} from 'lucide-react';
import type { ReportStatus } from '../types';

const REPORT_ICONS: Record<string, typeof FileText> = {
  bilan: BarChart3,
  cpc: ScrollText,
  journal: BookOpen,
  'grand-livre': BookOpen,
  balance: Scale,
  tva: Receipt,
  'audit-report': FileSearch,
  synthese: FileCheck,
  'cahier-travail': ClipboardList,
};

const INITIAL_REPORTS: ReportStatus[] = [
  { type: 'bilan', label: 'export.bilan', status: 'pending' },
  { type: 'cpc', label: 'export.cpc', status: 'pending' },
  { type: 'journal', label: 'export.journal', status: 'pending' },
  { type: 'grand-livre', label: 'export.grand-livre', status: 'pending' },
  { type: 'balance', label: 'export.balance', status: 'pending' },
  { type: 'tva', label: 'export.tva', status: 'pending' },
  { type: 'audit-report', label: 'export.audit-report', status: 'pending' },
  { type: 'synthese', label: 'export.synthese', status: 'pending' },
  { type: 'cahier-travail', label: 'export.cahier-travail', status: 'pending' },
];

export default function ExportFiscalPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const [reports, setReports] = useState<ReportStatus[]>(INITIAL_REPORTS);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateAll = async () => {
    setGenerating(true);
    setProgress(0);
    for (let i = 0; i < reports.length; i++) {
      setReports((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'generating' } : r));
      try {
        await api.post(`/projects/${id}/reports/${reports[i].type}`);
        setReports((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'ready', generatedAt: new Date().toISOString() } : r));
      } catch {
        setReports((prev) => prev.map((r, idx) => idx === i ? { ...r, status: 'error' } : r));
      }
      setProgress(((i + 1) / reports.length) * 100);
    }
    setGenerating(false);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('export.title', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <div className="page-header-actions">
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
              const Icon = REPORT_ICONS[report.type] || FileText;
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
                  <button className="btn btn-ghost btn-sm" disabled={report.status !== 'ready'}>
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
          <button className="btn btn-primary btn-lg">
            <Download size={20} /> {t('export.downloadZip', lang)}
          </button>
        </div>
      )}
    </div>
  );
}
