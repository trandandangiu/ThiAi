// src/components/vt/VtPvtDetailDrawer.tsx
import React, { useMemo } from 'react';
import {
  X,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
  ChevronRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { VtPvtStat } from '../../types/vt';
import { Dispatch } from '../../types/dispatch';

interface VtPvtDetailDrawerProps {
  pvtStat: VtPvtStat | null;
  allDispatches: Dispatch[];
  onClose: () => void;
  onViewDispatch?: (dispatch: Dispatch) => void;
}

export const VtPvtDetailDrawer: React.FC<VtPvtDetailDrawerProps> = ({
  pvtStat,
  allDispatches,
  onClose,
  onViewDispatch,
}) => {
  if (!pvtStat) return null;

  const pvtDispatches = useMemo(() => {
    return allDispatches
      .filter(d =>
        d.assignedPvtId === pvtStat.id ||
        d.assignedPvtName === pvtStat.name ||
        (pvtStat.roomCode && d.assignedPvtName?.includes(pvtStat.roomCode))
      )
      .sort((a, b) => {
        const da = a.ngayGui ? new Date(a.ngayGui).getTime() : 0;
        const db = b.ngayGui ? new Date(b.ngayGui).getTime() : 0;
        return db - da;
      });
  }, [allDispatches, pvtStat]);

  // Recently 5
  const recentDispatches = useMemo(() => pvtDispatches.slice(0, 5), [pvtDispatches]);

  // Count by urgency
  const urgencyCounts = useMemo(() => {
    const counts = { HOA_TOC: 0, KHAN: 0, THUONG: 0 };
    pvtDispatches.forEach(d => {
      const key = (d.mucDoKhan || 'THUONG') as keyof typeof counts;
      if (key in counts) counts[key]++;
    });
    return counts;
  }, [pvtDispatches]);

  const total = pvtStat.total;
  const completed = pvtStat.completed;
  const inProgress = pvtStat.inProgress;
  const overdue = pvtStat.overdue;

  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const inProgressPct = total > 0 ? (inProgress / total) * 100 : 0;
  const overduePct = total > 0 ? (overdue / total) * 100 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 bg-black/20 px-2 py-0.5 rounded-full border border-blue-300/30">
                    {pvtStat.roomCode}
                  </span>
                  {pvtStat.completionRate >= 70 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-200 bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-400/40">
                      <Trophy className="w-3 h-3" />
                      Hiệu suất cao
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black">{pvtStat.name}</h2>
                <p className="text-xs text-blue-100 mt-0.5">
                  {total} công văn được giao
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <KpiBadge icon={FileText} label="Tổng" value={total} tone="slate" />
            <KpiBadge icon={CheckCircle2} label="Xong" value={completed} tone="emerald" />
            <KpiBadge icon={Clock} label="Đang" value={inProgress} tone="amber" />
            <KpiBadge icon={AlertTriangle} label="Quá hạn" value={overdue} tone="rose" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Progress breakdown */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              Phân bổ tiến độ
            </h3>
            <div className="h-3 rounded-full overflow-hidden flex bg-slate-100">
              <div
                className="bg-emerald-500 transition-all duration-700"
                style={{ width: `${completedPct}%` }}
                title={`Hoàn thành: ${completed}`}
              />
              <div
                className="bg-amber-500 transition-all duration-700"
                style={{ width: `${inProgressPct}%` }}
                title={`Đang xử lý: ${inProgress}`}
              />
              <div
                className="bg-rose-500 transition-all duration-700"
                style={{ width: `${overduePct}%` }}
                title={`Quá hạn: ${overdue}`}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Hoàn thành ({completed})
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Đang xử lý ({inProgress})
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Quá hạn ({overdue})
              </span>
            </div>
          </div>

          {/* Urgency breakdown */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              Mức độ khẩn
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="text-[10px] font-black uppercase text-rose-700">
                  Hỏa tốc
                </div>
                <div className="text-2xl font-black text-rose-900 mt-0.5">
                  {urgencyCounts.HOA_TOC}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] font-black uppercase text-amber-700">
                  Khẩn
                </div>
                <div className="text-2xl font-black text-amber-900 mt-0.5">
                  {urgencyCounts.KHAN}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-black uppercase text-slate-600">
                  Thường
                </div>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {urgencyCounts.THUONG}
                </div>
              </div>
            </div>
          </div>

          {/* Recent dispatches */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                5 công văn gần nhất
              </h3>
              <span className="text-[11px] font-bold text-slate-500">
                {pvtDispatches.length} tổng cộng
              </span>
            </div>

            <div className="space-y-2">
              {recentDispatches.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Chưa có công văn nào được giao cho PVT này
                </div>
              )}

              {recentDispatches.map(d => (
                <div
                  key={d.id}
                  onClick={() => onViewDispatch?.(d)}
                  className="group p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono font-black text-xs text-slate-900">
                      {d.soCongVan}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${d.trangThai === 'HOAN_THANH'
                        ? 'bg-emerald-100 text-emerald-800'
                        : d.trangThai === 'QUA_HAN'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                        }`}
                    >
                      {d.trangThai === 'HOAN_THANH'
                        ? 'Xong'
                        : d.trangThai === 'QUA_HAN'
                          ? 'Quá hạn'
                          : 'Đang xử lý'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 line-clamp-2 mb-1">
                    {d.tenCongVan}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono">
                      Hạn: {d.hanBaoCaoXuLy || '—'}
                    </span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              Đã hoàn thành:{' '}
              <strong
                className={
                  pvtStat.completionRate >= 70
                    ? 'text-emerald-700'
                    : pvtStat.completionRate >= 40
                      ? 'text-amber-700'
                      : 'text-rose-700'
                }
              >
                {pvtStat.completed}/{pvtStat.total}
              </strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </>
  );
};

// ============================================
// KPI BADGE
// ============================================
interface KpiBadgeProps {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: 'slate' | 'emerald' | 'amber' | 'rose';
}

const KpiBadge: React.FC<KpiBadgeProps> = ({ icon: Icon, label, value, tone }) => {
  const toneClasses = {
    slate: 'bg-white/10 border-white/20',
    emerald: 'bg-emerald-500/20 border-emerald-400/40',
    amber: 'bg-amber-500/20 border-amber-400/40',
    rose: 'bg-rose-500/20 border-rose-400/40',
  }[tone];

  return (
    <div className={`p-2 rounded-xl backdrop-blur-sm border ${toneClasses}`}>
      <Icon className="w-3 h-3 text-white/70 mb-1" />
      <div className="text-lg font-black text-white leading-none">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-white/70 mt-0.5">
        {label}
      </div>
    </div>
  );
};

export default VtPvtDetailDrawer;