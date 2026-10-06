// src/components/public/PublicMobileCards.tsx
import React from 'react';
import { formatDate } from '../../utils/format';
import { Clock, AlertTriangle, CheckCircle2, UserCheck, CornerDownRight, User, Building2 } from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { resolveDispatchStatus } from '../../services/excelService';

interface Props {
  dispatches: Dispatch[];
  currentPage: number;
  pageSize: number;
  selectedPvtId: string | null;
  onSelectDispatch?: (d: Dispatch) => void;
}

export const PublicMobileCards: React.FC<Props> = ({
  dispatches,
  currentPage,
  pageSize,
  selectedPvtId,
  onSelectDispatch,
}) => {
  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);
    const text = disp.thoiHanXuLy || '';

    if (status === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {text || 'Hoàn thành'}
        </span>
      );
    }
    if (status === 'QUA_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          {text || 'Quá hạn'}
        </span>
      );
    }
    if (status === 'SAP_DEN_HAN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <Clock className="w-3 h-3 text-amber-600" />
          {text || 'Sắp đến hạn'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
        <Clock className="w-3 h-3 text-blue-500" />
        {text || 'Đang xử lý'}
      </span>
    );
  };

  if (dispatches.length === 0) {
    return (
      <div className="text-center py-16 px-4 text-slate-400">
        <p className="text-xs font-medium">
          {selectedPvtId
            ? 'Không có công văn nào cho lãnh đạo này'
            : 'Chưa có công văn nào'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-2.5 space-y-2.5 bg-slate-50/40">
      {dispatches.map((disp, idx) => {
        const status = resolveDispatchStatus(disp);
        const isOverdue = status === 'QUA_HAN';
        const isCompleted = status === 'HOAN_THANH';

        return (
          <div
            key={disp.id || idx}
            onClick={() => onSelectDispatch?.(disp)}
            className={`bg-white rounded-xl border shadow-xs overflow-hidden cursor-pointer active:scale-[0.99] transition-transform ${
              isOverdue
                ? 'border-rose-300 border-l-4 border-l-rose-500'
                : isCompleted
                  ? 'border-emerald-300 border-l-4 border-l-emerald-500'
                  : 'border-slate-200 border-l-4 border-l-blue-400'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
                  {(currentPage - 1) * pageSize + idx + 1}
                </span>
                <span className="font-mono font-black text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 truncate">
                  {disp.soCongVan || '—'}
                </span>
              </div>
              {renderStatusBadge(disp)}
            </div>

            {/* Body */}
            <div className="p-3 space-y-2.5">
              <div className="font-semibold text-sm text-slate-900 leading-snug">
                {disp.tenCongVan || '—'}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                    Ngày gửi
                  </div>
                  <div className="text-slate-800 font-mono font-semibold">
                    {formatDate(disp.ngayGui) || '—'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                    Hạn báo cáo
                  </div>
                  <div
                    className={`font-mono font-semibold ${
                      isOverdue
                        ? 'text-rose-700'
                        : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-800'
                    }`}
                  >
                    {formatDate(disp.hanBaoCaoXuLy) || '—'}
                  </div>
                </div>
              </div>

              {/* ⭐ ĐƠN VỊ BAN HÀNH */}
              <div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                  Đơn vị ban hành
                </div>
                <div className="flex items-start gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-700 font-medium">
                    {disp.donViBanHanh || '—'}
                  </span>
                </div>
              </div>

              {/* ⭐ PHÓ VIỆN TRƯỞNG PHỤ TRÁCH */}
              <div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                  Phó Viện trưởng phụ trách
                </div>
                {disp.assignedPvtName ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                    <UserCheck className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {disp.assignedPvtName
                        .replace(/^Đ\/c\s+/, '')
                        .replace(/^Đồng chí\s+/i, '')
                        .trim()}
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Chưa phân công
                  </span>
                )}
              </div>

              {/* ⭐ ĐƠN VỊ THỰC HIỆN (TP + Người) */}
              <div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                  Đơn vị thực hiện
                </div>
                {disp.assignedTpName || disp.nguoiThucHien ? (
                  <div className="space-y-1">
                    {disp.assignedTpName && (
                      <div className="flex items-start gap-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {disp.assignedTpName
                            .replace(/^Đ\/c\s+/, '')
                            .replace(/^Đồng chí\s+/i, '')
                            .trim()}
                        </span>
                      </div>
                    )}
                    {disp.nguoiThucHien && (
                      <div className="flex items-start gap-1.5 ml-5">
                        <User className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-slate-600 font-medium italic">
                          {disp.nguoiThucHien}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Chưa phân công
                  </span>
                )}
              </div>

              {disp.ghiChu && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                    Ghi chú
                  </div>
                  <div className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                    {disp.ghiChu}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PublicMobileCards;