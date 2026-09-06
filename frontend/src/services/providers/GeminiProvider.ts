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

export class GeminiProvider implements StoryGeneratorProvider {
  public readonly id = 'gemini';
  public readonly name = 'Google Gemini Direct';

  public isAvailable(settings: AppSettings): boolean {
    return Boolean(settings.geminiApiKey?.trim());
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
      : `Story Theme: AUTOMATIC & HIGHLY DIDACTIC. Choose the most practical, pedagogically effective, and engaging everyday scenario for a ${params.proficiency} language learner (e.g. daily routines, introducing oneself, asking for directions, café/restaurant, hobbies, or community encounters).`;

    const sanitizedPrompt = (params.customPrompt || '')
      .slice(0, 300)
      .replace(/[\r\n]/g, ' ');

    const targetNativeLang = params.nativeLanguage || (settings.uiLanguage === 'en' ? 'English' : 'Portuguese');

    const prompt = `
You are an expert language pedagogue creating an interactive graded reader story in JSON.

Target Language: ${params.language}
CEFR Level: ${params.proficiency}
Theme / Pedagogical Focus: ${themeInstruction}
Native Language (Interface Translation Language): ${targetNativeLang}
${sanitizedPrompt ? `Custom Topic/Instruction: ${sanitizedPrompt}` : ''}
Story Length Requirement: ${lengthGuide}
Spaced Repetition Requirement: ${repetitionGuide}
${params.injectNewWordsCount ? `Introduce ${params.injectNewWordsCount} new vocabulary words.` : ''}
${params.targetWords?.length ? `MANDATORY TARGET WORDS TO INJECT AND REPEAT MULTIPLE TIMES: ${params.targetWords.join(', ')}` : ''}
${params.existingDictionary?.length ? `Re-use and reinforce these known words: ${params.existingDictionary.map((w) => w.word).join(', ')}` : ''}

CRITICAL RULES:
1. The story MUST be substantial and meet the requested length. DO NOT output a short 1-paragraph story.
2. Every target word MUST appear multiple times (isTargetWord: true) so the reader encounters it in varied syntactic contexts.
3. For Japanese (ja), provide accurate Furigana (Hiragana) in "ruby" for all Kanji tokens.
4. For Mandarin (zh), provide Pinyin with tone marks in "ruby" for Chinese character tokens.
5. Provide high-quality tokenization so every word is clickable.
6. MANDATORY TRANSLATION LANGUAGE: ALL translations ("titleTranslation", sentence "translation", token "translation", token "explanation", vocabulary "translation", "definition", "exampleTranslation", quiz questions and answers) MUST be strictly in ${targetNativeLang}. DO NOT output translations in any other language.

Output ONLY valid JSON following this schema:
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
          "translation": "Accurate sentence translation in ${targetNativeLang}.",
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
      "translation": "definition in ${targetNativeLang}",
      "partOfSpeech": "Noun",
      "definition": "Clear explanation in ${targetNativeLang}",
      "exampleSentence": "Example in target language",
      "exampleTranslation": "Example translation in ${targetNativeLang}"
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

    const modelName = settings.geminiModel || 'gemini-3.6-flash';
    logService.addLog('INFO', 'GEMINI', `[Cliente Direto] Disparando inferência no modelo ${modelName}...`);

    const candidateModels = [modelName];
    for (const alt of ['gemini-2.5-flash', 'gemini-1.5-flash']) {
      if (!candidateModels.includes(alt)) candidateModels.push(alt);
    }

    let response: Response | null = null;
    let usedModel = modelName;

    for (const curModel of candidateModels) {
      usedModel = curModel;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${curModel}:generateContent?key=${settings.geminiApiKey}`;

      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (resp.ok) {
          response = resp;
          break;
        } else if (resp.status === 404) {
          logService.addLog('WARN', 'GEMINI', `[Cliente Direto] Modelo ${curModel} retornou 404. Tentando modelo alternativo...`);
          continue;
        } else {
          const errText = await resp.text();
          logService.addLog('WARN', 'GEMINI', `[Cliente Direto] Gemini retornou status ${resp.status}: ${errText.slice(0, 160)}`);
          response = resp;
          break;
        }
      } catch (networkErr: any) {
        logService.addLog('ERROR', 'GEMINI', `[Cliente Direto] Erro de rede ao chamar ${curModel}: ${networkErr?.message}`);
      }
    }

    if (!response || !response.ok) {
      const errStatus = response ? response.status : 'Offline';
      logService.addLog('ERROR', 'GEMINI', `[Cliente Direto] Falha final na requisição à API Gemini (${errStatus}).`);
      throw new Error(`Gemini API returned status ${errStatus}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      logService.addLog('ERROR', 'GEMINI', '[Cliente Direto] Resposta da API Gemini sem conteúdo de texto.');
      throw new Error('Empty Gemini response text');
    }

    logService.addLog('SUCCESS', 'GEMINI', `[Cliente Direto] Resposta estruturada recebida da API Gemini [${usedModel}] (${rawText.length} chars).`);

    const parsed = JSON.parse(rawText);

    // Defensive parsing for paragraphs
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
      .filter(Boolean)
      .join('\n\n');

    // Defensive parsing for target vocabulary
    const targetVocabulary: DictionaryEntry[] = Array.isArray(parsed?.targetVocabulary)
      ? parsed.targetVocabulary.map((v: any, vIdx: number) => ({
          id: v?.id || `v-${vIdx + 1}`,
          word: v?.word || '',
          ruby: v?.ruby,
          phonetic: v?.phonetic,
          translation: v?.translation || 'Vocabulary definition',
          partOfSpeech: v?.partOfSpeech || 'Word',
          definition: v?.definition || v?.translation || '',
          exampleSentence: v?.exampleSentence || '',
          exampleTranslation: v?.exampleTranslation || '',
          language: params.language,
          proficiency: params.proficiency,
          isStarred: false,
          srsMetrics: createDefaultSRSMetrics(),
          createdAt: new Date().toISOString(),
        }))
      : [];

    // Defensive parsing for quiz questions
    const quiz: QuizQuestion[] = Array.isArray(parsed?.quiz)
      ? parsed.quiz.map((q: any, qIdx: number) => ({
          id: q?.id || `q-${qIdx + 1}`,
          type: q?.type || 'mcq',
          prompt: q?.prompt || 'Meaning of target word?',
          targetWord: q?.targetWord || '',
          contextSentence: q?.contextSentence,
          options: Array.isArray(q?.options) ? q.options : [],
          correctAnswer: q?.correctAnswer || (q?.options?.[0] ?? ''),
          explanation: q?.explanation || '',
        }))
      : [];

    return {
      id: `story-${Date.now()}`,
      title: parsed?.title || 'Generated Story',
      titleTranslation: parsed?.titleTranslation || 'Story Translation',
      language: params.language,
      proficiency: params.proficiency,
      contextTheme: params.contextTheme || 'Atmospheric Adventure',
      storyLength: params.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || 'high',
      paragraphs,
      targetVocabulary,
      quiz,
      estimatedReadingMinutes: Math.max(2, Math.round(fullText.length / 250)),
      createdAt: new Date().toISOString(),
      isRTL: params.language === 'ar',
      fullText,
    };
  }

  /**
   * Análise aprofundada (Raio-X IA) de palavra diretamente via Gemini no frontend
   */
  public async fetchWordDeepDive(
    word: string,
    language: string,
    context: string,
    proficiency: string,
    nativeLang: string,
    settings: AppSettings
  ): Promise<WordDeepDiveData> {
    const isCJK = language === 'zh' || language === 'ja';
    const isJapanese = language === 'ja';

    const prompt = isCJK
      ? `You are an expert language pedagogue analyzing the ${isJapanese ? 'Japanese' : 'Mandarin'} word "${word}".
Sentence Context: "${context || 'N/A'}"
Learner Proficiency: ${proficiency}
Target Explanation Language: ${nativeLang}

CRITICAL RULES:
1. EXTREME BREVITY: Max 1-2 lines per section, under 500 characters total.
2. Return STRICTLY valid JSON matching:
{
  "word": "${word}",
  "ruby": "${isJapanese ? 'furigana' : 'pinyin'}",
  "level": "${proficiency}",
  "part_of_speech": "Substantivo/Verbo/etc",
  "context_meaning": "Significado exato no contexto (máx 120 chars)",
  "character_anatomy": [
    {
      "char": "字",
      "radical": "radical",
      "components": "decomposição",
      "meaning": "significado"
    }
  ],
  "shared_characters": [
    {
      "word": "palavra composta",
      "ruby": "pronúncia",
      "meaning": "tradução"
    }
  ],
  "phonetics_homophones": {
    "tip": "dica de pronúncia ou tom",
    "homophones": ["palavra com som parecido"]
  },
  "synonyms_and_nuances": [
    {
      "synonym": "sinônimo",
      "difference": "diferença prática"
    }
  ]
}`
      : `You are an expert language pedagogue analyzing the word "${word}" (${language}).
Sentence Context: "${context || 'N/A'}"
Learner Proficiency: ${proficiency}
Target Explanation Language: ${nativeLang}

CRITICAL RULES:
1. EXTREME BREVITY: Max 1-2 lines per section, under 500 characters total.
2. Return STRICTLY valid JSON matching:
{
  "word": "${word}",
  "ruby": "",
  "level": "${proficiency}",
  "part_of_speech": "Substantivo/Verbo/etc",
  "context_meaning": "Significado exato no contexto (máx 120 chars)",
  "etymology_roots": "Origem ou raiz da palavra",
  "common_collocations": [
    {
      "phrase": "colocação comum",
      "meaning": "tradução"
    }
  ],
  "false_friends_or_homophones": "Alerta de falso amigo ou som parecido",
  "synonyms_and_nuances": [
    {
      "synonym": "sinônimo",
      "difference": "diferença prática"
    }
  ]
}`;

    const candidateModels = [settings.geminiModel || 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    const apiKey = settings.geminiApiKey?.trim();
    if (!apiKey) {
      throw new Error('Chave Gemini API não configurada.');
    }

    let rawText = '';
    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        });
        if (response.ok) {
          const data = await response.json();
          rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (rawText) break;
        }
      } catch (err) {
        console.warn(`Model ${model} failed, trying next...`, err);
      }
    }

    if (!rawText) {
      throw new Error('Não foi possível obter resposta dos modelos Gemini.');
    }

    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as WordDeepDiveData;
  }
}
