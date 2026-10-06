// src/components/public/PublicDesktopTable.tsx
import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/format';
import {
  Clock, AlertTriangle, CheckCircle2, Building2,
  Paperclip, Target, UserCheck, CornerDownRight, FileText,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { resolveDispatchStatus, calculateTimeRemaining } from '../../services/excelService';
import { isChuyenDe } from '../../utils/chuyenDe';

interface Props {
  dispatches: Dispatch[];
  currentPage: number;
  pageSize: number;
  selectedPvtId: string | null;
  onSelectDispatch?: (d: Dispatch) => void;
  showFileColumn?: boolean;
  onViewFiles?: (d: Dispatch) => void;
}

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}
// ⭐ Helper: map loại văn bản từ DB → tên hiển thị đẹp
const getLoaiVanBanLabel = (loai?: string): string => {
  if (!loai) return '';
  const map: Record<string, string> = {
    CHUYEN_DE: 'Chuyên đề',
    CONG_VAN: 'Công văn',
    BAO_CAO: 'Báo cáo',
    KE_HOACH: 'Kế hoạch',
    THONG_BAO: 'Thông báo',
    QUYET_DINH: 'Quyết định',
    CHI_THI: 'Chỉ thị',
    HUONG_DAN: 'Hướng dẫn',
    TO_TRINH: 'Tờ trình',
    DE_NGHI: 'Đề nghị',
    KIEN_NGHI: 'Kiến nghị',
    KHANG_NGHI: 'Kháng nghị',
    YEU_CAU: 'Yêu cầu',
    CONG_DIEN: 'Công điện',
    GIAY_MOI: 'Giấy mời',
    BIEN_BAN: 'Biên bản',
    TAI_LIEU: 'Tài liệu',
  };
  return map[loai] || loai;
};
// ⭐ Helper: clean tên (bỏ "Đ/c", "Đồng chí")
const cleanName = (name?: string): string => {
  if (!name) return '';
  return name
    .replace(/^Đ\/c\s+/, '')
    .replace(/^Đồng chí\s+/i, '')
    .trim();
};

// ⭐ Helper: rút ngắn tên phòng: "Phòng 1 (Án an ninh)" → "Phòng 1"
const shortenDeptName = (fullName?: string): string => {
  if (!fullName) return '';
  // Cắt phần trong ngoặc đơn
  return fullName.replace(/\s*\([^)]*\)\s*$/, '').trim();
};

export const PublicDesktopTable: React.FC<Props> = ({
  dispatches,
  currentPage,
  pageSize,
  selectedPvtId,
  onSelectDispatch,
  showFileColumn = true,
  onViewFiles,
}) => {
  // ⭐ Load departments để map roomCode → tên phòng
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/departments', {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.departments)) {
          setDepartments(
            data.departments
              .filter((d: any) => d.active !== false)
              .map((d: any) => ({ id: d.id, code: d.code, name: d.name }))
          );
        }
      } catch (e) {
        console.error('Lỗi load departments:', e);
      }
    };
    load();
  }, []);

  // ============================================
  // STATUS BADGE
  // ============================================
  const renderStatusBadge = (disp: Dispatch) => {
    const status = resolveDispatchStatus(disp);

    // ⭐ TÍNH ĐỘNG TEXT từ hạn xử lý — KHÔNG lấy từ DB
    const timing = calculateTimeRemaining(
      disp.hanBaoCaoXuLy || '',
      disp.trangThai,
      ''
    );
    const text = timing.text;

    // ─── HOÀN THÀNH ───
    if (status === 'HOAN_THANH') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Hoàn thành</span>
        </span>
      );
    }

    // ─── QUÁ HẠN ───
    if (status === 'QUA_HAN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{text}</span>                 {/* ⭐ "Quá hạn X ngày" */}
        </span>
      );
    }

    // ─── SẮP ĐẾN HẠN (bao gồm "Đến hạn" khi days = 0) ───
    if (status === 'SAP_DEN_HAN') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{text}</span>                 {/* ⭐ "Đến hạn" hoặc "Còn X ngày" */}
        </span>
      );
    }

    // ─── ĐANG XỬ LÝ ───
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span>{text}</span>                   {/* ⭐ "Còn X ngày" */}
      </span>
    );
  };
  // ============================================
  // CỘT: LOẠI VĂN BẢN
  // ============================================
  const renderLoaiVanBan = (disp: Dispatch) => {
    const label = getLoaiVanBanLabel(disp.loaiCongVan);
    if (!label) {
      return <span className="text-slate-300 italic text-xs">—</span>;
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
        <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
        {label}
      </span>
    );
  };


  // ============================================
  // CỘT: ĐƠN VỊ BAN HÀNH
  // ============================================
  const renderDonViBanHanh = (disp: Dispatch) => {
    if (!disp.donViBanHanh) {
      return <span className="text-slate-300 italic text-xs">—</span>;
    }
    return (
      <div className="flex items-start gap-1.5 min-w-0">
        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="text-[12px] text-slate-800 font-medium leading-snug break-words">
          {disp.donViBanHanh}
        </span>
      </div>
    );
  };

  // ============================================
  // CỘT: PHÓ VIỆN TRƯỞNG PHỤ TRÁCH
  // ============================================
  const renderPvt = (disp: Dispatch) => {
    if (!disp.assignedPvtName) {
      return (
        <span className="text-slate-300 italic text-[11px]">Chưa phân công</span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-700">
        <UserCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
        <span className="truncate">{cleanName(disp.assignedPvtName)}</span>
      </span>
    );
  };


  // ============================================
  // CỘT: ĐƠN VỊ THỰC HIỆN — Chỉ hiện tên phòng
  // ============================================
  const renderDonViThucHien = (disp: Dispatch) => {
    // ⭐ Lấy tên phòng
    const tpRelation = (disp as any).dispatchTps?.[0];
    const roomCode = tpRelation?.roomCode || '';

    const matchedDept = departments.find(d => d.code === roomCode);
    const deptName = matchedDept
      ? shortenDeptName(matchedDept.name)
      : (roomCode || '');

    // ⭐ Người thực hiện (text)
    const nguoiThucHien = disp.nguoiThucHien?.trim() || '';

    // Cả 2 đều trống
    if (!deptName && !nguoiThucHien) {
      return (
        <span className="text-slate-300 italic text-[11px]">Chưa phân công</span>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        {/* Dòng 1: Tên phòng */}
        {deptName && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
            <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {deptName}
          </span>
        )}

        {/* Dòng 2: Người thực hiện */}
        {nguoiThucHien && (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-slate-700 font-medium truncate max-w-[220px] pl-[22px]"
            title={nguoiThucHien}
          >
            <UserCheck className="w-3 h-3 text-purple-500 shrink-0" />
            {nguoiThucHien}
          </span>
        )}
      </div>
    );
  };

  // ⭐ Số cột: 10 cột cơ bản + 1 cột File = 11
  const totalCols = 10 + (showFileColumn ? 1 : 0);

  return (
    <div
      id="public-table-scroll-container"
      className="overflow-y-auto max-h-[calc(100vh-320px)] border-t border-slate-200"
    >
      <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
        <thead className="sticky top-0 z-10 shadow-2xs">
          <tr className="border-b-2 border-red-900 text-white">
            <th
              rowSpan={2}
              className="w-[3%] px-1.5 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              STT
            </th>
            <th
              rowSpan={2}
              className="w-[9%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Số / Ký hiệu VB
            </th>
            <th
              rowSpan={2}
              className="w-[7%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Ngày tiếp nhận
            </th>
            <th
              rowSpan={2}
              className="w-[22%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Trích yếu nội dung
            </th>
            <th
              rowSpan={2}
              className="w-[8%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Loại văn bản
            </th>
            <th
              rowSpan={2}
              className="w-[10%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Đơn vị ban hành
            </th>
            <th
              rowSpan={2}
              className="w-[10%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Phó Viện trưởng phụ trách
            </th>
            <th
              rowSpan={2}
              className="w-[11%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Đơn vị thực hiện
            </th>
            <th
              rowSpan={2}
              className="w-[8%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Thời hạn hoàn thành
            </th>
            <th
              rowSpan={2}
              className="w-[9%] px-2 py-3 text-[10px] font-bold uppercase tracking-wide border-r-2 border-red-800 select-none text-center align-middle bg-[#B71C1C]"
            >
              Trạng thái tiến độ
            </th>
            {showFileColumn && (
              <th
                rowSpan={2}
                className="w-[3%] px-1.5 py-3 text-[10px] font-bold uppercase tracking-wide select-none text-center align-middle bg-[#B71C1C]"
              >
                File
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {dispatches.length === 0 ? (
            <tr>
              <td
                colSpan={totalCols}
                className="text-center py-20 px-4 text-slate-400 bg-slate-50/40"
              >
                <p className="text-base text-slate-400 font-medium">
                  {selectedPvtId
                    ? 'Không có công văn nào cho lãnh đạo này'
                    : 'Hiện không có công văn nào để hiển thị'}
                </p>
              </td>
            </tr>
          ) : (
            dispatches.map((disp, idx) => {
              const status = resolveDispatchStatus(disp);
              const isOverdue = status === 'QUA_HAN';
              const isCompleted = status === 'HOAN_THANH';
              const isCD = isChuyenDe(disp);

              const fileCount =
                (Array.isArray((disp as any).attachments)
                  ? (disp as any).attachments.filter((a: any) => !a.isDeleted).length
                  : null) ??
                (disp as any)._count?.attachments ??
                0;

              return (
                <tr
                  key={disp.id || idx}
                  onClick={() => onSelectDispatch?.(disp)}
                  className={`transition-colors cursor-pointer ${isOverdue
                    ? 'bg-rose-50/30 hover:bg-rose-50/60'
                    : isCompleted
                      ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                      : isCD
                        ? 'bg-teal-50/20 hover:bg-teal-50/40'
                        : idx % 2 === 0
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                  title="Bấm để xem chi tiết"
                >
                  {/* 1. STT */}
                  <td className="px-1.5 py-4 text-center border-r border-slate-100 text-slate-600 font-bold text-sm align-middle">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>

                  {/* 2. Số / Ký hiệu VB */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-mono font-bold text-[12px] text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200 inline-block break-all">
                        {disp.soCongVan || '—'}
                      </span>
                      {isCD && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-100 text-teal-800 border border-teal-300">
                          <Target className="w-2.5 h-2.5" />
                          CHUYÊN ĐỀ
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 3. Ngày tiếp nhận */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle">
                    <span className="text-[12px] text-slate-800 font-medium">
                      {formatDate(disp.ngayGui) || '—'}
                    </span>
                  </td>

                  {/* 4. Trích yếu nội dung */}
                  <td className="px-3 py-4 border-r border-slate-100 align-middle">
                    <p
                      className="font-semibold text-slate-900 text-[13px] leading-snug break-words line-clamp-3"
                      title={disp.tenCongVan}
                    >
                      {disp.tenCongVan || '—'}
                    </p>
                  </td>

                  {/* 5. LOẠI VĂN BẢN */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle text-center">
                    {renderLoaiVanBan(disp)}
                  </td>

                  {/* 6. ĐƠN VỊ BAN HÀNH — sửa align-top → align-middle */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle">
                    {renderDonViBanHanh(disp)}
                  </td>

                  {/* 7. PHÓ VIỆN TRƯỞNG PHỤ TRÁCH — sửa align-top → align-middle */}
                  <td className="px-2 py-4 border-r border-slate-200 align-middle">
                    {renderPvt(disp)}
                  </td>


                  {/* 8. ĐƠN VỊ THỰC HIỆN — Phòng + Tên TP */}
                  <td className="px-2 py-4 border-r-2 border-slate-300 align-top">
                    {renderDonViThucHien(disp)}
                  </td>

                  {/* 9. Thời hạn hoàn thành */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle text-center">
                    <span
                      className={`text-[12px] font-bold ${isOverdue
                        ? 'text-rose-700'
                        : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-800'
                        }`}
                    >
                      {formatDate(disp.hanBaoCaoXuLy) || '—'}
                    </span>
                  </td>

                  {/* 10. Trạng thái */}
                  <td className="px-2 py-4 border-r border-slate-100 align-middle text-center">
                    <div className="flex justify-center">{renderStatusBadge(disp)}</div>
                  </td>

                  {/* 11. File */}
                  {showFileColumn && (
                    <td className="px-1.5 py-4 align-middle text-center">
                      {fileCount === 0 ? (
                        <span className="text-slate-300 text-[10px]">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onViewFiles?.(disp);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold hover:bg-indigo-100 transition cursor-pointer whitespace-nowrap"
                          title="Bấm để xem file"
                        >
                          <Paperclip className="w-3 h-3" />
                          {fileCount}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PublicDesktopTable;