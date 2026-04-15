import React from 'react';
import { Search } from 'lucide-react';

const ManagementFilterBar = ({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Tìm kiếm...',
    children
}) => {
    return (
        <div className="filters-bar">
            <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="modern-input"
                    value={searchValue}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                />
            </div>
            <div className="filters-group">
                {children}
            </div>
        </div>
    );
};

export default ManagementFilterBar;
