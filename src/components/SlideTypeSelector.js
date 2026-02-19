import React from 'react';
import '../styles/SlideTypeSelector.css';

const SlideTypeSelector = ({ onSelectType, onCancel }) => {
  const slideTypes = [
    {
      id: 'fullscreen',
      title: 'Fullscreen Slide',
      icon: '🟠',
      description: 'Display image or video as-is without any template structure.',
      color: 'orange'
    },
    {
      id: 'template',
      title: 'Template Slide',
      icon: '🟣',
      description: 'Category-based template with structured layout and dynamic fields.',
      color: 'purple'
    }
  ];

  return (
    <div className="slide-type-selector">
      <h2 className="selector-title">Choose Slide Type</h2>
      <div className="slide-types-grid">
        {slideTypes.map((type) => (
          <div
            key={type.id}
            className={`slide-type-card slide-type-${type.color}`}
            onClick={() => onSelectType(type.id)}
          >
            <div className="slide-type-icon">{type.icon}</div>
            <h3 className="slide-type-name">{type.title}</h3>
            <p className="slide-type-description">{type.description}</p>
          </div>
        ))}
      </div>
      <button className="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
};

export default SlideTypeSelector;
