import React, { useState } from 'react';

export interface PieChartSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  subLabel?: string;
  extraInfo?: string;
}

interface PieChartProps {
  title: string;
  subtitle?: string;
  data: PieChartSegment[];
  selectedId?: string | null;
  onSelectSegment?: (segment: PieChartSegment | null) => void;
  size?: number;
  donut?: boolean;
  emptyMessage?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  title,
  subtitle,
  data,
  selectedId,
  onSelectSegment,
  size = 260,
  donut = true,
  emptyMessage = 'Chưa có dữ liệu thống kê'
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  if (totalValue === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[340px]">
        <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mb-6">{subtitle}</p>}
        <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
          Trống
        </div>
        <p className="mt-4 text-xs text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  // Calculate slice coordinates
  let cumulativeAngle = 0;
  const center = size / 2;
  const radius = size * 0.42;
  const innerRadius = donut ? radius * 0.58 : 0;

  const slices = data
    .filter(item => item.value > 0)
    .map(item => {
      const angle = (item.value / totalValue) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      const isHovered = hoveredId === item.id;
      const isSelected = selectedId === item.id;
      const currentRadius = isHovered || isSelected ? radius + 6 : radius;

      // Arc coordinates
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);

      const x1 = center + currentRadius * Math.cos(startRad);
      const y1 = center + currentRadius * Math.sin(startRad);
      const x2 = center + currentRadius * Math.cos(endRad);
      const y2 = center + currentRadius * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      let pathData = '';
      if (donut) {
        const x3 = center + innerRadius * Math.cos(endRad);
        const y3 = center + innerRadius * Math.sin(endRad);
        const x4 = center + innerRadius * Math.cos(startRad);
        const y4 = center + innerRadius * Math.sin(startRad);

        pathData = [
          `M ${x1} ${y1}`,
          `A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          `L ${x3} ${y3}`,
          `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
          'Z'
        ].join(' ');
      } else {
        pathData = [
          `M ${center} ${center}`,
          `L ${x1} ${y1}`,
          `A ${currentRadius} ${currentRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
      }

      const percent = Math.round((item.value / totalValue) * 100);

      return {
        ...item,
        pathData,
        percent,
        isHovered,
        isSelected
      };
    });

  const activeItem = slices.find(s => s.id === hoveredId) || slices.find(s => s.id === selectedId);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {selectedId && onSelectSegment && (
          <button
            onClick={() => onSelectSegment(null)}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded cursor-pointer transition"
          >
            Bỏ lọc
          </button>
        )}
      </div>

      {/* SVG Chart & Center Text */}
      <div className="relative flex justify-center items-center my-3">
        <svg width={size} height={size} className="overflow-visible select-none">
          <g>
            {slices.map(slice => (
              <path
                key={slice.id}
                d={slice.pathData}
                fill={slice.color}
                className="cursor-pointer transition-all duration-200 hover:opacity-90 drop-shadow-xs"
                style={{
                  stroke: slice.isSelected ? '#1E293B' : '#FFFFFF',
                  strokeWidth: slice.isSelected ? 3 : 1.5,
                  transformOrigin: `${center}px ${center}px`
                }}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectSegment && onSelectSegment(selectedId === slice.id ? null : slice)}
              />
            ))}
          </g>
        </svg>

        {/* Donut Center Display */}
        {donut && (
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none w-28">
            <span className="text-2xl font-black text-slate-800 leading-tight">
              {activeItem ? activeItem.value : totalValue}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[100px]">
              {activeItem ? activeItem.label : 'Tổng số việc'}
            </span>
          </div>
        )}
      </div>

      {/* Legend & Breakdown List */}
      <div className="mt-2 space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
        {data.map(item => {
          const isSelected = selectedId === item.id;
          const isHovered = hoveredId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => onSelectSegment && onSelectSegment(selectedId === item.id ? null : item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs cursor-pointer transition ${
                isSelected
                  ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
                  : isHovered
                  ? 'bg-slate-50 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="truncate">
                  <span className="truncate">{item.label}</span>
                  {item.subLabel && (
                    <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                      ({item.subLabel})
                    </span>
                  )}
                </div>
              </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="font-semibold text-slate-700">{item.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
