import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatCurrency } from '../lib/utils';
import StatusTracker from '../components/ui/StatusTracker';
import KpiCard from '../components/ui/KpiCard';
import api from '../lib/api';
import {
  FileText,
  ArrowLeftRight,
  AlertTriangle,
  Upload,
  CheckCircle,
  FileSignature,
} from 'lucide-react';
import type { Project } from '../types';

const STATUS_STEPS = ['Dépôt', 'Extraction', 'Révision', 'Validation', 'Signature'];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then((r) => setProject(r.data.project || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>;
  }

  if (!project) {
    return <div className="empty-state"><div className="empty-state-title">Projet introuvable</div></div>;
  }

  const dossierIdx = ['DOCUMENTS_RECEIVED', 'AI_ANALYSIS', 'IN_REVIEW', 'VALIDATED', 'SIGNED'].indexOf(project.dossierStatus);
  const currentStep = dossierIdx >= 0 ? dossierIdx : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{project.clientName || `Projet #${project.id}`}</div>
        <div className="page-subtitle">{project.fiscalYearStart ? new Date(project.fiscalYearStart).getFullYear() : ''} · {project.auditType}</div>
        <div className="page-gold-rule" />
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-body">
          <StatusTracker steps={STATUS_STEPS} currentStep={currentStep} />
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label={t('nav.transactions', lang)} value={String(project._count?.transactions || 0)} icon={<ArrowLeftRight />} />
        <KpiCard label={t('nav.anomalies', lang)} value={String(project._count?.anomalies || 0)} icon={<AlertTriangle />} />
        <KpiCard label="Documents" value={String(project._count?.documents || 0)} icon={<FileText />} />
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-header">
          <span className="panel-title">Actions</span>
        </div>
        <div className="panel-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate(`/projects/${id}/documents`)}>
            <Upload size={16} /> {t('project.uploadDoc', lang)}
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/projects/${id}/transactions`)}>
            <ArrowLeftRight size={16} /> {t('nav.transactions', lang)}
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/projects/${id}/anomalies`)}>
            <AlertTriangle size={16} /> {t('nav.anomalies', lang)}
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/projects/${id}/bilan`)}>
            <FileText size={16} /> {t('nav.bilan', lang)}
          </button>
          <button className="btn btn-outline" onClick={() => navigate(`/projects/${id}/audit-report`)}>
            <FileSignature size={16} /> {t('nav.audit-report', lang)}
          </button>
          <button className="btn btn-outline">
            <CheckCircle size={16} /> {t('project.revision', lang)}
          </button>
          <button className="btn btn-outline">
            <FileSignature size={16} /> {t('project.validate', lang)}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Informations du projet</span>
        </div>
        <div className="panel-body">
          <div className="form-row">
            <div>
              <div className="form-label">{t('project.client', lang)}</div>
              <div style={{ fontSize: 14, color: 'var(--cl-text-primary)' }}>{project.clientName}</div>
            </div>
            <div>
              <div className="form-label">{t('project.fiscalYear', lang)}</div>
              <div style={{ fontSize: 14, color: 'var(--cl-text-primary)' }}>{project.fiscalYearStart ? new Date(project.fiscalYearStart).getFullYear() : ''}</div>
            </div>
            <div>
              <div className="form-label">{t('project.auditType', lang)}</div>
              <div style={{ fontSize: 14, color: 'var(--cl-text-primary)' }}>{project.auditType}</div>
            </div>
            <div>
              <div className="form-label">{t('project.status', lang)}</div>
              <span className={`status-pill ${project.status === 'IN_PROGRESS' ? 'processing' : 'pending'}`}>
                {project.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
