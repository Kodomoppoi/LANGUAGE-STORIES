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
    en: 'Toggle reading aids (Rōmaji for Japanese / Pinyin for Chinese)',
    pt: 'Alternar guias de leitura (Rōmaji no japonês / Pinyin no chinês)',
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
    en: 'Show Ruby Annotations (Rōmaji for JA / Pinyin for ZH)',
    pt: 'Mostrar anotações Ruby (Rōmaji para JA / Pinyin para ZH)',
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

  // Terminal Drawer & Theme Controls
  terminalTitle: {
    en: 'Real-time Process Terminal',
    pt: 'Terminal de Processamento em Tempo Real',
  },
  terminalTooltip: {
    en: 'Real-time Terminal (Troubleshoot & Logs)',
    pt: 'Terminal em Tempo Real (Logs e Diagnóstico)',
  },
  terminalClear: {
    en: 'Clear',
    pt: 'Limpar',
  },
  terminalCopy: {
    en: 'Copy Logs',
    pt: 'Copiar Logs',
  },
  terminalCopied: {
    en: 'Copied!',
    pt: 'Copiado!',
  },
  terminalFilterAll: {
    en: 'All',
    pt: 'Todos',
  },
  terminalFilterBackend: {
    en: 'Backend',
    pt: 'Backend',
  },
  terminalFilterFrontend: {
    en: 'Frontend',
    pt: 'Frontend',
  },
  terminalFilterErrors: {
    en: 'Errors',
    pt: 'Erros',
  },
  themeLabel: {
    en: 'Theme',
    pt: 'Tema',
  },
  themeTooltip: {
    en: 'Change story theme (leave blank for automatic didactic choice)',
    pt: 'Mudar tema da história (em branco para tema didático automático)',
  },
  themePlaceholder: {
    en: 'Automatic (most didactic)...',
    pt: 'Automático (mais didático)...',
  },
  themeAutomatic: {
    en: 'Automatic',
    pt: 'Automático',
  },
  themeClear: {
    en: 'Clear (Auto)',
    pt: 'Limpar (Auto)',
  },
  themeCustomTitle: {
    en: 'Story Theme & Context',
    pt: 'Tema e Contexto da História',
  },

  // Header
  currentDifficultyTooltip: {
    en: 'Current difficulty:',
    pt: 'Dificuldade atual:',
  },
  changeDifficultyTitle: {
    en: 'Change story level and difficulty',
    pt: 'Alterar nível e dificuldade da história',
  },

  // Sidebar
  sidebarEngineAndLang: {
    en: 'Engine & Target Language',
    pt: 'Motor & Idioma Alvo',
  },
  sidebarEngineTooltip: {
    en: 'Click to configure Backend or Gemini',
    pt: 'Clique para configurar Backend ou Gemini',
  },
  sidebarApiEngine: {
    en: 'API Engine & Provider',
    pt: 'Motor de API & Provedor',
  },
  sidebarTargetLanguage: {
    en: 'Target Language',
    pt: 'Idioma Alvo',
  },
  sidebarProficiency: {
    en: 'Proficiency Level (CEFR)',
    pt: 'Nível de Proficiência (CEFR)',
  },
  sidebarStoryLengthAndRep: {
    en: 'Length & Repetition',
    pt: 'Tamanho & Repetições',
  },
  sidebarStoryLength: {
    en: 'Story Length',
    pt: 'Tamanho da História',
  },
  sidebarRepetitionDensity: {
    en: 'Repetition Density (SRS)',
    pt: 'Densidade de Repetição (SRS)',
  },
  sidebarStoryContext: {
    en: 'Story Context & Generator',
    pt: 'Contexto da História & Geração',
  },
  sidebarContextSelector: {
    en: 'Context of Story Selector',
    pt: 'Seletor de Contexto da História',
  },
  sidebarCustomPrompt: {
    en: 'Custom Theme / Prompt',
    pt: 'Tema / Contexto Personalizado',
  },
  sidebarCustomPromptPlaceholder: {
    en: 'e.g. Lost in a cyberpunk market...',
    pt: 'ex: Perdido em uma feira cyberpunk...',
  },
  sidebarWeavingStory: {
    en: 'Weaving Story...',
    pt: 'Tecendo História...',
  },
  sidebarGenerateNewStory: {
    en: 'Generate New Story',
    pt: 'Gerar Nova História',
  },
  sidebarGenerateSameDict: {
    en: 'Generate with Same Dict',
    pt: 'Gerar com Mesmo Dicionário',
  },
  sidebarGenerateSameDictTooltip: {
    en: 'Generates a new plot reusing target vocabulary to reinforce memory',
    pt: 'Gera um novo enredo reutilizando o vocabulário para reforçar a memória',
  },
  sidebarIncreaseOption: {
    en: 'Increase Option',
    pt: 'Opção de Expansão',
  },
  sidebarWords: {
    en: 'words',
    pt: 'palavras',
  },
  sidebarAddToCurrentDict: {
    en: 'Add to Current Dictionary',
    pt: 'Adicionar ao Dicionário Atual',
  },

  // Mascot Stages & Pills
  mascotStage1Badge: {
    en: 'STAGE 1: VOCABULARY CURATION',
    pt: 'ETAPA 1: CURADORIA DE VOCABULÁRIO',
  },
  mascotStageCurationDoneBadge: {
    en: 'VOCABULARY SELECTED (SRS)',
    pt: 'VOCABULÁRIO DEFINIDO (SRS)',
  },
  mascotStage2Badge: {
    en: 'STAGE 2: NARRATIVE GENERATION',
    pt: 'ETAPA 2: GERAÇÃO DA NARRATIVA',
  },
  mascotStageDoneBadge: {
    en: 'STORY READY! ✨',
    pt: 'HISTÓRIA PRONTA! ✨',
  },
  mascotStageErrorBadge: {
    en: 'ASSISTANT NOTICE',
    pt: 'AVISO DO ASSISTENTE',
  },
  mascotHeadlineCuration: {
    en: 'Curating Ideal Vocabulary',
    pt: 'Curando Vocabulário Ideal',
  },
  mascotHeadlineSelected: {
    en: 'Target Words Selected!',
    pt: 'Palavras Alvo Selecionadas!',
  },
  mascotHeadlineGeneration: {
    en: 'Writing Your Story',
    pt: 'Escrevendo sua História',
  },
  mascotHeadlineDone: {
    en: 'All Set for Reading!',
    pt: 'Tudo Pronto para a Leitura!',
  },
  mascotHeadlineError: {
    en: 'Oops, something went wrong',
    pt: 'Ops, ocorreu um contratempo',
  },
  mascotNewWords: {
    en: 'New Words',
    pt: 'Novas Palavras',
  },
  mascotInReviewSRS: {
    en: 'in Review (SRS)',
    pt: 'em Reforço (SRS)',
  },
  mascotStep1: {
    en: '1. Curation',
    pt: '1. Curadoria',
  },
  mascotStep2: {
    en: '2. Selection',
    pt: '2. Seleção',
  },
  mascotStep3: {
    en: '3. Narrative',
    pt: '3. Narrativa',
  },
  mascotStep4: {
    en: '4. Glossary',
    pt: '4. Glossário',
  },

  // Retention Quiz
  quizHeaderTitle: {
    en: 'Story Retention & SRS Calibration',
    pt: 'Retenção da História & Calibração SRS',
  },
  quizTargetPrefix: {
    en: 'Target:',
    pt: 'Alvo:',
  },
  quizRecallQuestion: {
    en: 'How easily did you recall this target vocabulary during the narrative?',
    pt: 'Com que facilidade você lembrou deste vocabulário durante a narrativa?',
  },
  quizSm2Blackout: {
    en: 'Blackout',
    pt: 'Apagão',
  },
  quizSm2Hard: {
    en: 'Hard',
    pt: 'Difícil',
  },
  quizSm2Good: {
    en: 'Good',
    pt: 'Bom',
  },
  quizSm2Instant: {
    en: 'Instant',
    pt: 'Fácil',
  },
  quizExplanation: {
    en: 'Explanation:',
    pt: 'Explicação:',
  },
  quizCompleteBtn: {
    en: 'Complete Quiz & Update SRS Curve',
    pt: 'Concluir Quiz & Atualizar Curva SRS',
  },
  quizCompleteCelebrationTitle: {
    en: 'Retention Mini-Quiz Complete! 🌸',
    pt: 'Mini-Quiz de Retenção Concluído! 🌸',
  },
  quizCompleteCelebrationDesc: {
    en: 'Memory curves for these words have been updated and will be intelligently scheduled into your next story generations.',
    pt: 'As curvas de memória dessas palavras foram atualizadas e serão agendadas de forma inteligente nas suas próximas histórias.',
  },
  quizReturnBtn: {
    en: 'Return to Story & Dictionary',
    pt: 'Voltar para História & Dicionário',
  },

  // Word Deep Dive
  deepDiveSubtitle: {
    en: 'Anatomic & Didactic Deep Dive',
    pt: 'Raio-X Anatômico & Didático',
  },
  deepDiveListenTitle: {
    en: 'Listen to pronunciation',
    pt: 'Ouvir pronúncia',
  },
  deepDiveRemoveStarTitle: {
    en: 'Remove star',
    pt: 'Remover estrela',
  },
  deepDivePinToVaultTitle: {
    en: 'Pin to Vault',
    pt: 'Fixar no Cofre',
  },
  deepDiveRegenerateTitle: {
    en: 'Regenerate AI analysis',
    pt: 'Regenerar análise com IA',
  },
  deepDiveCloseEsc: {
    en: 'Close (Esc)',
    pt: 'Fechar (Esc)',
  },
  deepDiveDossierTab: {
    en: '📖 Study Dossier',
    pt: '📖 Dossiê de Estudo',
  },
  deepDiveRawTab: {
    en: '📄 Raw Markdown',
    pt: '📄 Markdown Bruto',
  },
  deepDiveCopyBtn: {
    en: 'Copy .md',
    pt: 'Copiar .md',
  },
  deepDiveCopiedBtn: {
    en: 'Copied! ✓',
    pt: 'Copiado! ✓',
  },
  deepDiveDownloadBtn: {
    en: 'Download .md',
    pt: 'Baixar .md',
  },
  deepDiveLoadingText: {
    en: 'Analyzing characters, radicals and didactic nuances with AI...',
    pt: 'Analisando caracteres, radicais e nuances didáticas com IA...',
  },
  deepDiveTryAgain: {
    en: 'Try Again',
    pt: 'Tentar Novamente',
  },
  deepDiveMeaningInContext: {
    en: 'Meaning in Context',
    pt: 'Sentido em Contexto',
  },
  deepDiveStandardUsage: {
    en: 'Standard usage in narrative.',
    pt: 'Uso padrão na narrativa.',
  },
  deepDiveCharAnatomy: {
    en: 'Character Anatomy & Radicals (部首)',
    pt: 'Anatomia do Caractere & Radicais (部首)',
  },
  deepDiveRootsEtymology: {
    en: 'Roots & Etymology',
    pt: 'Raízes & Etimologia',
  },
  deepDiveWordFamily: {
    en: 'Word Family & Shared Characters',
    pt: 'Família de Palavras & Ideogramas Compartilhados',
  },
  deepDiveCollocations: {
    en: 'Collocations & Common Phrases',
    pt: 'Colocações & Parcerias Comuns',
  },
  deepDivePhonetics: {
    en: 'Phonetics & Homophones',
    pt: 'Fonética & Homófonos',
  },
  deepDiveSimilarSounds: {
    en: 'Similar sounds / Homophones:',
    pt: 'Sons semelhantes / Mesma pronúncia:',
  },
  deepDiveFalseFriends: {
    en: 'False Friends & Pronunciation',
    pt: 'Falsos Cognatos & Pronúncia',
  },
  deepDiveSynonyms: {
    en: 'Synonyms & Usage Nuances',
    pt: 'Sinônimos & Diferenças de Uso',
  },
  deepDiveFooter: {
    en: '✨ Didactic synthesis generated on demand • Cached for instant access',
    pt: '✨ Síntese didática gerada sob demanda • Memorizada em cache para acesso instantâneo',
  },

  // Story Dictionary
  dictImportJsonTitle: {
    en: 'Import JSON',
    pt: 'Importar JSON',
  },
  dictImportBtn: {
    en: 'Import',
    pt: 'Importar',
  },
  dictImportSuccessMsg: {
    en: 'Vocabulary JSON file successfully imported!',
    pt: 'Arquivo JSON de vocabulário importado com sucesso!',
  },
  dictColTerm: {
    en: 'Term & Reading',
    pt: 'Termo & Leitura',
  },
  dictColType: {
    en: 'Type',
    pt: 'Tipo',
  },
  dictColTranslation: {
    en: 'Translation / Meaning',
    pt: 'Tradução / Significado',
  },
  dictColSRS: {
    en: 'SRS Retention',
    pt: 'Retenção SRS',
  },
  dictColFreq: {
    en: 'Freq',
    pt: 'Freq',
  },
  dictColContext: {
    en: 'Story Context',
    pt: 'Contexto na História',
  },
  dictColActions: {
    en: 'Actions',
    pt: 'Ações',
  },
  dictPinnedBadge: {
    en: '⭐ Pinned',
    pt: '⭐ Fixada',
  },
  dictPinnedTooltip: {
    en: 'Pinned Word: maximum priority in theme',
    pt: 'Palavra Fixada: prioridade máxima no tema',
  },
  dictRepetitionWeightPrefix: {
    en: 'Weight',
    pt: 'Peso',
  },
  dictRepetitionWeightTooltip: {
    en: 'AI repetition weight:',
    pt: 'Peso de repetição na IA:',
  },
  dictDeepDiveTooltip: {
    en: 'AI Deep Dive: In-depth explanation (radicals, components, phonetics, synonyms)',
    pt: 'Raio-X IA: Explicação profunda (radicais, componentes, fonética, sinônimos)',
  },
  dictPinWordTooltip: {
    en: 'Pin Word ⭐ (Maximum Theme Priority)',
    pt: 'Fixar Palavra ⭐ (Prioridade Máxima no Tema)',
  },
  dictUnpinWordTooltip: {
    en: 'Remove Pin / Star',
    pt: 'Remover Fixação / Estrela',
  },

  // Story Reader
  readerGoToPages: {
    en: 'Go to pages',
    pt: 'Ir para páginas',
  },
  readerQuickSuggestions: {
    en: 'Quick suggestions:',
    pt: 'Sugestões rápidas:',
  },
  readerApplyTheme: {
    en: 'Apply',
    pt: 'Confirmar',
  },
  presetCoffeeChat: {
    en: 'Coffee & Conversation',
    pt: 'Café & Conversa',
  },
  presetTrainJourney: {
    en: 'Train Journey',
    pt: 'Viagem de Trem',
  },
  presetStreetMarket: {
    en: 'Street Market & Food',
    pt: 'Feira & Comida',
  },
  presetLightMystery: {
    en: 'Light Mystery',
    pt: 'Mistério Leve',
  },
  readerThemeHintActive: {
    en: 'The next generated story will follow this theme.',
    pt: 'A próxima história gerada seguirá este tema.',
  },
  readerThemeHintBlank: {
    en: 'Leave blank for automatic didactic theme.',
    pt: 'Deixe em branco para tema didático automático.',
  },
  readerDifficultyPopoverTitle: {
    en: 'Story Difficulty',
    pt: 'Dificuldade da História',
  },
  readerLevelPrefix: {
    en: 'Level:',
    pt: 'Nível:',
  },
  readerExpandBeforeWarning: {
    en: 'Generate a story before expanding vocabulary',
    pt: 'Gere uma história antes de expandir o vocabulário',
  },
  readerStoryTargetBadge: {
    en: 'Story Target 🎯',
    pt: 'Alvo da História 🎯',
  },
  readerAudioStoryWarning: {
    en: 'Generate a story to listen',
    pt: 'Gere uma história para ouvir',
  },
  readerQuizStoryWarning: {
    en: 'Generate a story to access quiz',
    pt: 'Gere uma história para acessar o quiz',
  },

  // Navigation Rail & Tabs
  navRailReader: {
    en: 'Interactive Reader (Story)',
    pt: 'Leitor Interativo (História)',
  },
  navRailDictionary: {
    en: 'Vocabulary Table & Dictionary',
    pt: 'Tabela de Vocabulário & Dicionário',
  },
  navRailStarred: {
    en: 'Starred Words',
    pt: 'Palavras Favoritas',
  },
  navRailSaved: {
    en: 'saved',
    pt: 'salvas',
  },
  navRailScrollTop: {
    en: 'Scroll to Top',
    pt: 'Rolar para o topo',
  },
  tabCardStoryTitle: {
    en: 'Interactive Story Reader',
    pt: 'Leitura Interativa da História',
  },
  tabCardStoryDesc: {
    en: 'Interactive reader with clickable tokens, ruby phonetics, and retention quiz',
    pt: 'Leitor interativo com palavras clicáveis, fonética ruby e quiz de retenção',
  },
  tabCardStoryActive: {
    en: 'Active Reader 📖',
    pt: 'Leitor Ativo 📖',
  },
  tabCardStorySwitch: {
    en: 'Switch to Story',
    pt: 'Ir para Leitura',
  },
  tabCardDictTitle: {
    en: 'Complete Story Dictionary',
    pt: 'Dicionário Completo da História',
  },
  tabCardDictDesc: {
    en: 'Full tabular dictionary indexing all narrative words',
    pt: 'Dicionário tabular indexando todas as palavras da narrativa',
  },
  tabCardDictActive: {
    en: 'Active Table 📚',
    pt: 'Tabela Ativa 📚',
  },
  tabCardDictSwitch: {
    en: 'Switch to Dictionary',
    pt: 'Ir para Dicionário',
  },

  // TTS Player
  ttsStartNarration: {
    en: 'Start Narration',
    pt: 'Iniciar Narração',
  },
  ttsPauseNarration: {
    en: 'Pause Narration',
    pt: 'Pausar Narração',
  },
  ttsRestart: {
    en: 'Restart from beginning',
    pt: 'Reiniciar do começo',
  },
  ttsPlaying: {
    en: 'Playing Narration',
    pt: 'Reproduzindo Narração',
  },
  ttsInteractive: {
    en: 'Interactive TTS Audio',
    pt: 'Áudio TTS Interativo',
  },
  ttsSentencePrefix: {
    en: 'Sentence',
    pt: 'Frase',
  },
  ttsSpeedTooltip: {
    en: 'Narration speed:',
    pt: 'Velocidade da narração:',
  },

  // Word Popover
  popoverDeepDiveBtn: {
    en: 'AI Deep Dive',
    pt: 'Raio-X IA',
  },
  popoverDeepDiveTooltip: {
    en: 'AI Deep Dive: Detailed explanation (radicals, phonetics, components, synonyms)',
    pt: 'Raio-X IA: Explicação detalhada (radicais, fonética, componentes, sinônimos)',
  },
  popoverCriticalStatus: {
    en: 'Critical (3-4x)',
    pt: 'Crítico (3-4x)',
  },
  popoverInProgressStatus: {
    en: 'In Progress (2x)',
    pt: 'Em Progresso (2x)',
  },
  popoverMasteredStatus: {
    en: 'Mastered (1x)',
    pt: 'Dominada (1x)',
  },
  popoverContextTranslation: {
    en: 'Contextual translation',
    pt: 'Tradução em contexto',
  },
  sentenceContextLabel: {
    en: 'Sentence in Context',
    pt: 'Frase em Contexto',
  },
  sentenceOriginalTitle: {
    en: 'Original Sentence',
    pt: 'Frase Original',
  },
  sentenceTranslationTitle: {
    en: 'Sentence Translation',
    pt: 'Tradução da Frase',
  },
  ttsPlaySentence: {
    en: 'Listen to this sentence',
    pt: 'Ouvir esta frase',
  },
  ttsPauseSentence: {
    en: 'Pause sentence audio',
    pt: 'Pausar áudio da frase',
  },

  // Settings Modal Extra
  settingsTestGeminiBtn: {
    en: 'Test Gemini Connection',
    pt: 'Testar Conexão Gemini',
  },
  settingsEnterKeyFirst: {
    en: 'Enter your Gemini API key first.',
    pt: 'Insira sua chave de API Gemini primeiro.',
  },
  settingsDefaultModel: {
    en: 'Gemini 3.6 Flash (Recommended / Stable Default)',
    pt: 'Gemini 3.6 Flash (Padrão Estável / Recomendado)',
  },

  // OpenRouter & Providers Section
  openRouterSection: {
    en: 'OpenRouter Free Tier (High Speed & Fallback)',
    pt: 'OpenRouter Free Tier (Alta Velocidade & Fallback)',
  },
  openRouterKeyLabel: {
    en: 'OpenRouter API Key',
    pt: 'Chave de API OpenRouter',
  },
  openRouterKeyDesc: {
    en: 'Free API key from openrouter.ai. Provides access to lightweight free models with automatic failover.',
    pt: 'Chave gratuita de openrouter.ai. Dá acesso a modelos leves com custo zero e fallback automático.',
  },
  openRouterModelLabel: {
    en: 'OpenRouter Model (Free Tier)',
    pt: 'Modelo OpenRouter (Free Tier)',
  },
  openRouterTestBtn: {
    en: 'Test OpenRouter Connection',
    pt: 'Testar Conexão OpenRouter',
  },
  openRouterEnterKeyFirst: {
    en: 'Enter your OpenRouter API key first.',
    pt: 'Insira sua chave de API OpenRouter primeiro.',
  },
  providerSelectionLabel: {
    en: 'Active AI Provider / Orchestration Mode',
    pt: 'Modo Ativo de Orquestração / Provedor de IA',
  },
  providerHybrid: {
    en: '⚡ Auto-Fallback (Both: Gemini + OpenRouter)',
    pt: '⚡ Auto-Fallback (Ambos: Gemini + OpenRouter)',
  },
  providerHybridDesc: {
    en: 'Intelligent routing: uses Gemini by default, instantly falls back to OpenRouter upon 503 high demand or 429 quota.',
    pt: 'Roteamento inteligente: usa Gemini por padrão e alterna instantaneamente para OpenRouter em caso de erro 503 ou 429.',
  },
  providerGeminiOnly: {
    en: 'Google Gemini Only',
    pt: 'Apenas Google Gemini',
  },
  providerGeminiOnlyDesc: {
    en: 'Direct mode: Only calls Google Gemini. Displays Gemini configuration only.',
    pt: 'Modo direto: Utiliza exclusivamente o Google Gemini. Exibe apenas a configuração do Gemini.',
  },
  providerOpenRouterOnly: {
    en: 'OpenRouter Free Tier Only',
    pt: 'Apenas OpenRouter Free Tier',
  },
  providerOpenRouterOnlyDesc: {
    en: 'Direct mode: Only calls OpenRouter Free Tier. Displays OpenRouter configuration only.',
    pt: 'Modo direto: Utiliza exclusivamente o OpenRouter Free Tier. Exibe apenas a configuração do OpenRouter.',
  },
  providerMockOnly: {
    en: 'Procedural Mock (Offline / No AI)',
    pt: 'Mock Procedural (Offline / Sem IA)',
  },
  mockModeNotice: {
    en: 'Offline mode active: stories are generated using local structured templates without external AI keys.',
    pt: 'Modo offline ativo: as histórias são geradas a partir de modelos estruturados locais sem necessidade de chaves de IA.',
  },
  modelOpenRouterFree: {
    en: 'openrouter/free (Smart Auto-Router: Best available free JSON model)',
    pt: 'openrouter/free (Auto-Roteador Inteligente: Melhor modelo gratuito com JSON)',
  },
  modelGemma426b: {
    en: 'google/gemma-4-26b-a4b-it:free (MoE 4B active params - Fast & Multilingual)',
    pt: 'google/gemma-4-26b-a4b-it:free (MoE 4B params ativos - Rápido & Multilíngue)',
  },
  modelGemma431b: {
    en: 'google/gemma-4-31b-it:free (Dense 31B - High Pedagogical Precision)',
    pt: 'google/gemma-4-31b-it:free (Denso 31B - Alta Precisão Pedagógica)',
  },
  modelNemotron: {
    en: 'nvidia/nemotron-3.5-lightning:free (1M Context - Lightning Fast)',
    pt: 'nvidia/nemotron-3.5-lightning:free (1M Contexto - Ultrarrápido)',
  },
  modelLiquid: {
    en: 'liquid/lfm-2.5-2.6b:free (Ultra-compact 2.6B params)',
    pt: 'liquid/lfm-2.5-2.6b:free (Ultracompacto 2.6B params)',
  },
  rateLimit80Badge: {
    en: '🛡️ Pacing Active: Max 80% Capacity Protection',
    pt: '🛡️ Pacing Ativo: Proteção a 80% da Capacidade',
  },

  // Terminal Drawer Extra
  terminalAutoScrollTooltip: {
    en: 'Automatically scroll to latest logs',
    pt: 'Rolar automaticamente para os logs mais recentes',
  },
  terminalCloseEsc: {
    en: 'Close (Esc)',
    pt: 'Fechar (Esc)',
  },
  terminalFilterLogsPlaceholder: {
    en: 'Filter logs...',
    pt: 'Filtrar logs...',
  },
  terminalNoLogs: {
    en: 'No logs to display in current filter.',
    pt: 'Nenhum log para exibir no filtro atual.',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

export const getTranslation = (key: TranslationKey, lang: UILanguage = 'pt'): string => {
  const item = TRANSLATIONS[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
};
