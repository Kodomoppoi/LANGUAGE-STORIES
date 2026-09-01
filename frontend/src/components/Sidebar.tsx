import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../services/sampleStories';
import { LanguageCode, ProficiencyLevel, StoryLength, RepetitionDensity } from '../types';
import {
  Globe,
  Gauge,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Repeat,
} from 'lucide-react';

const CONTEXT_PRESETS = [
  { value: '', label: 'None (Automatic by Proficiency)' },
  { value: 'Cozy Tokyo Cafe', label: '☕ Cozy Tokyo Cafe' },
  { value: 'Desert Caravan Mystery', label: '🏜️ Desert Caravan Mystery' },
  { value: 'Traditional Teahouse', label: '🍵 Traditional Teahouse' },
  { value: 'The Old Alchemist Garden', label: '🌿 Old Alchemist Garden' },
  { value: 'Midnight Street Food Market', label: '🏮 Midnight Food Market' },
  { value: 'Cyberpunk Neon Alley', label: '🚀 Cyberpunk Neon Alley' },
  { value: 'Sunny Mediterranean Harbor', label: '⛵ Mediterranean Harbor' },
  { value: 'Custom', label: '✍️ Custom Theme / Prompt...' },
];

const PROFICIENCY_LEVELS: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const STORY_LENGTHS: { value: StoryLength; label: string; desc: string }[] = [
  { value: 'standard', label: 'Mínimo (~350 palavras)', desc: '4 Parágrafos estruturados' },
  { value: 'medium', label: 'Médio (~600 palavras)', desc: '6 Parágrafos detalhados' },
  { value: 'extended', label: 'Longo (~900 palavras)', desc: '8 Parágrafos imersivos' },
  { value: 'epic', label: 'Épico (~1300 palavras)', desc: '10+ Parágrafos extensos' },
];

const REPETITION_DENSITIES: { value: RepetitionDensity; label: string; desc: string }[] = [
  { value: 'high', label: 'Alta (3x a 5x)', desc: 'Repetição ideal para retenção' },
  { value: 'intense', label: 'Intensa (4x a 6x)', desc: 'Imersão e fixação máxima' },
  { value: 'normal', label: 'Normal (2x a 3x)', desc: 'Repetição balanceada' },
];

export const Sidebar: React.FC = () => {
  const {
    currentLanguage,
    setLanguage,
    currentProficiency,
    setProficiency,
    settings,
    updateSettings,
    setIsSettingsOpen,
    generateNewStory,
    generateWithSameDictionary,
    increaseDictionaryAndGenerate,
    isGeneratingStory,
  } = useApp();

  const [selectedContext, setSelectedContext] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [numNewWords, setNumNewWords] = useState(3);

  const handleGenerateNew = async () => {
    const finalContext = selectedContext === 'Custom' ? customContext : selectedContext;
    await generateNewStory(finalContext || undefined);
  };

  const handleIncreaseDictionary = async () => {
    await increaseDictionaryAndGenerate(numNewWords);
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <aside className="sidebar">
      {/* Top Sidebar Section: API + Language + Proficiency */}
      <div className="sidebar-panel">
        <div className="panel-header-title">
          <Cpu size={16} />
          <span>Engine & Target Language</span>
        </div>

        {/* API Status Widget */}
        <div
          className="control-group"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsSettingsOpen(true)}
          title="Click to configure Backend, Gemini or Ollama"
        >
          <label className="control-label">API Engine & Provider</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {settings.isBackendConnected ? (
                <CheckCircle2 size={15} color="#22c55e" />
              ) : settings.geminiApiKey ? (
                <Sparkles size={15} color="var(--flower-400)" />
              ) : (
                <AlertCircle size={15} color="var(--flower-400)" />
              )}
              <span style={{ fontWeight: 600 }}>
                {settings.isBackendConnected
                  ? 'FastAPI Backend Live'
                  : settings.geminiApiKey
                  ? 'Gemini 2.5 Flash'
                  : 'Smart Procedural Offline'}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Config ⚙️</span>
          </div>
        </div>

        {/* Language Selector */}
        <div className="control-group">
          <label className="control-label" htmlFor="lang-select">
            <Globe size={13} style={{ display: 'inline', marginRight: 4 }} />
            Target Language
          </label>
          <select
            id="lang-select"
            className="control-select"
            value={currentLanguage}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({lang.nativeName})
                {lang.hasRuby ? ` [${lang.rubyType}]` : ''}
                {lang.isRTL ? ' [RTL]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Proficiency Selector */}
        <div className="control-group">
          <label className="control-label">
            <Gauge size={13} style={{ display: 'inline', marginRight: 4 }} />
            Proficiency Level (CEFR)
          </label>
          <div className="proficiency-grid">
            {PROFICIENCY_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`proficiency-btn ${currentProficiency === lvl ? 'active' : ''}`}
                onClick={() => setProficiency(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Story Length & Repetition Settings Panel */}
      <div className="sidebar-panel">
        <div className="panel-header-title">
          <BookOpen size={16} />
          <span>Tamanho & Repetições</span>
        </div>

        {/* Story Length Selector */}
        <div className="control-group">
          <label className="control-label" htmlFor="length-select">
            Tamanho da História
          </label>
          <select
            id="length-select"
            className="control-select"
            value={settings.storyLength || 'standard'}
            onChange={(e) => updateSettings({ storyLength: e.target.value as StoryLength })}
          >
            {STORY_LENGTHS.map((len) => (
              <option key={len.value} value={len.value}>
                {len.label} · {len.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Repetition Density */}
        <div className="control-group">
          <label className="control-label" htmlFor="rep-select">
            <Repeat size={13} style={{ display: 'inline', marginRight: 4 }} />
            Densidade de Repetição (SRS)
          </label>
          <select
            id="rep-select"
            className="control-select"
            value={settings.repetitionDensity || 'high'}
            onChange={(e) => updateSettings({ repetitionDensity: e.target.value as RepetitionDensity })}
          >
            {REPETITION_DENSITIES.map((rep) => (
              <option key={rep.value} value={rep.value}>
                {rep.label} · {rep.desc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Sidebar Section: Story Context & Generator Actions */}
      <div className="sidebar-panel">
        <div className="panel-header-title">
          <Layers size={16} />
          <span>Story Context & Generator</span>
        </div>

        {/* Context Selector */}
        <div className="control-group">
          <label className="control-label" htmlFor="context-select">
            Context of Story Selector
          </label>
          <select
            id="context-select"
            className="control-select"
            value={selectedContext}
            onChange={(e) => setSelectedContext(e.target.value)}
          >
            {CONTEXT_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Context input if selected */}
        {selectedContext === 'Custom' && (
          <div className="control-group">
            <label className="control-label">Custom Theme / Prompt</label>
            <input
              type="text"
              className="control-input"
              placeholder="e.g. Lost in a cyberpunk market..."
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
            />
          </div>
        )}

        {/* Action 1: Generate New */}
        <button
          className="btn-primary"
          onClick={handleGenerateNew}
          disabled={isGeneratingStory}
        >
          {isGeneratingStory ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Weaving Story...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Generate New Story</span>
            </>
          )}
        </button>

        {/* Action 2: Generate with Same Dictionary */}
        <button
          className="btn-secondary"
          onClick={generateWithSameDictionary}
          disabled={isGeneratingStory}
          title="Generates a new plot reusing target vocabulary to reinforce memory"
        >
          <RefreshCw size={15} />
          <span>Generate with Same Dict</span>
        </button>

        {/* Action 3: Increase Option (+ New Words) */}
        <div className="increase-words-box">
          <div className="increase-header">
            <span>Increase Option</span>
            <span style={{ color: 'var(--flower-400)', fontWeight: 700 }}>+{numNewWords} words</span>
          </div>
          <div className="word-count-selector">
            {[3, 5, 8, 10].map((num) => (
              <button
                key={num}
                type="button"
                className={`word-count-chip ${numNewWords === num ? 'active' : ''}`}
                onClick={() => setNumNewWords(num)}
              >
                +{num}
              </button>
            ))}
          </div>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            onClick={handleIncreaseDictionary}
            disabled={isGeneratingStory}
          >
            <PlusCircle size={15} />
            <span>Add to Current Dictionary</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
