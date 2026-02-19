import React from 'react';
import '../styles/CreatePoolModal.css';

const CreatePoolModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Create New Content Pool</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="info-alert blue-tint">
                        <p><strong>Create a new pool:</strong> Each pool name is unique and represents a category. You can add slides to your pool after creation.</p>
                    </div>

                    <div className="form-group">
                        <label>Pool Name (This is also the category name)</label>
                        <input type="text" placeholder="e.g., 📅 Holiday Specials, 📢 Promotions, etc." className="modal-input" />
                        <small className="form-tip">Tip: Include an emoji to make your pool easily identifiable</small>
                    </div>

                    <div className="config-section">
                        <h3>Pool Configuration</h3>
                        
                        <div className="form-group">
                            <label>Pool Color</label>
                            <select className="modal-select">
                                <option>Blue</option>
                                <option>Green</option>
                                <option>Purple</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Initial Status</label>
                            <select className="modal-select">
                                <option>Enabled (Active in rotation)</option>
                                <option>Disabled</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Priority Mode</label>
                            <select className="modal-select">
                                <option>By Priority (High → Medium → Low)</option>
                            </select>
                        </div>

                        <div className="checkbox-group">
                            <div className="checkbox-row">
                                <input type="checkbox" id="alwaysOn" />
                                <label htmlFor="alwaysOn">Insert Always On slides between this pool and others</label>
                            </div>
                            <p className="checkbox-hint">When enabled, Always On content will appear before this pool in the playback sequence</p>
                        </div>
                    </div>

                    <div className="info-alert green-tint">
                        <p><strong>Next steps:</strong> After creating the pool, you can add slides from the Slides tab or import content from the Connector.</p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="footer-btn btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="footer-btn btn-submit">+ Create Pool</button>
                </div>
            </div>
        </div>
    );
};

export default CreatePoolModal;