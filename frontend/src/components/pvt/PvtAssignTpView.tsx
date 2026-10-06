// src/components/pvt/PvtAssignTpView.tsx
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
  RefreshCw,
  FileText,
  Users,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';

interface PvtAssignTpViewProps {
  dispatches: Dispatch[];
  subordinateRooms: User[];
  allTpUsers: User[];
  onOpenAssignTp: (d: Dispatch) => void;
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

const getStatusInfo = (d: Dispatch) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (d.trangThai === 'HOAN_THANH') {
    return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
  }

  if (d.hanBaoCaoXuLy) {
    const han = new Date(d.hanBaoCaoXuLy);
    if (han < today) {
      return { label: 'Quá hạn', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle };
    }
  }

  if (d.assignedTpId) {
    return { label: 'Đã giao TP', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Send };
  }

  return { label: 'Cần giao', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
};

export const PvtAssignTpView: React.FC<PvtAssignTpViewProps> = ({
  dispatches,
  subordinateRooms,
  allTpUsers,
  onOpenAssignTp,
  onOpenDetail,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'assigned' | 'all'>('pending');

  // KPI
  const kpis = useMemo(() => {
    const total = dispatches.length;
    const pending = dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH').length;
    const assigned = dispatches.filter(d => d.assignedTpId).length;
    const done = dispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    return { total, pending, assigned, done };
  }, [dispatches]);

  // Filter theo subtab
  const subtabFiltered = useMemo(() => {
    if (activeSubTab === 'pending') return dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH');
    if (activeSubTab === 'assigned') return dispatches.filter(d => d.assignedTpId);
    return dispatches;
  }, [dispatches, activeSubTab]);

  // Filter theo search
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return subtabFiltered;
    const q = searchTerm.toLowerCase();
    return subtabFiltered.filter(
      d =>
        (d.soCongVan || '').toLowerCase().includes(q) ||
        (d.tenCongVan || '').toLowerCase().includes(q) ||
        (d.donViBanHanh || '').toLowerCase().includes(q)
    );
  }, [subtabFiltered, searchTerm]);

  // Danh sách TP ưu tiên
  const priorityTps = useMemo(() => {
    const subordinateIds = subordinateRooms.map(r => r.id);
    return allTpUsers.sort((a, b) => {
      const aSub = subordinateIds.includes(a.id) ? 0 : 1;
      const bSub = subordinateIds.includes(b.id) ? 0 : 1;
      return aSub - bSub;
    });
  }, [allTpUsers, subordinateRooms]);

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
              Giao cho Trưởng phòng
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {kpis.pending} chờ giao · {kpis.assigned} đã giao
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
        <KpiCard label="Tổng nhận" value={kpis.total} icon={FileText} color="slate" />
        <KpiCard label="Cần giao ngay" value={kpis.pending} icon={Clock} color="amber" alert={kpis.pending > 0} />
        <KpiCard label="Đã phân công" value={kpis.assigned} icon={Users} color="blue" />
        <KpiCard label="Hoàn thành" value={kpis.done} icon={CheckCircle2} color="emerald" />
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1.5 flex-wrap">
        <SubTab
          active={activeSubTab === 'pending'}
          onClick={() => setActiveSubTab('pending')}
          label="⏳ Cần giao ngay"
          count={kpis.pending}
          highlight
        />
        <SubTab
          active={activeSubTab === 'assigned'}
          onClick={() => setActiveSubTab('assigned')}
          label="✅ Đã phân công"
          count={kpis.assigned}
        />
        <SubTab
          active={activeSubTab === 'all'}
          onClick={() => setActiveSubTab('all')}
          label="📋 Tất cả"
          count={kpis.total}
        />
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
                <th className="py-3 px-3 w-40">TP đã giao</th>
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
                      <div
                        className="w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center mx-auto mb-3"
                        style={{ borderColor: '#B71C1C40' }}
                      >
                        <CheckCircle2 className="w-7 h-7" style={{ color: '#B71C1C50' }} />
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {activeSubTab === 'pending'
                          ? 'Tất cả công văn đã được giao cho phòng'
                          : activeSubTab === 'assigned'
                          ? 'Chưa có công văn nào được giao'
                          : 'Không có công văn khớp bộ lọc'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {activeSubTab === 'pending'
                          ? 'Không còn việc nào cần giao'
                          : 'Khi giao việc, công văn sẽ xuất hiện tại đây'}
                      </div>
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
                        {d.assignedTpName ? (
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            {d.assignedTpName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Chưa giao
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">
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
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {d.trangThai !== 'HOAN_THANH' && (
                            <button
                              onClick={() => onOpenAssignTp(d)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition cursor-pointer active:scale-95 shadow-xs"
                              style={{ backgroundColor: '#B71C1C' }}
                            >
                              <Send className="w-3 h-3" />
                              {d.assignedTpId ? 'Đổi TP' : 'Giao ngay'}
                            </button>
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
              <strong className="text-slate-900">{subtabFiltered.length}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// SUB-TAB
// ============================================
const SubTab: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  highlight?: boolean;
}> = ({ active, onClick, label, count, highlight }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
      active
        ? 'text-white shadow-md'
        : 'text-slate-700 hover:bg-slate-100'
    }`}
    style={active ? { backgroundColor: '#B71C1C' } : undefined}
  >
    <span>{label}</span>
    <span
      className={`min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
        active
          ? 'bg-white/20 text-white'
          : highlight && count > 0
          ? 'bg-rose-100 text-rose-700 border border-rose-200'
          : 'bg-slate-200 text-slate-700'
      }`}
    >
      {count}
    </span>
  </button>
);

// ============================================
// KPI CARD
// ============================================
const KpiCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'slate' | 'amber' | 'blue' | 'emerald';
  alert?: boolean;
}> = ({ label, value, icon: Icon, color, alert }) => {
  const colors = {
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-600', text: 'text-slate-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-600', text: 'text-amber-800' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-600', text: 'text-blue-800' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-600', text: 'text-emerald-800' },
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

export default PvtAssignTpView;