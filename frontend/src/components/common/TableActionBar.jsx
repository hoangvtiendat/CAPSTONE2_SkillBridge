import React from 'react';

const TableActionBar = ({ actions = [] }) => {
    if (!actions.length) return null;
    return (
        <div className="actions-wrapper">
            {actions.map((action) => {
                const Icon = action.icon;
                if (action.variant === 'solid') {
                    return (
                        <button
                            key={action.key}
                            onClick={action.onClick}
                            className={`action-btn-solid ${action.tone || ''}`}
                            title={action.title}
                            disabled={action.disabled}
                        >
                            {Icon ? <Icon size={14} /> : null}
                            {action.label}
                        </button>
                    );
                }
                return (
                    <button
                        key={action.key}
                        onClick={action.onClick}
                        className={`action-btn ${action.tone || ''}`}
                        title={action.title}
                        disabled={action.disabled}
                    >
                        {Icon ? <Icon size={18} /> : null}
                    </button>
                );
            })}
        </div>
    );
};

export default TableActionBar;
