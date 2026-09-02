import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WordPopover } from './WordPopover';
import { TTSPlayer } from './TTSPlayer';
import {
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../services/sampleStories';
import { StoryToken, SRSStage } from '../../types';

export const StoryReader: React.FC = () => {
  const {
    currentStory,
    currentLanguage,
    currentProficiency,
    settings,
    updateSettings,
    openTokenPopover,
    currentPlayingSentenceIndex,
    vocabularyVault,
    setIsQuizOpen,
  } = useApp();

  const [showTranslations, setShowTranslations] = useState(false);

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  // Map vocabulary vault for instant O(1) SRS stage resolution
  const vaultMap = useMemo(() => {
    const map = new Map<string, typeof vocabularyVault[0]>();
    vocabularyVault.forEach((v) => {
      map.set(`${v.language}:${v.word}`, v);
    });
    return map;
  }, [vocabularyVault]);

  // Lookup SRS Stage for a given token
  const getTokenSRSStage = (token: StoryToken): SRSStage | null => {
    const vaultWord = vaultMap.get(`${currentStory.language}:${token.text}`);
    if (!vaultWord) return null;
    return vaultWord.srsMetrics.stage;
  };

  // Pre-calculate flattened sentence indices purely for stable, non-mutating rendering
  const paragraphsWithIndices = useMemo(() => {
    let counter = 0;
    return currentStory.paragraphs.map((p) => ({
      ...p,
      sentencesWithIndices: p.sentences.map((s) => ({
        ...s,
        globalIndex: counter++,
      })),
    }));
  }, [currentStory]);

  return (
    <div className="story-reader-container">
      {/* Story Metadata & Title Header */}
      <div className="story-meta-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 6 }}>
            <span className="lang-badge">
              {langInfo?.flag} {langInfo?.name} · {currentProficiency}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-input)',
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
        {paragraphsWithIndices.map((paragraph) => (
          <div key={paragraph.id} className="story-paragraph-wrapper">
            {paragraph.sentencesWithIndices.map((sentence) => {
              const isPlayingThis = currentPlayingSentenceIndex === sentence.globalIndex;

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
