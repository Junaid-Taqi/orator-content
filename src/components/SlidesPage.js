import React, { useState } from 'react';
import '../styles/SlidesPage.css';
import StatsCard from './StatsCard';
import Modal from './Modal';
import SlideTypeSelector from './SlideTypeSelector';
import CategorySelector from './CategorySelector';

const SlidesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('type'); // 'type' | 'category'

  const handleAddSlide = () => {
    setModalContent('type');
    setIsModalOpen(true);
  };

  const handleSelectType = (typeId) => {
    if (typeId === 'fullscreen') {
      // switch to category selector while keeping modal open
      setModalContent('category');
      return;
    }

    console.log('Selected slide type:', typeId);
    setIsModalOpen(false);
    // TODO: Handle the selected slide type (non-fullscreen)
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setModalContent('type');
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
        {modalContent === 'type' ? (
          <SlideTypeSelector
            onSelectType={handleSelectType}
            onCancel={handleCancelModal}
          />
        ) : (
          <CategorySelector
            onSelectCategory={(catId) => {
              console.log('Selected category:', catId);
              // TODO: create slide with selected category
              setIsModalOpen(false);
              setModalContent('type');
            }}
            onBack={() => setModalContent('type')}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default SlidesPage;
