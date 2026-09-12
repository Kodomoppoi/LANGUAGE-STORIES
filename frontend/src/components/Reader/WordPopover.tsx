import React, { useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Volume2,
  Star,
  Plus,
  Check,
  X,
  Sparkles,
  BookOpen,
  Bot,
} from 'lucide-react';
import { createDefaultSRSMetrics, getStatusColor, getRepetitionWeight } from '../../services/srsEngine';
import { DictionaryEntry, ChineseTraits } from '../../types';
import { getAuxiliaryRuby, toRomaji } from '../../services/auxiliaryPhonetics';
import { getAuxiliaryTranslation, isInvalidTranslation } from '../../services/auxiliaryLexicon';
import { resolveLocalizedWordTranslation, translateGloss } from '../../services/storyLocalization';

export const WordPopover: React.FC = () => {
  const {
    activeToken,
    activeSentence,
    currentStory,
    closeTokenPopover,
    currentLanguage,
    currentProficiency,
    vocabularyVault,
    addWordToVault,
    toggleStarWord,
    speakSingleToken,
    openDeepDive,
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

  const tokenText = activeToken?.text ? String(activeToken.text).trim() : '';

  // Check if token already exists in vault
  const vaultEntry = vocabularyVault.find(
    (w) => tokenText && w.word === tokenText && w.language === currentLanguage
  );
  const isInVault = Boolean(vaultEntry);
  const isStarred = vaultEntry?.isStarred || false;
  const isPinned = vaultEntry?.isPinned || isStarred;

  // Traços linguísticos defensivos (especialmente Mandarim)
  const traits = (
    vaultEntry?.traits && typeof vaultEntry.traits === 'object'
      ? vaultEntry.traits
      : (activeToken?.traits && typeof activeToken.traits === 'object' ? activeToken.traits : {})
  ) as ChineseTraits;
  const radicals = traits.radicals || (traits.radicalChar ? `${traits.radicalChar} (${traits.radicalMeaning || ''})` : undefined);
  const hskLevel = traits.hskLevel;

  const isCJK = currentLanguage === 'zh' || currentLanguage === 'ja';

  // Fonética auxiliar se não estiver no token original
  // Se o token for de 1 caractere mas herdou múltiplos tons de uma palavra composta (ex: 米 herdou [mǐ fàn]),
  // recalibra para a fonética real do caractere individual
  const auxRuby = tokenText ? getAuxiliaryRuby(tokenText, currentLanguage) : undefined;
  const isRubyMismatched = isCJK && tokenText.length === 1 && Boolean(activeToken?.ruby && activeToken.ruby.trim().includes(' '));
  const rawRuby = (isRubyMismatched && auxRuby) ? auxRuby : (activeToken?.ruby || auxRuby);
  const effectiveRuby = currentLanguage === 'ja' && rawRuby ? toRomaji(rawRuby) : rawRuby;

  // Pontuação contínua de saber e cor de status (0% a 100%)
  const masteryScore = vaultEntry?.masteryScore ?? activeToken?.masteryScore ?? 25;
  const statusColor = vaultEntry?.statusColor ?? activeToken?.statusColor ?? getStatusColor(masteryScore);
  const repetitionWeight = vaultEntry?.repetitionWeight ?? getRepetitionWeight(masteryScore, isPinned);

  const getSentenceText = (s?: any): string => {
    if (!s) return '';
    return String(s.text || s.target_text || '');
  };

  const getSentenceTranslation = (s?: any): string => {
    if (!s) return '';
    return String(s.translation || s.translation_text || '');
  };

  // 1. Resolução de significado real sem placeholders (hook incondicional)
  const resolvedMeaning = useMemo(() => {
    if (!activeToken || !tokenText) return '';
    const uiLang = (settings.uiLanguage as 'pt' | 'en') || 'pt';

    // 1. Prioridade absoluta: Resolução estritamente sincronizada com o idioma da interface ('pt' ou 'en')
    const localized = resolveLocalizedWordTranslation(
      tokenText,
      activeToken.translation || traits.contextMeaning,
      currentLanguage,
      uiLang
    );
    if (localized && !isInvalidTranslation(localized, tokenText)) {
      return localized;
    }

    // 2. Vocabulário Alvo da história (se já localizado)
    const matchingVocab = currentStory?.targetVocabulary?.find((v) => {
      const w = v?.word ? String(v.word).trim() : '';
      if (!w || !tokenText) return false;
      if (w === tokenText) return true;
      if (tokenText.length > 1 && (w.includes(tokenText) || tokenText.includes(w))) return true;
      return false;
    });
    if (matchingVocab?.translation && !isInvalidTranslation(matchingVocab.translation, tokenText)) {
      const localizedVocab = resolveLocalizedWordTranslation(
        matchingVocab.word || tokenText,
        matchingVocab.translation,
        currentLanguage,
        uiLang
      );
      if (localizedVocab && !isInvalidTranslation(localizedVocab, tokenText)) {
        return localizedVocab;
      }
      return matchingVocab.translation;
    }

    // 3. Vault (Cofre de vocabulário)
    const vaultItem = vocabularyVault.find(
      (w) => w && w.language === currentLanguage && (
        w.word === tokenText ||
        (tokenText.length > 1 && (tokenText.startsWith(w.word) || w.word.startsWith(tokenText)))
      )
    );
    if (vaultItem?.translation && !isInvalidTranslation(vaultItem.translation, tokenText)) {
      const localizedVault = resolveLocalizedWordTranslation(
        vaultItem.word,
        vaultItem.translation,
        currentLanguage,
        uiLang
      );
      if (localizedVault && !isInvalidTranslation(localizedVault, tokenText)) {
        return localizedVault;
      }
      return vaultItem.translation;
    }

    // 4. Traits context meaning com tradução de glosa
    if (traits.contextMeaning && !isInvalidTranslation(traits.contextMeaning, tokenText)) {
      const mapped = translateGloss(traits.contextMeaning, uiLang);
      return mapped || traits.contextMeaning;
    }

    // 5. Active token translation direta com tradução de glosa
    if (activeToken.translation && !isInvalidTranslation(activeToken.translation, tokenText)) {
      const mapped = translateGloss(activeToken.translation, uiLang);
      return mapped || activeToken.translation;
    }

    // 6. Explanation do token
    if (activeToken.explanation && !isInvalidTranslation(activeToken.explanation, tokenText)) {
      const mapped = translateGloss(activeToken.explanation, uiLang);
      return mapped || activeToken.explanation;
    }

    return uiLang === 'pt'
      ? 'Tradução no contexto da frase abaixo'
      : 'Contextual translation in sentence below';
  }, [traits.contextMeaning, activeToken, tokenText, currentStory, vocabularyVault, currentLanguage, settings.uiLanguage]);

  const handleAddToVault = () => {
    if (isInVault || !tokenText || !activeToken) return;
    const safeMeaning = resolvedMeaning && !isInvalidTranslation(resolvedMeaning, tokenText)
      ? resolvedMeaning
      : (auxRuby || tokenText);

    const newEntry: DictionaryEntry = {
      id: `vocab-${Date.now()}`,
      word: tokenText,
      ruby: effectiveRuby,
      translation: safeMeaning,
      partOfSpeech: activeToken.partOfSpeech || 'Noun',
      definition: activeToken.explanation || resolvedMeaning || `Usage of ${tokenText} in context.`,
      exampleSentence: tokenText,
      exampleTranslation: resolvedMeaning || '',
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

  // 2. Sentença contextual que contém o token (hook incondicional)
  const contextSentence = useMemo(() => {
    if (!tokenText) return null;

    const activeText = getSentenceText(activeSentence);
    if (activeText && activeText.includes(tokenText)) {
      return activeSentence;
    }
    for (const p of currentStory?.paragraphs || []) {
      for (const s of p?.sentences || []) {
        const sText = getSentenceText(s);
        if (
          (sText && sText.includes(tokenText)) ||
          s?.tokens?.some((t: any) => t?.id === activeToken?.id || t?.text === tokenText)
        ) {
          return s;
        }
      }
    }
    return activeSentence || null;
  }, [activeSentence, currentStory, activeToken, tokenText]);

  // 3. Renderiza a frase original destacando/sublinhando a palavra ativa
  const renderSentenceWithUnderline = (sentenceText?: string, targetWord?: string) => {
    const text = String(sentenceText || '');
    const word = String(targetWord || '');
    if (!word || !text || !text.includes(word)) {
      return <span>{text}</span>;
    }

    try {
      const parts = text.split(word);
      return (
        <span>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && (
                <u className="sentence-target-word-underline" title={word}>
                  {word}
                </u>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    } catch {
      return <span>{text}</span>;
    }
  };

  // Se não houver token ativo selecionado, não renderiza JSX
  if (!activeToken) return null;

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
            {effectiveRuby && (
              <span className="lateral-word-ruby">[{effectiveRuby}]</span>
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
            {t('readerStoryTargetBadge')}
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

      {/* Caixa de Tradução Direta */}
      <div className="lateral-translation-box">
        <div className="lateral-translation-label">{t('contextMeaningLabel')}</div>
        <div className="lateral-translation-text">
          {resolvedMeaning}
        </div>
        {activeToken.explanation && (
          <div className="lateral-explanation-text">
            {translateGloss(activeToken.explanation, (settings.uiLanguage as 'pt' | 'en') || 'pt') || activeToken.explanation}
          </div>
        )}
      </div>

      {/* Caixa de Frase em Contexto com Palavra Sublinhada */}
      {contextSentence && getSentenceText(contextSentence) && (
        <div className="lateral-sentence-context-card">
          <div className="lateral-context-card-header">
            <span>📝 {t('sentenceContextLabel')}</span>
          </div>

          <div className="lateral-context-sentence-orig">
            {renderSentenceWithUnderline(getSentenceText(contextSentence), activeToken.text)}
          </div>

          {getSentenceTranslation(contextSentence) && (
            <div className="lateral-context-sentence-trans">
              <span className="sentence-translation-marker" style={{ marginRight: '6px' }}>
                {t('translationPrefix')}
              </span>
              <span>{getSentenceTranslation(contextSentence)}</span>
            </div>
          )}
        </div>
      )}

      {/* Retenção Contínua SRS (0-100%) e Curva de Esquecimento */}
      <div style={{ padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {t('masteryLabel')} SRS
          </span>
          <span className={`srs-status-badge ${statusColor}`} style={{ fontSize: '0.7rem' }}>
            {masteryScore}% • {statusColor === 'orange' ? t('popoverCriticalStatus') : statusColor === 'yellow' ? t('popoverInProgressStatus') : t('popoverMasteredStatus')}
          </span>
        </div>
        <div className="retention-meter-bar">
          <div className={`retention-meter-fill ${statusColor}`} style={{ width: `${masteryScore}%` }} />
        </div>
      </div>

      {/* Botões de Ação: Raio-X IA, Salvar no Cofre e Fixar */}
      <div className="popover-actions">
        <button
          type="button"
          className="btn-secondary popover-deep-dive-btn"
          onClick={() => {
            closeTokenPopover();
            openDeepDive(activeToken.text, getSentenceText(contextSentence));
          }}
          title={t('popoverDeepDiveTooltip')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            padding: '8px 10px',
            fontSize: '0.8rem',
            fontWeight: 700,
            background: 'var(--bg-card)',
            border: '1px solid var(--flower-500)',
            color: 'var(--flower-400)',
          }}
        >
          <Bot size={15} color="var(--flower-500)" />
          <span>{t('popoverDeepDiveBtn')}</span>
        </button>

        <button
          className="btn-secondary"
          style={{ flex: 1, padding: '8px 10px', fontSize: '0.8rem' }}
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
