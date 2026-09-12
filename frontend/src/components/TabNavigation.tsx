import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, BookMarked } from 'lucide-react';

export const TabNavigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    allStoryWords,
    t,
  } = useApp();

  return (
    <div className="main-tab-grid">
      {/* Tab 1: Activate Story on Current Tab (Wireframe box 1) */}
      <div
        className={`wireframe-tab-card ${activeTab === 'story' ? 'active' : ''}`}
        onClick={() => setActiveTab('story')}
        role="button"
        tabIndex={0}
      >
        <div className="tab-card-info">
          <div className="tab-card-icon">
            <BookOpen size={22} />
          </div>
          <div className="tab-card-text">
            <h3>{t('tabCardStoryTitle')}</h3>
            <p>
              {t('tabCardStoryDesc')}
            </p>
          </div>
        </div>
        <span className="tab-status-pill">
          {activeTab === 'story' ? t('tabCardStoryActive') : t('tabCardStorySwitch')}
        </span>
      </div>

      {/* Tab 2: Activate Dictionary on Current Tab (Wireframe box 2) */}
      <div
        className={`wireframe-tab-card ${activeTab === 'dictionary' ? 'active' : ''}`}
        onClick={() => setActiveTab('dictionary')}
        role="button"
        tabIndex={0}
      >
        <div className="tab-card-info">
          <div className="tab-card-icon">
            <BookMarked size={22} />
          </div>
          <div className="tab-card-text">
            <h3>{t('tabCardDictTitle')}</h3>
            <p>
              {t('tabCardDictDesc')} ({allStoryWords.length})
            </p>
          </div>
        </div>
        <span className="tab-status-pill">
          {activeTab === 'dictionary' ? t('tabCardDictActive') : t('tabCardDictSwitch')}
        </span>
      </div>
    </div>
  );
};
