import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import '../styles/CreatePoolModal.css';
import {addContentPool} from '../Services/Slices/AddContentPoolSlice';
import {getAllContentPool} from '../Services/Slices/GetContentPoolSlice';
import {updateContentPool} from '../Services/Slices/UpdateContentPoolSlice';
import { useTranslation } from '../Services/Localization/Localization';

const initialFormState = {
    name: '',
    description: '',
    color: 'Blue',
    status: 'true',
    priorityMode: 'By Priority',
    isAlwaysOn: false,
};
const NAME_MAX_LENGTH = 300;
const DESCRIPTION_MAX_LENGTH = 500;

const mapPoolToFormData = (pool) => ({
    name: String(pool?.name || '').slice(0, NAME_MAX_LENGTH),
    description: String(pool?.description || '').slice(0, DESCRIPTION_MAX_LENGTH),
    color: pool?.color || 'Blue',
    status: String(!!pool?.status),
    priorityMode: pool?.priorityMode || 'By Priority',
    isAlwaysOn: !!pool?.isAlwaysOn,
});

const CreatePoolModal = ({isOpen, onClose, user, poolToEdit = null}) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const {status: addStatus} = useSelector((state) => state.AddContentPool);
    const {status: updateStatus} = useSelector((state) => state.UpdateContentPool);
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
        setFormData((prev) => ({...prev, [field]: value}));
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
        const trimmedDescription = formData.description.trim();
        if (trimmedDescription.length > DESCRIPTION_MAX_LENGTH) {
            setSubmitError(`Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`);
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
            description: trimmedDescription,
            color: formData.color,
            status: formData.status,
            priorityMode: formData.priorityMode,
            isAlwaysOn: String(formData.isAlwaysOn),
        };

        const result = isEditMode
            ? await dispatch(updateContentPool({...payload, contentPoolId: String(poolToEdit.contentPoolId)}))
            : await dispatch(addContentPool(payload));

        const isSuccess = isEditMode
            ? updateContentPool.fulfilled.match(result) && result.payload?.success
            : addContentPool.fulfilled.match(result) && result.payload?.success;

        if (isSuccess) {
            dispatch(getAllContentPool({groupId: String(groupId)}));
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
                    <h2>{isEditMode ? t("updateContentPoolTitle") : t("createNewContentPoolTitle")}</h2>
                    <button className="close-btn" onClick={handleClose}>&times;</button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    <div className="info-alert blue-tint">
                        <p>
                            <strong>
                                {isEditMode ? t("updateThisPoolLabel") : t("createNewPoolLabel")}
                            </strong>
                            {' '}
                            {t("eachPoolNameUniqueCategoryText")}
                        </p>
                    </div>

                    <div className="form-group">
                        <label>{t("poolNameCategoryLabel")}</label>
                        <input
                            type="text"
                            placeholder={t("poolNamePlaceholderExample")}
                            className="modal-input"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            maxLength={NAME_MAX_LENGTH}
                            required
                        />
                        <small className="form-tip">
                            {t("poolNameEmojiTip")}
                        </small>
                    </div>

                    <div className="form-group">
                        <label>{t("poolDescriptionLabel")}</label>
                        <input
                            type="text"
                            placeholder={t("poolDescriptionPlaceholder")}
                            className="modal-input"
                            value={formData.description}
                            onChange={(e) => handleFormChange('description', e.target.value)}
                            maxLength={DESCRIPTION_MAX_LENGTH}
                        />
                    </div>

                    <div className="config-section">
                        <h3>{t("poolConfigurationHeading")}</h3>

                        <div className="form-group">
                            <label>{t("poolColorLabel")}</label>
                            <select
                                className="modal-select"
                                value={formData.color}
                                onChange={(e) => handleFormChange('color', e.target.value)}
                            >
                                <option value="Blue">{t("colorBlue")}</option>
                                <option value="Purple">{t("colorPurple")}</option>
                                <option value="Orange">{t("colorOrange")}</option>
                                <option value="Green">{t("colorGreen")}</option>
                                <option value="Red">{t("colorRed")}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>{t("initialPoolStatusLabel")}</label>
                            <select
                                className="modal-select"
                                value={formData.status}
                                onChange={(e) => handleFormChange('status', e.target.value)}
                            >
                                <option value="true">{t("enabledActiveRotationStatus")}</option>
                                <option value="false">{t("disabledStatus")}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>{t("priorityModeLabel")}</label>
                            <select
                                className="modal-select"
                                value={formData.priorityMode}
                                onChange={(e) => handleFormChange('priorityMode', e.target.value)}
                            >
                                <option value="By Priority">{t("priorityModeHighMediumLow")}</option>
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
                                <label htmlFor="alwaysOn">
                                    {t("createAsAlwaysOnPoolLabel")}
                                </label>
                            </div>
                            <p className="checkbox-hint">
                                {t("alwaysOnPoolRestrictionHint")}
                            </p>
                        </div>
                    </div>

                    <div className="info-alert green-tint">
                        <p>
                            <strong>{t("nextStepsLabel")}</strong> {t("afterCreatingPoolNextStepsText")}
                        </p>
                    </div>

                    {submitError && (
                        <p className="form-tip" style={{ color: '#d93025' }}>
                            {submitError}
                        </p>
                    )}

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="footer-btn btn-cancel"
                            onClick={handleClose}
                        >
                            {t("cancelButtonText")}
                        </button>

                        <button
                            type="submit"
                            className="footer-btn btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? (isEditMode ? t("updatingButtonText") : t("creatingButtonText"))
                                : (isEditMode ? t("updatePoolButtonText") : t("createPoolButtonText"))
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePoolModal;
