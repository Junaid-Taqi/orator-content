import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/FullscreenSlideForm.css';
import { serverUrl } from '../Services/Constants/Constants';
import { useTranslation } from "../Services/Localization/Localization";

const FullscreenSlideForm = ({ category, user, onCancel, onSubmit, submitting = false, submitError = '' }) => {
    const { t } = useTranslation();
    const VARCHAR_300_MAX = 300;
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
        priority: 'medium',
        startDate: '',
        archiveDate: '',
        devices: ['all-devices'],
        publish: true,
        eventEnabled: false,
        eventMode: 1, // 1: single, 2: range, 3: multiple
        eventStartDate: '',
        eventEndDate: '',
        eventDates: [{ date: '', label: '' }],
    });
    const [devices, setDevices] = useState([{ id: 'all-devices', label: 'All Devices' }]);
    const [devicesStatus, setDevicesStatus] = useState('idle');
    const [devicesError, setDevicesError] = useState('');

    const [preview, setPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [multiEventError, setMultiEventError] = useState('');
    const [orientation, setOrientation] = useState('landscape');
    const [viewMode, setViewMode] = useState('web');

    const categoryName = category?.title || category?.name;

    const priorities = [
        { id: 'low', label: 'Low', duration: '15s' },
        { id: 'medium', label: 'Medium', duration: '30s' },
        { id: 'high', label: 'High', duration: '45s' },
    ];
    const safeTrim = (value) => String(value ?? '').trim();
    const createEmptyEventDate = () => ({ date: '', label: '' });
    const normalizeEventDateItems = (dates = []) => dates.map((item) => {
        if (typeof item === 'string') {
            return { date: item, label: '' };
        }
        if (item && typeof item === 'object') {
            return { date: item.date || '', label: item.label || '' };
        }
        return createEmptyEventDate();
    });
    const toInputDate = (date) => {
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const local = new Date(date.getTime() - offsetMs);
        return local.toISOString().split('T')[0];
    };

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

    useEffect(() => {
        setFormData((prev) => {
            const today = new Date();
            const startDate = prev.startDate || toInputDate(today);
            const archiveDate = prev.archiveDate || toInputDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000));
            if (prev.startDate && prev.archiveDate) {
                return prev;
            }
            return { ...prev, startDate, archiveDate };
        });
    }, []);

    const handleTitleChange = (e) => {
        setValidationError('');
        setFormData({ ...formData, title: e.target.value });
    };
    const handleFieldChange = (field, value) => {
        setValidationError('');
        setFormData({ ...formData, [field]: value });
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

    const handleEventEnabledChange = (checked) => {
        setValidationError('');
        setMultiEventError('');
        setFormData((prev) => ({
            ...prev,
            eventEnabled: checked,
            eventMode: checked ? prev.eventMode : 1,
        }));
    };

    const handleEventModeChange = (mode) => {
        setValidationError('');
        setMultiEventError('');
        setFormData((prev) => ({
            ...prev,
            eventMode: mode,
            eventStartDate: mode === 3 ? '' : prev.eventStartDate,
            eventEndDate: mode === 2 ? prev.eventEndDate : '',
            eventDates: mode === 3
                ? (prev.eventDates.length ? normalizeEventDateItems(prev.eventDates) : [createEmptyEventDate()])
                : [createEmptyEventDate()],
        }));
    };

    const handleEventDateChange = (index, field, value) => {
        setValidationError('');
        setMultiEventError('');
        setFormData((prev) => {
            const updatedDates = normalizeEventDateItems(prev.eventDates);
            updatedDates[index] = { ...updatedDates[index], [field]: value };
            return { ...prev, eventDates: updatedDates };
        });
    };

    const handleAddEventDate = () => {
        setValidationError('');
        setFormData((prev) => {
            const normalized = normalizeEventDateItems(prev.eventDates);
            const last = normalized[normalized.length - 1] || createEmptyEventDate();
            if (!safeTrim(last.date) || !safeTrim(last.label)) {
                setMultiEventError('Please enter both date and label before adding another event.');
                return prev;
            }
            if (normalized.length >= 8) {
                setMultiEventError('You can select up to 8 dates.');
                return prev;
            }
            setMultiEventError('');
            return { ...prev, eventDates: [...normalized, createEmptyEventDate()] };
        });
    };

    const handleRemoveEventDate = (index) => {
        setValidationError('');
        setMultiEventError('');
        const updatedDates = normalizeEventDateItems(formData.eventDates).filter((_, i) => i !== index);
        setFormData({ ...formData, eventDates: updatedDates.length ? updatedDates : [createEmptyEventDate()] });
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
        let normalizedEventDates = [];
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
                const normalizedDates = normalizeEventDateItems(formData.eventDates)
                    .map((d) => ({ date: safeTrim(d.date), label: safeTrim(d.label) }))
                    .filter((d) => d.date || d.label);
                if (!normalizedDates.length) {
                    setValidationError('At least one event date is required for multiple dates mode.');
                    return;
                }
                if (normalizedDates.some((d) => !d.date || !d.label)) {
                    setValidationError('Please enter a label for each event date.');
                    return;
                }
                if (normalizedDates.length > 8) {
                    setValidationError('You can select up to 8 dates.');
                    return;
                }
                normalizedEventDates = normalizedDates;
            }
        }

        setValidationError('');
        onSubmit({
            ...formData,
            title: formData.title.trim(),
            subtitle: formData.subtitle.trim(),
            webDescription: formData.webDescription.trim(),
            durationSeconds: durationMap[formData.priority] ?? 30,
            file: selectedFile,
            category,
            categoryName,
            contentPoolId: category?.id,
            mediaName: selectedFile.name,
            availableDevices: devices.filter((d) => d.id !== 'all-devices'),
            orientation,
            viewMode,
            eventDates: normalizedEventDates,
        });
    };

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
        <div className="fullscreen-slide-form">
            <h2 className="form-title">{t("createFullscreenSlide")}</h2>

            <div className="category-badge">
                {t("category")}: <span className="badge-value">{categoryName}</span>
            </div>

            <div className="form-container">
                <div className="form-left">
                    <div className="form-group">
                        <label className="form-label">{t("slideTitle")} *</label>
                        <input type="text" maxLength={75} className="form-input" placeholder={t("enterSlideTitle")} value={formData.title} onChange={handleTitleChange} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t("subTitle")}</label>
                        <input
                            type="text"
                            maxLength={130}
                            className="form-input"
                            placeholder={t("enterSubtitle")}
                            value={formData.subtitle}
                            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t("webDescription")}</label>
                        <textarea
                            className="form-input"
                            maxLength={TEXT_MAX}
                            placeholder={t("enterWebDescription")}
                            value={formData.webDescription}
                            onChange={(e) => handleFieldChange('webDescription', e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t("uploadMedia")} *</label>
                        <div className="upload-area" onClick={() => document.getElementById('media-input').click()}>
                            <div className="upload-icon">UP</div>
                            <p className="upload-text">{t("clickUpload")}</p>
                        </div>
                        <input id="media-input" type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t("priority")}</label>
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
                            <label className="form-label">{t("startDate")}</label>
                            <input type="date" className="form-input date-input" value={formData.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t("archiveDate")}</label>
                            <input type="date" className="form-input date-input" value={formData.archiveDate} onChange={(e) => handleDateChange('archiveDate', e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group event-dates-group">
                        <label className="form-label">{t("eventDatesOptional")}</label>
                        <label className="device-checkbox" style={{ marginBottom: '10px' }}>
                            <input
                                type="checkbox"
                                checked={formData.eventEnabled}
                                onChange={(e) => handleEventEnabledChange(e.target.checked)}
                            />
                            <span>{t("enableEventDates")}</span>
                        </label>

                        {formData.eventEnabled && (
                            <div className="event-date-block">
                                <div className="preview-tabs" style={{ marginBottom: '12px' }}>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 1 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(1)}
                                    >
                                        {t("singleDate")}
                                    </button>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 2 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(2)}
                                    >
                                        {t("dateRange")}
                                    </button>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 3 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(3)}
                                    >
                                        {t("multipleDates")}
                                    </button>
                                </div>

                                {formData.eventMode === 1 && (
                                    <input
                                        type="date"
                                        className="form-input date-input"
                                        value={formData.eventStartDate}
                                        onChange={(e) => handleFieldChange('eventStartDate', e.target.value)}
                                    />
                                )}

                                {formData.eventMode === 2 && (
                                    <div className="date-row">
                                        <div className="form-group">
                                            <label className="form-label">{t("eventStartDate")}</label>
                                            <input
                                                type="date"
                                                className="form-input date-input"
                                                value={formData.eventStartDate}
                                                onChange={(e) => handleFieldChange('eventStartDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t("eventEndDate")}</label>
                                            <input
                                                type="date"
                                                className="form-input date-input"
                                                value={formData.eventEndDate}
                                                onChange={(e) => handleFieldChange('eventEndDate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                        {formData.eventMode === 3 && (
                                            <div className="multi-event-dates">
                                                {formData.eventDates.map((eventDate, index) => (
                                                    <div key={`event-date-${index}`} className="multi-event-row">
                                                        <input
                                                            type="date"
                                                            className="form-input date-input"
                                                            value={eventDate.date}
                                                            onChange={(e) => handleEventDateChange(index, 'date', e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder={t("label")}
                                                            value={eventDate.label}
                                                            onChange={(e) => handleEventDateChange(index, 'label', e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-cancel"
                                                            onClick={() => handleRemoveEventDate(index)}
                                                            disabled={formData.eventDates.length === 1}
                                                        >
                                                            {t("remove")}
                                                        </button>
                                                    </div>
                                                ))}
                                                <div className="multi-event-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <button type="button" className="btn-submit" onClick={handleAddEventDate}>
                                                        {t("addDate")}
                                                    </button>
                                                    {!!multiEventError && (
                                                        <span className="template-error" style={{ color: '#ff9aa2', fontSize: '0.9rem' }}>
                                                            {multiEventError}
                                                        </span>
                                                    )}
                                                </div>
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
                                onChange={(e) => handleFieldChange('publish', e.target.checked)}
                            />
                            <span>{t("publish")}</span>
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t("targetDevices")}</label>
                        {devicesStatus === 'loading' && <p className="upload-text">{t("loadingDevices")}</p>}
                        {devicesStatus === 'failed' && <p className="upload-text">{devicesError}</p>}
                        <div className="device-list">
                            {devices.map((device) => (
                                <label key={device.id} className="device-checkbox">
                                    <input type="checkbox" checked={isDeviceChecked(device.id)} onChange={() => handleDeviceToggle(device.id)} />
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
                            <button className={`view-mode-btn ${viewMode === 'web' ? 'active' : ''}`} onClick={() => setViewMode('web')}>{t("webView")}</button>
                            <button className={`view-mode-btn ${viewMode === 'totem' ? 'active' : ''}`} onClick={() => setViewMode('totem')}>{t("totemView")}</button>
                        </div>

                        {viewMode === 'web' ? (
                            <div className="fullscreen-web-preview-shell">
                                <div className="fullscreen-web-preview-image-wrap">
                                    {preview ? (
                                        preview.startsWith('data:video') ? (
                                            <video src={preview} className="fullscreen-web-preview-image" controls muted />
                                        ) : (
                                            <img src={preview} alt="Preview" className="fullscreen-web-preview-image" />
                                        )
                                    ) : (
                                        <div className="fullscreen-web-preview-placeholder">
                                            {(categoryName || 'N').slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="fullscreen-web-preview-content">
                                    <div className="fullscreen-web-preview-meta">
                                        <span className="badge category-badge">{categoryName || 'Updates'}</span>
                                        <span className="fullscreen-web-preview-meta-item">{'\uD83D\uDCC5'} {formatPreviewDate(new Date())}</span>
                                    </div>

                                    <h3 className="fullscreen-web-preview-title">{formData.title || 'Untitled'}</h3>
                                    {!!formData.subtitle && <p className="fullscreen-web-preview-subtitle">{formData.subtitle}</p>}
                                    <p className="fullscreen-web-preview-description">{formData.webDescription || '-'}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="preview-tabs">
                                    <button className={`preview-tab ${orientation === 'landscape' ? 'active' : ''}`} onClick={() => setOrientation('landscape')}>{t("Landscape")}</button>
                                    <button className={`preview-tab ${orientation === 'portrait' ? 'active' : ''}`} onClick={() => setOrientation('portrait')}>{t("Portrait")}</button>
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
                                            <p>{t("totemView")}</p>
                                            <p className="placeholder-text">{orientation.toUpperCase()}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="note-section">
                            <span>{t("noteSlideAdded")} </span>
                            <span className="note-category">{categoryName}</span>
                            <span> {t("pool")}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button className="btn-cancel" onClick={onCancel}>{t("cancel")}</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>{submitting ? t("creating") : t("createSlide")}</button>
            </div>
        </div>
    );
};

export default FullscreenSlideForm;
