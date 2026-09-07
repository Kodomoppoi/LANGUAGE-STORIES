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
    t,
  } = useApp();

  const [selectedContext, setSelectedContext] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [numNewWords, setNumNewWords] = useState(3);

  const isEn = settings.uiLanguage === 'en';

  const contextPresets = [
    { value: '', label: isEn ? 'None (Automatic by Proficiency)' : 'Nenhum (Automático por Nível)' },
    { value: 'Cozy Tokyo Cafe', label: isEn ? '☕ Cozy Tokyo Cafe' : '☕ Café Aconchegante em Tóquio' },
    { value: 'Desert Caravan Mystery', label: isEn ? '🏜️ Desert Caravan Mystery' : '🏜️ Mistério da Caravana no Deserto' },
    { value: 'Traditional Teahouse', label: isEn ? '🍵 Traditional Teahouse' : '🍵 Casa de Chá Tradicional' },
    { value: 'The Old Alchemist Garden', label: isEn ? '🌿 Old Alchemist Garden' : '🌿 Jardim do Velho Alquimista' },
    { value: 'Midnight Street Food Market', label: isEn ? '🏮 Midnight Food Market' : '🏮 Feira Noturna de Gastronomia' },
    { value: 'Cyberpunk Neon Alley', label: isEn ? '🚀 Cyberpunk Neon Alley' : '🚀 Beco Neon Cyberpunk' },
    { value: 'Sunny Mediterranean Harbor', label: isEn ? '⛵ Mediterranean Harbor' : '⛵ Porto Mediterrâneo Ensolarado' },
    { value: 'Custom', label: isEn ? '✍️ Custom Theme / Prompt...' : '✍️ Tema / Contexto Personalizado...' },
  ];

  const storyLengths: { value: StoryLength; label: string; desc: string }[] = isEn
    ? [
        { value: 'standard', label: 'Minimum (~350 words)', desc: '4 Structured paragraphs' },
        { value: 'medium', label: 'Medium (~600 words)', desc: '6 Detailed paragraphs' },
        { value: 'extended', label: 'Long (~900 words)', desc: '8 Immersive paragraphs' },
        { value: 'epic', label: 'Epic (~1300 words)', desc: '10+ Extensive paragraphs' },
      ]
    : [
        { value: 'standard', label: 'Mínimo (~350 palavras)', desc: '4 Parágrafos estruturados' },
        { value: 'medium', label: 'Médio (~600 palavras)', desc: '6 Parágrafos detalhados' },
        { value: 'extended', label: 'Longo (~900 palavras)', desc: '8 Parágrafos imersivos' },
        { value: 'epic', label: 'Épico (~1300 palavras)', desc: '10+ Parágrafos extensos' },
      ];

  const repetitionDensities: { value: RepetitionDensity; label: string; desc: string }[] = isEn
    ? [
        { value: 'high', label: 'High (3x to 5x)', desc: 'Ideal repetition for retention' },
        { value: 'intense', label: 'Intense (4x to 6x)', desc: 'Maximum immersion and reinforcement' },
        { value: 'normal', label: 'Normal (2x to 3x)', desc: 'Balanced repetition' },
      ]
    : [
        { value: 'high', label: 'Alta (3x a 5x)', desc: 'Repetição ideal para retenção' },
        { value: 'intense', label: 'Intensa (4x a 6x)', desc: 'Imersão e fixação máxima' },
        { value: 'normal', label: 'Normal (2x a 3x)', desc: 'Repetição balanceada' },
      ];

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
          <span>{t('sidebarEngineAndLang')}</span>
        </div>

        {/* API Status Widget */}
        <div
          className="control-group"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsSettingsOpen(true)}
          title={t('sidebarEngineTooltip')}
        >
          <label className="control-label">{t('sidebarApiEngine')}</label>
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
              {(settings.geminiApiKey?.trim() || settings.openRouterApiKey?.trim()) ? (
                <Sparkles size={15} color="#22c55e" />
              ) : settings.isBackendConnected ? (
                <CheckCircle2 size={15} color="#22c55e" />
              ) : (
                <AlertCircle size={15} color="var(--flower-400)" />
              )}
              <span style={{ fontWeight: 600 }}>
                {settings.geminiApiKey?.trim() && settings.openRouterApiKey?.trim()
                  ? '⚡ Auto-Fallback (Gemini + OpenRouter)'
                  : settings.openRouterApiKey?.trim()
                  ? `OpenRouter Free (${settings.openRouterModel?.split('/')?.[1] || 'Free Tier'})`
                  : settings.geminiApiKey?.trim()
                  ? (settings.isBackendConnected ? `FastAPI + ${settings.geminiModel || 'Gemini'}` : `${settings.geminiModel || 'Gemini'} (Direct)`)
                  : settings.isBackendConnected
                  ? (isEn ? 'FastAPI Local (Sem IA)' : 'FastAPI Local (Sem IA)')
                  : (isEn ? 'Smart Procedural Offline' : 'Procedural Inteligente Offline')}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Config ⚙️</span>
          </div>
        </div>

        {/* Language Selector */}
        <div className="control-group">
          <label className="control-label" htmlFor="lang-select">
            <Globe size={13} style={{ display: 'inline', marginRight: 4 }} />
            {t('sidebarTargetLanguage')}
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
            {t('sidebarProficiency')}
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
          <span>{t('sidebarStoryLengthAndRep')}</span>
        </div>

        {/* Story Length Selector */}
        <div className="control-group">
          <label className="control-label" htmlFor="length-select">
            {t('sidebarStoryLength')}
          </label>
          <select
            id="length-select"
            className="control-select"
            value={settings.storyLength || 'standard'}
            onChange={(e) => updateSettings({ storyLength: e.target.value as StoryLength })}
          >
            {storyLengths.map((len) => (
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
            {t('sidebarRepetitionDensity')}
          </label>
          <select
            id="rep-select"
            className="control-select"
            value={settings.repetitionDensity || 'high'}
            onChange={(e) => updateSettings({ repetitionDensity: e.target.value as RepetitionDensity })}
          >
            {repetitionDensities.map((rep) => (
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
          <span>{t('sidebarStoryContext')}</span>
        </div>

        {/* Context Selector */}
        <div className="control-group">
          <label className="control-label" htmlFor="context-select">
            {t('sidebarContextSelector')}
          </label>
          <select
            id="context-select"
            className="control-select"
            value={selectedContext}
            onChange={(e) => setSelectedContext(e.target.value)}
          >
            {contextPresets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Context input if selected */}
        {selectedContext === 'Custom' && (
          <div className="control-group">
            <label className="control-label">{t('sidebarCustomPrompt')}</label>
            <input
              type="text"
              className="control-input"
              placeholder={t('sidebarCustomPromptPlaceholder')}
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
              <span>{t('sidebarWeavingStory')}</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>{t('sidebarGenerateNewStory')}</span>
            </>
          )}
        </button>

        {/* Action 2: Generate with Same Dictionary */}
        <button
          className="btn-secondary"
          onClick={generateWithSameDictionary}
          disabled={isGeneratingStory}
          title={t('sidebarGenerateSameDictTooltip')}
        >
          <RefreshCw size={15} />
          <span>{t('sidebarGenerateSameDict')}</span>
        </button>

        {/* Action 3: Increase Option (+ New Words) */}
        <div className="increase-words-box">
          <div className="increase-header">
            <span>{t('sidebarIncreaseOption')}</span>
            <span style={{ color: 'var(--flower-400)', fontWeight: 700 }}>+{numNewWords} {t('sidebarWords')}</span>
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
            <span>{t('sidebarAddToCurrentDict')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
