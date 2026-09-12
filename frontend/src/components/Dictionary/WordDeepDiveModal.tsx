import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/apiService';
import { WordDeepDiveData } from '../../types';
import { getProficiencyNativeInfo } from '../../services/proficiencyUtils';
import { getAuxiliaryRuby, toRomaji } from '../../services/auxiliaryPhonetics';
import {
  X,
  Volume2,
  Sparkles,
  Bot,
  RotateCcw,
  BookOpen,
  FileText,
  Copy,
  Check,
  Download,
  Star,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface WordDeepDiveModalProps {
  word: string;
  contextSentence?: string;
  onClose: () => void;
}

/**
 * Converte dados legados em um dossiê Markdown estruturado e uniforme
 */
function generateMarkdownFromLegacyData(
  word: string,
  language: string,
  data: WordDeepDiveData | null,
  contextSentence: string,
  uiLanguage: string
): string {
  if (!data) return '';
  const isEn = uiLanguage === 'en';
  const isCJK = language === 'zh' || language === 'ja';
  let ruby = data.ruby || data.pinyin || '';
  if (language === 'ja' && ruby) {
    ruby = toRomaji(ruby);
  }
  const pos = data.part_of_speech || (isCJK ? 'Palavra CJK' : 'Vocábulo');
  const level = data.hsk_level || data.level || '';

  let md = `# 📖 ${word} ${ruby ? `[${ruby}] ` : ''}• ${pos} ${level ? `• ${level}` : ''}\n\n`;

  // 1. Sentido no contexto
  md += `## 🎯 1. ${isEn ? 'Meaning in Context & Nuance' : 'Sentido no Contexto & Nuance'}\n`;
  if (data.context_meaning) {
    md += `- **${isEn ? 'Direct Definition' : 'Definição Direta'}:** ${data.context_meaning}\n`;
  }
  if (contextSentence) {
    md += `- **${isEn ? 'Narrative Sentence' : 'Frase Original'}:** "${contextSentence}"\n`;
  }
  md += '\n';

  // 2. Anatomia de Caracteres ou Etimologia
  if (isCJK && data.character_anatomy && data.character_anatomy.length > 0) {
    md += `## 🧩 2. ${isEn ? 'Character Anatomy & Radicals' : 'Anatomia dos Caracteres & Radicais'}\n`;
    for (const item of data.character_anatomy) {
      const parts = [
        item.radical ? `Radical: \`${item.radical}\`` : '',
        item.components ? `Componentes: ${item.components}` : '',
        item.meaning ? `Significado: ${item.meaning}` : '',
      ]
        .filter(Boolean)
        .join(' | ');
      md += `- **${item.char}:** ${parts}\n`;
    }
    md += '\n';
  } else if (data.etymology_roots) {
    md += `## 🧩 2. ${isEn ? 'Origins & Etymology' : 'Origem & Etimologia'}\n`;
    md += `${data.etymology_roots}\n\n`;
  }

  // 3. Família de Palavras
  if (isCJK && data.shared_characters && data.shared_characters.length > 0) {
    md += `## 🌳 3. ${isEn ? 'Word Family & Compounds' : 'Família de Palavras & Compostos'}\n`;
    for (const item of data.shared_characters) {
      let itemRuby = item.ruby || item.pinyin || (language === 'ja' ? getAuxiliaryRuby(item.word, 'ja') : undefined);
      if (language === 'ja' && itemRuby) {
        itemRuby = toRomaji(itemRuby);
      }
      const r = itemRuby ? ` [${itemRuby}]` : '';
      md += `- **${item.word}**${r}: ${item.meaning}\n`;
    }
    md += '\n';
  } else if (data.common_collocations && data.common_collocations.length > 0) {
    md += `## 🌳 3. ${isEn ? 'Common Collocations' : 'Colocações Comuns'}\n`;
    for (const item of data.common_collocations) {
      md += `- **${item.phrase}**: ${item.meaning}\n`;
    }
    md += '\n';
  }

  // 4. Fonética e Cuidados
  if (isCJK && data.phonetics_homophones) {
    md += `## ⚠️ 4. ${isEn ? 'Phonetics & Pronunciation' : 'Fonética, Tons & Armadilhas'}\n`;
    const tip = data.phonetics_homophones.pinyin_tone_tip || data.phonetics_homophones.tip;
    if (tip) md += `- **${isEn ? 'Pronunciation Tip' : 'Dica de Pronúncia'}:** ${tip}\n`;
    if (data.phonetics_homophones.homophones && data.phonetics_homophones.homophones.length > 0) {
      md += `- **${isEn ? 'Similar Sounds' : 'Sons Parecidos'}:** ${data.phonetics_homophones.homophones.join(', ')}\n`;
    }
    md += '\n';
  } else if (data.false_friends_or_homophones) {
    md += `## ⚠️ 4. ${isEn ? 'False Friends & Pitfalls' : 'Falsos Cognatos & Armadilhas'}\n`;
    md += `${data.false_friends_or_homophones}\n\n`;
  }

  // 5. Sinônimos
  if (data.synonyms_and_nuances && data.synonyms_and_nuances.length > 0) {
    md += `## ⚖️ 5. ${isEn ? 'Synonyms & Nuances' : 'Sinônimos & Diferenças Práticas'}\n`;
    for (const item of data.synonyms_and_nuances) {
      md += `- **${item.synonym}**: ${item.difference}\n`;
    }
    md += '\n';
  }

  return md.trim();
}

/**
 * Renderizador de texto com formatação inline: **bold**, *italic*, `code`
 */
function renderInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="deep-dive-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="deep-dive-strong">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="deep-dive-em">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return parts.length > 0 ? parts : text;
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
  const [viewMode, setViewMode] = useState<'dossier' | 'raw'>('dossier');
  const [copied, setCopied] = useState(false);

  const vaultEntry = vocabularyVault.find(
    (v) => v.word === word && v.language === currentLanguage
  );
  const isStarred = vaultEntry?.isStarred || false;

  const levelInfo = getProficiencyNativeInfo(
    currentLanguage,
    currentProficiency,
    settings.uiLanguage || 'pt'
  );

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
        setError(
          err instanceof Error
            ? err.message
            : settings.uiLanguage === 'en'
            ? 'Failed to load Deep Dive'
            : 'Falha ao carregar Raio-X'
        );
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

  // Monta texto Markdown final (prioriza markdown_content retornado pela IA)
  const markdownText = useMemo(() => {
    const content = data?.markdown_content || data?.markdownContent;
    if (content && content.trim().length > 0) {
      return content.trim();
    }
    return generateMarkdownFromLegacyData(
      word,
      currentLanguage,
      data,
      contextSentence,
      settings.uiLanguage || 'pt'
    );
  }, [data, word, currentLanguage, contextSentence, settings.uiLanguage]);

  // Copiar Markdown para a área de transferência
  const handleCopyMarkdown = async () => {
    if (!markdownText) return;
    try {
      await navigator.clipboard.writeText(markdownText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown to clipboard:', err);
    }
  };

  // Download do arquivo .md
  const handleDownloadMarkdown = () => {
    if (!markdownText) return;
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${word.replace(/\s+/g, '_')}_deep_dive.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleStar = () => {
    if (vaultEntry) {
      toggleStarWord(vaultEntry.id);
    } else {
      let rubyToSave = data?.ruby || data?.pinyin || getAuxiliaryRuby(word, currentLanguage);
      if (currentLanguage === 'ja' && rubyToSave) {
        rubyToSave = toRomaji(rubyToSave);
      }
      addWordToVault({
        id: `vault-${Date.now()}`,
        word,
        ruby: rubyToSave,
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

  // Divisão do Markdown em seções para renderização elegante no dossiê
  const parsedSections = useMemo(() => {
    if (!markdownText) return [];

    const lines = markdownText.split('\n');
    const sections: { title: string; lines: string[] }[] = [];
    let currentTitle = '';
    let currentLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        if (currentTitle || currentLines.length > 0) {
          sections.push({ title: currentTitle, lines: currentLines });
        }
        currentTitle = line.replace(/^##\s+/, '').trim();
        currentLines = [];
      } else {
        currentLines.push(line);
      }
    }

    if (currentTitle || currentLines.length > 0) {
      sections.push({ title: currentTitle, lines: currentLines });
    }

    return sections;
  }, [markdownText]);

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
              {(() => {
                let effectiveRuby = data?.ruby || data?.pinyin || getAuxiliaryRuby(word, currentLanguage);
                if (currentLanguage === 'ja' && effectiveRuby) {
                  effectiveRuby = toRomaji(effectiveRuby);
                }
                return effectiveRuby ? (
                  <span className="deep-dive-ruby">{effectiveRuby}</span>
                ) : null;
              })()}
              <span
                className="deep-dive-level-badge"
                style={{
                  backgroundColor: `${levelInfo.color}20`,
                  color: levelInfo.color,
                  borderColor: `${levelInfo.color}50`,
                }}
              >
                {data?.hsk_level || data?.level || levelInfo.badgeLabel}
              </span>
              {data?.part_of_speech && (
                <span className="deep-dive-pos-badge">{data.part_of_speech}</span>
              )}
            </div>

            <span className="deep-dive-subtitle">
              <Bot size={13} color="var(--flower-400)" />
              {t('deepDiveSubtitle')}
            </span>
          </div>

          <div className="deep-dive-header-actions">
            <button
              type="button"
              className="deep-dive-action-btn"
              onClick={() => speakSingleToken({ id: word, text: word })}
              title={t('deepDiveListenTitle')}
            >
              <Volume2 size={16} />
            </button>

            <button
              type="button"
              className="deep-dive-action-btn"
              onClick={handleToggleStar}
              title={isStarred ? t('deepDiveRemoveStarTitle') : t('deepDivePinToVaultTitle')}
              style={{ color: isStarred ? '#ffb703' : 'inherit' }}
            >
              <Star size={16} fill={isStarred ? '#ffb703' : 'none'} />
            </button>

            <button
              type="button"
              className="deep-dive-action-btn"
              onClick={() => loadData(true)}
              disabled={loading}
              title={t('deepDiveRegenerateTitle')}
            >
              <RotateCcw size={16} className={loading ? 'spin-animation' : ''} />
            </button>

            <button
              type="button"
              className="deep-dive-close-btn"
              onClick={onClose}
              title={t('deepDiveCloseEsc')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar com Alternador de Visualização (Dossiê vs Markdown Bruto) e Ações Rápidas */}
        {!loading && !error && (
          <div className="deep-dive-toolbar">
            <div className="deep-dive-tabs-group">
              <button
                type="button"
                className={`deep-dive-tab-btn ${viewMode === 'dossier' ? 'active' : ''}`}
                onClick={() => setViewMode('dossier')}
              >
                <BookOpen size={14} />
                <span>{t('deepDiveDossierTab')}</span>
              </button>
              <button
                type="button"
                className={`deep-dive-tab-btn ${viewMode === 'raw' ? 'active' : ''}`}
                onClick={() => setViewMode('raw')}
              >
                <FileText size={14} />
                <span>{t('deepDiveRawTab')}</span>
              </button>
            </div>

            <div className="deep-dive-actions-group">
              <button
                type="button"
                className={`deep-dive-action-chip ${copied ? 'copied' : ''}`}
                onClick={handleCopyMarkdown}
                title="Copiar texto Markdown para anotações / Obsidian"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? t('deepDiveCopiedBtn') : t('deepDiveCopyBtn')}</span>
              </button>

              <button
                type="button"
                className="deep-dive-action-chip"
                onClick={handleDownloadMarkdown}
                title="Baixar dossiê como arquivo .md"
              >
                <Download size={14} />
                <span>{t('deepDiveDownloadBtn')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="deep-dive-body">
          {loading && (
            <div className="deep-dive-loading-state">
              <Loader2 size={32} className="spin-animation" color="var(--flower-500)" />
              <p className="deep-dive-loading-text">{t('deepDiveLoadingText')}</p>
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
                {t('deepDiveTryAgain')}
              </button>
            </div>
          )}

          {/* Modo Dossiê Formatado */}
          {!loading && !error && viewMode === 'dossier' && (
            <div className="deep-dive-cards-container">
              {parsedSections.map((sec, secIdx) => {
                // Seção de topo (antes de ##)
                if (!sec.title) {
                  const headerLines = sec.lines.filter((l) => l.trim().length > 0);
                  if (headerLines.length === 0) return null;
                  return (
                    <div key={secIdx} className="deep-dive-dossier-card deep-dive-intro-card">
                      {headerLines.map((line, lIdx) => {
                        if (line.startsWith('# ')) {
                          return (
                            <h3 key={lIdx} className="deep-dive-hero-title">
                              {renderInlineFormatting(line.replace(/^#\s+/, ''))}
                            </h3>
                          );
                        }
                        return (
                          <p key={lIdx} className="deep-dive-lead-text">
                            {renderInlineFormatting(line)}
                          </p>
                        );
                      })}
                    </div>
                  );
                }

                // Seções principais (## 1. Sentido..., ## 2. Anatomia...)
                return (
                  <div key={secIdx} className="deep-dive-dossier-card">
                    <div className="deep-dive-card-header">
                      <Sparkles size={16} color="var(--flower-400)" />
                      <h4 className="deep-dive-card-title">{sec.title}</h4>
                    </div>

                    <div className="deep-dive-card-content">
                      {sec.lines.map((line, lIdx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;

                        // Citação / Frase de exemplo em destaque
                        if (trimmed.startsWith('>')) {
                          return (
                            <blockquote key={lIdx} className="deep-dive-sentence-quote">
                              {renderInlineFormatting(trimmed.replace(/^>\s*/, ''))}
                            </blockquote>
                          );
                        }

                        // Subtítulo h3
                        if (trimmed.startsWith('### ')) {
                          return (
                            <h5 key={lIdx} className="deep-dive-subheading">
                              {renderInlineFormatting(trimmed.replace(/^###\s+/, ''))}
                            </h5>
                          );
                        }

                        // Item de lista: chave-valor (- **Chave:** Valor)
                        const keyValMatch = trimmed.match(/^[-*]\s+\*\*([^*:]+):\*\*\s*(.*)$/);
                        if (keyValMatch) {
                          const [, keyLabel, valContent] = keyValMatch;
                          return (
                            <div key={lIdx} className="deep-dive-key-val-row">
                              <span className="deep-dive-key-tag">{keyLabel}:</span>
                              <span className="deep-dive-val-text">
                                {renderInlineFormatting(valContent)}
                              </span>
                            </div>
                          );
                        }

                        // Item de lista genérico (- item ou * item)
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                          return (
                            <div key={lIdx} className="deep-dive-bullet-item">
                              <span className="deep-dive-bullet-dot">•</span>
                              <div className="deep-dive-bullet-text">
                                {renderInlineFormatting(trimmed.substring(2))}
                              </div>
                            </div>
                          );
                        }

                        // Item numerado (1. item, 2. item)
                        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
                        if (numMatch) {
                          return (
                            <div key={lIdx} className="deep-dive-numbered-item">
                              <span className="deep-dive-num-badge">{numMatch[1]}</span>
                              <div className="deep-dive-bullet-text">
                                {renderInlineFormatting(numMatch[2])}
                              </div>
                            </div>
                          );
                        }

                        // Parágrafo comum
                        return (
                          <p key={lIdx} className="deep-dive-paragraph">
                            {renderInlineFormatting(trimmed)}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modo Markdown Bruto */}
          {!loading && !error && viewMode === 'raw' && (
            <div className="deep-dive-raw-container">
              <div className="deep-dive-raw-header">
                <span className="deep-dive-raw-hint">
                  {settings.uiLanguage === 'en'
                    ? 'Raw Markdown ready for Obsidian, Logseq or Anki notes:'
                    : 'Texto bruto em Markdown pronto para cópia ou estudo pessoal:'}
                </span>
                <span className="deep-dive-raw-count">{markdownText.length} caracteres</span>
              </div>
              <pre className="deep-dive-raw-pre">{markdownText}</pre>
            </div>
          )}
        </div>

        {/* Rodapé informativo discreto */}
        <div className="deep-dive-footer">
          <span className="deep-dive-footer-text">{t('deepDiveFooter')}</span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
