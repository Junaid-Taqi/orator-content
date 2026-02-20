import React, { useState } from 'react';
import '../styles/SlidesPage.css';
import StatsCard from './StatsCard';
import Modal from './Modal';
import SlideTypeSelector from './SlideTypeSelector';
import CategorySelector from './CategorySelector';
import FullscreenSlideForm from './FullscreenSlideForm';
import TemplateSlideForm from './TemplateSlideForm';

const SlidesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('type'); // 'type' | 'category' | 'form'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSlideType, setSelectedSlideType] = useState(null);

  const handleAddSlide = () => {
    setModalContent('type');
    setIsModalOpen(true);
  };

  const handleSelectType = (typeId) => {
    if (typeId === 'fullscreen' || typeId === 'template') {
      setSelectedSlideType(typeId);
      // switch to category selector while keeping modal open
      setModalContent('category');
      return;
    }
    setIsModalOpen(false);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setModalContent('type');
    setSelectedSlideType(null);
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
        ) : modalContent === 'category' ? (
          <CategorySelector
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              setModalContent('form');
            }}
            onBack={() => {
              setModalContent('type');
              setSelectedCategory(null);
              setSelectedSlideType(null);
            }}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedCategory(null);
              setSelectedSlideType(null);
            }}
          />
        ) : modalContent === 'form' && selectedSlideType === 'template' ? (
          <TemplateSlideForm
            category={selectedCategory}
            onCancel={handleCancelModal}
            onSubmit={(slideData) => {
              console.log('Creating template slide:', slideData);
              // TODO: Handle slide creation
              setIsModalOpen(false);
              setModalContent('type');
              setSelectedCategory(null);
              setSelectedSlideType(null);
            }}
          />
        ) : (
          <FullscreenSlideForm
            category={selectedCategory}
            onCancel={handleCancelModal}
            onSubmit={(slideData) => {
              console.log('Creating slide:', slideData);
              // TODO: Handle slide creation
              setIsModalOpen(false);
              setModalContent('type');
              setSelectedCategory(null);
              setSelectedSlideType(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default SlidesPage;
