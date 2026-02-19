import React from 'react';
import '../styles/CategorySelector.css';

const categories = [
  { id: 'news', title: 'News', icon: '📰' },
  { id: 'official', title: 'Official News', icon: '🏛️' },
  { id: 'events', title: 'Events', icon: '🎉' },
  { id: 'emergency', title: 'Emergency', icon: '🚨' },
  { id: 'always', title: 'Always On', icon: '🟢' },
];

const CategorySelector = ({ onSelectCategory, onBack, onCancel }) => {
  return (
    <div className="category-selector">
      <h2 className="category-title">Select Category</h2>
      <p className="category-desc">Choose the category for your slide. The template will be based on the category you select.</p>

      <div className="category-grid">
        {categories.map((c) => (
          <div
            key={c.id}
            className={`category-card category-${c.id}`}
            onClick={() => onSelectCategory(c.id)}
          >
            <div className="category-icon">{c.icon}</div>
            <div className="category-name">{c.title}</div>
          </div>
        ))}
      </div>

      <div className="category-actions">
        <button className="back-btn" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};

export default CategorySelector;
