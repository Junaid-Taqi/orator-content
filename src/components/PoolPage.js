import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import '../styles/PoolsPage.css';
import CreatePoolModal from './CreatePoolModal';
import { serverUrl } from '../Services/Constants/Constants';
import { getAllContentPool } from '../Services/Slices/GetContentPoolSlice';
import { updateContentPoolStatus } from '../Services/Slices/UpdateContentPoolStatusSlice';
import { updateAlwaysOnInsertionMode } from '../Services/Slices/UpdateAlwaysOnInsertionModeSlice';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faAngleDown } from "@fortawesome/free-solid-svg-icons/faAngleDown";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { useTranslation } from '../Services/Localization/Localization';

const POOL_NAME_MAX_LENGTH = 300;
const POOL_DESCRIPTION_MAX_LENGTH = 500;

const PoolsPage = ({ user }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [editingPool, setEditingPool] = useState(null);
    const [showAlwaysOnSettings, setShowAlwaysOnSettings] = useState(false);
    const [selectedAlwaysOnMode, setSelectedAlwaysOnMode] = useState(2);
    const [alwaysOnMessage, setAlwaysOnMessage] = useState('');
    const [expandedPools, setExpandedPools] = useState({});
    const [activeSlideFilters, setActiveSlideFilters] = useState({});
    const [visibleCount, setVisibleCount] = useState(5);
    const [devices, setDevices] = useState([{ id: 'all-devices', label: 'All Devices (Global)' }]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('all-devices');

    const { contentPoolList, summary, fixedPlaybackPreview, status, error } = useSelector((state) => state.GetContentPool);
    const { status: updateStatus } = useSelector((state) => state.UpdateContentPoolStatus);
    const { status: alwaysOnUpdateStatus } = useSelector((state) => state.UpdateAlwaysOnInsertionMode);
    const groupId = user?.groups?.[0]?.id;

    useEffect(() => {
        const fetchDevices = async () => {
            const currentGroupId = user?.groups?.[0]?.id;
            if (!currentGroupId) return;

            try {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                    },
                };
                const response = await axios.post(`${serverUrl}/o/displayManagementApplication/getAllDisplays`, { groupId: String(currentGroupId) }, config);
                if (response.data?.success) {
                    const mapped = (response.data?.displays || []).map(d => ({ id: String(d.displayId), label: d.name }));
                    setDevices([{ id: 'all-devices', label: 'All Devices (Global)' }, ...mapped]);
                }
            } catch (err) {
                console.error('Failed to fetch devices:', err);
            }
        };
        fetchDevices();
    }, [user]);

    useEffect(() => {
        if (groupId) {
            const payload = { groupId: String(groupId) };
            if (selectedDeviceId !== 'all-devices') {
                payload.displayId = selectedDeviceId;
            }
            dispatch(getAllContentPool(payload));
        }
    }, [dispatch, groupId, selectedDeviceId]);

    const alwaysOnPool = useMemo(
        () => (contentPoolList || []).find((pool) => !!pool?.isAlwaysOn),
        [contentPoolList]
    );

    useEffect(() => {
        if (alwaysOnPool) {
            const mode = Number(alwaysOnPool.alwaysOnInsertionMode);
            setSelectedAlwaysOnMode(mode === 1 ? 1 : 2);
        }
    }, [alwaysOnPool]);

    const enabledPools = summary?.enabledPools ?? (contentPoolList || []).filter((pool) => pool?.status).length;

    const togglePoolExpanded = (poolId) => {
        if (!poolId) {
            return;
        }
        setExpandedPools((prev) => ({
            ...prev,
            [poolId]: !prev[poolId],
        }));
    };

    const formatSlideDate = (value) => {
        if (!value) return '-';
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
        if (typeof value === 'string') {
            const parts = value.split(',');
            if (parts.length >= 2) {
                return `${parts[0].trim()}, ${parts[1].trim()}`;
            }
        }
        return value;
    };

    const handlePoolStatusChange = async (pool) => {
        if (!groupId || !pool?.contentPoolId) {
            return;
        }

        const nextStatus = !pool?.status;
        const payload = {
            groupId: String(groupId),
            contentPoolId: String(pool.contentPoolId),
            status: String(nextStatus),
        };

        const result = await dispatch(updateContentPoolStatus(payload));
        if (updateContentPoolStatus.fulfilled.match(result) && result.payload?.success) {
            dispatch(getAllContentPool({ groupId: String(groupId) }));
        }
    };

    const handleOpenCreateModal = () => {
        setEditingPool(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (pool) => {
        setEditingPool({
            ...pool,
            name: String(pool?.name || '').slice(0, POOL_NAME_MAX_LENGTH),
            description: String(pool?.description || '').slice(0, POOL_DESCRIPTION_MAX_LENGTH),
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPool(null);
    };

    const handleAlwaysOnModeChange = async (mode) => {
        if (!groupId) {
            return;
        }
        const previousMode = selectedAlwaysOnMode;
        setAlwaysOnMessage('');
        setSelectedAlwaysOnMode(mode);
        const result = await dispatch(
            updateAlwaysOnInsertionMode({
                groupId: String(groupId),
                alwaysOnInsertionMode: String(mode),
            })
        );
        if (updateAlwaysOnInsertionMode.fulfilled.match(result) && result.payload?.success) {
            setAlwaysOnMessage('Always On insertion mode updated.');
            dispatch(getAllContentPool({ groupId: String(groupId) }));
            return;
        }
        setSelectedAlwaysOnMode(previousMode);
        setAlwaysOnMessage(result?.payload?.message || result?.error?.message || 'Failed to update Always On setting.');
    };

    const renderPools = () => {
        if (status === 'loading') {
            return <div className="pool-accordion"><p>Loading content pools...</p></div>;
        }

        if (status === 'failed') {
            return <div className="pool-accordion"><p>{error || 'Unable to load content pools.'}</p></div>;
        }

        if (!contentPoolList?.length) {
            return <div className="pool-accordion"><p>{t('NoContentPool')}</p></div>;
        }

        return contentPoolList.slice(0, visibleCount).map((pool) => {
            const isEnabled = !!pool?.status;
            const badgeClass = isEnabled ? 'badge-enabled' : 'badge-disabled';
            const badgeText = isEnabled ? 'Enabled' : 'Disabled';
            const title = pool?.name || 'Untitled Pool';
            const sortOrder = pool?.sortOrder || '-';
            const priorityMode = pool?.priorityMode || 'By Priority';
            const isAlwaysOn = !!pool?.isAlwaysOn;
            const colorClass = `pool-color-${String(pool?.color || 'default').trim().toLowerCase().replace(/\s+/g, '-')}`;
            const isExpanded = !!expandedPools[pool?.contentPoolId];
            const activeSlides = pool?.slidesActive || [];
            const scheduledSlides = pool?.slidesScheduled || [];
            const archivedSlides = pool?.slidesArchived || [];

            const renderSlidesSection = (pool) => {
                const currentFilter = activeSlideFilters[pool?.contentPoolId] || 'active';
                const slidesMap = {
                    active: pool?.slidesActive || [],
                    scheduled: pool?.slidesScheduled || [],
                    archived: pool?.slidesArchived || []
                };
                const currentSlides = slidesMap[currentFilter];

                return (
                    <div className="manage-slides-section">
                        <div className="manage-slides-header">
                            <h4>{t('ManageSlides')}</h4>
                            <div className="manage-slides-tabs">
                                {[
                                    { id: 'active', label: 'Active', count: pool?.slidesActive?.length || 0 },
                                    { id: 'scheduled', label: 'Scheduled', count: pool?.slidesScheduled?.length || 0 },
                                    { id: 'archived', label: 'Archived', count: pool?.slidesArchived?.length || 0 }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`slide-tab-btn ${currentFilter === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveSlideFilters(prev => ({ ...prev, [pool.contentPoolId]: tab.id }))}
                                    >
                                        <span className="tab-label">{tab.label}</span>
                                        <span className="tab-badge">{tab.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="slides-list-vertical">
                            {!currentSlides.length ? (
                                <p className="slides-empty">{t('NoSlides')}</p>
                            ) : (
                                currentSlides.map((slide) => {
                                    const priorityLabel = slide?.priority === 1 ? 'High' : slide?.priority === 2 ? 'Medium' : slide?.priority === 3 ? 'Low' : '';
                                    const durationText = slide?.durationSeconds ? ` (${slide.durationSeconds}s)` : '';
                                    const isPermanent = !slide?.startDate && !slide?.archiveDate;

                                    return (
                                        <div className="slide-card-compact" key={slide?.slideId}>
                                            <div className="slide-card-main">
                                                <div className="slide-card-title-row">
                                                    <span className="slide-title text-capitalize">{slide?.title || 'Untitled Slide'}</span>
                                                    {priorityLabel && (
                                                        <span className={`slide-priority-pill ${priorityLabel.toLowerCase()}`}>
                                                            {priorityLabel}{durationText}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="slide-card-subtext">
                                                    {isPermanent ? 'Permanent' : `${formatSlideDate(slide?.startDate)} - ${formatSlideDate(slide?.archiveDate)}`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            };

            return (
                <div className={`pool-accordion ${colorClass}`} key={pool?.contentPoolId || `${title}-${sortOrder}`}>
                    <div className="accordion-header">
                        <div className="accordion-title">
                            <h3 className='text-capitalize'>{title}</h3>
                            <span className={badgeClass}>{badgeText}</span>
                            {isAlwaysOn && <span className="badge-enabled">{t('AlwaysOn')}</span>}
                        </div>
                        <button
                            type="button"
                            className={`accordion-toggle ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => togglePoolExpanded(pool?.contentPoolId)}
                        >
                            <FontAwesomeIcon icon={faAngleDown} />
                        </button>
                    </div>

                    <p className="category-label text-capitalize">{t('Category')}: {title}</p>

                    <div className="accordion-body">
                        <div className="sub-stat">
                            <label>{t('active')}</label>
                            <span className="sub-val text-green">{pool?.activeCount ?? 0}</span>
                        </div>
                        <div className="sub-stat">
                            <label>{t('scheduled')}</label>
                            <span className="sub-val text-orange">{pool?.scheduledCount ?? 0}</span>
                        </div>
                        <div className="sub-stat">
                            <label>{t('archived')}</label>
                            <span className="sub-val text-muted">{pool?.archivedCount ?? 0}</span>
                        </div>
                        <div className="sub-stat">
                            <label>{t('PoolStatus')}</label>
                            <div className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => handlePoolStatusChange(pool)}
                                    disabled={updateStatus === 'loading'}
                                />
                                <span className="slider"></span>
                            </div>
                        </div>
                        <div className="sub-stat">
                            <label>{t('Order')}</label>
                            <span className="sub-val">#{sortOrder}</span>
                        </div>
                    </div>

                    <div className="accordion-footer">
                        <div className="priority-mode">
                            <span>{t('SlidePriorityMode')}:</span>
                            <p>{priorityMode}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select className="priority-dropdown" value={priorityMode} disabled>
                                <option>{priorityMode}</option>
                            </select>
                            <button
                                type="button"
                                className="btn btn-create"
                                onClick={() => handleOpenEditModal(pool)}
                            >
                                {t('Edit')}
                            </button>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="pool-slides-details-full">
                            {renderSlidesSection(pool)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="pools-container">
            {/* 1. Header Section */}
            <div className="pools-header">
                <div className="header-text">
                    <h1>{t('ContentPools')}</h1>
                    <p>{t('Categorybased')}</p>
                </div>
                <div className="header-btns">
                    <button className="btn btn-create" onClick={handleOpenCreateModal}><FontAwesomeIcon icon={faPlus} style={{ marginRight: '5px' }} /> {t('createPool')}</button>
                    <button
                        className="btn btn-always"
                        onClick={() => setShowAlwaysOnSettings((prev) => !prev)}
                    >
                        <FontAwesomeIcon icon={faCog} style={{ marginRight: '5px' }} /> {t('AlwaysOn')} {t('Settings')}
                    </button>
                    <button className="btn btn-emergency"><FontAwesomeIcon icon={faCircleExclamation} style={{ marginRight: '5px' }} /> {t('EmergencySettings')}</button>
                </div>
            </div>

            {showAlwaysOnSettings && (
                <div className="always-on-settings-panel">
                    <div className="always-on-settings-header">
                        <h3>{t('InsertionSettings')}</h3>
                        <p>{t('AlwaysOnSlides')}</p>
                    </div>

                    {!alwaysOnPool ? (
                        <div className="always-on-empty">
                            <p>{t('NoAlwaysOnPool')}</p>
                        </div>
                    ) : (
                        <div className="always-on-options">
                            <label className={`always-on-option ${selectedAlwaysOnMode === 1 ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="alwaysOnInsertionMode"
                                    value="1"
                                    checked={selectedAlwaysOnMode === 1}
                                    onChange={() => handleAlwaysOnModeChange(1)}
                                    disabled={alwaysOnUpdateStatus === 'loading'}
                                />
                                <span>{t('ShowStartLoop')}</span>
                            </label>

                            <label className={`always-on-option ${selectedAlwaysOnMode === 2 ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="alwaysOnInsertionMode"
                                    value="2"
                                    checked={selectedAlwaysOnMode === 2}
                                    onChange={() => handleAlwaysOnModeChange(2)}
                                    disabled={alwaysOnUpdateStatus === 'loading'}
                                />
                                <span>{t('ShowEndLoop')}</span>
                            </label>
                        </div>
                    )}

                    {!!alwaysOnMessage && (
                        <p className="always-on-message">{alwaysOnMessage}</p>
                    )}
                </div>
            )}

            {/* 2. Purple Rotation Bar */}
            <div className="rotation-banner">
                <div className="rotation-icon">
                    <span className="icon-box">📚</span>
                </div>
                <div className="rotation-details">
                    <strong>{t('FixedPlaybackRotation')}</strong>
                    <p>{fixedPlaybackPreview || 'No rotation preview available.'}</p>
                </div>
            </div>

            {/* 3. Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <label>{t('ActiveSlides')}</label>
                    <span className="value text-green">{summary?.activeSlides ?? 0}</span>
                </div>
                <div className="stat-card">
                    <label>{t('scheduled')}</label>
                    <span className="value text-orange">{summary?.scheduled ?? 0}</span>
                </div>
                <div className="stat-card">
                    <label>{t('archived')}</label>
                    <span className="value">{summary?.archived ?? 0}</span>
                </div>
                <div className="stat-card">
                    <label>{t('EnabledPools')}</label>
                    <span className="value text-purple">{enabledPools}</span>
                </div>
                <div className="stat-card">
                    <label>{t('EmergencyReady')}</label>
                    <span className="value text-red">{summary?.emergencyReady ?? 0}</span>
                </div>
            </div>

            {/* 4. Device Filter Bar */}
            <div className="device-filter">
                <div className="filter-info">
                    <span>🖥️ {t('DeviceSpecificContent')}</span>
                    <p>{t('DeviceSpecificContentDescription')}</p>
                </div>
                <select
                    className="device-dropdown"
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                    {devices.map(device => (
                        <option key={device.id} value={device.id}>{device.label}</option>
                    ))}
                </select>
            </div>

            {renderPools()}

            {contentPoolList && visibleCount < contentPoolList.length && (
                <div style={{ textAlign: 'center' }}>
                    <button
                        className="btn btn-outline-primary px-4 py-2 my-3"
                        onClick={() => setVisibleCount(prev => prev + 5)}
                        style={{ fontWeight: 500, borderRadius: '50rem', border: '1px solid' }}
                    >
                        {t('loadMorePools')}
                    </button>
                </div>
            )}

            <CreatePoolModal
                isOpen={showModal}
                onClose={handleCloseModal}
                user={user}
                poolToEdit={editingPool}
            />
        </div>
    );
};

export default PoolsPage;


