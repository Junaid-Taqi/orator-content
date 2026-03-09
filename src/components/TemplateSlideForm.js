import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toBlob } from 'html-to-image';
import '../styles/FullscreenSlideForm.css';
import '../styles/TemplateSlideForm.css';
import { serverUrl } from '../Services/Constants/Constants';
import TemplateDocumentView from './TemplateDocumentView';

const TAG_OPTIONS = [
    '\uD83C\uDFE5 Health',
    '\u26BD Sport',
    '\u26BD Football',
    '\uD83C\uDFC0 Basketball',
    '\uD83C\uDFBE Tennis',
    '\uD83C\uDFCA Swimming',
    '\uD83D\uDE97 Traffic',
    '\uD83C\uDFD7\uFE0F Infrastructure',
    '\uD83C\uDFD8\uFE0F Communal',
    '\uD83C\uDF33 Environment',
    '\uD83D\uDC76 Child Care',
    '\uD83D\uDC65 Social',
    '\uD83C\uDF0D International',
    '\uD83C\uDF93 Education',
    '\uD83C\uDFAD Culture',
    '\uD83D\uDEA8 Safety',
    '\uD83C\uDFE0 Housing',
    '\uD83D\uDCBC Economy',
];

const TemplateSlideForm = ({ category, user, onCancel, onSubmit, submitting = false, submitError = '' }) => {
    const VARCHAR_200_MAX = 200;
    const VARCHAR_300_MAX = 300;
    const VARCHAR_600_MAX = 600;
    const TEXT_MAX = 65535;
    const durationMap = {
        low: 15,
        medium: 30,
        high: 45,
    };
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
        publish: true,
        eventEnabled: false,
        eventMode: 1, // 1: single, 2: range, 3: multiple
        eventStartDate: '',
        eventEndDate: '',
        eventDates: [''],
        tags: [],
        coverImageFile: null,
    });
    const [devices, setDevices] = useState([{ id: 'all-devices', label: 'All Devices' }]);
    const [devicesStatus, setDevicesStatus] = useState('idle');
    const [devicesError, setDevicesError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [coverImageError, setCoverImageError] = useState('');
    const [viewMode, setViewMode] = useState('web');
    const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

    const captureRef = useRef(null);
    const coverImageInputRef = useRef(null);
    const categoryName = category?.title || category?.name;
    const categoryColor = category?.color;

    const priorities = [
        { id: 'low', label: 'Low', duration: '15s' },
        { id: 'medium', label: 'Medium', duration: '30s' },
        { id: 'high', label: 'High', duration: '45s' },
    ];
    const safeTrim = (value) => String(value ?? '').trim();

    useEffect(() => {
        if (!formData.coverImageFile) {
            setCoverPreviewUrl('');
            return;
        }

        const nextUrl = URL.createObjectURL(formData.coverImageFile);
        setCoverPreviewUrl(nextUrl);

        return () => {
            URL.revokeObjectURL(nextUrl);
        };
    }, [formData.coverImageFile]);

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

    const handleChange = (field, value) => {
        setValidationError('');
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleTagToggle = (tag) => {
        setValidationError('');
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...prev.tags, tag],
        }));
    };

    const handleCoverImageFileChange = (file) => {
        if (!file) {
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png'];
        const maxBytes = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            setCoverImageError('Only JPG and PNG files are allowed.');
            return;
        }
        if (file.size > maxBytes) {
            setCoverImageError('Cover image must be 5MB or smaller.');
            return;
        }

        setCoverImageError('');
        setValidationError('');
        setFormData((prev) => ({
            ...prev,
            coverImageFile: file,
        }));
    };

    const handleDeviceToggle = (deviceId) => {
        setValidationError('');
        const selectableDeviceIds = devices.filter((d) => d.id !== 'all-devices').map((d) => d.id);
        let updated = [...formData.devices];
        if (deviceId === 'all-devices') {
            updated = updated.includes('all-devices') ? [] : ['all-devices'];
        } else if (updated.includes('all-devices')) {
            // If all devices were selected, unchecking one keeps every other device selected.
            updated = selectableDeviceIds.filter((id) => id !== deviceId);
        } else if (updated.includes(deviceId)) {
            updated = updated.filter((id) => id !== deviceId);
            if (!updated.length) {
                updated = ['all-devices'];
            }
        } else {
            updated = updated.filter((id) => id !== 'all-devices');
            updated.push(deviceId);
        }
        setFormData((prev) => ({ ...prev, devices: updated }));
    };

    const handleEventEnabledChange = (checked) => {
        setValidationError('');
        setFormData((prev) => ({
            ...prev,
            eventEnabled: checked,
            eventMode: checked ? prev.eventMode : 1,
        }));
    };

    const handleEventModeChange = (mode) => {
        setValidationError('');
        setFormData((prev) => ({
            ...prev,
            eventMode: mode,
            eventStartDate: mode === 3 ? '' : prev.eventStartDate,
            eventEndDate: mode === 2 ? prev.eventEndDate : '',
            eventDates: mode === 3 ? (prev.eventDates.length ? prev.eventDates : ['']) : [''],
        }));
    };

    const handleEventDateChange = (index, value) => {
        setValidationError('');
        const updatedDates = [...formData.eventDates];
        updatedDates[index] = value;
        setFormData((prev) => ({ ...prev, eventDates: updatedDates }));
    };

    const handleAddEventDate = () => {
        setValidationError('');
        setFormData((prev) => ({ ...prev, eventDates: [...prev.eventDates, ''] }));
    };

    const handleRemoveEventDate = (index) => {
        setValidationError('');
        const updatedDates = formData.eventDates.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, eventDates: updatedDates.length ? updatedDates : [''] }));
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

        const safeName = safeTrim(formData.title || 'template-slide')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'template-slide';

        return new File([blob], `${safeName}.png`, { type: 'image/png' });
    };

    const handleSubmit = async () => {
        if (!safeTrim(formData.title)) {
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
        if (formData.eventEnabled) {
            if (formData.eventMode === 1 && !formData.eventStartDate) {
                setValidationError('Event single date is required.');
                return;
            }
            if (formData.eventMode === 2) {
                if (!formData.eventStartDate || !formData.eventEndDate) {
                    setValidationError('Event start and end dates are required for date range.');
                    return;
                }
                if (formData.eventEndDate < formData.eventStartDate) {
                    setValidationError('Event end date must be greater than or equal to event start date.');
                    return;
                }
            }
            if (formData.eventMode === 3) {
                const validEventDates = formData.eventDates.map((d) => safeTrim(d)).filter(Boolean);
                if (!validEventDates.length) {
                    setValidationError('At least one event date is required for multiple dates mode.');
                    return;
                }
            }
        }

        try {
            setValidationError('');
            const normalizedEventDates = formData.eventDates.map((d) => safeTrim(d)).filter(Boolean);
            const renderedTemplateFile = await createTemplateImageFile();
            const parsedConfig = (() => {
                try {
                    return safeTrim(formData.configJSON) ? JSON.parse(safeTrim(formData.configJSON)) : {};
                } catch (e) {
                    return {};
                }
            })();
            const configJSON = JSON.stringify({
                ...(parsedConfig && typeof parsedConfig === 'object' && !Array.isArray(parsedConfig) ? parsedConfig : {}),
                tags: formData.tags,
            });
            onSubmit({
                ...formData,
                title: safeTrim(formData.title),
                subtitle: safeTrim(formData.subtitle),
                webDescription: safeTrim(formData.webDescription),
                totemDescription: safeTrim(formData.totemDescription),
                articleUrl: safeTrim(formData.articleUrl),
                linkUrl: safeTrim(formData.linkUrl),
                configJSON,
                eventDates: normalizedEventDates,
                durationSeconds: durationMap[formData.priority] ?? 30,
                category,
                categoryName,
                contentPoolId: category?.id,
                renderedTemplateFile,
                coverImageFile: formData.coverImageFile,
                availableDevices: devices.filter((d) => d.id !== 'all-devices'),
            });
        } catch (error) {
            setValidationError(error.message || 'Unable to generate template image.');
        }
    };

    const activeDescription = viewMode === 'web' ? formData.webDescription : formData.totemDescription;
    const formatPreviewDate = (value) => {
        if (!value) return '-';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const isDeviceChecked = (deviceId) => {
        if (deviceId === 'all-devices') {
            return formData.devices.includes('all-devices');
        }
        return formData.devices.includes('all-devices') || formData.devices.includes(deviceId);
    };

    return (
        <div className="fullscreen-slide-form template-slide-form">
            <h2 className="form-title">Create Template Slide</h2>

            <div className="category-badge">
                Category: <span className="badge-value">{categoryName}</span>
            </div>

            <div className="row m-0">
                <div className="col-md-6 col-12 mb-3">
                    <div className="form-group">
                        <label className="form-label">Slide Title *</label>
                        <input
                            type="text"
                            maxLength={75}
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
                            maxLength={130}
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
                            maxLength={TEXT_MAX}
                            placeholder="Enter web description"
                            value={formData.webDescription}
                            onChange={(e) => handleChange('webDescription', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Totem Description</label>
                        <textarea
                            className="form-input template-textarea"
                            maxLength={VARCHAR_600_MAX}
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
                                maxLength={VARCHAR_300_MAX}
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
                                maxLength={VARCHAR_300_MAX}
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

                    <div className="form-group template-cover-group">
                        <label className="form-label">Cover Image for Web Portal</label>
                        <small className="template-tags-tip">Used as thumbnail in citizen web portal news feed</small>

                        <div
                            className="template-cover-upload"
                            onClick={() => coverImageInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    coverImageInputRef.current?.click();
                                }
                            }}
                        >
                            <div className="template-cover-upload-icon">{'\uD83D\uDDBC\uFE0F'}</div>
                            <p>Upload Custom Image</p>
                            <small>JPG, PNG (max 5MB) - Recommended: 1200x630px</small>
                            {!!formData.coverImageFile && <small className="template-cover-file">{formData.coverImageFile.name}</small>}
                        </div>

                        <input
                            ref={coverImageInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            style={{ display: 'none' }}
                            onChange={(e) => handleCoverImageFileChange(e.target.files?.[0])}
                        />

                        {!!coverImageError && <p className="upload-text template-error">{coverImageError}</p>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags (Multi-Select)</label>
                        <div className="template-tags-list">
                            {TAG_OPTIONS.map((tag) => (
                                <label key={tag} className="template-tag-item">
                                    <input
                                        type="checkbox"
                                        checked={formData.tags.includes(tag)}
                                        onChange={() => handleTagToggle(tag)}
                                    />
                                    <span>{tag}</span>
                                </label>
                            ))}
                        </div>
                        <small className="template-tags-tip">Select all relevant categories for better organization</small>
                    </div>

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

                    <div className="form-group event-dates-group">
                        <label className="form-label">Event Date(s) (Optional)</label>
                        <label className="device-checkbox" style={{ marginBottom: '10px' }}>
                            <input
                                type="checkbox"
                                checked={formData.eventEnabled}
                                onChange={(e) => handleEventEnabledChange(e.target.checked)}
                            />
                            <span>Enable Event Dates</span>
                        </label>

                        {formData.eventEnabled && (
                            <div className="event-date-block">
                                <div className="preview-tabs" style={{ marginBottom: '12px' }}>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 1 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(1)}
                                    >
                                        Single Date
                                    </button>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 2 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(2)}
                                    >
                                        Date Range
                                    </button>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 3 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(3)}
                                    >
                                        Multiple Dates
                                    </button>
                                </div>

                                {formData.eventMode === 1 && (
                                    <input
                                        type="date"
                                        className="form-input date-input"
                                        value={formData.eventStartDate}
                                        onChange={(e) => handleChange('eventStartDate', e.target.value)}
                                    />
                                )}

                                {formData.eventMode === 2 && (
                                    <div className="date-row">
                                        <div className="form-group">
                                            <label className="form-label">Event Start Date</label>
                                            <input
                                                type="date"
                                                className="form-input date-input"
                                                value={formData.eventStartDate}
                                                onChange={(e) => handleChange('eventStartDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Event End Date</label>
                                            <input
                                                type="date"
                                                className="form-input date-input"
                                                value={formData.eventEndDate}
                                                onChange={(e) => handleChange('eventEndDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {formData.eventMode === 3 && (
                                    <div className="multi-event-dates">
                                        {formData.eventDates.map((date, index) => (
                                            <div key={`template-event-date-${index}`} className="multi-event-row">
                                                <input
                                                    type="date"
                                                    className="form-input date-input"
                                                    value={date}
                                                    onChange={(e) => handleEventDateChange(index, e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-cancel"
                                                    onClick={() => handleRemoveEventDate(index)}
                                                    disabled={formData.eventDates.length === 1}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn-submit" onClick={handleAddEventDate}>
                                            Add Date
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="device-checkbox">
                            <input
                                type="checkbox"
                                checked={formData.publish}
                                onChange={(e) => handleChange('publish', e.target.checked)}
                            />
                            <span>Publish</span>
                        </label>
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
                                        checked={isDeviceChecked(device.id)}
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

                <div className="col-md-6 col-12 mb-3">
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

                        {viewMode === 'web' ? (
                            <div className="template-web-preview-shell">
                                <div className="template-web-preview-main">
                                    <div className="template-web-preview-image-wrap">
                                        {coverPreviewUrl ? (
                                            <img src={coverPreviewUrl} alt="Cover preview" className="template-web-preview-image" />
                                        ) : (
                                            <div className="template-web-preview-placeholder">
                                                {(categoryName || 'N').slice(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="template-web-preview-content">
                                        <div className="template-web-preview-meta">
                                            <span className="badge category-badge">{categoryName || 'Updates'}</span>
                                            <span className="template-web-preview-meta-item">{'\uD83D\uDCC5'} {formatPreviewDate(new Date())}</span>
                                        </div>

                                        <h3 className="template-web-preview-title">{formData.title || 'Untitled'}</h3>
                                        {!!formData.subtitle && <p className="template-web-preview-subtitle">{formData.subtitle}</p>}

                                        {!!formData.tags.length && (
                                            <div className="template-web-preview-tags-row">
                                                <span className="template-web-preview-tag-icon">{'\uD83C\uDFF7'}</span>
                                                <div className="template-web-preview-tags">
                                                    {formData.tags.map((tag) => (
                                                        <span key={tag} className="template-web-preview-tag-chip">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="template-web-preview-description">{formData.webDescription || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
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
                                            categoryLabel={categoryName}
                                            categoryColor={categoryColor}
                                            viewMode={viewMode}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

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
                        categoryLabel={categoryName}
                        categoryColor={categoryColor}
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
