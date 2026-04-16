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
import { t } from 'i18next';
import { useTranslation } from '../Services/Localization/Localization';

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

const safeTrim = (value) => String(value ?? '').trim();
const createEmptyEventDate = () => ({ date: '', label: '' });
const normalizeEventDateItems = (dates = []) => dates.map((item) => {
    if (typeof item === 'string') {
        return { date: safeTrim(item), label: '' };
    }
    if (item && typeof item === 'object') {
        return { date: safeTrim(item.date), label: safeTrim(item.label) };
    }
    return createEmptyEventDate();
});

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
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        const apiDateMatch = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})/);
        if (apiDateMatch) {
            const [, monthLabel, day, year] = apiDateMatch;
            const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                .indexOf(monthLabel);
            if (monthIndex >= 0) {
                return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
            }
        }
    }
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const parseEventDates = (value) => {
    const normalizeArray = (arr) => {
        const normalized = normalizeEventDateItems(arr).filter((d) => d.date || d.label);
        return normalized.length ? normalized : [createEmptyEventDate()];
    };

    if (!value) return [createEmptyEventDate()];
    if (Array.isArray(value)) {
        return normalizeArray(value);
    }
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return normalizeArray(parsed);
        }
    } catch (e) {
        // ignore and fallback
    }
    return [createEmptyEventDate()];
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
    const { t } = useTranslation();
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
        durationSeconds: 15,
        startDate: '',
        archiveDate: '',
        publish: true,
        eventEnabled: false,
        eventMode: 1,
        eventStartDate: '',
        eventEndDate: '',
        eventDates: [createEmptyEventDate()],
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

    const handleSubmitEditFullscreen = async (formData) => {
        if (!slideToEdit) return;
        const currentGroupId = user?.groups?.[0]?.id;
        const userId = user?.userId;
        if (!currentGroupId || !userId) return;

        const normalizeDateYMD = (v) => {
            if (!v) return undefined;
            const s = String(v).trim();
            if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return undefined;
            const parsed = new Date(s);
            if (Number.isNaN(parsed.getTime())) return undefined;
            const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
            const local = new Date(parsed.getTime() - offsetMs);
            return local.toISOString().split('T')[0]; // yyyy-MM-dd
        };

        const mappingByDisplayId = (slideToEdit.displays || []).reduce((acc, d) => {
            acc[String(d.displayId)] = d;
            return acc;
        }, {});

        const selectedDevices = formData.devices?.includes('all-devices')
            ? formData.availableDevices || []
            : (formData.availableDevices || []).filter((d) => formData.devices?.includes(d.id));

        const targetDevices = selectedDevices.map((device) => ({
            slideDisplayId: String(mappingByDisplayId[String(device.id)]?.slideDisplayId) || null,
            displayId: String(device.id),
            startTime: mappingByDisplayId[String(device.id)]?.startTime || device.wakeTime,
            endTime: mappingByDisplayId[String(device.id)]?.endTime || device.sleepTime,
            startDate: normalizeDateYMD(mappingByDisplayId[String(device.id)]?.startDate) || normalizeDateYMD(formData.startDate),
            archiveDate: normalizeDateYMD(mappingByDisplayId[String(device.id)]?.archiveDate) || normalizeDateYMD(formData.archiveDate),
            status: mappingByDisplayId[String(device.id)]?.status ?? 1,
        }));

        const payload = {
            groupId: String(currentGroupId),
            userId: String(userId),
            slideId: String(slideToEdit.id),
            title: formData.title,
            subtitle: formData.subtitle || '',
            webDescription: formData.webDescription || '',
            priority: priorityMap[normalizePriorityKey(formData.priority)] || 2,
            durationSeconds: Number(formData.durationSeconds) || durationMap[normalizePriorityKey(formData.priority)] || 30,
            startDate: formData.startDate,
            archiveDate: formData.archiveDate,
            publish: formData.publish !== false,
            eventEnabled: Boolean(formData.eventEnabled),
            eventMode: formData.eventEnabled ? Number(formData.eventMode || 1) : 0,
            eventStartDate: formData.eventEnabled ? (formData.eventStartDate || '') : '',
            eventEndDate: formData.eventEnabled ? (formData.eventEndDate || '') : '',
            eventDates: formData.eventEnabled ? (formData.eventDates || []) : [],
            targetDevices,
            file: formData.file || null,
            mediaId: slideToEdit.mediaId || 0,
            mediaName: formData.mediaName || formData.title,
        };

        const result = await dispatch(editFullScreenSlide(payload));
        if (editFullScreenSlide.fulfilled.match(result) && result.payload?.success) {
            setIsEditModalOpen(false);
            setSlideToEdit(null);
            dispatch(getAllSlides({ groupId: String(currentGroupId) }));
        } else if (result.payload?.message) {
            setEditValidationError(result.payload.message);
        }
    };

    const handleSubmitEditTemplate = async (formData) => {
        if (!slideToEdit) return;
        const currentGroupId = user?.groups?.[0]?.id;
        const userId = user?.userId;
        if (!currentGroupId || !userId) return;

        const normalizeDateYMD = (v) => {
            if (!v) return undefined;
            const s = String(v).trim();
            if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return undefined;
            const parsed = new Date(s);
            if (Number.isNaN(parsed.getTime())) return undefined;
            const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
            const local = new Date(parsed.getTime() - offsetMs);
            return local.toISOString().split('T')[0]; // yyyy-MM-dd
        };

        const mappingByDisplayId = (slideToEdit.displays || []).reduce((acc, d) => {
            acc[String(d.displayId)] = d;
            return acc;
        }, {});

        const selectedDevices = formData.devices?.includes('all-devices')
            ? formData.availableDevices || []
            : (formData.availableDevices || []).filter((d) => formData.devices?.includes(d.id));

        const targetDevices = selectedDevices.map((device) => ({
            slideDisplayId: String(mappingByDisplayId[String(device.id)]?.slideDisplayId) || null,
            displayId: String(device.id),
            startTime: mappingByDisplayId[String(device.id)]?.startTime || device.wakeTime,
            endTime: mappingByDisplayId[String(device.id)]?.endTime || device.sleepTime,
            startDate: formData.startDate,
            archiveDate: formData.archiveDate,
            status: mappingByDisplayId[String(device.id)]?.status ?? 1,
        }));

        const payload = {
            groupId: String(currentGroupId),
            userId: String(userId),
            slideId: String(slideToEdit.id),
            title: formData.title,
            subtitle: formData.subtitle || '',
            articleUrl: formData.articleUrl || '',
            webDescription: formData.webDescription || '',
            totemDescription: formData.totemDescription || '',
            linkUrl: formData.linkUrl || '',
            configJSON: formData.configJSON || '',
            priority: priorityMap[normalizePriorityKey(formData.priority)] || 2,
            durationSeconds: Number(formData.durationSeconds) || durationMap[normalizePriorityKey(formData.priority)] || 30,
            startDate: formData.startDate,
            archiveDate: formData.archiveDate,
            publish: formData.publish !== false,
            eventEnabled: Boolean(formData.eventEnabled),
            eventMode: formData.eventEnabled ? Number(formData.eventMode || 1) : 0,
            eventStartDate: formData.eventEnabled ? (formData.eventStartDate || '') : '',
            eventEndDate: formData.eventEnabled ? (formData.eventEndDate || '') : '',
            eventDates: formData.eventEnabled ? (formData.eventDates || []) : [],
            renderedTemplateFile: formData.renderedTemplateFile || null,
            coverImageFile: formData.coverImageFile || null,
            targetDevices,
        };

        const result = await dispatch(editTemplateSlide(payload));
        if (editTemplateSlide.fulfilled.match(result) && result.payload?.success) {
            setIsEditModalOpen(false);
            setSlideToEdit(null);
            dispatch(getAllSlides({ groupId: String(currentGroupId) }));
        } else if (result.payload?.message) {
            setEditValidationError(result.payload.message);
        }
    };

    const handleEditClick = (slide) => {
        setEditValidationError('');
        setSlideToEdit(slide);
        setIsEditModalOpen(true);
    };

    const handleCancelEdit = () => {
        setIsEditModalOpen(false);
        setSlideToEdit(null);
        setEditValidationError('');
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
            const priorityLabel = slide.priority === 1 ? 'High' : slide.priority === 3 ? 'Low' : 'Medium';
            const durationSeconds = slide.durationSeconds || durationMap[normalizePriorityKey(slide.priorityRaw)] || 30;
            const priorityDisplay = `${priorityLabel} (${durationSeconds}s)`;
            const displayNames = (slide.displays || [])
                .map((d) => d?.displayName)
                .filter(Boolean);
            return {
                id: slide.slideId,
                title: slide.title,
                category: slide.contentPoolName,
                categoryColor: slide.color || '',
                priority: priorityDisplay,
                priorityClass: priorityLabel.toLowerCase(),
                priorityRaw: slide.priority,
                mediaId: slide.mediaId,
                displays: slide.displays || [],
                contentPoolId: slide.contentPoolId,
                color: slide.color,
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
                durationSeconds,
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
                contentPoolAlwaysOn: Boolean(slide.contentPoolAlwaysOn),
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
    const selectedSlideUseCoverInTotem = selectedSlideConfig?.useCoverImageInTotem ?? Boolean(selectedSlide?.bgImage);
    const qrValue = `${serverUrl}/#/news/${selectedSlideQrValue}`;

    return (
        <div className="slides-page">
            <div className="slides-header">
                <div className="slides-title-section">
                    <h2 className="slides-title">{t('slides')}</h2>
                    <p className="slides-description">
                        {t('categoryTemplates')}
                    </p>
                </div>
                <button className="btn btn-create" onClick={handleAddSlide}><FontAwesomeIcon icon={faPlus} style={{ marginRight: '5px' }} /> {t('createSlide')}</button>
            </div>

            <div className="stats-grid">
                <StatsCard title={t('totalSlides')} count={String(counters?.totalSlides || 0)} bgColor="primary" />
                <StatsCard title={t('active')} count={String(counters?.active || 0)} bgColor="success" />
                <StatsCard title={t('scheduled')} count={String(counters?.scheduled || 0)} bgColor="warning" />
                <StatsCard title={t('archived')} count={String(counters?.archived || 0)} bgColor="muted" />
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
                        {t(`${f}`)}
                    </button>
                ))}
            </div>

            <div className="slides-grid-container">
                {slidesStatus === 'loading' && <p>{t('loadingSlides')}</p>}
                {slidesStatus === 'failed' && <p>{slidesError || 'Unable to load slides.'}</p>}
                {slidesStatus === 'succeeded' && filteredSlides.length === 0 && <p className='slides-description'>{t('noSlides')}</p>}
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
                                <span className={`tag-priority ${slide.priorityClass || ''}`}>{slide.priority}</span>
                                <span className={`tag-status ${slide.status}`}>{slide.status}</span>
                            </div>
                            <div className="slide-card-info">
                                <div className="info-row"><span>{t('start')}:</span> <span>{slide.start}</span></div>
                                <div className="info-row"><span>{t('archive')}:</span> <span>{slide.archive}</span></div>
                            </div>
                            <div className="slide-card-footer">
                                <button className="btn-preview-outline" onClick={() => handlePreviewClick(slide)}><FontAwesomeIcon icon={faEye} style={{ marginRight: '5px' }} />{t('preview')}</button>
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
                                {t('totemView')}
                            </button>

                            <button
                                className={`tab ${previewMode === 'web' ? 'active' : 'inactive'}`}
                                onClick={() => setPreviewMode('web')}
                            >
                                {t('webView')}
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
                                        <span className={`tag-priority ${selectedSlide.priorityClass || ''}`}>
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
                                                    bgImageEnabled={Boolean(selectedSlideUseCoverInTotem)}
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
                                            {t('noPreviewAvailable')}
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
                            {t('closePreview')}
                        </button>
                    </div>
                )}
            </Modal>

            <Modal
                size="large"
                isOpen={isEditModalOpen}
                onClose={handleCancelEdit}
            >
                {slideToEdit && slideToEdit.slideType === 1 && (
                    <FullscreenSlideForm
                        category={{
                            title: slideToEdit.category,
                            alwaysOn: slideToEdit.contentPoolAlwaysOn,
                            contentPoolId: slideToEdit.contentPoolId,
                        }}
                        user={user}
                        onCancel={handleCancelEdit}
                        onSubmit={handleSubmitEditFullscreen}
                        submitting={editFullscreenStatus === 'loading'}
                        submitError={editFullscreenError || editValidationError}
                        hideTargets={false}
                        initialValues={{
                            title: slideToEdit.title || '',
                            subtitle: slideToEdit.subtitle || '',
                            webDescription: slideToEdit.webDescription || '',
                            priority: normalizePriorityKey(slideToEdit.priorityRaw),
                            durationSeconds: slideToEdit.durationSeconds || durationMap[normalizePriorityKey(slideToEdit.priorityRaw)] || 30,
                            startDate: toInputDate(slideToEdit.startDateRaw),
                            archiveDate: toInputDate(slideToEdit.archiveDateRaw),
                            publish: slideToEdit.publish !== false,
                            eventEnabled: Boolean(slideToEdit.eventEnabled),
                            eventMode: Number(slideToEdit.eventMode || 1),
                            eventStartDate: toInputDate(slideToEdit.eventStartDate),
                            eventEndDate: toInputDate(slideToEdit.eventEndDate),
                            eventDates: parseEventDates(slideToEdit.eventDatesJson),
                            devices: (slideToEdit.displays || []).map((d) => String(d.displayId)),
                            mediaName: slideToEdit.title,
                            contentPoolAlwaysOn: Boolean(slideToEdit.contentPoolAlwaysOn),
                        }}
                        existingMediaUrl={slideToEdit.url}
                        requireFile={false}
                        mode="edit"
                    />
                )}
                {slideToEdit && slideToEdit.slideType === 2 && (
                    <TemplateSlideForm
                        category={{
                            title: slideToEdit.category,
                            alwaysOn: slideToEdit.contentPoolAlwaysOn,
                            contentPoolId: slideToEdit.contentPoolId,
                            color: slideToEdit.color,
                        }}
                        user={user}
                        onCancel={handleCancelEdit}
                        onSubmit={handleSubmitEditTemplate}
                        submitting={editTemplateStatus === 'loading'}
                        submitError={editTemplateError || editValidationError}
                        hideTargets={false}
                        initialValues={{
                            title: slideToEdit.title || '',
                            subtitle: slideToEdit.subtitle || '',
                            webDescription: slideToEdit.webDescription || '',
                            totemDescription: slideToEdit.totemDescription || '',
                            articleUrl: slideToEdit.articleUrl || '',
                            linkUrl: slideToEdit.linkUrl || '',
                            configJSON: slideToEdit.configJSON || '',
                            priority: normalizePriorityKey(slideToEdit.priorityRaw),
                            durationSeconds: slideToEdit.durationSeconds || durationMap[normalizePriorityKey(slideToEdit.priorityRaw)] || 30,
                            startDate: toInputDate(slideToEdit.startDateRaw),
                            archiveDate: toInputDate(slideToEdit.archiveDateRaw),
                            publish: slideToEdit.publish !== false,
                            eventEnabled: Boolean(slideToEdit.eventEnabled),
                            eventMode: Number(slideToEdit.eventMode || 1),
                            eventStartDate: toInputDate(slideToEdit.eventStartDate),
                            eventEndDate: toInputDate(slideToEdit.eventEndDate),
                            eventDates: parseEventDates(slideToEdit.eventDatesJson),
                            devices: (slideToEdit.displays || []).map((d) => String(d.displayId)),
                            contentPoolAlwaysOn: Boolean(slideToEdit.contentPoolAlwaysOn),
                        }}
                        existingCoverUrl={slideToEdit.fileURLCover}
                        mode="edit"
                    />
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

                    <h2>{t('ArchiveSlide')}</h2>
                    <p>
                        {t('ArchivedStatus')}
                    </p>

                    <div className="delete-modal-actions">
                        <button className="btn-cancel" onClick={handleCancelArchive}>
                            {t('cancel')}

                        </button>
                        <button className="btn-delete btn-archive" onClick={handleConfirmArchive} disabled={archiveStatus === 'loading'}>
                            {archiveStatus === 'loading' ? 'Archiving...' : t('Archive')}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal size="small" isOpen={isDeleteModalOpen} onClose={handleCancelDelete} className="delete-modal-wrapper">
                <div className="delete-modal">
                    <div className="delete-icon">
                        <FontAwesomeIcon icon={faTrashAlt} />
                    </div>

                    <h2>{t('DeleteSlide')}</h2>
                    <p>
                        {t('DeleteStatus')}
                    </p>

                    <div className="delete-modal-actions">
                        <button className="btn-cancel" onClick={handleCancelDelete}>
                            {t('cancel')}
                        </button>
                        <button className="btn-delete" onClick={handleConfirmDelete} disabled={deleteStatus === 'loading'}>
                            {deleteStatus === 'loading' ? 'Deleting...' : t('Delete')}
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
