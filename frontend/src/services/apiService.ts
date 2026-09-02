import { Story, AppSettings } from '../types';
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
