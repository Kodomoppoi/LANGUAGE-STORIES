import {
  Story,
  LanguageCode,
  DictionaryEntry,
  AppSettings,
  StoryParagraph,
  StorySentence,
  StoryToken,
} from '../../types';
import { SAMPLE_STORIES } from '../sampleStories';
import { createDefaultSRSMetrics } from '../srsEngine';
import { localizeStory } from '../storyLocalization';
import { GenerateStoryParams, StoryGeneratorProvider } from './types';

export class ProceduralProvider implements StoryGeneratorProvider {
  public readonly id = 'procedural';
  public readonly name = 'Smart Procedural Offline';

  public isAvailable(): boolean {
    return true; // Always available as local zero-latency fallback
  }

  public async generateStory(
    params: GenerateStoryParams,
    settings?: AppSettings
  ): Promise<Story> {
    const baseStory = SAMPLE_STORIES[params.language] || SAMPLE_STORIES['ja'];
    const themeName = params.contextTheme || baseStory.contextTheme;
    const newId = `story-${params.language}-${Date.now()}`;

    // Deep copy base story
    const cloned = JSON.parse(JSON.stringify(baseStory)) as Story;
    cloned.id = newId;
    cloned.proficiency = params.proficiency;
    cloned.contextTheme = themeName;
    cloned.storyLength = params.storyLength || 'standard';
    cloned.repetitionDensity = params.repetitionDensity || 'high';
    cloned.createdAt = new Date().toISOString();

    // Scale story paragraphs if medium/extended/epic requested
    const targetLength = params.storyLength || 'standard';
    const extraCounts = { standard: 0, medium: 2, extended: 4, epic: 6 }[targetLength] || 0;

    for (let i = 0; i < extraCounts; i++) {
      const sourcePara = cloned.paragraphs[i % cloned.paragraphs.length];
      const newPara: StoryParagraph = {
        id: `p-ext-${i + 1}`,
        sentences: sourcePara.sentences.map((s: StorySentence, sIdx: number) => ({
          ...s,
          id: `s-ext-${i + 1}-${sIdx + 1}`,
          tokens: s.tokens.map((t: StoryToken, tIdx: number) => ({
            ...t,
            id: `t-ext-${i + 1}-${sIdx + 1}-${tIdx + 1}`,
          })),
        })),
      };
      cloned.paragraphs.push(newPara);
    }

    // Reconstruct fullText
    cloned.fullText = cloned.paragraphs
      .map((p) => p.sentences.map((s) => s.text).join(' '))
      .join('\n\n');

    cloned.estimatedReadingMinutes = Math.max(2, Math.round(cloned.fullText.length / 220));

    // If injectNewWordsCount requested, append bonus words
    if (params.injectNewWordsCount && params.injectNewWordsCount > 0) {
      const extraWords = this.getExtraVocabForLanguage(params.language, params.injectNewWordsCount);
      cloned.targetVocabulary = [...cloned.targetVocabulary, ...extraWords];
    }

    const uiLang = (settings?.uiLanguage || (params.nativeLanguage === 'English' ? 'en' : 'pt')) as 'en' | 'pt';
    return localizeStory(cloned, uiLang);
  }

  private getExtraVocabForLanguage(lang: LanguageCode, count: number): DictionaryEntry[] {
    const extras: Record<LanguageCode, Partial<DictionaryEntry>[]> = {
      ja: [
        { word: '木漏れ日', ruby: 'こもれび (komorebi)', translation: 'Sunlight filtering through trees', partOfSpeech: 'Noun', definition: 'Sunlight filtered through leaves.' },
        { word: '温もり', ruby: 'ぬくもり (nukumori)', translation: 'Warmth / cozy heat', partOfSpeech: 'Noun', definition: 'A comforting gentle warmth.' },
        { word: '琥珀色', ruby: 'こはくいろ (kohakuiro)', translation: 'Amber color', partOfSpeech: 'Noun', definition: 'Warm orange-golden gemstone tone.' },
      ],
      zh: [
        { word: '温暖', ruby: 'wēnnuǎn', translation: 'Warm / Cozy', partOfSpeech: 'Adjective', definition: 'Comfortably warm temperature or feeling.' },
        { word: '琉璃', ruby: 'liúlí', translation: 'Glazed glass / crystal', partOfSpeech: 'Noun', definition: 'Colored glaze or glass craft.' },
      ],
      ar: [
        { word: 'نَسِيم', phonetic: 'naseem', translation: 'Gentle breeze', partOfSpeech: 'Noun', definition: 'A refreshing soft desert wind.' },
      ],
      es: [
        { word: 'caléndula', phonetic: 'ka.ˈlen.du.la', translation: 'Marigold flower', partOfSpeech: 'Noun', definition: 'Bright orange flower celebrated for healing.' },
      ],
      fr: [
        { word: 'ambré', phonetic: 'ɑ̃.bʁe', translation: 'Amber / Golden', partOfSpeech: 'Adjective', definition: 'Having a warm golden orange tone.' },
      ],
      de: [
        { word: 'Sonnenlicht', phonetic: 'zɔnənˌlɪçt', translation: 'Sunlight', partOfSpeech: 'Noun', definition: 'Bright rays from the sun.' },
      ],
      it: [
        { word: 'sfumatura', phonetic: 'sfu.maˈtu.ra', translation: 'Nuance / Hue', partOfSpeech: 'Noun', definition: 'A delicate shade or tint.' },
      ],
      ko: [
        { word: '주황색', phonetic: 'juhwangsaek', translation: 'Orange color', partOfSpeech: 'Noun', definition: 'The vibrant color of marigolds.' },
      ],
      ru: [
        { word: 'янтарь', phonetic: 'jɪnˈtarʲ', translation: 'Amber', partOfSpeech: 'Noun', definition: 'Fossilized tree resin with glowing orange color.' },
      ],
      pt: [
        { word: 'aurora', phonetic: 'awˈɾɔ.ɾɐ', translation: 'Dawn / Sunrise', partOfSpeech: 'Noun', definition: 'First morning glow of golden light.' },
      ],
      en: [
        { word: 'calendula', phonetic: 'kəˈlɛn.djʊ.lə', translation: 'Calêndula / Flor de Marigold', partOfSpeech: 'Noun', definition: 'A radiant orange blossom.' },
      ],
    };

    const list = extras[lang] || extras['en'];
    return list.slice(0, count).map((item, idx) => ({
      id: `extra-vocab-${Date.now()}-${idx}`,
      word: item.word || 'vocab',
      ruby: item.ruby,
      phonetic: item.phonetic,
      translation: item.translation || 'Translation',
      partOfSpeech: item.partOfSpeech || 'Noun',
      definition: item.definition || 'A target vocabulary item.',
      exampleSentence: `Exemplo com ${item.word}.`,
      exampleTranslation: `Example sentence with ${item.word}.`,
      language: lang,
      proficiency: 'A2',
      isStarred: false,
      srsMetrics: createDefaultSRSMetrics(),
      createdAt: new Date().toISOString(),
    }));
  }
}
