import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/PoolsPage.css';
import CreatePoolModal from './CreatePoolModal';
import { getAllContentPool } from '../Services/Slices/GetContentPoolSlice';
import { updateContentPoolStatus } from '../Services/Slices/UpdateContentPoolStatusSlice';

const PoolsPage = ({ user }) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [editingPool, setEditingPool] = useState(null);

    const { contentPoolList, total, status, error } = useSelector((state) => state.GetContentPool);
    const { status: updateStatus } = useSelector((state) => state.UpdateContentPoolStatus);
    const groupId = user?.groups?.[0]?.id;

    useEffect(() => {
        if (groupId) {
            dispatch(getAllContentPool({ groupId: String(groupId) }));
        }
    }, [dispatch, groupId]);

    const enabledPools = useMemo(
        () => (contentPoolList || []).filter((pool) => pool?.status).length,
        [contentPoolList]
    );

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

        return contentPoolList.map((pool) => {
            const isEnabled = !!pool?.status;
            const badgeClass = isEnabled ? 'badge-enabled' : 'badge-disabled';
            const badgeText = isEnabled ? 'Enabled' : 'Disabled';
            const title = pool?.name || 'Untitled Pool';
            const sortOrder = pool?.sortOrder || '-';
            const priorityMode = pool?.priorityMode || 'By Priority';
            const isAlwaysOn = !!pool?.isAlwaysOn;
            const colorClass = `pool-color-${String(pool?.color || 'default').trim().toLowerCase().replace(/\s+/g, '-')}`;

            return (
                <div className={`pool-accordion ${colorClass}`} key={pool?.contentPoolId || `${title}-${sortOrder}`}>
                    <div className="accordion-header">
                        <div className="accordion-title">
                            <span className="status-indicator"></span>
                            <h3>{title}</h3>
                            <span className={badgeClass}>{badgeText}</span>
                            {isAlwaysOn && <span className="badge-enabled">Always On</span>}
                        </div>
                        <span className="arrow">v</span>
                    </div>

                    <p className="category-label">Category: {title}</p>

                    <div className="accordion-body">
                        <div className="sub-stat">
                            <label>Active</label>
                            <span className="sub-val text-green">2</span>
                        </div>
                        <div className="sub-stat">
                            <label>Scheduled</label>
                            <span className="sub-val text-orange">0</span>
                        </div>
                        <div className="sub-stat">
                            <label>Archived</label>
                            <span className="sub-val text-muted">3</span>
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
                    <button className="btn btn-create" onClick={handleOpenCreateModal}>+ Create Pool</button>
                    <button className="btn btn-always">Always On Settings</button>
                    <button className="btn btn-emergency">Emergency Settings</button>
                </div>
            </div>

            {/* 2. Purple Rotation Bar */}
            <div className="rotation-banner">
                <div className="rotation-icon">
                    <span className="icon-box">📚</span>
                </div>
                <div className="rotation-details">
                    <strong>Fixed Playback Rotation</strong>
                    <p>News → Always On → Official News → Always On → Events → Always On → (repeat)</p>
                </div>
            </div>

            {/* 3. Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <label>Active Slides</label>
                    <span className="value text-green">25</span>
                </div>
                <div className="stat-card">
                    <label>Scheduled</label>
                    <span className="value text-orange">9</span>
                </div>
                <div className="stat-card">
                    <label>Archived</label>
                    <span className="value">38</span>
                </div>
                <div className="stat-card">
                    <label>Enabled Pools</label>
                    <span className="value text-purple">4</span>
                </div>
                <div className="stat-card">
                    <label>Emergency Ready</label>
                    <span className="value text-red">2</span>
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
