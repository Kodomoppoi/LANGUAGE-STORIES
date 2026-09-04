import { Story, AppSettings, SSEGenerationEvent } from '../types';
import { GenerateStoryParams } from './providers/types';
import { GeminiProvider } from './providers/GeminiProvider';
import { BackendProvider } from './providers/BackendProvider';
import { ProceduralProvider } from './providers/ProceduralProvider';

export * from './providers/types';

class ApiService {
  private geminiProvider = new GeminiProvider();
  private backendProvider = new BackendProvider();
  private proceduralProvider = new ProceduralProvider();

  /**
   * Check backend connection health
   */
  public async checkBackendHealth(backendUrl: string): Promise<boolean> {
    if (!backendUrl) return false;
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
   * 5. Streaming em Tempo Real (SSE) para o Mascote e geração em 2 etapas
   */
  public async generateStoryStream(
    params: GenerateStoryParams,
    settings: AppSettings,
    onEvent: (event: SSEGenerationEvent) => void
  ): Promise<Story> {
    const finalParams: GenerateStoryParams = {
      ...params,
      storyLength: params.storyLength || settings.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || settings.repetitionDensity || 'high',
    };

    // 1. Tenta FastAPI Backend com SSE (/api/stories/generate/stream)
    if (
      (settings.apiProvider === 'hybrid' || settings.isBackendConnected) &&
      this.backendProvider.isAvailable(settings)
    ) {
      try {
        return await this.backendProvider.generateStoryStream(finalParams, settings, onEvent);
      } catch (err) {
        console.warn('Backend SSE stream failed, falling back with mascot events...', err);
      }
    }

    // 2. Simulação e Fallback fiel ao Pipeline de 2 Etapas com eventos SSE para o mascote
    try {
      // ETAPA 1: Curadoria de Vocabulário Alvo
      onEvent({
        event: 'stage_start:curation',
        data: {
          message: 'Analisando seu cofre e selecionando vocabulário ideal...',
        },
      });

      // Breve pausa para o mascote exibir animação de busca/lupa
      await new Promise((r) => setTimeout(r, 900));

      const newWordsCount = finalParams.injectNewWordsCount || 5;
      const reviewWordsCount = finalParams.targetWords?.length || 3;

      onEvent({
        event: 'stage_curation_done',
        data: {
          new_words_count: newWordsCount,
          review_words_count: reviewWordsCount,
          message: `Vocabulário curado com sucesso: ${newWordsCount} novas e ${reviewWordsCount} para reforço!`,
        },
      });

      await new Promise((r) => setTimeout(r, 700));

      // ETAPA 2: Geração da Narrativa e Glossário
      const langLabel = finalParams.language === 'zh' ? 'em Mandarim' : '';
      onEvent({
        event: 'stage_start:generation',
        data: {
          message: `Escrevendo a história ${langLabel} com repetição e dicionário...`.trim(),
        },
      });

      let generatedStory: Story;

      // Executa Gemini se configurado
      if (
        (settings.apiProvider === 'gemini' || settings.apiProvider === 'hybrid') &&
        this.geminiProvider.isAvailable(settings)
      ) {
        try {
          generatedStory = await this.geminiProvider.generateStory(finalParams, settings);
        } catch (geminiErr) {
          console.warn('Gemini failed during stream, using procedural fallback:', geminiErr);
          generatedStory = await this.proceduralProvider.generateStory(finalParams, settings);
        }
      } else {
        generatedStory = await this.proceduralProvider.generateStory(finalParams, settings);
      }

      onEvent({
        event: 'stage_done',
        data: {
          story_id: generatedStory.id,
          title: generatedStory.title,
          dictionary: generatedStory.targetVocabulary,
          story: generatedStory,
          message: 'História e dicionário criados com sucesso!',
        },
      });

      return generatedStory;
    } catch (pipelineErr: any) {
      onEvent({
        event: 'error',
        data: {
          error_message: pipelineErr?.message || 'Erro inesperado na geração da história',
        },
      });
      throw pipelineErr;
    }
  }

  /**
   * Generate a structured story delegating to the appropriate provider (Strategy Pattern)
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

    // 1. Try Backend if connected or hybrid
    if (
      (settings.apiProvider === 'hybrid' || settings.isBackendConnected) &&
      this.backendProvider.isAvailable(settings)
    ) {
      try {
        return await this.backendProvider.generateStory(finalParams, settings);
      } catch (err) {
        console.warn('Backend provider failed, trying next strategy...', err);
      }
    }

    // 2. Try direct Google Gemini API if key is present
    if (
      (settings.apiProvider === 'gemini' || settings.apiProvider === 'hybrid') &&
      this.geminiProvider.isAvailable(settings)
    ) {
      try {
        return await this.geminiProvider.generateStory(finalParams, settings);
      } catch (err) {
        console.warn('Gemini provider failed, falling back to smart simulation...', err);
      }
    }

    // 3. Smart Procedural Simulation Fallback (Always available)
    return await this.proceduralProvider.generateStory(finalParams, settings);
  }
}

export const apiService = new ApiService();
