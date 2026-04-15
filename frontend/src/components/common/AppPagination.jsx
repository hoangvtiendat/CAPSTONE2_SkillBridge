import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AppPagination = ({
    currentPage = 0,
    totalPages = 0,
    onPageChange,
    zeroBased = true,
    summary
}) => {
    if (!totalPages || totalPages <= 1) return null;

    const pageIndex = zeroBased ? currentPage : currentPage - 1;
    const maxIndex = totalPages - 1;

    const renderPageButtons = () => {
        const pages = [];
        for (let i = 0; i < totalPages; i += 1) {
            const isEdge = i === 0 || i === maxIndex;
            const isNear = Math.abs(i - pageIndex) <= 1;
            if (isEdge || isNear) {
                pages.push(
                    <button
                        key={`page-${i}`}
                        onClick={() => onPageChange(zeroBased ? i : i + 1)}
                        className={`pagination-btn ${pageIndex === i ? 'active' : ''}`}
                    >
                        {i + 1}
                    </button>
                );
            } else if (i === pageIndex - 2 || i === pageIndex + 2) {
                pages.push(<span key={`dots-${i}`} className="pagination-ellipsis">...</span>);
            }
        }
        return pages;
    };

    return (
        <div className="modern-pagination">
            <div className="pagination-info">
                {summary || <>Đang xem trang <b>{pageIndex + 1} / {totalPages}</b></>}
            </div>
            <div className="pagination-controls">
                <button
                    disabled={pageIndex <= 0}
                    onClick={() => onPageChange(zeroBased ? pageIndex - 1 : pageIndex)}
                    className="pagination-btn"
                    title="Trang trước"
                >
                    <ChevronLeft size={18} />
                </button>

                {renderPageButtons()}

                <button
                    disabled={pageIndex >= maxIndex}
                    onClick={() => onPageChange(zeroBased ? pageIndex + 1 : pageIndex + 2)}
                    className="pagination-btn"
                    title="Trang sau"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default AppPagination;
