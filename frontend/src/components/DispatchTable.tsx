import React from 'react';
import { formatDate } from '../utils/format';
import { 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Flame,
  Paperclip
} from 'lucide-react';
import { ColumnDefinition, Dispatch, DispatchStatus, UrgencyLevel } from '../types/dispatch';
import { resolveDispatchStatus } from '../services/excelService';
import { Pagination } from './Pagination';

interface DispatchTableProps {
  dispatches: Dispatch[];
  columns: ColumnDefinition[];
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onSort: (columnId: string) => void;
  selectedIds: string[];
  totalRawCount?: number;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewDetail: (dispatch: Dispatch) => void;
  onEdit: (dispatch: Dispatch) => void;
  onDelete: (id: string) => void;
  onQuickStatusChange: (id: string, newStatus: DispatchStatus) => void;
  onOpenAddModal: () => void;
  onOpenImport?: () => void;
  onRestoreSamples?: () => void;
}

export const DispatchTable: React.FC<DispatchTableProps> = ({
  dispatches,
  columns,
  sortConfig,
  onSort,
  selectedIds,
  totalRawCount = 0,
  onToggleSelectRow,
  onToggleSelectAll,
  onViewDetail,
  onEdit,
  onDelete,
  onQuickStatusChange,
  onOpenAddModal,
  onOpenImport,
  onRestoreSamples
}) => {
  const visibleColumns = columns.filter(c => c.visible);

  // Phân trang: Mặc định tối đa 10 văn bản trên 1 trang theo yêu cầu
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const totalPages = Math.max(1, Math.ceil(dispatches.length / pageSize));

  // Tự động kiểm tra trang hợp lệ khi số lượng công văn thay đổi
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedDispatches = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return dispatches.slice(start, start + pageSize);
  }, [dispatches, currentPage, pageSize]);

  const isAllSelected = dispatches.length > 0 && selectedIds.length === dispatches.length;

  // Helper for rendering Urgency badge
  const renderUrgencyBadge = (level?: UrgencyLevel) => {
    switch (level) {
      case 'HOA_TOC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
            <Flame className="w-3 h-3 text-red-600 animate-pulse" /> Hỏa tốc
          </span>
        );
      case 'THUONG_KHAN':
      case 'KHAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> 
          </span>
        );
      default:
        return null;
    }
  };

  // Helper for rendering Deadline badge (THỜI HẠN XỬ LÝ)
  const renderTimeBadge = (dispatch: Dispatch) => {
    const status = resolveDispatchStatus(dispatch);
    const text = dispatch.thoiHanXuLy || '';

    if (status === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {text || 'Đã hoàn thành'}
        </span>
      );
    }

    if (status === 'QUA_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {text || 'Quá hạn'}
        </span>
      );
    }

    if (status === 'SAP_DEN_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          {text || 'Sắp đến hạn'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-blue-500" />
        {text || 'Đang xử lý'}
      </span>
    );
  };

  // Render cell content based on column definition
  const renderCellContent = (dispatch: Dispatch, col: ColumnDefinition, rowIndex?: number) => {
    if (col.id === 'stt') {
      return <span className="font-semibold text-slate-600 text-sm">{rowIndex ?? 1}</span>;
    }

    // Handle File attachment column (custom or standard)
    if (col.type === 'file') {
      const val = col.isCustom ? dispatch.customFields?.[col.id] : (dispatch as any)[col.id];
      if (!val) {
        return <span className="text-slate-300 italic">-</span>;
      }
      const fileName = typeof val === 'object' && val.name ? val.name : String(val);
      const dataUrl = typeof val === 'object' ? val.dataUrl : null;
      return (
        <div className="flex items-center gap-1.5">
          {dataUrl ? (
            <a
              href={dataUrl}
              download={fileName}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition shadow-2xs max-w-[200px]"
              title={`Tải về: ${fileName}`}
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              <span className="truncate">{fileName}</span>
            </a>
          ) : (
            <span 
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded max-w-[200px]"
              title={fileName}
            >
              <Paperclip className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span className="truncate">{fileName}</span>
            </span>
          )}
        </div>
      );
    }

    // Custom column
    if (col.isCustom) {
      const val = dispatch.customFields?.[col.id];
      if (val === undefined || val === null || val === '') {
        return <span className="text-slate-300 italic">-</span>;
      }
      return <span className="text-slate-700">{String(val)}</span>;
    }

    // Standard columns
    switch (col.id) {
      case 'ngayGui':
      case 'ngayPhatHanh':
      case 'hanBaoCaoXuLy': {
        const val = (dispatch as any)[col.id];
        return <span className="text-xs text-slate-800 font-medium">{formatDate(val)}</span>;
      }

      case 'soCongVan':
        return (
          <span className="font-semibold text-xs text-slate-900 bg-slate-100/90 px-2 py-0.5 rounded border border-slate-200 inline-block w-fit">
            {dispatch.soCongVan}
          </span>
        );

      case 'tenCongVan':
        return (
          <button
            onClick={() => onViewDetail(dispatch)}
            className="text-left font-semibold text-slate-900 hover:text-blue-700 line-clamp-2 transition cursor-pointer"
            title={dispatch.tenCongVan}
          >
            {dispatch.tenCongVan}
          </button>
        );

      case 'thoiHanXuLy':
        return renderTimeBadge(dispatch);

      case 'donViBanHanh':
        return (
          <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-medium text-xs whitespace-nowrap">
            {dispatch.donViBanHanh || '-'}
          </span>
        );

      case 'nguoiThucHien':
        return (
          <span className="font-medium text-slate-800 text-xs whitespace-nowrap">
            {dispatch.nguoiThucHien || 'Chưa giao'}
          </span>
        );

      case 'ghiChu':
        return (
          <div className="text-xs text-slate-600 leading-relaxed" title={dispatch.ghiChu}>
            {dispatch.ghiChu || <span className="text-slate-300 italic">-</span>}
          </div>
        );

      default: {
        const val = (dispatch as any)[col.id];
        return <span>{val !== undefined ? String(val) : '-'}</span>;
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
      {/* Leadership Table Title Banner matching user's template */}
      <div 
        className="text-white text-center py-2.5 px-4 border-b shadow-xs"
        style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
      >
        <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase text-white">
          THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN
        </h2>
      </div>

      {/* Table container with horizontal & vertical scroll for td area */}
      <div id="admin-table-scroll-container" className="overflow-x-auto overflow-y-auto max-h-[640px]">
        <table className="w-full text-left border-collapse min-w-[1600px]">
          {/* Table Headers styled with light blue background like the sample image - Sticky Top */}
          <thead className="sticky top-0 z-10 shadow-2xs">
            <tr className="bg-[#b9d1ea] text-[#0f2942] border-b-2 border-slate-400">
              {/* Checkbox column */}
              <th className="w-12 min-w-[48px] px-3 py-3.5 text-center border-r-2 border-slate-400">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Chọn tất cả công văn"
                  className="rounded border-slate-400 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>

              {/* Dynamic Visible Columns */}
              {visibleColumns.map(col => (
                <th
                  key={col.id}
                  scope="col"
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => onSort(col.id)}
                  className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-r-2 border-slate-400 select-none cursor-pointer hover:bg-[#a6c3df] transition whitespace-nowrap text-center"
                >
                  <span>{col.label}</span>
                </th>
              ))}

              {/* Actions Column */}
              <th className="w-28 min-w-[110px] px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                THAO TÁC
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
            {dispatches.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 2}
                  className="text-center py-16 px-4 text-slate-500 bg-slate-50/40"
                >
                  <div className="max-w-lg mx-auto">
                    <h3 className="font-medium text-slate-400 text-sm sm:text-base">
                      Hiện không tìm thấy công văn
                    </h3>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDispatches.map((dispatch, index) => {
                const isSelected = selectedIds.includes(dispatch.id);
                const currentStatus = resolveDispatchStatus(dispatch);
                const isOverdue = currentStatus === 'QUA_HAN';
                const isCompleted = currentStatus === 'HOAN_THANH';

                return (
                  <tr
                    key={dispatch.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70'
                        : isOverdue
                        ? 'bg-rose-50/30 hover:bg-rose-50/60'
                        : isCompleted
                        ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                        : index % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-5 sm:py-6 text-center border-r border-slate-100 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(dispatch.id)}
                        aria-label={`Chọn công văn ${dispatch.soCongVan}`}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Columns */}
                    {visibleColumns.map(col => (
                      <td
                        key={col.id}
                        style={{ width: col.width, minWidth: col.width }}
                        className="px-4 py-5 sm:py-6 border-r border-slate-100 text-slate-700 align-middle"
                      >
                        {renderCellContent(dispatch, col, (currentPage - 1) * pageSize + index + 1)}
                      </td>
                    ))}

                    {/* Actions */}
                    <td className="px-3 py-5 sm:py-6 text-center whitespace-nowrap align-middle">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Detail */}
                        <button
                          id={`btn-view-${dispatch.id}`}
                          onClick={() => onViewDetail(dispatch)}
                          title="Xem chi tiết & Ý kiến chỉ đạo"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          id={`btn-edit-${dispatch.id}`}
                          onClick={() => onEdit(dispatch)}
                          title="Chỉnh sửa công văn"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          id={`btn-delete-${dispatch.id}`}
                          onClick={() => onDelete(dispatch.id)}
                          title="Xóa công văn"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Pagination (< 1 - 2 - 3 - 4 ... >) - LUÔN FREEZE THẺ DIV CUỐI */}
      <div className="sticky bottom-0 z-20 shadow-xs">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={dispatches.length}
          pageSize={pageSize}
          onPageChange={(p) => {
            setCurrentPage(p);
            const container = document.getElementById('admin-table-scroll-container');
            if (container) {
              container.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          selectedCount={selectedIds.length}
        />
      </div>
    </div>
  );
};