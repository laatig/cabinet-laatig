import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../lib/translations';
import api from '../lib/api';
import { Save, Key, User } from 'lucide-react';

export default function SettingsPage() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await api.patch('/auth/me', { name, email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
  };

  const handleGenerateKey = async () => {
    try {
      const res = await api.post('/settings/api-key');
      setApiKey(res.data.key);
    } catch { /* ignore */ }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">{t('settings.title', lang)}</div>
        <div className="page-gold-rule" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} /> {t('settings.profile', lang)}
            </span>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label className="form-label">{t('login.name', lang)}</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('login.email', lang)}</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={handleSaveProfile}>
              <Save size={16} /> {t('common.save', lang)}
            </button>
            {saved && <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--cl-success)' }}>✓ Enregistré</span>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} /> {t('settings.apiKey', lang)}
            </span>
          </div>
          <div className="panel-body">
            <div className="form-group">
              <label className="form-label">{t('settings.apiKey', lang)}</label>
              <div style={{ fontSize: 13, color: 'var(--cl-text-secondary)', marginBottom: 8 }}>
                {t('settings.apiKeyDesc', lang)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  value={apiKey}
                  readOnly
                  placeholder="Cliquer sur Générer pour créer une clé"
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                <button className="btn btn-outline" onClick={handleGenerateKey}>Générer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
