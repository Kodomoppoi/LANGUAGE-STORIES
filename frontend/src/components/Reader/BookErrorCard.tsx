import React from 'react';
import { BookErrorInfo } from '../../types';
import { Settings, RefreshCw, X, AlertTriangle, Key, Clock, VolumeX, Activity } from 'lucide-react';

interface BookErrorCardProps {
  error: BookErrorInfo;
  onOpenSettings?: () => void;
  onRetry?: () => void;
  onDismiss: () => void;
  uiLanguage?: 'pt' | 'en';
}

export const BookErrorCard: React.FC<BookErrorCardProps> = ({
  error,
  onOpenSettings,
  onRetry,
  onDismiss,
  uiLanguage = 'pt',
}) => {
  const isPt = uiLanguage === 'pt';

  const getIcon = () => {
    switch (error.type) {
      case 'api_key_error':
        return <Key className="book-error-icon" size={28} />;
      case 'quota_exceeded':
        return <Clock className="book-error-icon" size={28} />;
      case 'service_unavailable':
        return <Activity className="book-error-icon" size={28} />;
      case 'tts_error':
        return <VolumeX className="book-error-icon" size={28} />;
      case 'generation_error':
      default:
        return <AlertTriangle className="book-error-icon" size={28} />;
    }
  };

  const getBadgeLabel = () => {
    switch (error.type) {
      case 'api_key_error':
        return isPt ? 'Chave de API do Gemini' : 'Gemini API Key';
      case 'quota_exceeded':
        return isPt ? 'Cota Excedida (Rate Limit)' : 'Rate Limit (429)';
      case 'service_unavailable':
        return isPt ? 'Alta Demanda do Google (503)' : 'Google High Demand (503)';
      case 'tts_error':
        return isPt ? 'Áudio / Voz TTS' : 'TTS Audio Voice';
      case 'generation_error':
      default:
        return isPt ? 'Erro de Geração' : 'Generation Error';
    }
  };

  return (
    <div className="book-error-card-container" role="alert">
      {/* Wax seal & header */}
      <div className="book-error-seal-wrapper">
        <div className={`book-error-seal seal-${error.type}`}>
          {getIcon()}
        </div>
        <span className="book-error-badge">{getBadgeLabel()}</span>
      </div>

      {/* Error Title */}
      <h3 className="book-error-title">{error.title}</h3>

      {/* Error Explanation */}
      <div className="book-error-explanation">
        <p>{error.message}</p>
      </div>

      {/* Resolution Checklist / Pedido para Arrumar */}
      {error.actionInstructions && error.actionInstructions.length > 0 && (
        <div className="book-error-resolution-box">
          <h4 className="resolution-heading">
            {isPt ? '📜 Como resolver este problema:' : '📜 How to resolve this issue:'}
          </h4>
          <ol className="resolution-list">
            {error.actionInstructions.map((step, idx) => (
              <li key={idx} className="resolution-item">
                <span className="step-number">{idx + 1}</span>
                <span className="step-text">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      <div className="book-error-actions">
        {error.actionType === 'open_settings' && onOpenSettings && (
          <button
            type="button"
            className="book-error-btn primary-action-btn"
            onClick={onOpenSettings}
          >
            <Settings size={18} />
            <span>{error.actionLabel || (isPt ? 'Abrir Configurações' : 'Open Settings')}</span>
          </button>
        )}

        {error.actionType === 'retry' && onRetry && (
          <button
            type="button"
            className="book-error-btn primary-action-btn"
            onClick={onRetry}
          >
            <RefreshCw size={18} />
            <span>{error.actionLabel || (isPt ? 'Tentar Novamente' : 'Try Again')}</span>
          </button>
        )}

        {onOpenSettings && error.actionType !== 'open_settings' && (
          <button
            type="button"
            className="book-error-btn secondary-action-btn"
            onClick={onOpenSettings}
            title={isPt ? 'Abrir Configurações' : 'Open Settings'}
          >
            <Settings size={16} />
            <span>{isPt ? 'Configurações' : 'Settings'}</span>
          </button>
        )}

        <button
          type="button"
          className="book-error-btn dismiss-action-btn"
          onClick={onDismiss}
        >
          <X size={16} />
          <span>{isPt ? 'Voltar ao Início' : 'Return to Home'}</span>
        </button>
      </div>
    </div>
  );
};
