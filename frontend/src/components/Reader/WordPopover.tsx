import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Volume2,
  Star,
  Plus,
  Check,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { createDefaultSRSMetrics, getStatusColor, getRepetitionWeight } from '../../services/srsEngine';
import { DictionaryEntry, ChineseTraits } from '../../types';

export const WordPopover: React.FC = () => {
  const {
    activeToken,
    closeTokenPopover,
    currentLanguage,
    currentProficiency,
    vocabularyVault,
    addWordToVault,
    toggleStarWord,
    speakSingleToken,
    settings,
    t,
  } = useApp();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Não fecha se o usuário estiver clicando em outro token da história (troca dinâmica imediata)
      if (target.closest('.word-token')) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(target)) {
        closeTokenPopover();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTokenPopover();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeTokenPopover]);

  if (!activeToken) return null;

  // Check if token already exists in vault
  const vaultEntry = vocabularyVault.find(
    (w) => w.word === activeToken.text && w.language === currentLanguage
  );
  const isInVault = Boolean(vaultEntry);
  const isStarred = vaultEntry?.isStarred || false;
  const isPinned = vaultEntry?.isPinned || isStarred;

  // Traços linguísticos (especialmente Mandarim)
  const traits = (vaultEntry?.traits || activeToken.traits || {}) as ChineseTraits;
  const radicals = traits.radicals || (traits.radicalChar ? `${traits.radicalChar} (${traits.radicalMeaning || ''})` : undefined);
  const hskLevel = traits.hskLevel;

  // Pontuação contínua de saber e cor de status (0% a 100%)
  const masteryScore = vaultEntry?.masteryScore ?? activeToken.masteryScore ?? 25;
  const statusColor = vaultEntry?.statusColor ?? activeToken.statusColor ?? getStatusColor(masteryScore);
  const repetitionWeight = vaultEntry?.repetitionWeight ?? getRepetitionWeight(masteryScore, isPinned);

  const handleAddToVault = () => {
    if (isInVault) return;
    const newEntry: DictionaryEntry = {
      id: `vocab-${Date.now()}`,
      word: activeToken.text,
      ruby: activeToken.ruby,
      translation: activeToken.translation || 'Target word',
      partOfSpeech: activeToken.partOfSpeech || 'Noun',
      definition: activeToken.explanation || `Usage of ${activeToken.text} in context.`,
      exampleSentence: activeToken.text,
      exampleTranslation: activeToken.translation || '',
      language: currentLanguage,
      proficiency: currentProficiency,
      isStarred: false,
      isPinned: false,
      masteryScore,
      statusColor,
      repetitionWeight,
      lookedUpCount: 1, // Já conta esta consulta
      traits: activeToken.traits,
      occurrences: 1,
      lifetimeOccurrences: 1,
      srsMetrics: createDefaultSRSMetrics(),
      createdAt: new Date().toISOString(),
    };
    addWordToVault(newEntry);
  };

  const handleToggleStar = () => {
    if (!isInVault) {
      handleAddToVault();
    }
    const targetId = vaultEntry?.id || `vocab-${Date.now()}`;
    toggleStarWord(targetId);
  };

  return (
    <aside
      ref={panelRef}
      className="word-lateral-panel"
      role="complementary"
      aria-label={t('lateralPanelTitle')}
    >
      {/* Barra Superior do Painel Lateral */}
      <div className="lateral-panel-top-bar">
        <div className="lateral-panel-tag">
          <BookOpen size={13} />
          <span>{t('lateralPanelTitle')}</span>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="tts-btn-icon"
            onClick={() => speakSingleToken(activeToken)}
            title={t('listenAudio')}
          >
            <Volume2 size={16} />
          </button>
          <button
            className="lateral-panel-close-btn"
            onClick={closeTokenPopover}
            title={t('closeBtn')}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Cabeçalho da Palavra, Fonética e Classe */}
      <div>
        <div className="lateral-word-title-row">
          <div>
            <span className="lateral-word-main">{activeToken.text}</span>
            {activeToken.ruby && (
              <span className="lateral-word-ruby">[{activeToken.ruby}]</span>
            )}
          </div>
        </div>

        {activeToken.partOfSpeech && (
          <span className="lateral-word-pos">{activeToken.partOfSpeech}</span>
        )}
      </div>

      {/* Badges de Traços Linguísticos e SRS */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {hskLevel && (
          <span className="trait-hsk-badge" title={t('hskLabel')}>
            {hskLevel}
          </span>
        )}

        {activeToken.isTargetWord && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--srs-new-bg)',
              color: 'var(--flower-500)',
              border: '1px solid var(--flower-500)',
            }}
          >
            Story Target 🎯
          </span>
        )}

        {isPinned && (
          <span className="pinned-star-badge" title={t('pinWord')}>
            ⭐ {t('pinWord')}
          </span>
        )}
      </div>

      {/* Traço de Radical Chinês (部首) */}
      {radicals && (
        <div>
          <span className="trait-radical-badge" title={t('radicalsLabel')}>
            <span className="radical-char">部首</span> {radicals}
          </span>
        </div>
      )}

      {/* Caixa de Tradução Contextual */}
      <div className="lateral-translation-box">
        <div className="lateral-translation-label">{t('contextMeaningLabel')}</div>
        <div className="lateral-translation-text">
          {traits.contextMeaning || activeToken.translation || 'Tradução em contexto'}
        </div>
        {activeToken.explanation && (
          <div className="lateral-explanation-text">
            {activeToken.explanation}
          </div>
        )}
      </div>

      {/* Retenção Contínua SRS (0-100%) e Curva de Esquecimento */}
      <div style={{ padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {t('masteryLabel')} SRS
          </span>
          <span className={`srs-status-badge ${statusColor}`} style={{ fontSize: '0.7rem' }}>
            {masteryScore}% • {statusColor === 'orange' ? 'Crítico (3-4x)' : statusColor === 'yellow' ? 'Em Progresso (2x)' : 'Dominada (1x)'}
          </span>
        </div>
        <div className="retention-meter-bar">
          <div className={`retention-meter-fill ${statusColor}`} style={{ width: `${masteryScore}%` }} />
        </div>
      </div>

      {/* Botões de Ação: Salvar no Cofre e Fixar */}
      <div className="popover-actions">
        <button
          className="btn-secondary"
          style={{ flex: 1, padding: '8px 12px', fontSize: '0.82rem' }}
          onClick={handleAddToVault}
          disabled={isInVault}
        >
          {isInVault ? (
            <>
              <Check size={14} color="#22c55e" />
              <span>{t('inVaultBadge')}</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>{t('addToVaultBtn')}</span>
            </>
          )}
        </button>

        <button
          className="tts-btn-icon"
          onClick={handleToggleStar}
          title={isStarred ? t('unpinWord') : t('pinWord')}
          style={{
            color: isStarred ? '#ffc107' : 'var(--text-muted)',
          }}
        >
          <Star size={17} fill={isStarred ? '#ffc107' : 'none'} />
        </button>
      </div>
    </aside>
  );
};
