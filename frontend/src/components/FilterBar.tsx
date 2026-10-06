import React from 'react';
import { 
  Search, 
  X, 
  RotateCcw
} from 'lucide-react';
import { DispatchFilter } from '../types/dispatch';

interface FilterBarProps {
  filters: DispatchFilter;
  onFilterChange: (updates: Partial<DispatchFilter>) => void;
  onResetFilters: () => void;
  units?: string[];
  assignees?: string[];
  selectedCount: number;
  totalDispatches?: number;
  onBulkComplete: () => void;
  onBulkDelete: () => void;
  onClearAll?: () => void;
  onExportSelected?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  selectedCount,
  totalDispatches = 0,
  onBulkComplete,
  onBulkDelete,
  onClearAll,
  onExportSelected
}) => {
  const isFiltered = 
    filters.searchQuery !== '' || 
    filters.status !== 'ALL' || 
    filters.donViBanHanh !== 'ALL' || 
    filters.nguoiThucHien !== 'ALL' || 
    filters.urgency !== 'ALL' || 
    filters.overdueOnly ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-4 shadow-xs">
      {/* Top search & quick controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-dispatch"
            type="text"
            placeholder="Tìm kiếm theo số công văn, trích yếu nội dung, đơn vị, người thực hiện..."
            value={filters.searchQuery}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected rows batch actions */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-sm text-blue-900 animate-fadeIn">
            <span className="text-xs font-semibold text-blue-950">
              Đã chọn: <strong className="text-blue-700">{selectedCount}</strong>
            </span>
            {onExportSelected && (
              <button
                id="btn-export-selected-excel"
                type="button"
                onClick={onExportSelected}
                className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer shadow-xs"
                title="Xuất Excel danh sách các mục công văn đã chọn"
              >
                <span>Xuất Excel</span>
              </button>
            )}
            <button
              id="btn-bulk-complete"
              type="button"
              onClick={onBulkComplete}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
            >
              <span>Hoàn thành</span>
            </button>
            <button
              id="btn-bulk-delete"
              type="button"
              onClick={onBulkDelete}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded bg-rose-700 hover:bg-rose-800 text-white transition cursor-pointer"
            >
              <span>Xóa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
