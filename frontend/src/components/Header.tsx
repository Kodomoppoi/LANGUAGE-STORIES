import React from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Star,
  Globe,
  Sun,
  Moon,
  Settings,
  Sparkles,
  Download,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../services/sampleStories';

export const Header: React.FC = () => {
  const {
    allStoryWords,
    vocabularyVault,
    currentLanguage,
    currentProficiency,
    settings,
    toggleTheme,
    setIsSettingsOpen,
    exportVocabularyJson,
  } = useApp();

  const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
  const starredCount = vocabularyVault.filter((v) => v.isStarred).length;

  return (
    <header className="app-header">
      {/* Brand Section with Radiant Orange Flower Icon */}
      <div className="brand-section">
        <div className="brand-logo-ring">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="14" fill="#D46F33" />
            <circle cx="50" cy="22" r="14" fill="#FFFFFF" opacity="0.95" />
            <circle cx="75" cy="36" r="14" fill="#FFFFFF" opacity="0.95" />
            <circle cx="75" cy="64" r="14" fill="#FFFFFF" opacity="0.95" />
            <circle cx="50" cy="78" r="14" fill="#FFFFFF" opacity="0.95" />
            <circle cx="25" cy="64" r="14" fill="#FFFFFF" opacity="0.95" />
            <circle cx="25" cy="36" r="14" fill="#FFFFFF" opacity="0.95" />
            <circle cx="50" cy="50" r="8" fill="#B8531D" />
          </svg>
        </div>
        <div>
          <div className="brand-title">
            Language Stories
            <Sparkles size={15} color="var(--flower-500)" />
          </div>
          <div className="brand-subtitle">Interactive Reader & Vocabulary Table</div>
        </div>
      </div>

      {/* User Data & Story Metrics Bar */}
      <div className="user-stats-bar">
        {/* Story Word Count Pill */}
        <div className="stat-pill highlight-orange" title="Total unique words indexed in current story">
          <BookOpen size={15} />
          <span>{allStoryWords.length} Story Words</span>
        </div>

        {/* Starred Focus Count Pill */}
        <div className="stat-pill highlight-amber" title="Starred words saved in your vocabulary vault">
          <Star size={15} fill={starredCount > 0 ? '#ffb703' : 'none'} color="#ffb703" />
          <span>{starredCount} Starred</span>
        </div>

        {/* Current Active Language & Level Badge */}
        <div className="stat-pill" title="Target Language and CEFR Level">
          <Globe size={14} color="var(--flower-500)" />
          <span>{langInfo?.flag} {langInfo?.name} · {currentProficiency}</span>
        </div>

        {/* Export / Download Master Vocabulary JSON */}
        <button
          className="tts-btn-icon"
          onClick={() => exportVocabularyJson()}
          title="Baixar Arquivo JSON de Vocabulário (Master Bank)"
        >
          <Download size={16} color="var(--flower-400)" />
        </button>

        {/* Theme Mode Switcher */}
        <button
          className="tts-btn-icon"
          onClick={toggleTheme}
          title={settings.theme === 'dark' ? 'Switch to Sunlit Honey Birch' : 'Switch to Dark Woody Timber'}
        >
          {settings.theme === 'dark' ? (
            <Sun size={17} color="#ffd166" />
          ) : (
            <Moon size={17} color="#c2410c" />
          )}
        </button>

        {/* API Settings Modal Trigger */}
        <button
          className="tts-btn-icon"
          onClick={() => setIsSettingsOpen(true)}
          title="API & Engine Settings"
        >
          <Settings size={17} />
        </button>

        {/* Profile Emblem */}
        <div
          className="avatar-ring"
          onClick={() => setIsSettingsOpen(true)}
          title="User Profile & Engine Settings"
        >
          <div className="avatar-inner">🌼</div>
        </div>
      </div>
    </header>
  );
};
