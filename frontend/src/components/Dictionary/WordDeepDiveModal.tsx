import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import { WordDeepDiveData } from '../../types';
import { getProficiencyNativeInfo } from '../../services/proficiencyUtils';
import {
  X,
  Volume2,
  Sparkles,
  Bot,
  RotateCcw,
  BookOpen,
  Puzzle,
  Network,
  Scale,
  AlertTriangle,
  Star,
  Loader2,
} from 'lucide-react';

interface WordDeepDiveModalProps {
  word: string;
  contextSentence?: string;
  onClose: () => void;
}

export const WordDeepDiveModal: React.FC<WordDeepDiveModalProps> = ({
  word,
  contextSentence = '',
  onClose,
}) => {
  const {
    currentLanguage,
    currentProficiency,
    settings,
    speakSingleToken,
    vocabularyVault,
    toggleStarWord,
    addWordToVault,
    t,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WordDeepDiveData | null>(null);

  const vaultEntry = vocabularyVault.find(
    (v) => v.word === word && v.language === currentLanguage
  );
  const isStarred = vaultEntry?.isStarred || false;

  const levelInfo = getProficiencyNativeInfo(currentLanguage, currentProficiency);
  const isCJK = currentLanguage === 'zh' || currentLanguage === 'ja';

  const loadData = useCallback(
    async (forceRefresh: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiService.fetchWordDeepDive(
          word,
          currentLanguage,
          contextSentence,
          currentProficiency,
          settings,
          forceRefresh
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar Raio-X');
      } finally {
        setLoading(false);
      }
    },
    [word, currentLanguage, contextSentence, currentProficiency, settings]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Fechar no Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleToggleStar = () => {
    if (vaultEntry) {
      toggleStarWord(vaultEntry.id);
    } else {
      addWordToVault({
        id: `vault-${Date.now()}`,
        word,
        ruby: data?.ruby || data?.pinyin,
        translation: data?.context_meaning || 'Vocábulo analisado',
        partOfSpeech: data?.part_of_speech || 'Word',
        definition: data?.context_meaning || '',
        exampleSentence: contextSentence || word,
        exampleTranslation: '',
        language: currentLanguage,
        proficiency: currentProficiency,
        isStarred: true,
        isPinned: true,
        masteryScore: 30,
        lookedUpCount: 1,
        occurrences: 1,
        lifetimeOccurrences: 1,
        srsMetrics: {
          repetition: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: new Date().toISOString(),
          stage: 'new',
          totalReviews: 0,
          correctReviews: 0,
        },
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="deep-dive-overlay" onClick={onClose}>
      <div
        className="deep-dive-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deep-dive-title"
      >
        {/* Cabeçalho do Raio-X */}
        <div className="deep-dive-header">
          <div className="deep-dive-title-area">
            <div className="deep-dive-term-row">
              <span className="deep-dive-word" id="deep-dive-title">
                {word}
              </span>
              {(data?.ruby || data?.pinyin) && (
                <span className="deep-dive-ruby">{data?.ruby || data?.pinyin}</span>
              )}
              <span
                className="deep-dive-level-badge"
                style={{ backgroundColor: `${levelInfo.color}20`, color: levelInfo.color, borderColor: `${levelInfo.color}50` }}
              >
                {data?.hsk_level || data?.level || levelInfo.badgeLabel}
              </span>
              {data?.part_of_speech && (
                <span className="deep-dive-pos-badge">{data.part_of_speech}</span>
              )}
            </div>

            <span className="deep-dive-subtitle">
              <Bot size={13} color="var(--flower-400)" />
              Raio-X Anatômico & Didático
            </span>
          </div>

          <div className="deep-dive-header-actions">
            <button
              type="button"
              className="deep-dive-action-btn"
              onClick={() => speakSingleToken({ id: word, text: word })}
              title="Ouvir pronúncia"
            >
              <Volume2 size={16} />
            </button>

            <button
              type="button"
              className="deep-dive-action-btn"
              onClick={handleToggleStar}
              title={isStarred ? 'Remover estrela' : 'Fixar no Cofre'}
              style={{ color: isStarred ? '#ffb703' : 'inherit' }}
            >
              <Star size={16} fill={isStarred ? '#ffb703' : 'none'} />
            </button>

            <button
              type="button"
              className="deep-dive-action-btn"
              onClick={() => loadData(true)}
              disabled={loading}
              title="Regenerar análise com IA"
            >
              <RotateCcw size={16} className={loading ? 'spin-animation' : ''} />
            </button>

            <button
              type="button"
              className="deep-dive-close-btn"
              onClick={onClose}
              title="Fechar (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="deep-dive-body">
          {loading && (
            <div className="deep-dive-loading-state">
              <Loader2 size={32} className="spin-animation" color="var(--flower-500)" />
              <p className="deep-dive-loading-text">
                Analisando caracteres, radicais e nuances didáticas com IA...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="deep-dive-error-state">
              <AlertTriangle size={28} color="#ef4444" />
              <p>{error}</p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => loadData(true)}
                style={{ marginTop: '10px' }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="deep-dive-cards-container">
              {/* 1. Sentido em Contexto */}
              <div className="deep-dive-card">
                <div className="deep-dive-card-header">
                  <BookOpen size={16} color="var(--flower-500)" />
                  <h4 className="deep-dive-card-title">Sentido em Contexto</h4>
                </div>
                <div className="deep-dive-card-content">
                  <p className="deep-dive-context-meaning">
                    {data.context_meaning || 'Uso padrão na narrativa.'}
                  </p>
                  {contextSentence && (
                    <blockquote className="deep-dive-sentence-quote">
                      "{contextSentence}"
                    </blockquote>
                  )}
                </div>
              </div>

              {/* 2. Anatomia dos Caracteres & Radicais (CJK) OU Raízes & Etimologia (Alfabéticas) */}
              {isCJK ? (
                data.character_anatomy && data.character_anatomy.length > 0 && (
                  <div className="deep-dive-card">
                    <div className="deep-dive-card-header">
                      <Puzzle size={16} color="#3b82f6" />
                      <h4 className="deep-dive-card-title">Anatomia do Caractere & Radicais (部首)</h4>
                    </div>
                    <div className="deep-dive-card-content">
                      <div className="deep-dive-anatomy-grid">
                        {data.character_anatomy.map((item, idx) => (
                          <div key={idx} className="deep-dive-anatomy-item">
                            <div className="deep-dive-anatomy-char-box">
                              <span className="anatomy-char">{item.char}</span>
                              {item.radical && (
                                <span className="anatomy-radical-tag" title="Radical">
                                  {item.radical}
                                </span>
                              )}
                            </div>
                            <div className="deep-dive-anatomy-details">
                              <div className="anatomy-meaning">{item.meaning}</div>
                              {item.components && (
                                <div className="anatomy-components">{item.components}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                data.etymology_roots && (
                  <div className="deep-dive-card">
                    <div className="deep-dive-card-header">
                      <Puzzle size={16} color="#3b82f6" />
                      <h4 className="deep-dive-card-title">Raízes & Etimologia</h4>
                    </div>
                    <div className="deep-dive-card-content">
                      <p className="deep-dive-etymology-text">{data.etymology_roots}</p>
                    </div>
                  </div>
                )
              )}

              {/* 3. Família de Palavras (CJK) OU Colocações Comuns (Alfabéticas) */}
              {isCJK ? (
                data.shared_characters && data.shared_characters.length > 0 && (
                  <div className="deep-dive-card">
                    <div className="deep-dive-card-header">
                      <Network size={16} color="#10b981" />
                      <h4 className="deep-dive-card-title">Família de Palavras & Ideogramas Compartilhados</h4>
                    </div>
                    <div className="deep-dive-card-content">
                      <div className="deep-dive-tags-list">
                        {data.shared_characters.map((item, idx) => (
                          <div key={idx} className="deep-dive-shared-tag">
                            <span className="shared-word-text">{item.word}</span>
                            {(item.pinyin || item.ruby) && (
                              <span className="shared-word-ruby">{item.pinyin || item.ruby}</span>
                            )}
                            <span className="shared-word-meaning">{item.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              ) : (
                data.common_collocations && data.common_collocations.length > 0 && (
                  <div className="deep-dive-card">
                    <div className="deep-dive-card-header">
                      <Network size={16} color="#10b981" />
                      <h4 className="deep-dive-card-title">Colocações & Parcerias Comuns</h4>
                    </div>
                    <div className="deep-dive-card-content">
                      <div className="deep-dive-tags-list">
                        {data.common_collocations.map((item, idx) => (
                          <div key={idx} className="deep-dive-shared-tag">
                            <span className="shared-word-text">{item.phrase}</span>
                            <span className="shared-word-meaning">{item.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* 4. Fonética & Homófonos (CJK) OU Falsos Cognatos / Homófonos (Alfabéticas) */}
              {isCJK ? (
                data.phonetics_homophones && (
                  <div className="deep-dive-card">
                    <div className="deep-dive-card-header">
                      <Volume2 size={16} color="#f59e0b" />
                      <h4 className="deep-dive-card-title">Fonética & Homófonos</h4>
                    </div>
                    <div className="deep-dive-card-content">
                      {(data.phonetics_homophones.pinyin_tone_tip || data.phonetics_homophones.tip) && (
                        <p className="deep-dive-phonetics-tip">
                          💡 {data.phonetics_homophones.pinyin_tone_tip || data.phonetics_homophones.tip}
                        </p>
                      )}
                      {data.phonetics_homophones.homophones && data.phonetics_homophones.homophones.length > 0 && (
                        <div className="deep-dive-homophones-wrap">
                          <span className="deep-dive-sub-label">Sons semelhantes / Mesma pronúncia:</span>
                          <div className="deep-dive-pills-list">
                            {data.phonetics_homophones.homophones.map((h, idx) => (
                              <span key={idx} className="deep-dive-homophone-pill">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                data.false_friends_or_homophones && (
                  <div className="deep-dive-card">
                    <div className="deep-dive-card-header">
                      <AlertTriangle size={16} color="#f59e0b" />
                      <h4 className="deep-dive-card-title">Falsos Cognatos & Pronúncia</h4>
                    </div>
                    <div className="deep-dive-card-content">
                      <p className="deep-dive-phonetics-tip">
                        ⚠️ {data.false_friends_or_homophones}
                      </p>
                    </div>
                  </div>
                )
              )}

              {/* 5. Sinônimos & Diferenças Práticas */}
              {data.synonyms_and_nuances && data.synonyms_and_nuances.length > 0 && (
                <div className="deep-dive-card">
                  <div className="deep-dive-card-header">
                    <Scale size={16} color="#8b5cf6" />
                    <h4 className="deep-dive-card-title">Sinônimos & Diferenças de Uso</h4>
                  </div>
                  <div className="deep-dive-card-content">
                    <div className="deep-dive-synonyms-list">
                      {data.synonyms_and_nuances.map((item, idx) => (
                        <div key={idx} className="deep-dive-synonym-item">
                          <span className="synonym-word">{item.synonym}</span>
                          <span className="synonym-diff">{item.difference}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé informativo discreto */}
        <div className="deep-dive-footer">
          <span className="deep-dive-footer-text">
            ✨ Síntese didática gerada sob demanda • Memorizada em cache para acesso instantâneo
          </span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
