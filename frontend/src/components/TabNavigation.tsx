import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, BookMarked } from 'lucide-react';

export const TabNavigation: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    allStoryWords,
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
            <h3>Activate Story on Current Tab</h3>
            <p>
              Interactive reader with clickable tokens, ruby phonetics, and retention quiz
            </p>
          </div>
        </div>
        <span className="tab-status-pill">
          {activeTab === 'story' ? 'Active Reader 📖' : 'Switch to Story'}
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
            <h3>Activate Dictionary on Current Tab</h3>
            <p>
              Full tabular dictionary indexing all {allStoryWords.length} words of this narrative
            </p>
          </div>
        </div>
        <span className="tab-status-pill">
          {activeTab === 'dictionary' ? 'Active Table 📚' : 'Switch to Dictionary'}
        </span>
      </div>
    </div>
  );
};
