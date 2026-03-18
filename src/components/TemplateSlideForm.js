import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toBlob } from 'html-to-image';
import '../styles/FullscreenSlideForm.css';
import '../styles/TemplateSlideForm.css';
import { serverUrl } from '../Services/Constants/Constants';
import TemplateDocumentView from './TemplateDocumentView';
import { useTranslation } from '../Services/Localization/Localization';

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
    const { t } = useTranslation();
    const VARCHAR_200_MAX = 200;
    const VARCHAR_300_MAX = 300;
    const VARCHAR_600_MAX = 600;
    const TEXT_MAX = 65535;
    const MAX_MULTIPLE_EVENT_DATES = 8;
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
        priority: 'low',
        durationSeconds: 15,
        startDate: '',
        archiveDate: '',
        devices: ['all-devices'],
        publish: true,
        eventEnabled: false,
        eventMode: 1, // 1: single, 2: range, 3: multiple
        eventStartDate: '',
        eventEndDate: '',
        eventDates: [{ date: '', label: '' }],
        tags: [],
        useCoverImageInTotem: false,
        coverImageFile: null,
    });
    const [devices, setDevices] = useState([{ id: 'all-devices', label: t('allDevices') }]);
    const [devicesStatus, setDevicesStatus] = useState('idle');
    const [devicesError, setDevicesError] = useState('');
    const [validationError, setValidationError] = useState('');
    const [multiEventError, setMultiEventError] = useState('');
    const [coverImageError, setCoverImageError] = useState('');
    const [viewMode, setViewMode] = useState('web');
    const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
    const [captureHideLogo, setCaptureHideLogo] = useState(false);
    const [clientRefId] = useState(() => {
        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

        // Prefix with "qr-code-scan-" for your QR code purpose
        return `qr-code-scan-${uuid}`;
    });

    const captureRef = useRef(null);
    const previewCaptureRef = useRef(null);
    const coverImageInputRef = useRef(null);
    const categoryName = category?.title || category?.name;
    const categoryColor = category?.color;
    const groupId = user?.groups?.[0]?.id;

    const priorities = [
        { id: 'low', label: 'Low' },
        { id: 'medium', label: 'Medium' },
        { id: 'high', label: 'High' },
    ];
    const durationOptions = [15, 30, 45];
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

    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

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
        setCoverPreviewUrl('');
        setFormData((prev) => ({
            ...prev,
            coverImageFile: file,
        }));
        readFileAsDataUrl(file)
            .then((result) => {
                if (typeof result === 'string') {
                    setCoverPreviewUrl(result);
                }
            })
            .catch(() => {
                setCoverPreviewUrl('');
            });
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
            if (normalized.length >= MAX_MULTIPLE_EVENT_DATES) {
                setMultiEventError(`You can select up to ${MAX_MULTIPLE_EVENT_DATES} dates.`);
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
        setFormData((prev) => ({ ...prev, eventDates: updatedDates.length ? updatedDates : [createEmptyEventDate()] }));
    };

    const waitForImageLoad = (src) => new Promise((resolve) => {
        if (!src) {
            resolve();
            return;
        }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
        if (img.complete) {
            resolve();
        }
    });

    const createTemplateImageFile = async () => {
        if (!captureRef.current) {
            throw new Error('Template preview is not ready.');
        }

        if (formData.useCoverImageInTotem && coverPreviewUrl) {
            await waitForImageLoad(coverPreviewUrl);
        }

        const captureOptions = {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#0f57a8',
            useCORS: true,
        };

        let blob = null;
        let lastError = null;
        try {
            blob = await toBlob(captureRef.current, captureOptions);
        } catch (error) {
            lastError = error;
            setCaptureHideLogo(true);
            await new Promise((resolve) => requestAnimationFrame(() => resolve()));
            try {
                blob = await toBlob(captureRef.current, captureOptions);
            } catch (retryError) {
                lastError = retryError;
                blob = null;
            }
        }

        if (!blob && previewCaptureRef.current) {
            try {
                blob = await toBlob(previewCaptureRef.current, captureOptions);
            } catch (fallbackError) {
                lastError = fallbackError;
                blob = null;
            }
        }

        if (!blob) {
            if (lastError) {
                console.error('Template image capture failed:', lastError);
            }
            throw new Error('Unable to generate template image.');
        }

        const safeName = safeTrim(formData.title || 'template-slide')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'template-slide';

        return new File([blob], `${safeName}.png`, { type: 'image/png' });
    };

    const handleSubmit = async () => {
        console.log("submit", formData);
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
                if (normalizedDates.length > MAX_MULTIPLE_EVENT_DATES) {
                    setValidationError(`You can select up to ${MAX_MULTIPLE_EVENT_DATES} dates.`);
                    return;
                }
                normalizedEventDates = normalizedDates;
            }
        }

        try {
            setValidationError('');
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
                clientRefId,
                useCoverImageInTotem: Boolean(formData.useCoverImageInTotem),
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
                durationSeconds: Number(formData.durationSeconds) || (durationMap[formData.priority] ?? 30),
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

    const activeDescription = formData.totemDescription;
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
    const qrValue = `${serverUrl}/#/news/${clientRefId}`;

    return (
        <div className="fullscreen-slide-form template-slide-form">
            <h2 className="form-title">{t('createTemplateSlide')}</h2>

            <div className="category-badge">
                {t('category')}: <span className="badge-value">{categoryName}</span>
            </div>

            <div className="row m-0">
                <div className="col-md-6 col-12 mb-3">
                    <div className="form-group">
                        <label className="form-label">{t('slideTitle')} *</label>
                        <input
                            type="text"
                            maxLength={75}
                            className="form-input"
                            placeholder={t('enterSlideTitle')}
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('SubTitle')}</label>
                        <input
                            type="text"
                            maxLength={130}
                            className="form-input"
                            placeholder={t('enterSubtitle')}
                            value={formData.subtitle}
                            onChange={(e) => handleChange('subtitle', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('webDescription')}</label>
                        <textarea
                            className="form-input template-textarea"
                            maxLength={TEXT_MAX}
                            placeholder={t('enterWebDescription')}
                            value={formData.webDescription}
                            onChange={(e) => handleChange('webDescription', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('totemDescription')}</label>
                        <textarea
                            className="form-input template-textarea"
                            maxLength={460}
                            placeholder={t('enterTotemDescription')}
                            value={formData.totemDescription}
                            onChange={(e) => handleChange('totemDescription', e.target.value)}
                        />
                    </div>

                    <div className="form-group template-inline-grid">
                        <div>
                            <label className="form-label">{t('articleURL')}</label>
                            <input
                                type="text"
                                maxLength={VARCHAR_300_MAX}
                                className="form-input"
                                placeholder={t('enterArticleUrl')}
                                value={formData.articleUrl}
                                onChange={(e) => handleChange('articleUrl', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="form-label">{t("footerText")}</label>
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

                    <div className="form-group template-cover-group">
                        <label className="form-label">{t("coverImageWebPortal")}</label>
                        <small className="template-tags-tip">{t("UsedThumbnail")}</small>

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
                            <p>{t("uploadCustomImage")}</p>
                            <small>{t("Recommended")}</small>
                            {!!formData.coverImageFile && <small className="template-cover-file">{formData.coverImageFile.name}</small>}
                        </div>

                        <label className="device-checkbox" style={{ marginTop: '12px' }}>
                            <input
                                type="checkbox"
                                checked={formData.useCoverImageInTotem}
                                onChange={(e) => handleChange('useCoverImageInTotem', e.target.checked)}
                                disabled={!formData.coverImageFile}
                            />
                            <span>{t("useAsTotemCover")}</span>
                        </label>

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
                        <label className="form-label">{t("tagsMultiSelect")}</label>
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
                        <small className="template-tags-tip">{t("selectAllRelevant")}</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('priority')}</label>
                        <div className="priority-buttons">
                            {priorities.map((p) => (
                                <button
                                    type="button"
                                    key={p.id}
                                    className={`priority-btn priority-${p.id} ${formData.priority === p.id ? 'active' : ''}`}
                                    onClick={() => handleChange('priority', p.id)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('duration')}</label>
                        <select
                            className="form-input"
                            value={formData.durationSeconds}
                            onChange={(e) => handleChange('durationSeconds', Number(e.target.value))}
                        >
                            {durationOptions.map((sec) => (
                                <option key={`duration-${sec}`} value={sec}>{`${sec}s`}</option>
                            ))}
                        </select>
                    </div>

                    <div className="date-row">
                        <div className="form-group">
                            <label className="form-label">{t('startDate')} *</label>
                            <input
                                type="date"
                                className="form-input date-input"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('archiveDate')} *</label>
                            <input
                                type="date"
                                className="form-input date-input"
                                value={formData.archiveDate}
                                onChange={(e) => handleChange('archiveDate', e.target.value)}
                            />
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
                                        {t('singleDate')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 2 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(2)}
                                    >
                                        {t('dateRange')}
                                    </button>
                                    <button
                                        type="button"
                                        className={`preview-tab ${formData.eventMode === 3 ? 'active' : ''}`}
                                        onClick={() => handleEventModeChange(3)}
                                    >
                                        {t('multipleDates')}
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
                                            <label className="form-label">{t("EventStartDate")}</label>
                                            <input
                                                type="date"
                                                className="form-input date-input"
                                                value={formData.eventStartDate}
                                                onChange={(e) => handleChange('eventStartDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t("EventEndDate")}</label>
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
                                        {formData.eventDates.map((eventDate, index) => (
                                            <div key={`template-event-date-${index}`} className="multi-event-row">
                                                <input
                                                    type="date"
                                                    className="form-input date-input"
                                                    value={eventDate.date}
                                                    onChange={(e) => handleEventDateChange(index, 'date', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder={t('label')}
                                                    value={eventDate.label}
                                                    onChange={(e) => handleEventDateChange(index, 'label', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-cancel"
                                                    onClick={() => handleRemoveEventDate(index)}
                                                    disabled={formData.eventDates.length === 1}
                                                >
                                                    {t('remove')}
                                                </button>
                                            </div>
                                        ))}
                                        <div className="multi-event-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                type="button"
                                                className="btn-submit"
                                                onClick={handleAddEventDate}
                                                disabled={formData.eventDates.length >= MAX_MULTIPLE_EVENT_DATES}
                                            >
                                                {t("AddDate")}
                                            </button>
                                            {!!multiEventError && (
                                                <span className="template-error" style={{ color: '#ff9aa2', fontSize: '0.9rem' }}>
                                                    {multiEventError}
                                                </span>
                                            )}
                                        </div>
                                        <small className="template-tags-tip">
                                            Maximum {MAX_MULTIPLE_EVENT_DATES} dates allowed.
                                        </small>
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
                                {t("webView")}
                            </button>
                            <button
                                type="button"
                                className={`view-mode-btn ${viewMode === 'totem' ? 'active' : ''}`}
                                onClick={() => setViewMode('totem')}
                            >
                                {t("totemView")}
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
                                <div className="template-preview-viewport" ref={previewCaptureRef}>
                                    <div className="template-preview-scale">
                                        <TemplateDocumentView
                                            title={formData.title}
                                            subtitle={formData.subtitle}
                                            description={activeDescription}
                                            startDate={formData.startDate}
                                            archiveDate={formData.archiveDate}
                                            eventEnabled={formData.eventEnabled}
                                            eventMode={formData.eventMode}
                                            eventStartDate={formData.eventStartDate}
                                            eventEndDate={formData.eventEndDate}
                                            eventDates={formData.eventDates}
                                            linkUrl={formData.linkUrl}
                                            qrValue={qrValue}
                                            categoryLabel={categoryName}
                                            categoryColor={categoryColor}
                                            groupId={groupId}
                                            bgImageEnabled={Boolean(coverPreviewUrl) && formData.useCoverImageInTotem}
                                            bgImageUrl={coverPreviewUrl}
                                            viewMode={viewMode}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="note-section">
                            <span>{t("NoteSlide")}</span>
                            <span className="note-category">{categoryName}</span>
                            <span> {t("poolAsRenderedImage")}</span>
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
                        eventEnabled={formData.eventEnabled}
                        eventMode={formData.eventMode}
                        eventStartDate={formData.eventStartDate}
                        eventEndDate={formData.eventEndDate}
                        eventDates={formData.eventDates}
                        linkUrl={formData.linkUrl}
                        qrValue={qrValue}
                        categoryLabel={categoryName}
                        categoryColor={categoryColor}
                        groupId={groupId}
                        bgImageEnabled={Boolean(coverPreviewUrl) && formData.useCoverImageInTotem}
                        bgImageUrl={coverPreviewUrl}
                        viewMode={viewMode}
                        hideLogo={captureHideLogo}
                    />
                </div>
            </div>

            <div className="form-actions">
                <button className="btn-cancel" onClick={onCancel} type="button">{t("cancel")}</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting} type="button">
                    {submitting ? t('submitting') : t('submit')}
                </button>
            </div>
        </div>
    );
};

export default TemplateSlideForm;
