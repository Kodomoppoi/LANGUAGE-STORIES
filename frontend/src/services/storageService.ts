import { DictionaryEntry, LanguageCode, ProficiencyLevel, UserStats, AppSettings, WordDeepDiveData, Story } from '../types';
import { createDefaultSRSMetrics } from './srsEngine';

const KEYS = {
  SETTINGS: 'lang_stories_settings',
  LANGUAGE: 'lang_stories_language',
  PROFICIENCY: 'lang_stories_proficiency',
  VAULT: 'lang_stories_vault',
  STATS: 'lang_stories_stats',
  STORY: 'lang_stories_story',
} as const;

export class StorageService {
  public loadSettings(defaultSettings: AppSettings): AppSettings {
    try {
      const saved = localStorage.getItem(KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.geminiModel || parsed.geminiModel !== 'gemini-3.6-flash') {
          parsed.geminiModel = 'gemini-3.6-flash';
        }
        return { ...defaultSettings, ...parsed };
      }
      return defaultSettings;
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

  public loadProficiencyForLanguage(lang: LanguageCode, defaultLevel: ProficiencyLevel = 'A2'): ProficiencyLevel {
    try {
      const mapRaw = localStorage.getItem('lang_stories_proficiencies_map');
      if (mapRaw) {
        const map = JSON.parse(mapRaw);
        if (map && map[lang]) return map[lang] as ProficiencyLevel;
      }
    } catch {
      // ignore
    }
    return this.loadProficiency(defaultLevel);
  }

  public saveProficiencyForLanguage(lang: LanguageCode, level: ProficiencyLevel): void {
    try {
      let map: Record<string, string> = {};
      const mapRaw = localStorage.getItem('lang_stories_proficiencies_map');
      if (mapRaw) {
        map = JSON.parse(mapRaw) || {};
      }
      map[lang] = level;
      localStorage.setItem('lang_stories_proficiencies_map', JSON.stringify(map));
      this.saveProficiency(level);
    } catch (e) {
      console.error('Failed to save proficiency map', e);
    }
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

  private isDummyStory(story: any): boolean {
    if (!story) return true;
    const title = String(story.title || '');
    const fullText = String(story.fullText || '');
    if (
      title.startsWith('Story in ') ||
      fullText.includes('Sample sentence') ||
      title.startsWith('História em ') ||
      (story.paragraphs && story.paragraphs.length === 0 && story.id !== 'welcome')
    ) {
      return true;
    }
    return false;
  }

  public loadStory(defaultStory: Story): Story {
    try {
      const saved = localStorage.getItem(KEYS.STORY);
      if (!saved) return defaultStory;
      const parsed = JSON.parse(saved);
      if (this.isDummyStory(parsed)) {
        localStorage.removeItem(KEYS.STORY);
        return defaultStory;
      }
      return parsed;
    } catch {
      return defaultStory;
    }
  }

  public saveStory(story: Story): void {
    try {
      if (story && story.id !== 'welcome' && !this.isDummyStory(story)) {
        localStorage.setItem(KEYS.STORY, JSON.stringify(story));
        localStorage.setItem(`${KEYS.STORY}_${story.language}`, JSON.stringify(story));
      }
    } catch (e) {
      console.error('Failed to save story to localStorage', e);
    }
  }

  public loadStoryForLanguage(lang: LanguageCode): Story | null {
    try {
      const saved = localStorage.getItem(`${KEYS.STORY}_${lang}`);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (this.isDummyStory(parsed)) {
        localStorage.removeItem(`${KEYS.STORY}_${lang}`);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  public clearStory(): void {
    try {
      localStorage.removeItem(KEYS.STORY);
    } catch (e) {
      console.error('Failed to clear story from localStorage', e);
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

  public loadWordDeepDive(lang: LanguageCode, word: string): WordDeepDiveData | null {
    try {
      const raw = localStorage.getItem('lang_stories_deep_dives_cache');
      if (!raw) return null;
      const cache = JSON.parse(raw);
      const key = `${lang}:${word.trim()}`;
      return cache[key] || null;
    } catch {
      return null;
    }
  }

  public saveWordDeepDive(lang: LanguageCode, word: string, data: WordDeepDiveData): void {
    try {
      const raw = localStorage.getItem('lang_stories_deep_dives_cache');
      const cache = raw ? JSON.parse(raw) : {};
      const key = `${lang}:${word.trim()}`;
      cache[key] = data;
      localStorage.setItem('lang_stories_deep_dives_cache', JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save deep dive cache to localStorage', e);
    }
  }
}

export const storageService = new StorageService();
