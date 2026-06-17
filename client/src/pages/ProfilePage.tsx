import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Save, User, Building2, Phone, FileText, BadgeCheck } from 'lucide-react';

interface ProfileData {
  fullName: string;
  phoneNumber: string;
  raisonSociale: string;
  clientICE: string;
  clientRC: string;
  formeJuridique: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<ProfileData>({
    fullName: '', phoneNumber: '', raisonSociale: '',
    clientICE: '', clientRC: '', formeJuridique: '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/client/profile').then((res) => {
      const u = res.data.user;
      setForm({
        fullName: u.fullName || '',
        phoneNumber: u.phoneNumber || '',
        raisonSociale: u.raisonSociale || '',
        clientICE: u.clientICE || '',
        clientRC: u.clientRC || '',
        formeJuridique: u.formeJuridique || '',
      });
    }).catch(() => setError('Erreur chargement profil')).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/client/profile', form);
      setSaved(true);
      await refreshUser();
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="gold-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Mon profil</div>
        <div className="page-gold-rule" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} /> Informations personnelles
            </span>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label"><Phone size={14} /> Téléphone</label>
              <input className="form-input" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={18} /> Entreprise
            </span>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label className="form-label">Raison sociale</label>
              <input className="form-input" value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
            </div>
            <div className="form-row" style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><FileText size={14} /> ICE</label>
                <input className="form-input" value={form.clientICE} onChange={(e) => setForm({ ...form, clientICE: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label"><BadgeCheck size={14} /> RC</label>
                <input className="form-input" value={form.clientRC} onChange={(e) => setForm({ ...form, clientRC: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Forme juridique</label>
              <select className="form-input" value={form.formeJuridique} onChange={(e) => setForm({ ...form, formeJuridique: e.target.value })}>
                <option value="">Sélectionner...</option>
                <option value="SARL">SARL</option>
                <option value="SA">SA</option>
                <option value="SAS">SAS</option>
                <option value="SNC">SNC</option>
                <option value="EURL">EURL</option>
                <option value="EI">Entreprise Individuelle</option>
                <option value="Association">Association</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          {saved && <span style={{ fontSize: 13, color: 'var(--cl-success)' }}>✓ Profil mis à jour</span>}
        </div>
      </div>
    </div>
  );
}