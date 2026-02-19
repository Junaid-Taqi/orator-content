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

  const categoryLabels = {
    news: 'News',
    official: 'Official News',
    events: 'Events',
    emergency: 'Emergency',
    always: 'Always On',
  };

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

  const handleTitleChange = (e) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handlePriorityChange = (priority) => {
    setFormData({ ...formData, priority });
  };

  const handleDateChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDeviceToggle = (deviceId) => {
    let updated = [...formData.devices];
    if (deviceId === 'all-devices') {
      // If clicking all-devices, toggle all
      if (updated.includes('all-devices')) {
        updated = [];
      } else {
        updated = ['all-devices'];
      }
    } else {
      // If clicking specific device
      if (updated.includes(deviceId)) {
        updated = updated.filter(id => id !== deviceId);
      } else {
        updated = [deviceId];
        // Remove all-devices if specific device selected
        updated = updated.filter(id => id !== 'all-devices');
      }
    }
    setFormData({ ...formData, devices: updated });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('Please enter a slide title');
      return;
    }
    if (!preview) {
      alert('Please upload media');
      return;
    }
    onSubmit({
      ...formData,
      category,
      preview,
    });
  };

  return (
    <div className="fullscreen-slide-form">
      <h2 className="form-title">Create Fullscreen Slide</h2>
      
      <div className="category-badge">
        Category: <span className="badge-value">{categoryLabels[category]}</span>
      </div>

      <div className="form-container">
        <div className="form-left">
          {/* Slide Title */}
          <div className="form-group">
            <label className="form-label">Slide Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter slide title"
              value={formData.title}
              onChange={handleTitleChange}
            />
          </div>

          {/* Media Upload */}
          <div className="form-group">
            <label className="form-label">Upload Media (Image or Video) *</label>
            <div className="upload-area" onClick={() => document.getElementById('media-input').click()}>
              <div className="upload-icon">🖼️</div>
              <p className="upload-text">Click to upload or drag & drop</p>
              <p className="upload-hint">Image: JPG, PNG, GIF (max 10MB)<br/>Video: MP4, WebM (max 50MB)</p>
            </div>
            <input
              id="media-input"
              type="file"
              accept="image/*,video/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority (determines duration)</label>
            <div className="priority-buttons">
              {priorities.map((p) => (
                <button
                  key={p.id}
                  className={`priority-btn priority-${p.id} ${formData.priority === p.id ? 'active' : ''}`}
                  onClick={() => handlePriorityChange(p.id)}
                >
                  {p.label}
                  <span className="duration">{p.duration}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="date-row">
            <div className="form-group">
              <label className="form-label">Start Date (optional)</label>
              <input
                type="text"
                className="form-input date-input"
                placeholder="mm/dd/yyyy"
                value={formData.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Archive Date</label>
              <input
                type="text"
                className="form-input date-input"
                placeholder="mm/dd/yyyy"
                value={formData.archiveDate}
                onChange={(e) => handleDateChange('archiveDate', e.target.value)}
              />
            </div>
          </div>

          {/* Target Devices */}
          <div className="form-group">
            <label className="form-label">Target Devices</label>
            <div className="device-list">
              {devices.map((device) => (
                <label key={device.id} className="device-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.devices.includes(device.id)}
                    onChange={() => handleDeviceToggle(device.id)}
                  />
                  <span>{device.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="form-right">
          <div className="preview-section">
            <div className="preview-tabs">
              <button className="preview-tab active">Landscape</button>
              <button className="preview-tab">Portrait</button>
            </div>
            <div className="preview-container">
              {preview ? (
                <div className="preview-media">
                  {preview.includes('image') ? (
                    <img src={preview} alt="Preview" className="preview-img" />
                  ) : (
                    <video src={preview} className="preview-vid" controls />
                  )}
                </div>
              ) : (
                <div className="preview-placeholder">
                  <p>Web View</p>
                  <p className="placeholder-text">Landscape Totem</p>
                </div>
              )}
            </div>
            <div className="note-section">
              <strong>Note:</strong> This slide will be added to the <span className="note-category">{categoryLabels[category]}</span> pool
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-submit" onClick={handleSubmit}>Create Slide</button>
      </div>
    </div>
  );
};

export default FullscreenSlideForm;
