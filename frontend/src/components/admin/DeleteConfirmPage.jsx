import React from 'react';
import ReactDOM from 'react-dom';
import './DeleteConfirm.css'
const DeleteConfirmPage = ({
    isOpen,
    onCancel,
    onConfirm,
    title = "Xác nhận xóa",
    message = "Hành động này không thể hoàn tác.",
    cancelText = "Hủy",
    confirmText = "Xóa ngay"
}) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onCancel}>{cancelText}</button>
                    <button className="btn-confirm-delete" onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteConfirmPage;