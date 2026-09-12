import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Volume2,
  Star,
  Download,
  Upload,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { getAuxiliaryTranslation, isInvalidTranslation } from '../../services/auxiliaryLexicon';
import { resolveLocalizedWordTranslation, translateGloss } from '../../services/storyLocalization';

interface StoryDictionaryProps {
  isStarredView?: boolean;
}

export const StoryDictionary: React.FC<StoryDictionaryProps> = ({ isStarredView = false }) => {
  const {
    currentStory,
    allStoryWords,
    vocabularyVault,
    toggleStarWord,
    addWordToVault,
    speakSingleToken,
    exportVocabularyJson,
    importVocabularyJson,
    openDeepDive,
    t,
    settings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPOS, setSelectedPOS] = useState<string>('all');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Index vocabulary vault for instant O(1) row lookups
  const vaultMap = useMemo(() => {
    const map = new Map<string, typeof vocabularyVault[0]>();
    vocabularyVault.forEach((v) => {
      map.set(`${v.language}:${v.word}`, v);
    });
    return map;
  }, [vocabularyVault]);

  // Determine source word set: Starred Focus Words (from vault & current story) OR Complete Story Vocabulary
  const sourceWords = useMemo(() => {
    if (!isStarredView) {
      return allStoryWords;
    }

    const map = new Map<string, typeof allStoryWords[0]>();

    // 1. All starred words in current language stored in the vault
    vocabularyVault
      .filter((v) => v.isStarred && v.language === currentStory.language)
      .forEach((v) => map.set(v.word, v));

    // 2. Any starred words in current story
    allStoryWords
      .filter((w) => {
        const vaultWord = vaultMap.get(`${currentStory.language}:${w.word}`);
        return vaultWord?.isStarred || w.isStarred;
      })
      .forEach((w) => {
        if (!map.has(w.word)) {
          map.set(w.word, w);
        }
      });

    return Array.from(map.values());
  }, [isStarredView, allStoryWords, vocabularyVault, vaultMap, currentStory.language]);

  // Extract unique parts of speech based on active source word set
  const partsOfSpeech = useMemo(() => {
    const set = new Set<string>();
    sourceWords.forEach((w) => {
      if (w.partOfSpeech) set.add(w.partOfSpeech);
      if (w.traits?.partOfSpeech) set.add(w.traits.partOfSpeech);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [sourceWords]);

  // Filter words by search term and selected part of speech
  const filteredWords = useMemo(() => {
    return sourceWords.filter((w) => {
      const matchesSearch =
        searchTerm === '' ||
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.translation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.ruby && w.ruby.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.definition && w.definition.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.traits?.hanzi && w.traits.hanzi.includes(searchTerm)) ||
        (w.traits?.pinyin && w.traits.pinyin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.traits?.radicals && w.traits.radicals.includes(searchTerm));

      const matchesPOS =
        selectedPOS === 'all' ||
        w.partOfSpeech === selectedPOS ||
        w.traits?.partOfSpeech === selectedPOS;

      return matchesSearch && matchesPOS;
    });
  }, [sourceWords, searchTerm, selectedPOS]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importVocabularyJson(content);
        if (success) {
          setImportSuccess(true);
          setTimeout(() => setImportSuccess(false), 4000);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="dict-view-wrapper">
      {/* Search and Action Bar */}
      <div className="dict-action-toolbar">
        {/* Search Input */}
        <div className="dict-search-input-wrapper">
          <input
            type="text"
            className="control-input"
            placeholder={
              isStarredView
                ? `${t('pinnedWordsTab')}...`
                : t('searchPlaceholder')
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Part of Speech Filter Dropdown */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="control-select"
            style={{ width: 'auto', minWidth: 140 }}
            value={selectedPOS}
            onChange={(e) => setSelectedPOS(e.target.value)}
          >
            <option value="all">{t('filterAll')}</option>
            {partsOfSpeech.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {/* Export / Download JSON */}
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
            onClick={() => exportVocabularyJson()}
            title={t('exportJson')}
          >
            <Download size={15} color="var(--flower-400)" />
            <span>JSON</span>
          </button>

          {/* Import JSON Button */}
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
            onClick={() => fileInputRef.current?.click()}
            title={t('dictImportJsonTitle')}
          >
            <Upload size={15} color="var(--text-secondary)" />
            <span>{t('dictImportBtn')}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {importSuccess && (
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--srs-mastered-bg)',
            border: '1px solid var(--srs-mastered-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--srs-mastered-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{t('dictImportSuccessMsg')}</span>
        </div>
      )}

      {/* Tabular Dictionary Container */}
      <div className="dict-table-container">
        {/* Table Title Bar with Stats */}
        <div className="dict-table-header-bar">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800 }}>
              {isStarredView
                ? `⭐ ${t('pinnedWordsTab')} (${filteredWords.length} / ${sourceWords.length})`
                : `📖 ${t('storyWordsTab')} (${filteredWords.length} / ${allStoryWords.length})`}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isStarredView
                ? t('pinnedWordsTab')
                : `Index: "${currentStory.title}"`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {isStarredView ? (
              <>
                <span className="stat-pill highlight-orange" style={{ fontSize: '0.76rem' }}>
                  {sourceWords.length} {t('pinnedWordsTab')}
                </span>
                <span className="stat-pill highlight-amber" style={{ fontSize: '0.76rem' }}>
                  {sourceWords.filter((w) => (w.occurrences || 1) > 1).length}
                </span>
                <span className="stat-pill" style={{ fontSize: '0.76rem' }} title="JSON Master">
                  {vocabularyVault.filter((v) => v.language === currentStory.language).length} JSON
                </span>
              </>
            ) : (
              <>
                <span className="stat-pill highlight-orange" style={{ fontSize: '0.76rem' }}>
                  {allStoryWords.length} {t('storyWordsTab')}
                </span>
                <span className="stat-pill highlight-amber" style={{ fontSize: '0.76rem' }}>
                  {allStoryWords.filter((w) => (w.occurrences || 1) > 1).length}
                </span>
                <span className="stat-pill" style={{ fontSize: '0.76rem' }} title="JSON Master">
                  {vocabularyVault.filter((v) => v.language === currentStory.language).length} JSON
                </span>
              </>
            )}
          </div>
        </div>

        {/* Empty State when no starred words are saved */}
        {isStarredView && sourceWords.length === 0 ? (
          <div className="dict-empty-starred-state">
            <div className="empty-star-icon-circle">
              <Star size={32} color="#ffb703" fill="#ffb703" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, margin: '14px 0 8px', color: 'var(--text-primary)' }}>
              {t('pinnedWordsTab')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: 460, textAlign: 'center', lineHeight: 1.6, margin: '0 0 16px' }}>
              {t('noTermsFound')}
            </p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('noTermsFound')}
          </div>
        ) : (
          /* The Full Structured Table */
          <div className="dict-table-scroll-wrapper">
            <table className="dict-table">
              <thead>
                <tr>
                  <th style={{ width: '3%' }}>#</th>
                  <th style={{ width: '22%' }}>{t('dictColTerm')}</th>
                  <th style={{ width: '10%' }}>{t('dictColType')}</th>
                  <th style={{ width: '20%' }}>{t('dictColTranslation')}</th>
                  <th style={{ width: '15%' }}>{t('dictColSRS')}</th>
                  <th style={{ width: '6%', textAlign: 'center' }}>{t('dictColFreq')}</th>
                  <th style={{ width: '17%' }}>{t('dictColContext')}</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>{t('dictColActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredWords.map((entry, idx) => {
                  const vaultWord = vaultMap.get(`${currentStory.language}:${entry.word}`);
                  const isStarred = vaultWord?.isStarred || entry.isStarred || false;
                  const isPinned = vaultWord?.isPinned || entry.isPinned || isStarred;

                  // Retenção contínua e status color (0-100%)
                  const masteryScore = vaultWord?.masteryScore ?? entry.masteryScore ?? 25;
                  const statusColor = vaultWord?.statusColor ?? entry.statusColor ?? (masteryScore <= 35 ? 'orange' : masteryScore <= 70 ? 'yellow' : 'green');
                  const repetitionWeight = vaultWord?.repetitionWeight ?? entry.repetitionWeight ?? (isPinned ? 4 : masteryScore <= 35 ? 4 : masteryScore <= 70 ? 2 : 1);

                  // Traços do Mandarim
                  const traits = (vaultWord?.traits || entry.traits || {}) as any;
                  const radicals = traits?.radicals || (traits?.radicalChar ? `${traits.radicalChar} (${traits.radicalMeaning || ''})` : null);
                  const hskLevel = traits?.hskLevel || traits?.hsk_level;

                  return (
                    <tr key={entry.id || idx}>
                      {/* Index */}
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {idx + 1}
                      </td>

                      {/* Term & Ruby & Chinese Traits */}
                      <td>
                        <div className="dict-word-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="dict-term-text">{entry.word}</span>
                            {isPinned && (
                              <span className="pinned-star-badge" title={t('dictPinnedTooltip')}>
                                {t('dictPinnedBadge')}
                              </span>
                            )}
                          </div>
                          {entry.ruby && (
                            <span className="dict-ruby-text">{entry.ruby}</span>
                          )}
                          {/* Exibe Radical e HSK se disponíveis */}
                          {(radicals || hskLevel) && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                              {hskLevel && (
                                <span className="trait-hsk-badge" title={settings.uiLanguage === 'en' ? 'HSK Level' : 'Nível HSK'}>
                                  {hskLevel}
                                </span>
                              )}
                              {radicals && (
                                <span className="trait-radical-badge" title="Radical (部首)">
                                  <span className="radical-char">部首</span> {radicals}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Part of Speech */}
                      <td>
                        <span className="dict-badge">
                          {entry.partOfSpeech || 'Word'}
                        </span>
                      </td>

                      {/* Translation */}
                      <td>
                        {(() => {
                          const uiLang = (settings.uiLanguage as 'pt' | 'en') || 'pt';
                          const localized = resolveLocalizedWordTranslation(
                            entry.word,
                            entry.translation || traits?.contextMeaning,
                            currentStory.language,
                            uiLang
                          );

                          const targetVocabMatch = currentStory.targetVocabulary?.find((v) => {
                            const vw = v?.word ? String(v.word).trim() : '';
                            return vw && (vw === entry.word || (entry.word.length > 1 && (entry.word.startsWith(vw) || vw.startsWith(entry.word))));
                          });
                          const safeTargetTrans = targetVocabMatch && !isInvalidTranslation(targetVocabMatch.translation, entry.word)
                            ? (resolveLocalizedWordTranslation(targetVocabMatch.word, targetVocabMatch.translation, currentStory.language, uiLang) || targetVocabMatch.translation)
                            : null;

                          const displayTranslation = localized
                            || safeTargetTrans
                            || (!isInvalidTranslation(traits?.contextMeaning, entry.word) ? (translateGloss(traits!.contextMeaning, uiLang) || traits!.contextMeaning!) : null)
                            || (!isInvalidTranslation(entry.translation, entry.word) ? (translateGloss(entry.translation, uiLang) || entry.translation) : null)
                            || (!isInvalidTranslation(entry.definition, entry.word) ? (translateGloss(entry.definition, uiLang) || entry.definition) : null)
                            || (uiLang === 'en' ? 'Context meaning' : 'Sentido no contexto');

                          const hasValidDefinition = entry.definition &&
                            !isInvalidTranslation(entry.definition, entry.word) &&
                            entry.definition !== entry.translation &&
                            entry.definition !== displayTranslation;

                          return (
                            <>
                              <div style={{ fontWeight: 600 }}>{displayTranslation}</div>
                              {hasValidDefinition && (
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  {entry.definition}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>

                      {/* Retenção SRS Contínua (0-100%) e Peso de Repetição */}
                      <td>
                        <div className="retention-meter-wrap">
                          <div className="retention-meter-label">
                            <span className={`srs-status-badge ${statusColor}`}>
                              {masteryScore}%
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: statusColor === 'orange' ? '#ea580c' : statusColor === 'yellow' ? '#d97706' : '#16a34a',
                              }}
                              title={`${t('dictRepetitionWeightTooltip')} ${repetitionWeight}x`}
                            >
                              {t('dictRepetitionWeightPrefix')} {repetitionWeight}x
                            </span>
                          </div>
                          <div className="retention-meter-bar">
                            <div
                              className={`retention-meter-fill ${statusColor}`}
                              style={{ width: `${masteryScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Frequency in Story */}
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: (entry.occurrences || 1) > 1 ? 'var(--srs-learning-bg)' : 'var(--bg-input)',
                            color: (entry.occurrences || 1) > 1 ? 'var(--flower-400)' : 'var(--text-muted)',
                            border: (entry.occurrences || 1) > 1 ? '1px solid var(--border-subtle)' : 'none',
                          }}
                          title={
                            settings.uiLanguage === 'en'
                              ? `Appears ${entry.occurrences || 1}x in this story (Total: ${vaultWord?.lifetimeOccurrences || entry.occurrences || 1}x in vault)`
                              : `Aparece ${entry.occurrences || 1}x nesta história (Acumulado: ${vaultWord?.lifetimeOccurrences || entry.occurrences || 1}x no banco JSON)`
                          }
                        >
                          {entry.occurrences || 1}x
                        </span>
                      </td>

                      {/* Context Snippet */}
                      <td>
                        <div className="dict-context-snippet" title={entry.exampleSentence}>
                          "{entry.exampleSentence}"
                        </div>
                      </td>

                      {/* Audio Pronounce, Deep Dive & Focus Star Action */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="tts-btn-icon"
                            onClick={() => speakSingleToken({ id: entry.id, text: entry.word })}
                            title={t('deepDiveListenTitle')}
                          >
                            <Volume2 size={15} />
                          </button>
                          <button
                            className="tts-btn-icon"
                            onClick={() => openDeepDive(entry.word, entry.exampleSentence || entry.definition || entry.translation)}
                            title={t('dictDeepDiveTooltip')}
                            style={{ color: 'var(--flower-400)' }}
                          >
                            <Bot size={15} />
                          </button>
                          <button
                            className="tts-btn-icon"
                            onClick={() => {
                              if (vaultWord) {
                                toggleStarWord(vaultWord.id);
                              } else {
                                addWordToVault({ ...entry, isStarred: true, isPinned: true });
                              }
                            }}
                            title={isStarred ? t('dictUnpinWordTooltip') : t('dictPinWordTooltip')}
                          >
                            <Star
                              size={15}
                              fill={isStarred ? '#ffb703' : 'none'}
                              color={isStarred ? '#ffb703' : 'var(--text-muted)'}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
