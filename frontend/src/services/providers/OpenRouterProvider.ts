import {
  Story,
  AppSettings,
  StoryParagraph,
  DictionaryEntry,
  QuizQuestion,
  WordDeepDiveData,
} from '../../types';
import { createDefaultSRSMetrics } from '../srsEngine';
import { GenerateStoryParams, StoryGeneratorProvider } from './types';
import { logService } from '../logService';
import { enrichStoryPhonetics } from '../auxiliaryPhonetics';

// Client-side rate limiter: OpenRouter Free Tier 20 RPM -> 80% = 16 RPM (interval: 3.75s)
class ClientOpenRouterLimiter {
  private timestamps: number[] = [];
  private readonly maxRpm = 20;
  private readonly effectiveRpm = 16;
  private readonly minInterval = 3750; // ms

  async acquire(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < 60000);

    if (this.timestamps.length >= this.effectiveRpm) {
      const oldest = this.timestamps[0];
      const waitTime = 60000 - (now - oldest) + 200;
      if (waitTime > 0) {
        logService.addLog(
          'INFO',
          'OPENROUTER',
          `[Cliente Direto] Pacing de proteção: atingiu 80% da capacidade (${this.timestamps.length}/${this.maxRpm} RPM). Pausando ${(waitTime / 1000).toFixed(1)}s...`
        );
        await new Promise((res) => setTimeout(res, waitTime));
      }
    }

    if (this.timestamps.length > 0) {
      const last = this.timestamps[this.timestamps.length - 1];
      const elapsed = Date.now() - last;
      if (elapsed < this.minInterval) {
        await new Promise((res) => setTimeout(res, this.minInterval - elapsed));
      }
    }

    this.timestamps.push(Date.now());
  }
}

const clientLimiter = new ClientOpenRouterLimiter();

export class OpenRouterProvider implements StoryGeneratorProvider {
  public readonly id = 'openrouter';
  public readonly name = 'OpenRouter Free Tier Direct';

  public isAvailable(settings: AppSettings): boolean {
    return Boolean(settings.openRouterApiKey?.trim());
  }

  public async generateStory(
    params: GenerateStoryParams,
    settings: AppSettings
  ): Promise<Story> {
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

    const hasCustomTheme = Boolean(
      params.contextTheme &&
      params.contextTheme.trim() &&
      !['general', 'auto', 'none', 'automatic', 'automático'].includes(params.contextTheme.trim().toLowerCase())
    );

    const themeInstruction = hasCustomTheme
      ? `Specific Theme: "${params.contextTheme!.trim().slice(0, 150).replace(/[\r\n]/g, ' ')}". The story plot, setting, and vocabulary MUST strictly revolve around this theme.`
      : `Story Theme: AUTOMATIC & HIGHLY DIDACTIC. Choose the most practical, pedagogically effective, and engaging everyday scenario for a ${params.proficiency} language learner.`;

    const targetNativeLang = params.nativeLanguage || (settings.uiLanguage === 'en' ? 'English' : 'Portuguese');

    const prompt = `You are an expert language pedagogue creating an interactive graded reader story in JSON.

Target Language: ${params.language}
CEFR Level: ${params.proficiency}
Theme / Pedagogical Focus: ${themeInstruction}
Native Language (Interface Translation Language): ${targetNativeLang}
Story Length Requirement: ${lengthGuide}
Spaced Repetition Requirement: ${repetitionGuide}
${params.injectNewWordsCount ? `Introduce ${params.injectNewWordsCount} new vocabulary words.` : ''}
${params.targetWords?.length ? `MANDATORY TARGET WORDS TO INJECT AND REPEAT MULTIPLE TIMES: ${params.targetWords.join(', ')}` : ''}
${params.existingDictionary?.length ? `Re-use and reinforce these known words: ${params.existingDictionary.map((w) => w.word).join(', ')}` : ''}

CRITICAL RULES:
1. The story MUST be substantial and meet the requested length. DO NOT output a short 1-paragraph story.
2. Every target word MUST appear multiple times (isTargetWord: true).
3. For Japanese (ja), provide Furigana in "ruby" for Kanji tokens.
4. For Mandarin (zh), provide Pinyin in "ruby" for Chinese characters.
5. Provide tokenization so words are clickable.
6. MANDATORY TRANSLATION LANGUAGE: ALL translations MUST be strictly in ${targetNativeLang}.

Output ONLY valid JSON following this exact schema:
{
  "title": "Story Title in Target Language",
  "titleTranslation": "Title Translation in ${targetNativeLang}",
  "paragraphs": [
    {
      "id": "p-1",
      "sentences": [
        {
          "id": "s-1",
          "text": "Full sentence in target language.",
          "translation": "Sentence translation in ${targetNativeLang}.",
          "tokens": [
            {
              "id": "t-1",
              "text": "word",
              "ruby": "phonetic if applicable",
              "translation": "meaning",
              "partOfSpeech": "Noun/Verb/etc",
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
      "word": "target word",
      "ruby": "phonetic",
      "translation": "translation in ${targetNativeLang}",
      "partOfSpeech": "Noun/Verb/etc",
      "definition": "Definition in ${targetNativeLang}",
      "exampleSentence": "Example sentence",
      "exampleTranslation": "Example translation"
    }
  ],
  "quiz": [
    {
      "id": "q-1",
      "type": "mcq",
      "prompt": "Question in ${targetNativeLang}?",
      "targetWord": "target word",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation in ${targetNativeLang}"
    }
  ]
}`;

    const apiKey = (settings.openRouterApiKey || '').trim();
    const model = (settings.openRouterModel || 'openrouter/free').trim();

    if (!apiKey) {
      const err = new Error('Chave de API do OpenRouter não configurada. Insira sua chave nas Configurações.');
      (err as any).errorType = 'api_key_error';
      (err as any).statusCode = 401;
      throw err;
    }

    // Pacing at 80% maximum capacity
    await clientLimiter.acquire();

    logService.addLog('INFO', 'OPENROUTER', `[Cliente Direto] Disparando inferência no OpenRouter [${model}] (pacing 80% ativo)...`);

    let response: Response | null = null;
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Language Stories',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert language pedagogue creating interactive graded reader content. You must output ONLY valid parseable JSON adhering strictly to the user schema without commentary.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });
    } catch (networkErr: any) {
      logService.addLog('ERROR', 'OPENROUTER', `[Cliente Direto] Falha de rede com OpenRouter: ${networkErr?.message}`);
      throw new Error(`Falha de conexão com OpenRouter: ${networkErr?.message}`);
    }

    if (!response.ok) {
      const errStatus = response.status;
      const errText = await response.text().catch(() => '');

      if (errStatus === 401 || errStatus === 403) {
        logService.addLog('ERROR', 'OPENROUTER', `[Cliente Direto] OpenRouter recusou chave (${errStatus}): ${errText.slice(0, 150)}`);
        const err = new Error(`Chave de API do OpenRouter inválida ou recusada (${errStatus}). Verifique sua chave no painel do OpenRouter.`);
        (err as any).errorType = 'api_key_error';
        (err as any).statusCode = errStatus;
        throw err;
      }

      if (errStatus === 429) {
        logService.addLog('WARN', 'OPENROUTER', `[Cliente Direto] OpenRouter 429 (Cota excedida): ${errText.slice(0, 150)}`);
        const err = new Error('Cota de requisições do OpenRouter excedida (Erro 429).');
        (err as any).errorType = 'quota_exceeded';
        (err as any).statusCode = 429;
        throw err;
      }

      if (errStatus === 503) {
        logService.addLog('WARN', 'OPENROUTER', `[Cliente Direto] OpenRouter 503 (Servidores em alta demanda): ${errText.slice(0, 150)}`);
        const err = new Error('Serviço do OpenRouter temporariamente indisponível (Erro 503).');
        (err as any).errorType = 'service_unavailable';
        (err as any).statusCode = 503;
        throw err;
      }

      logService.addLog('ERROR', 'OPENROUTER', `[Cliente Direto] OpenRouter retornou status ${errStatus}: ${errText.slice(0, 150)}`);
      const err = new Error(`OpenRouter retornou status ${errStatus}`);
      (err as any).errorType = 'generation_error';
      throw err;
    }

    const resJson = await response.json();
    const content = resJson?.choices?.[0]?.message?.content;
    if (!content) {
      logService.addLog('ERROR', 'OPENROUTER', '[Cliente Direto] Resposta do OpenRouter sem conteúdo.');
      throw new Error('OpenRouter response returned empty content');
    }

    logService.addLog('SUCCESS', 'OPENROUTER', `[Cliente Direto] Resposta recebida do OpenRouter [${model}] (${content.length} chars).`);

    // Clean JSON if needed
    const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    const paragraphs: StoryParagraph[] = Array.isArray(parsed?.paragraphs)
      ? parsed.paragraphs.map((p: any, pIdx: number) => ({
          id: p?.id || `p-${pIdx + 1}`,
          sentences: Array.isArray(p?.sentences)
            ? p.sentences.map((s: any, sIdx: number) => ({
                id: s?.id || `s-${pIdx + 1}-${sIdx + 1}`,
                text: s?.text || '',
                translation: s?.translation || '',
                tokens: Array.isArray(s?.tokens)
                  ? s.tokens.map((t: any, tIdx: number) => ({
                      id: t?.id || `t-${pIdx + 1}-${sIdx + 1}-${tIdx + 1}`,
                      text: t?.text || '',
                      ruby: t?.ruby,
                      phonetic: t?.phonetic,
                      translation: t?.translation,
                      partOfSpeech: t?.partOfSpeech,
                      explanation: t?.explanation,
                      isTargetWord: Boolean(t?.isTargetWord),
                    }))
                  : [],
              }))
            : [],
        }))
      : [];

    const fullText = paragraphs
      .flatMap((p) => p.sentences.map((s) => s.text))
      .join('\n\n');

    const targetVocabulary: DictionaryEntry[] = Array.isArray(parsed?.targetVocabulary)
      ? parsed.targetVocabulary.map((v: any, vIdx: number) => ({
          id: v?.id || `vocab-${vIdx + 1}`,
          word: v?.word || '',
          ruby: v?.ruby,
          phonetic: v?.phonetic,
          translation: v?.translation || '',
          partOfSpeech: v?.partOfSpeech || 'Noun',
          definition: v?.definition || v?.translation || '',
          exampleSentence: v?.exampleSentence || '',
          exampleTranslation: v?.exampleTranslation || '',
          language: params.language,
          proficiency: params.proficiency,
          srsMetrics: createDefaultSRSMetrics(),
          createdAt: new Date().toISOString(),
        }))
      : [];

    const quiz: QuizQuestion[] = Array.isArray(parsed?.quiz)
      ? parsed.quiz.map((q: any, qIdx: number) => ({
          id: q?.id || `quiz-${qIdx + 1}`,
          type: q?.type || 'mcq',
          prompt: q?.prompt || '',
          targetWord: q?.targetWord || '',
          ruby: q?.ruby,
          options: Array.isArray(q?.options) ? q.options : [],
          correctAnswer: q?.correctAnswer || '',
          explanation: q?.explanation || '',
        }))
      : [];

    const story: Story = {
      id: `story-${Date.now()}`,
      title: parsed?.title || 'Story',
      titleTranslation: parsed?.titleTranslation || '',
      language: params.language,
      proficiency: params.proficiency,
      contextTheme: params.contextTheme || '',
      storyLength: params.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || 'high',
      paragraphs,
      targetVocabulary,
      quiz,
      estimatedReadingMinutes: Math.max(1, Math.ceil(fullText.split(/\s+/).length / 100)),
      createdAt: new Date().toISOString(),
      isRTL: ['ar', 'he', 'fa', 'ur'].includes(params.language),
      fullText,
    };

    return enrichStoryPhonetics(story);
  }

  public async getWordDeepDive(
    word: string,
    contextSentence: string,
    settings: AppSettings,
    language: string = 'zh',
    proficiency: string = 'A2'
  ): Promise<WordDeepDiveData> {
    const apiKey = (settings.openRouterApiKey || '').trim();
    const model = (settings.openRouterModel || 'openrouter/free').trim();

    if (!apiKey) {
      throw new Error('Chave de API do OpenRouter não configurada.');
    }

    await clientLimiter.acquire();

    const targetNativeLang = settings.uiLanguage === 'en' ? 'English' : 'Portuguese';

    const prompt = `Perform a comprehensive morphological, phonetic, and semantic deep-dive for the word "${word}" in ${language}.
Context Sentence: "${contextSentence}"
Learner Proficiency: ${proficiency}
Target Explanation Language: ${targetNativeLang}

Output ONLY valid JSON matching this schema:
{
  "word": "${word}",
  "lemma": "${word}",
  "ruby": "phonetic reading",
  "partOfSpeech": "PartOfSpeech",
  "contextTranslation": "exact translation in context in ${targetNativeLang}",
  "generalDefinition": "broad definition in ${targetNativeLang}",
  "etymology": "Origin or character structure explanation",
  "characterBreakdown": [
    {
      "char": "single character",
      "pinyin": "reading",
      "meaning": "meaning in ${targetNativeLang}",
      "radical": "radical char",
      "radicalMeaning": "radical meaning"
    }
  ],
  "synonyms": [
    { "word": "synonym", "translation": "meaning in ${targetNativeLang}" }
  ],
  "antonyms": [
    { "word": "antonym", "translation": "meaning in ${targetNativeLang}" }
  ],
  "collocations": [
    { "phrase": "collocation", "translation": "meaning in ${targetNativeLang}" }
  ],
  "exampleSentences": [
    { "sentence": "sentence in target language", "translation": "translation in ${targetNativeLang}" }
  ]
}`;

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'Language Stories',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      throw new Error(`OpenRouter deep-dive failed with status ${resp.status}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned);
  }
}
