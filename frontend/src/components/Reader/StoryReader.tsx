import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../../services/sampleStories';
import { TTSPlayer } from './TTSPlayer';
import { WordPopover } from './WordPopover';
import {
  BookOpen,
  Sparkles,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import { StoryToken } from '../../types';

export const StoryReader: React.FC = () => {
  const {
    currentStory,
    currentLanguage,
    currentPlayingSentenceIndex,
    openTokenPopover,
    settings,
    updateSettings,
    setIsQuizOpen,
    speakSingleToken,
    vocabularyVault,
  } = useApp();

  const [showTranslations, setShowTranslations] = useState(false);
  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  let sentenceCounter = 0;

  // Helper to get token's SRS status from vault
  const getTokenSRSStage = (token: StoryToken) => {
    const vaultWord = vocabularyVault.find(
      (v) => v.word === token.text && v.language === currentLanguage
    );
    return vaultWord?.srsMetrics?.stage || (token.isTargetWord ? 'new' : undefined);
  };

  return (
    <div className="reader-container">
      {/* Story Header & Metadata Bar */}
      <div className="reader-header">
        <div>
          <div className="story-meta-row">
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--srs-new-bg)',
                color: 'var(--flower-500)',
                border: '1px solid var(--flower-500)',
              }}
            >
              Level {currentStory.proficiency}
            </span>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Clock size={13} />
              ~{currentStory.estimatedReadingMinutes} min read
            </span>
            <span
              style={{
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              Theme: {currentStory.contextTheme}
            </span>
          </div>

          <h1 className="story-title">{currentStory.title}</h1>
          <div className="story-title-sub">{currentStory.titleTranslation}</div>
        </div>

        {/* Reader Display Toggles */}
        <div className="reader-controls-bar">
          {/* Furigana/Pinyin Toggle if language has ruby */}
          {langInfo?.hasRuby && (
            <label className="toggle-switch-label">
              <input
                type="checkbox"
                checked={settings.showRuby}
                onChange={(e) => updateSettings({ showRuby: e.target.checked })}
                style={{ accentColor: 'var(--flower-500)' }}
              />
              <span>Ruby ({langInfo.rubyType})</span>
            </label>
          )}

          {/* Bilingual Translations Toggle */}
          <button
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => setShowTranslations((prev) => !prev)}
            title="Toggle English sentence translations"
          >
            {showTranslations ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showTranslations ? 'Hide Translation' : 'Show Translation'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Story Canvas Text */}
      <div className={`story-text-canvas ${currentStory.isRTL ? 'rtl' : ''}`}>
        {currentStory.paragraphs.map((paragraph) => (
          <div key={paragraph.id} className="story-paragraph-wrapper">
            {paragraph.sentences.map((sentence) => {
              const thisIndex = sentenceCounter++;
              const isPlayingThis = currentPlayingSentenceIndex === thisIndex;

              return (
                <div
                  key={sentence.id}
                  className={`story-paragraph ${isPlayingThis ? 'active-speech' : ''}`}
                >
                  <p>
                    {sentence.tokens.map((token) => {
                      const srsStage = getTokenSRSStage(token);
                      const isTarget = token.isTargetWord;

                      return (
                        <span
                          key={token.id}
                          className={`word-token ${isTarget ? 'target-word' : ''} ${
                            settings.highlightSRS && srsStage ? `srs-${srsStage}` : ''
                          }`}
                          onClick={(e) => openTokenPopover(token, e)}
                          title="Click to look up word definition & audio"
                        >
                          {settings.showRuby && token.ruby ? (
                            <ruby>
                              {token.text}
                              <rt>{token.ruby}</rt>
                            </ruby>
                          ) : (
                            token.text
                          )}
                        </span>
                      );
                    })}
                  </p>

                  {/* Sentence Translation */}
                  {showTranslations && (
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                        marginTop: '6px',
                        direction: 'ltr',
                        textAlign: 'left',
                      }}
                    >
                      {sentence.translation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Post-Reading Retention Quiz Trigger Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--bg-surface), var(--srs-new-bg))',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--flower-500)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255, 115, 0, 0.4)',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
              Finished Reading? Test Your Retention!
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Complete the 3-question mini-quiz to feed your Spaced Repetition (SM-2) memory curve.
            </p>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ width: 'auto', padding: '10px 20px' }}
          onClick={() => setIsQuizOpen(true)}
        >
          <CheckCircle size={17} />
          <span>Iniciar Mini-Quiz</span>
        </button>
      </div>

      {/* Floating Word Popover Tooltip */}
      <WordPopover />

      {/* Docked Neural TTS Player */}
      <TTSPlayer />
    </div>
  );
};
