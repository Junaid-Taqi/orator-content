import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, children, size }) => {
    if (!isOpen) return null;

    const modalSizeClass =
        size === 'small'
            ? 'modal-small'
            : size === 'large'
                ? 'modal-large'
                : '';

    return (
        <div className="modal-overlay" onClick={onClose}>
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