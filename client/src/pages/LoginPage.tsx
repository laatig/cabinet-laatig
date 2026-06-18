import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type RegisterData } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';
import api from '../lib/api';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [raisonSociale, setRaisonSociale] = useState('');
  const [clientICE, setClientICE] = useState('');
  const [clientRC, setClientRC] = useState('');
  const [formeJuridique, setFormeJuridique] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('common.error', lang));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t('common.error', lang));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data: RegisterData = { email, password, fullName, phoneNumber };
      if (raisonSociale) data.raisonSociale = raisonSociale;
      if (clientICE) data.clientICE = clientICE;
      if (clientRC) data.clientRC = clientRC;
      if (formeJuridique) data.formeJuridique = formeJuridique;
      await register(data);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || t('common.error', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-brand">CABINET LAATIG</div>
        <div className="login-tagline-line">Intelligence Artificielle</div>
        <div className="login-tagline-line">Expertise Humaine</div>
        <div className="login-tagline-line">Certification Marocaine</div>
        <div className="login-seal">MA</div>
        <div style={{ marginTop: 'auto', marginBottom: 40 }}>
          <div style={{ fontSize: 11, color: 'var(--cl-gold-dim)', letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 2 }}>
            Plateforme d'expertise comptable et d'audit
          </div>
          <div style={{ fontSize: 11, color: 'var(--cl-gold-dim)', letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 2 }}>
            opérée par <span style={{ color: 'var(--cl-gold)' }}>Mustapha Atiq</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--cl-gold-dim)', letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 2 }}>
            Master CCA — Université Ibn Zohr, Agadir
          </div>
        </div>
        <div style={{ fontSize: 9, color: 'var(--cl-text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Cabinet Laatig — Agadir · Maroc
        </div>
      </div>
      <div className="login-right">
        <div className="login-form-card">
          <div className="login-welcome">
            {mode === 'login' ? t('login.welcome', lang) : t('login.registerTitle', lang)}
          </div>
          <div className="login-subtitle">
            {mode === 'login'
              ? t('login.subtitle', lang)
              : t('login.registerTitle', lang)}
          </div>

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">{t('login.email', lang)}</label>
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="expert@cabinetlaatig.ma" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">{t('login.password', lang)}</label>
                <input className="form-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? t('common.loading', lang) : t('login.submit', lang)}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" onClick={() => setMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--cl-gold-dim)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.04em' }}>
                  {t('login.noAccount', lang)} {t('login.register', lang)}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">{t('login.name', lang)} *</label>
                <input className="form-input" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('login.email', lang)} *</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('login.password', lang)} *</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 caractères" required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('login.name', lang)}</label>
                <input className="form-input" type="text" value={raisonSociale} onChange={e => setRaisonSociale(e.target.value)} placeholder="Nom de votre entreprise" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ICE</label>
                  <input className="form-input" type="text" value={clientICE} onChange={e => setClientICE(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">RC</label>
                  <input className="form-input" type="text" value={clientRC} onChange={e => setClientRC(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Forme juridique</label>
                  <select className="form-input" value={formeJuridique} onChange={e => setFormeJuridique(e.target.value)}>
                    <option value="">Sélectionner...</option>
                    <option value="SARL">SARL</option>
                    <option value="SA">SA</option>
                    <option value="SNC">SNC</option>
                    <option value="SAS">SAS</option>
                    <option value="EI">Entreprise Individuelle</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? t('common.loading', lang) : t('login.registerSubmit', lang)}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button type="button" onClick={() => setMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--cl-gold-dim)', cursor: 'pointer', fontSize: 12, letterSpacing: '0.04em' }}>
                  {t('login.noAccount', lang)} {t('login.submit', lang)}
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="login-credit">
          Plateforme d'expertise comptable et d'audit<br />
          opérée par <strong>Mustapha Atiq</strong><br />
          <span style={{ fontSize: 10, color: 'var(--cl-text-muted)' }}>Master CCA — Université Ibn Zohr, Agadir</span>
        </div>
      </div>
    </div>
  );
}
