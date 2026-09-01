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
} from '../types';
import { SAMPLE_STORIES } from '../services/sampleStories';
import { calculateSM2, isReviewDue, createDefaultSRSMetrics } from '../services/srsEngine';
import { ttsService } from '../services/ttsService';
import { apiService } from '../services/apiService';

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

  // Clean User Stats (No XP / Streak)
  userStats: UserStats;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark', // Warm Woody Timber by default
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
  // State Initialization
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    return (localStorage.getItem('lang_stories_language') as LanguageCode) || 'ja';
  });

  const [currentProficiency, setCurrentProficiency] = useState<ProficiencyLevel>(() => {
    return (localStorage.getItem('lang_stories_proficiency') as ProficiencyLevel) || 'A2';
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('lang_stories_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('lang_stories_stats');
    return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
  });

  const [vocabularyVault, setVocabularyVault] = useState<DictionaryEntry[]>(() => {
    const saved = localStorage.getItem('lang_stories_vault');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return SAMPLE_STORIES['ja'].targetVocabulary;
  });

  const [currentStory, setCurrentStory] = useState<Story>(() => {
    return SAMPLE_STORIES[currentLanguage] || SAMPLE_STORIES['ja'];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('story');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Popover Token state
  const [activeToken, setActiveToken] = useState<StoryToken | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayingSentenceIndex, setCurrentPlayingSentenceIndex] = useState(-1);
  const [ttsSpeed, setTtsSpeedState] = useState<number>(settings.ttsSpeed || 1.0);

  // Modals state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Theme synchronization
  useEffect(() => {
    document.body.setAttribute('data-theme', settings.theme);
    localStorage.setItem('lang_stories_settings', JSON.stringify(settings));
  }, [settings]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('lang_stories_language', currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    localStorage.setItem('lang_stories_proficiency', currentProficiency);
  }, [currentProficiency]);

  useEffect(() => {
    localStorage.setItem('lang_stories_vault', JSON.stringify(vocabularyVault));
  }, [vocabularyVault]);

  useEffect(() => {
    localStorage.setItem('lang_stories_stats', JSON.stringify(userStats));
  }, [userStats]);

  // Backend connectivity check
  useEffect(() => {
    const checkHealth = async () => {
      const isConnected = await apiService.checkBackendHealth(settings.backendUrl);
      setSettings((prev) => ({ ...prev, isBackendConnected: isConnected }));
    };
    checkHealth();
  }, [settings.backendUrl]);

  // Extract ALL words from the current story into a comprehensive dictionary list
  const allStoryWords = useMemo(() => {
    const wordMap = new Map<string, DictionaryEntry>();

    // 1. First index target vocabulary from story
    (currentStory.targetVocabulary || []).forEach((item) => {
      wordMap.set(item.word, {
        ...item,
        occurrences: 0,
      });
    });

    // 2. Extract every single token from paragraphs and sentences
    currentStory.paragraphs.forEach((p) => {
      p.sentences.forEach((s) => {
        s.tokens.forEach((t) => {
          // Ignore purely punctuation tokens
          if (!t.text || t.partOfSpeech === 'Punctuation' || /^[\s、。,.!?;:()]+$/.test(t.text)) {
            return;
          }

          const existing = wordMap.get(t.text);
          if (existing) {
            existing.occurrences = (existing.occurrences || 0) + 1;
          } else {
            // Check if present in global vault
            const vaultItem = vocabularyVault.find((v) => v.word === t.text && v.language === currentStory.language);

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
              isStarred: vaultItem?.isStarred || false,
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

  // AUTOMATIC MASTER HARVEST: Whenever a story is active, automatically harvest and merge all its tokens into the master JSON bank
  useEffect(() => {
    if (!allStoryWords.length) return;

    setVocabularyVault((prev) => {
      const vaultMap = new Map<string, DictionaryEntry>();
      prev.forEach((item) => vaultMap.set(`${item.language}:${item.word}`, item));

      allStoryWords.forEach((storyItem) => {
        const key = `${storyItem.language}:${storyItem.word}`;
        const existing = vaultMap.get(key);

        if (existing) {
          vaultMap.set(key, {
            ...existing,
            ruby: storyItem.ruby || existing.ruby,
            translation: storyItem.translation !== 'Termo da história' ? storyItem.translation : existing.translation,
            exampleSentence: storyItem.exampleSentence || existing.exampleSentence,
            exampleTranslation: storyItem.exampleTranslation || existing.exampleTranslation,
            lifetimeOccurrences: (existing.lifetimeOccurrences || 1) + (storyItem.occurrences || 1),
            lastSeenDate: new Date().toISOString(),
          });
        } else {
          vaultMap.set(key, {
            ...storyItem,
            id: `vault-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            lifetimeOccurrences: storyItem.occurrences || 1,
            lastSeenDate: new Date().toISOString(),
          });
        }
      });

      return Array.from(vaultMap.values());
    });
  }, [currentStory.id]);

  // Update stats summary (Total words read & starred count)
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

  // Export Master Vocabulary JSON file
  const exportVocabularyJson = useCallback((lang?: LanguageCode) => {
    const targetLang = lang || currentLanguage;
    const filteredEntries = vocabularyVault.filter((v) => !targetLang || v.language === targetLang);

    const exportData = {
      app: 'Language Stories',
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      language: targetLang,
      totalWords: filteredEntries.length,
      words: filteredEntries.map((w) => ({
        word: w.word,
        ruby: w.ruby || null,
        phonetic: w.phonetic || null,
        translation: w.translation,
        partOfSpeech: w.partOfSpeech,
        definition: w.definition,
        exampleSentence: w.exampleSentence,
        exampleTranslation: w.exampleTranslation,
        language: w.language,
        proficiency: w.proficiency,
        isStarred: Boolean(w.isStarred),
        lifetimeOccurrences: w.lifetimeOccurrences || 1,
        lastSeenDate: w.lastSeenDate || w.createdAt,
        srsStage: w.srsMetrics.stage,
        srsInterval: w.srsMetrics.interval,
        nextReviewDate: w.srsMetrics.nextReviewDate,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language_stories_vocab_${targetLang}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentLanguage, vocabularyVault]);

  // Import / Restore Vocabulary JSON file
  const importVocabularyJson = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const incomingWords = Array.isArray(parsed) ? parsed : parsed.words;
      if (!Array.isArray(incomingWords)) return false;

      setVocabularyVault((prev) => {
        const vaultMap = new Map<string, DictionaryEntry>();
        prev.forEach((item) => vaultMap.set(`${item.language}:${item.word}`, item));

        incomingWords.forEach((item: any) => {
          if (!item.word) return;
          const lang = item.language || currentLanguage;
          const key = `${lang}:${item.word}`;

          vaultMap.set(key, {
            id: `vault-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            word: item.word,
            ruby: item.ruby,
            phonetic: item.phonetic,
            translation: item.translation || 'Imported vocabulary',
            partOfSpeech: item.partOfSpeech || 'Word',
            definition: item.definition || item.translation || '',
            exampleSentence: item.exampleSentence || '',
            exampleTranslation: item.exampleTranslation || '',
            language: lang,
            proficiency: item.proficiency || currentProficiency,
            isStarred: Boolean(item.isStarred),
            lifetimeOccurrences: item.lifetimeOccurrences || 1,
            lastSeenDate: item.lastSeenDate || new Date().toISOString(),
            srsMetrics: createDefaultSRSMetrics(),
            createdAt: new Date().toISOString(),
          });
        });

        return Array.from(vaultMap.values());
      });

      return true;
    } catch {
      return false;
    }
  }, [currentLanguage, currentProficiency]);

  // Handlers
  const setLanguage = useCallback((lang: LanguageCode) => {
    setCurrentLanguage(lang);
    ttsService.stop();
    setIsPlayingAudio(false);
    setCurrentPlayingSentenceIndex(-1);
    const story = SAMPLE_STORIES[lang] || SAMPLE_STORIES['ja'];
    setCurrentStory(story);
  }, []);

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
  }, []);

  const setTtsSpeed = useCallback((speed: number) => {
    setTtsSpeedState(speed);
    setSettings((prev) => ({ ...prev, ttsSpeed: speed }));
  }, []);

  // Popover handlers
  const openTokenPopover = useCallback((token: StoryToken, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(window.innerWidth - 330, Math.max(20, rect.left - 40));
    const y = rect.bottom + 12 > window.innerHeight - 240 ? rect.top - 230 : rect.bottom + 10;
    setActiveToken(token);
    setPopoverPosition({ x, y });
  }, []);

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
      return [entry, ...prev];
    });
  }, []);

  const removeWordFromVault = useCallback((id: string) => {
    setVocabularyVault((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const toggleStarWord = useCallback((id: string) => {
    setVocabularyVault((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isStarred: !w.isStarred } : w))
    );
  }, []);

  const updateWordSRS = useCallback((wordId: string, quality: number) => {
    setVocabularyVault((prev) =>
      prev.map((w) => {
        if (w.id === wordId) {
          const updatedMetrics = calculateSM2(w.srsMetrics, quality);
          return { ...w, srsMetrics: updatedMetrics };
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

  const speakSingleToken = useCallback((token: StoryToken) => {
    ttsService.speakToken(token.text, currentStory.language, ttsSpeed * 0.9);
  }, [currentStory.language, ttsSpeed]);

  // Story Generator Actions (USING THE MASTER JSON VOCABULARY BANK PRIMARILY)
  const generateNewStory = useCallback(
    async (contextTheme?: string, customPrompt?: string) => {
      setIsGeneratingStory(true);
      try {
        // Collect priority words from the master JSON bank (due review + starred + recently seen)
        const langVaultWords = vocabularyVault.filter((v) => v.language === currentLanguage);
        const dueSRSWords = langVaultWords
          .filter((v) => isReviewDue(v.srsMetrics.nextReviewDate))
          .map((v) => v.word);

        const priorityBankWords = dueSRSWords.length > 0
          ? dueSRSWords
          : langVaultWords.slice(0, 10).map((v) => v.word);

        const newStory = await apiService.generateStory(
          {
            language: currentLanguage,
            proficiency: currentProficiency,
            contextTheme,
            customPrompt,
            targetWords: priorityBankWords.length > 0 ? priorityBankWords : undefined,
            existingDictionary: langVaultWords.slice(0, 15),
            storyLength: settings.storyLength,
            repetitionDensity: settings.repetitionDensity,
          },
          settings
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
    [currentLanguage, currentProficiency, settings, vocabularyVault]
  );

  const generateWithSameDictionary = useCallback(async () => {
    setIsGeneratingStory(true);
    try {
      const langVaultWords = vocabularyVault.filter((v) => v.language === currentLanguage);
      const newStory = await apiService.generateStory(
        {
          language: currentLanguage,
          proficiency: currentProficiency,
          contextTheme: `Reinforcement Story: ${currentStory.contextTheme}`,
          existingDictionary: langVaultWords.length > 0 ? langVaultWords.slice(0, 15) : currentStory.targetVocabulary,
          storyLength: settings.storyLength,
          repetitionDensity: settings.repetitionDensity,
        },
        settings
      );
      setCurrentStory(newStory);
    } catch (err) {
      console.error('Failed to regenerate with same dictionary:', err);
    } finally {
      setIsGeneratingStory(false);
    }
  }, [currentLanguage, currentProficiency, currentStory, settings, vocabularyVault]);

  const increaseDictionaryAndGenerate = useCallback(
    async (numNewWords: number) => {
      setIsGeneratingStory(true);
      try {
        const langVaultWords = vocabularyVault.filter((v) => v.language === currentLanguage);
        const newStory = await apiService.generateStory(
          {
            language: currentLanguage,
            proficiency: currentProficiency,
            contextTheme: `Expanded Story (+${numNewWords} words)`,
            existingDictionary: langVaultWords.length > 0 ? langVaultWords.slice(0, 15) : currentStory.targetVocabulary,
            injectNewWordsCount: numNewWords,
            storyLength: settings.storyLength,
            repetitionDensity: settings.repetitionDensity,
          },
          settings
        );
        setCurrentStory(newStory);
      } catch (err) {
        console.error('Failed to increase dictionary and generate:', err);
      } finally {
        setIsGeneratingStory(false);
      }
    },
    [currentLanguage, currentProficiency, currentStory, settings, vocabularyVault]
  );

  // Quiz submission handler (Recalibrates SM-2 for the next story injections)
  const submitQuiz = useCallback(
    (scoreQuality: number, targetWordIds: string[]) => {
      targetWordIds.forEach((id) => {
        updateWordSRS(id, scoreQuality);
      });
    },
    [updateWordSRS]
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
