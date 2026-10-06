// src/components/public/PublicFeaturedDispatches.tsx
import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Eye,
  Flame,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';

interface PublicFeaturedDispatchesProps {
  dispatches: Dispatch[];
  onOpenDetail: (d: Dispatch) => void;
  onViewAll: () => void;
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

export const PublicFeaturedDispatches: React.FC<PublicFeaturedDispatchesProps> = ({
  dispatches,
  onOpenDetail,
  onViewAll,
}) => {
  // Chọn 3 CV nổi bật: ưu tiên quá hạn > sắp đến hạn > mới nhất
  const featured = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const overdue = dispatches.filter(d => {
      if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
      return new Date(d.hanBaoCaoXuLy) < today;
    });

    const dueSoon = dispatches.filter(d => {
      if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
      const han = new Date(d.hanBaoCaoXuLy);
      return han >= today && han <= in3Days;
    });

    const completed = dispatches
      .filter(d => d.trangThai === 'HOAN_THANH')
      .sort((a, b) => {
        const da = a.ngayGui ? new Date(a.ngayGui).getTime() : 0;
        const db = b.ngayGui ? new Date(b.ngayGui).getTime() : 0;
        return db - da;
      });

    const result: { type: 'overdue' | 'dueSoon' | 'completed'; dispatch: Dispatch }[] = [];

    if (overdue.length > 0) result.push({ type: 'overdue', dispatch: overdue[0] });
    if (dueSoon.length > 0) result.push({ type: 'dueSoon', dispatch: dueSoon[0] });
    if (completed.length > 0) result.push({ type: 'completed', dispatch: completed[0] });

    return result;
  }, [dispatches]);

  if (featured.length === 0) return null;

  const typeConfig = {
    overdue: {
      label: 'QUÁ HẠN',
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      badge: 'bg-rose-600',
    },
    dueSoon: {
      label: 'SẮP ĐẾN HẠN',
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-600',
    },
    completed: {
      label: 'MỚI HOÀN THÀNH',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-600',
    },
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Công văn nổi bật</h3>
            <p className="text-xs text-slate-500">3 công văn cần Lãnh đạo chú ý</p>
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
        >
          Xem tất cả
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
        {featured.map(({ type, dispatch: d }) => {
          const config = typeConfig[type];
          const Icon = config.icon;

          return (
            <div
              key={`${type}-${d.id}`}
              onClick={() => onOpenDetail(d)}
              className={`group relative cursor-pointer rounded-2xl border-2 ${config.border} ${config.bg} p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
            >
              {/* Gradient header bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.color}`} />

              {/* Badge */}
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.badge} text-white text-[9px] font-black tracking-widest rounded-md shadow-xs`}>
                  <Icon className="w-2.5 h-2.5" />
                  {config.label}
                </span>
                {d.mucDoKhan === 'HOA_TOC' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white">
                    <Flame className="w-2.5 h-2.5" />
                    HỎA TỐC
                  </span>
                )}
              </div>

              {/* Số CV */}
              <div className="font-mono font-black text-[11px] text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mb-2">
                {d.soCongVan}
              </div>

              {/* Tên CV */}
              <div className={`text-sm font-bold ${config.text} line-clamp-2 mb-3 leading-snug min-h-[40px]`}>
                {d.tenCongVan}
              </div>

              {/* Info */}
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-2 border-t border-white/50">
                <span className="font-mono">Hạn: {formatDate(d.hanBaoCaoXuLy)}</span>
                <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicFeaturedDispatches;