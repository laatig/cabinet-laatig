import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { getStatusClass, formatDate } from '../lib/utils';
import Modal from '../components/ui/Modal';
import api from '../lib/api';
import { Plus, Search } from 'lucide-react';
import type { Project } from '../types';

interface UserOption { id: string; email: string; fullName: string; clientICE?: string; }

export default function ProjectsPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    clientName: '',
    fiscalYearStart: '',
    fiscalYearEnd: '',
    auditType: 'legal_audit',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/projects').then((r) => setProjects(r.data.projects || [])),
      api.get('/owner/clients').then((r) => setClients(r.data.clients || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ clientName: '', fiscalYearStart: '', fiscalYearEnd: '', auditType: 'legal_audit' });
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ clientName: p.clientName, fiscalYearStart: p.fiscalYearStart?.slice(0, 10) || '', fiscalYearEnd: p.fiscalYearEnd?.slice(0, 10) || '', auditType: p.auditType });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editing) {
      await api.patch(`/projects/${editing.id}`, form);
    } else {
      await api.post('/projects', form);
    }
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.delete', lang))) return;
    await api.delete(`/projects/${id}`);
    fetchData();
  };

  const filtered = projects.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.clientName?.toLowerCase().includes(q) ||
      (p.fiscalYearStart && p.fiscalYearStart.includes(q))
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
              <div className="project-card-title">{p.clientName || `${t('project.list', lang)} #${p.id}`}</div>
              <div className="project-card-client">
                {p.clientICE && `ICE: ${p.clientICE}`}
              </div>
              <div className="project-card-meta">
                <span className="project-card-attr">{p.fiscalYearStart ? new Date(p.fiscalYearStart).getFullYear() : ''}</span>
                <span className="project-card-attr">{p.auditType}</span>
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
              <input className="form-input" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} placeholder={t('project.client', lang)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('project.fiscalYear', lang)}</label>
            <input className="form-input" type="date" value={form.fiscalYearStart} onChange={(e) => setForm((f) => ({ ...f, fiscalYearStart: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('tva.period', lang)}</label>
            <input className="form-input" type="date" value={form.fiscalYearEnd} onChange={(e) => setForm((f) => ({ ...f, fiscalYearEnd: e.target.value }))} />
          </div>
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
          <textarea className="form-input" placeholder={t('project.notes', lang)} rows={3} />
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
