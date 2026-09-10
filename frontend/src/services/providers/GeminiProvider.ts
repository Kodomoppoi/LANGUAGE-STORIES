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
import { getAuxiliaryTranslation, getAuxiliaryPOS, isInvalidTranslation } from '../auxiliaryLexicon';
import { sanitizeOrUnpackTokens } from '../textSegmentation';

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
You are an expert language pedagogue creating a graded reader story in JSON.

Target Language: ${params.language}
CEFR Level: ${params.proficiency}
Theme / Pedagogical Focus: ${themeInstruction}
Native Translation Language: ${targetNativeLang}
${sanitizedPrompt ? `Custom Topic/Instruction: ${sanitizedPrompt}` : ''}
Story Length Requirement: ${lengthGuide}
Spaced Repetition: ${repetitionGuide}
${params.injectNewWordsCount ? `Introduce ${params.injectNewWordsCount} new vocabulary words.` : ''}
${params.targetWords?.length ? `MANDATORY TARGET WORDS TO INJECT AND REPEAT MULTIPLE TIMES: ${params.targetWords.join(', ')}` : ''}
${params.existingDictionary?.length ? `Re-use and reinforce these known words: ${params.existingDictionary.map((w) => w.word).join(', ')}` : ''}

CRITICAL RULES:
1. Provide sentence-by-sentence text and natural sentence translation in ${targetNativeLang}.
2. For each sentence, provide a compact array of words/tokens with its contextual pronunciation and exact contextual translation.
   FORMAT: [word, phonetic_ruby_or_null, contextual_translation_in_${targetNativeLang}]
   - For Mandarin (zh): include Pinyin with tones in index 1 (e.g. ["咖啡馆", "kā fēi guǎn", "cafeteria"]).
   - For Japanese (ja): include Hiragana furigana in index 1 for Kanji words (e.g. ["静か", "しずか", "tranquilo"]).
   - For other languages (es, fr, de, it, en, ru, etc.): set index 1 to null, and index 2 to the exact contextual translation of that specific inflected/conjugated word (e.g. ["estudiábamos", null, "estudávamos"]).
3. "targetVocabulary": Array of 4 to 8 key pedagogical words taught in this lesson with word, ruby, part of speech, translation in ${targetNativeLang}, and an example sentence.
4. ALL translations MUST strictly be in ${targetNativeLang}.

Output strictly valid JSON matching this compact schema:
{
  "title": "Story Title in Target Language",
  "titleTranslation": "Title Translation in ${targetNativeLang}",
  "paragraphs": [
    {
      "sentences": [
        {
          "text": "Full sentence in target language.",
          "translation": "Natural translation in ${targetNativeLang}.",
          "words": [
            ["word1", "ruby1_or_null", "translation1"],
            ["word2", "ruby2_or_null", "translation2"]
          ]
        }
      ]
    }
  ],
  "targetVocabulary": [
    {
      "word": "key_word",
      "ruby": "phonetic_reading_or_null",
      "translation": "definition in ${targetNativeLang}",
      "partOfSpeech": "Noun/Verb/Adj",
      "exampleSentence": "Short example in target language",
      "exampleTranslation": "Example translation in ${targetNativeLang}"
    }
  ]
}
`;

    const modelName = settings.geminiModel || 'gemini-3.6-flash';
    logService.addLog('INFO', 'GEMINI', `[Cliente Direto] Disparando inferência no modelo ${modelName}...`);

    const candidateModels = [modelName];
    for (const alt of ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash']) {
      if (!candidateModels.includes(alt)) candidateModels.push(alt);
    }

    let response: Response | null = null;
    let usedModel = modelName;

    for (const curModel of candidateModels) {
      const cleanModel = curModel.replace('models/', '').trim();
      usedModel = cleanModel;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${settings.geminiApiKey}`;

      // Configuração de reasoning oficial do Google Gemini API:
      // - Gemini 3.x: thinking_budget descontinuado, utiliza thinkingLevel: "MINIMAL" (enum MINIMAL)
      // - Gemini 2.5: thinkingBudget: 0 desativa o raciocínio
      const genConfig: any = { responseMimeType: 'application/json' };
      const modelLower = cleanModel.toLowerCase();
      if (modelLower.startsWith('gemini-3') || modelLower.includes('3.')) {
        genConfig.thinkingConfig = { thinkingLevel: 'MINIMAL' };
      } else if (modelLower.includes('2.5')) {
        genConfig.thinkingConfig = { thinkingBudget: 0 };
      }

      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': settings.geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: genConfig,
          }),
        });

        if (resp.ok) {
          response = resp;
          break;
        } else if (resp.status === 404) {
          const errBody = await resp.text().catch(() => '');
          let errDetail = errBody.slice(0, 160);
          try {
            const errJson = JSON.parse(errBody);
            errDetail = errJson?.error?.message || errDetail;
          } catch { }
          logService.addLog('WARN', 'GEMINI', `[Cliente Direto] Modelo ${cleanModel} retornou 404 (${errDetail}). Tentando modelo alternativo...`);
          continue;
        } else if (resp.status === 400) {
          const errText = await resp.text();
          logService.addLog('WARN', 'GEMINI', `[Cliente Direto] Gemini retornou 400 [${curModel}]: ${errText.slice(0, 160)}`);
          const err = new Error('A chave da API Gemini fornecida não é válida ou foi recusada pelo Google (Erro 400). Por favor, verifique ou gere uma nova chave no Google AI Studio.');
          (err as any).errorType = 'api_key_error';
          (err as any).statusCode = 400;
          throw err;
        } else if (resp.status === 403) {
          const errText = await resp.text();
          logService.addLog('WARN', 'GEMINI', `[Cliente Direto] Gemini retornou 403 [${curModel}]: ${errText.slice(0, 160)}`);
          const err = new Error('Acesso negado para esta chave da API Gemini (Erro 403). Verifique se as permissões da Generative Language API estão ativas.');
          (err as any).errorType = 'api_key_error';
          (err as any).statusCode = 403;
          throw err;
        } else if (resp.status === 429) {
          const errText = await resp.text();
          logService.addLog('WARN', 'GEMINI', `[Cliente Direto] Gemini retornou 429 [${curModel}]: ${errText.slice(0, 160)}`);
          const isPlanQuota = errText.includes('billing details') || errText.includes('plan and billing');
          const errMsg = isPlanQuota
            ? 'Cota diária ou plano gratuito do Gemini esgotado no Google AI Studio (Erro 429). Utilize o OpenRouter (Free Tier) ou adicione outra chave.'
            : 'Cota de requisições por minuto do Gemini excedida (Erro 429 RESOURCE_EXHAUSTED). Aguarde 30 a 60 segundos antes de tentar novamente.';
          const err = new Error(errMsg);
          (err as any).errorType = 'quota_exceeded';
          (err as any).statusCode = 429;
          throw err;
        } else {
          const errText = await resp.text();
          logService.addLog('WARN', 'GEMINI', `[Cliente Direto] Gemini retornou status ${resp.status}: ${errText.slice(0, 160)}`);
          response = resp;
          break;
        }
      } catch (networkErr: any) {
        if (networkErr?.errorType) throw networkErr;
        logService.addLog('ERROR', 'GEMINI', `[Cliente Direto] Erro de rede ao chamar ${curModel}: ${networkErr?.message}`);
      }
    }

    if (!response || !response.ok) {
      const errStatus = response ? response.status : 'Offline';
      logService.addLog('ERROR', 'GEMINI', `[Cliente Direto] Falha final na requisição à API Gemini (${errStatus}).`);
      const err = new Error(`Gemini API returned status ${errStatus}`);
      (err as any).errorType = 'generation_error';
      throw err;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      logService.addLog('ERROR', 'GEMINI', '[Cliente Direto] Resposta da API Gemini sem conteúdo de texto.');
      throw new Error('Empty Gemini response text');
    }

    logService.addLog('SUCCESS', 'GEMINI', `[Cliente Direto] Resposta estruturada recebida da API Gemini [${usedModel}] (${rawText.length} chars).`);

    const parsed = JSON.parse(rawText);
    const uiLang = (params.nativeLanguage === 'English' || settings.uiLanguage === 'en') ? 'en' : 'pt';

    // Defensive parsing for target vocabulary
    const rawVocab = Array.isArray(parsed?.targetVocabulary)
      ? parsed.targetVocabulary
      : (Array.isArray(parsed?.target_vocabulary) ? parsed.target_vocabulary : []);

    const targetVocabulary: DictionaryEntry[] = rawVocab.map((v: any, vIdx: number) => {
      const vWord = String(v?.word || '').trim();
      const rawTrans = v?.translation || v?.definition || v?.context_translation;
      const trans = (!isInvalidTranslation(rawTrans, vWord) ? rawTrans : null)
        || getAuxiliaryTranslation(vWord, params.language, uiLang)
        || (uiLang === 'en' ? 'Target vocabulary' : 'Vocabulário alvo');
      return {
        id: v?.id || `v-${vIdx + 1}`,
        word: vWord,
        ruby: v?.ruby || v?.pinyin || v?.phonetic,
        phonetic: v?.phonetic || v?.ruby || v?.pinyin,
        translation: trans,
        partOfSpeech: v?.partOfSpeech || v?.part_of_speech || getAuxiliaryPOS(vWord, params.language) || 'Word',
        definition: (!isInvalidTranslation(v?.definition, vWord) ? v.definition : null) || trans,
        exampleSentence: v?.exampleSentence || v?.example_sentence || '',
        exampleTranslation: v?.exampleTranslation || v?.example_translation || '',
        language: params.language,
        proficiency: params.proficiency,
        isStarred: false,
        srsMetrics: createDefaultSRSMetrics(),
        createdAt: new Date().toISOString(),
      };
    });

    // Defensive parsing for paragraphs & compact tokens
    const rawParas = Array.isArray(parsed?.paragraphs)
      ? parsed.paragraphs
      : (Array.isArray(parsed?.sentences) ? [{ sentences: parsed.sentences }] : []);

    const paragraphs: StoryParagraph[] = rawParas.map((p: any, pIdx: number) => ({
      id: p?.id || `p-${pIdx + 1}`,
      sentences: (Array.isArray(p?.sentences) ? p.sentences : []).map((s: any, sIdx: number) => {
        const rawTokens = Array.isArray(s?.words) ? s.words : (Array.isArray(s?.tokens) ? s.tokens : []);
        const sText = s?.text || '';
        const idPrefix = `t-${pIdx + 1}-${sIdx + 1}`;
        const tokens = sanitizeOrUnpackTokens(
          rawTokens,
          sText,
          params.language,
          targetVocabulary,
          uiLang,
          idPrefix
        );

        return {
          id: s?.id || `s-${pIdx + 1}-${sIdx + 1}`,
          text: sText,
          translation: s?.translation || '',
          tokens,
        };
      }),
    }));

    const fullText = paragraphs
      .flatMap((p) => p.sentences.map((s) => s.text))
      .filter(Boolean)
      .join('\n\n');

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

    return enrichStoryPhonetics({
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
    });
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

    const prompt = `You are an elite linguistic scholar and pedagogue.
Create a comprehensive, deep educational Markdown study dossier for the ${isJapanese ? 'Japanese' : isCJK ? 'Mandarin' : language} word "${word}".
Sentence Context: "${context || 'N/A'}"
Target Learner Level: ${proficiency}
Explanation Language: ${nativeLang}

The dossier MUST contain these structured sections in clean, dense, highly informative Markdown:
# 📖 ${word} [${isJapanese ? 'Furigana/Romaji' : isCJK ? 'Pinyin' : 'Pronunciation'}] • [Part of Speech] • [Level]

## 🎯 1. Significado Contextual & Nuance
Detailed explanation of what this word means in the context of the story, its register, and emotional nuance.

## 🧩 2. ${isCJK ? 'Anatomia dos Caracteres, Radicais & Origem' : 'Origem, Raízes & Etimologia'}
Detailed breakdown of the radicals, ideogram components or morphological roots, historical evolution and character anatomy.

## 🧠 3. Mnemônica Visual & Dica de Fixação
A memorable visual story, mental anchor, or association to permanently memorize this word.

## 🌳 4. Família de Palavras & Compostos
List 3 to 5 real high-frequency words or collocations with translation in ${nativeLang}.

## ⚠️ 5. Cuidados, Sons & Armadilhas
Pronunciation traps, tones/pitch pitfalls, false friends, homophones, or near-synonym contrasts.

## 📝 6. Frases Práticas de Exemplo
2 natural sentences featuring this word with translation in ${nativeLang}.

Output strictly valid JSON with the full Markdown text in "markdown_content":
{
  "word": "${word}",
  "ruby": "${isJapanese ? 'furigana' : isCJK ? 'pinyin' : ''}",
  "part_of_speech": "PartOfSpeech",
  "context_meaning": "contextual meaning in ${nativeLang}",
  "markdown_content": "# 📖 ${word} ... (full markdown dossier)"
}`;

    const candidateModels = [
      settings.geminiModel || 'gemini-3.6-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-2.5-flash',
      'gemini-2.5-pro',
    ];
    const apiKey = settings.geminiApiKey?.trim();
    if (!apiKey) {
      throw new Error('Chave Gemini API não configurada.');
    }

    let rawText = '';
    for (const model of candidateModels) {
      const cleanModel = model.replace('models/', '').trim();
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
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
    let parsed: any = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        word,
        markdown_content: rawText.trim(),
      };
    }

    if (!parsed.markdown_content && rawText.includes('#')) {
      parsed.markdown_content = rawText.trim();
    }

    return parsed as WordDeepDiveData;
  }
}
