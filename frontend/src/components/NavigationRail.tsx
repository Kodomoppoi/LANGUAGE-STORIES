import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  BookOpen,
  BookMarked,
  Star,
  Settings,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const NavigationRail: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsSettingsOpen,
    vocabularyVault,
    currentLanguage,
  } = useApp();

  const starredCount = vocabularyVault.filter(
    (v) => v.isStarred && v.language === currentLanguage
  ).length;

  return (
    <nav className="nav-rail" aria-label="Main Navigation Dock">
      {/* Top Brand Emblem */}
      <div className="nav-rail-top">
        <div className="brand-circle-emblem" title="Language Stories">
          <div className="brand-circle-inner">
            <Sparkles size={16} color="#ffffff" />
          </div>
        </div>
      </div>

      {/* Middle Navigation Group */}
      <div className="nav-rail-menu">
        {/* Home / Reset to first spread */}
        <button
          className={`nav-rail-btn ${activeTab === 'story' ? 'active-pill' : ''}`}
          onClick={() => setActiveTab('story')}
          title="Reader Home (Interactive Story)"
        >
          <BookOpen size={20} />
        </button>

        {/* Dictionary */}
        <button
          className={`nav-rail-btn ${activeTab === 'dictionary' ? 'active-pill' : ''}`}
          onClick={() => setActiveTab('dictionary')}
          title="Vocabulary Table & Dictionary"
        >
          <BookMarked size={20} />
        </button>

        {/* Starred Words */}
        <button
          className={`nav-rail-btn ${activeTab === 'starred' ? 'active-pill' : ''}`}
          onClick={() => setActiveTab('starred')}
          title={`Palavras Favoritas (${starredCount} salvas)`}
        >
          <Star size={20} />
          {starredCount > 0 && <span className="nav-badge-dot" />}
        </button>

        {/* Profile / Stats */}
        <button
          className="nav-rail-btn"
          onClick={() => setIsSettingsOpen(true)}
          title="Engine & Profile Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Bottom Action: Reset / Home */}
      <div className="nav-rail-bottom">
        <button
          className="nav-rail-btn"
          onClick={() => {
            setActiveTab('story');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Scroll to Top"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </nav>
  );
};
