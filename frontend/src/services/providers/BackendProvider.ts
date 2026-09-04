import { Story, AppSettings, SSEGenerationEvent, DictionaryEntry, StoryParagraph } from '../../types';
import { GenerateStoryParams, StoryGeneratorProvider } from './types';
import { createDefaultSRSMetrics, getStatusColor, getRepetitionWeight } from '../srsEngine';

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
    const response = await fetch(`${settings.backendUrl}/api/stories/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Backend request failed with status: ${response.status}`);
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

    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`SSE Backend request failed with status: ${response.status}`);
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

              if (eventName === 'stage_done') {
                if (payload.story) {
                  completedStory = this.normalizeStoryResponse(payload.story, params);
                } else {
                  completedStory = this.normalizeStoryResponse(payload, params);
                }
              }
            } catch (err) {
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

    // Se o stream fechou sem payload final completo, busca a história recém gerada
    return await this.generateStory(params, settings);
  }

  /**
   * Converte o payload retornado pelo FastAPI SQLite para o formato Story do frontend,
   * mapeando traits por idioma (Mandarim: hanzi, pinyin, radicals, hsk_level) e SRS contínuo.
   */
  private normalizeStoryResponse(data: any, params: GenerateStoryParams): Story {
    if (data.paragraphs && Array.isArray(data.paragraphs)) {
      return data as Story;
    }

    const contentText = data.content || data.fullText || '';
    const rawParagraphs = contentText.split(/\n\s*\n/).filter(Boolean);

    // Mapeia vocabulário retornado da Tabela vocabulary / story_vocabulary
    const targetVocabulary: DictionaryEntry[] = (data.dictionary || []).map((item: any, idx: number) => {
      const traits = item.traits || {};
      const hanzi = traits.hanzi || item.hanzi || item.word;
      const pinyin = traits.pinyin || item.pinyin || item.ruby;
      const radicals = traits.radicals || item.radicals;
      const hskLevel = traits.hsk_level || traits.hskLevel || item.hsk_level;
      const contextMeaning = traits.context_meaning || item.context_meaning || item.translation;
      const masteryScore = typeof item.mastery_score === 'number'
        ? (item.mastery_score <= 1.0 ? Math.round(item.mastery_score * 100) : item.mastery_score)
        : 25;
      const statusColor = item.status_color || getStatusColor(masteryScore);
      const isPinned = Boolean(item.is_pinned || item.isStarred);
      const repetitionWeight = item.repetition_weight || getRepetitionWeight(masteryScore, isPinned);

      return {
        id: item.id ? String(item.id) : `dict-${idx}-${Date.now()}`,
        word: hanzi || item.word || `Palavra-${idx}`,
        ruby: pinyin,
        phonetic: pinyin,
        translation: contextMeaning || item.translation || 'Termo em contexto',
        partOfSpeech: traits.part_of_speech || item.part_of_speech || item.partOfSpeech || 'Noun',
        definition: item.definition || contextMeaning || 'Vocabulário alvo',
        exampleSentence: item.exampleSentence || hanzi || '',
        exampleTranslation: item.exampleTranslation || contextMeaning || '',
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
          contextMeaning,
          partOfSpeech: traits.part_of_speech || item.part_of_speech,
        },
        occurrences: item.occurrences || 1,
        lifetimeOccurrences: item.lifetimeOccurrences || 1,
        srsMetrics: item.srsMetrics || createDefaultSRSMetrics(),
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });

    const rawTranslations = Array.isArray(data.translations)
      ? data.translations
      : (Array.isArray(data.paragraph_translations) ? data.paragraph_translations : []);

    const paragraphs: StoryParagraph[] = rawParagraphs.map((paraText: string, pIdx: number) => {
      const matchedTranslations: string[] = [];
      const tokens = paraText.split('').map((char: string, cIdx: number) => {
        const matchingWord = targetVocabulary.find((v) => v.word.includes(char));
        if (matchingWord?.translation && !matchedTranslations.includes(matchingWord.translation)) {
          matchedTranslations.push(matchingWord.translation);
        }
        return {
          id: `t-${pIdx}-${cIdx}`,
          text: char,
          ruby: matchingWord?.ruby,
          translation: matchingWord?.translation,
          partOfSpeech: matchingWord?.partOfSpeech,
          isTargetWord: Boolean(matchingWord),
          masteryScore: matchingWord?.masteryScore,
          statusColor: matchingWord?.statusColor,
          traits: matchingWord?.traits,
        };
      });

      const explicitTranslation = rawTranslations[pIdx] || '';
      const fallbackTranslation = matchedTranslations.length > 0
        ? matchedTranslations.join(' • ')
        : (data.titleTranslation || 'Tradução do parágrafo contextual');

      return {
        id: `p-${pIdx + 1}`,
        sentences: [
          {
            id: `s-${pIdx + 1}-1`,
            text: paraText,
            translation: explicitTranslation || fallbackTranslation,
            tokens,
          },
        ],
      };
    });

    return {
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
    };
  }
}

