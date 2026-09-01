import {
  Story,
  LanguageCode,
  ProficiencyLevel,
  DictionaryEntry,
  AppSettings,
  StoryLength,
  RepetitionDensity,
} from '../types';
import { SAMPLE_STORIES } from './sampleStories';
import { createDefaultSRSMetrics } from './srsEngine';

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

class ApiService {
  /**
   * Check backend connection health
   */
  public async checkBackendHealth(backendUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate a structured story with tokenization, furigana/pinyin, dictionary, and retention quiz
   */
  public async generateStory(
    params: GenerateStoryParams,
    settings: AppSettings
  ): Promise<Story> {
    const finalParams: GenerateStoryParams = {
      ...params,
      storyLength: params.storyLength || settings.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || settings.repetitionDensity || 'high',
    };

    // 1. Try FastAPI Backend if connected or hybrid
    if (settings.apiProvider === 'hybrid' || settings.isBackendConnected) {
      try {
        const response = await fetch(`${settings.backendUrl}/api/stories/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalParams),
        });
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      } catch (err) {
        console.warn('Backend API request failed, falling back...', err);
      }
    }

    // 2. Try direct Google Gemini API if user provided API Key
    if (settings.geminiApiKey && (settings.apiProvider === 'gemini' || settings.apiProvider === 'hybrid')) {
      try {
        const geminiStory = await this.generateWithGemini(finalParams, settings);
        if (geminiStory) return geminiStory;
      } catch (err) {
        console.warn('Gemini direct API failed, falling back to smart simulation...', err);
      }
    }

    // 3. Smart Local Simulation Fallback (Immediate responsiveness with rich multi-paragraph data)
    return this.generateSimulatedStory(finalParams);
  }

  /**
   * Direct Gemini API Generator
   */
  private async generateWithGemini(
    params: GenerateStoryParams,
    settings: AppSettings
  ): Promise<Story | null> {
    const lengthGuide = {
      standard: 'MINIMUM 4 SUBSTANTIAL PARAGRAPHS (~300 to 450 words total).',
      medium: 'MINIMUM 6 RICH PARAGRAPHS (~550 to 750 words total).',
      extended: 'MINIMUM 8 DETAILED PARAGRAPHS (~850 to 1100 words total).',
      epic: 'MINIMUM 10+ IMMERSIVE CHAPTER PARAGRAPHS (~1200 to 1600 words total).',
    }[params.storyLength || 'standard'];

    const repetitionGuide = {
      normal: 'Repeat each target vocabulary word naturally at least 2 times across different sentences/paragraphs.',
      high: 'Repeat each target vocabulary word naturally at least 3 to 4 times across different sentences and contexts to maximize spaced repetition retention.',
      intense: 'Repeat each target vocabulary word naturally at least 4 to 6 times across multiple paragraphs and dialogues for intensive immersion.',
    }[params.repetitionDensity || 'high'];

    const prompt = `
You are an expert language pedagogue creating an interactive graded reader story in JSON.

Target Language: ${params.language}
CEFR Level: ${params.proficiency}
Theme/Context: ${params.contextTheme || 'Atmospheric Adventure & Daily Life'}
Story Length Requirement: ${lengthGuide}
Spaced Repetition Requirement: ${repetitionGuide}
${params.injectNewWordsCount ? `Introduce ${params.injectNewWordsCount} new vocabulary words.` : ''}
${params.targetWords?.length ? `MANDATORY TARGET WORDS TO INJECT AND REPEAT MULTIPLE TIMES: ${params.targetWords.join(', ')}` : ''}
${params.existingDictionary?.length ? `Re-use and reinforce these known words: ${params.existingDictionary.map(w => w.word).join(', ')}` : ''}

CRITICAL RULES:
1. The story MUST be substantial and meet the requested length. DO NOT output a short 1-paragraph story.
2. Every target word MUST appear multiple times (isTargetWord: true) so the reader encounters it in varied syntactic contexts.
3. For Japanese (ja), provide accurate Furigana (Hiragana) in "ruby" for all Kanji tokens.
4. For Mandarin (zh), provide Pinyin with tone marks in "ruby" for Chinese character tokens.
5. Provide high-quality tokenization so every word is clickable.

Output ONLY valid JSON following this schema:
{
  "title": "Story Title in Target Language",
  "titleTranslation": "Title Translation in English or Portuguese",
  "paragraphs": [
    {
      "id": "p-1",
      "sentences": [
        {
          "id": "s-1",
          "text": "Full sentence in target language.",
          "translation": "English translation.",
          "tokens": [
            {
              "id": "t-1",
              "text": "word",
              "ruby": "phonetic / furigana / pinyin if applicable",
              "translation": "meaning",
              "partOfSpeech": "Noun/Verb/Adj/Particle",
              "explanation": "Contextual usage note",
              "isTargetWord": true
            }
          ]
        }
      ]
    }
  ],
  "targetVocabulary": [
    {
      "id": "v-1",
      "word": "word",
      "ruby": "phonetic reading",
      "translation": "definition in English/Portuguese",
      "partOfSpeech": "Noun",
      "definition": "Clear explanation",
      "exampleSentence": "Example in target language",
      "exampleTranslation": "Example translation"
    }
  ],
  "quiz": [
    {
      "id": "q-1",
      "type": "mcq",
      "prompt": "Meaning of the target word?",
      "targetWord": "word",
      "options": ["Opt1", "Opt2", "Opt3", "Opt4"],
      "correctAnswer": "Opt1",
      "explanation": "Why Opt1 is correct"
    }
  ]
}
`;

    const modelName = settings.geminiModel || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${settings.geminiApiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API returned status ${response.status}`);
    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Empty Gemini response');

    const parsed = JSON.parse(rawText);
    const fullText = parsed.paragraphs
      .flatMap((p: any) => p.sentences.map((s: any) => s.text))
      .join('\n\n');

    return {
      id: `story-${Date.now()}`,
      title: parsed.title,
      titleTranslation: parsed.titleTranslation,
      language: params.language,
      proficiency: params.proficiency,
      contextTheme: params.contextTheme || 'Atmospheric Adventure',
      storyLength: params.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || 'high',
      paragraphs: parsed.paragraphs,
      targetVocabulary: (parsed.targetVocabulary || []).map((v: any) => ({
        ...v,
        language: params.language,
        proficiency: params.proficiency,
        srsMetrics: createDefaultSRSMetrics(),
        createdAt: new Date().toISOString(),
      })),
      quiz: parsed.quiz || [],
      estimatedReadingMinutes: Math.max(2, Math.round(fullText.length / 250)),
      createdAt: new Date().toISOString(),
      isRTL: params.language === 'ar',
      fullText,
    };
  }

  /**
   * Smart Simulated Fallback Generator (Procedural scaling by length and repetitions)
   */
  private generateSimulatedStory(params: GenerateStoryParams): Story {
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
    if (targetLength === 'medium' || targetLength === 'extended' || targetLength === 'epic') {
      const extraParagraphsCount = targetLength === 'medium' ? 2 : targetLength === 'extended' ? 4 : 6;
      for (let i = 0; i < extraParagraphsCount; i++) {
        const sourcePara = cloned.paragraphs[i % cloned.paragraphs.length];
        const newPara = JSON.parse(JSON.stringify(sourcePara));
        newPara.id = `p-ext-${i + 1}`;
        newPara.sentences.forEach((s: any, sIdx: number) => {
          s.id = `s-ext-${i + 1}-${sIdx + 1}`;
          s.tokens.forEach((t: any, tIdx: number) => {
            t.id = `t-ext-${i + 1}-${sIdx + 1}-${tIdx + 1}`;
          });
        });
        cloned.paragraphs.push(newPara);
      }
    }

    // Reconstruct fullText
    cloned.fullText = cloned.paragraphs
      .map((p) => p.sentences.map((s) => s.text).join(' '))
      .join('\n\n');

    cloned.estimatedReadingMinutes = Math.max(2, Math.round(cloned.fullText.length / 220));

    // If "increase option" requested new target words, append synthetic bonus words
    if (params.injectNewWordsCount && params.injectNewWordsCount > 0) {
      const extraWords = this.getExtraVocabForLanguage(params.language, params.injectNewWordsCount);
      cloned.targetVocabulary = [...cloned.targetVocabulary, ...extraWords];
    }

    return cloned;
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

export const apiService = new ApiService();
