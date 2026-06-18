import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import { formatDate } from '../lib/utils';
import api from '../lib/api';
import { Users, Search, Mail, Phone, FileText, ChevronRight } from 'lucide-react';

interface ClientUser {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  raisonSociale?: string;
  clientICE?: string;
  phoneNumber?: string;
  createdAt: string;
  _count: { projects: number };
}

export default function OwnerClientsPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/owner/clients')
      .then((r) => setClients(r.data.clients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? clients.filter((c) =>
        c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.raisonSociale?.toLowerCase().includes(search.toLowerCase()) ||
        c.clientICE?.includes(search)
      )
    : clients;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-title">{t('clients.title', lang)}</div>
            <div className="page-gold-rule" />
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
        <span style={{ fontSize: 12, color: 'var(--cl-text-muted)' }}>
          {clients.length} client{clients.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="gold-spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <div className="empty-state-title">{t('clients.empty', lang)}</div>
        </div>
      ) : (
        <div className="panel">
          <div className="panel-body" style={{ padding: 0 }}>
            {filtered.map((client) => (
              <div
                key={client.id}
                className="audit-trail-item"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/owner/projects?clientId=${client.id}`)}
              >
                <div className="audit-trail-icon" style={{ background: 'rgba(201,168,76,0.1)', color: 'var(--cl-gold)' }}>
                  <Users size={16} />
                </div>
                <div className="audit-trail-content" style={{ flex: 1 }}>
                  <div className="audit-trail-action" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{client.fullName}</strong>
                    {client.emailVerified && (
                      <span className="status-pill verified" style={{ fontSize: 9 }}>Vérifié</span>
                    )}
                    {client.raisonSociale && (
                      <span style={{ fontSize: 12, color: 'var(--cl-text-muted)' }}>{client.raisonSociale}</span>
                    )}
                  </div>
                  <div className="audit-trail-detail" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={12} /> {client.email}
                    </span>
                    {client.phoneNumber && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> {client.phoneNumber}
                      </span>
                    )}
                    {client.clientICE && (
                      <span>ICE: {client.clientICE}</span>
                    )}
                    <span><FileText size={12} /> {client._count?.projects || 0} projet{(client._count?.projects || 0) !== 1 ? 's' : ''}</span>
                    <span>Inscrit le {formatDate(client.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--cl-text-muted)' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
