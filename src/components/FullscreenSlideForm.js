import React, { useState } from 'react';
import '../styles/FullscreenSlideForm.css';

const FullscreenSlideForm = ({ category, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    startDate: '',
    archiveDate: '',
    devices: ['all-devices'],
  });

  const [preview, setPreview] = useState(null);
  const [orientation, setOrientation] = useState('landscape');
  const [viewMode, setViewMode] = useState('web');

  const categoryLabels = {
    news: 'News',
    official: 'Official News',
    events: 'Events',
    emergency: 'Emergency',
    always: 'Always On',
  };

  const categoryName = typeof category === 'object'
    ? category?.title || category?.name || 'Unknown'
    : (categoryLabels[category] || category || 'Unknown');

  const priorities = [
    { id: 'low', label: 'Low', duration: '15s' },
    { id: 'medium', label: 'Medium', duration: '30s' },
    { id: 'high', label: 'High', duration: '45s' },
  ];

  const devices = [
    { id: 'all-devices', label: 'All Devices' },
    { id: 'totem-1', label: 'Totem 1' },
    { id: 'indoor-1', label: 'Indoor Display 1' },
  ];

  const handleTitleChange = (e) => setFormData({ ...formData, title: e.target.value });
  const handlePriorityChange = (priority) => setFormData({ ...formData, priority });
  const handleDateChange = (field, value) => setFormData({ ...formData, [field]: value });

  const handleDeviceToggle = (deviceId) => {
    let updated = [...formData.devices];
    if (deviceId === 'all-devices') {
      updated = updated.includes('all-devices') ? [] : ['all-devices'];
    } else if (updated.includes(deviceId)) {
      updated = updated.filter((id) => id !== deviceId);
    } else {
      updated = [deviceId].filter((id) => id !== 'all-devices');
    }
    setFormData({ ...formData, devices: updated });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !preview) {
      alert('Please fill title and upload media');
      return;
    }
    onSubmit({
      ...formData,
      category,
      categoryName,
      contentPoolId: category?.id,
      preview,
      orientation,
      viewMode,
    });
  };

  return (
    <div className="fullscreen-slide-form">
      <h2 className="form-title">Create Fullscreen Slide</h2>

      <div className="category-badge">
        Category: <span className="badge-value">{categoryName}</span>
      </div>

      <div className="form-container">
        <div className="form-left">
          <div className="form-group">
            <label className="form-label">Slide Title *</label>
            <input type="text" className="form-input" placeholder="Enter slide title" value={formData.title} onChange={handleTitleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Media *</label>
            <div className="upload-area" onClick={() => document.getElementById('media-input').click()}>
              <div className="upload-icon">UP</div>
              <p className="upload-text">Click to upload or drag & drop</p>
            </div>
            <input id="media-input" type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <div className="priority-buttons">
              {priorities.map((p) => (
                <button key={p.id} className={`priority-btn priority-${p.id} ${formData.priority === p.id ? 'active' : ''}`} onClick={() => handlePriorityChange(p.id)}>
                  {p.label} <span className="duration">{p.duration}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="date-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="text" className="form-input date-input" placeholder="mm/dd/yyyy" value={formData.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Archive Date</label>
              <input type="text" className="form-input date-input" placeholder="mm/dd/yyyy" value={formData.archiveDate} onChange={(e) => handleDateChange('archiveDate', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Devices</label>
            <div className="device-list">
              {devices.map((device) => (
                <label key={device.id} className="device-checkbox">
                  <input type="checkbox" checked={formData.devices.includes(device.id)} onChange={() => handleDeviceToggle(device.id)} />
                  <span>{device.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-right">
          <div className="preview-section">
            <div className="view-mode-toggles">
              <button className={`view-mode-btn ${viewMode === 'web' ? 'active' : ''}`} onClick={() => setViewMode('web')}>Web View</button>
              <button className={`view-mode-btn ${viewMode === 'totem' ? 'active' : ''}`} onClick={() => setViewMode('totem')}>Totem View</button>
            </div>

            <div className="preview-tabs">
              <button className={`preview-tab ${orientation === 'landscape' ? 'active' : ''}`} onClick={() => setOrientation('landscape')}>Landscape</button>
              <button className={`preview-tab ${orientation === 'portrait' ? 'active' : ''}`} onClick={() => setOrientation('portrait')}>Portrait</button>
            </div>

            <div className={`preview-container ${orientation} ${viewMode}`}>
              {preview ? (
                <div className="preview-media-wrapper">
                  {preview.startsWith('data:video') ? (
                    <video src={preview} className="preview-fit-media" controls />
                  ) : (
                    <img src={preview} alt="Preview" className="preview-fit-media" />
                  )}
                </div>
              ) : (
                <div className="preview-placeholder">
                  <p>{viewMode === 'web' ? 'Web View' : 'Totem View'}</p>
                  <p className="placeholder-text">{orientation.toUpperCase()}</p>
                </div>
              )}
            </div>

            <div className="note-section">
              <span>Note: Slide will be added to </span>
              <span className="note-category">{categoryName}</span>
              <span> pool</span>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-submit" onClick={handleSubmit}>Create Slide</button>
      </div>
    </div>
  );
};

export default FullscreenSlideForm;
