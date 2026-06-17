import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/translations';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="login-seal">MA</div>
        <div className="login-left-brand">CABINET LAATIG</div>
        <div className="login-left-tagline">{t('app.tagline', lang)}</div>
        <div className="login-left-footer">Maroc · Depuis 2009</div>
      </div>
      <div className="login-right">
        <div className="login-form-card">
          <div className="login-welcome">{t('login.welcome', lang)}</div>
          <div className="login-subtitle">{t('login.subtitle', lang)}</div>

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('login.email', lang)}</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="expert@cabinet-laatig.ma"
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('login.password', lang)}</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? t('common.loading', lang) : t('login.submit', lang)}
            </button>
          </form>
        </div>
        <div className="login-credit">
          {t('login.credit', lang)} <strong>Mustapha Atiq</strong><br />
          Expert-Comptable · Commissaire aux Comptes
        </div>
      </div>
    </div>
  );
}
