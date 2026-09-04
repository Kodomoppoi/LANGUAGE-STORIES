import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { WordPopover } from './WordPopover';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  Pause,
  Play,
  CheckCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../services/sampleStories';
import { StoryToken, SRSStage, StoryParagraph } from '../../types';

export const StoryReader: React.FC = () => {
  const {
    currentStory,
    currentLanguage,
    settings,
    updateSettings,
    openTokenPopover,
    currentPlayingSentenceIndex,
    vocabularyVault,
    setIsQuizOpen,
    generateNewStory,
    increaseDictionaryAndGenerate,
    isGeneratingStory,
    isPlayingAudio,
    playStoryAudio,
    pauseStoryAudio,
    stopStoryAudio,
  } = useApp();

  const [currentSpread, setCurrentSpread] = useState(0);
  const [showTranslations, setShowTranslations] = useState(false);
  const [newWordQuantity, setNewWordQuantity] = useState(5);

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  // Reset page spread when story changes
  useEffect(() => {
    setCurrentSpread(0);
  }, [currentStory.id]);

  // Index vocabulary vault for instant O(1) SRS stage lookup
  const vaultMap = useMemo(() => {
    const map = new Map<string, typeof vocabularyVault[0]>();
    vocabularyVault.forEach((v) => {
      map.set(`${v.language}:${v.word}`, v);
    });
    return map;
  }, [vocabularyVault]);

  const getTokenSRSStage = (token: StoryToken): SRSStage | null => {
    const vaultWord = vaultMap.get(`${currentStory.language}:${token.text}`);
    if (!vaultWord) return null;
    return vaultWord.srsMetrics.stage;
  };

  // Pre-calculate flattened sentence indices purely for stable speech sync
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

  // Distribute paragraphs into spreads of 2 pages (Left & Right)
  const spreads = useMemo(() => {
    const totalParas = paragraphsWithIndices.length;
    if (totalParas <= 2) {
      return [
        {
          left: [paragraphsWithIndices[0]].filter(Boolean),
          right: [paragraphsWithIndices[1]].filter(Boolean),
        },
      ];
    }

    const pagesPerSpread = 2;
    // Calculate how many paragraphs per page
    const parasPerPage = Math.max(1, Math.ceil(totalParas / (Math.ceil(totalParas / 2) * 2)));
    const spreadList: { left: typeof paragraphsWithIndices; right: typeof paragraphsWithIndices }[] = [];

    for (let i = 0; i < totalParas; i += pagesPerSpread) {
      spreadList.push({
        left: [paragraphsWithIndices[i]].filter(Boolean),
        right: [paragraphsWithIndices[i + 1]].filter(Boolean),
      });
    }

    return spreadList.length > 0
      ? spreadList
      : [{ left: paragraphsWithIndices, right: [] }];
  }, [paragraphsWithIndices]);

  // Auto-flip spread if TTS is reading a sentence on the next spread
  useEffect(() => {
    if (currentPlayingSentenceIndex < 0) return;
    for (let sIdx = 0; sIdx < spreads.length; sIdx++) {
      const allSentencesInSpread = [
        ...spreads[sIdx].left.flatMap((p) => p.sentencesWithIndices),
        ...spreads[sIdx].right.flatMap((p) => p.sentencesWithIndices),
      ];
      if (allSentencesInSpread.some((s) => s.globalIndex === currentPlayingSentenceIndex)) {
        if (sIdx !== currentSpread) {
          setCurrentSpread(sIdx);
        }
        break;
      }
    }
  }, [currentPlayingSentenceIndex, spreads, currentSpread]);

  const activeSpreadData = spreads[currentSpread] || spreads[0];
  const isFirstSpread = currentSpread === 0;
  const isLastSpread = currentSpread === spreads.length - 1;

  const handleNextPage = () => {
    if (!isLastSpread) {
      setCurrentSpread((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (!isFirstSpread) {
      setCurrentSpread((prev) => prev - 1);
    }
  };

  const handleToggleNewStory = async () => {
    await generateNewStory();
  };

  const handleIncreaseWords = async () => {
    await increaseDictionaryAndGenerate(newWordQuantity);
  };

  const renderParagraph = (p: (typeof paragraphsWithIndices)[0]) => (
    <div key={p.id} className="book-paragraph-block">
      {p.sentencesWithIndices.map((sentence) => {
        const isPlayingThis = currentPlayingSentenceIndex === sentence.globalIndex;

        return (
          <div
            key={sentence.id}
            className={`book-sentence-wrapper ${isPlayingThis ? 'active-speech' : ''}`}
          >
            <p className="book-sentence-text">
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
                    title="Clique para tradução, pronúncia e detalhes"
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

            {/* Translation overlay */}
            {showTranslations && (
              <div className="book-sentence-translation">
                {sentence.translation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="open-book-layout-wrapper">
      {/* 3D Open Book Presentation Canvas */}
      <div className="open-book-viewport">
        <div className={`open-book-hardcover ${currentStory.isRTL ? 'rtl' : ''}`}>
          {/* Decorative Blind-Debossed Hardcover Stitch Seam */}
          <div className="book-cover-stitch" aria-hidden="true" />

          {/* Spine Headbands (Capitel de tecido bordado no topo e na base) */}
          <div className="book-spine-headband top-headband" aria-hidden="true" />
          <div className="book-spine-headband bottom-headband" aria-hidden="true" />

          {/* Left Page Stack Edge (3D fore-edge cut pages beneath left page) */}
          <div className="book-page-stack-edge left-stack-edge" aria-hidden="true" />

          {/* Left Page of Open Book */}
          <section className="book-page left-page" aria-label="Left Book Page">
            {/* Running Header */}
            <header className="book-running-header left-header">
              <span className="running-header-leaf">❦</span>
              <span className="running-header-title">
                Language Stories • {langInfo?.name || 'Reading'}
              </span>
              <span className="running-header-leaf">❦</span>
            </header>

            <div className="page-inner-content">
              {/* Story Title displayed on the first left page */}
              {isFirstSpread && (
                <header className="book-story-title-header">
                  <div className="book-fleuron-ornament">❧ ❦ ❧</div>
                  <h2 className="book-title-heading">{currentStory.title}</h2>
                  <div className="book-title-subheading">
                    {currentStory.titleTranslation}
                  </div>
                  <div className="book-title-divider" />
                </header>
              )}

              {/* Paragraphs rendered on left page */}
              <div className="book-page-paragraphs">
                {activeSpreadData?.left.map(renderParagraph)}
              </div>
            </div>

            {/* Page Number (Left) - Classical printed folio */}
            <div className="book-page-footer">
              <span className="page-number-text">— {currentSpread * 2 + 1} —</span>
            </div>
          </section>

          {/* Realistic Center Spine Crease & Shadow Gutter with Binding Seam */}
          <div className="book-spine-gutter" aria-hidden="true">
            <div className="spine-seam-stitch" />
          </div>

          {/* Right Page Stack Edge (3D fore-edge cut pages beneath right page) */}
          <div className="book-page-stack-edge right-stack-edge" aria-hidden="true" />

          {/* Right Page of Open Book */}
          <section className="book-page right-page" aria-label="Right Book Page">
            {/* Running Header */}
            <header className="book-running-header right-header">
              <span className="running-header-leaf">✦</span>
              <span className="running-header-title">
                Capítulo {currentSpread + 1} • {currentStory.title}
              </span>
              <span className="running-header-leaf">✦</span>
            </header>

            <div className="page-inner-content">
              <div className="book-page-paragraphs">
                {activeSpreadData?.right.length > 0 ? (
                  activeSpreadData.right.map(renderParagraph)
                ) : (
                  <div className="book-empty-page-placeholder">
                    <Sparkles size={20} color="var(--flower-400)" />
                    <p>Fim da narrativa.</p>
                  </div>
                )}
              </div>

              {/* Retention mini-quiz banner on the last spread */}
              {isLastSpread && (
                <div className="book-end-quiz-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="book-quiz-icon-badge">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                        Leitura concluída!
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Fixe as palavras na memória.
                      </div>
                    </div>
                  </div>
                  <button
                    className="book-quiz-trigger-btn"
                    onClick={() => setIsQuizOpen(true)}
                  >
                    Iniciar Mini-Quiz
                  </button>
                </div>
              )}
            </div>

            {/* Page Number (Right) - Classical printed folio */}
            <div className="book-page-footer">
              <span className="page-number-text">— {currentSpread * 2 + 2} —</span>
            </div>
          </section>
        </div>

        {/* Page Flip Navigation Buttons (Left/Right) */}
        {!isFirstSpread && (
          <button
            className="book-nav-arrow-btn prev-arrow"
            onClick={handlePrevPage}
            title="Página anterior"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {!isLastSpread && (
          <button
            className="book-nav-arrow-btn next-arrow"
            onClick={handleNextPage}
            title="Próxima página"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Pagination Dots (Matching reference ••••) */}
      <div className="book-pagination-dots-bar">
        {spreads.map((_, idx) => (
          <button
            key={idx}
            className={`book-dot-indicator ${idx === currentSpread ? 'active' : ''}`}
            onClick={() => setCurrentSpread(idx)}
            title={`Ir para páginas ${idx * 2 + 1}-${idx * 2 + 2}`}
          />
        ))}
      </div>

      {/* Bottom Floating Control Dock (Exact match to reference capsule) */}
      <div className="book-bottom-dock">
        {/* Toggle / Generate New Story */}
        <div className="dock-control-item">
          <span className="dock-label">new story:</span>
          <button
            className={`dock-toggle-btn ${isGeneratingStory ? 'generating' : ''}`}
            onClick={handleToggleNewStory}
            disabled={isGeneratingStory}
            title="Gerar nova história com alta repetição de vocabulário"
          >
            {isGeneratingStory ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <span className="dock-toggle-thumb" />
            )}
          </button>
        </div>

        <div className="dock-separator" />

        {/* New Word Quantity Stepper */}
        <div className="dock-control-item">
          <span className="dock-label">new word quantity:</span>
          <div className="dock-stepper-box">
            <span className="dock-stepper-value">{newWordQuantity}</span>
            <div className="dock-stepper-arrows">
              <button
                className="stepper-arrow-btn"
                onClick={() => setNewWordQuantity((prev) => Math.min(10, prev + 1))}
                title="Aumentar palavras (+)"
              >
                ▲
              </button>
              <button
                className="stepper-arrow-btn"
                onClick={() => setNewWordQuantity((prev) => Math.max(2, prev - 1))}
                title="Diminuir palavras (-)"
              >
                ▼
              </button>
            </div>
          </div>
          <button
            className="dock-action-text-btn"
            onClick={handleIncreaseWords}
            disabled={isGeneratingStory}
            title="Injetar novas palavras no vocabulário atual"
          >
            + Adicionar
          </button>
        </div>

        <div className="dock-separator" />

        {/* Audio TTS Play / Pause */}
        <button
          className={`dock-audio-btn ${isPlayingAudio ? 'playing' : ''}`}
          onClick={isPlayingAudio ? pauseStoryAudio : playStoryAudio}
          title={isPlayingAudio ? 'Pausar narração' : 'Ouvir narração em áudio'}
        >
          {isPlayingAudio ? <Pause size={15} /> : <Play size={15} />}
          <span>{isPlayingAudio ? 'Pausar' : 'Áudio'}</span>
        </button>

        {/* Ruby Toggle */}
        {langInfo?.hasRuby && (
          <button
            className={`dock-chip-btn ${settings.showRuby ? 'active' : ''}`}
            onClick={() => updateSettings({ showRuby: !settings.showRuby })}
            title="Alternar anotações de leitura (Furigana / Pinyin)"
          >
            Ruby {settings.showRuby ? 'ON' : 'OFF'}
          </button>
        )}

        {/* Translation Toggle */}
        <button
          className={`dock-chip-btn ${showTranslations ? 'active' : ''}`}
          onClick={() => setShowTranslations((prev) => !prev)}
          title="Alternar traduções das frases"
        >
          {showTranslations ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>Tradução</span>
        </button>

        {/* Mini Quiz Shortcut */}
        <button
          className="dock-quiz-btn"
          onClick={() => setIsQuizOpen(true)}
          title="Testar retenção e alimentar a curva SM-2"
        >
          <CheckCircle size={15} />
          <span>Mini-Quiz</span>
        </button>
      </div>

      {/* Floating Word Popover Tooltip */}
      <WordPopover />
    </div>
  );
};
