import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught rendering exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'var(--bg-primary, #0f172a)',
            color: 'var(--text-primary, #f8fafc)',
            fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '32px',
              borderRadius: '16px',
              background: 'var(--bg-secondary, #1e293b)',
              border: '1px solid var(--border-color, #334155)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛡️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              Algo inesperado aconteceu
            </h2>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Um erro impediu a renderização da interface. A aplicação foi protegida contra tela branca.
            </p>

            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.85rem',
                  color: '#f87171',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary, #cbd5e1)' }}>
                  Detalhes técnicos do erro
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'var(--primary-color, #4f46e5)',
                  color: '#ffffff',
                }}
              >
                Tentar Novamente
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: '1px solid var(--border-color, #475569)',
                  background: 'transparent',
                  color: 'var(--text-primary, #f8fafc)',
                }}
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
