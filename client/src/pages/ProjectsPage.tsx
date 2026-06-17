import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { getStatusClass, formatDate } from '../lib/utils';
import Modal from '../components/ui/Modal';
import api from '../lib/api';
import { Plus, Search } from 'lucide-react';
import type { Project, Client } from '../types';

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    clientId: '',
    fiscalYear: '',
    auditType: 'legal_audit',
    notes: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/projects').then((r) => setProjects(r.data.data || r.data)),
      api.get('/clients').then((r) => setClients(r.data.data || r.data)),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ clientId: '', fiscalYear: new Date().getFullYear().toString(), auditType: 'legal_audit', notes: '' });
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ clientId: String(p.clientId), fiscalYear: p.fiscalYearStart, auditType: p.auditType, notes: p.notes });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = { ...form, clientId: Number(form.clientId) };
    if (editing) {
      await api.patch(`/projects/${editing.id}`, payload);
    } else {
      await api.post('/projects', payload);
    }
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce projet ?')) return;
    await api.delete(`/projects/${id}`);
    fetchData();
  };

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.client?.name?.toLowerCase().includes(q) ||
      p.fiscalYearStart.includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('project.list', lang)}</div>
            <div className="page-gold-rule" />
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> {t('project.create', lang)}
            </button>
          </div>
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
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={48} />
          <div className="empty-state-title">{t('project.create', lang)}</div>
          <div className="empty-state-desc">{t('table.noData', lang)}</div>
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((p) => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-card-title">{p.client?.name || `Projet #${p.id}`}</div>
              <div className="project-card-client">
                {p.client?.ice && `ICE: ${p.client.ice}`}
              </div>
              <div className="project-card-meta">
                <span className="project-card-attr">{p.fiscalYearStart}</span>
                <span className="project-card-attr">{p.auditType === 'legal_audit' ? 'Audit Légal' : p.auditType}</span>
                <span className={`status-pill ${getStatusClass(p.status)}`}>{p.status}</span>
                <span className={`status-pill ${getStatusClass(p.dossierStatus)}`}>{p.dossierStatus}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                  {t('common.edit', lang)}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--cl-danger)' }} onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}>
                  {t('common.delete', lang)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? t('project.edit', lang) : t('project.create', lang)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('common.cancel', lang)}</button>
            <button className="btn btn-primary" onClick={handleSave}>{t('common.save', lang)}</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">{t('project.client', lang)}</label>
          <select className="form-input form-select" value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}>
            <option value="">Sélectionner un client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.ice}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('project.fiscalYear', lang)}</label>
          <input className="form-input" value={form.fiscalYear} onChange={(e) => setForm((f) => ({ ...f, fiscalYear: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('project.auditType', lang)}</label>
          <select className="form-input form-select" value={form.auditType} onChange={(e) => setForm((f) => ({ ...f, auditType: e.target.value }))}>
            <option value="legal_audit">Audit Légal</option>
            <option value="contractual_audit">Audit Contractuel</option>
            <option value="tax_audit">Audit Fiscal</option>
            <option value="social_audit">Audit Social</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t('project.notes', lang)}</label>
          <textarea className="form-input" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
        </div>
      </Modal>
    </div>
  );
}

function FolderOpen(props: { size?: number }) {
  return (
    <svg width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
