// src/components/pvt/PvtPendingVtView.tsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  Send,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  X,
  FileText,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';

interface PvtPendingVtViewProps {
  dispatches: Dispatch[];
  onOpenSubmitVt: (d: Dispatch) => void;
  onOpenDetail: (d: Dispatch) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

export const PvtPendingVtView: React.FC<PvtPendingVtViewProps> = ({
  dispatches,
  onOpenSubmitVt,
  onOpenDetail,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // KPI
  const kpis = useMemo(() => {
    const total = dispatches.length;
    const urgent = dispatches.filter(d => d.mucDoKhan === 'HOA_TOC').length;
    const sapQuaHan = dispatches.filter(d => {
      if (!d.hanBaoCaoXuLy) return false;
      const han = new Date(d.hanBaoCaoXuLy);
      const now = new Date();
      const diff = (han.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 2;
    }).length;
    const quaHan = dispatches.filter(d => {
      if (!d.hanBaoCaoXuLy) return false;
      return new Date(d.hanBaoCaoXuLy) < new Date();
    }).length;
    return { total, urgent, sapQuaHan, quaHan };
  }, [dispatches]);

  // Filter
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return dispatches;
    const q = searchTerm.toLowerCase();
    return dispatches.filter(
      d =>
        (d.soCongVan || '').toLowerCase().includes(q) ||
        (d.tenCongVan || '').toLowerCase().includes(q) ||
        (d.donViBanHanh || '').toLowerCase().includes(q)
    );
  }, [dispatches, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: '#B71C1C' }}
          >
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Hồ sơ chờ trình Viện trưởng
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {kpis.total} hồ sơ cần duyệt
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Chờ trình" value={kpis.total} icon={FileText} color="purple" />
        <KpiCard label="Hỏa tốc" value={kpis.urgent} icon={Flame} color="red" alert={kpis.urgent > 0} />
        <KpiCard label="Sắp quá hạn" value={kpis.sapQuaHan} icon={Clock} color="amber" alert={kpis.sapQuaHan > 0} />
        <KpiCard label="Đã quá hạn" value={kpis.quaHan} icon={AlertTriangle} color="rose" alert={kpis.quaHan > 0} />
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative">
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
                <th className="py-3 px-3 min-w-[200px]">Báo cáo của TP</th>
                <th className="py-3 px-3 w-28">Hạn xử lý</th>
                <th className="py-3 px-3 w-40 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16">
                    <div className="text-center">
                      <div
                        className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center mx-auto mb-3"
                        style={{ borderColor: '#B71C1C40' }}
                      >
                        <CheckCircle2 className="w-7 h-7" style={{ color: '#B71C1C50' }} />
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {dispatches.length === 0
                          ? 'Không có hồ sơ nào chờ trình'
                          : 'Không có hồ sơ khớp bộ lọc'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {dispatches.length === 0
                          ? 'Khi TP báo cáo xong, hồ sơ sẽ hiện tại đây để PVT trình lên VT'
                          : 'Thử điều chỉnh từ khóa tìm kiếm'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((d, idx) => {
                  const isQuaHan = d.hanBaoCaoXuLy && new Date(d.hanBaoCaoXuLy) < new Date();

                  return (
                    <tr key={d.id} className="hover:bg-red-50/30 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-black text-[11px] text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {d.soCongVan || '—'}
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
                        {d.donViBanHanh && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {d.donViBanHanh}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {d.baoCaoTienDo ? (
                          <div className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded border border-emerald-200 line-clamp-2">
                            {d.baoCaoTienDo}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            TP chưa báo cáo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            isQuaHan ? 'text-rose-700' : 'text-slate-700'
                          }`}
                        >
                          {formatDate(d.hanBaoCaoXuLy)}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenDetail(d)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenSubmitVt(d)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition cursor-pointer active:scale-95 shadow-xs"
                            style={{ backgroundColor: '#B71C1C' }}
                          >
                            <Send className="w-3 h-3" />
                            Trình VT
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

        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Hiển thị <strong className="text-slate-900">{filtered.length}</strong> /{' '}
              <strong className="text-slate-900">{dispatches.length}</strong> hồ sơ
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// KPI CARD
// ============================================
const KpiCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'purple' | 'red' | 'amber' | 'rose';
  alert?: boolean;
}> = ({ label, value, icon: Icon, color, alert }) => {
  const colors = {
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-600', text: 'text-purple-800' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-600', text: 'text-red-800' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-600', text: 'text-amber-800' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-600', text: 'text-rose-800' },
  }[color];

  return (
    <div className={`p-3.5 rounded-2xl ${colors.bg} border ${colors.border} shadow-xs relative`}>
      {alert && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-pulse border-2 border-white" />
      )}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-[10px] font-black ${colors.text} uppercase tracking-wider`}>
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg ${colors.icon} text-white flex items-center justify-center shadow-sm`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900 leading-none tabular-nums">
        {value}
      </div>
    </div>
  );
};

export default PvtPendingVtView;