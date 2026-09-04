export type LanguageCode =
  | 'ja' // Japanese (Furigana)
  | 'zh' // Mandarin (Pinyin)
  | 'ar' // Arabic (RTL)
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'ko' // Korean
  | 'ru' // Russian
  | 'pt' // Portuguese
  | 'en'; // English

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type SRSStage = 'new' | 'learning' | 'review' | 'mastered';

export interface SRSMetrics {
  repetition: number;
  interval: number; // Days until next review
  easeFactor: number; // SM-2 ease factor (default: 2.5)
  nextReviewDate: string; // ISO date string
  lastReviewedDate?: string;
  stage: SRSStage;
  totalReviews: number;
  correctReviews: number;
}

export interface StoryToken {
  id: string;
  text: string;
  ruby?: string; // Furigana or Pinyin annotation
  translation?: string;
  lemma?: string;
  partOfSpeech?: string;
  explanation?: string;
  isTargetWord?: boolean; // Highlighted word for learning in this story
  srsStage?: SRSStage;
  audioText?: string;
}

export interface StorySentence {
  id: string;
  text: string;
  translation: string;
  tokens: StoryToken[];
}

export interface StoryParagraph {
  id: string;
  sentences: StorySentence[];
}

export interface DictionaryEntry {
  id: string;
  word: string;
  ruby?: string;
  phonetic?: string;
  translation: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  exampleTranslation: string;
  language: LanguageCode;
  proficiency: ProficiencyLevel;
  isStarred?: boolean;
  occurrences?: number; // How many times it appears in current story
  lifetimeOccurrences?: number; // Cumulative occurrences across all stories read
  lastSeenDate?: string;
  srsMetrics: SRSMetrics;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'fill-in-blank' | 'audio-match' | 'confidence-rating';
  prompt: string;
  targetWord: string;
  ruby?: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  contextSentence?: string;
}

export type StoryLength = 'standard' | 'medium' | 'extended' | 'epic';
export type RepetitionDensity = 'normal' | 'high' | 'intense';

export interface Story {
  id: string;
  title: string;
  titleTranslation: string;
  language: LanguageCode;
  proficiency: ProficiencyLevel;
  contextTheme: string;
  storyLength?: StoryLength;
  repetitionDensity?: RepetitionDensity;
  paragraphs: StoryParagraph[];
  targetVocabulary: DictionaryEntry[];
  quiz: QuizQuestion[];
  estimatedReadingMinutes: number;
  createdAt: string;
  isRTL?: boolean;
  fullText: string;
}

export interface UserStats {
  totalWordsRead: number;
  starredWordsCount: number;
  totalStoriesRead: number;
  reviewsDueToday: number;
  lastActiveDate: string;
}

export type ActiveTab = 'story' | 'dictionary' | 'starred' | 'library';

export interface AppSettings {
  theme: 'light' | 'dark';
  apiProvider: 'hybrid' | 'gemini' | 'ollama' | 'mock';
  geminiApiKey: string;
  geminiModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  backendUrl: string;
  isBackendConnected: boolean;
  ttsProvider: 'edge-tts' | 'web-speech';
  ttsSpeed: number;
  showRuby: boolean;
  highlightSRS: boolean;
  storyLength: StoryLength;
  repetitionDensity: RepetitionDensity;
}

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  hasRuby: boolean;
  rubyType?: 'furigana' | 'pinyin';
  isRTL?: boolean;
  sampleFontFamily: string;
  ttsVoiceHint: string;
}
