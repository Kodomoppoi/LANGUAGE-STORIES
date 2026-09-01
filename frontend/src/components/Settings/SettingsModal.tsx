import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Settings,
  Sparkles,
  Server,
  Key,
  Volume2,
  Database,
  CheckCircle2,
  RefreshCw,
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
  } = useApp();

  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const handleTestBackend = async () => {
    setIsTestingBackend(true);
    setTestResult(null);
    const isLive = await apiService.checkBackendHealth(settings.backendUrl);
    setIsTestingBackend(false);
    updateSettings({ isBackendConnected: isLive });
    setTestResult(isLive ? 'Backend is online & connected! 🚀' : 'Backend is unreachable. Using smart offline hybrid.');
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
            <span>Application & AI Settings</span>
          </div>
          <button className="tts-btn-icon" onClick={() => setIsSettingsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Section 1: Backend FastAPI Connection */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Server size={16} />
              <span>Python FastAPI Backend</span>
            </div>

            <div className="control-group">
              <label className="control-label">Backend REST API Endpoint</label>
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
                  <span>Test</span>
                </button>
              </div>
              {testResult && (
                <div style={{ fontSize: '0.78rem', color: settings.isBackendConnected ? '#22c55e' : '#ffa34d', marginTop: 4 }}>
                  {testResult}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Direct Google Gemini API Integration */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Sparkles size={16} />
              <span>Google Gemini AI (Direct Client)</span>
            </div>

            <div className="control-group">
              <label className="control-label">Gemini API Key (Optional)</label>
              <input
                type="password"
                className="control-input"
                value={settings.geminiApiKey}
                onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Allows direct client-side generation without needing a backend server running.
              </span>
            </div>

            <div className="control-group">
              <label className="control-label">Model Selection</label>
              <select
                className="control-select"
                value={settings.geminiModel}
                onChange={(e) => updateSettings({ geminiModel: e.target.value })}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest & Rich Structure)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
          </div>

          {/* Section 3: TTS & Display Options */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Volume2 size={16} />
              <span>Audio & Display Preferences</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={settings.showRuby}
                  onChange={(e) => updateSettings({ showRuby: e.target.checked })}
                  style={{ accentColor: 'var(--flower-500)' }}
                />
                <span>Show Ruby Annotations (Furigana for JA / Pinyin for ZH)</span>
              </label>

              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={settings.highlightSRS}
                  onChange={(e) => updateSettings({ highlightSRS: e.target.checked })}
                  style={{ accentColor: 'var(--flower-500)' }}
                />
                <span>Highlight Target Words with SRS Status</span>
              </label>
            </div>
          </div>

          {/* Section 4: Data Backup */}
          <div className="sidebar-panel" style={{ padding: '14px 16px' }}>
            <div className="panel-header-title">
              <Database size={16} />
              <span>Data & Backup</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={handleExportData}
              >
                Export JSON Vault Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
