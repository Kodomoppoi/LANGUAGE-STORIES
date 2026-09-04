import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, BookOpen, Search, CheckCircle2, Feather, AlertCircle, X } from 'lucide-react';

export const StoryGenerationMascot: React.FC = () => {
  const { mascotState, cancelGeneration } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (mascotState.isActive) {
      setIsVisible(true);
    } else {
      // Pequeno fade-out
      const timer = setTimeout(() => setIsVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [mascotState.isActive]);

  if (!isVisible && !mascotState.isActive) return null;

  const { stage, message, action, counts, progress } = mascotState;

  // Determina índice do passo atual
  let currentStep = 1;
  if (stage === 'stage_curation_done') currentStep = 2;
  if (stage === 'stage_start:generation') currentStep = 3;
  if (stage === 'stage_done') currentStep = 4;

  return (
    <div className={`mascot-overlay ${mascotState.isActive ? 'active' : 'closing'}`}>
      <div className="mascot-card">
        {/* Botão de Fechar / Cancelar */}
        {cancelGeneration && (
          <button
            className="mascot-close-btn"
            onClick={cancelGeneration}
            title="Cancelar geração"
          >
            <X size={16} />
          </button>
        )}

        {/* Ilustração Dinâmica do Mascote */}
        <div className="mascot-visual-container">
          <div className={`mascot-avatar-wrapper ${action}`}>
            {action === 'searching' && (
              <div className="mascot-illustration searching">
                {/* Mascote com lupa e livro */}
                <svg viewBox="0 0 120 120" className="mascot-svg">
                  <circle cx="60" cy="60" r="54" fill="var(--flower-100)" />
                  {/* Orelhas */}
                  <circle cx="36" cy="34" r="14" fill="var(--flower-700)" />
                  <circle cx="84" cy="34" r="14" fill="var(--flower-700)" />
                  <circle cx="36" cy="34" r="7" fill="var(--flower-200)" />
                  <circle cx="84" cy="34" r="7" fill="var(--flower-200)" />
                  {/* Cabeça */}
                  <circle cx="60" cy="62" r="38" fill="var(--flower-500)" />
                  {/* Rosto / Bochechas */}
                  <ellipse cx="60" cy="70" rx="26" ry="20" fill="var(--flower-100)" />
                  <circle cx="43" cy="72" r="5" fill="#fca5a5" opacity="0.6" />
                  <circle cx="77" cy="72" r="5" fill="#fca5a5" opacity="0.6" />
                  {/* Olhos curiosos */}
                  <circle cx="48" cy="62" r="4.5" fill="#292524" />
                  <circle cx="72" cy="62" r="4.5" fill="#292524" />
                  <circle cx="50" cy="60" r="1.5" fill="#ffffff" />
                  <circle cx="74" cy="60" r="1.5" fill="#ffffff" />
                  {/* Focinho */}
                  <polygon points="57,68 63,68 60,72" fill="#78350f" />
                  {/* Livro na mão */}
                  <path d="M42,88 Q60,82 78,88 L78,102 Q60,96 42,102 Z" fill="#b45309" />
                  {/* Lupa animada */}
                  <circle cx="82" cy="56" r="14" stroke="var(--amber-500)" strokeWidth="4" fill="rgba(254,243,199,0.4)" className="magnifier-glass" />
                  <line x1="92" y1="66" x2="104" y2="78" stroke="var(--amber-600)" strokeWidth="5" strokeLinecap="round" />
                </svg>
                <div className="mascot-bubble-search">
                  <Search size={18} className="spin-slow" />
                </div>
              </div>
            )}

            {action === 'celebrating' && (
              <div className="mascot-illustration celebrating">
                <svg viewBox="0 0 120 120" className="mascot-svg bounce-mascot">
                  <circle cx="60" cy="60" r="54" fill="#fef3c7" />
                  <circle cx="34" cy="30" r="14" fill="var(--flower-700)" />
                  <circle cx="86" cy="30" r="14" fill="var(--flower-700)" />
                  <circle cx="34" cy="30" r="7" fill="var(--flower-200)" />
                  <circle cx="86" cy="30" r="7" fill="var(--flower-200)" />
                  <circle cx="60" cy="60" r="38" fill="var(--flower-500)" />
                  <ellipse cx="60" cy="68" rx="26" ry="20" fill="var(--flower-100)" />
                  <circle cx="43" cy="70" r="6" fill="#f87171" opacity="0.6" />
                  <circle cx="77" cy="70" r="6" fill="#f87171" opacity="0.6" />
                  {/* Olhos sorridentes em arco */}
                  <path d="M44,60 Q48,54 52,60" fill="none" stroke="#292524" strokeWidth="3" strokeLinecap="round" />
                  <path d="M68,60 Q72,54 76,60" fill="none" stroke="#292524" strokeWidth="3" strokeLinecap="round" />
                  <path d="M54,73 Q60,80 66,73" fill="none" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Estrelinhas de comemoração */}
                  <polygon points="26,45 29,52 36,52 30,56 32,63 26,58 20,63 22,56 16,52 23,52" fill="#f59e0b" className="sparkle-1" />
                  <polygon points="94,40 97,47 104,47 98,51 100,58 94,53 88,58 90,51 84,47 91,47" fill="#f59e0b" className="sparkle-2" />
                </svg>
                <div className="mascot-bubble-celebrate">
                  <Sparkles size={20} color="#f59e0b" />
                </div>
              </div>
            )}

            {action === 'writing' && (
              <div className="mascot-illustration writing">
                <svg viewBox="0 0 120 120" className="mascot-svg">
                  <circle cx="60" cy="60" r="54" fill="var(--bg-input)" />
                  <circle cx="36" cy="34" r="14" fill="var(--flower-700)" />
                  <circle cx="84" cy="34" r="14" fill="var(--flower-700)" />
                  <circle cx="36" cy="34" r="7" fill="var(--flower-200)" />
                  <circle cx="84" cy="34" r="7" fill="var(--flower-200)" />
                  <circle cx="60" cy="62" r="38" fill="var(--flower-500)" />
                  <ellipse cx="60" cy="70" rx="26" ry="20" fill="var(--flower-100)" />
                  {/* Olhos focados escrevendo */}
                  <circle cx="48" cy="63" r="4" fill="#292524" />
                  <circle cx="72" cy="63" r="4" fill="#292524" />
                  {/* Pergaminho e Pincel */}
                  <rect x="35" y="85" width="50" height="24" rx="4" fill="#fffbeb" stroke="#d97706" strokeWidth="2" />
                  <line x1="42" y1="92" x2="65" y2="92" stroke="#d97706" strokeWidth="2" strokeDasharray="3 2" />
                  <line x1="42" y1="98" x2="75" y2="98" stroke="#d97706" strokeWidth="2" strokeDasharray="3 2" />
                  {/* Pincel de Caligrafia oscilando */}
                  <g className="quill-writing-anim">
                    <line x1="75" y1="96" x2="98" y2="70" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
                    <polygon points="73,98 78,94 76,102" fill="#1c1917" />
                  </g>
                </svg>
                <div className="mascot-bubble-write">
                  <Feather size={18} color="var(--flower-400)" />
                </div>
              </div>
            )}

            {action === 'presenting' && (
              <div className="mascot-illustration presenting">
                <svg viewBox="0 0 120 120" className="mascot-svg celebrate-bounce">
                  <circle cx="60" cy="60" r="54" fill="var(--srs-mastered-bg)" />
                  <circle cx="36" cy="32" r="14" fill="var(--flower-700)" />
                  <circle cx="84" cy="32" r="14" fill="var(--flower-700)" />
                  <circle cx="60" cy="60" r="38" fill="var(--flower-500)" />
                  <ellipse cx="60" cy="68" rx="26" ry="20" fill="var(--flower-100)" />
                  <circle cx="44" cy="60" r="4.5" fill="#292524" />
                  <circle cx="76" cy="60" r="4.5" fill="#292524" />
                  <path d="M52,72 Q60,80 68,72" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                  {/* Livro aberto dourado */}
                  <path d="M30,88 Q60,78 90,88 L90,106 Q60,96 30,106 Z" fill="#16a34a" />
                  <line x1="60" y1="80" x2="60" y2="100" stroke="#ffffff" strokeWidth="2" />
                </svg>
                <div className="mascot-bubble-done">
                  <CheckCircle2 size={22} color="#16a34a" />
                </div>
              </div>
            )}

            {action === 'alert' && (
              <div className="mascot-illustration alert">
                <svg viewBox="0 0 120 120" className="mascot-svg">
                  <circle cx="60" cy="60" r="54" fill="#fee2e2" />
                  <circle cx="60" cy="60" r="38" fill="var(--flower-500)" />
                  <ellipse cx="60" cy="70" rx="26" ry="20" fill="var(--flower-100)" />
                  <circle cx="48" cy="63" r="4" fill="#292524" />
                  <circle cx="72" cy="63" r="4" fill="#292524" />
                  <path d="M54,76 Q60,70 66,76" fill="none" stroke="#78350f" strokeWidth="2" />
                </svg>
                <div className="mascot-bubble-alert">
                  <AlertCircle size={20} color="#ef4444" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Título & Mensagem da Etapa Atual */}
        <div className="mascot-info">
          <div className="mascot-stage-badge">
            {stage === 'stage_start:curation' && 'ETAPA 1: CURADORIA DE VOCABULÁRIO'}
            {stage === 'stage_curation_done' && 'VOCABULÁRIO DEFINIDO (SRS)'}
            {stage === 'stage_start:generation' && 'ETAPA 2: GERAÇÃO DA NARRATIVA'}
            {stage === 'stage_done' && 'HISTÓRIA PRONTA! ✨'}
            {stage === 'error' && 'AVISO DO ASSISTENTE'}
          </div>

          <h3 className="mascot-headline">
            {stage === 'stage_start:curation' && 'Curando Vocabulário Ideal'}
            {stage === 'stage_curation_done' && 'Palavras Alvo Selecionadas!'}
            {stage === 'stage_start:generation' && 'Escrevendo sua História'}
            {stage === 'stage_done' && 'Tudo Pronto para a Leitura!'}
            {stage === 'error' && 'Ops, ocorreu um contratempo'}
          </h3>

          <p className="mascot-message">{message}</p>

          {/* Se houver contagem de palavras curadas */}
          {counts && (counts.newWordsCount > 0 || counts.reviewWordsCount > 0) && (
            <div className="mascot-stats-pills">
              <span className="mascot-pill new-words">
                +{counts.newWordsCount} Novas Palavras
              </span>
              <span className="mascot-pill review-words">
                {counts.reviewWordsCount} em Reforço (SRS)
              </span>
            </div>
          )}
        </div>

        {/* Barra de Progresso e Steps em Pipeline */}
        <div className="mascot-progress-section">
          <div className="mascot-progress-track">
            <div
              className="mascot-progress-fill"
              style={{ width: `${Math.max(10, progress)}%` }}
            />
          </div>

          <div className="mascot-steps-indicator">
            <div className={`mascot-step-item ${currentStep >= 1 ? 'active' : ''}`}>
              <div className="step-dot" />
              <span>1. Curadoria</span>
            </div>
            <div className={`mascot-step-item ${currentStep >= 2 ? 'active' : ''}`}>
              <div className="step-dot" />
              <span>2. Seleção</span>
            </div>
            <div className={`mascot-step-item ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-dot" />
              <span>3. Narrativa</span>
            </div>
            <div className={`mascot-step-item ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-dot" />
              <span>4. Glossário</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
