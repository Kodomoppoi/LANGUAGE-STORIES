import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Settings,
  Sparkles,
  Server,
  Volume2,
  Database,
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { apiService } from '../../services/apiService';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    settings,
    updateSettings,
    vocabularyVault,
    userStats,
    t,
  } = useApp();

  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const [isTestingOpenRouter, setIsTestingOpenRouter] = useState(false);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isSettingsOpen) return null;

  const handleTestBackend = async () => {
    setIsTestingBackend(true);
    setTestResult(null);
    const isLive = await apiService.checkBackendHealth(settings.backendUrl);
    setIsTestingBackend(false);
    updateSettings({ isBackendConnected: isLive });
    setTestResult(isLive ? t('backendConnected') : t('backendUnreachable'));
    if (isLive && settings.geminiApiKey?.trim()) {
      await apiService.syncGeminiSettings(settings);
    }
  };

  const handleTestGemini = async () => {
    const key = settings.geminiApiKey?.trim();
    if (!key) {
      setGeminiTestResult({ success: false, message: t('settingsEnterKeyFirst') });
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestResult(null);

    const result = await apiService.testGeminiConnection(
      key,
      settings.geminiModel,
      settings.backendUrl
    );

    setIsTestingGemini(false);
    setGeminiTestResult({
      success: result.success,
      message: result.message,
    });

    if (result.models && result.models.length > 0) {
      setAvailableModels(result.models);
      if (!result.models.includes(settings.geminiModel)) {
        const preferred = result.models.find((m) => m === 'gemini-3.6-flash') ||
          result.models.find((m) => m.includes('3.') && m.includes('flash')) ||
          result.models.find((m) => m.includes('flash')) ||
          result.models[0];
        updateSettings({ geminiModel: preferred });
      }
    }

    if (result.success && settings.backendUrl) {
      await apiService.syncGeminiSettings(settings);
    }
  };

  const handleTestOpenRouter = async () => {
    const key = settings.openRouterApiKey?.trim();
    if (!key) {
      setOpenRouterTestResult({ success: false, message: t('openRouterEnterKeyFirst') });
      return;
    }
    setIsTestingOpenRouter(true);
    setOpenRouterTestResult(null);

    const result = await apiService.testOpenRouterConnection(
      key,
      settings.openRouterModel || 'openrouter/free',
      settings.backendUrl
    );

    setIsTestingOpenRouter(false);
    setOpenRouterTestResult({
      success: result.success,
      message: result.message,
    });

    if (result.success && settings.backendUrl) {
      await apiService.syncOpenRouterSettings(settings);
    }
  };

  const handleExportData = () => {
    const data = {
      vault: vocabularyVault,
      stats: userStats,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `language-stories-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} color="var(--flower-500)" />
            <span>{t('settingsTitle')}</span>
          </div>
          <button className="tts-btn-icon" onClick={() => setIsSettingsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Section 1: Interface Language (English / Português) */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Globe size={16} />
              <span>{t('interfaceLanguageSection')}</span>
            </div>

            <div className="control-group">
              <label className="control-label">{t('interfaceLanguageDesc')}</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginTop: '6px',
                }}
              >
                <button
                  type="button"
                  className={`btn-secondary ${settings.uiLanguage === 'pt' ? 'active-lang-choice' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: settings.uiLanguage === 'pt'
                      ? '2px solid var(--flower-500)'
                      : '1.5px solid var(--border-medium)',
                    background: settings.uiLanguage === 'pt'
                      ? 'rgba(200, 90, 43, 0.12)'
                      : 'var(--bg-input)',
                    color: settings.uiLanguage === 'pt'
                      ? 'var(--flower-600)'
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onClick={() => updateSettings({ uiLanguage: 'pt' })}
                >
                  <span style={{ fontSize: '1.15rem' }}>🇧🇷</span>
                  <span>{t('langPortuguese')}</span>
                </button>

                <button
                  type="button"
                  className={`btn-secondary ${settings.uiLanguage === 'en' ? 'active-lang-choice' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: settings.uiLanguage === 'en'
                      ? '2px solid var(--flower-500)'
                      : '1.5px solid var(--border-medium)',
                    background: settings.uiLanguage === 'en'
                      ? 'rgba(200, 90, 43, 0.12)'
                      : 'var(--bg-input)',
                    color: settings.uiLanguage === 'en'
                      ? 'var(--flower-600)'
                      : 'var(--text-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onClick={() => updateSettings({ uiLanguage: 'en' })}
                >
                  <span style={{ fontSize: '1.15rem' }}>🇺🇸</span>
                  <span>{t('langEnglish')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Active AI Generation Mode / Provider */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Zap size={16} color="var(--flower-500)" />
              <span>{t('providerSelectionLabel')}</span>
            </div>

            <div className="control-group">
              <select
                className="control-select"
                value={settings.apiProvider}
                onChange={(e) => {
                  const newProvider = e.target.value as any;
                  updateSettings({ apiProvider: newProvider });
                  if (settings.backendUrl) {
                    apiService.syncProvider(newProvider, settings.backendUrl);
                  }
                }}
              >
                <option value="hybrid">{t('providerHybrid')}</option>
                <option value="gemini">{t('providerGeminiOnly')}</option>
                <option value="openrouter">{t('providerOpenRouterOnly')}</option>
                <option value="mock">{t('providerMockOnly')}</option>
              </select>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {settings.apiProvider === 'hybrid' && t('providerHybridDesc')}
                {settings.apiProvider === 'gemini' && t('providerGeminiOnlyDesc')}
                {settings.apiProvider === 'openrouter' && t('providerOpenRouterOnlyDesc')}
                {settings.apiProvider === 'mock' && t('mockModeNotice')}
              </div>
            </div>
          </div>

          {/* Section 3: OpenRouter Free Tier Integration (Exibido apenas em modo Hybrid ou OpenRouter Only) */}
          {(settings.apiProvider === 'hybrid' || settings.apiProvider === 'openrouter') && (
            <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
              <div className="panel-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} color="#38bdf8" />
                  <span>{t('openRouterSection')}</span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  {t('rateLimit80Badge')}
                </span>
              </div>

              <div className="control-group">
                <label className="control-label">{t('openRouterKeyLabel')}</label>
                <input
                  type="password"
                  className="control-input"
                  value={settings.openRouterApiKey || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateSettings({ openRouterApiKey: val });
                    setOpenRouterTestResult(null);
                  }}
                  onBlur={() => {
                    if (settings.openRouterApiKey?.trim() && settings.isBackendConnected) {
                      apiService.syncOpenRouterSettings(settings);
                    }
                  }}
                  placeholder="sk-or-v1-..."
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {t('openRouterKeyDesc')}
                </span>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleTestOpenRouter}
                    disabled={isTestingOpenRouter || !settings.openRouterApiKey?.trim()}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isTestingOpenRouter ? <Loader2 size={13} className="spin" /> : <Zap size={13} color="#38bdf8" />}
                    <span>{t('openRouterTestBtn')}</span>
                  </button>
                </div>

                {openRouterTestResult && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: openRouterTestResult.success ? '#22c55e' : '#f87171',
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    {openRouterTestResult.success ? <CheckCircle2 size={14} color="#22c55e" /> : <AlertCircle size={14} color="#f87171" />}
                    <span>{openRouterTestResult.message}</span>
                  </div>
                )}
              </div>

              <div className="control-group">
                <label className="control-label">{t('openRouterModelLabel')}</label>
                <select
                  className="control-select"
                  value={settings.openRouterModel || 'openrouter/free'}
                  onChange={(e) => updateSettings({ openRouterModel: e.target.value })}
                >
                  <option value="openrouter/free">{t('modelOpenRouterFree')}</option>
                  <option value="google/gemma-4-26b-a4b-it:free">{t('modelGemma426b')}</option>
                  <option value="google/gemma-4-31b-it:free">{t('modelGemma431b')}</option>
                  <option value="nvidia/nemotron-3.5-lightning:free">{t('modelNemotron')}</option>
                  <option value="liquid/lfm-2.5-2.6b:free">{t('modelLiquid')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Section 4: Direct Google Gemini API Integration (Exibido apenas em modo Hybrid ou Gemini Only) */}
          {(settings.apiProvider === 'hybrid' || settings.apiProvider === 'gemini') && (
            <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
              <div className="panel-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} />
                  <span>{t('geminiSection')}</span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '12px', background: 'rgba(200, 90, 43, 0.15)', color: 'var(--flower-500)' }}>
                  {t('rateLimit80Badge')}
                </span>
              </div>

              <div className="control-group">
                <label className="control-label">{t('geminiKeyLabel')}</label>
                <input
                  type="password"
                  className="control-input"
                  value={settings.geminiApiKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateSettings({ geminiApiKey: val });
                    setGeminiTestResult(null);
                  }}
                  onBlur={() => {
                    if (settings.geminiApiKey?.trim() && settings.isBackendConnected) {
                      apiService.syncGeminiSettings(settings);
                    }
                  }}
                  placeholder="AIzaSy..."
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {t('geminiKeyDesc')}
                </span>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleTestGemini}
                    disabled={isTestingGemini || !settings.geminiApiKey?.trim()}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isTestingGemini ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} color="var(--flower-400)" />}
                    <span>{t('settingsTestGeminiBtn')}</span>
                  </button>
                </div>

                {geminiTestResult && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: geminiTestResult.success ? '#22c55e' : '#f87171',
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    {geminiTestResult.success ? <CheckCircle2 size={14} color="#22c55e" /> : <AlertCircle size={14} color="#f87171" />}
                    <span>{geminiTestResult.message}</span>
                  </div>
                )}
              </div>

              <div className="control-group">
                <label className="control-label">{t('modelSelectionLabel')}</label>
                <select
                  className="control-select"
                  value={settings.geminiModel}
                  onChange={(e) => updateSettings({ geminiModel: e.target.value })}
                >
                  {availableModels.length > 0 ? (
                    availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-3.6-flash">Gemini 3.6 Flash</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Modo Mock Offline Notice */}
          {settings.apiProvider === 'mock' && (
            <div className="sidebar-panel" style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>ℹ️</span>
              <span>{t('mockModeNotice')}</span>
            </div>
          )}

          {/* Section 5: Backend FastAPI Connection */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Server size={16} />
              <span>{t('backendSection')}</span>
            </div>

            <div className="control-group">
              <label className="control-label">{t('backendEndpointLabel')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="control-input"
                  value={settings.backendUrl}
                  onChange={(e) => updateSettings({ backendUrl: e.target.value })}
                  placeholder="http://localhost:8000"
                />
                <button
                  className="btn-secondary"
                  style={{ width: 'auto', padding: '8px 14px' }}
                  onClick={handleTestBackend}
                  disabled={isTestingBackend}
                >
                  <RefreshCw size={14} className={isTestingBackend ? 'spin' : ''} />
                  <span>{t('testBtn')}</span>
                </button>
              </div>
              {testResult && (
                <div style={{ fontSize: '0.78rem', color: settings.isBackendConnected ? '#22c55e' : '#ffa34d', marginTop: 4 }}>
                  {testResult}
                </div>
              )}
            </div>
          </div>

          {/* Section 6: TTS & Display Options */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Volume2 size={16} />
              <span>{t('audioDisplaySection')}</span>
            </div>

            <div className="control-group" style={{ marginBottom: '14px' }}>
              <label className="control-label">
                {settings.uiLanguage === 'pt' ? 'Motor de Leitura (TTS)' : 'TTS Voice Engine'}
              </label>
              <select
                className="control-select"
                value={settings.ttsProvider}
                onChange={(e) => updateSettings({ ttsProvider: e.target.value as 'edge-tts' | 'web-speech' })}
              >
                <option value="web-speech">
                  {settings.uiLanguage === 'pt'
                    ? 'Híbrido Inteligente (Web Speech + Fallback Neural)'
                    : 'Smart Hybrid (Web Speech + Neural Fallback)'}
                </option>
                <option value="edge-tts">
                  {settings.uiLanguage === 'pt'
                    ? 'Edge-TTS Neural (Backend FastAPI - Alta Definição)'
                    : 'Edge-TTS Neural (FastAPI Backend - High Definition)'}
                </option>
              </select>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                {settings.uiLanguage === 'pt'
                  ? 'Suporte nativo a Japonês (Nanami/Keita) e Mandarim com cache instantâneo.'
                  : 'Native support for Japanese (Nanami/Keita) and Mandarin with instant audio cache.'}
              </span>
            </div>

            <div className="control-group" style={{ marginBottom: '14px' }}>
              <label className="control-label">
                {settings.uiLanguage === 'pt' ? 'Velocidade de Leitura (TTS)' : 'Default Playback Speed'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    className={`btn-secondary ${settings.ttsSpeed === speed ? 'active' : ''}`}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      background: settings.ttsSpeed === speed ? 'var(--flower-500)' : 'var(--bg-input)',
                      color: settings.ttsSpeed === speed ? '#ffffff' : 'var(--text-primary)',
                      borderColor: settings.ttsSpeed === speed ? 'var(--flower-500)' : 'var(--border-medium)',
                    }}
                    onClick={() => updateSettings({ ttsSpeed: speed })}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={settings.showRuby}
                  onChange={(e) => updateSettings({ showRuby: e.target.checked })}
                  style={{ accentColor: 'var(--flower-500)' }}
                />
                <span>{t('showRubyLabel')}</span>
              </label>

              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={settings.highlightSRS}
                  onChange={(e) => updateSettings({ highlightSRS: e.target.checked })}
                  style={{ accentColor: 'var(--flower-500)' }}
                />
                <span>{t('highlightSRSLabel')}</span>
              </label>
            </div>
          </div>

          {/* Section 5: Data Backup */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Database size={16} />
              <span>{t('dataBackupSection')}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={handleExportData}
              >
                {t('exportVaultBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
