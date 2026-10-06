// src/components/vt/PublicMobileCardList.tsx
import React from 'react';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  CornerDownRight,
  Paperclip,
  Building2,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { Dispatch, DispatchStatus, UrgencyLevel } from '../../types/dispatch';
import { isChuyenDe } from '../../utils/chuyenDe';

interface PublicMobileCardListProps {
  dispatches: Dispatch[];
  onSelectDispatch: (d: Dispatch) => void;
  onViewFiles?: (d: Dispatch) => void;
  selectedPvtId?: string | null;
}

// ============================================
// HELPERS
// ============================================
const formatDateVN = (val?: string | null): string => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  } catch {
    return val;
  }
};

/** Tính số ngày còn lại đến hạn. Trả về null nếu không có hạn/đã hoàn thành. */
const getDaysLeft = (d: Dispatch): number | null => {
  if (!d.hanBaoCaoXuLy) return null;
  if (d.trangThai === 'HOAN_THANH') return null;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const han = new Date(d.hanBaoCaoXuLy);
    if (isNaN(han.getTime())) return null;
    han.setHours(0, 0, 0, 0);
    return Math.round((han.getTime() - today.getTime()) / 86400000);
  } catch {
    return null;
  }
};

/** Trả về status hiển thị + màu sắc dựa trên trạng thái thực tế */
interface StatusDisplay {
  label: string;
  tone: 'overdue' | 'warning' | 'active' | 'done' | 'neutral';
}

const getStatusDisplay = (d: Dispatch): StatusDisplay => {
  if (d.trangThai === 'HOAN_THANH') {
    return { label: 'Hoàn thành', tone: 'done' };
  }

  const days = getDaysLeft(d);
  if (days !== null) {
    if (days < 0) return { label: `Quá hạn ${Math.abs(days)} ngày`, tone: 'overdue' };
    if (days === 0) return { label: 'Đến hạn hôm nay', tone: 'overdue' };
    if (days <= 7) return { label: `Còn ${days} ngày`, tone: 'warning' };
  }

  // Map workflow status
  const map: Partial<Record<DispatchStatus, StatusDisplay>> = {
    MOI_TAO: { label: 'Mới tạo', tone: 'neutral' },
    DANG_XU_LY: { label: 'Đang xử lý', tone: 'active' },
    CHO_PVT_XU_LY: { label: 'Chờ PVT xử lý', tone: 'neutral' },
    CHO_TP_XU_LY: { label: 'Chờ TP xử lý', tone: 'neutral' },
    CHO_PVT_DUYET: { label: 'Chờ PVT duyệt', tone: 'active' },
    CHO_VT_DUYET: { label: 'Chờ VT duyệt', tone: 'warning' },
    CHO_TRINH_VT: { label: 'Chờ trình VT', tone: 'neutral' },
    VT_TRA_LAI: { label: 'VT trả lại', tone: 'overdue' },
    PVT_TRA_LAI: { label: 'PVT trả lại', tone: 'overdue' },
  };
  return (d.trangThai && map[d.trangThai]) || { label: 'Đang xử lý', tone: 'active' };
};

const getUrgencyBadge = (urgency?: UrgencyLevel) => {
  if (!urgency || urgency === 'THUONG') return null;
  const map: Record<Exclude<UrgencyLevel, 'THUONG'>, { label: string; cls: string }> = {
    HOA_TOC: { label: 'HỎA TỐC', cls: 'bg-red-600 text-white' },
    THUONG_KHAN: { label: 'THƯỢNG KHẨN', cls: 'bg-orange-600 text-white' },
    KHAN: { label: 'KHẨN', cls: 'bg-amber-500 text-white' },
  };
  const v = map[urgency as Exclude<UrgencyLevel, 'THUONG'>];
  return v ? (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide ${v.cls}`}>
      <Flame className="w-2.5 h-2.5" />
      {v.label}
    </span>
  ) : null;
};

const statusToneMap: Record<StatusDisplay['tone'], { text: string; bg: string; border: string; dot: string }> = {
  overdue: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' },
  warning: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  active: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
  done: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  neutral: { text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
};

// ============================================
// MAIN
// ============================================
export const PublicMobileCardList: React.FC<PublicMobileCardListProps> = ({
  dispatches,
  onSelectDispatch,
  onViewFiles,
}) => {
  if (!dispatches || dispatches.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm italic">
        Không có công văn nào
      </div>
    );
  }

  return (
    <div className="space-y-2.5 p-2.5">
      {dispatches.map(d => {
        const cd = isChuyenDe(d);
        const status = getStatusDisplay(d);
        const tone = statusToneMap[status.tone];
        const days = getDaysLeft(d);

        return (
          <article
            key={d.id}
            onClick={() => onSelectDispatch(d)}
            className={`relative bg-white rounded-xl border ${
              cd ? 'border-teal-200' : 'border-slate-200'
            } shadow-xs hover:shadow-md active:scale-[0.99] transition-all cursor-pointer overflow-hidden`}
          >
            {/* Thanh màu bên trái theo tone */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${tone.dot}`} />

            <div className="pl-3 pr-3 py-2.5">
              {/* ═══ HÀNG 1: Số CV + badge loại + urgency ═══ */}
              <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                <span className="font-mono font-bold text-[11px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  {d.soCongVan || '—'}
                </span>

                {cd && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-100 text-teal-800 border border-teal-200 uppercase">
                    Chuyên đề
                  </span>
                )}

                {getUrgencyBadge(d.mucDoKhan)}

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto shrink-0 mt-0.5" />
              </div>

              {/* ═══ HÀNG 2: Nội dung ═══ */}
              <h3 className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2 mb-2">
                {d.tenCongVan || '—'}
              </h3>

              {/* ═══ HÀNG 3: Đơn vị ban hành ═══ */}
              {d.donViBanHanh && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{d.donViBanHanh}</span>
                </div>
              )}

              {/* ═══ HÀNG 4: PVT + TP ═══ */}
              {(d.assignedPvtName || d.assignedTpName) && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {d.assignedPvtName && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[10px] font-semibold max-w-full">
                      <UserCheck className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{d.assignedPvtName}</span>
                    </span>
                  )}
                  {d.assignedTpName && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold max-w-full">
                      <CornerDownRight className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{d.assignedTpName}</span>
                    </span>
                  )}
                </div>
              )}

              {/* ═══ HÀNG 5: Ngày + Hạn + Status ═══ */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                {/* Ngày gửi */}
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {formatDateVN(d.ngayGui || d.ngayPhatHanh)}
                </span>

                {/* Hạn */}
                {d.hanBaoCaoXuLy && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${tone.text}`}>
                    <Clock className="w-3 h-3" />
                    {formatDateVN(d.hanBaoCaoXuLy)}
                  </span>
                )}

                {/* Status badge */}
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${tone.bg} ${tone.text} ${tone.border} ml-auto`}
                >
                  {status.tone === 'done' && <CheckCircle2 className="w-2.5 h-2.5" />}
                  {status.tone === 'overdue' && <AlertTriangle className="w-2.5 h-2.5" />}
                  {status.tone === 'warning' && <Clock className="w-2.5 h-2.5" />}
                  {status.label}
                </span>
              </div>

              {/* ═══ Nút xem file (nếu có) ═══ */}
              {onViewFiles && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onViewFiles(d);
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                >
                  <Paperclip className="w-3 h-3" />
                  Xem file đính kèm
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default PublicMobileCardList;