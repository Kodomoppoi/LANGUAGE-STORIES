import { DictionaryEntry, LanguageCode, ProficiencyLevel, UserStats, AppSettings } from '../types';
import { createDefaultSRSMetrics } from './srsEngine';

const KEYS = {
  SETTINGS: 'lang_stories_settings',
  LANGUAGE: 'lang_stories_language',
  PROFICIENCY: 'lang_stories_proficiency',
  VAULT: 'lang_stories_vault',
  STATS: 'lang_stories_stats',
} as const;

export class StorageService {
  public loadSettings(defaultSettings: AppSettings): AppSettings {
    try {
      const saved = localStorage.getItem(KEYS.SETTINGS);
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  }

  public saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }

  public loadLanguage(defaultLang: LanguageCode = 'ja'): LanguageCode {
    return (localStorage.getItem(KEYS.LANGUAGE) as LanguageCode) || defaultLang;
  }

  public saveLanguage(lang: LanguageCode): void {
    localStorage.setItem(KEYS.LANGUAGE, lang);
  }

  public loadProficiency(defaultLevel: ProficiencyLevel = 'A2'): ProficiencyLevel {
    return (localStorage.getItem(KEYS.PROFICIENCY) as ProficiencyLevel) || defaultLevel;
  }

  public saveProficiency(level: ProficiencyLevel): void {
    localStorage.setItem(KEYS.PROFICIENCY, level);
  }

  public loadVault(defaultEntries: DictionaryEntry[] = []): DictionaryEntry[] {
    try {
      const saved = localStorage.getItem(KEYS.VAULT);
      return saved ? JSON.parse(saved) : defaultEntries;
    } catch {
      return defaultEntries;
    }
  }

  public saveVault(vault: DictionaryEntry[]): void {
    try {
      localStorage.setItem(KEYS.VAULT, JSON.stringify(vault));
    } catch (e) {
      console.error('Failed to save vault to localStorage', e);
    }
  }

  public loadStats(defaultStats: UserStats): UserStats {
    try {
      const saved = localStorage.getItem(KEYS.STATS);
      return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    } catch {
      return defaultStats;
    }
  }

  public saveStats(stats: UserStats): void {
    try {
      localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Failed to save stats to localStorage', e);
    }
  }

  public exportVocabularyJson(vault: DictionaryEntry[], targetLang: LanguageCode): void {
    const filteredEntries = vault.filter((v) => !targetLang || v.language === targetLang);
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language_stories_vocab_${targetLang}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public parseImportedJson(
    jsonString: string,
    fallbackLang: LanguageCode,
    fallbackProficiency: ProficiencyLevel
  ): DictionaryEntry[] | null {
    try {
      const parsed = JSON.parse(jsonString);
      const incomingWords = Array.isArray(parsed) ? parsed : parsed.words;
      if (!Array.isArray(incomingWords)) return null;

      return incomingWords
        .filter((item: any) => item && typeof item.word === 'string' && item.word.trim())
        .map((item: any) => ({
          id: `vault-import-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          word: item.word.trim(),
          ruby: item.ruby || undefined,
          phonetic: item.phonetic || undefined,
          translation: item.translation || 'Imported vocabulary',
          partOfSpeech: item.partOfSpeech || 'Word',
          definition: item.definition || item.translation || '',
          exampleSentence: item.exampleSentence || '',
          exampleTranslation: item.exampleTranslation || '',
          language: item.language || fallbackLang,
          proficiency: item.proficiency || fallbackProficiency,
          isStarred: Boolean(item.isStarred),
          lifetimeOccurrences: item.lifetimeOccurrences || 1,
          lastSeenDate: item.lastSeenDate || new Date().toISOString(),
          srsMetrics: createDefaultSRSMetrics(),
          createdAt: new Date().toISOString(),
        }));
    } catch {
      return null;
    }
  }
}

export const storageService = new StorageService();
