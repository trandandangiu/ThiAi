import React from 'react';
import { 
  Download, 
  Plus
} from 'lucide-react';

interface ActionBarProps {
  onOpenImport?: () => void;
  onExportExcel: () => void;
  onOpenAddModal: () => void;
  onOpenColumnManager: () => void;
  onOpenGoogleSheets?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  onExportExcel,
  onOpenAddModal,
  onOpenColumnManager,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-semibold text-slate-700">
          Chức năng:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Xuất Excel */}
        <button
          id="btn-export-excel"
          type="button"
          onClick={onExportExcel}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
          title="Xuất danh sách công văn đang lọc sang file Excel"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Xuất Excel</span>
        </button>

        {/* Tùy chỉnh cột */}
        <button
          id="btn-manage-columns"
          type="button"
          onClick={onOpenColumnManager}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
          title="Tùy biến cột dữ liệu linh hoạt"
        >
          <span>Tùy chỉnh</span>
        </button>

        {/* Thêm mới */}
        <button
          id="btn-add-dispatch"
          type="button"
          onClick={onOpenAddModal}
          style={{ backgroundColor: '#FFD700', color: '#7F0E0E' }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg hover:bg-amber-300 shadow-xs transition cursor-pointer border border-amber-400/50"
        >
          <Plus className="w-4 h-4 text-[#7F0E0E]" />
          <span>Thêm mới</span>
        </button>
      </div>
    </div>
  );
};
