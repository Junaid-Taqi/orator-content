import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import '../styles/CreatePoolModal.css';
import { addContentPool } from '../Services/Slices/AddContentPoolSlice';
import { getAllContentPool } from '../Services/Slices/GetContentPoolSlice';
import { updateContentPool } from '../Services/Slices/UpdateContentPoolSlice';

const initialFormState = {
    name: '',
    description: '',
    color: 'Blue',
    status: 'true',
    priorityMode: 'By Priority',
    isAlwaysOn: false,
};
const NAME_MAX_LENGTH = 255;

const mapPoolToFormData = (pool) => ({
    name: pool?.name || '',
    description: pool?.description || '',
    color: pool?.color || 'Blue',
    status: String(!!pool?.status),
    priorityMode: pool?.priorityMode || 'By Priority',
    isAlwaysOn: !!pool?.isAlwaysOn,
});

const CreatePoolModal = ({ isOpen, onClose, user, poolToEdit = null }) => {
    const dispatch = useDispatch();
    const { status: addStatus } = useSelector((state) => state.AddContentPool);
    const { status: updateStatus } = useSelector((state) => state.UpdateContentPool);
    const isEditMode = !!poolToEdit?.contentPoolId;
    const isSubmitting = addStatus === 'loading' || updateStatus === 'loading';

    const [formData, setFormData] = useState(initialFormState);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(isEditMode ? mapPoolToFormData(poolToEdit) : initialFormState);
            setSubmitError('');
        }
    }, [isOpen, isEditMode, poolToEdit]);

    if (!isOpen) return null;

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleClose = () => {
        setFormData(initialFormState);
        setSubmitError('');
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            setSubmitError('Pool name is required.');
            return;
        }
        if (trimmedName.length > NAME_MAX_LENGTH) {
            setSubmitError(`Pool name must be ${NAME_MAX_LENGTH} characters or fewer.`);
            return;
        }

        const groupId = user?.groups?.[0]?.id;
        const userId = user?.userId;
        if (!groupId || !userId) {
            setSubmitError('Unable to identify logged-in user or group.');
            return;
        }

        const payload = {
            groupId: String(groupId),
            userId: String(userId),
            name: trimmedName,
            description: formData.description.trim(),
            color: formData.color,
            status: formData.status,
            priorityMode: formData.priorityMode,
            isAlwaysOn: String(formData.isAlwaysOn),
        };

        const result = isEditMode
            ? await dispatch(updateContentPool({ ...payload, contentPoolId: String(poolToEdit.contentPoolId) }))
            : await dispatch(addContentPool(payload));

        const isSuccess = isEditMode
            ? updateContentPool.fulfilled.match(result) && result.payload?.success
            : addContentPool.fulfilled.match(result) && result.payload?.success;

        if (isSuccess) {
            dispatch(getAllContentPool({ groupId: String(groupId) }));
            handleClose();
            return;
        }

        setSubmitError(
            result?.payload?.message
            || result?.error?.message
            || (isEditMode ? 'Unable to update content pool.' : 'Unable to create content pool.')
        );
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEditMode ? 'Update Content Pool' : 'Create New Content Pool'}</h2>
                    <button className="close-btn" onClick={handleClose}>&times;</button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="info-alert blue-tint">
                        <p>
                            <strong>{isEditMode ? 'Update this pool:' : 'Create a new pool:'}</strong>
                            {' '}
                            Each pool name is unique and represents a category.
                        </p>
                    </div>

                    <div className="form-group">
                        <label>Pool Name (This is also the category name)</label>
                        <input
                            type="text"
                            placeholder="e.g., Holiday Specials, Promotions"
                            className="modal-input"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            maxLength={NAME_MAX_LENGTH}
                            required
                        />
                        <small className="form-tip">Max {NAME_MAX_LENGTH} characters</small>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <input
                            type="text"
                            placeholder="Short description for this pool"
                            className="modal-input"
                            value={formData.description}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                        />
                    </div>

                    <div className="config-section">
                        <h3>Pool Configuration</h3>

                        <div className="form-group">
                            <label>Pool Color</label>
                            <select
                                className="modal-select"
                                value={formData.color}
                                onChange={(e) => handleFormChange('color', e.target.value)}
                            >
                                <option value="Blue">Blue</option>
                                <option value="Purple">Purple</option>
                                <option value="Orange">Orange</option>
                                <option value="Green">Green</option>
                                <option value="Red">Red</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Initial Status</label>
                            <select
                                className="modal-select"
                                value={formData.status}
                                onChange={(e) => handleFormChange('status', e.target.value)}
                            >
                                <option value="true">Enabled (Active in rotation)</option>
                                <option value="false">Disabled</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Priority Mode</label>
                            <select
                                className="modal-select"
                                value={formData.priorityMode}
                                onChange={(e) => handleFormChange('priorityMode', e.target.value)}
                            >
                                <option value="By Priority">By Priority (High to Medium to Low)</option>
                            </select>
                        </div>

                        <div className="checkbox-group">
                            <div className="checkbox-row">
                                <input
                                    type="checkbox"
                                    id="alwaysOn"
                                    checked={formData.isAlwaysOn}
                                    onChange={(e) => handleFormChange('isAlwaysOn', e.target.checked)}
                                />
                                <label htmlFor="alwaysOn">Create this as the Always On pool</label>
                            </div>
                            <p className="checkbox-hint">Only one Always On pool can exist per group. Enable this only when creating that dedicated pool.</p>
                        </div>
                    </div>

                    <div className="info-alert green-tint">
                        <p><strong>Next steps:</strong> After creating the pool, you can add slides from the Slides tab or import content from the Connector.</p>
                    </div>

                    {submitError && <p className="form-tip" style={{ color: '#d93025' }}>{submitError}</p>}

                    <div className="modal-footer">
                        <button type="button" className="footer-btn btn-cancel" onClick={handleClose}>Cancel</button>
                        <button type="submit" className="footer-btn btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Pool' : 'Create Pool')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePoolModal;
