// src/components/vt/VtDeptHeatmap.tsx
import React, { useMemo } from 'react';
import { Grid3x3 } from 'lucide-react';
import { VtHeatmapCell, VtTpStat } from '../../types/vt';

interface VtDeptHeatmapProps {
  heatmapData: VtHeatmapCell[];
  tpStats: VtTpStat[];
}

const getHeatColor = (count: number, max: number): string => {
  if (count === 0) return '#F8FAFC';
  const intensity = Math.min(count / Math.max(max, 1), 1);
  if (intensity >= 0.75) return '#991B1B';
  if (intensity >= 0.5) return '#DC2626';
  if (intensity >= 0.25) return '#F59E0B';
  return '#FCD34D';
};

const getTextColor = (count: number, max: number): string => {
  if (count === 0) return '#CBD5E1';
  const intensity = Math.min(count / Math.max(max, 1), 1);
  return intensity >= 0.5 ? '#FFFFFF' : '#78350F';
};

export const VtDeptHeatmap: React.FC<VtDeptHeatmapProps> = ({
  heatmapData,
  tpStats,
}) => {
  // Get all unique dates (7 days)
  const dates = useMemo(() => {
    const unique = Array.from(new Set(heatmapData.map(c => c.date)));
    return unique.sort();
  }, [heatmapData]);

  // Max count for intensity
  const maxCount = useMemo(
    () => Math.max(...heatmapData.map(c => c.count), 1),
    [heatmapData]
  );

  // Build lookup: {deptCode: {date: count}}
  const lookup = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    heatmapData.forEach(cell => {
      if (!map[cell.deptCode]) map[cell.deptCode] = {};
      map[cell.deptCode][cell.date] = cell.count;
    });
    return map;
  }, [heatmapData]);

  // Only show depts that have data OR all 12
  const depts = useMemo(() => {
    return tpStats
      .filter(t => t.code)
      .sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));
  }, [tpStats]);

  const formatDateLabel = (date: string): string => {
    const d = new Date(date);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[d.getDay()]} ${d.getDate()}`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shadow-md">
            <Grid3x3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bản đồ nhiệt 12 phòng ban × 7 ngày
            </h3>
            <p className="text-xs text-slate-500">
              Mật độ công văn tiếp nhận theo ngày tại từng phòng
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Mật độ
          </span>
          <div className="flex items-center gap-1">
            {[
              { color: '#F8FAFC', label: '0' },
              { color: '#FCD34D', label: '1' },
              { color: '#F59E0B', label: '2' },
              { color: '#DC2626', label: '3' },
              { color: '#991B1B', label: '4+' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded border border-slate-200"
                  style={{ backgroundColor: item.color }}
                  title={item.label}
                />
                <span className="text-[10px] font-mono text-slate-500 mr-0.5">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-5 overflow-x-auto">
        {depts.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            Chưa có dữ liệu phòng ban để hiển thị heatmap
          </div>
        ) : (
          <div className="inline-block min-w-full">
            {/* Header row */}
            <div className="flex items-center mb-1.5">
              <div className="w-20 shrink-0" />
              {dates.map(date => (
                <div
                  key={date}
                  className="flex-1 min-w-[52px] text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                >
                  {formatDateLabel(date)}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {depts.map(dept => (
              <div key={dept.id} className="flex items-center mb-1">
                {/* Row label */}
                <div className="w-20 shrink-0 pr-2 text-right">
                  <span className="text-[11px] font-bold text-slate-700 font-mono">
                    {dept.code}
                  </span>
                </div>

                {/* Cells */}
                {dates.map(date => {
                  const count = lookup[dept.code]?.[date] || 0;
                  const bg = getHeatColor(count, maxCount);
                  const fg = getTextColor(count, maxCount);
                  const isHighlight = count >= 3;

                  return (
                    <div
                      key={`${dept.id}-${date}`}
                      className="flex-1 min-w-[52px] px-0.5"
                    >
                      <div
                        className={`h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all hover:scale-105 hover:shadow-lg cursor-pointer border ${
                          isHighlight
                            ? 'border-transparent shadow-sm'
                            : 'border-slate-200'
                        }`}
                        style={{
                          backgroundColor: bg,
                          color: fg,
                        }}
                        title={`${dept.code} — ${formatDateLabel(date)}: ${count} CV`}
                      >
                        {count > 0 ? count : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
        <strong className="text-slate-700">Đỉnh cao:</strong>{' '}
        {maxCount} CV/ngày — Di chuột vào ô để xem chi tiết
      </div>
    </div>
  );
};

export default VtDeptHeatmap;