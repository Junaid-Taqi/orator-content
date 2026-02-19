import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Navigation from './components/Navigation';
import SlidesPage from './components/SlidesPage';
import PoolsPage from './components/PoolPage';

function App() {
  const [activeTab, setActiveTab] = useState('slides');

  return (
    <div className="App">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        {activeTab === 'slides' && <SlidesPage />}
        {activeTab === 'pools' && (
          <div className="content-placeholder">
            <PoolsPage />
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="content-placeholder">
            <h2>Timeline</h2>
            <p>Coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
