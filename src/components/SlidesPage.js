import React, { useState } from 'react';
import '../styles/SlidesPage.css';
import StatsCard from './StatsCard';
import Modal from './Modal';
import SlideTypeSelector from './SlideTypeSelector';
import CategorySelector from './CategorySelector';
import FullscreenSlideForm from './FullscreenSlideForm';
import TemplateSlideForm from './TemplateSlideForm';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFilter} from "@fortawesome/free-solid-svg-icons/faFilter";
import {faPlus} from "@fortawesome/free-solid-svg-icons/faPlus";

// Dummy Data for Cards
const initialSlides = [
  { id: 1, title: "Spring Festival 2026", category: "Events", priority: "High (45s)", status: "active", start: "2026-02-15", archive: "2026-04-30", icon: "🎉" },
  { id: 2, title: "Road Maintenance Alert", category: "Official News", priority: "Medium (30s)", status: "active", start: "2026-02-01", archive: "2026-03-15", icon: "🚧" },
  { id: 3, title: "Summer Campaign Banner", category: "News", priority: "Low (15s)", status: "archived", start: "2026-01-01", archive: "2026-02-10", icon: "☀️" },
];

const SlidesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('type');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSlideType, setSelectedSlideType] = useState(null);

  // New States for Filtering
  const [activeFilter, setActiveFilter] = useState('all');
  const [slides] = useState(initialSlides);

  const handleAddSlide = () => {
    setModalContent('type');
    setIsModalOpen(true);
  };

  const handleSelectType = (typeId) => {
    if (typeId === 'fullscreen' || typeId === 'template') {
      setSelectedSlideType(typeId);
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

  // Filter Logic
  const filteredSlides = slides.filter(slide =>
      activeFilter === 'all' ? true : slide.status === activeFilter
  );

  return (
      <div className="slides-page">
        <div className="slides-header">
          <div className="slides-title-section">
            <h2 className="slides-title">Slides</h2>
            <p className="slides-description">
              Category-driven templates. Priority determines duration: Low=15s, Medium=30s, High=45s
            </p>
          </div>
          <button className="btn btn-create" onClick={handleAddSlide}><FontAwesomeIcon icon={faPlus} style={{marginRight: '5px'}}/> Create Slides</button>
        </div>

        <div className="stats-grid">
          <StatsCard title="Total Slides" count="5" bgColor="primary" />
          <StatsCard title="Active" count="3" bgColor="success" />
          <StatsCard title="Scheduled" count="1" bgColor="warning" />
          <StatsCard title="Archived" count="1" bgColor="muted" />
        </div>

        {/* --- FILTERS SECTION --- */}
        <div className="filter-bar">
          <div className="filter-icon-box">
            <FontAwesomeIcon icon={faFilter} style={{color: "#00bcd4"}} />
          </div>
          {['all', 'active', 'scheduled', 'archived'].map((f) => (
              <button
                  key={f}
                  className={`filter-pill ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
          ))}
        </div>

        {/* --- SLIDES GRID --- */}
        <div className="slides-grid-container">
          {filteredSlides.map((slide) => (
              <div key={slide.id} className="slide-card-item">
                <div className="slide-card-visual">
                  <span className="visual-emoji">{slide.icon}</span>
                </div>
                <div className="slide-card-body">
                  <h3 className="slide-card-name">{slide.title}</h3>
                  <div className="slide-card-tags">
                    <span className="tag-cat">{slide.category}</span>
                    <span className={`tag-priority ${slide.priority.split(' ')[0].toLowerCase()}`}>{slide.priority}</span>
                    <span className={`tag-status ${slide.status}`}>{slide.status}</span>
                  </div>
                  <div className="slide-card-info">
                    <div className="info-row"><span>Start:</span> <span>{slide.start}</span></div>
                    <div className="info-row"><span>Archive:</span> <span>{slide.archive}</span></div>
                  </div>
                  <div className="slide-card-footer">
                    <button className="btn-preview-outline">👁 Preview</button>
                    <div className="footer-icons">
                      <button className="icon-btn-small">⚙️</button>
                      <button className="icon-btn-small">📄</button>
                      <button className="icon-btn-small delete">🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
          ))}
        </div>

        <Modal isOpen={isModalOpen} onClose={handleCancelModal}>
          {modalContent === 'type' ? (
              <SlideTypeSelector onSelectType={handleSelectType} onCancel={handleCancelModal} />
          ) : modalContent === 'category' ? (
              <CategorySelector
                  onSelectCategory={(catId) => { setSelectedCategory(catId); setModalContent('form'); }}
                  onBack={() => { setModalContent('type'); setSelectedCategory(null); setSelectedSlideType(null); }}
                  onCancel={handleCancelModal}
              />
          ) : modalContent === 'form' && selectedSlideType === 'template' ? (
              <TemplateSlideForm category={selectedCategory} onCancel={handleCancelModal} onSubmit={() => setIsModalOpen(false)} />
          ) : (
              <FullscreenSlideForm category={selectedCategory} onCancel={handleCancelModal} onSubmit={() => setIsModalOpen(false)} />
          )}
        </Modal>
      </div>
  );
};

export default SlidesPage;