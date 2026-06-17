import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import type { DashboardStats } from '../types';

export default function OwnerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/owner/dashboard'),
      api.get('/owner/validation-queue'),
    ]).then(([sRes, qRes]) => {
      setStats(sRes.data);
      setQueue(qRes.data.documents);
    }).catch(() => setError('Erreur chargement dashboard')).finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/owner/documents/${id}/approve`);
      setQueue(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    const comment = prompt('Motif du rejet :');
    if (!comment) return;
    try {
      await api.post(`/owner/documents/${id}/reject`, { comment });
      setQueue(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div className="gold-spinner" />
    </div>;
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord propriétaire</h1>
          <p className="page-subtitle">Gestion des dossiers clients</p>
        </div>
      </div>

      <div className="dashboard-kpis" style={{ marginBottom: 32 }}>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.totalClients || 0}</div>
          <div className="kpi-label">Clients</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.totalProjects || 0}</div>
          <div className="kpi-label">Dossiers</div>
        </div>
        <div className="kpi-card" style={{ borderColor: queue.length > 0 ? 'var(--cl-gold)' : undefined }}>
          <div className="kpi-value">{stats?.pendingReviews || 0}</div>
          <div className="kpi-label">En attente de validation</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{stats?.signedProjects || 0}</div>
          <div className="kpi-label">Signés</div>
        </div>
      </div>

      <div className="section-card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--cl-gold)' }}>
          File d'attente de validation ({queue.length})
        </h2>
        {queue.length === 0 ? (
          <div className="empty-state">
            <p style={{ fontSize: 14 }}>Aucun document en attente de validation.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {queue.map((doc: any) => (
              <div key={doc.id} className="data-row" style={{
                padding: 16, borderRadius: 'var(--radius-md)',
                background: 'var(--cl-navy-card)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{doc.fileName}</div>
                    <div style={{ fontSize: 13, color: 'var(--cl-text-secondary)', marginTop: 4 }}>
                      Client : {doc.project?.user?.fullName || doc.project?.clientName} —
                      Catégorie : {doc.category} — v{doc.version}
                    </div>
                    {doc.extractions?.[0] && (
                      <div style={{ fontSize: 13, color: 'var(--cl-info)', marginTop: 4 }}>
                        Confiance IA : {(doc.extractions[0].confidence * 100).toFixed(0)}% —
                        {doc.extractions[0].fields.length} champs extraits
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/review/${doc.id}`} className="table-action-btn" style={{ textDecoration: 'none' }}>
                      Examiner
                    </Link>
                    <button className="table-action-btn" style={{ color: 'var(--cl-success)' }}
                      onClick={() => handleApprove(doc.id)}>
                      Approuver
                    </button>
                    <button className="table-action-btn" style={{ color: 'var(--cl-danger)' }}
                      onClick={() => handleReject(doc.id)}>
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Link to="/owner/clients" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Voir les clients
        </Link>
        <Link to="/owner/projects" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Voir tous les dossiers
        </Link>
        <Link to="/owner/signatures" className="login-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Registre des signatures
        </Link>
      </div>
    </div>
  );
}
