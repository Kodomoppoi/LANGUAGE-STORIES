import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { NavigationRail } from './components/NavigationRail';
import { StoryReader } from './components/Reader/StoryReader';
import { StoryDictionary } from './components/Dictionary/StoryDictionary';
import { RetentionQuiz } from './components/Quiz/RetentionQuiz';
import { SettingsModal } from './components/Settings/SettingsModal';
import { StoryGenerationMascot } from './components/Mascot/StoryGenerationMascot';

export const App: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="desk-surface">
      {/* Centered Tablet Card Frame (Matching Reference Image) */}
      <div className="tablet-frame">
        {/* Left Slim Navigation Rail */}
        <NavigationRail />

        {/* Main Work Area */}
        <div className="tablet-content-area">
          {/* Top Bar with Title, Segmented Pill Switcher, and Actions */}
          <Header />

          {/* Core Content: Open Book Reader, Vocabulary Dictionary, or Starred Words */}
          <main className="tablet-main-viewport">
            {activeTab === 'story' && <StoryReader />}
            {activeTab === 'dictionary' && <StoryDictionary />}
            {activeTab === 'starred' && <StoryDictionary isStarredView={true} />}
          </main>
        </div>
      </div>

      {/* Modals & Overlays */}
      <RetentionQuiz />
      <SettingsModal />
      <StoryGenerationMascot />
    </div>
  );
};

export default App;
