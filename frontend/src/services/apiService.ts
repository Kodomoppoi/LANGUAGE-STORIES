import { Story, AppSettings, SSEGenerationEvent, WordDeepDiveData, LanguageCode, ProficiencyLevel } from '../types';
import { GenerateStoryParams } from './providers/types';
import { GeminiProvider } from './providers/GeminiProvider';
import { BackendProvider } from './providers/BackendProvider';
import { ProceduralProvider } from './providers/ProceduralProvider';
import { logService } from './logService';
import { storageService } from './storageService';

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
   * Sincroniza configurações do Gemini com o backend FastAPI
   */
  public async syncGeminiSettings(settings: AppSettings): Promise<boolean> {
    if (!settings.backendUrl || !settings.geminiApiKey?.trim()) return false;
    try {
      const response = await fetch(`${settings.backendUrl}/api/settings/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: settings.geminiApiKey.trim(),
          gemini_model: settings.geminiModel || 'gemini-3.6-flash',
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Testa a validade da chave Gemini (via backend ou chamada direta ao Google)
   */
  public async testGeminiConnection(
    apiKey: string,
    model: string = 'gemini-3.6-flash',
    backendUrl?: string
  ): Promise<{ success: boolean; message: string; models?: string[] }> {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      return { success: false, message: 'Nenhuma chave fornecida.' };
    }

    // 1. Tenta via backend se fornecido e acessível
    if (backendUrl) {
      try {
        const resp = await fetch(`${backendUrl}/api/settings/gemini/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gemini_api_key: trimmedKey,
            gemini_model: model,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          return {
            success: Boolean(data.success),
            message: data.message || 'Conexão validada.',
            models: data.models,
          };
        }
      } catch (err) {
        console.warn('Backend gemini test route unreachable, testing directly with Google:', err);
      }
    }

    // 2. Teste direto contra o Google API endpoint
    try {
      logService.addLog('INFO', 'GEMINI', 'Testando chave diretamente contra a Google Generative Language API...');
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const models = (data.models || [])
          .map((m: any) => (m.name || '').replace('models/', ''))
          .filter(Boolean);
        logService.addLog('SUCCESS', 'GEMINI', `Validação direta bem-sucedida! ${models.length} modelos disponíveis.`);
        return {
          success: true,
          message: `Conexão direta validada com sucesso! (${models.length} modelos disponíveis)`,
          models,
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        const errMessage = errJson?.error?.message || `Status HTTP ${response.status}`;
        logService.addLog('ERROR', 'GEMINI', `Google recusou a chave: ${errMessage}`);
        return {
          success: false,
          message: `Google recusou a chave: ${errMessage}`,
        };
      }
    } catch (err: any) {
      logService.addLog('ERROR', 'GEMINI', `Falha de rede ao conectar com Google: ${err?.message}`);
      return {
        success: false,
        message: `Falha de rede ao conectar com Google: ${err?.message}`,
      };
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
    const nativeLang: 'Portuguese' | 'English' =
      params.nativeLanguage || (settings.uiLanguage === 'en' ? 'English' : 'Portuguese');
    const finalParams: GenerateStoryParams = {
      ...params,
      storyLength: params.storyLength || settings.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || settings.repetitionDensity || 'high',
      nativeLanguage: nativeLang,
    };

    // 1. Tenta FastAPI Backend com SSE (/api/stories/generate/stream)
    if (
      (settings.apiProvider === 'hybrid' || settings.isBackendConnected) &&
      this.backendProvider.isAvailable(settings)
    ) {
      // Repassa diretamente a geração e quaisquer erros (chave inválida, cota, rede) para o AppContext
      return await this.backendProvider.generateStoryStream(finalParams, settings, onEvent);
    }

    // 2. Provedor Gemini direto no cliente (se configurado)
    if (
      settings.apiProvider === 'gemini' &&
      this.geminiProvider.isAvailable(settings)
    ) {
      return await this.geminiProvider.generateStory(finalParams, settings);
    }

    // 3. Provedor Procedural apenas se explicitamente selecionado como 'mock' nas configurações
    if (settings.apiProvider === 'mock') {
      return await this.proceduralProvider.generateStory(finalParams, settings);
    }

    // Se nenhum provedor estiver viável, dispara erro explícito para o caderno exibir o diagnóstico
    throw new Error(
      settings.uiLanguage === 'pt'
        ? 'Nenhum provedor de IA (Gemini ou Backend) está disponível. Verifique sua chave de API nas Configurações.'
        : 'No AI provider (Gemini or Backend) is available. Please check your API key in Settings.'
    );
  }

  /**
   * Generate a structured story delegating to the appropriate provider (Strategy Pattern)
   */
  public async generateStory(
    params: GenerateStoryParams,
    settings: AppSettings
  ): Promise<Story> {
    const nativeLang: 'Portuguese' | 'English' =
      params.nativeLanguage || (settings.uiLanguage === 'en' ? 'English' : 'Portuguese');
    const finalParams: GenerateStoryParams = {
      ...params,
      storyLength: params.storyLength || settings.storyLength || 'standard',
      repetitionDensity: params.repetitionDensity || settings.repetitionDensity || 'high',
      nativeLanguage: nativeLang,
    };

    // 1. Tenta Backend se conectado ou hybrid
    if (
      (settings.apiProvider === 'hybrid' || settings.isBackendConnected) &&
      this.backendProvider.isAvailable(settings)
    ) {
      return await this.backendProvider.generateStory(finalParams, settings);
    }

    // 2. Tenta direct Google Gemini API se configurado
    if (
      settings.apiProvider === 'gemini' &&
      this.geminiProvider.isAvailable(settings)
    ) {
      return await this.geminiProvider.generateStory(finalParams, settings);
    }

    // 3. Mock procedural apenas se explicitamente selecionado
    if (settings.apiProvider === 'mock') {
      return await this.proceduralProvider.generateStory(finalParams, settings);
    }

    throw new Error(
      settings.uiLanguage === 'pt'
        ? 'Nenhum provedor de IA disponível. Verifique sua chave de API nas Configurações.'
        : 'No AI provider available. Please check your API key in Settings.'
    );
  }

  /**
   * Obtém a análise aprofundada (Raio-X IA) de uma palavra com cache local e fallbacks
   */
  public async fetchWordDeepDive(
    word: string,
    language: LanguageCode,
    context: string = '',
    proficiency: ProficiencyLevel = 'A2',
    settings: AppSettings,
    forceRefresh: boolean = false
  ): Promise<WordDeepDiveData> {
    const trimmedWord = word.trim();
    if (!trimmedWord) {
      throw new Error('Palavra inválida');
    }

    // 1. Verificação em Cache Local (0ms de latência)
    if (!forceRefresh) {
      const cached = storageService.loadWordDeepDive(language, trimmedWord);
      if (cached) {
        logService.addLog('INFO', 'FRONTEND', `Raio-X de "${trimmedWord}" carregado instantaneamente do cache local (0ms).`);
        return cached;
      }
    }

    const nativeLang = settings.uiLanguage === 'en' ? 'English' : 'Portuguese';

    // 2. Tenta Backend FastAPI
    if (settings.isBackendConnected && settings.backendUrl) {
      try {
        logService.addLog('INFO', 'STAGE', `Solicitando Raio-X de "${trimmedWord}" ao backend FastAPI...`);
        const resp = await fetch(`${settings.backendUrl}/api/vocabulary/deep-dive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: trimmedWord,
            language,
            sentence_context: context,
            proficiency,
            native_lang: nativeLang,
            gemini_api_key: settings.geminiApiKey?.trim() || undefined,
            gemini_model: settings.geminiModel || undefined,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          storageService.saveWordDeepDive(language, trimmedWord, data);
          logService.addLog('SUCCESS', 'STAGE', `Raio-X de "${trimmedWord}" recebido e armazenado em cache!`);
          return data;
        }
      } catch (err) {
        console.warn('Backend deep-dive request failed, trying Gemini direct...', err);
      }
    }

    // 3. Tenta Google Gemini diretamente
    if (this.geminiProvider.isAvailable(settings)) {
      try {
        logService.addLog('INFO', 'GEMINI', `Gerando Raio-X de "${trimmedWord}" diretamente via Gemini...`);
        const data = await this.geminiProvider.fetchWordDeepDive(
          trimmedWord,
          language,
          context,
          proficiency,
          nativeLang,
          settings
        );
        storageService.saveWordDeepDive(language, trimmedWord, data);
        logService.addLog('SUCCESS', 'GEMINI', `Raio-X de "${trimmedWord}" gerado via Gemini e armazenado em cache!`);
        return data;
      } catch (err) {
        console.warn('Gemini direct deep-dive failed, falling back to simulated data...', err);
      }
    }

    // 4. Fallback Estruturado Simulado
    const isCJK = language === 'zh' || language === 'ja';
    const fallbackData: WordDeepDiveData = isCJK
      ? {
          word: trimmedWord,
          ruby: language === 'zh' ? '...' : '...',
          level: proficiency,
          part_of_speech: 'Palavra CJK',
          context_meaning: `Significado contextual de "${trimmedWord}" na narrativa.`,
          character_anatomy: [
            {
              char: trimmedWord[0] || '字',
              radical: language === 'zh' ? '部首' : '部首/Kanji',
              components: 'Componente básico e semântico',
              meaning: 'Elemento fundamental de significado',
            },
          ],
          shared_characters: [
            {
              word: `${trimmedWord[0]}...`,
              ruby: '',
              meaning: 'Vocábulo composto relacionado',
            },
          ],
          phonetics_homophones: {
            tip: 'Preste atenção aos tons e pronúncia precisa.',
            homophones: [],
          },
          synonyms_and_nuances: [
            {
              synonym: 'Termo correlato',
              difference: 'Variação contextual de uso.',
            },
          ],
        }
      : {
          word: trimmedWord,
          level: proficiency,
          part_of_speech: 'Vocábulo',
          context_meaning: `Significado de "${trimmedWord}" no contexto da história.`,
          etymology_roots: `Vocábulo característico do idioma.`,
          common_collocations: [
            {
              phrase: `usar ${trimmedWord}`,
              meaning: 'Expressão comum de uso diário',
            },
          ],
          false_friends_or_homophones: 'Atenção ao contexto para uso adequado.',
          synonyms_and_nuances: [
            {
              synonym: 'Termo similar',
              difference: 'Diferença de registro ou tom.',
            },
          ],
        };

    storageService.saveWordDeepDive(language, trimmedWord, fallbackData);
    return fallbackData;
  }
}

export const apiService = new ApiService();
