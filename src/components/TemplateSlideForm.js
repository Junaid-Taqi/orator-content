import React, {useEffect, useRef, useState} from 'react';
import axios from 'axios';
import {toBlob} from 'html-to-image';
import '../styles/FullscreenSlideForm.css';
import '../styles/TemplateSlideForm.css';
import {serverUrl} from '../Services/Constants/Constants';
import TemplateDocumentView from './TemplateDocumentView';

const TemplateSlideForm = ({category, user, onCancel, onSubmit, submitting = false, submitError = ''}) => {
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        webDescription: '',
        totemDescription: '',
        articleUrl: '',
        linkUrl: '',
        configJSON: '',
        priority: 'medium',
        startDate: '',
        archiveDate: '',
        devices: ['all-devices'],
    });
    const [devices, setDevices] = useState([{id: 'all-devices', label: 'All Devices'}]);
    const [devicesStatus, setDevicesStatus] = useState('idle');
    const [devicesError, setDevicesError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [viewMode, setViewMode] = useState('web');

    const captureRef = useRef(null);
    const categoryName = category?.title || category?.name;

    const priorities = [
        {id: 'low', label: 'Low', duration: '15s'},
        {id: 'medium', label: 'Medium', duration: '30s'},
        {id: 'high', label: 'High', duration: '45s'},
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
                const payload = {groupId: String(groupId)};
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
                    wakeTime: display.wakeTime,
                    sleepTime: display.sleepTime,
                }));

                setDevices([{id: 'all-devices', label: 'All Devices'}, ...mappedDevices]);
                setDevicesStatus('succeeded');
            } catch (error) {
                setDevicesStatus('failed');
                setDevicesError(error?.response?.data?.message || error.message || 'Unable to load devices.');
            }
        };

        fetchDevices();
    }, [user]);

    const handleChange = (field, value) => {
        setValidationError('');
        setFormData((prev) => ({...prev, [field]: value}));
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
        setFormData((prev) => ({...prev, devices: updated}));
    };

    const createTemplateImageFile = async () => {
        if (!captureRef.current) {
            throw new Error('Template preview is not ready.');
        }

        const blob = await toBlob(captureRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#0f57a8',
        });

        if (!blob) {
            throw new Error('Unable to generate template image.');
        }

        const safeName = (formData.title || 'template-slide')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'template-slide';

        return new File([blob], `${safeName}.png`, {type: 'image/png'});
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setValidationError('Slide title is required.');
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

        try {
            setValidationError('');
            const renderedTemplateFile = await createTemplateImageFile();
            onSubmit({
                ...formData,
                category,
                categoryName,
                contentPoolId: category?.id,
                renderedTemplateFile,
                availableDevices: devices.filter((d) => d.id !== 'all-devices'),
            });
        } catch (error) {
            setValidationError(error.message || 'Unable to generate template image.');
        }
    };

    const activeDescription = viewMode === 'web' ? formData.webDescription : formData.totemDescription;

    return (
        <div className="fullscreen-slide-form template-slide-form">
            <h2 className="form-title">Create Template Slide</h2>

            <div className="category-badge">
                Category: <span className="badge-value">{categoryName}</span>
            </div>

            <div className="form-container">
                <div className="form-left">
                    <div className="form-group">
                        <label className="form-label">Slide Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter slide title"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Sub Title</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter sub title"
                            value={formData.subtitle}
                            onChange={(e) => handleChange('subtitle', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Web Description</label>
                        <textarea
                            className="form-input template-textarea"
                            placeholder="Enter web description"
                            value={formData.webDescription}
                            onChange={(e) => handleChange('webDescription', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Totem Description</label>
                        <textarea
                            className="form-input template-textarea"
                            placeholder="Enter totem description"
                            value={formData.totemDescription}
                            onChange={(e) => handleChange('totemDescription', e.target.value)}
                        />
                    </div>

                    <div className="form-group template-inline-grid">
                        <div>
                            <label className="form-label">Article URL</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="https://example.com/article"
                                value={formData.articleUrl}
                                onChange={(e) => handleChange('articleUrl', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="form-label">Link URL / Footer Text</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="SCAN FOR MORE INFORMATION"
                                value={formData.linkUrl}
                                onChange={(e) => handleChange('linkUrl', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* <div className="form-group">
                        <label className="form-label">Config JSON (optional)</label>
                        <textarea
                            className="form-input template-textarea"
                            placeholder='{"theme":"default"}'
                            value={formData.configJSON}
                            onChange={(e) => handleChange('configJSON', e.target.value)}
                        />
                    </div> */}

                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <div className="priority-buttons">
                            {priorities.map((p) => (
                                <button
                                    type="button"
                                    key={p.id}
                                    className={`priority-btn priority-${p.id} ${formData.priority === p.id ? 'active' : ''}`}
                                    onClick={() => handleChange('priority', p.id)}
                                >
                                    {p.label} <span className="duration">{p.duration}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="date-row">
                        <div className="form-group">
                            <label className="form-label">Start Date *</label>
                            <input
                                type="date"
                                className="form-input date-input"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Archive Date *</label>
                            <input
                                type="date"
                                className="form-input date-input"
                                value={formData.archiveDate}
                                onChange={(e) => handleChange('archiveDate', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Target Devices</label>
                        {devicesStatus === 'loading' && <p className="upload-text">Loading devices...</p>}
                        {devicesStatus === 'failed' && <p className="upload-text">{devicesError}</p>}
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

                    {!!validationError && <p className="upload-text template-error">{validationError}</p>}
                    {!validationError && !!submitError && <p className="upload-text template-error">{submitError}</p>}
                </div>

                <div className="form-right">
                    <div className="preview-section">
                        <div className="view-mode-toggles">
                            <button
                                type="button"
                                className={`view-mode-btn ${viewMode === 'web' ? 'active' : ''}`}
                                onClick={() => setViewMode('web')}
                            >
                                Web View
                            </button>
                            <button
                                type="button"
                                className={`view-mode-btn ${viewMode === 'totem' ? 'active' : ''}`}
                                onClick={() => setViewMode('totem')}
                            >
                                Totem View
                            </button>
                        </div>

                        <div className={`preview-container portrait ${viewMode}`}>
                            <div className="template-preview-viewport">
                                <div className="template-preview-scale">
                                <TemplateDocumentView
                                    title={formData.title}
                                    subtitle={formData.subtitle}
                                    description={activeDescription}
                                    startDate={formData.startDate}
                                    archiveDate={formData.archiveDate}
                                    linkUrl={formData.linkUrl}
                                    viewMode={viewMode}
                                />
                                </div>
                            </div>
                        </div>

                        <div className="note-section">
                            <span>Note: Slide will be added to </span>
                            <span className="note-category">{categoryName}</span>
                            <span> pool as a rendered template image.</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="template-render-host" aria-hidden="true">
                <div ref={captureRef}>
                    <TemplateDocumentView
                        title={formData.title}
                        subtitle={formData.subtitle}
                        description={activeDescription}
                        startDate={formData.startDate}
                        archiveDate={formData.archiveDate}
                        linkUrl={formData.linkUrl}
                        viewMode={viewMode}
                    />
                </div>
            </div>

            <div className="form-actions">
                <button className="btn-cancel" onClick={onCancel} type="button">Cancel</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting} type="button">
                    {submitting ? 'Creating...' : 'Create Slide'}
                </button>
            </div>
        </div>
    );
};

export default TemplateSlideForm;
