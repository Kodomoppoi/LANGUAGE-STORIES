import { UILanguage } from '../types';

export const TRANSLATIONS = {
  // Navigation & App Bar
  appName: {
    en: 'Language Reading',
    pt: 'Leitura de Idiomas',
  },
  tabInteractive: {
    en: 'Interactive',
    pt: 'Interativo',
  },
  tabDictionary: {
    en: 'Dictionary',
    pt: 'Dicionário',
  },
  changeLanguage: {
    en: 'Change Target Language',
    pt: 'Mudar Idioma Alvo',
  },
  exportJson: {
    en: 'Download vocabulary bank as JSON',
    pt: 'Baixar banco de vocabulário em JSON',
  },
  switchToLight: {
    en: 'Switch to light desk',
    pt: 'Mudar para mesa clara',
  },
  switchToDark: {
    en: 'Switch to dark wood',
    pt: 'Mudar para madeira escura',
  },
  settingsAndHelp: {
    en: 'Settings & help',
    pt: 'Configurações e ajuda',
  },
  profileSettings: {
    en: 'AI Settings & Profile',
    pt: 'Configurações de IA & Perfil',
  },

  // Reading Page
  runningHeaderTitle: {
    en: 'Language Stories • Reading',
    pt: 'Language Stories • Leitura',
  },
  chapterPrefix: {
    en: 'Chapter',
    pt: 'Capítulo',
  },
  reading: {
    en: 'Reading',
    pt: 'Leitura',
  },
  endOfNarrative: {
    en: 'End of narrative.',
    pt: 'Fim da narrativa.',
  },
  readingComplete: {
    en: 'Reading completed!',
    pt: 'Leitura concluída!',
  },
  readingCompleteSub: {
    en: 'Lock in the words into memory.',
    pt: 'Fixe as palavras na memória.',
  },
  startMiniQuiz: {
    en: 'Start Mini-Quiz',
    pt: 'Iniciar Mini-Quiz',
  },
  prevPageTitle: {
    en: 'Previous page',
    pt: 'Página anterior',
  },
  nextPageTitle: {
    en: 'Next page',
    pt: 'Próxima página',
  },
  clickForDetails: {
    en: 'Click for translation, audio and details',
    pt: 'Clique para tradução, pronúncia e detalhes',
  },
  translationPrefix: {
    en: 'Translation:',
    pt: 'Tradução:',
  },

  // Bottom Floating Dock
  newStory: {
    en: 'New Story',
    pt: 'Nova História',
  },
  generatingStory: {
    en: 'Generating...',
    pt: 'Gerando...',
  },
  newWordQuantity: {
    en: 'new word quantity:',
    pt: 'qtd. novas palavras:',
  },
  increaseWordsTitle: {
    en: 'Increase words (+)',
    pt: 'Aumentar palavras (+)',
  },
  decreaseWordsTitle: {
    en: 'Decrease words (-)',
    pt: 'Diminuir palavras (-)',
  },
  addWordsBtn: {
    en: '+ Add',
    pt: '+ Adicionar',
  },
  addWordsTooltip: {
    en: 'Inject new words into vocabulary',
    pt: 'Injetar novas palavras no vocabulário atual',
  },
  audioBtn: {
    en: 'Audio',
    pt: 'Áudio',
  },
  pauseBtn: {
    en: 'Pause',
    pt: 'Pausar',
  },
  listenAudioTooltip: {
    en: 'Listen to narration in audio',
    pt: 'Ouvir narração em áudio',
  },
  pauseAudioTooltip: {
    en: 'Pause narration',
    pt: 'Pausar narração',
  },
  rubyToggle: {
    en: 'Ruby',
    pt: 'Ruby',
  },
  rubyTooltip: {
    en: 'Toggle reading annotations (Furigana / Pinyin)',
    pt: 'Alternar anotações de leitura (Furigana / Pinyin)',
  },
  translationToggle: {
    en: 'Translation',
    pt: 'Tradução',
  },
  translationTooltip: {
    en: 'Toggle sentence translations',
    pt: 'Alternar traduções das frases',
  },
  miniQuizBtn: {
    en: 'Mini-Quiz',
    pt: 'Mini-Quiz',
  },
  miniQuizTooltip: {
    en: 'Test retention and update SM-2 curve',
    pt: 'Testar retenção e alimentar a curva SM-2',
  },

  // Settings Modal
  settingsTitle: {
    en: 'Application & AI Settings',
    pt: 'Configurações da Aplicação & IA',
  },
  interfaceLanguageSection: {
    en: 'Interface Language',
    pt: 'Idioma da Interface',
  },
  interfaceLanguageDesc: {
    en: 'Choose whether the interface is displayed in English or Portuguese.',
    pt: 'Escolha se a interface será exibida em inglês ou português.',
  },
  langEnglish: {
    en: 'English (EN)',
    pt: 'English (Inglês)',
  },
  langPortuguese: {
    en: 'Português (PT)',
    pt: 'Português (Brasil)',
  },
  backendSection: {
    en: 'Python FastAPI Backend',
    pt: 'Backend Python FastAPI',
  },
  backendEndpointLabel: {
    en: 'Backend REST API Endpoint',
    pt: 'Endpoint REST API do Backend',
  },
  testBtn: {
    en: 'Test',
    pt: 'Testar',
  },
  backendConnected: {
    en: 'Backend is online & connected! 🚀',
    pt: 'Backend está online e conectado! 🚀',
  },
  backendUnreachable: {
    en: 'Backend is unreachable. Using smart offline hybrid.',
    pt: 'Backend inalcançável. Usando modo híbrido offline inteligente.',
  },
  geminiSection: {
    en: 'Google Gemini AI (Direct Client)',
    pt: 'Google Gemini AI (Cliente Direto)',
  },
  geminiKeyLabel: {
    en: 'Gemini API Key (Optional)',
    pt: 'Chave de API Gemini (Opcional)',
  },
  geminiKeyDesc: {
    en: 'Allows direct client-side generation without needing a backend server running.',
    pt: 'Permite geração direta no navegador sem precisar de servidor backend.',
  },
  modelSelectionLabel: {
    en: 'Model Selection',
    pt: 'Seleção do Modelo',
  },
  audioDisplaySection: {
    en: 'Audio & Display Preferences',
    pt: 'Preferências de Áudio & Exibição',
  },
  showRubyLabel: {
    en: 'Show Ruby Annotations (Furigana for JA / Pinyin for ZH)',
    pt: 'Mostrar anotações Ruby (Furigana para JA / Pinyin para ZH)',
  },
  highlightSRSLabel: {
    en: 'Highlight Target Words with SRS Status',
    pt: 'Destacar palavras-alvo com status SRS',
  },
  dataBackupSection: {
    en: 'Data & Backup',
    pt: 'Dados & Backup',
  },
  exportVaultBtn: {
    en: 'Export JSON Vault Backup',
    pt: 'Exportar Backup do Banco JSON',
  },

  // Dictionary Tab
  dictionaryHeaderTitle: {
    en: 'Vocabulary Vault & Story Terms',
    pt: 'Cofre de Vocabulário & Termos da História',
  },
  pinnedWordsTab: {
    en: 'Pinned Words',
    pt: 'Palavras Fixadas',
  },
  storyWordsTab: {
    en: 'Story Vocabulary',
    pt: 'Vocabulário da História',
  },
  searchPlaceholder: {
    en: 'Search word, translation, reading or radical...',
    pt: 'Buscar palavra, tradução, leitura ou radical...',
  },
  filterAll: {
    en: 'All Stages',
    pt: 'Todos os Estágios',
  },
  filterNew: {
    en: 'New',
    pt: 'Nova',
  },
  filterLearning: {
    en: 'Learning',
    pt: 'Aprendendo',
  },
  filterReview: {
    en: 'Review',
    pt: 'Revisão',
  },
  filterMastered: {
    en: 'Mastered',
    pt: 'Dominada',
  },
  timesConsulted: {
    en: 'Looked up',
    pt: 'Consultas',
  },
  noTermsFound: {
    en: 'No vocabulary entries found for this filter.',
    pt: 'Nenhum termo encontrado com este filtro.',
  },

  // Word Popover
  listenAudio: {
    en: 'Listen',
    pt: 'Ouvir',
  },
  pinWord: {
    en: 'Pin',
    pt: 'Fixar',
  },
  unpinWord: {
    en: 'Unpin',
    pt: 'Desafixar',
  },
  copyWord: {
    en: 'Copy',
    pt: 'Copiar',
  },
  copied: {
    en: 'Copied!',
    pt: 'Copiado!',
  },
  masteryLabel: {
    en: 'Mastery',
    pt: 'Domínio',
  },
  contextMeaningLabel: {
    en: 'Context Meaning',
    pt: 'Significado no Contexto',
  },
  partOfSpeechLabel: {
    en: 'Grammar Class',
    pt: 'Classe Gramatical',
  },
  radicalsLabel: {
    en: 'Radicals',
    pt: 'Radicais',
  },
  hskLabel: {
    en: 'HSK Level',
    pt: 'Nível HSK',
  },
  closeBtn: {
    en: 'Close',
    pt: 'Fechar',
  },
  lateralPanelTitle: {
    en: 'Word Details',
    pt: 'Detalhes da Palavra',
  },
  inVaultBadge: {
    en: 'In Vault',
    pt: 'No Cofre',
  },
  addToVaultBtn: {
    en: 'Save to Vault',
    pt: 'Salvar no Cofre',
  },

  // Retention Quiz Modal
  quizModalTitle: {
    en: 'Retention Mini-Quiz',
    pt: 'Mini-Quiz de Retenção',
  },
  questionPrefix: {
    en: 'Question',
    pt: 'Pergunta',
  },
  ofPrefix: {
    en: 'of',
    pt: 'de',
  },
  submitAnswer: {
    en: 'Check Answer',
    pt: 'Confirmar Resposta',
  },
  nextQuestion: {
    en: 'Next Question',
    pt: 'Próxima Pergunta',
  },
  finishQuiz: {
    en: 'Finish Quiz',
    pt: 'Concluir Quiz',
  },
  quizFeedbackSuccess: {
    en: 'Excellent! SRS retention score updated.',
    pt: 'Excelente! Pontuação SRS atualizada.',
  },
  quizFeedbackError: {
    en: 'Review needed. Repetition weight increased.',
    pt: 'Necessário revisar. Peso de repetição aumentado.',
  },

  // Mascot SSE Stages
  mascotCurating: {
    en: 'Curating target vocabulary and radicals...',
    pt: 'Curando vocabulário alvo e radicais...',
  },
  mascotGenerating: {
    en: 'Weaving story with natural repetition density...',
    pt: 'Tecendo narrativa com alta densidade de repetição...',
  },
  mascotValidating: {
    en: 'Validating grammar and phonetic annotations...',
    pt: 'Validando gramática e anotações fonéticas...',
  },
  mascotFinalizing: {
    en: 'Binding the book pages for reading...',
    pt: 'Encadernando páginas para a leitura...',
  },
  mascotCancel: {
    en: 'Cancel generation',
    pt: 'Cancelar geração',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

export const getTranslation = (key: TranslationKey, lang: UILanguage = 'pt'): string => {
  const item = TRANSLATIONS[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
};
