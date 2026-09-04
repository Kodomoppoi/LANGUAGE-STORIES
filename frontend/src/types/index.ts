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

export type SRSStatusColor = 'orange' | 'yellow' | 'green';

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

/**
 * Traços Linguísticos Específicos para Mandarim (languages/chinese.py)
 */
export interface ChineseTraits {
  hanzi?: string;
  pinyin?: string;
  radicals?: string; // Radical estrutural do caractere (部首) e significado (ex: "氵 (água)")
  radicalChar?: string;
  radicalMeaning?: string;
  hskLevel?: string; // HSK 1 a HSK 6
  contextMeaning?: string; // Tradução e sentido exato no contexto da frase
  partOfSpeech?: string; // Classificação gramatical
}

export type LanguageTraits = ChineseTraits | Record<string, any>;

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
  masteryScore?: number; // 0 - 100%
  statusColor?: SRSStatusColor; // 'orange' | 'yellow' | 'green'
  traits?: LanguageTraits;
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
  isPinned?: boolean; // Pinned (⭐): prioridade máxima no prompt e repetição no tema
  masteryScore?: number; // Pontuação contínua de saber (0.0 a 1.0 ou 0% a 100%)
  statusColor?: SRSStatusColor; // 'orange' (0-35%), 'yellow' (36-70%), 'green' (71-100%)
  repetitionWeight?: number; // Peso de repetição (ex: 4 para laranja/fixadas, 2 para amarelo, 1 para verde)
  lookedUpCount?: number; // Quantidade de vezes consultada no leitor (penaliza score recente)
  traits?: LanguageTraits; // Traços específicos da língua (ex: ChineseTraits com Hanzi, Pinyin, Radicais, HSK)
  occurrences?: number; // Quantas vezes aparece na história atual
  lifetimeOccurrences?: number; // Cumulativo através de todas as histórias
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

export type UILanguage = 'en' | 'pt';

export interface AppSettings {
  theme: 'light' | 'dark';
  uiLanguage: UILanguage;
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

// ---------------------------------------------------------------------------
// Server-Sent Events (SSE) Streaming e Mascote de Carregamento
// ---------------------------------------------------------------------------

export type SSEStage =
  | 'idle'
  | 'stage_start:curation'
  | 'stage_curation_done'
  | 'stage_start:generation'
  | 'stage_done'
  | 'error';

export interface SSEGenerationPayload {
  message?: string;
  new_words_count?: number;
  review_words_count?: number;
  story_id?: string | number;
  title?: string;
  dictionary?: any[];
  content?: string;
  error_message?: string;
  story?: Story;
  [key: string]: any;
}

export interface SSEGenerationEvent {
  event: SSEStage;
  data: SSEGenerationPayload;
}

export interface MascotState {
  isActive: boolean;
  stage: SSEStage;
  action: 'idle' | 'searching' | 'celebrating' | 'writing' | 'presenting' | 'alert';
  message: string;
  counts?: {
    newWordsCount: number;
    reviewWordsCount: number;
  };
  progress: number;
}
