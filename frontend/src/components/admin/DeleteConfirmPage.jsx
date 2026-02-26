import React from 'react';
import ReactDOM from 'react-dom';

const DeleteConfirmPage = ({ isOpen, onCancel, onConfirm }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                <h3>Xác nhận xóa</h3>
                <p>Hành động này không thể hoàn tác.</p>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onCancel}>Hủy</button>
                    <button className="btn-confirm-delete" onClick={onConfirm}>Xóa ngay</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteConfirmPage;