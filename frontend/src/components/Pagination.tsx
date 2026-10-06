// src/components/Pagination.tsx
import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;
  pageSizeOptions?: number[];
  selectedCount?: number;
  itemLabel?: string;
  className?: string;
  extraControls?: React.ReactNode;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  selectedCount = 0,
  itemLabel = 'công văn',
  className = '',
  extraControls,
}) => {
  if (totalItems === 0) {
    return (
      <div className={`flex items-center justify-center text-xs text-slate-500 px-4 py-3 ${className}`}>
        {/* <span>Không có {itemLabel} nào</span> */}
      </div>
    );
  }

  const fromIndex = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const toIndex = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = (): (number | 'ellipsis-prev' | 'ellipsis-next')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 'ellipsis-next', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, 'ellipsis-prev', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis-prev', currentPage, 'ellipsis-next', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-200 text-xs ${className}`}>
      {/* Summary — gọn trên mobile */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-slate-600 text-[11px] sm:text-xs select-none order-2 sm:order-1">
        <span className="text-center">
          <strong className="font-semibold text-slate-900">{fromIndex}</strong>
          {' – '}
          <strong className="font-semibold text-slate-900">{toIndex}</strong>
          {' / '}
          <strong className="font-bold text-red-700">{totalItems}</strong>
          {' '}{itemLabel}
          {totalPages > 1 && (
            <span className="text-slate-500 ml-1.5 hidden sm:inline">
              (Trang <strong>{currentPage}</strong>/{totalPages})
            </span>
          )}
        </span>

        {extraControls}

        {/* Page size — ẩn trên mobile rất nhỏ */}
        {onPageSizeChange && (
          <div className="hidden xs:flex items-center gap-1.5 sm:ml-2 sm:pl-2 sm:border-l sm:border-slate-300">
            <span className="text-slate-500 text-[10px] sm:text-xs">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controls — gọn trên mobile */}
      {totalPages > 1 && (
        <nav
          aria-label="Phân trang"
          className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center order-1 sm:order-2"
        >
          {/* First — ẩn trên mobile rất nhỏ */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="Trang đầu"
            className="hidden xs:flex p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer items-center justify-center"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Prev */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Trang trước"
            className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] sm:text-xs font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trước</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {pages.map((p, idx) => {
              if (p === 'ellipsis-prev' || p === 'ellipsis-next') {
                return (
                  <span
                    key={`${p}-${idx}`}
                    className="px-1.5 py-1 text-slate-400 font-semibold select-none text-xs"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = p === currentPage;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={isCurrent ? 'page' : undefined}
                  style={isCurrent ? { backgroundColor: '#B71C1C', borderColor: '#7F0E0E' } : {}}
                  className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-1.5 sm:px-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition flex items-center justify-center cursor-pointer border ${
                    isCurrent
                      ? 'text-white shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Trang sau"
            className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer text-[11px] sm:text-xs font-semibold"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last — ẩn trên mobile rất nhỏ */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Trang cuối"
            className="hidden xs:flex p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer items-center justify-center"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
};