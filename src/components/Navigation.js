import React from 'react';
import '../styles/Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'slides', label: 'Slides', icon: '📊' },
    { id: 'pools', label: 'Content Pools', icon: '🎯' },
    { id: 'timeline', label: 'Timeline', icon: '⏱️' },
  ];

  return (
    <nav className="navigation">
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
      <button className="connector-btn">
        <span className="connector-icon">🔗</span>
        <span>Connector</span>
      </button>
    </nav>
  );
};

export default Navigation;
