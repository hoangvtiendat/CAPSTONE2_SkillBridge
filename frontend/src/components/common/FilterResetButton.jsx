import React from 'react';
import { RotateCcw } from 'lucide-react';

const FilterResetButton = ({ onClick, disabled, title = 'Đặt lại bộ lọc', spinning = false }) => {
    return (
        <button
            className={`filter-reset-btn ${spinning ? 'spinning' : ''}`}
            onClick={onClick}
            disabled={disabled}
            title={title}
            type="button"
        >
            <RotateCcw size={16} />
            <span>Đặt lại</span>
        </button>
    );
};

export default FilterResetButton;
