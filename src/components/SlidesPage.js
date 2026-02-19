import React, { useState } from 'react';
import '../styles/SlidesPage.css';
import StatsCard from './StatsCard';
import Modal from './Modal';
import SlideTypeSelector from './SlideTypeSelector';

const SlidesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSlide = () => {
    setIsModalOpen(true);
  };

  const handleSelectType = (typeId) => {
    console.log('Selected slide type:', typeId);
    setIsModalOpen(false);
    // TODO: Handle the selected slide type
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="slides-page">
      <div className="slides-header">
        <div className="slides-title-section">
          <h2 className="slides-title">Slides</h2>
          <p className="slides-description">
            Category-driven templates. Priority determines duration: Low=15s, Medium=30s, High=45s
          </p>
        </div>
        <button className="add-slide-btn" onClick={handleAddSlide}>
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

      <Modal isOpen={isModalOpen} onClose={handleCancelModal}>
        <SlideTypeSelector
          onSelectType={handleSelectType}
          onCancel={handleCancelModal}
        />
      </Modal>
    </div>
  );
};

export default SlidesPage;
