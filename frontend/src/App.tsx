import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TabNavigation } from './components/TabNavigation';
import { StoryReader } from './components/Reader/StoryReader';
import { StoryDictionary } from './components/Dictionary/StoryDictionary';
import { RetentionQuiz } from './components/Quiz/RetentionQuiz';
import { SettingsModal } from './components/Settings/SettingsModal';

export const App: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="app-container">
      {/* Top Header with Brand & Story Metrics */}
      <Header />

      {/* Main Body Grid Layout (Matching Wireframe) */}
      <div className="app-body">
        {/* Left Sidebar: Engine + Language + Proficiency + Context & Generator Controls */}
        <Sidebar />

        {/* Right Main Content Area */}
        <main className="main-content">
          {/* Top Switcher Cards (Matching the 2 wireframe activation boxes) */}
          <TabNavigation />

          {/* Dynamic Content depending on active tab */}
          {activeTab === 'story' && <StoryReader />}
          {activeTab === 'dictionary' && <StoryDictionary />}
        </main>
      </div>

      {/* Modals and Overlays */}
      <RetentionQuiz />
      <SettingsModal />
    </div>
  );
};

export default App;
