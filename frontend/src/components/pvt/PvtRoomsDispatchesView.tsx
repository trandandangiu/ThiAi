// src/components/pvt/PvtRoomsDispatchesView.tsx
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
  Building,
  Download,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';

interface PvtRoomsDispatchesViewProps {
  dispatches: Dispatch[];
  subordinateRooms: User[];
  onOpenDetail: (d: Dispatch) => void;
  onOpenAssignTp?: (d: Dispatch) => void;
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
  if (d.trangThai === 'CHO_TP_XU_LY') {
    return { label: 'TP đang xử lý', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock };
  }
  return { label: 'Đang xử lý', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
};

export const PvtRoomsDispatchesView: React.FC<PvtRoomsDispatchesViewProps> = ({
  dispatches,
  subordinateRooms,
  onOpenDetail,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRoomCode, setActiveRoomCode] = useState<string>('ALL');

  // Build room list với count
  const roomsWithCount = useMemo(() => {
    return subordinateRooms.map(room => {
      const count = dispatches.filter(
        d => d.assignedTpId === room.id || d.assignedTpId === room.roomCode
      ).length;
      return { ...room, count };
    });
  }, [subordinateRooms, dispatches]);

  // KPI
  const kpis = useMemo(() => {
    const total = dispatches.length;
    const hoanThanh = dispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const quaHan = dispatches.filter(d => {
      if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
      return new Date(d.hanBaoCaoXuLy) < new Date();
    }).length;
    const dangXuLy = total - hoanThanh - quaHan;
    return { total, hoanThanh, quaHan, dangXuLy };
  }, [dispatches]);

  // Filter
  const filtered = useMemo(() => {
    let result = dispatches;

    if (activeRoomCode !== 'ALL') {
      const room = subordinateRooms.find(r => r.roomCode === activeRoomCode);
      if (room) {
        result = result.filter(
          d => d.assignedTpId === room.id || d.assignedTpId === room.roomCode
        );
      }
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        d =>
          (d.soCongVan || '').toLowerCase().includes(q) ||
          (d.tenCongVan || '').toLowerCase().includes(q) ||
          (d.assignedTpName || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [dispatches, subordinateRooms, activeRoomCode, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
            style={{ backgroundColor: '#B71C1C' }}
          >
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Công văn của phòng phụ trách
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {subordinateRooms.length} phòng · {kpis.total} công văn
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
        <KpiCard label="Tổng công văn" value={kpis.total} icon={FileText} color="slate" />
        <KpiCard label="Đang xử lý" value={kpis.dangXuLy} icon={Clock} color="blue" />
        <KpiCard label="Hoàn thành" value={kpis.hoanThanh} icon={CheckCircle2} color="emerald" />
        <KpiCard label="Quá hạn" value={kpis.quaHan} icon={AlertTriangle} color="rose" alert={kpis.quaHan > 0} />
      </div>

      {/* Room Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1.5 flex-wrap">
        <RoomTab
          active={activeRoomCode === 'ALL'}
          onClick={() => setActiveRoomCode('ALL')}
          label="📋 Tất cả"
          count={dispatches.length}
        />
        {roomsWithCount.map(room => (
          <RoomTab
            key={room.id}
            active={activeRoomCode === room.roomCode}
            onClick={() => setActiveRoomCode(room.roomCode || '')}
            label={`${room.roomCode}`}
            count={room.count}
          />
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm số CV, trích yếu, phòng..."
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
                <th className="py-3 px-3 w-40">Phòng / TP</th>
                <th className="py-3 px-3 w-28">Hạn xử lý</th>
                <th className="py-3 px-3 w-36 text-center">Trạng thái</th>
                <th className="py-3 px-3 w-20 text-center">Xem</th>
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
                        <Building className="w-7 h-7" style={{ color: '#B71C1C50' }} />
                      </div>
                      <div className="text-sm font-bold text-slate-700">
                        {activeRoomCode === 'ALL'
                          ? 'Chưa có công văn nào của phòng phụ trách'
                          : `Phòng ${activeRoomCode} chưa có công văn`}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Khi TP nhận và xử lý, công văn sẽ xuất hiện tại đây
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
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            <Building className="w-3 h-3" />
                            {d.assignedTpName}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
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

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenDetail(d)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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

// ============================================
// ROOM TAB
// ============================================
const RoomTab: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
      active ? 'text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'
    }`}
    style={active ? { backgroundColor: '#B71C1C' } : undefined}
  >
    <span>{label}</span>
    <span
      className={`min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
        active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
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
  color: 'slate' | 'blue' | 'emerald' | 'rose';
  alert?: boolean;
}> = ({ label, value, icon: Icon, color, alert }) => {
  const colors = {
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-600', text: 'text-slate-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-600', text: 'text-blue-800' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-600', text: 'text-emerald-800' },
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

export default PvtRoomsDispatchesView;