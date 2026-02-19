import React from 'react';
import '../styles/SlidesPage.css';
import StatsCard from './StatsCard';

const SlidesPage = () => {
  return (
    <div className="slides-page">
      <div className="slides-header">
        <div className="slides-title-section">
          <h2 className="slides-title">Slides</h2>
          <p className="slides-description">
            Category-driven templates. Priority determines duration: Low=15s, Medium=30s, High=45s
          </p>
        </div>
        <button className="add-slide-btn">
          <span className="plus-icon">+</span>
          Add Slide
        </button>
      </div>

      <div className="stats-grid">
        <StatsCard title="Total Slides" count="5" bgColor="primary" />
        <StatsCard title="Active" count="3" bgColor="success" />
        <StatsCard title="Scheduled" count="1" bgColor="warning" />
        <StatsCard title="Archived" count="1" bgColor="muted" />
      </div>
    </div>
  );
};

export default SlidesPage;
