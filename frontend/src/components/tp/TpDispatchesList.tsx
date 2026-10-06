// src/components/tp/TpDispatchesList.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  X,
  RefreshCw,
  FileText,
  Send,
  Paperclip,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';

interface TpDispatchesListProps {
  title: string;
  dispatches: Dispatch[];
  onOpenDetail: (d: Dispatch) => void;
  onOpenReport: (d: Dispatch) => void;
  onMarkComplete: (d: Dispatch) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

const getStatusInfo = (d: Dispatch) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (d.trangThai === 'HOAN_THANH') {
    return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
  }
  if (d.hanBaoCaoXuLy && new Date(d.hanBaoCaoXuLy) < today) {
    return { label: 'Quá hạn', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle };
  }
  if (d.trangThai === 'CHO_PVT_DUYET') {
    return { label: 'Chờ PVT duyệt', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Clock };
  }
  if (d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO') {
    return { label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
  }
  return { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Send };
};

export const TpDispatchesList: React.FC<TpDispatchesListProps> = ({
  title,
  dispatches,
  onOpenDetail,
  onOpenReport,
  onMarkComplete,
  onRefresh,
  isLoading,
  emptyMessage = 'Không có công văn nào',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return dispatches.filter(d => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          (d.soCongVan || '').toLowerCase().includes(q) ||
          (d.tenCongVan || '').toLowerCase().includes(q) ||
          (d.donViBanHanh || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter !== 'ALL' && d.trangThai !== statusFilter) return false;
      if (urgencyFilter !== 'ALL' && d.mucDoKhan !== urgencyFilter) return false;

      return true;
    });
  }, [dispatches, searchTerm, statusFilter, urgencyFilter]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: '#B71C1C' }}
          >
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {filtered.length} / {dispatches.length} công văn
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: '#B71C1C' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm số CV, trích yếu, đơn vị..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CHO_TP_XU_LY">Chờ xử lý</option>
            <option value="DANG_XU_LY">Đang xử lý</option>
            <option value="CHO_PVT_DUYET">Chờ PVT duyệt</option>
            <option value="HOAN_THANH">Hoàn thành</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 cursor-pointer text-slate-700"
          >
            <option value="ALL">Mọi mức độ</option>
            <option value="HOA_TOC">Hỏa tốc</option>
            <option value="KHAN">Khẩn</option>
            <option value="THUONG">Thường</option>
          </select>

          {(searchTerm || statusFilter !== 'ALL' || urgencyFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setUrgencyFilter('ALL');
              }}
              className="px-2.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="text-white font-bold uppercase text-[10px] tracking-wider"
                style={{ backgroundColor: '#B71C1C' }}
              >
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3 w-32">Số CV</th>
                <th className="py-3 px-3 min-w-[280px]">Trích yếu</th>
                <th className="py-3 px-3 w-40">Đơn vị ban hành</th>
                <th className="py-3 px-3 w-28">Hạn xử lý</th>
                <th className="py-3 px-3 w-32 text-center">Trạng thái</th>
                <th className="py-3 px-3 w-44 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-7 h-7 text-slate-300" />
                      </div>
                      <div className="text-sm font-bold text-slate-700">{emptyMessage}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((d, idx) => {
                  const status = getStatusInfo(d);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={d.id} className="hover:bg-red-50/30 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-[11px] text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {d.soCongVan}
                          </span>
                          {d.mucDoKhan === 'HOA_TOC' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800 border border-red-200">
                              <Flame className="w-2.5 h-2.5" />
                              HỎA TỐC
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div
                          onClick={() => onOpenDetail(d)}
                          className="font-semibold text-slate-900 hover:text-red-700 cursor-pointer line-clamp-2"
                        >
                          {d.tenCongVan}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 text-[11px] truncate max-w-[180px]">
                        {d.donViBanHanh || '—'}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 text-[11px]">
                        {formatDate(d.hanBaoCaoXuLy)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenDetail(d)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {d.trangThai !== 'HOAN_THANH' && (
                            <>
                              <button
                                onClick={() => onOpenReport(d)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition cursor-pointer active:scale-95 shadow-xs"
                                style={{ backgroundColor: '#B71C1C' }}
                              >
                                <Send className="w-3 h-3" />
                                Báo cáo
                              </button>
                              <button
                                onClick={() => onMarkComplete(d)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition cursor-pointer active:scale-95 shadow-xs"
                                title="Đánh dấu hoàn thành (xử lý ngoài)"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Xong
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Hiển thị <strong className="text-slate-900">{filtered.length}</strong> /{' '}
              <strong className="text-slate-900">{dispatches.length}</strong> công văn
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TpDispatchesList;