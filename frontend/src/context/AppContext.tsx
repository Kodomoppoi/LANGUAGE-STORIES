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
} from '../types';
import { SAMPLE_STORIES } from '../services/sampleStories';
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
import { getTranslation, TranslationKey } from '../services/i18n';
import { localizeStory } from '../services/storyLocalization';

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

  // Modals
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

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
  geminiModel: 'gemini-2.5-flash',
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
  totalWordsRead: 350,
  starredWordsCount: 14,
  totalStoriesRead: 6,
  reviewsDueToday: 5,
  lastActiveDate: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State Initialization via StorageService
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => storageService.loadLanguage('ja'));
  const [currentProficiency, setCurrentProficiency] = useState<ProficiencyLevel>(() => storageService.loadProficiency('A2'));
  const [settings, setSettings] = useState<AppSettings>(() => storageService.loadSettings(DEFAULT_SETTINGS));
  const [userStats, setUserStats] = useState<UserStats>(() => storageService.loadStats(DEFAULT_STATS));
  const [vocabularyVault, setVocabularyVault] = useState<DictionaryEntry[]>(() =>
    storageService.loadVault(SAMPLE_STORIES['ja'].targetVocabulary)
  );

  const [currentStory, setCurrentStory] = useState<Story>(() =>
    localizeStory(SAMPLE_STORIES[currentLanguage] || SAMPLE_STORIES['ja'], settings.uiLanguage || 'pt')
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('story');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

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
  }, []);

  const handleSSEEvent = useCallback((event: SSEGenerationEvent) => {
    switch (event.event) {
      case 'stage_start:curation':
        setMascotState({
          isActive: true,
          stage: event.event,
          action: 'searching',
          message: event.data.message || 'Analisando seu cofre e escolhendo novas palavras...',
          progress: 25,
        });
        break;
      case 'stage_curation_done':
        setMascotState((prev) => ({
          ...prev,
          stage: event.event,
          action: 'celebrating',
          message: event.data.message || 'Vocabulário alvo curado com sucesso!',
          counts: {
            newWordsCount: event.data.new_words_count || 5,
            reviewWordsCount: event.data.review_words_count || 3,
          },
          progress: 50,
        }));
        break;
      case 'stage_start:generation':
        setMascotState((prev) => ({
          ...prev,
          stage: event.event,
          action: 'writing',
          message: event.data.message || 'Escrevendo a história em Mandarim com repetição...',
          progress: 75,
        }));
        break;
      case 'stage_done':
        setMascotState((prev) => ({
          ...prev,
          stage: event.event,
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
          stage: event.event,
          action: 'alert',
          message: event.data.error_message || 'Erro durante a geração',
          progress: 100,
        });
        setTimeout(() => {
          setMascotState((prev) => ({ ...prev, isActive: false }));
        }, 3500);
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
    if (!allStoryWords.length) return;

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
  }, [currentStory.id]);

  // Update stats summary
  useEffect(() => {
    const starredCount = vocabularyVault.filter((v) => v.isStarred).length;
    const dueCount = vocabularyVault.filter((v) => isReviewDue(v.srsMetrics.nextReviewDate)).length;

    setUserStats((prev) => ({
      ...prev,
      starredWordsCount: starredCount,
      reviewsDueToday: dueCount,
      totalWordsRead: prev.totalWordsRead + allStoryWords.length,
    }));
  }, [vocabularyVault, allStoryWords.length]);

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
    ttsService.stop();
    setIsPlayingAudio(false);
    setCurrentPlayingSentenceIndex(-1);
    const story = SAMPLE_STORIES[lang] || SAMPLE_STORIES['ja'];
    setCurrentStory(localizeStory(story, settings.uiLanguage || 'pt'));
  }, [settings.uiLanguage]);

  const setProficiency = useCallback((level: ProficiencyLevel) => {
    setCurrentProficiency(level);
  }, []);

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
        onError: () => {
          setIsPlayingAudio(false);
          setCurrentPlayingSentenceIndex(-1);
        },
      });
    };

    playSentence(currentIdx);
  }, [isPlayingAudio, currentStory, currentPlayingSentenceIndex, ttsSpeed]);

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
            contextTheme,
            customPrompt,
            targetWords: prioritizedTargetWords.length > 0 ? prioritizedTargetWords : undefined,
            existingDictionary: langVaultWords.slice(0, 15),
            storyLength: settings.storyLength,
            repetitionDensity: settings.repetitionDensity,
          },
          settings,
          handleSSEEvent
        );

        setCurrentStory(newStory);
        setUserStats((prev) => ({
          ...prev,
          totalStoriesRead: prev.totalStoriesRead + 1,
        }));
      } catch (err) {
        console.error('Failed to generate story:', err);
      } finally {
        setIsGeneratingStory(false);
      }
    },
    [currentLanguage, currentProficiency, settings, vocabularyVault, handleSSEEvent]
  );

  const generateWithSameDictionary = useCallback(async () => {
    setIsGeneratingStory(true);
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
      setCurrentStory(newStory);
    } catch (err) {
      console.error('Failed to regenerate with same dictionary:', err);
    } finally {
      setIsGeneratingStory(false);
    }
  }, [currentLanguage, currentProficiency, currentStory, settings, vocabularyVault, handleSSEEvent]);

  const increaseDictionaryAndGenerate = useCallback(
    async (numNewWords: number) => {
      setIsGeneratingStory(true);
      try {
        const langVaultWords = vocabularyVault.filter((v) => v.language === currentLanguage);
        const newStory = await apiService.generateStoryStream(
          {
            language: currentLanguage,
            proficiency: currentProficiency,
            contextTheme: `Expanded Story (+${numNewWords} words)`,
            existingDictionary: langVaultWords.length > 0 ? langVaultWords.slice(0, 15) : currentStory.targetVocabulary,
            injectNewWordsCount: numNewWords,
            storyLength: settings.storyLength,
            repetitionDensity: settings.repetitionDensity,
          },
          settings,
          handleSSEEvent
        );
        setCurrentStory(newStory);
      } catch (err) {
        console.error('Failed to increase dictionary and generate:', err);
      } finally {
        setIsGeneratingStory(false);
      }
    },
    [currentLanguage, currentProficiency, currentStory, settings, vocabularyVault, handleSSEEvent]
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
