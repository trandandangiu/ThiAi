// src/components/public/PublicKpiGrid.tsx
import React, { useState, useEffect } from 'react';
import { FileStack, Clock, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PublicKpiGridProps {
  stats: {
    total: number;
    dangXuLy: number;
    sapDenHan: number;
    quaHan: number;
    hoanThanh: number;
  };
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

// Đếm số animation
const useCountUp = (end: number, duration: number = 1200) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (end - startValue) * eased);

      setCount(current);

      if (progress >= 1) {
        clearInterval(timer);
        setCount(end);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return count;
};

export const PublicKpiGrid: React.FC<PublicKpiGridProps> = ({
  stats,
  selectedStatus,
  onSelectStatus,
}) => {
  const cards = [
    {
      key: 'ALL',
      label: 'Tổng công văn',
      value: stats.total,
      icon: FileStack,
      color: 'blue',
      subLabel: 'Toàn bộ hồ sơ',
    },
    {
      key: 'DANG_XU_LY',
      label: 'Đang xử lý',
      value: stats.dangXuLy,
      icon: Clock,
      color: 'sky',
      subLabel: 'Trong tiến độ',
    },
    {
      key: 'SAP_DEN_HAN',
      label: 'Sắp đến hạn',
      value: stats.sapDenHan,
      icon: AlertCircle,
      color: 'amber',
      subLabel: 'Cần đôn đốc',
    },
    {
      key: 'QUA_HAN',
      label: 'Quá hạn xử lý',
      value: stats.quaHan,
      icon: AlertTriangle,
      color: 'rose',
      subLabel: 'Cần chỉ đạo gấp',
    },
    {
      key: 'HOAN_THANH',
      label: 'Đã hoàn thành',
      value: stats.hoanThanh,
      icon: CheckCircle2,
      color: 'emerald',
      subLabel: 'Đã giải quyết xong',
    },
  ];

  const colorMap: Record<string, any> = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      activeBg: 'bg-blue-100',
      activeBorder: 'border-blue-500',
      iconBg: 'bg-blue-600',
      textColor: 'text-blue-900',
      subColor: 'text-blue-700',
    },
    sky: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      hoverBorder: 'hover:border-sky-400',
      activeBg: 'bg-sky-100',
      activeBorder: 'border-sky-500',
      iconBg: 'bg-sky-600',
      textColor: 'text-sky-900',
      subColor: 'text-sky-700',
    },
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      activeBg: 'bg-amber-100',
      activeBorder: 'border-amber-500',
      iconBg: 'bg-amber-600',
      textColor: 'text-amber-900',
      subColor: 'text-amber-700',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      hoverBorder: 'hover:border-rose-400',
      activeBg: 'bg-rose-100',
      activeBorder: 'border-rose-500',
      iconBg: 'bg-rose-600',
      textColor: 'text-rose-900',
      subColor: 'text-rose-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      hoverBorder: 'hover:border-emerald-400',
      activeBg: 'bg-emerald-100',
      activeBorder: 'border-emerald-500',
      iconBg: 'bg-emerald-600',
      textColor: 'text-emerald-900',
      subColor: 'text-emerald-700',
    },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const c = colorMap[card.color];
        const isActive = selectedStatus === card.key;
        const displayValue = useCountUp(card.value);

        return (
          <button
            key={card.key}
            onClick={() => onSelectStatus(card.key)}
            className={`group text-left p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
              isActive
                ? `${c.activeBg} ${c.activeBorder} shadow-lg -translate-y-1`
                : `${c.bg} ${c.border} ${c.hoverBorder} hover:shadow-md hover:-translate-y-0.5`
            }`}
            style={{
              animationDelay: `${idx * 100}ms`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black ${c.textColor} uppercase tracking-wider`}>
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-xl ${c.iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className={`text-3xl font-black ${c.textColor} leading-none tabular-nums`}>
              {displayValue}
            </div>

            <div className={`text-[10px] ${c.subColor} font-medium mt-1.5`}>
              {card.subLabel}
            </div>

            {isActive && (
              <div className={`mt-2 pt-2 border-t ${c.border}`}>
                <span className={`text-[9px] font-black ${c.subColor} uppercase tracking-wider`}>
                  ✓ Đang lọc theo mục này
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PublicKpiGrid;