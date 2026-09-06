import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Globe,
  Sun,
  Moon,
  Settings,
  Download,
  HelpCircle,
  Gauge,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../services/sampleStories';
import { LanguageCode, ProficiencyLevel } from '../types';
import { getProficiencyNativeInfo, getProficiencyOptions } from '../services/proficiencyUtils';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentLanguage,
    setLanguage,
    currentProficiency,
    setProficiency,
    settings,
    toggleTheme,
    setIsSettingsOpen,
    exportVocabularyJson,
    t,
  } = useApp();

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
  const currentLevelInfo = getProficiencyNativeInfo(currentLanguage, currentProficiency);
  const proficiencyOptions = getProficiencyOptions(currentLanguage);

  return (
    <header className="book-top-bar">
      {/* Left: Clean Title */}
      <div className="book-bar-left">
        <h1 className="book-app-title">{t('appName')}</h1>
      </div>

      {/* Center: Floating Pill Segmented Switcher */}
      <div className="book-segmented-dock">
        <button
          className={`book-segment-btn ${activeTab === 'story' ? 'active' : ''}`}
          onClick={() => setActiveTab('story')}
          type="button"
        >
          {t('tabInteractive')}
        </button>
        <button
          className={`book-segment-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
          onClick={() => setActiveTab('dictionary')}
          type="button"
        >
          {t('tabDictionary')}
        </button>
      </div>

      {/* Right: Language Selector, Theme, Settings & Profile */}
      <div className="book-bar-right">
        {/* Language Selector Dropdown */}
        <div className="book-lang-picker-wrapper">
          <Globe size={14} color="var(--flower-500)" />
          <select
            className="book-lang-select"
            value={currentLanguage}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            title={t('changeLanguage')}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option
                key={lang.code}
                value={lang.code}
              >
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dedicated Native Level / Difficulty Selector */}
        <div className="book-level-picker-wrapper" title={`Dificuldade atual: ${currentLevelInfo.fullLabel}`}>
          <Gauge size={14} style={{ color: currentLevelInfo.color }} />
          <select
            className="book-level-select"
            value={currentProficiency}
            onChange={(e) => setProficiency(e.target.value as ProficiencyLevel)}
            title="Alterar nível e dificuldade da história"
          >
            {proficiencyOptions.map((opt) => (
              <option key={opt.level} value={opt.level}>
                {opt.badgeLabel}
              </option>
            ))}
          </select>
        </div>

        {/* Export JSON Bank */}
        <button
          className="book-circle-icon-btn"
          onClick={() => exportVocabularyJson()}
          title={t('exportJson')}
        >
          <Download size={15} />
        </button>

        {/* Theme Toggle (Light Warm Wood vs Dark Wood Timber) */}
        <button
          className="book-circle-icon-btn"
          onClick={toggleTheme}
          title={settings.theme === 'dark' ? t('switchToLight') : t('switchToDark')}
        >
          {settings.theme === 'dark' ? <Sun size={15} color="#ffb703" /> : <Moon size={15} />}
        </button>

        {/* Help / Info */}
        <button
          className="book-circle-icon-btn"
          onClick={() => setIsSettingsOpen(true)}
          title={t('settingsAndHelp')}
        >
          <HelpCircle size={15} />
        </button>

        {/* Avatar Profile */}
        <div
          className="book-avatar-circle"
          onClick={() => setIsSettingsOpen(true)}
          title={t('profileSettings')}
        >
          <span>読</span>
        </div>
      </div>
    </header>
  );
};
