
import React from 'react';
import {
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { VtSummary } from '../../types/vt';

interface VtKpiGridProps {
  summary: VtSummary;
  onCardClick?: (key: string) => void;
}

interface KpiCardDef {
  key: string;
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  textColor: string;
  subLabel: string;
}

export const VtKpiGrid: React.FC<VtKpiGridProps> = ({ summary, onCardClick }) => {
  const cards: KpiCardDef[] = [
    {
      key: 'total',
      label: 'Tổng công văn',
      value: summary.total,
      icon: FileText,
      gradient: 'from-slate-50 to-white',
      iconBg: 'bg-slate-900 text-white',
      textColor: 'text-slate-900',
      subLabel: 'Toàn bộ hồ sơ trong CSDL',
    },
    {
      key: 'assigned',
      label: 'Đã phân PVT',
      value: summary.daPhanCongPvt,
      icon: UserCheck,
      gradient: 'from-blue-50 to-white',
      iconBg: 'bg-blue-600 text-white',
      textColor: 'text-blue-700',
      subLabel: `${summary.chuaPhanCongPvt} công văn chưa giao`,
    },
    {
      key: 'completed',
      label: 'Đã hoàn thành',
      value: summary.hoanThanh,
      icon: CheckCircle2,
      gradient: 'from-emerald-50 to-white',
      iconBg: 'bg-emerald-600 text-white',
      textColor: 'text-emerald-700',
      subLabel: `${summary.hoanThanh}/${summary.total} công văn xong`,
    },
    {
      key: 'processing',
      label: 'Đang xử lý',
      value: summary.dangXuLy,
      icon: Clock,
      gradient: 'from-amber-50 to-white',
      iconBg: 'bg-amber-600 text-white',
      textColor: 'text-amber-700',
      subLabel: 'Trong tiến độ bình thường',
    },
    {
      key: 'due-soon',
      label: 'Sắp đến hạn',
      value: summary.sapDenHan,
      icon: AlertTriangle,
      gradient: 'from-orange-50 to-white',
      iconBg: 'bg-orange-600 text-white',
      textColor: 'text-orange-700',
      subLabel: 'Cần đôn đốc trong 3 ngày',
    },
    {
      key: 'overdue',
      label: 'Quá hạn',
      value: summary.quaHan,
      icon: AlertTriangle,
      gradient: 'from-rose-50 to-white',
      iconBg: 'bg-rose-600 text-white',
      textColor: 'text-rose-700',
      subLabel: 'Cần chỉ đạo gấp',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(card => (
        <KpiCard key={card.key} card={card} onClick={() => onCardClick?.(card.key)} />
      ))}
    </div>
  );
};

// ============================================
// KPI CARD
// ============================================
const KpiCard: React.FC<{ card: KpiCardDef; onClick?: () => void }> = ({ card, onClick }) => {
  const Icon = card.icon;
  const formatted = card.value.toLocaleString('vi-VN');

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer p-4`}
    >
      {/* Top row: Icon */}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Label */}
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        {card.label}
      </div>

      {/* Value */}
      <div className={`text-2xl font-black ${card.textColor} leading-none mb-1.5 tabular-nums`}>
        {formatted}
      </div>

      {/* Sub label */}
      <div className="text-[10px] text-slate-500 font-medium leading-tight">
        {card.subLabel}
      </div>

      {/* Hover shine */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/40 to-transparent rounded-full blur-2xl" />
      </div>
    </div>
  );
};

export default VtKpiGrid;