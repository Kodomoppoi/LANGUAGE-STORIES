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
import { createDefaultSRSMetrics } from '../../services/srsEngine';
import { DictionaryEntry } from '../../types';

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
      srsMetrics: createDefaultSRSMetrics(),
      createdAt: new Date().toISOString(),
    };
    addWordToVault(newEntry);
  };

  const handleToggleStar = () => {
    if (!isInVault) {
      handleAddToVault();
    }
    if (vaultEntry) {
      toggleStarWord(vaultEntry.id);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="word-popover"
      style={{
        left: `${popoverPosition.x}px`,
        top: `${popoverPosition.y}px`,
      }}
    >
      {/* Header with Term, Audio Pronounce, and Close */}
      <div className="popover-header">
        <div>
          <div className="popover-term">{activeToken.text}</div>
          {activeToken.ruby && (
            <div className="popover-phonetic">{activeToken.ruby}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="tts-btn-icon"
            onClick={() => speakSingleToken(activeToken)}
            title="Listen to pronunciation"
          >
            <Volume2 size={16} />
          </button>
          <button
            className="tts-btn-icon"
            onClick={closeTokenPopover}
            title="Close popover"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Part of Speech Pill & Target Word Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {activeToken.partOfSpeech && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-input)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            {activeToken.partOfSpeech}
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
      </div>

      {/* Translation & Context Details */}
      <div className="popover-translation">
        {activeToken.translation || 'Click to explore translation'}
      </div>

      {activeToken.explanation && (
        <div className="popover-details">
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Context Note:</div>
          {activeToken.explanation}
        </div>
      )}

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
              <span>In Vault</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>Add to Vault</span>
            </>
          )}
        </button>

        <button
          className="tts-btn-icon"
          onClick={handleToggleStar}
          title={isStarred ? 'Unstar word' : 'Star for focused review'}
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
