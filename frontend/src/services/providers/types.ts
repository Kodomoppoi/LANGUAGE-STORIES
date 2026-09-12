import { Story, LanguageCode, ProficiencyLevel, DictionaryEntry, StoryLength, RepetitionDensity, AppSettings, SSEGenerationEvent } from '../../types';

export interface GenerateStoryParams {
  language: LanguageCode;
  proficiency: ProficiencyLevel;
  contextTheme?: string;
  customPrompt?: string;
  existingDictionary?: DictionaryEntry[];
  injectNewWordsCount?: number;
  targetWords?: string[];
  storyLength?: StoryLength;
  repetitionDensity?: RepetitionDensity;
  nativeLanguage?: 'Portuguese' | 'English';
}

export interface StoryGeneratorProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(settings: AppSettings): boolean;
  generateStory(params: GenerateStoryParams, settings: AppSettings): Promise<Story>;
  generateStoryStream?(
    params: GenerateStoryParams,
    settings: AppSettings,
    onEvent: (event: SSEGenerationEvent) => void
  ): Promise<Story>;
}

