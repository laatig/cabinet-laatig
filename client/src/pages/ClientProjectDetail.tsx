import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Project, Document } from '../types';

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

export default function ClientProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('PIECE_JUSTIFICATIVE');

  useEffect(() => {
    api.get(`/client/projects/${id}`)
      .then(res => setProject(res.data.project))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
      const res = await api.post(`/projects/${id}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProject(prev => prev ? {
        ...prev,
        documents: [...(res.data.documents as Document[]).reverse(), ...prev.documents],
      } : prev);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

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

      <div className="section-card" style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--cl-gold)', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Téléverser des documents
        </h2>
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

      <div className="section-card">
        <h2 style={{ color: 'var(--cl-gold)', fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Documents ({project.documents?.length || 0})
        </h2>
        {(project as any).documents?.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 14 }}>Aucun document téléversé.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(project as any).documents?.map((doc: Document) => (
              <div key={doc.id} className="data-row" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.15)',
              }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{doc.fileName}</div>
                  <div style={{ fontSize: 12, color: 'var(--cl-text-muted)', marginTop: 2 }}>
                    {categoryLabels[doc.category] || doc.category} · v{doc.version}
                    {doc.fiscalYear && ` · ${doc.fiscalYear}`}
                  </div>
                </div>
                <span className={`status-badge ${statusBadge[doc.status] || 'pending'}`}>
                  {doc.status === 'AWAITING_REVIEW' ? 'À valider' : doc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
