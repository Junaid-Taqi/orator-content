import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/SlidesPage.css';
import StatsCard from './StatsCard';
import Modal from './Modal';
import SlideTypeSelector from './SlideTypeSelector';
import CategorySelector from './CategorySelector';
import FullscreenSlideForm from './FullscreenSlideForm';
import TemplateSlideForm from './TemplateSlideForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { addNewFullScreenSlide } from '../Services/Slices/AddFullScreenSlideSlice';
import { getAllSlides } from '../Services/Slices/GetAllSlidesSlice';

const priorityMap = {
  low: 1,
  medium: 2,
  high: 3,
};

const durationMap = {
  low: 15,
  medium: 30,
  high: 45,
};

const formatDateOnly = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const parts = String(value).split(',');
  if (parts.length >= 2) {
    return `${parts[0].trim()}, ${parts[1].trim()}`;
  }
  return String(value);
};

const isVideoUrl = (url) => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(?:$|[/?#])/i.test(url);
};

const SlidesPage = ({ user }) => {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('type');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSlideType, setSelectedSlideType] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const { status: createSlideStatus, error: createSlideError } = useSelector((state) => state.AddFullScreenSlide);
  const { slides, counters, status: slidesStatus, error: slidesError } = useSelector((state) => state.GetAllSlides);

  const groupId = user?.groups?.[0]?.id;

  useEffect(() => {
    if (groupId) {
      dispatch(getAllSlides({ groupId: String(groupId) }));
    }
  }, [dispatch, groupId]);

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

  const handleCreateFullScreenSlide = async (slideData) => {
    const groupId = user?.groups?.[0]?.id;
    const userId = user?.userId;
    const contentPoolId = slideData?.contentPoolId;

    if (!groupId || !userId || !contentPoolId || !slideData?.file) {
      return;
    }

    const availableDevices = slideData.availableDevices || [];
    const selectedDevices = slideData.devices.includes('all-devices')
      ? availableDevices
      : availableDevices.filter((device) => slideData.devices.includes(device.id));

    const targetDevices = selectedDevices.map((device) => ({
      displayId: String(device.id),
      startTime: device.wakeTime,
      endTime: device.sleepTime,
      startDate: slideData.startDate,
      archiveDate: slideData.archiveDate,
    }));

    const payload = {
      groupId: String(groupId),
      userId: String(userId),
      contentPoolId: String(contentPoolId),
      title: slideData.title,
      priority: priorityMap[slideData.priority] || 2,
      durationSeconds: durationMap[slideData.priority] || 30,
      startDate: slideData.startDate,
      archiveDate: slideData.archiveDate,
      mediaName: slideData.mediaName || slideData.title,
      targetDevices,
      file: slideData.file,
    };

    const result = await dispatch(addNewFullScreenSlide(payload));
    if (addNewFullScreenSlide.fulfilled.match(result) && result.payload?.success) {
      setIsModalOpen(false);
      setModalContent('type');
      setSelectedSlideType(null);
      setSelectedCategory(null);
      dispatch(getAllSlides({ groupId: String(groupId) }));
    }
  };

  const normalizedSlides = useMemo(
    () => (slides || []).map((slide) => {
      const statusLabel = slide.status === 2 ? 'active' : slide.status === 1 ? 'scheduled' : 'archived';
      const priorityLabel = slide.priority === 3 ? 'High (45s)' : slide.priority === 1 ? 'Low (15s)' : 'Medium (30s)';
      return {
        id: slide.slideId,
        title: slide.title,
        category: slide.contentPoolName,
        priority: priorityLabel,
        status: statusLabel,
        start: formatDateOnly(slide.startDate),
        archive: formatDateOnly(slide.archiveDate),
        url: slide.url,
      };
    }),
    [slides]
  );

  const filteredSlides = normalizedSlides.filter((slide) =>
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
        <button className="btn btn-create" onClick={handleAddSlide}><FontAwesomeIcon icon={faPlus} style={{ marginRight: '5px' }} /> Create Slides</button>
      </div>

      <div className="stats-grid">
        <StatsCard title="Total Slides" count={String(counters?.totalSlides || 0)} bgColor="primary" />
        <StatsCard title="Active" count={String(counters?.active || 0)} bgColor="success" />
        <StatsCard title="Scheduled" count={String(counters?.scheduled || 0)} bgColor="warning" />
        <StatsCard title="Archived" count={String(counters?.archived || 0)} bgColor="muted" />
      </div>

      <div className="filter-bar">
        <div className="filter-icon-box">
          <FontAwesomeIcon icon={faFilter} style={{ color: '#00bcd4' }} />
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

      <div className="slides-grid-container">
        {slidesStatus === 'loading' && <p>Loading slides...</p>}
        {slidesStatus === 'failed' && <p>{slidesError || 'Unable to load slides.'}</p>}
        {slidesStatus === 'succeeded' && filteredSlides.length === 0 && <p>No slides found.</p>}
        {filteredSlides.map((slide) => (
          <div key={slide.id} className="slide-card-item">
            <div className="slide-card-visual">
              {slide.url ? (
                isVideoUrl(slide.url) ? (
                  <video src={slide.url} className="visual-emoji" muted playsInline preload="metadata" />
                ) : (
                  <img src={slide.url} alt={slide.title} className="visual-emoji" />
                )
              ) : (
                <span className="visual-emoji">SL</span>
              )}
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
                <button className="btn-preview-outline">Preview</button>
                <div className="footer-icons">
                  <button className="icon-btn-small">CFG</button>
                  <button className="icon-btn-small">DOC</button>
                  <button className="icon-btn-small delete">DEL</button>
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
            user={user}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setModalContent('form');
            }}
            onBack={() => {
              setModalContent('type');
              setSelectedCategory(null);
              setSelectedSlideType(null);
            }}
            onCancel={handleCancelModal}
          />
        ) : modalContent === 'form' && selectedSlideType === 'template' ? (
          <TemplateSlideForm category={selectedCategory} user={user} onCancel={handleCancelModal} onSubmit={() => setIsModalOpen(false)} />
        ) : (
          <FullscreenSlideForm
            category={selectedCategory}
            user={user}
            onCancel={handleCancelModal}
            onSubmit={handleCreateFullScreenSlide}
            submitting={createSlideStatus === 'loading'}
            submitError={createSlideStatus === 'failed' ? createSlideError : ''}
          />
        )}
      </Modal>
    </div>
  );
};

export default SlidesPage;
