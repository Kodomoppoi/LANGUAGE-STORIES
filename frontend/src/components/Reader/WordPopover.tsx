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
    popoverPosition,
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

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closeTokenPopover();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeTokenPopover]);

  if (!activeToken || !popoverPosition) return null;

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
    <div
      ref={popoverRef}
      className="word-popover-card"
      style={{
        top: popoverPosition.y,
        left: popoverPosition.x,
      }}
    >
      {/* Header with Word, Phonetic & Audio */}
      <div className="popover-header">
        <div>
          <div className="popover-word">
            {activeToken.text}
            {activeToken.ruby && (
              <span className="popover-ruby">[{activeToken.ruby}]</span>
            )}
          </div>
          {activeToken.partOfSpeech && (
            <span className="popover-pos">{activeToken.partOfSpeech}</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="tts-btn-icon"
            onClick={() => speakSingleToken(activeToken)}
            title={t('listenAudio')}
          >
            <Volume2 size={16} />
          </button>
          <button className="tts-btn-icon" onClick={closeTokenPopover} title={t('closeBtn')}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Badges de Traços Linguísticos e SRS */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
        {hskLevel && (
          <span className="trait-hsk-badge" title="Nível de Proficiência HSK">
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
          <span className="pinned-star-badge" title="Palavra fixada: prioridade máxima no prompt e repetição">
            ⭐ {t('pinWord')}
          </span>
        )}
      </div>

      {/* Traço de Radical Chinês (部首) */}
      {radicals && (
        <div style={{ marginTop: '4px' }}>
          <span className="trait-radical-badge" title="Radical estrutural do caractere (部首) e significado">
            <span className="radical-char">部首</span> {radicals}
          </span>
        </div>
      )}

      {/* Translation & Context Details */}
      <div className="popover-translation">
        {traits.contextMeaning || activeToken.translation || 'Click to explore translation'}
      </div>

      {activeToken.explanation && (
        <div className="popover-details">
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{t('contextMeaningLabel')}:</div>
          {activeToken.explanation}
        </div>
      )}

      {/* Retenção Contínua SRS (0-100%) e Curva de Esquecimento */}
      <div style={{ marginTop: '8px', padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
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

      {/* Action Buttons: Add to Vault / Star */}
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
              <span>{settings.uiLanguage === 'pt' ? 'No Cofre' : 'In Vault'}</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>{settings.uiLanguage === 'pt' ? 'Salvar no Cofre' : 'Add to Vault'}</span>
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
    </div>
  );
};
