import { Story, AppSettings } from '../../types';
import { GenerateStoryParams, StoryGeneratorProvider } from './types';

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

    return await response.json();
  }
}
