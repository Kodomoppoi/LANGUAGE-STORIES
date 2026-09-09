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

    const prompt = `You are an expert language pedagogue creating a graded reader story in JSON.

Target Language: ${params.language}
CEFR Level: ${params.proficiency}
Theme / Pedagogical Focus: ${themeInstruction}
Native Translation Language: ${targetNativeLang}
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

    const uiLang = params.nativeLanguage === 'English' ? 'en' : 'pt';

    const targetVocabulary: DictionaryEntry[] = Array.isArray(parsed?.targetVocabulary)
      ? parsed.targetVocabulary.map((v: any, vIdx: number) => {
          const vWord = String(v?.word || '').trim();
          const rawTrans = v?.translation;
          const trans = (!isInvalidTranslation(rawTrans, vWord) ? rawTrans : null)
            || getAuxiliaryTranslation(vWord, params.language, uiLang)
            || (uiLang === 'en' ? 'Target vocabulary' : 'Vocabulário alvo');
          return {
            id: v?.id || `vocab-${vIdx + 1}`,
            word: vWord,
            ruby: v?.ruby,
            phonetic: v?.phonetic,
            translation: trans,
            partOfSpeech: v?.partOfSpeech || getAuxiliaryPOS(vWord, params.language) || 'Noun',
            definition: (!isInvalidTranslation(v?.definition, vWord) ? v.definition : null) || trans,
            exampleSentence: v?.exampleSentence || '',
            exampleTranslation: v?.exampleTranslation || '',
            language: params.language,
            proficiency: params.proficiency,
            srsMetrics: createDefaultSRSMetrics(),
            createdAt: new Date().toISOString(),
          };
        })
      : [];

    const rawParas = Array.isArray(parsed?.paragraphs)
      ? parsed.paragraphs
      : (Array.isArray(parsed?.sentences) ? [{ sentences: parsed.sentences }] : []);

    const paragraphs: StoryParagraph[] = rawParas.map((p: any, pIdx: number) => ({
      id: p?.id || `p-${pIdx + 1}`,
      sentences: (Array.isArray(p?.sentences) ? p.sentences : []).map((s: any, sIdx: number) => {
        const rawTokens = Array.isArray(s?.words) ? s.words : (Array.isArray(s?.tokens) ? s.tokens : []);
        const tokens = rawTokens.map((t: any, tIdx: number) => {
          let tText = '';
          let tRuby: string | undefined = undefined;
          let rawTrans: string | undefined = undefined;

          if (Array.isArray(t)) {
            // Compact tuple: [word, ruby, translation]
            tText = String(t[0] || '').trim();
            tRuby = t[1] ? String(t[1]).trim() : undefined;
            rawTrans = t[2] ? String(t[2]).trim() : undefined;
          } else if (typeof t === 'object' && t !== null) {
            tText = String(t?.text || t?.word || '').trim();
            tRuby = t?.ruby || t?.phonetic || t?.pinyin;
            rawTrans = t?.translation || t?.meaning;
          } else {
            tText = String(t || '').trim();
          }

          const matchedWord = targetVocabulary.find((v) => v.word === tText);
          const isInvalid = isInvalidTranslation(rawTrans, tText);
          const safeMatchedTrans = matchedWord && !isInvalidTranslation(matchedWord.translation, tText) ? matchedWord.translation : null;

          const tokenTrans = (!isInvalid ? rawTrans : null)
            || safeMatchedTrans
            || getAuxiliaryTranslation(tText, params.language, uiLang)
            || (uiLang === 'en' ? 'Term in context' : 'Vocábulo no contexto');

          return {
            id: t?.id || `t-${pIdx + 1}-${sIdx + 1}-${tIdx + 1}`,
            text: tText,
            ruby: tRuby || (matchedWord ? matchedWord.ruby : undefined),
            phonetic: tRuby,
            translation: tokenTrans,
            partOfSpeech: matchedWord?.partOfSpeech || getAuxiliaryPOS(tText, params.language),
            isTargetWord: Boolean(matchedWord),
          };
        });

        return {
          id: s?.id || `s-${pIdx + 1}-${sIdx + 1}`,
          text: s?.text || '',
          translation: s?.translation || '',
          tokens,
        };
      }),
    }));

    const fullText = paragraphs
      .flatMap((p) => p.sentences.map((s) => s.text))
      .join('\n\n');

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

    const prompt = `You are an elite linguistic scholar and pedagogue.
Create a comprehensive, deep educational Markdown study dossier for the word "${word}" in ${language}.
Sentence Context: "${contextSentence || 'N/A'}"
Target Learner Level: ${proficiency}
Explanation Language: ${targetNativeLang}

The dossier MUST contain these structured sections in clean, dense Markdown:
# 📖 ${word} [Phonetic/Ruby] • [Part of Speech] • [Level]

## 🎯 1. Significado Contextual & Nuance
Detailed explanation of what this word means in the context of the story, its register, and emotional nuance.

## 🧩 2. Origem, Radicais & Etimologia
Anatomy, radicals, ideogram decomposition, or linguistic roots and historical evolution.

## 🧠 3. Mnemônica Visual & Dica de Fixação
A memorable visual story, mental anchor, or association to permanently memorize this word.

## 🌳 4. Família de Palavras & Compostos
List 3 to 5 real high-frequency words or collocations with translation in ${targetNativeLang}.

## ⚠️ 5. Cuidados, Sons & Armadilhas
Pronunciation traps, pitch/tone pitfalls, false friends, homophones, or near-synonym contrasts.

## 📝 6. Frases Práticas de Exemplo
2 natural sentences featuring this word with translation in ${targetNativeLang}.

Output strictly valid JSON with the full Markdown text in "markdown_content":
{
  "word": "${word}",
  "ruby": "phonetic reading",
  "partOfSpeech": "PartOfSpeech",
  "contextTranslation": "contextual meaning in ${targetNativeLang}",
  "markdown_content": "# 📖 ${word} ... (full markdown dossier)"
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
    let parsed: any = {};
    try {
      const cleaned = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        word,
        markdown_content: content.trim(),
      };
    }

    if (!parsed.markdown_content && content.includes('#')) {
      parsed.markdown_content = content.trim();
    }

    return parsed;
  }
}
