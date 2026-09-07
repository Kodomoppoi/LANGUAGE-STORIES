import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import {
  Story,
  StoryToken,
  DictionaryEntry,
  LanguageCode,
  ProficiencyLevel,
  UserStats,
  ActiveTab,
  AppSettings,
  MascotState,
  SSEGenerationEvent,
  BookErrorInfo,
} from '../types';
import { SAMPLE_STORIES, createWelcomeStory } from '../services/sampleStories';
import {
  calculateSM2,
  isReviewDue,
  createDefaultSRSMetrics,
  calculateMasteryScore,
  getStatusColor,
  getRepetitionWeight,
  recordWordLookup,
  recordWordQuizReview,
} from '../services/srsEngine';
import { ttsService } from '../services/ttsService';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { logService } from '../services/logService';
import { getTranslation, TranslationKey } from '../services/i18n';
import { localizeStory } from '../services/storyLocalization';
import { getProficiencyNativeInfo } from '../services/proficiencyUtils';

interface AppContextType {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Language and Level
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentProficiency: ProficiencyLevel;
  setProficiency: (level: ProficiencyLevel) => void;

  // Story state
  currentStory: Story;
  setCurrentStory: (story: Story) => void;
  isGeneratingStory: boolean;

  // Book Error Diagnostic
  bookError: BookErrorInfo | null;
  setBookError: (error: BookErrorInfo | null) => void;
  clearBookError: () => void;

  // Mascote de Carregamento em Tempo Real (SSE)
  mascotState: MascotState;
  cancelGeneration: () => void;

  // All words extracted from current story for Tabular Dictionary
  allStoryWords: DictionaryEntry[];

  // Popover Token Lookup
  activeToken: StoryToken | null;
  popoverPosition: { x: number; y: number } | null;
  openTokenPopover: (token: StoryToken, event: React.MouseEvent) => void;
  closeTokenPopover: () => void;

  // Master Vocabulary Vault & JSON Archive
  vocabularyVault: DictionaryEntry[];
  addWordToVault: (entry: DictionaryEntry) => void;
  removeWordFromVault: (id: string) => void;
  toggleStarWord: (id: string) => void;
  updateWordSRS: (wordId: string, quality: number) => void;
  exportVocabularyJson: (lang?: LanguageCode) => void;
  importVocabularyJson: (jsonString: string) => boolean;

  // TTS Audio Player
  isPlayingAudio: boolean;
  currentPlayingSentenceIndex: number;
  ttsSpeed: number;
  setTtsSpeed: (speed: number) => void;
  playStoryAudio: () => void;
  pauseStoryAudio: () => void;
  stopStoryAudio: () => void;
  speakSingleToken: (token: StoryToken) => void;

  // Retention Quiz
  isQuizOpen: boolean;
  setIsQuizOpen: (open: boolean) => void;
  submitQuiz: (scoreQuality: number, targetWordIds: string[]) => void;

  // Modals & Panels
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isTerminalOpen: boolean;
  setIsTerminalOpen: (open: boolean) => void;

  // Word Deep Dive (Raio-X IA)
  deepDiveTarget: { word: string; contextSentence?: string } | null;
  openDeepDive: (word: string, contextSentence?: string) => void;
  closeDeepDive: () => void;

  // Custom Story Theme (Bottom Dock)
  customStoryTheme: string;
  setCustomStoryTheme: (theme: string) => void;

  // Generator Actions (Sidebar)
  generateNewStory: (contextTheme?: string, customPrompt?: string) => Promise<void>;
  generateWithSameDictionary: () => Promise<void>;
  increaseDictionaryAndGenerate: (numNewWords: number) => Promise<void>;

  // User Stats & Settings
  userStats: UserStats;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleTheme: () => void;

  // i18n Translation helper
  t: (key: TranslationKey) => string;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark', // Warm Woody Timber by default
  uiLanguage: 'pt', // Default interface language: Portuguese (BR)
  apiProvider: 'hybrid',
  geminiApiKey: '',
  geminiModel: 'gemini-3.6-flash',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  backendUrl: 'http://localhost:8000',
  isBackendConnected: false,
  ttsProvider: 'web-speech',
  ttsSpeed: 1.0,
  showRuby: true,
  highlightSRS: true,
  storyLength: 'standard', // Minimum 4 rich paragraphs (~350 words)
  repetitionDensity: 'high', // 3x to 5x target word occurrences
};

const DEFAULT_STATS: UserStats = {
  totalWordsRead: 0,
  starredWordsCount: 0,
  totalStoriesRead: 0,
  reviewsDueToday: 0,
  lastActiveDate: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function parseErrorToBookErrorInfo(
  err: any,
  language: LanguageCode,
  uiLang: 'pt' | 'en'
): BookErrorInfo {
  const errMsg = String(err?.message || err || '');
  const isPt = uiLang === 'pt';

  if (
    errMsg.includes('API key not valid') ||
    errMsg.includes('400') ||
    errMsg.includes('403') ||
    errMsg.includes('INVALID_ARGUMENT') ||
    errMsg.includes('Chave de API') ||
    err?.errorType === 'api_key_error'
  ) {
    return {
      type: 'api_key_error',
      title: isPt ? 'Chave de API do Gemini Inválida ou Ausente' : 'Gemini API Key Invalid or Missing',
      message: isPt
        ? 'A chave de API configurada foi recusada pelo Google (Erro 400/403). Sem uma chave válida e ativa, a IA não consegue redigir histórias.'
        : 'The configured API key was rejected by Google (Error 400/403). The AI cannot generate stories without a valid key.',
      actionInstructions: isPt
        ? [
          'Obtenha uma chave gratuita da API Gemini no Google AI Studio (aistudio.google.com).',
          'Clique em "Abrir Configurações" no botão abaixo ou no menu lateral.',
          'Cole a chave no campo "Chave de API Gemini" e clique em Testar Conexão.',
          'Clique em "Salvar Configurações" e tente gerar a história novamente.'
        ]
        : [
          'Get a free Gemini API key from Google AI Studio (aistudio.google.com).',
          'Click "Open Settings" below or in the sidebar.',
          'Paste your key into the "Gemini API Key" field and click Test Connection.',
          'Click "Save Settings" and generate your story again.'
        ],
      actionLabel: isPt ? 'Abrir Configurações' : 'Open Settings',
      actionType: 'open_settings',
      rawError: errMsg,
      language,
    };
  }

  if (
    errMsg.includes('503') ||
    errMsg.includes('high demand') ||
    errMsg.includes('Spikes in demand') ||
    errMsg.includes('temporarily unavailable') ||
    errMsg.includes('service_unavailable') ||
    err?.errorType === 'service_unavailable' ||
    err?.statusCode === 503
  ) {
    return {
      type: 'service_unavailable',
      title: isPt ? 'Servidores do Gemini em Alta Demanda Temporária (Status 503)' : 'Gemini Servers Experiencing High Demand (Status 503)',
      message: isPt
        ? 'Os servidores do Google Gemini estão com um pico passageiro de tráfego de usuários. Conforme documentação oficial do Google, esses picos costumam durar poucos instantes.'
        : 'Google Gemini servers are currently experiencing high demand. According to official Google documentation, these spikes are temporary.',
      actionInstructions: isPt
        ? [
          'Aguarde cerca de 5 a 15 segundos para que a capacidade do Google se normalize.',
          'Clique no botão "Tentar Novamente" abaixo para reenviar a história.',
          'Caso persista, você também pode alternar para outro modelo Gemini nas Configurações.'
        ]
        : [
          'Wait about 5 to 15 seconds for Google server capacity to normalize.',
          'Click the "Try Again" button below to resubmit your story request.',
          'If it persists, you can also switch to another Gemini model in Settings.'
        ],
      actionLabel: isPt ? 'Tentar Novamente' : 'Try Again',
      actionType: 'retry',
      rawError: errMsg,
      language,
    };
  }

  if (
    errMsg.includes('429') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('Quota') ||
    errMsg.includes('cota') ||
    err?.errorType === 'quota_exceeded' ||
    err?.statusCode === 429
  ) {
    return {
      type: 'quota_exceeded',
      title: isPt ? 'Cota do Gemini Excedida (Rate Limit)' : 'Gemini Rate Limit Exceeded (429)',
      message: isPt
        ? 'O limite de requisições por minuto da sua conta gratuita no Gemini foi atingido (Erro 429 RESOURCE_EXHAUSTED).'
        : 'The per-minute request limit for your free Gemini account was reached (Error 429 RESOURCE_EXHAUSTED).',
      actionInstructions: isPt
        ? [
          'Aguarde cerca de 30 a 60 segundos para que o Google renove a sua cota temporária.',
          'Ou alterne o modelo nas Configurações (ex: alternar para Gemini 3.7 Flash).',
          'Se você tiver outra chave, insira-a nas Configurações.',
          'Assim que aguardar, clique em "Tentar Novamente" abaixo.'
        ]
        : [
          'Wait about 30 to 60 seconds for Google to reset your temporary quota.',
          'Or switch models in Settings (e.g. switch to Gemini 3.7 Flash).',
          'If you have another key, enter it in Settings.',
          'Click "Try Again" below once ready.'
        ],
      actionLabel: isPt ? 'Tentar Novamente' : 'Try Again',
      actionType: 'retry',
      rawError: errMsg,
      language,
    };
  }

  return {
    type: 'generation_error',
    title: isPt ? 'Falha na Geração da História' : 'Story Generation Error',
    message: errMsg || (isPt ? 'Ocorreu um erro inesperado ao redigir a narrativa.' : 'An unexpected error occurred while writing the story.'),
    actionInstructions: isPt
      ? [
        'Verifique sua conexão com a internet.',
        'Se estiver usando o Backend Local, certifique-se de que o servidor FastAPI está ativo (porta 8000).',
        'Tente gerar novamente com outro tema ou clique no botão abaixo.'
      ]
      : [
        'Check your internet connection.',
        'If using the Local Backend, verify that the FastAPI server is running (port 8000).',
        'Try again with a different theme or click the button below.'
      ],
    actionLabel: isPt ? 'Tentar Novamente' : 'Try Again',
    actionType: 'retry',
    rawError: errMsg,
    language,
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => storageService.loadLanguage('ja'));
  const [currentProficiency, setCurrentProficiency] = useState<ProficiencyLevel>(() =>
    storageService.loadProficiencyForLanguage(storageService.loadLanguage('ja'), 'A2')
  );
  const [settings, setSettings] = useState<AppSettings>(() => storageService.loadSettings(DEFAULT_SETTINGS));
  const [userStats, setUserStats] = useState<UserStats>(() => storageService.loadStats(DEFAULT_STATS));
  const [vocabularyVault, setVocabularyVault] = useState<DictionaryEntry[]>(() =>
    storageService.loadVault([])
  );

  const [currentStory, setCurrentStory] = useState<Story>(() => {
    const lang = storageService.loadLanguage('ja');
    const uiLang = storageService.loadSettings(DEFAULT_SETTINGS).uiLanguage || 'pt';
    const welcome = createWelcomeStory(lang, uiLang);
    const loaded = storageService.loadStory(welcome);
    if (
      !loaded ||
      !loaded.paragraphs ||
      loaded.paragraphs.length === 0 ||
      loaded.title?.startsWith('Story in ') ||
      loaded.fullText?.includes('Sample sentence')
    ) {
      return welcome;
    }
    return loaded;
  });
  const [bookError, setBookError] = useState<BookErrorInfo | null>(null);
  const clearBookError = useCallback(() => setBookError(null), []);
  const [activeTab, setActiveTab] = useState<ActiveTab>('story');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [customStoryTheme, setCustomStoryTheme] = useState('');

  // Popover Token state
  const [activeToken, setActiveToken] = useState<StoryToken | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Mascote de Carregamento em Tempo Real (SSE)
  const [mascotState, setMascotState] = useState<MascotState>({
    isActive: false,
    stage: 'idle',
    action: 'idle',
    message: '',
    progress: 0,
  });

  const cancelGeneration = useCallback(() => {
    setIsGeneratingStory(false);
    setMascotState((prev) => ({ ...prev, isActive: false }));
    logService.addLog('WARN', 'FRONTEND', 'Geração da história cancelada pelo usuário.');
  }, []);

  const handleSSEEvent = useCallback((event: SSEGenerationEvent) => {
    if (event.data?.message) {
      logService.addLog('INFO', 'STAGE', `[Etapa SSE] ${event.data.message}`);
    }

    const eventName = String(event.event || '');
    const stageType = event.data?.stage || (eventName.startsWith('stage_start:') ? eventName.split(':')[1] : '');

    if (eventName === 'stage_start' || eventName.startsWith('stage_start:')) {
      if (stageType === 'curation') {
        setMascotState({
          isActive: true,
          stage: 'stage_start:curation',
          action: 'searching',
          message: event.data.message || 'Analisando seu cofre e escolhendo novas palavras...',
          progress: 25,
        });
      } else if (stageType === 'generation') {
        setMascotState((prev) => ({
          ...prev,
          isActive: true,
          stage: 'stage_start:generation',
          action: 'writing',
          message: event.data.message || 'Escrevendo a história com repetição calculada...',
          progress: 75,
        }));
      } else if (stageType === 'validation') {
        setMascotState((prev) => ({
          ...prev,
          isActive: true,
          stage: 'stage_start:generation',
          action: 'writing',
          message: event.data.message || 'Validando gramática e hidratação de traços...',
          progress: 90,
        }));
      } else {
        setMascotState((prev) => ({
          ...prev,
          isActive: true,
          stage: 'stage_start:curation',
          action: 'searching',
          message: event.data.message || 'Iniciando narrativa didática...',
          progress: 20,
        }));
      }
      return;
    }

    switch (eventName) {
      case 'stage_curation_done':
        setMascotState((prev) => ({
          ...prev,
          isActive: true,
          stage: 'stage_curation_done',
          action: 'celebrating',
          message: event.data.message || 'Vocabulário alvo curado com sucesso!',
          counts: {
            newWordsCount: event.data.count || event.data.new_words_count || 5,
            reviewWordsCount: event.data.review_words_count || 3,
          },
          progress: 50,
        }));
        break;
      case 'stage_done':
        setMascotState((prev) => ({
          ...prev,
          isActive: true,
          stage: 'stage_done',
          action: 'presenting',
          message: event.data.message || 'História e glossário prontos! Apresentando sua leitura...',
          progress: 100,
        }));
        // Fecha o overlay após mostrar o mascote alegre brevemente
        setTimeout(() => {
          setMascotState((prev) => ({ ...prev, isActive: false }));
        }, 1200);
        break;
      case 'error':
        setMascotState({
          isActive: true,
          stage: 'error',
          action: 'alert',
          message: event.data.error_message || event.data.message || 'Erro durante a geração',
          progress: 100,
        });
        setTimeout(() => {
          setMascotState((prev) => ({ ...prev, isActive: false }));
        }, 1500);
        break;
    }
  }, []);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayingSentenceIndex, setCurrentPlayingSentenceIndex] = useState(-1);
  const [ttsSpeed, setTtsSpeedState] = useState<number>(settings.ttsSpeed || 1.0);

  // Modals state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deepDiveTarget, setDeepDiveTarget] = useState<{ word: string; contextSentence?: string } | null>(null);

  const openDeepDive = useCallback((word: string, contextSentence?: string) => {
    setDeepDiveTarget({ word, contextSentence });
  }, []);

  const closeDeepDive = useCallback(() => {
    setDeepDiveTarget(null);
  }, []);

  // Synchronize Settings & Theme
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme);
    storageService.saveSettings(settings);
  }, [settings]);

  // Persist State Changes
  useEffect(() => {
    storageService.saveLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    storageService.saveProficiency(currentProficiency);
  }, [currentProficiency]);

  useEffect(() => {
    storageService.saveVault(vocabularyVault);
  }, [vocabularyVault]);

  useEffect(() => {
    storageService.saveStats(userStats);
  }, [userStats]);

  // Backend connectivity health check
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      const isConnected = await apiService.checkBackendHealth(settings.backendUrl);
      if (isMounted) {
        setSettings((prev) => ({ ...prev, isBackendConnected: isConnected }));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [settings.backendUrl]);

  // COMPUTE COMPLETE DICTIONARY TABLE (All distinct words in current story)
  const allStoryWords = useMemo<DictionaryEntry[]>(() => {
    if (!currentStory?.paragraphs) return [];

    const wordMap = new Map<string, DictionaryEntry>();

    // Pre-index vocabulary vault for instant O(1) lookup
    const vaultIndex = new Map<string, DictionaryEntry>();
    vocabularyVault.forEach((v) => {
      vaultIndex.set(`${v.language}:${v.word}`, v);
    });

    // 1. Index declared target words
    (currentStory.targetVocabulary || []).forEach((item) => {
      const vaultItem = vaultIndex.get(`${currentStory.language}:${item.word}`);
      const mastery = vaultItem?.masteryScore ?? item.masteryScore ?? 25;
      const isPinned = vaultItem?.isPinned ?? vaultItem?.isStarred ?? item.isPinned ?? item.isStarred ?? false;
      wordMap.set(item.word, {
        ...item,
        isStarred: isPinned,
        isPinned,
        masteryScore: mastery,
        statusColor: vaultItem?.statusColor ?? item.statusColor ?? getStatusColor(mastery),
        repetitionWeight: vaultItem?.repetitionWeight ?? item.repetitionWeight ?? getRepetitionWeight(mastery, isPinned),
        traits: vaultItem?.traits ?? item.traits,
        occurrences: 0,
      });
    });

    // 2. Extract every token across paragraphs and sentences
    currentStory.paragraphs.forEach((p) => {
      p.sentences.forEach((s) => {
        s.tokens.forEach((t) => {
          if (!t.text || t.partOfSpeech === 'Punctuation' || /^[\s、。,.!?;:()]+$/.test(t.text)) {
            return;
          }

          const existing = wordMap.get(t.text);
          if (existing) {
            existing.occurrences = (existing.occurrences || 0) + 1;
          } else {
            const vaultItem = vaultIndex.get(`${currentStory.language}:${t.text}`);
            const mastery = vaultItem?.masteryScore ?? t.masteryScore ?? 25;
            const isPinned = vaultItem?.isPinned ?? vaultItem?.isStarred ?? false;

            wordMap.set(t.text, {
              id: `token-${t.id}`,
              word: t.text,
              ruby: t.ruby,
              translation: t.translation || 'Termo da história',
              partOfSpeech: t.partOfSpeech || 'Palavra',
              definition: t.explanation || `Usado em: "${s.text}"`,
              exampleSentence: s.text,
              exampleTranslation: s.translation,
              language: currentStory.language,
              proficiency: currentStory.proficiency,
              isStarred: isPinned,
              isPinned,
              masteryScore: mastery,
              statusColor: vaultItem?.statusColor ?? t.statusColor ?? getStatusColor(mastery),
              repetitionWeight: vaultItem?.repetitionWeight ?? getRepetitionWeight(mastery, isPinned),
              traits: vaultItem?.traits ?? t.traits,
              occurrences: 1,
              lifetimeOccurrences: vaultItem?.lifetimeOccurrences || 1,
              lastSeenDate: new Date().toISOString(),
              srsMetrics: vaultItem?.srsMetrics || createDefaultSRSMetrics(),
              createdAt: new Date().toISOString(),
            });
          }
        });
      });
    });

    return Array.from(wordMap.values());
  }, [currentStory, vocabularyVault]);

  // AUTOMATIC MASTER HARVEST: Harvest and consolidate all tokens into master JSON bank
  useEffect(() => {
    if (!allStoryWords.length || currentStory.id === 'welcome') return;

    setVocabularyVault((prev) => {
      const vaultMap = new Map<string, DictionaryEntry>();
      prev.forEach((item) => vaultMap.set(`${item.language}:${item.word}`, item));

      allStoryWords.forEach((storyItem) => {
        const key = `${storyItem.language}:${storyItem.word}`;
        const existing = vaultMap.get(key);

        if (existing) {
          const mastery = existing.masteryScore ?? calculateMasteryScore(existing.srsMetrics, existing.lookedUpCount, existing.lastSeenDate);
          vaultMap.set(key, {
            ...existing,
            ruby: storyItem.ruby || existing.ruby,
            translation: storyItem.translation !== 'Termo da história' ? storyItem.translation : existing.translation,
            exampleSentence: storyItem.exampleSentence || existing.exampleSentence,
            exampleTranslation: storyItem.exampleTranslation || existing.exampleTranslation,
            traits: storyItem.traits || existing.traits,
            masteryScore: mastery,
            statusColor: existing.statusColor || getStatusColor(mastery),
            repetitionWeight: existing.repetitionWeight || getRepetitionWeight(mastery, existing.isPinned || existing.isStarred),
            lifetimeOccurrences: (existing.lifetimeOccurrences || 1) + (storyItem.occurrences || 1),
            lastSeenDate: new Date().toISOString(),
          });
        } else {
          const mastery = storyItem.masteryScore ?? 25;
          vaultMap.set(key, {
            ...storyItem,
            id: `vault-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            masteryScore: mastery,
            statusColor: storyItem.statusColor || getStatusColor(mastery),
            repetitionWeight: storyItem.repetitionWeight || getRepetitionWeight(mastery, storyItem.isPinned || storyItem.isStarred),
            traits: storyItem.traits,
            lifetimeOccurrences: storyItem.occurrences || 1,
            lastSeenDate: new Date().toISOString(),
          });
        }
      });

      return Array.from(vaultMap.values());
    });
  }, [currentStory.id, allStoryWords]);

  // Update stats summary (sync stars & reviews due from vault)
  useEffect(() => {
    const starredCount = vocabularyVault.filter((v) => v.isStarred).length;
    const dueCount = vocabularyVault.filter((v) => isReviewDue(v.srsMetrics.nextReviewDate)).length;

    setUserStats((prev) => ({
      ...prev,
      starredWordsCount: starredCount,
      reviewsDueToday: dueCount,
    }));
  }, [vocabularyVault]);

  // Export / Import Helpers via StorageService
  const exportVocabularyJson = useCallback(
    (lang?: LanguageCode) => {
      storageService.exportVocabularyJson(vocabularyVault, lang || currentLanguage);
    },
    [currentLanguage, vocabularyVault]
  );

  const importVocabularyJson = useCallback(
    (jsonString: string): boolean => {
      const imported = storageService.parseImportedJson(jsonString, currentLanguage, currentProficiency);
      if (!imported || !imported.length) return false;

      setVocabularyVault((prev) => {
        const vaultMap = new Map<string, DictionaryEntry>();
        prev.forEach((item) => vaultMap.set(`${item.language}:${item.word}`, item));
        imported.forEach((item) => vaultMap.set(`${item.language}:${item.word}`, item));
        return Array.from(vaultMap.values());
      });

      return true;
    },
    [currentLanguage, currentProficiency]
  );

  // Handlers
  const setLanguage = useCallback((lang: LanguageCode) => {
    setCurrentLanguage(lang);
    const savedLevel = storageService.loadProficiencyForLanguage(lang, 'A2');
    setCurrentProficiency(savedLevel);
    ttsService.stop();
    setIsPlayingAudio(false);
    setCurrentPlayingSentenceIndex(-1);

    const savedStory = storageService.loadStoryForLanguage(lang);
    if (savedStory && savedStory.id !== 'welcome' && savedStory.paragraphs?.length > 0) {
      setCurrentStory(localizeStory(savedStory, settings.uiLanguage || 'pt'));
    } else {
      const welcome = createWelcomeStory(lang, settings.uiLanguage || 'pt');
      setCurrentStory(welcome);
    }
  }, [settings.uiLanguage]);

  const setProficiency = useCallback((level: ProficiencyLevel) => {
    setCurrentProficiency(level);
    storageService.saveProficiencyForLanguage(currentLanguage, level);
    const info = getProficiencyNativeInfo(currentLanguage, level);
    logService.addLog('INFO', 'STAGE', `Dificuldade ajustada: ${info.fullLabel}`);
  }, [currentLanguage]);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (newSettings.uiLanguage) {
      setCurrentStory((prevStory) => localizeStory(prevStory, newSettings.uiLanguage!));
    }
  }, []);

  const setTtsSpeed = useCallback((speed: number) => {
    setTtsSpeedState(speed);
    setSettings((prev) => ({ ...prev, ttsSpeed: speed }));
  }, []);

  // Popover handlers with 4.1 Lookup Penalty
  const openTokenPopover = useCallback((token: StoryToken, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(window.innerWidth - 330, Math.max(20, rect.left - 40));
    const y = rect.bottom + 12 > window.innerHeight - 240 ? rect.top - 230 : rect.bottom + 10;
    setActiveToken(token);
    setPopoverPosition({ x, y });

    // 4.1 Penalidade por consultas no leitor:
    // Se o usuário clica na palavra durante a leitura para ver a tradução,
    // penaliza a pontuação recente e sinaliza necessidade de reforço
    setVocabularyVault((prev) => {
      const existing = prev.find((w) => w.word === token.text && w.language === currentLanguage);
      if (existing) {
        const updated = recordWordLookup(existing);
        return prev.map((w) => (w.id === existing.id ? updated : w));
      }
      return prev;
    });
  }, [currentLanguage]);

  const closeTokenPopover = useCallback(() => {
    setActiveToken(null);
    setPopoverPosition(null);
  }, []);

  // Vault handlers
  const addWordToVault = useCallback((entry: DictionaryEntry) => {
    setVocabularyVault((prev) => {
      if (prev.some((w) => w.word === entry.word && w.language === entry.language)) {
        return prev;
      }
      const mastery = entry.masteryScore ?? 25;
      return [{
        ...entry,
        masteryScore: mastery,
        statusColor: entry.statusColor || getStatusColor(mastery),
        repetitionWeight: entry.repetitionWeight || getRepetitionWeight(mastery, entry.isPinned || entry.isStarred),
      }, ...prev];
    });
  }, []);

  const removeWordFromVault = useCallback((id: string) => {
    setVocabularyVault((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // 4.3 Palavras fixadas (⭐): prioridade máxima
  const toggleStarWord = useCallback((id: string) => {
    setVocabularyVault((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const newPinned = !(w.isPinned ?? w.isStarred);
          const score = w.masteryScore ?? 25;
          return {
            ...w,
            isStarred: newPinned,
            isPinned: newPinned,
            repetitionWeight: getRepetitionWeight(score, newPinned),
          };
        }
        return w;
      })
    );
  }, []);

  const updateWordSRS = useCallback((wordId: string, quality: number) => {
    setVocabularyVault((prev) =>
      prev.map((w) => {
        if (w.id === wordId || w.word === wordId) {
          return recordWordQuizReview(w, quality);
        }
        return w;
      })
    );
  }, []);

  // Audio Playback
  const playStoryAudio = useCallback(() => {
    if (isPlayingAudio) {
      ttsService.pause();
      setIsPlayingAudio(false);
      return;
    }

    const sentences = currentStory.paragraphs.flatMap((p) => p.sentences);
    if (!sentences.length) return;

    setIsPlayingAudio(true);
    let currentIdx = currentPlayingSentenceIndex >= 0 ? currentPlayingSentenceIndex : 0;
    setCurrentPlayingSentenceIndex(currentIdx);

    const playSentence = (idx: number) => {
      if (idx >= sentences.length) {
        setIsPlayingAudio(false);
        setCurrentPlayingSentenceIndex(-1);
        return;
      }
      setCurrentPlayingSentenceIndex(idx);
      ttsService.speak(sentences[idx].text, currentStory.language, ttsSpeed, {
        onEnd: () => {
          playSentence(idx + 1);
        },
        onError: (err: any) => {
          setIsPlayingAudio(false);
          setCurrentPlayingSentenceIndex(-1);
          const isPt = settings.uiLanguage === 'pt';
          setBookError({
            type: 'tts_error',
            title: isPt ? 'Áudio Indisponível para este Idioma' : 'Audio Unavailable for this Language',
            message: isPt
              ? `Seu navegador não possui uma voz de leitura instalada para o idioma selecionado (${currentStory.language.toUpperCase()}).`
              : `Your browser has no text-to-speech voice installed for ${currentStory.language.toUpperCase()}.`,
            actionInstructions: isPt
              ? [
                'Conecte o Backend FastAPI (porta 8000) para síntese neural de alta definição com Edge-TTS.',
                'Ou adicione vozes no sistema operacional (Configurações do Windows > Hora e Idioma > Fala > Adicionar Vozes).',
                'Selecione "Edge-TTS (Backend Local)" nas Configurações do app.'
              ]
              : [
                'Connect the FastAPI backend (port 8000) for high-definition neural Edge-TTS.',
                'Or add speech voices in OS Settings (Windows Settings > Time & Language > Speech).',
                'Select "Edge-TTS (Local Backend)" in the app Settings.'
              ],
            actionLabel: isPt ? 'Dispensar' : 'Dismiss',
            actionType: 'dismiss',
            language: currentStory.language,
          });
        },
      });
    };

    playSentence(currentIdx);
  }, [isPlayingAudio, currentStory, currentPlayingSentenceIndex, ttsSpeed, settings.uiLanguage]);

  const pauseStoryAudio = useCallback(() => {
    ttsService.pause();
    setIsPlayingAudio(false);
  }, []);

  const stopStoryAudio = useCallback(() => {
    ttsService.stop();
    setIsPlayingAudio(false);
    setCurrentPlayingSentenceIndex(-1);
  }, []);

  const speakSingleToken = useCallback(
    (token: StoryToken) => {
      ttsService.speakToken(token.text, currentStory.language, ttsSpeed * 0.9);
    },
    [currentStory.language, ttsSpeed]
  );

  // Story Generator Actions com SSE Streaming e Pesos SRS
  const generateNewStory = useCallback(
    async (contextTheme?: string, customPrompt?: string) => {
      setIsGeneratingStory(true);
      setBookError(null);
      const effectiveTheme = contextTheme !== undefined ? contextTheme : (customStoryTheme.trim() || undefined);
      logService.addLog(
        'INFO',
        'FRONTEND',
        `Disparando geração (${currentLanguage.toUpperCase()} - ${currentProficiency}). Tema: ${effectiveTheme || 'Automático (mais didático)'}`
      );
      try {
        const langVaultWords = vocabularyVault.filter((v) => v.language === currentLanguage);

        // Curadoria: 4.3 Palavras fixadas (⭐ prioridade máxima), frágeis (laranja 3-4x) e revisões devidas
        const pinnedWords = langVaultWords.filter((v) => v.isPinned || v.isStarred).map((v) => v.word);
        const fragileWords = langVaultWords.filter((v) => (v.masteryScore ?? 25) <= 35).map((v) => v.word);
        const dueSRSWords = langVaultWords
          .filter((v) => isReviewDue(v.srsMetrics.nextReviewDate))
          .map((v) => v.word);

        const prioritizedTargetWords = Array.from(new Set([...pinnedWords, ...fragileWords, ...dueSRSWords])).slice(0, 10);

        const newStory = await apiService.generateStoryStream(
          {
            language: currentLanguage,
            proficiency: currentProficiency,
            contextTheme: effectiveTheme,
            customPrompt,
            targetWords: prioritizedTargetWords.length > 0 ? prioritizedTargetWords : undefined,
            existingDictionary: langVaultWords.slice(0, 15),
            storyLength: settings.storyLength,
            repetitionDensity: settings.repetitionDensity,
          },
          settings,
          handleSSEEvent
        );

        if (!newStory || !newStory.paragraphs || newStory.paragraphs.length === 0) {
          throw new Error('A história retornada pela IA está vazia ou incompleta.');
        }

        setCurrentStory(newStory);
        storageService.saveStory(newStory);
        setBookError(null);

        const storyWords = (newStory.paragraphs || []).reduce(
          (acc, p) => acc + (p.sentences || []).reduce((sAcc, s) => sAcc + (s.tokens || []).length, 0),
          0
        );
        setUserStats((prev) => ({
          ...prev,
          totalStoriesRead: prev.totalStoriesRead + 1,
          totalWordsRead: prev.totalWordsRead + storyWords,
        }));
        logService.addLog(
          'SUCCESS',
          'FRONTEND',
          `História "${newStory.title}" recebida com sucesso (${(newStory.paragraphs || []).length} parágrafos, ${(newStory.targetVocabulary || []).length} vocábulos)!`
        );
      } catch (err: any) {
        logService.addLog('ERROR', 'FRONTEND', `Erro na geração da história: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Failed to generate story:', err);
        setMascotState((prev) => ({ ...prev, isActive: false }));

        const errorInfo = parseErrorToBookErrorInfo(err, currentLanguage, (settings.uiLanguage as 'pt' | 'en') || 'pt');
        setBookError(errorInfo);

        // Se a história atual for vazia ou dummy, garante que mostre o fallback limpo de boas-vindas ("que mostra que nao tem historias")
        if (
          !currentStory.paragraphs ||
          currentStory.paragraphs.length === 0 ||
          currentStory.title?.startsWith('Story in ') ||
          currentStory.fullText?.includes('Sample sentence')
        ) {
          const welcome = createWelcomeStory(currentLanguage, settings.uiLanguage || 'pt');
          setCurrentStory(welcome);
        }
      } finally {
        setIsGeneratingStory(false);
        setMascotState((prev) => ({ ...prev, isActive: false }));
      }
    },
    [currentLanguage, currentProficiency, currentStory, settings, vocabularyVault, handleSSEEvent, customStoryTheme]
  );

  const generateWithSameDictionary = useCallback(async () => {
    setIsGeneratingStory(true);
    setBookError(null);
    try {
      const langVaultWords = vocabularyVault.filter((v) => v.language === currentLanguage);
      const newStory = await apiService.generateStoryStream(
        {
          language: currentLanguage,
          proficiency: currentProficiency,
          contextTheme: `Reinforcement Story: ${currentStory.contextTheme}`,
          existingDictionary: langVaultWords.length > 0 ? langVaultWords.slice(0, 15) : currentStory.targetVocabulary,
          storyLength: settings.storyLength,
          repetitionDensity: settings.repetitionDensity,
        },
        settings,
        handleSSEEvent
      );

      if (!newStory || !newStory.paragraphs || newStory.paragraphs.length === 0) {
        throw new Error('A história retornada pela IA está vazia ou incompleta.');
      }

      setCurrentStory(newStory);
      storageService.saveStory(newStory);
      setBookError(null);

      const storyWords = (newStory.paragraphs || []).reduce(
        (acc, p) => acc + (p.sentences || []).reduce((sAcc, s) => sAcc + (s.tokens || []).length, 0),
        0
      );
      setUserStats((prev) => ({
        ...prev,
        totalStoriesRead: prev.totalStoriesRead + 1,
        totalWordsRead: prev.totalWordsRead + storyWords,
      }));
    } catch (err: any) {
      console.error('Failed to regenerate with same dictionary:', err);
      setMascotState((prev) => ({ ...prev, isActive: false }));
      const errorInfo = parseErrorToBookErrorInfo(err, currentLanguage, (settings.uiLanguage as 'pt' | 'en') || 'pt');
      setBookError(errorInfo);
      if (
        !currentStory.paragraphs ||
        currentStory.paragraphs.length === 0 ||
        currentStory.title?.startsWith('Story in ') ||
        currentStory.fullText?.includes('Sample sentence')
      ) {
        const welcome = createWelcomeStory(currentLanguage, settings.uiLanguage || 'pt');
        setCurrentStory(welcome);
      }
    } finally {
      setIsGeneratingStory(false);
      setMascotState((prev) => ({ ...prev, isActive: false }));
    }
  }, [currentLanguage, currentProficiency, currentStory, settings, vocabularyVault, handleSSEEvent]);

  const increaseDictionaryAndGenerate = useCallback(
    async (numNewWords: number) => {
      setIsGeneratingStory(true);
      setBookError(null);
      const themeSuffix = customStoryTheme.trim() ? ` - Tema: ${customStoryTheme.trim()}` : '';
      logService.addLog('INFO', 'FRONTEND', `Injetando +${numNewWords} palavras no vocabulário e gerando nova história${themeSuffix}...`);
      try {
        const langVaultWords = vocabularyVault.filter((v) => v.language === currentLanguage);
        const newStory = await apiService.generateStoryStream(
          {
            language: currentLanguage,
            proficiency: currentProficiency,
            contextTheme: customStoryTheme.trim() ? customStoryTheme.trim() : `Expanded Story (+${numNewWords} words)`,
            existingDictionary: langVaultWords.length > 0 ? langVaultWords.slice(0, 15) : currentStory.targetVocabulary,
            injectNewWordsCount: numNewWords,
            storyLength: settings.storyLength,
            repetitionDensity: settings.repetitionDensity,
          },
          settings,
          handleSSEEvent
        );

        if (!newStory || !newStory.paragraphs || newStory.paragraphs.length === 0) {
          throw new Error('A história retornada pela IA está vazia ou incompleta.');
        }

        setCurrentStory(newStory);
        storageService.saveStory(newStory);
        setBookError(null);

        const storyWords = (newStory.paragraphs || []).reduce(
          (acc, p) => acc + (p.sentences || []).reduce((sAcc, s) => sAcc + (s.tokens || []).length, 0),
          0
        );
        setUserStats((prev) => ({
          ...prev,
          totalStoriesRead: prev.totalStoriesRead + 1,
          totalWordsRead: prev.totalWordsRead + storyWords,
        }));
        logService.addLog('SUCCESS', 'FRONTEND', `História expandida gerada com sucesso (+${numNewWords} palavras inseridas)!`);
      } catch (err: any) {
        logService.addLog('ERROR', 'FRONTEND', `Erro ao injetar palavras: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Failed to increase dictionary and generate:', err);
        setMascotState((prev) => ({ ...prev, isActive: false }));
        const errorInfo = parseErrorToBookErrorInfo(err, currentLanguage, (settings.uiLanguage as 'pt' | 'en') || 'pt');
        setBookError(errorInfo);
        if (
          !currentStory.paragraphs ||
          currentStory.paragraphs.length === 0 ||
          currentStory.title?.startsWith('Story in ') ||
          currentStory.fullText?.includes('Sample sentence')
        ) {
          const welcome = createWelcomeStory(currentLanguage, settings.uiLanguage || 'pt');
          setCurrentStory(welcome);
        }
      } finally {
        setIsGeneratingStory(false);
        setMascotState((prev) => ({ ...prev, isActive: false }));
      }
    },
    [currentLanguage, currentProficiency, currentStory, settings, vocabularyVault, handleSSEEvent, customStoryTheme]
  );

  const submitQuiz = useCallback(
    (scoreQuality: number, targetWordIds: string[]) => {
      targetWordIds.forEach((id) => {
        updateWordSRS(id, scoreQuality);
      });
    },
    [updateWordSRS]
  );

  const t = useCallback(
    (key: TranslationKey) => getTranslation(key, settings.uiLanguage || 'pt'),
    [settings.uiLanguage]
  );

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentLanguage,
        setLanguage,
        currentProficiency,
        setProficiency,
        currentStory,
        setCurrentStory,
        isGeneratingStory,
        bookError,
        setBookError,
        clearBookError,
        mascotState,
        cancelGeneration,
        allStoryWords,
        activeToken,
        popoverPosition,
        openTokenPopover,
        closeTokenPopover,
        vocabularyVault,
        addWordToVault,
        removeWordFromVault,
        toggleStarWord,
        updateWordSRS,
        exportVocabularyJson,
        importVocabularyJson,
        isPlayingAudio,
        currentPlayingSentenceIndex,
        ttsSpeed,
        setTtsSpeed,
        playStoryAudio,
        pauseStoryAudio,
        stopStoryAudio,
        speakSingleToken,
        isQuizOpen,
        setIsQuizOpen,
        submitQuiz,
        isSettingsOpen,
        setIsSettingsOpen,
        isTerminalOpen,
        setIsTerminalOpen,
        deepDiveTarget,
        openDeepDive,
        closeDeepDive,
        customStoryTheme,
        setCustomStoryTheme,
        generateNewStory,
        generateWithSameDictionary,
        increaseDictionaryAndGenerate,
        userStats,
        settings,
        updateSettings,
        toggleTheme,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
