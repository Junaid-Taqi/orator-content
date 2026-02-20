import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/FullscreenSlideForm.css';
import { serverUrl } from '../Services/Constants/Constants';

const TemplateSlideForm = ({ category, user, onCancel, onSubmit }) => {
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
          label: display.name || display.playerId || `Display ${display.displayId}`,
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

  const handleTitleChange = (e) => setFormData({ ...formData, title: e.target.value });
  const handlePriorityChange = (priority) => setFormData({ ...formData, priority });
  const handleDateChange = (field, value) => setFormData({ ...formData, [field]: value });

  const handleDeviceToggle = (deviceId) => {
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

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert('Please fill title and upload media');
      return;
    }
    onSubmit({ ...formData, category, categoryName, contentPoolId: category?.id });
  };

  return (
    <div className="fullscreen-slide-form">
      {/*<h2 className="form-title">Create Template Slide</h2>*/}

      {/*<div className="category-badge">*/}
      {/*  Category: <span className="badge-value">{categoryName}</span>*/}
      {/*</div>*/}

      {/*<div className="form-container">*/}
      {/*  <div className="form-left">*/}
      {/*    <div className="form-group">*/}
      {/*      <label className="form-label">Slide Title *</label>*/}
      {/*      <input type="text" className="form-input" placeholder="Enter slide title" value={formData.title} onChange={handleTitleChange} />*/}
      {/*    </div>*/}

      {/*    <div className="form-group">*/}
      {/*      <label className="form-label">Priority</label>*/}
      {/*      <div className="priority-buttons">*/}
      {/*        {priorities.map((p) => (*/}
      {/*          <button key={p.id} className={`priority-btn priority-${p.id} ${formData.priority === p.id ? 'active' : ''}`} onClick={() => handlePriorityChange(p.id)}>*/}
      {/*            {p.label} <span className="duration">{p.duration}</span>*/}
      {/*          </button>*/}
      {/*        ))}*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    <div className="date-row">*/}
      {/*      <div className="form-group">*/}
      {/*        <label className="form-label">Start Date</label>*/}
      {/*        <input type="text" className="form-input date-input" placeholder="mm/dd/yyyy" value={formData.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} />*/}
      {/*      </div>*/}
      {/*      <div className="form-group">*/}
      {/*        <label className="form-label">Archive Date</label>*/}
      {/*        <input type="text" className="form-input date-input" placeholder="mm/dd/yyyy" value={formData.archiveDate} onChange={(e) => handleDateChange('archiveDate', e.target.value)} />*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    <div className="form-group">*/}
      {/*      <label className="form-label">Target Devices</label>*/}
      {/*      {devicesStatus === 'loading' && <p className="upload-text">Loading devices...</p>}*/}
      {/*      {devicesStatus === 'failed' && <p className="upload-text">{devicesError}</p>}*/}
      {/*      <div className="device-list">*/}
      {/*        {devices.map((device) => (*/}
      {/*          <label key={device.id} className="device-checkbox">*/}
      {/*            <input type="checkbox" checked={formData.devices.includes(device.id)} onChange={() => handleDeviceToggle(device.id)} />*/}
      {/*            <span>{device.label}</span>*/}
      {/*          </label>*/}
      {/*        ))}*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}

      {/*<div className="form-actions">*/}
      {/*  <button className="btn-cancel" onClick={onCancel}>Cancel</button>*/}
      {/*  <button className="btn-submit" onClick={handleSubmit}>Create Slide</button>*/}
      {/*</div>*/}

      <h3>Coming Soon</h3>
    </div>
  );
};

export default TemplateSlideForm;
