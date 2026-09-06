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
  Gauge,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../services/sampleStories';
import { StoryToken, SRSStage, StoryParagraph, StorySentence, DictionaryEntry } from '../../types';
import { getProficiencyNativeInfo, getProficiencyOptions } from '../../services/proficiencyUtils';

const WELCOME_THEMES = [
  { icon: '☕', label: 'Café Matinal', text: 'Uma conversa tranquila em uma cafeteria charmosa' },
  { icon: '🏮', label: 'Festival de Rua', text: 'Cores, comidas e lanternas em uma noite festiva' },
  { icon: '🚆', label: 'Viagem de Trem', text: 'Um passageiro viajando de trem descobrindo novas cidades' },
  { icon: '🐈', label: 'Gato Curioso', text: 'Um gato curioso que entra em uma antiga livraria' },
  { icon: '🍜', label: 'Restaurante Local', text: 'Pedindo comida deliciosa em um restaurante tradicional' },
  { icon: '🌿', label: 'Passeio no Parque', text: 'Um passeio relaxante sob as árvores em um dia ensolarado' },
];

export const StoryReader: React.FC = () => {
  const {
    currentStory,
    currentLanguage,
    settings,
    updateSettings,
    openTokenPopover,
    activeToken,
    currentPlayingSentenceIndex,
    vocabularyVault,
    setIsQuizOpen,
    generateNewStory,
    increaseDictionaryAndGenerate,
    isGeneratingStory,
    customStoryTheme,
    setCustomStoryTheme,
    isPlayingAudio,
    playStoryAudio,
    pauseStoryAudio,
    stopStoryAudio,
    currentProficiency,
    setProficiency,
    t,
  } = useApp();

  const [currentSpread, setCurrentSpread] = useState(0);
  const [showTranslations, setShowTranslations] = useState(false);
  const [newWordQuantity, setNewWordQuantity] = useState(5);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const [isDifficultyPopoverOpen, setIsDifficultyPopoverOpen] = useState(false);

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
  const currentLevelInfo = getProficiencyNativeInfo(currentLanguage, currentProficiency);
  const difficultyOptions = getProficiencyOptions(currentLanguage);

  const isWelcomeState =
    currentStory.id === 'welcome' || !currentStory.paragraphs || currentStory.paragraphs.length === 0;

  // Reset page spread when story changes
  useEffect(() => {
    setCurrentSpread(0);
  }, [currentStory.id]);

  // Index vocabulary vault for instant O(1) SRS stage lookup
  const vaultMap = useMemo(() => {
    const map = new Map<string, DictionaryEntry>();
    vocabularyVault.forEach((entry) => {
      map.set(`${entry.language}:${entry.word}`, entry);
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
    return (currentStory.paragraphs || []).map((p) => ({
      ...p,
      sentencesWithIndices: (p.sentences || []).map((s) => ({
        ...s,
        globalIndex: counter++,
      })),
    }));
  }, [currentStory]);

  // Intelligent content-aware book pagination:
  // Balances paragraphs & sentences across 2-page spreads to eliminate empty or starved pages
  const spreads = useMemo(() => {
    const paras = paragraphsWithIndices;
    if (!paras || paras.length === 0) {
      return [{ left: [], right: [] }];
    }

    // Special case: Single paragraph with multiple sentences -> split across left and right
    if (paras.length === 1) {
      const sentences = paras[0].sentencesWithIndices;
      if (sentences.length >= 2) {
        const mid = Math.ceil(sentences.length / 2);
        return [
          {
            left: [
              {
                ...paras[0],
                id: `${paras[0].id}-left`,
                sentencesWithIndices: sentences.slice(0, mid),
              },
            ],
            right: [
              {
                ...paras[0],
                id: `${paras[0].id}-right`,
                sentencesWithIndices: sentences.slice(mid),
              },
            ],
          },
        ];
      }
      return [{ left: [paras[0]], right: [] }];
    }

    // Count total sentences
    const totalSentences = paras.reduce((acc, p) => acc + p.sentencesWithIndices.length, 0);

    // If story is compact (<= 4 paragraphs AND <= 8 sentences),
    // present the entire story across 1 single, beautifully balanced 2-page spread!
    if (paras.length <= 4 && totalSentences <= 8) {
      // Left page has title header (~120px), so it takes slightly fewer or equal paragraphs
      const leftCount = Math.max(1, Math.floor(paras.length / 2));
      return [
        {
          left: paras.slice(0, leftCount),
          right: paras.slice(leftCount),
        },
      ];
    }

    // For larger stories, compute optimal number of 2-page spreads
    // Target ~3-4 sentences per page (approx. 6-8 sentences per spread)
    const targetSentencesPerSpread = 7;
    const computedSpreads = Math.ceil(totalSentences / targetSentencesPerSpread);
    // Don't create more spreads than we have paragraphs / 2 (ensures pages have at least 1 paragraph)
    const numSpreads = Math.max(1, Math.min(computedSpreads, Math.floor(paras.length / 2)));
    const totalPages = numSpreads * 2;

    // Distribute paragraphs across totalPages using weight-balanced partition
    // Ensures EVERY page gets at least 1 paragraph (since paras.length >= totalPages)
    const pages: (typeof paragraphsWithIndices)[] = [];
    const weights = paras.map((p) => Math.max(1, p.sentencesWithIndices.length));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const avgWeightPerPage = totalWeight / totalPages;

    let currentIdx = 0;
    for (let pIdx = 0; pIdx < totalPages; pIdx++) {
      const remainingPages = totalPages - pIdx;
      if (remainingPages === 1) {
        pages.push(paras.slice(currentIdx));
        break;
      }

      // We must leave at least 1 paragraph for each remaining page
      const maxAllowedIdx = paras.length - (remainingPages - 1);
      let bestEnd = currentIdx + 1;
      let accumWeight = weights[currentIdx];
      let bestDiff = Math.abs(accumWeight - avgWeightPerPage);

      for (let testEnd = currentIdx + 2; testEnd <= maxAllowedIdx; testEnd++) {
        accumWeight += weights[testEnd - 1];
        const diff = Math.abs(accumWeight - avgWeightPerPage);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestEnd = testEnd;
        } else {
          break;
        }
      }

      pages.push(paras.slice(currentIdx, bestEnd));
      currentIdx = bestEnd;
    }

    // Pair into Left and Right pages for each spread
    const spreadList: { left: typeof paragraphsWithIndices; right: typeof paragraphsWithIndices }[] = [];
    for (let i = 0; i < pages.length; i += 2) {
      spreadList.push({
        left: pages[i] || [],
        right: pages[i + 1] || [],
      });
    }

    return spreadList.length > 0 ? spreadList : [{ left: paras, right: [] }];
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

  const getSentenceTranslation = (sentence: StorySentence): string => {
    if (sentence.translation && sentence.translation.trim().length > 0) {
      return sentence.translation.trim();
    }
    // Fallback: synthesize translation from target vocabulary and token definitions
    const tokenTranslations = sentence.tokens
      .map((t) => t.translation || t.explanation || t.traits?.contextMeaning)
      .filter(Boolean) as string[];

    if (tokenTranslations.length > 0) {
      const uniqueParts = tokenTranslations.filter(
        (val, idx, arr) => idx === 0 || val !== arr[idx - 1]
      );
      return uniqueParts.join(' • ');
    }

    return sentence.text;
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
                const isSelected = activeToken?.id === token.id || (activeToken?.text === token.text && activeToken?.ruby === token.ruby);

                return (
                  <span
                    key={token.id}
                    className={`word-token ${isTarget ? 'target-word' : ''} ${
                      isSelected ? 'token-selected-active' : ''
                    } ${
                      settings.highlightSRS && srsStage ? `srs-${srsStage}` : ''
                    }`}
                    onClick={(e) => openTokenPopover(token, e)}
                    title={t('clickForDetails')}
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

            {/* Translation underneath each sentence */}
            {showTranslations && (
              <div className="book-sentence-translation">
                <span className="sentence-translation-marker" aria-hidden="true">
                  {t('translationPrefix')}
                </span>
                <span className="sentence-translation-content">
                  {getSentenceTranslation(sentence)}
                </span>
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
                Language Stories • {langInfo?.name || t('reading')}
              </span>
              <span className="running-header-leaf">❦</span>
            </header>

            <div className="page-inner-content">
              {isWelcomeState ? (
                <div className="book-welcome-container">
                  <div>
                    <div className="book-fleuron-ornament">❧ ❦ ❧</div>
                    <h2 className="book-title-heading" style={{ fontSize: '1.45rem', marginBottom: '6px' }}>
                      {settings.uiLanguage === 'pt' ? 'Bem-vindo ao Language Stories' : 'Welcome to Language Stories'}
                    </h2>
                    <div className="book-title-subheading" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                      {settings.uiLanguage === 'pt'
                        ? 'Sua jornada de aprendizado imersivo começa aqui'
                        : 'Your immersive language learning journey starts here'}
                    </div>
                    <div className="book-title-divider" style={{ margin: '0 auto 16px' }} />

                    <div className="book-welcome-description">
                      <p>
                        {settings.uiLanguage === 'pt'
                          ? 'O Language Stories gera narrativas originais sob medida para o seu nível de compreensão. Aprenda naturalmente através de repetição contextual, áudio sincronizado e consultas instantâneas de vocabulário.'
                          : 'Language Stories generates custom narratives tailored to your comprehension level. Learn naturally through contextual repetition, synchronized audio, and instant vocabulary lookups.'}
                      </p>
                    </div>

                    <div className="book-welcome-features-list">
                      <div className="book-welcome-feature-item">
                        <span className="welcome-feature-icon">📖</span>
                        <div className="welcome-feature-text">
                          <strong>{settings.uiLanguage === 'pt' ? 'Vocabulário Ativo & SRS' : 'Target Vocabulary & SRS'}</strong>
                          <span>{settings.uiLanguage === 'pt' ? 'Palavras-chave repetidas naturalmente em contexto' : 'Key words repeated naturally in context'}</span>
                        </div>
                      </div>
                      <div className="book-welcome-feature-item">
                        <span className="welcome-feature-icon">🔊</span>
                        <div className="welcome-feature-text">
                          <strong>{settings.uiLanguage === 'pt' ? 'Áudio Nativo Sincronizado' : 'Native Synchronized Audio'}</strong>
                          <span>{settings.uiLanguage === 'pt' ? 'Acompanhamento frase a frase em tempo real' : 'Real-time sentence-by-sentence read aloud'}</span>
                        </div>
                      </div>
                      <div className="book-welcome-feature-item">
                        <span className="welcome-feature-icon">🔍</span>
                        <div className="welcome-feature-text">
                          <strong>{settings.uiLanguage === 'pt' ? 'Dicionário & Raio-X' : 'Dictionary & Deep Dive'}</strong>
                          <span>{settings.uiLanguage === 'pt' ? 'Traduções, fonética e análise morfológica instantânea' : 'Translations, phonetics, and instant morphological breakdown'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="book-welcome-lang-badge">
                    <span className="welcome-badge-flag">{langInfo?.flag || '🌐'}</span>
                    <div className="welcome-badge-info">
                      <span className="welcome-badge-title">{langInfo?.name || currentLanguage}</span>
                      <span className="welcome-badge-level">{currentLevelInfo.fullLabel}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Story Title displayed on the first left page */}
                  {isFirstSpread && (
                    <header className="book-story-title-header">
                      <div className="book-fleuron-ornament">❧ ❦ ❧</div>
                      <h2 className="book-title-heading">{currentStory.title}</h2>
                      {currentStory.titleTranslation && (
                        <div
                          className={`book-title-subheading ${
                            showTranslations ? 'highlighted-translation' : ''
                          }`}
                        >
                          {showTranslations && (
                            <span className="sentence-translation-marker" style={{ marginRight: '6px' }}>
                              {t('translationPrefix')}
                            </span>
                          )}
                          {currentStory.titleTranslation}
                        </div>
                      )}
                      <div className="book-title-divider" />
                    </header>
                  )}

                  {/* Paragraphs rendered on left page */}
                  <div className="book-page-paragraphs">
                    {activeSpreadData?.left.map(renderParagraph)}
                  </div>
                </>
              )}
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
                {isWelcomeState
                  ? (settings.uiLanguage === 'pt' ? 'Novo Conto • Criação com IA' : 'New Story • AI Creation')
                  : `${t('chapterPrefix')} ${currentSpread + 1} • ${currentStory.title}`}
              </span>
              <span className="running-header-leaf">✦</span>
            </header>

            <div className="page-inner-content">
              {isWelcomeState ? (
                <div className="book-welcome-container">
                  <div>
                    <div className="book-fleuron-ornament">✦ ❦ ✦</div>
                    <h3 className="book-welcome-prompt-title">
                      {settings.uiLanguage === 'pt' ? 'Criar Sua Primeira História' : 'Create Your First Story'}
                    </h3>
                    <p className="book-welcome-prompt-subtitle">
                      {settings.uiLanguage === 'pt'
                        ? 'Escolha um tema sugerido abaixo ou digite seu próprio tema para a IA compor a narrativa:'
                        : 'Choose a suggested theme below or type your own topic for the AI to compose:'}
                    </p>

                    {/* Suggested theme quick chips */}
                    <div className="book-welcome-theme-chips">
                      {WELCOME_THEMES.map((themeItem) => (
                        <button
                          key={themeItem.text}
                          type="button"
                          className={`welcome-chip-btn ${customStoryTheme === themeItem.text ? 'selected' : ''}`}
                          onClick={() =>
                            setCustomStoryTheme(customStoryTheme === themeItem.text ? '' : themeItem.text)
                          }
                          title={`Selecionar tema: ${themeItem.label}`}
                        >
                          <span>{themeItem.icon}</span>
                          <span>{themeItem.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Custom theme input */}
                    <div className="book-welcome-input-wrap">
                      <input
                        type="text"
                        className="book-welcome-input"
                        placeholder={
                          settings.uiLanguage === 'pt'
                            ? 'Digite um tema (ou deixe vazio para tema surpresa)...'
                            : 'Type a theme (or leave empty for surprise)...'
                        }
                        value={customStoryTheme}
                        onChange={(e) => setCustomStoryTheme(e.target.value)}
                        disabled={isGeneratingStory}
                      />
                      {customStoryTheme && (
                        <button
                          type="button"
                          className="welcome-clear-theme-btn"
                          onClick={() => setCustomStoryTheme('')}
                          title={t('themeClear')}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Primary Action Button */}
                    <button
                      className={`book-welcome-generate-btn ${isGeneratingStory ? 'loading' : ''}`}
                      onClick={() => generateNewStory(customStoryTheme)}
                      disabled={isGeneratingStory}
                    >
                      {isGeneratingStory ? (
                        <>
                          <Loader2 size={20} className="spin" />
                          <span>
                            {settings.uiLanguage === 'pt'
                              ? 'Criando sua história com IA...'
                              : 'Generating your story with AI...'}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} color="#fff" />
                          <span>
                            {settings.uiLanguage === 'pt'
                              ? '✨ Gerar Minha Primeira História'
                              : '✨ Generate My First Story'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="book-welcome-hint">
                    <span>💡</span>
                    <p>
                      {settings.uiLanguage === 'pt'
                        ? 'Você pode trocar o idioma ou alterar o nível a qualquer momento na barra superior ou no dock inferior.'
                        : 'You can change the language or adjust the proficiency level at any time in the top bar or bottom dock.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="book-page-paragraphs">
                    {activeSpreadData?.right.length > 0 ? (
                      activeSpreadData.right.map(renderParagraph)
                    ) : (
                      <div className="book-colophon-placeholder">
                        <div className="book-fleuron-ornament">✦ ❦ ✦</div>
                        <div className="book-colophon-badge">
                          <Sparkles size={24} color="var(--flower-500)" />
                        </div>
                        <h4 className="book-colophon-title">{currentStory.title}</h4>
                        <p className="book-colophon-desc">{t('endOfNarrative')}</p>
                      </div>
                    )}
                  </div>

                  {/* Retention mini-quiz banner on the last spread */}
                  {isLastSpread && (
                    <div className="book-end-section-container">
                      <div className="book-story-tailpiece" aria-hidden="true">
                        <span>❧</span>
                        <span>❦</span>
                        <span>❧</span>
                      </div>
                      <div className="book-end-quiz-banner">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="book-quiz-icon-badge">
                            <CheckCircle size={16} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                              {t('readingComplete')}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--page-text-muted)' }}>
                              {t('readingCompleteSub')}
                            </div>
                          </div>
                        </div>
                        <button
                          className="book-quiz-trigger-btn"
                          onClick={() => setIsQuizOpen(true)}
                        >
                          {t('startMiniQuiz')}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Page Number (Right) - Classical printed folio */}
            <div className="book-page-footer">
              <span className="page-number-text">— {currentSpread * 2 + 2} —</span>
            </div>
          </section>
        </div>

        {/* Page Flip Navigation Buttons (Left/Right) */}
        {!isWelcomeState && !isFirstSpread && (
          <button
            className="book-nav-arrow-btn prev-arrow"
            onClick={handlePrevPage}
            title={t('prevPageTitle')}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {!isWelcomeState && !isLastSpread && (
          <button
            className="book-nav-arrow-btn next-arrow"
            onClick={handleNextPage}
            title={t('nextPageTitle')}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Pagination Dots (Matching reference ••••) */}
      {!isWelcomeState && (
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
      )}

      {/* Bottom Floating Control Dock (Exact match to reference capsule) */}
      <div className="book-bottom-dock">
        {/* Toggle / Generate New Story */}
        <div className="dock-control-item">
          <span className="dock-label">{t('newStory').toLowerCase()}:</span>
          <button
            className={`dock-toggle-btn ${isGeneratingStory ? 'generating' : ''}`}
            onClick={handleToggleNewStory}
            disabled={isGeneratingStory}
            title={t('newStory')}
          >
            {isGeneratingStory ? (
              <Loader2 size={15} className="spin" />
            ) : (
              <span className="dock-toggle-thumb" />
            )}
          </button>
        </div>

        {/* Story Theme Selector / Popover Tab */}
        <div className="dock-control-item dock-theme-container">
          <button
            className={`dock-chip-btn dock-theme-btn ${customStoryTheme.trim() ? 'active' : ''}`}
            onClick={() => {
              setIsThemePopoverOpen((prev) => !prev);
              setIsDifficultyPopoverOpen(false);
            }}
            title={t('themeTooltip')}
          >
            <Sparkles size={13} color="var(--flower-400)" />
            <span>
              {t('themeLabel')}: {customStoryTheme.trim() ? `"${customStoryTheme.trim().slice(0, 12)}${customStoryTheme.trim().length > 12 ? '...' : ''}"` : t('themeAutomatic')}
            </span>
          </button>

          {isThemePopoverOpen && (
            <div className="dock-theme-popover">
              <div className="dock-theme-popover-header">
                <span className="dock-theme-popover-title">{t('themeCustomTitle')}</span>
                <button
                  type="button"
                  className="dock-theme-close-btn"
                  onClick={() => setIsThemePopoverOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="dock-theme-input-wrap">
                <input
                  type="text"
                  className="dock-theme-input"
                  placeholder={t('themePlaceholder')}
                  value={customStoryTheme}
                  onChange={(e) => setCustomStoryTheme(e.target.value)}
                  autoFocus
                />
                {customStoryTheme && (
                  <button
                    type="button"
                    className="dock-theme-clear-btn"
                    onClick={() => setCustomStoryTheme('')}
                    title={t('themeClear')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="dock-theme-presets">
                <span className="dock-theme-presets-label">Sugestões rápidas:</span>
                <div className="dock-theme-presets-list">
                  <button
                    type="button"
                    className="dock-theme-preset-tag"
                    onClick={() => setCustomStoryTheme('')}
                  >
                    ✨ {t('themeAutomatic')}
                  </button>
                  <button
                    type="button"
                    className="dock-theme-preset-tag"
                    onClick={() => setCustomStoryTheme('Café e Conversa')}
                  >
                    ☕ Café & Conversa
                  </button>
                  <button
                    type="button"
                    className="dock-theme-preset-tag"
                    onClick={() => setCustomStoryTheme('Viagem de Trem')}
                  >
                    🚆 Viagem de Trem
                  </button>
                  <button
                    type="button"
                    className="dock-theme-preset-tag"
                    onClick={() => setCustomStoryTheme('Feira e Culinária')}
                  >
                    🍜 Feira & Comida
                  </button>
                  <button
                    type="button"
                    className="dock-theme-preset-tag"
                    onClick={() => setCustomStoryTheme('Mistério Leve')}
                  >
                    🔍 Mistério Leve
                  </button>
                </div>
              </div>

              <div className="dock-theme-footer">
                <span className="dock-theme-hint">
                  {customStoryTheme.trim()
                    ? 'A próxima história gerada seguirá este tema.'
                    : 'Deixe em branco para tema didático automático.'}
                </span>
                <button
                  type="button"
                  className="dock-theme-apply-btn"
                  onClick={() => setIsThemePopoverOpen(false)}
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Story Difficulty / Level Selector Popover */}
        <div className="dock-control-item dock-difficulty-container">
          <button
            className="dock-chip-btn dock-difficulty-btn active"
            onClick={() => {
              setIsDifficultyPopoverOpen((prev) => !prev);
              setIsThemePopoverOpen(false);
            }}
            title="Alterar nível e dificuldade da história"
          >
            <Gauge size={13} style={{ color: currentLevelInfo.color }} />
            <span>Nível: {currentLevelInfo.badgeLabel}</span>
          </button>

          {isDifficultyPopoverOpen && (
            <div className="dock-difficulty-popover">
              <div className="dock-difficulty-popover-header">
                <span className="dock-difficulty-popover-title">
                  <Gauge size={15} color="var(--flower-500)" />
                  Dificuldade da História
                </span>
                <button
                  type="button"
                  className="dock-theme-close-btn"
                  onClick={() => setIsDifficultyPopoverOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="dock-difficulty-levels-list">
                {difficultyOptions.map((opt) => (
                  <button
                    key={opt.level}
                    type="button"
                    className={`dock-difficulty-level-card ${currentProficiency === opt.level ? 'selected' : ''}`}
                    onClick={() => {
                      setProficiency(opt.level);
                      setIsDifficultyPopoverOpen(false);
                    }}
                  >
                    <div className="dock-difficulty-level-top">
                      <span
                        className="dock-difficulty-level-badge"
                        style={{ backgroundColor: `${opt.color}22`, color: opt.color, borderColor: opt.color }}
                      >
                        {opt.shortLabel}
                      </span>
                      <span className="dock-difficulty-level-full">{opt.fullLabel}</span>
                    </div>
                    <p className="dock-difficulty-level-desc">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dock-separator" />

        {/* New Word Quantity Stepper */}
        <div className="dock-control-item">
          <span className="dock-label">{t('newWordQuantity')}</span>
          <div className="dock-stepper-box">
            <span className="dock-stepper-value">{newWordQuantity}</span>
            <div className="dock-stepper-arrows">
              <button
                className="stepper-arrow-btn"
                onClick={() => setNewWordQuantity((prev) => Math.min(10, prev + 1))}
                title={t('increaseWordsTitle')}
              >
                ▲
              </button>
              <button
                className="stepper-arrow-btn"
                onClick={() => setNewWordQuantity((prev) => Math.max(2, prev - 1))}
                title={t('decreaseWordsTitle')}
              >
                ▼
              </button>
            </div>
          </div>
          <button
            className="dock-action-text-btn"
            onClick={handleIncreaseWords}
            disabled={isGeneratingStory || isWelcomeState}
            title={isWelcomeState ? 'Gere uma história antes de expandir o vocabulário' : t('addWordsTooltip')}
          >
            {t('addWordsBtn')}
          </button>
        </div>

        <div className="dock-separator" />

        {/* Audio TTS Play / Pause */}
        <button
          className={`dock-audio-btn ${isPlayingAudio ? 'playing' : ''}`}
          onClick={isPlayingAudio ? pauseStoryAudio : playStoryAudio}
          disabled={isWelcomeState || isGeneratingStory}
          title={
            isWelcomeState
              ? (settings.uiLanguage === 'pt' ? 'Gere uma história para ouvir' : 'Generate a story to listen')
              : isPlayingAudio
              ? t('pauseAudioTooltip')
              : t('listenAudioTooltip')
          }
        >
          {isPlayingAudio ? <Pause size={15} /> : <Play size={15} />}
          <span>{isPlayingAudio ? t('pauseBtn') : t('audioBtn')}</span>
        </button>

        {/* Ruby Toggle */}
        {langInfo?.hasRuby && (
          <button
            className={`dock-chip-btn ${settings.showRuby ? 'active' : ''}`}
            onClick={() => updateSettings({ showRuby: !settings.showRuby })}
            title={t('rubyTooltip')}
          >
            Ruby {settings.showRuby ? 'ON' : 'OFF'}
          </button>
        )}

        {/* Translation Toggle */}
        <button
          className={`dock-chip-btn ${showTranslations ? 'active' : ''}`}
          onClick={() => setShowTranslations((prev) => !prev)}
          disabled={isWelcomeState}
          title={t('translationTooltip')}
        >
          {showTranslations ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{t('translationToggle')}</span>
        </button>

        {/* Mini Quiz Shortcut */}
        <button
          className="dock-quiz-btn"
          onClick={() => setIsQuizOpen(true)}
          disabled={isWelcomeState}
          title={
            isWelcomeState
              ? (settings.uiLanguage === 'pt' ? 'Gere uma história para acessar o quiz' : 'Generate a story to access quiz')
              : t('miniQuizTooltip')
          }
        >
          <CheckCircle size={15} />
          <span>{t('miniQuizBtn')}</span>
        </button>
      </div>

      {/* Floating Word Popover Tooltip */}
      <WordPopover />
    </div>
  );
};
