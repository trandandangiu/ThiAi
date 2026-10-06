// src/components/vt/VtPvtLeaderboard.tsx
import React, { useMemo } from 'react';
import { Trophy, Medal, Award, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { VtPvtStat } from '../../types/vt';

interface VtPvtLeaderboardProps {
  pvtStats: VtPvtStat[];
  onSelectPvt?: (pvt: VtPvtStat) => void;
}

const COLORS = [
  '#B91C1C', '#DC2626', '#EA580C', '#F59E0B', '#EAB308',
  '#65A30D', '#16A34A', '#059669', '#0D9488', '#0891B2',
  '#0284C7', '#2563EB',
];

export const VtPvtLeaderboard: React.FC<VtPvtLeaderboardProps> = ({
  pvtStats,
  onSelectPvt,
}) => {
  // Sort by completionRate desc, then by total desc
  const sorted = useMemo(() => {
    return [...pvtStats].sort((a, b) => {
      if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
      return b.total - a.total;
    });
  }, [pvtStats]);

  const maxTotal = useMemo(
    () => Math.max(...pvtStats.map(p => p.total), 1),
    [pvtStats]
  );

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bảng xếp hạng 12 Phó Viện Trưởng
            </h3>
            <p className="text-xs text-slate-500">
              Xếp theo tỷ lệ hoàn thành • Click để xem chi tiết
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {pvtStats.length} PVT
        </span>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        {sorted.map((pvt, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          const barWidth = pvt.total > 0 ? (pvt.total / maxTotal) * 100 : 0;
          const color = COLORS[idx % COLORS.length];

          return (
            <div
              key={pvt.id}
              onClick={() => onSelectPvt?.(pvt)}
              className="px-5 py-3.5 hover:bg-slate-50/80 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                {/* Rank badge */}
                <div className="w-8 shrink-0 flex justify-center">
                  {rank === 1 && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {rank === 2 && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-md">
                      <Medal className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {rank === 3 && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-md">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {rank > 3 && (
                    <span className="text-xs font-black text-slate-400 font-mono">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Avatar + Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className={`text-xs font-bold truncate ${isTop3 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {pvt.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                      {pvt.roomCode}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                      }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-medium">
                    <span className="text-slate-500">
                      <strong className="text-slate-800">{pvt.total}</strong> CV
                    </span>
                    <span className="text-emerald-600">
                      ✓ <strong>{pvt.completed}</strong>
                    </span>
                    <span className="text-amber-600">
                      ⏱ <strong>{pvt.inProgress}</strong>
                    </span>
                    {pvt.overdue > 0 && (
                      <span className="text-rose-600">
                        ⚠ <strong>{pvt.overdue}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: rate + arrow */}
                <div className="shrink-0 flex items-center gap-2.5">
                  <div className="text-right">
                    <div
                      className={`text-lg font-black tabular-nums leading-none ${pvt.completionRate >= 70
                          ? 'text-emerald-600'
                          : pvt.completionRate >= 40
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                    >
                      {pvt.completed}/{pvt.total}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Đã xong
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </div>
          );
        })}

        {pvtStats.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có dữ liệu PVT để xếp hạng
          </div>
        )}
      </div>
    </div>
  );
};

export default VtPvtLeaderboard;