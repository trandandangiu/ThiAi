import React from 'react';
import { 
  FileStack, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { DispatchFilter, DispatchStatus, LeadershipDashboardStats } from '../types/dispatch';

interface DashboardStatsProps {
  stats: LeadershipDashboardStats;
  currentFilter: DispatchFilter;
  onFilterChange: (updates: Partial<DispatchFilter>) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  currentFilter,
  onFilterChange
}) => {
  const handleCardClick = (status: DispatchStatus | 'ALL') => {
    if ((currentFilter.status === status && !currentFilter.overdueOnly) || (status === 'QUA_HAN' && currentFilter.overdueOnly)) {
      onFilterChange({
        status: 'ALL',
        overdueOnly: false
      });
    } else {
      onFilterChange({
        status: status,
        overdueOnly: status === 'QUA_HAN'
      });
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* 1. Tổng công văn */}
      <div
        id="stat-card-total"
        onClick={() => handleCardClick('ALL')}
        className={`p-3.5 rounded-xl border transition cursor-pointer ${
          currentFilter.status === 'ALL' && !currentFilter.overdueOnly
            ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng công văn</span>
          <FileStack className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
        </div>
      </div>

      {/* 2. Đang xử lý */}
      <div
        id="stat-card-processing"
        onClick={() => handleCardClick('DANG_XU_LY')}
        className={`p-3.5 rounded-xl border transition cursor-pointer ${
          currentFilter.status === 'DANG_XU_LY'
            ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Đang xử lý</span>
          <Clock className="w-4 h-4 text-sky-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-sky-950">{stats.dangXuLy}</span>
        </div>
      </div>

      {/* 3. Sắp đến hạn */}
      <div
        id="stat-card-upcoming"
        onClick={() => handleCardClick('SAP_DEN_HAN')}
        className={`p-3.5 rounded-xl border transition cursor-pointer ${
          currentFilter.status === 'SAP_DEN_HAN'
            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Sắp đến hạn</span>
          <AlertCircle className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-amber-950">{stats.sapDenHan}</span>
        </div>
      </div>

      {/* 4. Quá hạn (Cảnh báo đỏ) */}
      <div
        id="stat-card-overdue"
        onClick={() => handleCardClick('QUA_HAN')}
        className={`p-3.5 rounded-xl border transition cursor-pointer ${
          currentFilter.status === 'QUA_HAN' || currentFilter.overdueOnly
            ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Quá hạn xử lý</span>
          <AlertTriangle className="w-4 h-4 text-rose-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-rose-700">{stats.quaHan}</span>
        </div>
      </div>

      {/* 5. Đã hoàn thành */}
      <div
        id="stat-card-completed"
        onClick={() => handleCardClick('HOAN_THANH')}
        className={`p-3.5 rounded-xl border transition cursor-pointer ${
          currentFilter.status === 'HOAN_THANH'
            ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Đã hoàn thành</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-emerald-900">{stats.hoanThanh}</span>
        </div>
      </div>
    </div>
  );
};
