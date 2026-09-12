import { Story, AppSettings, SSEGenerationEvent, DictionaryEntry, StoryParagraph } from '../../types';
import { GenerateStoryParams, StoryGeneratorProvider } from './types';
import { createDefaultSRSMetrics, getStatusColor, getRepetitionWeight } from '../srsEngine';
import { enrichStoryPhonetics } from '../auxiliaryPhonetics';
import { getAuxiliaryTranslation, getAuxiliaryPOS, isInvalidTranslation } from '../auxiliaryLexicon';
import { sanitizeOrUnpackTokens, segmentSentenceIntoTokens } from '../textSegmentation';

export class BackendProvider implements StoryGeneratorProvider {
  public readonly id = 'backend';
  public readonly name = 'FastAPI Backend';

  public isAvailable(settings: AppSettings): boolean {
    return Boolean(settings.isBackendConnected && settings.backendUrl);
  }

  public async generateStory(
    params: GenerateStoryParams,
    settings: AppSettings
  ): Promise<Story> {
    const nativeLang = params.nativeLanguage || (settings.uiLanguage === 'en' ? 'English' : 'Portuguese');
    const payload = {
      ...params,
      native_lang: nativeLang,
      nativeLanguage: nativeLang,
      gemini_api_key: settings.geminiApiKey?.trim() || undefined,
      gemini_model: settings.geminiModel || undefined,
      openrouter_api_key: settings.openRouterApiKey?.trim() || undefined,
      openrouter_model: settings.openRouterModel || undefined,
      api_provider: settings.apiProvider || undefined,
    };

    const response = await fetch(`${settings.backendUrl}/api/stories/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.detail || `Backend request failed with status: ${response.status}`;
      const err = new Error(msg);
      (err as any).statusCode = response.status;
      throw err;
    }

    const data = await response.json();
    return this.normalizeStoryResponse(data, params);
  }

  /**
   * 5. Streaming em Tempo Real (SSE) para o Mascote (/api/stories/generate/stream)
   */
  public async generateStoryStream(
    params: GenerateStoryParams,
    settings: AppSettings,
    onEvent: (event: SSEGenerationEvent) => void
  ): Promise<Story> {
    const streamUrl = `${settings.backendUrl}/api/stories/generate/stream`;
    const nativeLang = params.nativeLanguage || (settings.uiLanguage === 'en' ? 'English' : 'Portuguese');
    const payload = {
      ...params,
      native_lang: nativeLang,
      nativeLanguage: nativeLang,
      gemini_api_key: settings.geminiApiKey?.trim() || undefined,
      gemini_model: settings.geminiModel || undefined,
      openrouter_api_key: settings.openRouterApiKey?.trim() || undefined,
      openrouter_model: settings.openRouterModel || undefined,
      api_provider: settings.apiProvider || undefined,
    };

    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const msg = errJson.detail || `SSE Backend request failed with status: ${response.status}`;
      const err = new Error(msg);
      (err as any).statusCode = response.status;
      throw err;
    }

    if (!response.body) {
      throw new Error('Response body is null, cannot stream SSE.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let completedStory: Story | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEventName = '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            currentEventName = trimmed.replace(/^event:\s*/, '').trim();
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace(/^data:\s*/, '').trim();
            try {
              const parsedData = JSON.parse(dataStr);
              const eventName = (currentEventName || parsedData.event || 'stage_done') as SSEGenerationEvent['event'];
              const payload = parsedData.data !== undefined ? parsedData.data : parsedData;

              const sseEvent: SSEGenerationEvent = {
                event: eventName,
                data: payload,
              };

              onEvent(sseEvent);

              if (eventName === 'error') {
                const errMsg = payload.error_message || payload.message || 'Erro inesperado no backend ao gerar história';
                const err = new Error(errMsg);
                (err as any).errorType = payload.error_type || 'generation_error';
                (err as any).statusCode = payload.status_code || 500;
                throw err;
              }

              if (eventName === 'stage_done') {
                if (payload.story) {
                  completedStory = this.normalizeStoryResponse(payload.story, params);
                } else {
                  completedStory = this.normalizeStoryResponse(payload, params);
                }
              }
            } catch (err) {
              if (err instanceof Error && (err as any).errorType) {
                throw err;
              }
              console.warn('Failed to parse SSE line data:', dataStr, err);
            }
            currentEventName = '';
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (completedStory) {
      return completedStory;
    }

    throw new Error(
      settings.uiLanguage === 'pt'
        ? 'A conexão com o servidor foi encerrada sem finalizar a história.'
        : 'Connection closed without receiving completed story.'
    );
  }

  /**
   * Converte o payload retornado pelo FastAPI SQLite para o formato Story do frontend,
   * mapeando traits por idioma (Mandarim: hanzi, pinyin, radicals, hsk_level) e SRS contínuo.
   */
  private normalizeStoryResponse(data: any, params: GenerateStoryParams): Story {
    const uiLang = params.nativeLanguage === 'English' ? 'en' : 'pt';
    const rawVocab = Array.isArray(data.targetVocabulary)
      ? data.targetVocabulary
      : (Array.isArray(data.dictionary) ? data.dictionary : []);

    // Mapeia vocabulário retornado da Tabela vocabulary / story_vocabulary
    const targetVocabulary: DictionaryEntry[] = rawVocab.map((item: any, idx: number) => {
      const traits = item.traits || {};
      const hanzi = traits.hanzi || item.hanzi || item.word;
      const pinyin = traits.pinyin || item.pinyin || item.ruby;
      const radicals = traits.radicals || item.radicals;
      const hskLevel = traits.hsk_level || traits.hskLevel || item.hsk_level;
      const wordVal = hanzi || item.word || `Palavra-${idx}`;

      const rawMeaning = traits.context_meaning || item.context_meaning || item.translation;
      const cleanMeaning = (!isInvalidTranslation(rawMeaning, wordVal))
        ? rawMeaning
        : (getAuxiliaryTranslation(wordVal, params.language, uiLang) || (uiLang === 'en' ? 'Target vocabulary' : 'Vocabulário alvo'));

      const masteryScore = typeof item.mastery_score === 'number'
        ? (item.mastery_score <= 1.0 ? Math.round(item.mastery_score * 100) : item.mastery_score)
        : 25;
      const statusColor = item.status_color || getStatusColor(masteryScore);
      const isPinned = Boolean(item.is_pinned || item.isStarred);
      const repetitionWeight = item.repetition_weight || getRepetitionWeight(masteryScore, isPinned);

      return {
        id: item.id ? String(item.id) : `dict-${idx}-${Date.now()}`,
        word: wordVal,
        ruby: pinyin,
        phonetic: pinyin,
        translation: cleanMeaning || 'Vocabulário',
        partOfSpeech: traits.part_of_speech || item.part_of_speech || item.partOfSpeech || getAuxiliaryPOS(wordVal, params.language) || 'Noun',
        definition: item.definition || cleanMeaning || 'Vocabulário alvo',
        exampleSentence: item.exampleSentence || hanzi || '',
        exampleTranslation: item.exampleTranslation || cleanMeaning || '',
        language: params.language,
        proficiency: params.proficiency,
        isStarred: isPinned,
        isPinned,
        masteryScore,
        statusColor,
        repetitionWeight,
        lookedUpCount: item.times_looked_up || 0,
        traits: {
          hanzi,
          pinyin,
          radicals,
          hskLevel,
          contextMeaning: cleanMeaning,
          partOfSpeech: traits.part_of_speech || item.part_of_speech || getAuxiliaryPOS(wordVal, params.language),
        },
        occurrences: item.occurrences || 1,
        lifetimeOccurrences: item.lifetimeOccurrences || 1,
        srsMetrics: item.srsMetrics || createDefaultSRSMetrics(),
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });

    if (data.paragraphs && Array.isArray(data.paragraphs) && data.paragraphs.length > 0) {
      const fullTextStr = data.fullText || data.content || '';
      // Garante que nenhum token fique colado com pontuação ou com tradução nula
      const enrichedParagraphs: StoryParagraph[] = data.paragraphs.map((p: any, pIdx: number) => ({
        ...p,
        sentences: (p.sentences || []).map((s: any, sIdx: number) => {
          const rawTokens = s.tokens || [];
          const sText = s.text || '';
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
            ...s,
            tokens,
          };
        }),
      }));

      return enrichStoryPhonetics({
        ...(data as Story),
        targetVocabulary,
        fullText: fullTextStr,
        paragraphs: enrichedParagraphs,
      });
    }

    const contentText = data.content || data.fullText || '';
    const rawParagraphs = contentText.split(/\n\s*\n/).filter(Boolean);

    const rawTranslations = Array.isArray(data.translations)
      ? data.translations
      : (Array.isArray(data.paragraph_translations) ? data.paragraph_translations : []);

    const paragraphs: StoryParagraph[] = rawParagraphs.map((paraText: string, pIdx: number) => {
      const explicitTranslation = rawTranslations[pIdx] || '';
      const tokens = segmentSentenceIntoTokens({
        sentenceText: paraText,
        language: params.language,
        targetVocabulary,
        uiLang,
        idPrefix: `t-${pIdx + 1}-1`,
      });

      return {
        id: `p-${pIdx + 1}`,
        sentences: [
          {
            id: `s-${pIdx + 1}-1`,
            text: paraText,
            translation: explicitTranslation || data.titleTranslation || '',
            tokens,
          },
        ],
      };
    });

    return enrichStoryPhonetics({
      id: String(data.id || data.story_id || `story-${Date.now()}`),
      title: data.title || 'Nova História Gerada',
      titleTranslation: data.titleTranslation || data.title_translation || '',
      language: params.language,
      proficiency: params.proficiency,
      contextTheme: params.contextTheme || data.theme || 'História personalizada',
      storyLength: params.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || 'high',
      paragraphs,
      targetVocabulary,
      quiz: data.quiz || [],
      estimatedReadingMinutes: Math.max(2, Math.ceil(contentText.length / 100)),
      createdAt: new Date().toISOString(),
      isRTL: params.language === 'ar',
      fullText: contentText,
    });
  }
}

