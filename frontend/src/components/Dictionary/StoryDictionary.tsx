import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Volume2,
  Star,
  Download,
  Upload,
  CheckCircle2,
} from 'lucide-react';

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
    t,
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
            title="Import JSON"
          >
            <Upload size={15} color="var(--text-secondary)" />
            <span>Import</span>
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
          <span>Arquivo JSON de vocabulário importado com sucesso!</span>
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
                  <th style={{ width: '22%' }}>Term & Reading</th>
                  <th style={{ width: '10%' }}>Type</th>
                  <th style={{ width: '20%' }}>Translation / Meaning</th>
                  <th style={{ width: '15%' }}>Retenção SRS</th>
                  <th style={{ width: '6%', textAlign: 'center' }}>Freq</th>
                  <th style={{ width: '17%' }}>Story Context</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>Actions</th>
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
                              <span className="pinned-star-badge" title="Palavra Fixada: prioridade máxima no tema">
                                ⭐ Fixada
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
                                <span className="trait-hsk-badge" title="Nível HSK">
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
                        <div style={{ fontWeight: 600 }}>{traits?.contextMeaning || entry.translation}</div>
                        {entry.definition && entry.definition !== entry.translation && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {entry.definition}
                          </div>
                        )}
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
                              title={`Peso de repetição na IA: ${repetitionWeight}x`}
                            >
                              Peso {repetitionWeight}x
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
                          title={`Aparece ${entry.occurrences || 1}x nesta história (Acumulado: ${vaultWord?.lifetimeOccurrences || entry.occurrences || 1}x no banco JSON)`}
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

                      {/* Audio Pronounce & Focus Star Action */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            className="tts-btn-icon"
                            onClick={() => speakSingleToken({ id: entry.id, text: entry.word })}
                            title="Listen to pronunciation"
                          >
                            <Volume2 size={15} />
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
                            title={isStarred ? 'Remover Fixação / Estrela' : 'Fixar Palavra ⭐ (Prioridade Máxima no Tema)'}
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
