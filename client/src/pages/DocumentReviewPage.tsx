import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { Document } from '../types';

export default function DocumentReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/documents/${id}`)
      .then(res => setDoc(res.data.document))
      .catch(() => setError('Erreur chargement document'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCorrect = async (fieldId: string, value: string) => {
    const extractionId = doc?.extractions?.[0]?.id;
    if (!extractionId) return;
    try {
      await api.put(`/owner/extractions/${extractionId}/fields/${fieldId}`, { correctedValue: value });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/owner/documents/${id}/approve`);
      navigate('/owner');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    const comment = prompt('Motif du rejet :');
    if (!comment) return;
    try {
      await api.post(`/owner/documents/${id}/reject`, { comment });
      navigate('/owner');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="gold-spinner" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="page-content">
        <p>Document introuvable</p>
      </div>
    );
  }

  const extraction = doc.extractions?.[0];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Examen du document</h1>
          <p className="page-subtitle">{doc.fileName} - {doc.category}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="login-btn" style={{ background: 'var(--cl-success)' }} onClick={handleApprove}>
            Approuver
          </button>
          <button className="login-btn" style={{ background: 'var(--cl-danger)' }} onClick={handleReject}>
            Rejeter
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        <div className="section-card">
          <h3 style={{ color: 'var(--cl-gold)', marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
            Document original
          </h3>
          <div style={{ padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', minHeight: 300 }}>
            <p style={{ color: 'var(--cl-text-secondary)', fontSize: 13 }}>
              {doc.fileType === 'image' || doc.fileType === 'pdf' ? (
                <span>Fichier : {doc.fileName} ({doc.fileType})</span>
              ) : (
                <span>Format non affichable : {doc.fileType}</span>
              )}
            </p>
            <p style={{ color: 'var(--cl-text-muted)', fontSize: 12, marginTop: 8 }}>
              Version {doc.version} - Categorie : {doc.category} - Exercice {doc.fiscalYear}
            </p>
          </div>
        </div>

        <div className="section-card">
          <h3 style={{ color: 'var(--cl-gold)', marginBottom: 16, fontSize: 15, fontWeight: 600 }}>
            Donnees extraites par l IA
            {extraction && (
              <span style={{
                fontSize: 12, fontWeight: 400, marginLeft: 12,
                color: extraction.confidence > 0.8 ? 'var(--cl-success)' : 'var(--cl-warning)',
              }}>
                Confiance : {(extraction.confidence * 100).toFixed(0)}%
              </span>
            )}
          </h3>

          {!extraction ? (
            <p style={{ color: 'var(--cl-text-secondary)' }}>Aucune extraction disponible.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {extraction.fields.map(field => (
                <div key={field.id} style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--cl-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {field.fieldName.replace(/_/g, ' ')}
                        {field.section && <span style={{ marginLeft: 8 }}>({field.section})</span>}
                      </div>
                      <input
                        style={{
                          background: 'transparent', border: 'none', borderBottom: '1px solid var(--cl-text-muted)',
                          color: 'var(--cl-text-primary)', fontSize: 14, width: '100%', marginTop: 4,
                          padding: '4px 0', outline: 'none',
                        }}
                        defaultValue={field.correctedValue || field.fieldValue}
                        onBlur={e => handleCorrect(field.id, e.target.value)}
                      />
                    </div>
                    <div style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10,
                      background: field.confidence > 0.8 ? 'rgba(46,139,87,0.2)' : 'rgba(184,134,11,0.2)',
                      color: field.confidence > 0.8 ? 'var(--cl-success)' : 'var(--cl-warning)',
                    }}>
                      {(field.confidence * 100).toFixed(0)}%
                    </div>
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
