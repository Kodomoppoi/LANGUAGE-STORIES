import { LanguageCode } from '../types';

export interface TTSPlayerCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onSentenceChange?: (sentenceIndex: number) => void;
  onWordBoundary?: (charIndex: number, length: number) => void;
  onError?: (error: any) => void;
}

export const LANGUAGE_VOICE_MAP: Record<string, string[]> = {
  ja: [
    'ja-JP',
    'ja_JP',
    'ja',
    'Japanese',
    '日本語',
    'Nanami',
    'Keita',
    'Ayumi',
    'Haruka',
    'Ichiro',
    'Kyoko',
    'Otoya',
    'Hattori',
    'O-Ren',
    'Sayaka',
  ],
  jp: [
    'ja-JP',
    'ja_JP',
    'ja',
    'Japanese',
    '日本語',
    'Nanami',
    'Keita',
    'Ayumi',
    'Haruka',
    'Ichiro',
    'Kyoko',
    'Otoya',
    'Hattori',
    'O-Ren',
    'Sayaka',
  ],
  zh: ['zh-CN', 'zh_CN', 'Chinese', 'Ting-Ting', 'Mei-Jia', 'Xiaoxiao', 'Yunxi'],
  ar: ['ar-SA', 'ar_SA', 'Arabic', 'Maged', 'Tarik', 'Zariyah'],
  es: ['es-ES', 'es-MX', 'Spanish', 'Monica', 'Jorge', 'Elvira'],
  fr: ['fr-FR', 'French', 'Thomas', 'Audrey', 'Denise'],
  de: ['de-DE', 'German', 'Anna', 'Stefan', 'Katja'],
  it: ['it-IT', 'Italian', 'Alice', 'Federica', 'Elsa'],
  ko: ['ko-KR', 'Korean', 'Yuna', 'SunHi'],
  ru: ['ru-RU', 'Russian', 'Milena', 'Yuri', 'Svetlana'],
  pt: ['pt-BR', 'pt-PT', 'Portuguese', 'Luciana', 'Felipe', 'Francisca'],
  en: ['en-US', 'en-GB', 'English', 'Samantha', 'Daniel', 'Jenny'],
};

function normalizeLang(lang: string): LanguageCode {
  const l = (lang || 'zh').toLowerCase();
  if (l === 'jp') return 'ja';
  return l as LanguageCode;
}

class TTSService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private backendUrl: string = 'http://localhost:8000';
  private provider: 'edge-tts' | 'web-speech' = 'web-speech';
  private currentSpeed: number = 1.0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  public setBackendUrl(url: string): void {
    if (url && url.trim()) {
      this.backendUrl = url.trim().replace(/\/+$/, '');
    }
  }

  public setProvider(provider: 'edge-tts' | 'web-speech'): void {
    this.provider = provider;
  }

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  public getProvider(): 'edge-tts' | 'web-speech' {
    return this.provider;
  }

  public setSpeed(speed: number): void {
    this.currentSpeed = Math.max(0.5, Math.min(2.0, speed));
    if (this.currentAudio) {
      this.currentAudio.playbackRate = this.currentSpeed;
    }
  }

  public getSpeed(): number {
    return this.currentSpeed;
  }

  public hasVoiceForLanguage(language: string): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    const lang = normalizeLang(language);
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return false;
    const hints = LANGUAGE_VOICE_MAP[lang] || [];
    return voices.some((v) =>
      hints.some(
        (hint) =>
          v.lang.toLowerCase().includes(hint.toLowerCase()) ||
          v.name.toLowerCase().includes(hint.toLowerCase())
      )
    );
  }

  public speak(
    text: string,
    language: string,
    speed: number = 1.0,
    callbacks?: TTSPlayerCallbacks
  ): void {
    this.stop();
    const lang = normalizeLang(language);
    const cleanText = text?.trim();
    if (!cleanText) {
      callbacks?.onEnd?.();
      return;
    }

    const hasBrowserVoice = this.hasVoiceForLanguage(lang);
    const useWebSpeech = this.provider === 'web-speech' && hasBrowserVoice;

    if (useWebSpeech && 'speechSynthesis' in window) {
      this.speakWithWebSpeech(cleanText, lang, speed, callbacks);
    } else {
      this.speakWithBackendAudio(cleanText, lang, speed, callbacks);
    }
  }

  private speakWithWebSpeech(
    text: string,
    language: LanguageCode,
    speed: number,
    callbacks?: TTSPlayerCallbacks
  ): void {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    utterance.rate = speed;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const hints = LANGUAGE_VOICE_MAP[language] || ['en-US'];

    const matchedVoice = voices.find((v) =>
      hints.some(
        (hint) =>
          v.lang.toLowerCase().includes(hint.toLowerCase()) ||
          v.name.toLowerCase().includes(hint.toLowerCase())
      )
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    } else {
      utterance.lang = hints[0] || 'ja-JP';
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error('SpeechSynthesis error:', e);
        callbacks?.onError?.(e);
      }
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        callbacks?.onWordBoundary?.(event.charIndex, event.charLength || 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  private speakWithBackendAudio(
    text: string,
    language: LanguageCode,
    speed: number,
    callbacks?: TTSPlayerCallbacks
  ): void {
    const url = `${this.backendUrl}/api/tts/synthesize?text=${encodeURIComponent(text)}&language=${language}`;
    const audio = new Audio(url);
    this.currentAudio = audio;
    audio.playbackRate = Math.max(0.5, Math.min(2.0, speed));

    audio.onplay = () => {
      callbacks?.onStart?.();
    };

    audio.onended = () => {
      this.currentAudio = null;
      callbacks?.onEnd?.();
    };

    audio.onerror = (e) => {
      this.currentAudio = null;
      console.warn(`[TTS] Falha ao sintetizar áudio neural para ${language}:`, e);
      callbacks?.onError?.({
        type: 'voice_unavailable',
        language,
        message: `Não foi possível carregar o áudio neural para ${language}. Verifique se o backend FastAPI (porta 8000) está ativo.`,
      });
    };

    audio.play().catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[TTS] Reprodução de áudio interrompida ou bloqueada:', err);
        callbacks?.onError?.(err);
      }
    });
  }

  public speakToken(tokenText: string, language: string, speed: number = 0.9): void {
    const lang = normalizeLang(language);
    const cleanText = tokenText?.trim();
    if (!cleanText) return;

    const hasBrowserVoice = this.hasVoiceForLanguage(lang);
    if (this.provider !== 'edge-tts' && hasBrowserVoice && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speed;
      const voices = window.speechSynthesis.getVoices();
      const hints = LANGUAGE_VOICE_MAP[lang] || ['en-US'];
      const matchedVoice = voices.find((v) =>
        hints.some(
          (h) =>
            v.lang.toLowerCase().includes(h.toLowerCase()) ||
            v.name.toLowerCase().includes(h.toLowerCase())
        )
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      } else {
        utterance.lang = hints[0] || 'ja-JP';
      }
      window.speechSynthesis.speak(utterance);
      return;
    }

    this.stop();
    const url = `${this.backendUrl}/api/tts/synthesize?text=${encodeURIComponent(cleanText)}&language=${lang}`;
    const audio = new Audio(url);
    this.currentAudio = audio;
    audio.playbackRate = Math.max(0.5, Math.min(2.0, speed));
    audio.play().catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[TTS] Falha na reprodução do token:', err);
      }
    });
  }

  public pause(): void {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause();
    }
  }

  public resume(): void {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => {});
    }
  }

  public stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  public isPlaying(): boolean {
    const isSynthPlaying = 'speechSynthesis' in window && window.speechSynthesis.speaking;
    const isAudioPlaying =
      this.currentAudio !== null && !this.currentAudio.paused && !this.currentAudio.ended;
    return Boolean(isSynthPlaying || isAudioPlaying);
  }
}

export const ttsService = new TTSService();
