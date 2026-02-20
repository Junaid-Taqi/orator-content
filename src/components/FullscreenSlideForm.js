import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/FullscreenSlideForm.css';
import { serverUrl } from '../Services/Constants/Constants';

const FullscreenSlideForm = ({ category, user, onCancel, onSubmit, submitting = false, submitError = '' }) => {
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    startDate: '',
    archiveDate: '',
    devices: ['all-devices'],
  });
  const [devices, setDevices] = useState([{ id: 'all-devices', label: 'All Devices' }]);
  const [devicesStatus, setDevicesStatus] = useState('idle');
  const [devicesError, setDevicesError] = useState('');

  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [viewMode, setViewMode] = useState('web');

  const categoryName = category?.title || category?.name;

  const priorities = [
    { id: 'low', label: 'Low', duration: '15s' },
    { id: 'medium', label: 'Medium', duration: '30s' },
    { id: 'high', label: 'High', duration: '45s' },
  ];

  useEffect(() => {
    const fetchDevices = async () => {
      const groupId = user?.groups?.[0]?.id;
      if (!groupId) {
        setDevicesError('Group not found for current user.');
        return;
      }

      setDevicesStatus('loading');
      setDevicesError('');
      try {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        };
        const payload = { groupId: String(groupId) };
        const response = await axios.post(
          `${serverUrl}/o/displayManagementApplication/getAllDisplays`,
          payload,
          config
        );

        if (!response.data?.success) {
          setDevicesStatus('failed');
          setDevicesError(response.data?.message || 'Unable to load devices.');
          return;
        }

        const mappedDevices = (response.data?.displays || []).map((display) => ({
          id: String(display.displayId),
          label: display.name,
          wakeTime: display.wakeTime,
          sleepTime: display.sleepTime,
        }));

        setDevices([{ id: 'all-devices', label: 'All Devices' }, ...mappedDevices]);
        setDevicesStatus('succeeded');
      } catch (error) {
        setDevicesStatus('failed');
        setDevicesError(error?.response?.data?.message || error.message || 'Unable to load devices.');
      }
    };

    fetchDevices();
  }, [user]);

  const handleTitleChange = (e) => {
    setValidationError('');
    setFormData({ ...formData, title: e.target.value });
  };
  const handlePriorityChange = (priority) => {
    setValidationError('');
    setFormData({ ...formData, priority });
  };
  const handleDateChange = (field, value) => {
    setValidationError('');
    setFormData({ ...formData, [field]: value });
  };

  const handleDeviceToggle = (deviceId) => {
    setValidationError('');
    let updated = [...formData.devices];
    if (deviceId === 'all-devices') {
      updated = updated.includes('all-devices') ? [] : ['all-devices'];
    } else if (updated.includes(deviceId)) {
      updated = updated.filter((id) => id !== deviceId);
      if (!updated.length) {
        updated = ['all-devices'];
      }
    } else {
      updated = updated.filter((id) => id !== 'all-devices');
      updated.push(deviceId);
    }
    setFormData({ ...formData, devices: updated });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setValidationError('');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      setValidationError('Slide title is required.');
      return;
    }
    if (!selectedFile) {
      setValidationError('Media file is required.');
      return;
    }
    if (!formData.startDate) {
      setValidationError('Start date is required.');
      return;
    }
    if (!formData.archiveDate) {
      setValidationError('Archive date is required.');
      return;
    }
    if (!formData.devices.length) {
      setValidationError('Please select at least one target device.');
      return;
    }

    setValidationError('');
    onSubmit({
      ...formData,
      file: selectedFile,
      category,
      categoryName,
      contentPoolId: category?.id,
      mediaName: selectedFile.name,
      availableDevices: devices.filter((d) => d.id !== 'all-devices'),
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
              <input type="date" className="form-input date-input" value={formData.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Archive Date</label>
              <input type="date" className="form-input date-input" value={formData.archiveDate} onChange={(e) => handleDateChange('archiveDate', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Target Devices</label>
            {devicesStatus === 'loading' && <p className="upload-text">Loading devices...</p>}
            {devicesStatus === 'failed' && <p className="upload-text">{devicesError}</p>}
            <div className="device-list">
              {devices.map((device) => (
                <label key={device.id} className="device-checkbox">
                  <input type="checkbox" checked={formData.devices.includes(device.id)} onChange={() => handleDeviceToggle(device.id)} />
                  <span>{device.label}</span>
                </label>
              ))}
            </div>
          </div>

          {!!validationError && <p className="upload-text" style={{ color: '#ff9aa2' }}>{validationError}</p>}
          {!validationError && !!submitError && <p className="upload-text" style={{ color: '#ff9aa2' }}>{submitError}</p>}
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
        <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Creating...' : 'Create Slide'}</button>
      </div>
    </div>
  );
};

export default FullscreenSlideForm;
