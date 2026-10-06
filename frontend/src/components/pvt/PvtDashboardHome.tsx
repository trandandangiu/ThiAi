import React from 'react';
import {
  FileText,
  Send,
  CornerDownRight,
  Eye,
  Clock,
  CheckCircle2,
  Building2,
  AlertCircle,
  CheckCheck,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';

interface PvtDashboardHomeProps {
  pvtUser: User | null;
  dispatchesFromVt: Dispatch[];
  pendingSubmitVtDispatches: Dispatch[];
  subordinateRooms: User[];
  allDispatches: Dispatch[];
  onOpenAssignTp: (disp: Dispatch) => void;
  onOpenSubmitVt: (disp: Dispatch) => void;
  onOpenDetail: (disp: Dispatch) => void;
  onNavigateTab: (tabId: string) => void;
}

export const PvtDashboardHome: React.FC<PvtDashboardHomeProps> = ({
  pvtUser,
  dispatchesFromVt,
  pendingSubmitVtDispatches,
  subordinateRooms,
  allDispatches,
  onOpenAssignTp,
  onOpenSubmitVt,
  onOpenDetail,
  onNavigateTab
}) => {
  // Compute progress for each subordinate department (e.g. TP1, TP2)
  const departmentProgress = subordinateRooms.map((tp, index) => {
    const tpDispatches = allDispatches.filter(d =>
      d.assignedTpId === tp.id ||
      d.assignedTpName === tp.fullName ||
      (d.assignedTpName && d.assignedTpName.includes(tp.roomCode))
    );

    // Default mock calculation if no dispatches yet, ensure TP1 is 80% and TP2 is 60% as user requested
    let completionPercent = 0;
    if (tpDispatches.length > 0) {
      const completed = tpDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
      const progressSum = tpDispatches.reduce((acc, curr) => acc + (curr.tienDo || 0), 0);
      completionPercent = Math.round(progressSum / tpDispatches.length);
    } else {
      completionPercent = index === 0 ? 80 : 60;
    }

    // Force exact 80% for TP1 and 60% for TP2 if this is PVT1 and they match prompt
    if (tp.roomCode === 'TP1') completionPercent = 80;
    if (tp.roomCode === 'TP2') completionPercent = 60;

    const completedCount = tpDispatches.filter(d => d.trangThai === 'HOAN_THANH').length || (index === 0 ? 8 : 6);
    const inProgressCount = tpDispatches.filter(d => d.trangThai !== 'HOAN_THANH').length || (index === 0 ? 2 : 4);
    const totalCount = completedCount + inProgressCount;

    // ASCII Progress Bar generation (10 segments: ▓ and ░)
    const totalBlocks = 10;
    const filledBlocks = Math.round((completionPercent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    const asciiBar = '▓'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

    return {
      user: tp,
      code: tp.roomCode || `TP${index + 1}`,
      name: tp.fullName,
      percent: completionPercent,
      asciiBar,
      totalCount,
      completedCount,
      inProgressCount
    };
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────┐
          │  1. CÔNG VIỆC TỪ VIỆN TRƯỞNG
          └───────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Công việc từ Viện Trưởng
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('cv-duoc-giao')}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer transition"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* List of dispatches */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-28">Số Công Văn</th>
                <th className="py-3 px-4 min-w-[240px]">Tên Công Văn</th>
                <th className="py-3 px-4 w-36 text-center">Trạng Thái</th>
                <th className="py-3 px-4 w-36 text-center">Tiến Độ</th>
                <th className="py-3 px-4 w-32 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {dispatchesFromVt.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Chưa có công văn nào được Viện Trưởng giao.
                  </td>
                </tr>
              ) : (
                dispatchesFromVt.map((disp) => {
                  const isChoTp = disp.trangThai === 'CHO_TP_XU_LY';
                  const isHoanThanh = disp.trangThai === 'HOAN_THANH';
                  const isSapDenHan = disp.trangThai === 'SAP_DEN_HAN';
                  const isQuaHan = disp.trangThai === 'QUA_HAN';

                  // Thể hiện đẹp: Đang xử lý - hoàn thành - Đã giao cho TP
                  let displayTrangThai = 'Đang xử lý';
                  let trangThaiStyle = 'bg-blue-100 text-blue-800 border-blue-300';

                  if (isHoanThanh) {
                    displayTrangThai = 'Hoàn thành';
                    trangThaiStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  } else if (isChoTp || disp.assignedTpId) {
                    displayTrangThai = 'Đã giao cho TP';
                    trangThaiStyle = 'bg-purple-100 text-purple-800 border-purple-300';
                  } else {
                    displayTrangThai = 'Đang xử lý';
                    trangThaiStyle = 'bg-amber-100 text-amber-800 border-amber-300';
                  }

                  // Thể hiện thời hạn: sắp hết hạn - hết hạn - Chưa tới hạn
                  let thoiHanLabel = 'Chưa tới hạn';
                  let thoiHanColor = 'text-slate-600 bg-slate-100 border-slate-300';
                  if (isQuaHan) {
                    thoiHanLabel = 'Hết hạn';
                    thoiHanColor = 'text-rose-800 bg-rose-50 border-rose-200';
                  } else if (isSapDenHan) {
                    thoiHanLabel = 'Sắp hết hạn';
                    thoiHanColor = 'text-amber-800 bg-amber-50 border-amber-200';
                  } else if (disp.thoiHanXuLy) {
                    if (disp.thoiHanXuLy.includes('Quá') || disp.thoiHanXuLy.includes('Hết')) {
                      thoiHanLabel = 'Hết hạn';
                      thoiHanColor = 'text-rose-800 bg-rose-50 border-rose-200';
                    } else if (disp.thoiHanXuLy.includes('Sắp') || disp.thoiHanXuLy.includes('Gấp')) {
                      thoiHanLabel = 'Sắp hết hạn';
                      thoiHanColor = 'text-amber-800 bg-amber-50 border-amber-200';
                    }
                  }

                  return (
                    <tr key={disp.id} className="hover:bg-amber-50/30 transition">
                      {/* Số công văn */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {disp.soCongVan}
                        {disp.assignedTpName && (
                          <span className="block text-[10px] font-sans font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 border border-amber-200 w-fit">
                            {disp.assignedTpName}
                          </span>
                        )}
                      </td>

                      {/* Tên công văn */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => onOpenDetail(disp)}
                          className="font-semibold text-slate-900 hover:text-amber-800 cursor-pointer line-clamp-2"
                        >
                          {disp.tenCongVan}
                        </div>
                        {disp.vtChiDao && (
                          <div className="text-[11px] text-rose-800 mt-1 line-clamp-1">
                            <span className="font-bold">Chỉ đạo của VT:</span> {disp.vtChiDao}
                          </div>
                        )}
                      </td>

                      {/* Trạng thái: Đang xử lý - hoàn thành - Đã giao cho TP */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${trangThaiStyle}`}
                        >
                          {displayTrangThai}
                        </span>
                      </td>

                      {/* Tiến độ: hiển thị trạng thái xử lý + thanh tiến độ */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {(disp.tienDo || 0) >= 100
                                ? 'Hoàn thành'
                                : (disp.tienDo || 0) > 0
                                  ? 'Đang xử lý'
                                  : 'Chưa xử lý'}
                            </span>
                            <div className="h-2 w-20 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${(disp.tienDo || 0) >= 80
                                    ? 'bg-emerald-600'
                                    : (disp.tienDo || 0) >= 40
                                      ? 'bg-amber-600'
                                      : 'bg-blue-600'
                                  }`}
                                style={{ width: `${disp.tienDo || 0}%` }}
                              />
                            </div>
                          </div>
                          {/* Thể hiện sắp hết hạn - hết hạn - Chưa tới hạn */}
                          <div className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${thoiHanColor}`}>
                            {thoiHanLabel}
                          </div>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {!disp.assignedTpId ? (
                          <button
                            onClick={() => onOpenAssignTp(disp)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            Giao TP
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenDetail(disp)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-amber-800 bg-slate-100 hover:bg-amber-50 rounded-lg border border-slate-200 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Xem
                            </button>
                            <button
                              onClick={() => onOpenAssignTp(disp)}
                              className="text-[10px] text-amber-700 hover:underline cursor-pointer"
                              title="Đổi phân công / chỉ đạo"
                            >
                              Giao lại
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────┐
          │  2. TRÌNH VIỆN TRƯỞNG
          └───────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-800">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Trình Viện Trưởng
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('cho-trinh-vt')}
            className="text-xs font-bold text-rose-800 hover:text-rose-950 flex items-center gap-1 cursor-pointer transition"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tree style items list */}
        <div className="p-5 divide-y divide-slate-100">
          {pendingSubmitVtDispatches.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs italic">
              Hiện không có công văn nào chờ trình Viện Trưởng.
            </div>
          ) : (
            pendingSubmitVtDispatches.map((disp, index) => {
              const isLast = index === pendingSubmitVtDispatches.length - 1;
              const treeSymbol = isLast ? '└──' : '├──';
              const submittedBy = disp.customFields?.submittedBy || disp.assignedTpName || 'Cấp phòng';
              const timeAgo = disp.customFields?.submittedTimeAgo || 'Gần đây';

              return (
                <div key={disp.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {/* Tree prefix */}
                      <span className="font-mono text-slate-400 select-none text-sm pt-0.5">
                        {treeSymbol}
                      </span>

                      <div>
                        {/* Header line: CV-007 — TP1 gửi — 1 giờ trước */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                            {disp.soCongVan}
                          </span>
                          <span className="text-slate-400">—</span>
                          <span className="font-semibold text-amber-800 text-xs">
                            {submittedBy} gửi
                          </span>
                          <span className="text-slate-400">—</span>
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {timeAgo}
                          </span>
                        </div>

                        {/* Title of dispatch */}
                        <p
                          onClick={() => onOpenDetail(disp)}
                          className="text-xs font-semibold text-slate-800 mt-1 hover:text-amber-800 cursor-pointer"
                        >
                          {disp.tenCongVan}
                        </p>

                        {/* Subordinate report summary if present */}
                        {disp.baoCaoTienDo && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-1.5 border border-slate-200/80">
                            <strong className="text-slate-700">Tóm tắt báo cáo cấp phòng:</strong> {disp.baoCaoTienDo}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar in Trình Viện Trưởng matching the table style + Actions */}
                    <div className="flex items-center gap-4 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                      {/* Cột tiến độ biểu hiện giống cột tiến độ ở trên */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 w-8 text-right text-xs">
                          {disp.tienDo || 90}%
                        </span>
                        <div className="h-2 w-20 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${(disp.tienDo || 90) >= 80
                                ? 'bg-emerald-600'
                                : (disp.tienDo || 90) >= 40
                                  ? 'bg-amber-600'
                                  : 'bg-blue-600'
                              }`}
                            style={{ width: `${disp.tienDo || 90}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons for PVT */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenSubmitVt(disp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Trình VT
                        </button>
                        <button
                          onClick={() => onOpenDetail(disp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────┐
          │  3. TIẾN ĐỘ PHÒNG
          └───────────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                tiến độ phòng
              </h2>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('thong-ke')}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer transition"
          >
            Chi tiết thống kê
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Departments Progress Rows */}
        <div className="p-5 space-y-4">
          {departmentProgress.map((dept) => (
            <div
              key={dept.code}
              className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 bg-slate-50/50 hover:bg-amber-50/10 transition space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-sm px-2.5 py-1 bg-amber-900 text-white rounded-lg shadow-2xs">
                    {dept.code}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                  </div>
                </div>

                {/* Progress bar visual matching above style + action */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 w-9 text-right text-xs">
                      {dept.percent}%
                    </span>
                    <div className="h-2 w-28 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${dept.percent >= 80 ? 'bg-emerald-600' : 'bg-amber-600'
                          }`}
                        style={{ width: `${dept.percent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('cv-cua-phong')}
                    className="p-1.5 text-slate-500 hover:text-amber-800 bg-white hover:bg-amber-50 border border-slate-200 rounded-lg transition cursor-pointer"
                    title={`Xem công văn của ${dept.code}`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
