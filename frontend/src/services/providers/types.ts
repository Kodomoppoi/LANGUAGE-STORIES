import { Story, LanguageCode, ProficiencyLevel, DictionaryEntry, StoryLength, RepetitionDensity, AppSettings } from '../../types';

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
}

export interface StoryGeneratorProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(settings: AppSettings): boolean;
  generateStory(params: GenerateStoryParams, settings: AppSettings): Promise<Story>;
}
