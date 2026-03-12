import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/SlidesPage.css';
import StatsCard from './StatsCard';
import Modal from './Modal';
import SlideTypeSelector from './SlideTypeSelector';
import CategorySelector from './CategorySelector';
import FullscreenSlideForm from './FullscreenSlideForm';
import TemplateSlideForm from './TemplateSlideForm';
import TemplateDocumentView from './TemplateDocumentView';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { addNewFullScreenSlide } from '../Services/Slices/AddFullScreenSlideSlice';
import { addNewTemplateSlide } from '../Services/Slices/AddTemplateSlideSlice';
import { getAllSlides } from '../Services/Slices/GetAllSlidesSlice';
import { archiveSlideByUser } from '../Services/Slices/ArchiveSlideByUserSlice';
import { deleteSlideByUser } from '../Services/Slices/DeleteSlideByUserSlice';
import { editFullScreenSlide } from '../Services/Slices/EditFullScreenSlideSlice';
import { editTemplateSlide } from '../Services/Slices/EditTemplateSlideSlice';
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons/faTrashAlt";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faBoxArchive, faEye } from "@fortawesome/free-solid-svg-icons";
import { serverUrl } from '../Services/Constants/Constants';

const priorityMap = {
    high: 1,
    medium: 2,
    low: 3,
};

const durationMap = {
    low: 15,
    medium: 30,
    high: 45,
};

const normalizePriorityKey = (priority) => {
    if (priority === 'high' || priority === 'medium' || priority === 'low') {
        return priority;
    }
    if (priority === 1 || priority === '1') return 'high';
    if (priority === 2 || priority === '2') return 'medium';
    if (priority === 3 || priority === '3') return 'low';
    return 'medium';
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

const toInputDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }
    const asString = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
        return asString;
    }
    return '';
};

const parseEventDates = (value) => {
    if (!value) return [''];
    if (Array.isArray(value)) {
        const valid = value.map((d) => String(d || '').trim()).filter(Boolean);
        return valid.length ? valid : [''];
    }
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            const valid = parsed.map((d) => String(d || '').trim()).filter(Boolean);
            return valid.length ? valid : [''];
        }
    } catch (e) {
        // ignore and fallback
    }
    return [''];
};

const parseConfigJson = (value) => {
    if (!value) return {};
    if (typeof value === 'object') return value;
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
        return {};
    }
};

const VARCHAR_200_MAX = 200;
const VARCHAR_300_MAX = 300;
const VARCHAR_600_MAX = 600;
const TEXT_MAX = 65535;

const SlidesPage = ({ user }) => {
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('type');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSlideType, setSelectedSlideType] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [slideToDelete, setSlideToDelete] = useState(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [slideToArchive, setSlideToArchive] = useState(null);
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
    const [selectedSlide, setSelectedSlide] = useState(null);
    const [visibleCount, setVisibleCount] = useState(12);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [slideToEdit, setSlideToEdit] = useState(null);
    const [editValidationError, setEditValidationError] = useState('');
    const [previewMode, setPreviewMode] = useState('web');
    const [editForm, setEditForm] = useState({
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
        publish: true,
        eventEnabled: false,
        eventMode: 1,
        eventStartDate: '',
        eventEndDate: '',
        eventDates: [''],
    });

    const { status: createFullscreenStatus, error: createFullscreenError } = useSelector((state) => state.AddFullScreenSlide);
    const { status: createTemplateStatus, error: createTemplateError } = useSelector((state) => state.AddTemplateSlide);
    const { slides, counters, status: slidesStatus, error: slidesError } = useSelector((state) => state.GetAllSlides);
    const { status: archiveStatus } = useSelector((state) => state.ArchiveSlideByUser);
    const { status: deleteStatus } = useSelector((state) => state.DeleteSlideByUser);
    const { status: editFullscreenStatus, error: editFullscreenError } = useSelector((state) => state.EditFullScreenSlide);
    const { status: editTemplateStatus, error: editTemplateError } = useSelector((state) => state.EditTemplateSlide);

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

    const handleDeleteClick = (slide) => {
        setSlideToDelete(slide);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!slideToDelete) return;

        const currentGroupId = user?.groups?.[0]?.id;
        const userId = user?.userId;
        if (!currentGroupId || !userId) return;

        const result = await dispatch(deleteSlideByUser({
            groupId: String(currentGroupId),
            userId: String(userId),
            slideId: String(slideToDelete.id),
        }));

        if (deleteSlideByUser.fulfilled.match(result) && result.payload?.success) {
            dispatch(getAllSlides({ groupId: String(currentGroupId) }));
        }

        setIsDeleteModalOpen(false);
        setSlideToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setSlideToDelete(null);
    };

    const handleArchiveClick = (slide) => {
        setSlideToArchive(slide);
        setIsArchiveModalOpen(true);
    };

    const handleConfirmArchive = async () => {
        if (!slideToArchive) return;

        const currentGroupId = user?.groups?.[0]?.id;
        const userId = user?.userId;
        if (!currentGroupId || !userId) return;

        const result = await dispatch(archiveSlideByUser({
            groupId: String(currentGroupId),
            userId: String(userId),
            slideId: String(slideToArchive.id),
        }));

        if (archiveSlideByUser.fulfilled.match(result) && result.payload?.success) {
            await dispatch(getAllSlides({ groupId: String(currentGroupId) }));
        }

        setIsArchiveModalOpen(false);
        setSlideToArchive(null);
    };

    const handleCancelArchive = () => {
        setIsArchiveModalOpen(false);
        setSlideToArchive(null);
    };



    const handlePreviewClick = (slide) => {
        setSelectedSlide(slide);
        setPreviewMode('web'); // default web view
        setIsPreviewModalOpen(true);
    };

    const handleClosePreview = () => {
        setIsPreviewModalOpen(false);
        setSelectedSlide(null);
    };

    const handleEditClick = (slide) => {
        setEditValidationError('');
        setSlideToEdit(slide);
        const normalizedPriority = normalizePriorityKey(slide.priorityRaw);
        setEditForm({
            title: slide.title || '',
            subtitle: slide.subtitle || '',
            webDescription: slide.webDescription || '',
            totemDescription: slide.totemDescription || '',
            articleUrl: slide.articleUrl || '',
            linkUrl: slide.linkUrl || '',
            configJSON: slide.configJSON || '',
            priority: normalizedPriority,
            startDate: toInputDate(slide.startDateRaw),
            archiveDate: toInputDate(slide.archiveDateRaw),
            publish: slide.publish !== false,
            eventEnabled: Boolean(slide.eventEnabled),
            eventMode: Number(slide.eventMode || 1),
            eventStartDate: toInputDate(slide.eventStartDate),
            eventEndDate: toInputDate(slide.eventEndDate),
            eventDates: parseEventDates(slide.eventDatesJson),
        });
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setSlideToEdit(null);
        setEditValidationError('');
    };

    const handleEditFieldChange = (field, value) => {
        setEditValidationError('');
        setEditForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleEditEventModeChange = (mode) => {
        setEditValidationError('');
        setEditForm((prev) => ({
            ...prev,
            eventMode: mode,
            eventStartDate: mode === 3 ? '' : prev.eventStartDate,
            eventEndDate: mode === 2 ? prev.eventEndDate : '',
            eventDates: mode === 3 ? (prev.eventDates.length ? prev.eventDates : ['']) : [''],
        }));
    };

    const handleEditEventDateChange = (index, value) => {
        const updated = [...editForm.eventDates];
        updated[index] = value;
        handleEditFieldChange('eventDates', updated);
    };

    const handleAddEditEventDate = () => {
        handleEditFieldChange('eventDates', [...editForm.eventDates, '']);
    };

    const handleRemoveEditEventDate = (index) => {
        const updated = editForm.eventDates.filter((_, i) => i !== index);
        handleEditFieldChange('eventDates', updated.length ? updated : ['']);
    };

    const handleSaveEdit = async () => {
        if (!slideToEdit) return;
        if (!editForm.title.trim()) {
            setEditValidationError('Slide title is required.');
            return;
        }
        if (!editForm.startDate || !editForm.archiveDate) {
            setEditValidationError('Start date and archive date are required.');
            return;
        }
        if (editForm.archiveDate < editForm.startDate) {
            setEditValidationError('Archive date must be greater than or equal to start date.');
            return;
        }
        if (editForm.eventEnabled) {
            if (editForm.eventMode === 1 && !editForm.eventStartDate) {
                setEditValidationError('Event single date is required.');
                return;
            }
            if (editForm.eventMode === 2) {
                if (!editForm.eventStartDate || !editForm.eventEndDate) {
                    setEditValidationError('Event start and end dates are required for date range.');
                    return;
                }
                if (editForm.eventEndDate < editForm.eventStartDate) {
                    setEditValidationError('Event end date must be greater than or equal to event start date.');
                    return;
                }
            }
            if (editForm.eventMode === 3) {
                const validEventDates = editForm.eventDates.map((d) => d.trim()).filter(Boolean);
                if (!validEventDates.length) {
                    setEditValidationError('At least one event date is required for multiple dates mode.');
                    return;
                }
            }
        }

        const currentGroupId = user?.groups?.[0]?.id;
        const userId = user?.userId;
        if (!currentGroupId || !userId || !slideToEdit?.id) {
            return;
        }

        const priority = priorityMap[normalizePriorityKey(editForm.priority)] || 2;
        const durationSeconds = durationMap[normalizePriorityKey(editForm.priority)] || 30;
        const normalizedEventDates = editForm.eventDates.map((d) => d.trim()).filter(Boolean);

        const basePayload = {
            groupId: String(currentGroupId),
            userId: String(userId),
            slideId: String(slideToEdit.id),
            title: editForm.title.trim(),
            subtitle: (editForm.subtitle || '').trim(),
            webDescription: (editForm.webDescription || '').trim(),
            priority,
            durationSeconds,
            startDate: editForm.startDate,
            archiveDate: editForm.archiveDate,
            publish: editForm.publish !== false,
            eventEnabled: Boolean(editForm.eventEnabled),
            eventMode: editForm.eventEnabled ? Number(editForm.eventMode || 1) : 0,
            eventStartDate: editForm.eventEnabled ? (editForm.eventStartDate || '') : '',
            eventEndDate: editForm.eventEnabled ? (editForm.eventEndDate || '') : '',
            eventDates: editForm.eventEnabled ? normalizedEventDates : [],
        };

        let result;
        if (slideToEdit.slideType === 2) {
            result = await dispatch(editTemplateSlide({
                ...basePayload,
                articleUrl: (editForm.articleUrl || '').trim(),
                totemDescription: (editForm.totemDescription || '').trim(),
                linkUrl: (editForm.linkUrl || '').trim(),
                configJSON: (editForm.configJSON || '').trim(),
            }));
            if (editTemplateSlide.fulfilled.match(result) && result.payload?.success) {
                setIsEditModalOpen(false);
                setSlideToEdit(null);
                setEditValidationError('');
                dispatch(getAllSlides({ groupId: String(currentGroupId) }));
            }
            return;
        }

        result = await dispatch(editFullScreenSlide(basePayload));
        if (editFullScreenSlide.fulfilled.match(result) && result.payload?.success) {
            setIsEditModalOpen(false);
            setSlideToEdit(null);
            setEditValidationError('');
            dispatch(getAllSlides({ groupId: String(currentGroupId) }));
        }
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
            subtitle: slideData.subtitle || '',
            webDescription: slideData.webDescription || '',
            priority: priorityMap[normalizePriorityKey(slideData.priority)] || 2,
            durationSeconds: slideData.durationSeconds || durationMap[normalizePriorityKey(slideData.priority)] || 30,
            startDate: slideData.startDate,
            archiveDate: slideData.archiveDate,
            mediaName: slideData.mediaName || slideData.title,
            publish: slideData.publish !== false,
            eventEnabled: Boolean(slideData.eventEnabled),
            eventMode: slideData.eventEnabled ? Number(slideData.eventMode || 1) : 0,
            eventStartDate: slideData.eventEnabled ? (slideData.eventStartDate || '') : '',
            eventEndDate: slideData.eventEnabled ? (slideData.eventEndDate || '') : '',
            eventDates: slideData.eventEnabled ? (slideData.eventDates || []) : [],
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

    const handleCreateTemplateSlide = async (slideData) => {
        const currentGroupId = user?.groups?.[0]?.id;
        const userId = user?.userId;
        const contentPoolId = slideData?.contentPoolId;

        if (!currentGroupId || !userId || !contentPoolId || !slideData?.renderedTemplateFile) {
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
            groupId: String(currentGroupId),
            userId: String(userId),
            contentPoolId: String(contentPoolId),
            title: slideData.title,
            subtitle: slideData.subtitle,
            articleUrl: slideData.articleUrl,
            webDescription: slideData.webDescription,
            totemDescription: slideData.totemDescription,
            linkUrl: slideData.linkUrl,
            configJSON: slideData.configJSON,
            priority: priorityMap[normalizePriorityKey(slideData.priority)] || 2,
            durationSeconds: slideData.durationSeconds || durationMap[normalizePriorityKey(slideData.priority)] || 30,
            startDate: slideData.startDate,
            archiveDate: slideData.archiveDate,
            publish: slideData.publish !== false,
            eventEnabled: Boolean(slideData.eventEnabled),
            eventMode: slideData.eventEnabled ? Number(slideData.eventMode || 1) : 0,
            eventStartDate: slideData.eventEnabled ? (slideData.eventStartDate || '') : '',
            eventEndDate: slideData.eventEnabled ? (slideData.eventEndDate || '') : '',
            eventDates: slideData.eventEnabled ? (slideData.eventDates || []) : [],
            targetDevices,
            renderedTemplateFile: slideData.renderedTemplateFile,
            coverImageFile: slideData.coverImageFile || null,
        };

        const result = await dispatch(addNewTemplateSlide(payload));
        if (addNewTemplateSlide.fulfilled.match(result) && result.payload?.success) {
            setIsModalOpen(false);
            setModalContent('type');
            setSelectedSlideType(null);
            setSelectedCategory(null);
            dispatch(getAllSlides({ groupId: String(currentGroupId) }));
        }
    };

    const normalizedSlides = useMemo(
        () => (slides || []).map((slide) => {
            const statusLabel = slide.status === 2 ? 'active' : slide.status === 1 ? 'scheduled' : 'archived';
            const priorityLabel = slide.priority === 1 ? 'High (45s)' : slide.priority === 3 ? 'Low (15s)' : 'Medium (30s)';
            const displayNames = (slide.displays || [])
                .map((d) => d?.displayName)
                .filter(Boolean);
            return {
                id: slide.slideId,
                title: slide.title,
                category: slide.contentPoolName,
                categoryColor: slide.color || '',
                priority: priorityLabel,
                priorityRaw: slide.priority,
                status: statusLabel,
                start: formatDateOnly(slide.startDate),
                archive: formatDateOnly(slide.archiveDate),
                slideType: slide.slideType,
                subtitle: slide.subtitle || '',
                webDescription: slide.webDescription || '',
                totemDescription: slide.totemDescription || '',
                articleUrl: slide.articleUrl || '',
                linkUrl: slide.linkUrl || '',
                configJSON: slide.configJSON || '',
                publish: typeof slide.publish === 'boolean' ? slide.publish : true,
                eventEnabled: Boolean(slide.eventEnabled),
                eventMode: Number(slide.eventMode || 1),
                eventStartDate: slide.eventStartDate || '',
                eventEndDate: slide.eventEndDate || '',
                eventDatesJson: slide.eventDatesJson || '',
                eventDates: parseEventDates(slide.eventDatesJson),
                startDateRaw: slide.startDate,
                archiveDateRaw: slide.archiveDate,
                publishDate: formatDateOnly(slide.publishDate),
                url: slide.url,
                fileURLCover: slide.fileURLCover || '',
                bgImage: Boolean(slide.bgImage),
                devicesText: displayNames.length ? displayNames.join(', ') : '-',
            };
        }),
        [slides]
    );

    const filteredSlides = normalizedSlides.filter((slide) =>
        activeFilter === 'all' ? true : slide.status === activeFilter
    );
    const selectedSlideConfig = useMemo(
        () => parseConfigJson(selectedSlide?.configJSON),
        [selectedSlide?.configJSON]
    );
    const selectedSlideTags = Array.isArray(selectedSlideConfig?.tags)
        ? selectedSlideConfig.tags.filter((tag) => typeof tag === 'string' && tag.trim())
        : [];
    const selectedSlideQrValue = selectedSlideConfig?.clientRefId;
    const qrValue = `${serverUrl}/#/news/${selectedSlideQrValue}`;

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
                {filteredSlides.slice(0, visibleCount).map((slide) => (
                    <div key={slide.id} className="slide-card-item">
                        {(() => {
                            const mediaUrl = slide.url || slide.fileURLCover;
                            return (
                                <div className="slide-card-visual">
                                    {mediaUrl ? (
                                        isVideoUrl(mediaUrl) ? (
                                            <video
                                                src={mediaUrl}
                                                className="visual-emoji"
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img
                                                src={mediaUrl}
                                                alt={slide.title}
                                                className="visual-emoji"
                                            />
                                        )
                                    ) : (
                                        <span className="visual-emoji">
                                            {(slide.title || "N").slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            );
                        })()}
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
                                <button className="btn-preview-outline" onClick={() => handlePreviewClick(slide)}><FontAwesomeIcon icon={faEye} style={{ marginRight: '5px' }} />Preview</button>
                                <div className="footer-icons">
                                    <button className="icon-btn-small" onClick={() => handleEditClick(slide)}><FontAwesomeIcon icon={faCog} /></button>
                                    {/* <button className="icon-btn-small" onClick={() => handleArchiveClick(slide)}><FontAwesomeIcon icon={faBoxArchive} /></button> */}
                                    <button className="icon-btn-small delete" onClick={() => handleDeleteClick(slide)}><FontAwesomeIcon icon={faTrashAlt} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {visibleCount < filteredSlides.length && (
                <div style={{ textAlign: 'center' }}>
                    <button
                        className="btn btn-outline-primary px-4 py-2 my-5 text-white"
                        onClick={() => setVisibleCount(prev => prev + 12)}
                        style={{ fontWeight: 500, borderRadius: '50rem', border: '1px solid' }}
                    >
                        Load More Slides
                    </button>
                </div>
            )}

            <Modal
                size="large"
                isOpen={isPreviewModalOpen}
                onClose={handleClosePreview}
            >
                {selectedSlide && (
                    <div className="preview-dialog">
                        <div className="preview-tabs">
                            <button
                                className={`tab ${previewMode === 'totem' ? 'active' : 'inactive'}`}
                                onClick={() => setPreviewMode('totem')}
                            >
                                Totem View
                            </button>

                            <button
                                className={`tab ${previewMode === 'web' ? 'active' : 'inactive'}`}
                                onClick={() => setPreviewMode('web')}
                            >
                                Web Portal View
                            </button>
                        </div>

                        {previewMode === 'web' ? (
                            <div className="preview-web-shell">
                                <div className="preview-web-main">
                                    <div className="preview-web-image-wrap">
                                        {selectedSlide.fileURLCover ? (
                                            <img
                                                src={selectedSlide.fileURLCover}
                                                alt={selectedSlide.title}
                                                className="preview-web-image"
                                            />
                                        ) : (
                                            <div className="preview-web-image-placeholder">
                                                {(selectedSlide.category || 'N').slice(0, 1).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="preview-web-content">
                                        <div className="preview-web-meta">
                                            <span className="tag-cat">{selectedSlide.category}</span>
                                            <span className="preview-web-meta-item">{'\uD83D\uDCC5'} {selectedSlide.publishDate || selectedSlide.start}</span>
                                        </div>

                                        <h2 className="preview-web-title text-capitalize">{selectedSlide.title}</h2>
                                        {!!selectedSlide.subtitle && <p className="preview-web-subtitle">{selectedSlide.subtitle}</p>}

                                        {!!selectedSlideTags.length && (
                                            <div className="preview-web-tags-row">
                                                <span className="preview-web-tag-icon">{'\uD83C\uDFF7'}</span>
                                                <div className="preview-web-tags">
                                                    {selectedSlideTags.map((tag) => (
                                                        <span key={tag} className="preview-web-tag-chip">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <p className="preview-web-description">{selectedSlide.webDescription || selectedSlide.subtitle || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="preview-top">
                                    <h2 className="preview-title text-capitalize">{selectedSlide.title}</h2>

                                    <div className="preview-tags">
                                        <span className="tag-cat">{selectedSlide.category}</span>
                                        <span className={`tag-priority ${selectedSlide.priority.split(' ')[0].toLowerCase()}`}>
                                            {selectedSlide.priority}
                                        </span>
                                        <span className={`tag-status ${selectedSlide.status}`}>
                                            {selectedSlide.status}
                                        </span>
                                    </div>
                                </div>

                                <div className={`preview-main-box totem-mode ${selectedSlide.slideType === 2 ? 'template-totem-preview' : ''}`}>
                                    {selectedSlide.slideType === 2 ? (
                                        <div className="template-preview-viewport">
                                            <div className="template-preview-scale">
                                                <TemplateDocumentView
                                                    title={selectedSlide.title}
                                                    subtitle={selectedSlide.subtitle}
                                                    description={selectedSlide.totemDescription}
                                                    startDate={selectedSlide.startDateRaw}
                                                    archiveDate={selectedSlide.archiveDateRaw}
                                                    eventEnabled={selectedSlide.eventEnabled}
                                                    eventMode={selectedSlide.eventMode}
                                                    eventStartDate={selectedSlide.eventStartDate}
                                                    eventEndDate={selectedSlide.eventEndDate}
                                                    eventDates={selectedSlide.eventDates}
                                                    linkUrl={selectedSlide.linkUrl}
                                                    qrValue={qrValue}
                                                    categoryLabel={selectedSlide.category}
                                                    categoryColor={selectedSlide.categoryColor}
                                                    groupId={groupId}
                                                    bgImageEnabled={Boolean(selectedSlide.bgImage)}
                                                    bgImageUrl={selectedSlide.fileURLCover}
                                                    viewMode="totem"
                                                />
                                            </div>
                                        </div>
                                    ) : selectedSlide.url ? (
                                        isVideoUrl(selectedSlide.url) ? (
                                            <video
                                                src={selectedSlide.url}
                                                autoPlay
                                                muted
                                                loop
                                                className="preview-media"
                                            />
                                        ) : (
                                            <img
                                                src={selectedSlide.url}
                                                alt={selectedSlide.title}
                                                className="preview-media"
                                            />
                                        )
                                    ) : (
                                        <div className="preview-placeholder">
                                            No Preview Available
                                        </div>
                                    )}
                                </div>

                                <div className="preview-info-grid">
                                    <div className="info-box">
                                        <label>Start Date</label>
                                        <div>{selectedSlide.start}</div>
                                    </div>

                                    <div className="info-box">
                                        <label>Archive Date</label>
                                        <div>{selectedSlide.archive}</div>
                                    </div>

                                    <div className="info-box full">
                                        <label>Devices</label>
                                        <div className='text-capitalize'>{selectedSlide.devicesText}</div>
                                    </div>
                                </div>
                            </>
                        )}

                        <button className="preview-close-btn" onClick={handleClosePreview}>
                            Close Preview
                        </button>
                    </div>
                )}
            </Modal>

            <Modal
                size="large"
                isOpen={isEditModalOpen}
                onClose={handleCancelEdit}
            >
                {slideToEdit && (
                    <div className="edit-slide-modal">
                        <h2 className="edit-modal-title">Edit Slide</h2>

                        <div className="edit-slide-info">
                            <strong>Editing:</strong> {slideToEdit.title}
                            <div className="edit-slide-meta">
                                Category: {slideToEdit.category} | Type: {slideToEdit.slideType === 2 ? 'template' : 'fullscreen'}
                            </div>
                        </div>

                        <div className="edit-grid">
                            <div className="form-group">
                                <label className="form-label">Slide Title *</label>
                                <input
                                    type="text"
                                    maxLength={75}
                                    className="form-input"
                                    value={editForm.title}
                                    onChange={(e) => handleEditFieldChange('title', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Sub Title</label>
                                <input
                                    type="text"
                                    maxLength={130}
                                    className="form-input"
                                    value={editForm.subtitle}
                                    onChange={(e) => handleEditFieldChange('subtitle', e.target.value)}
                                />
                            </div>

                            <div className="form-group edit-span-2">
                                <label className="form-label">Web Description</label>
                                <textarea
                                    className="form-input"
                                    maxLength={TEXT_MAX}
                                    rows={3}
                                    value={editForm.webDescription}
                                    onChange={(e) => handleEditFieldChange('webDescription', e.target.value)}
                                />
                            </div>

                            {slideToEdit.slideType === 2 && (
                                <>
                                    <div className="form-group edit-span-2">
                                        <label className="form-label">Totem Description</label>
                                        <textarea
                                            className="form-input"
                                            maxLength={460}
                                            rows={3}
                                            value={editForm.totemDescription}
                                            onChange={(e) => handleEditFieldChange('totemDescription', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Article URL</label>
                                        <input
                                            type="text"
                                            maxLength={VARCHAR_300_MAX}
                                            className="form-input"
                                            value={editForm.articleUrl}
                                            onChange={(e) => handleEditFieldChange('articleUrl', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Link URL</label>
                                        <input
                                            type="text"
                                            maxLength={VARCHAR_300_MAX}
                                            className="form-input"
                                            value={editForm.linkUrl}
                                            onChange={(e) => handleEditFieldChange('linkUrl', e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    className="form-input"
                                    value={editForm.priority}
                                    onChange={(e) => handleEditFieldChange('priority', e.target.value)}
                                >
                                    <option value="high">High (45s)</option>
                                    <option value="medium">Medium (30s)</option>
                                    <option value="low">Low (15s)</option>
                                </select>
                            </div>

                            <div className="form-group edit-checkbox-wrap">
                                <label className="device-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={editForm.publish}
                                        onChange={(e) => handleEditFieldChange('publish', e.target.checked)}
                                    />
                                    <span>Publish</span>
                                </label>
                            </div>

                            <div className="form-group edit-span-2">
                                <label className="device-checkbox" style={{ marginBottom: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={editForm.eventEnabled}
                                        onChange={(e) => handleEditFieldChange('eventEnabled', e.target.checked)}
                                    />
                                    <span>Enable Event Dates</span>
                                </label>

                                {editForm.eventEnabled && (
                                    <div className="event-date-block">
                                        <div className="preview-tabs" style={{ marginBottom: '12px' }}>
                                            <button type="button" className={`preview-tab ${editForm.eventMode === 1 ? 'active' : ''}`} onClick={() => handleEditEventModeChange(1)}>Single Date</button>
                                            <button type="button" className={`preview-tab ${editForm.eventMode === 2 ? 'active' : ''}`} onClick={() => handleEditEventModeChange(2)}>Date Range</button>
                                            <button type="button" className={`preview-tab ${editForm.eventMode === 3 ? 'active' : ''}`} onClick={() => handleEditEventModeChange(3)}>Multiple Dates</button>
                                        </div>

                                        {editForm.eventMode === 1 && (
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={editForm.eventStartDate}
                                                onChange={(e) => handleEditFieldChange('eventStartDate', e.target.value)}
                                            />
                                        )}

                                        {editForm.eventMode === 2 && (
                                            <div className="date-row">
                                                <div className="form-group">
                                                    <label className="form-label">Event Start Date</label>
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        value={editForm.eventStartDate}
                                                        onChange={(e) => handleEditFieldChange('eventStartDate', e.target.value)}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Event End Date</label>
                                                    <input
                                                        type="date"
                                                        className="form-input"
                                                        value={editForm.eventEndDate}
                                                        onChange={(e) => handleEditFieldChange('eventEndDate', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {editForm.eventMode === 3 && (
                                            <div className="multi-event-dates">
                                                {editForm.eventDates.map((date, index) => (
                                                    <div key={`edit-event-date-${index}`} className="multi-event-row">
                                                        <input
                                                            type="date"
                                                            className="form-input"
                                                            value={date}
                                                            onChange={(e) => handleEditEventDateChange(index, e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn-cancel"
                                                            onClick={() => handleRemoveEditEventDate(index)}
                                                            disabled={editForm.eventDates.length === 1}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                                <button type="button" className="btn-submit" onClick={handleAddEditEventDate}>
                                                    Add Date
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        {!!editValidationError && <p className="upload-text template-error">{editValidationError}</p>}
                        {!editValidationError && slideToEdit.slideType === 2 && !!editTemplateError && <p className="upload-text template-error">{editTemplateError}</p>}
                        {!editValidationError && slideToEdit.slideType !== 2 && !!editFullscreenError && <p className="upload-text template-error">{editFullscreenError}</p>}

                        <div className="edit-actions">
                            <button className="btn-cancel" onClick={handleCancelEdit} type="button">Cancel</button>
                            <button
                                className="btn-submit"
                                onClick={handleSaveEdit}
                                type="button"
                                disabled={editFullscreenStatus === 'loading' || editTemplateStatus === 'loading'}
                            >
                                {editFullscreenStatus === 'loading' || editTemplateStatus === 'loading' ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                size="small"
                isOpen={isArchiveModalOpen}
                onClose={handleCancelArchive}
            >
                <div className="delete-modal">
                    <div className="delete-icon">
                        <FontAwesomeIcon icon={faBoxArchive} />
                    </div>

                    <h2>Archive Slide?</h2>
                    <p>
                        This slide will be moved to archived status and won't be
                        displayed on any devices.
                    </p>

                    <div className="delete-modal-actions">
                        <button className="btn-cancel" onClick={handleCancelArchive}>
                            Cancel
                        </button>
                        <button className="btn-delete btn-archive" onClick={handleConfirmArchive} disabled={archiveStatus === 'loading'}>
                            {archiveStatus === 'loading' ? 'Archiving...' : 'Archive'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal size="small" isOpen={isDeleteModalOpen} onClose={handleCancelDelete} className="delete-modal-wrapper">
                <div className="delete-modal">
                    <div className="delete-icon">
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </div>

                    <h2>Delete Slide?</h2>
                    <p>
                        This action cannot be undone. The slide will be permanently deleted from the system.
                    </p>

                    <div className="delete-modal-actions">
                        <button className="btn-cancel" onClick={handleCancelDelete}>
                            Cancel
                        </button>
                        <button className="btn-delete" onClick={handleConfirmDelete} disabled={deleteStatus === 'loading'}>
                            {deleteStatus === 'loading' ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={handleCancelModal} closeOnOverlayClick={modalContent !== 'form'}>
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
                    <TemplateSlideForm
                        category={selectedCategory}
                        user={user}
                        onCancel={handleCancelModal}
                        onSubmit={handleCreateTemplateSlide}
                        submitting={createTemplateStatus === 'loading'}
                        submitError={createTemplateStatus === 'failed' ? createTemplateError : ''}
                    />
                ) : (
                    <FullscreenSlideForm
                        category={selectedCategory}
                        user={user}
                        onCancel={handleCancelModal}
                        onSubmit={handleCreateFullScreenSlide}
                        submitting={createFullscreenStatus === 'loading'}
                        submitError={createFullscreenStatus === 'failed' ? createFullscreenError : ''}
                    />
                )}
            </Modal>
        </div>
    );
};

export default SlidesPage;
