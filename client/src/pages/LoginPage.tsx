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
      setError(msg || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
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
      setError(msg || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-seal">CL</div>
        <div className="login-left-brand">CABINET LAATIG</div>
        <div className="login-left-tagline">{t('app.tagline', lang)}</div>
        {mode === 'login' && (
          <div style={{ marginTop: 'auto', marginBottom: 40, textAlign: 'center', color: 'var(--cl-text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
            Vous êtes un nouveau client ?<br />
            Créez votre espace pour nous transmettre<br />
            vos documents comptables en toute sécurité.
          </div>
        )}
        <div className="login-left-footer">Maroc · Depuis 2009</div>
      </div>
      <div className="login-right">
        <div className="login-form-card">
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Connexion
            </button>
            <button
              className={`login-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => setMode('register')}
            >
              Inscription
            </button>
          </div>

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          {mode === 'login' ? (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Adresse e-mail</label>
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="expert@cabinet-laatig.ma" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe</label>
                <input className="form-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span style={{ color: 'var(--cl-text-secondary)', fontSize: 13 }}>
                  Pas encore de compte ?{' '}
                </span>
                <button type="button" onClick={() => setMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--cl-gold)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                  Créer un compte
                </button>
              </div>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Nom complet *</label>
                <input className="form-input" type="text" value={fullName}
                  onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Adresse e-mail *</label>
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mot de passe *</label>
                <input className="form-input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Min. 6 caractères" required />
              </div>
              <div className="form-group">
                <label className="form-label">Raison sociale</label>
                <input className="form-input" type="text" value={raisonSociale}
                  onChange={e => setRaisonSociale(e.target.value)} placeholder="Nom de votre entreprise" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">ICE</label>
                  <input className="form-input" type="text" value={clientICE}
                    onChange={e => setClientICE(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">RC</label>
                  <input className="form-input" type="text" value={clientRC}
                    onChange={e => setClientRC(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Forme juridique</label>
                  <select className="form-input" value={formeJuridique}
                    onChange={e => setFormeJuridique(e.target.value)}>
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
                  <input className="form-input" type="tel" value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)} />
                </div>
              </div>
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? 'Inscription...' : "S'inscrire"}
              </button>
            </form>
          )}
        </div>
        <div className="login-credit">
          Dirigé par <strong>Mustapha Atiq</strong><br />
          Expert-Comptable · Commissaire aux Comptes
        </div>
      </div>
    </div>
  );
}
