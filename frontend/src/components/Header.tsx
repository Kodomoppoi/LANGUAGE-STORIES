import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  Sun,
  Moon,
  Settings,
  Download,
  HelpCircle,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../services/sampleStories';
import { LanguageCode } from '../types';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentLanguage,
    setLanguage,
    currentProficiency,
    settings,
    toggleTheme,
    setIsSettingsOpen,
    exportVocabularyJson,
  } = useApp();

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);

  return (
    <header className="book-top-bar">
      {/* Left: Clean Title */}
      <div className="book-bar-left">
        <h1 className="book-app-title">Language reading</h1>
      </div>

      {/* Center: Floating Pill Segmented Switcher */}
      <div className="book-segmented-dock">
        <button
          className={`book-segment-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
          type="button"
        >
          Interactive
        </button>
        <button
          className={`book-segment-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => setActiveTab('dictionary')}
          type="button"
        >
          Dictionary
        </button>
      </div>

      {/* Right: Language Selector, Theme, Settings & Profile */}
      <div className="book-bar-right">
        {/* Language & Level Selector Dropdown */}
        <div className="book-lang-picker-wrapper">
          <Globe size={14} color="var(--flower-500)" />
          <select
            className="book-lang-select"
            value={currentLanguage}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            title="Change Target Language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name} ({currentProficiency})
              </option>
            ))}
          </select>
        </div>

        {/* Export JSON Bank */}
        <button
          className="book-circle-icon-btn"
          onClick={() => exportVocabularyJson()}
          title="Baixar banco de vocabulário em JSON"
        >
          <Download size={15} />
        </button>

        {/* Theme Toggle (Light Warm Wood vs Dark Wood Timber) */}
        <button
          className="book-circle-icon-btn"
          onClick={toggleTheme}
          title={settings.theme === 'dark' ? 'Mudar para mesa clara' : 'Mudar para madeira escura'}
        >
          {settings.theme === 'dark' ? <Sun size={15} color="#ffb703" /> : <Moon size={15} />}
        </button>

        {/* Help / Info */}
        <button
          className="book-circle-icon-btn"
          onClick={() => setIsSettingsOpen(true)}
          title="Configurações e ajuda"
        >
          <HelpCircle size={15} />
        </button>

        {/* Avatar Profile */}
        <div
          className="book-avatar-circle"
          onClick={() => setIsSettingsOpen(true)}
          title="Configurações de IA & Perfil"
        >
          <span>読</span>
        </div>
      </div>
    </header>
  );
};
