import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  FastForward,
  Sparkles,
} from 'lucide-react';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5];

export const TTSPlayer: React.FC = () => {
  const {
    currentStory,
    isPlayingAudio,
    currentPlayingSentenceIndex,
    playStoryAudio,
    pauseStoryAudio,
    stopStoryAudio,
    ttsSpeed,
    setTtsSpeed,
    settings,
    t,
  } = useApp();

  const allSentences = currentStory.paragraphs.flatMap((p) => p.sentences);
  const currentSentenceNum =
    currentPlayingSentenceIndex >= 0 ? currentPlayingSentenceIndex + 1 : 1;

  return (
    <div className="tts-docked-player">
      {/* Left controls: Play/Pause, Restart, Progress */}
      <div className="tts-controls-left">
        <button
          className="tts-btn-round"
          onClick={isPlayingAudio ? pauseStoryAudio : playStoryAudio}
          title={isPlayingAudio ? t('ttsPauseNarration') : t('ttsStartNarration')}
        >
          {isPlayingAudio ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
        </button>

        <button
          className="tts-btn-icon"
          onClick={stopStoryAudio}
          title={t('ttsRestart')}
        >
          <RotateCcw size={16} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Volume2 size={14} color="var(--flower-500)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              {isPlayingAudio ? t('ttsPlaying') : t('ttsInteractive')}
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {t('ttsSentencePrefix')} {currentSentenceNum} {t('ofPrefix')} {allSentences.length}
          </span>
        </div>
      </div>

      {/* Right controls: Speed chips & Engine badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="speed-badge-group">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              type="button"
              className={`speed-chip ${ttsSpeed === speed ? 'active' : ''}`}
              onClick={() => setTtsSpeed(speed)}
              title={`${t('ttsSpeedTooltip')} ${speed}x`}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            background: 'var(--bg-input)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}
          title={
            currentStory.language === 'ja'
              ? 'Voz Japonesa: ja-JP-NanamiNeural / Voz do Navegador'
              : 'Síntese de Voz Interativa'
          }
        >
          <Sparkles size={12} color="#ffa34d" />
          <span>
            {settings.ttsProvider === 'edge-tts'
              ? (currentStory.language === 'ja' ? 'Neural JP (Nanami)' : 'Neural TTS')
              : (currentStory.language === 'ja' ? 'TTS JP' : 'TTS Audio')}
          </span>
        </div>
      </div>
    </div>
  );
};
