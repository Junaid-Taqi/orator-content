import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/PoolsPage.css';
import CreatePoolModal from './CreatePoolModal';
import { getAllContentPool } from '../Services/Slices/GetContentPoolSlice';
import { updateContentPoolStatus } from '../Services/Slices/UpdateContentPoolStatusSlice';
import { updateAlwaysOnInsertionMode } from '../Services/Slices/UpdateAlwaysOnInsertionModeSlice';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faAngleDown } from "@fortawesome/free-solid-svg-icons/faAngleDown";
import { faCog } from "@fortawesome/free-solid-svg-icons/faCog";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";

const PoolsPage = ({ user }) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [editingPool, setEditingPool] = useState(null);
    const [showAlwaysOnSettings, setShowAlwaysOnSettings] = useState(false);
    const [selectedAlwaysOnMode, setSelectedAlwaysOnMode] = useState(2);
    const [alwaysOnMessage, setAlwaysOnMessage] = useState('');
    const [expandedPools, setExpandedPools] = useState({});
    const [visibleCount, setVisibleCount] = useState(5);

    const { contentPoolList, summary, fixedPlaybackPreview, status, error } = useSelector((state) => state.GetContentPool);
    const { status: updateStatus } = useSelector((state) => state.UpdateContentPoolStatus);
    const { status: alwaysOnUpdateStatus } = useSelector((state) => state.UpdateAlwaysOnInsertionMode);
    const groupId = user?.groups?.[0]?.id;

    useEffect(() => {
        if (groupId) {
            dispatch(getAllContentPool({ groupId: String(groupId) }));
        }
    }, [dispatch, groupId]);

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
        if (!value || typeof value !== 'string') {
            return '-';
        }
        const parts = value.split(',');
        if (parts.length >= 2) {
            return `${parts[0].trim()}, ${parts[1].trim()}`;
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
        setEditingPool(pool);
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
            return <div className="pool-accordion"><p>No content pools found.</p></div>;
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

            const renderSlideColumn = (label, slides, typeClass) => (
                <div className={`slides-column ${typeClass}`}>
                    <div className="slides-column-header">
                        <strong>{label}</strong>
                        <span className="slides-count">{slides.length}</span>
                    </div>
                    {!slides.length ? (
                        <p className="slides-empty">No slides</p>
                    ) : (
                        <div className="slides-list">
                            {slides.map((slide) => (
                                <div className="slide-item" key={slide?.slideId}>
                                    <div className="slide-item-title text-capitalize">{slide?.title || 'Untitled Slide'}</div>
                                    <div className="slide-item-meta">
                                        <span>{slide?.durationSeconds || 0}s</span>
                                        <span>Priority {slide?.priority || '-'}</span>
                                        <span>Start {formatSlideDate(slide?.startDate)}</span>
                                        <span>Archive {formatSlideDate(slide?.archiveDate)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );

            return (
                <div className={`pool-accordion ${colorClass}`} key={pool?.contentPoolId || `${title}-${sortOrder}`}>
                    <div className="accordion-header">
                        <div className="accordion-title">
                            <h3 className='text-capitalize'>{title}</h3>
                            <span className={badgeClass}>{badgeText}</span>
                            {isAlwaysOn && <span className="badge-enabled">Always On</span>}
                        </div>
                        <button
                            type="button"
                            className={`accordion-toggle ${isExpanded ? 'expanded' : ''}`}
                            onClick={() => togglePoolExpanded(pool?.contentPoolId)}
                        >
                            <FontAwesomeIcon icon={faAngleDown} />
                        </button>
                    </div>

                    <p className="category-label text-capitalize">Category: {title}</p>

                    <div className="accordion-body">
                        <div className="sub-stat">
                            <label>Active</label>
                            <span className="sub-val text-green">{pool?.activeCount ?? 0}</span>
                        </div>
                        <div className="sub-stat">
                            <label>Scheduled</label>
                            <span className="sub-val text-orange">{pool?.scheduledCount ?? 0}</span>
                        </div>
                        <div className="sub-stat">
                            <label>Archived</label>
                            <span className="sub-val text-muted">{pool?.archivedCount ?? 0}</span>
                        </div>
                        <div className="sub-stat">
                            <label>Pool Status</label>
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
                            <label>Order</label>
                            <span className="sub-val">#{sortOrder}</span>
                        </div>
                    </div>

                    <div className="accordion-footer">
                        <div className="priority-mode">
                            <span>Slide Priority Mode:</span>
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
                                Edit
                            </button>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="pool-slides-details">
                            {renderSlideColumn('Active', activeSlides, 'slides-active')}
                            {renderSlideColumn('Scheduled', scheduledSlides, 'slides-scheduled')}
                            {renderSlideColumn('Archived', archivedSlides, 'slides-archived')}
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
                    <h1>Content Pools</h1>
                    <p>Category-based pools in fixed rotation with Always On insertion</p>
                </div>
                <div className="header-btns">
                    <button className="btn btn-create" onClick={handleOpenCreateModal}><FontAwesomeIcon icon={faPlus} style={{ marginRight: '5px' }} /> Create Pool</button>
                    <button
                        className="btn btn-always"
                        onClick={() => setShowAlwaysOnSettings((prev) => !prev)}
                    >
                        <FontAwesomeIcon icon={faCog} style={{ marginRight: '5px' }} /> Always On Settings
                    </button>
                    <button className="btn btn-emergency"><FontAwesomeIcon icon={faCircleExclamation} style={{ marginRight: '5px' }} /> Emergency Settings</button>
                </div>
            </div>

            {showAlwaysOnSettings && (
                <div className="always-on-settings-panel">
                    <div className="always-on-settings-header">
                        <h3>Always On Insertion Settings</h3>
                        <p>Control where Always On slides appear in the playback loop.</p>
                    </div>

                    {!alwaysOnPool ? (
                        <div className="always-on-empty">
                            No Always On pool found. Create one first to configure insertion mode.
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
                                <span>Show only at start of loop</span>
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
                                <span>Show between every pool</span>
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
                    <strong>Fixed Playback Rotation</strong>
                    <p>{fixedPlaybackPreview || 'No rotation preview available.'}</p>
                </div>
            </div>

            {/* 3. Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <label>Active Slides</label>
                    <span className="value text-green">{summary?.activeSlides ?? 0}</span>
                </div>
                <div className="stat-card">
                    <label>Scheduled</label>
                    <span className="value text-orange">{summary?.scheduled ?? 0}</span>
                </div>
                <div className="stat-card">
                    <label>Archived</label>
                    <span className="value">{summary?.archived ?? 0}</span>
                </div>
                <div className="stat-card">
                    <label>Enabled Pools</label>
                    <span className="value text-purple">{enabledPools}</span>
                </div>
                <div className="stat-card">
                    <label>Emergency Ready</label>
                    <span className="value text-red">{summary?.emergencyReady ?? 0}</span>
                </div>
            </div>

            {/* 4. Device Filter Bar */}
            <div className="device-filter">
                <div className="filter-info">
                    <span>🖥️ Device-Specific Content</span>
                    <p>View and manage pool content for specific displays</p>
                </div>
                <select className="device-dropdown">
                    <option>All Devices (Global)</option>
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
                        Load More Pools
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



