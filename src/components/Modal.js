import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, children, size, closeOnOverlayClick = true }) => {
    if (!isOpen) return null;

    const modalSizeClass =
        size === 'small'
            ? 'modal-small'
            : size === 'large'
                ? 'modal-large'
                : '';

    const handleOverlayClick = () => {
        if (closeOnOverlayClick) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div
                className={`modal-content ${modalSizeClass}`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default Modal;
