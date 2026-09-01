import { LanguageCode } from '../types';

export interface TTSPlayerCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onSentenceChange?: (sentenceIndex: number) => void;
  onWordBoundary?: (charIndex: number, length: number) => void;
  onError?: (error: any) => void;
}

const LANGUAGE_VOICE_MAP: Record<LanguageCode, string[]> = {
  ja: ['ja-JP', 'ja_JP', 'Japanese', 'Kyoko', 'Otoya'],
  zh: ['zh-CN', 'zh_CN', 'Chinese', 'Ting-Ting', 'Mei-Jia'],
  ar: ['ar-SA', 'ar_SA', 'Arabic', 'Maged', 'Tarik'],
  es: ['es-ES', 'es-MX', 'Spanish', 'Monica', 'Jorge'],
  fr: ['fr-FR', 'French', 'Thomas', 'Audrey'],
  de: ['de-DE', 'German', 'Anna', 'Stefan'],
  it: ['it-IT', 'Italian', 'Alice', 'Federica'],
  ko: ['ko-KR', 'Korean', 'Yuna'],
  ru: ['ru-RU', 'Russian', 'Milena', 'Yuri'],
  pt: ['pt-BR', 'pt-PT', 'Portuguese', 'Luciana', 'Felipe'],
  en: ['en-US', 'en-GB', 'English', 'Samantha', 'Daniel'],
};

class TTSService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;

  public speak(
    text: string,
    language: LanguageCode,
    speed: number = 1.0,
    callbacks?: TTSPlayerCallbacks
  ): void {
    this.stop();

    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      callbacks?.onError?.('SpeechSynthesis unsupported');
      return;
    }

    // Cancel any previous queue
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    utterance.rate = speed;
    utterance.pitch = 1.0;

    // Pick best matching voice
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
      utterance.lang = hints[0] || 'en-US';
    }

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      // In Chromium sometimes cancelling triggers an interrupted error, ignore if intentional
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

    // Workaround for Chromium garbage collection issue with long utterances
    window.speechSynthesis.speak(utterance);
  }

  public speakToken(tokenText: string, language: LanguageCode, speed: number = 0.9): void {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(tokenText);
    utterance.rate = speed;
    const voices = window.speechSynthesis.getVoices();
    const hints = LANGUAGE_VOICE_MAP[language] || ['en-US'];
    const matchedVoice = voices.find((v) =>
      hints.some((h) => v.lang.toLowerCase().includes(h.toLowerCase()))
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    } else {
      utterance.lang = hints[0];
    }
    window.speechSynthesis.speak(utterance);
  }

  public pause(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public isPlaying(): boolean {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }
}

export const ttsService = new TTSService();
