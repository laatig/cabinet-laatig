import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Project, Document } from '../types';
import {
  Upload, FileText, Brain, CheckCircle, AlertCircle,
  Scale, Receipt, BookOpen, BookText, ScrollText, FileCheck,
  TrendingUp, Download, RefreshCw, ArrowRight,
} from 'lucide-react';

const dossierLabels: Record<string, string> = {
  DOCUMENTS_RECEIVED: 'Documents reçus',
  EXTRACTION_IN_PROGRESS: 'Extraction en cours',
  AI_ANALYSIS: 'Analyse IA terminée',
  IN_REVIEW: 'En cours de révision',
  AWAITING_CLIENT_CORRECTION: 'Correction demandée',
  VALIDATED: 'Validé',
  SIGNED: 'Signé et clôturé',
};

const categoryLabels: Record<string, string> = {
  BILAN: 'Bilan', CPC: 'CPC', BALANCE: 'Balance générale',
  ESG: 'ESG', TABLEAU_FINANCEMENT: 'Tableau de financement',
  ETIC: 'ETIC', PIECE_JUSTIFICATIVE: 'Pièce justificative',
};

const statusBadge: Record<string, string> = {
  UPLOADED: 'pending', PROCESSING: 'processing', EXTRACTED: 'extracted',
  AWAITING_REVIEW: 'pending', REVIEWED: 'verified', FAILED: 'rejected',
};

const statusLabel: Record<string, string> = {
  UPLOADED: 'En attente', PROCESSING: 'Traitement...', EXTRACTED: 'Extrait',
  AWAITING_REVIEW: 'À valider', REVIEWED: 'Validé', FAILED: 'Échec',
};

const FINANCIAL_STATEMENTS = [
  { key: 'bilan', label: 'Bilan', icon: Scale, color: '#2980b9' },
  { key: 'cpc', label: 'Compte de Produits et Charges', icon: Receipt, color: '#27ae60' },
  { key: 'balance', label: 'Balance Générale', icon: BookOpen, color: '#8e44ad' },
  { key: 'journal', label: 'Journal Général', icon: BookText, color: '#d35400' },
  { key: 'grand-livre', label: 'Grand Livre', icon: ScrollText, color: '#16a085' },
  { key: 'tva', label: 'Déclaration TVA', icon: FileCheck, color: '#c0392b' },
  { key: 'sig', label: 'SIG', icon: TrendingUp, color: '#2c3e50' },
  { key: 'liasse-fiscale', label: 'Liasse Fiscale', icon: FileText, color: '#6c3483' },
];

export default function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('PIECE_JUSTIFICATIVE');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchProject = () => {
    api.get(`/client/projects/${id}`)
      .then(res => setProject(res.data.project))
      .catch(() => setError('Erreur chargement projet'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('category', category);
    try {
      await api.post(`/projects/${id}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProject();
    } catch {
      setError('Erreur lors du téléversement');
    } finally {
      setUploading(false);
    }
  };

  const handleProcessDocument = async (docId: string) => {
    setProcessingId(docId);
    try {
      await api.post(`/documents/${docId}/process`);
      fetchProject();
    } catch {
      setError("Erreur lors de l'analyse du document");
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      await api.post(`/projects/${id}/reports/generate-all`);
    } catch {
      setError('Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const documents = (project as any)?.documents as Document[] | undefined;
  const hasExtractions = documents?.some(d =>
    d.status === 'EXTRACTED' || d.status === 'AWAITING_REVIEW' || d.status === 'REVIEWED'
  );

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="gold-spinner" />
    </div>;
  }

  if (!project) {
    return <div className="page-content"><p>Projet introuvable</p></div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.clientName}</h1>
          <p className="page-subtitle">
            Exercice {new Date(project.fiscalYearStart).getFullYear()} - {new Date(project.fiscalYearEnd).getFullYear()}
            {' · '} {project.auditType}
          </p>
        </div>
        <span className={`status-badge ${project.dossierStatus === 'SIGNED' ? 'completed' : project.dossierStatus === 'VALIDATED' ? 'verified' : 'pending'}`}>
          {dossierLabels[project.dossierStatus] || project.dossierStatus}
        </span>
      </div>

      {error && (
        <div style={{
          padding: '10px 16px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 'var(--radius-sm)', color: '#e74c3c', fontSize: 13, marginBottom: 16,
        }}>
          {error}
          <button style={{ marginLeft: 12, textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setError('')}>X</button>
        </div>
      )}

      <div className="section-card" style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--cl-gold)', fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={18} /> Téléverser des documents comptables
        </h2>
        <p style={{ fontSize: 13, color: 'var(--cl-text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Déposez vos documents financiers (factures, relevés bancaires, bilans, etc.). 
          Notre IA les analysera automatiquement pour générer vos états de synthèse.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Catégorie</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <label className="login-btn" style={{ cursor: 'pointer', display: 'inline-block', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Téléversement...' : 'Choisir fichiers'}
              <input type="file" multiple onChange={handleUpload} hidden disabled={uploading} />
            </label>
          </div>
        </div>
      </div>

      <div className="section-card" style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--cl-gold)', fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} /> Documents ({documents?.length || 0})
        </h2>
        {!documents || documents.length === 0 ? (
          <div className="empty-state">
            <Upload size={40} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginTop: 8 }}>Aucun document téléversé.</p>
            <p style={{ fontSize: 12, color: 'var(--cl-text-muted)' }}>Téléversez vos documents ci-dessus pour commencer.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {documents.map((doc: Document) => {
              const canProcess = doc.fileType === 'pdf' || doc.fileType === 'image';
              const isProcessing = processingId === doc.id;
              return (
                <div key={doc.id} className="data-row" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.15)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} style={{ color: 'var(--cl-gold)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cl-text-muted)', marginTop: 2, marginLeft: 24 }}>
                      {categoryLabels[doc.category] || doc.category} · v{doc.version}
                      {doc.fiscalYear && ` · ${doc.fiscalYear}`}
                      {doc.extractions?.[0] && ` · Confiance IA: ${(doc.extractions[0].confidence * 100).toFixed(0)}%`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`status-badge ${statusBadge[doc.status] || 'pending'}`}>
                      {isProcessing ? 'Analyse...' : statusLabel[doc.status] || doc.status}
                    </span>
                    {canProcess && doc.status === 'UPLOADED' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleProcessDocument(doc.id)}
                        disabled={isProcessing}
                        title="Analyser par IA"
                      >
                        <Brain size={14} />
                      </button>
                    )}
                    {doc.status === 'AWAITING_REVIEW' && (
                      <CheckCircle size={16} style={{ color: 'var(--cl-gold)' }} />
                    )}
                    {doc.status === 'FAILED' && (
                      <AlertCircle size={16} style={{ color: '#e74c3c' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: 'var(--cl-gold)', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> États de Synthèse
          </h2>
          {hasExtractions && (
            <button
              className="btn btn-outline btn-sm"
              onClick={handleGenerateAll}
              disabled={generating}
            >
              <RefreshCw size={14} className={generating ? 'spin' : ''} />
              {generating ? 'Génération...' : 'Générer tout'}
            </button>
          )}
        </div>
        {!hasExtractions ? (
          <div className="empty-state">
            <FileText size={40} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: 14, marginTop: 8 }}>Aucune donnée extraite</p>
            <p style={{ fontSize: 12, color: 'var(--cl-text-muted)', maxWidth: 400, textAlign: 'center' }}>
              Téléversez et analysez vos documents avec l'IA pour générer automatiquement 
              vos états de synthèse : Bilan, CPC, Balance, Journal, TVA et plus.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {FINANCIAL_STATEMENTS.map(stmt => {
              const Icon = stmt.icon;
              return (
                <div
                  key={stmt.key}
                  onClick={() => navigate(`/projects/${id}/${stmt.key}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(0,0,0,0.2)', cursor: 'pointer',
                    border: '1px solid rgba(201,168,76,0.06)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.06)'; e.currentTarget.style.background = 'rgba(0,0,0,0.2)'; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: stmt.color + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} style={{ color: stmt.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cl-text-primary)' }}>{stmt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--cl-text-muted)', marginTop: 2 }}>Cliquer pour voir</div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--cl-gold-dim)', opacity: 0.5 }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
