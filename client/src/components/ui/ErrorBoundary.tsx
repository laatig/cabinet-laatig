import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('ErrorBoundary caught:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: 40, textAlign: 'center',
        }}>
          <div className="error-boundary-icon" style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(212, 175, 55, 0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 8px', color: 'var(--cl-text-primary)' }}>Une erreur est survenue</h2>
          <p style={{ margin: '0 0 20px', color: 'var(--cl-text-muted)', maxWidth: 400, fontSize: 14 }}>
            {this.state.error?.message || 'Erreur inattendue'}
          </p>
          <button className="btn btn-primary" onClick={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}>
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
