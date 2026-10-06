// src/utils/aiContextBuilder.ts
import { Dispatch } from '../types/dispatch';
import { User } from '../types/auth';
import { resolveDispatchStatus } from '../services/excelService';
import { isChuyenDe } from './chuyenDe';
import {
  AiContext,
  AiAgentStats,
  ContextDispatch,
  ContextUser,
  ContextDepartment,
} from '../types/aiAgent';

export const STATUS_LABELS: Record<string, string> = {
  QUA_HAN: 'Quá hạn',
  SAP_DEN_HAN: 'Sắp đến hạn',
  DANG_XU_LY: 'Đang xử lý',
  HOAN_THANH: 'Hoàn thành',
  MOI_TAO: 'Mới tạo',
  CHO_PVT_XU_LY: 'Chờ PVT xử lý',
  CHO_TP_XU_LY: 'Chờ TP xử lý',
  CHO_PVT_DUYET: 'Chờ PVT duyệt',
  CHO_VT_DUYET: 'Chờ VT duyệt',
  CHO_TRINH_VT: 'Chờ trình VT',
  CHO_Y_KIEN_LANH_DAO: 'Chờ ý kiến Lãnh đạo',
  VT_TRA_LAI: 'VT trả lại',
  PVT_TRA_LAI: 'PVT trả lại',
};

const URGENCY_LABELS: Record<string, string> = {
  HOA_TOC: 'Hỏa tốc',
  THUONG_KHAN: 'Thượng khẩn',
  KHAN: 'Khẩn',
  THUONG: 'Thường',
};

const cleanName = (name?: string): string => {
  if (!name) return '';
  return name
    .replace(/^Đ\/c\s+/i, '')
    .replace(/^Đồng chí\s+/i, '')
    .trim();
};

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

const toContextDispatch = (d: Dispatch): ContextDispatch => {
  const st = resolveDispatchStatus(d);
  return {
    id: d.id,
    soCongVan: d.soCongVan || '',
    tenCongVan: (d.tenCongVan || '').slice(0, 200),
    ngayGui: d.ngayGui || '',
    hanBaoCaoXuLy: d.hanBaoCaoXuLy || '',
    donViBanHanh: d.donViBanHanh || '',
    nguoiThucHien: d.nguoiThucHien || '',
    trangThai: st,
    trangThaiLabel: STATUS_LABELS[st] || st,
    mucDoKhan: URGENCY_LABELS[d.mucDoKhan || 'THUONG'] || d.mucDoKhan || 'Thường',
    loaiCongVan: d.loaiCongVan || (isChuyenDe(d) ? 'CHUYEN_DE' : 'CONG_VAN'),
    assignedPvtName: cleanName(d.assignedPvtName),
    assignedTpName: cleanName(d.assignedTpName),
    tienDo: d.tienDo || 0,
    daysLeft: getDaysLeft(d),
  };
};

export const buildStats = (dispatches: Dispatch[]): AiAgentStats => {
  const stats: AiAgentStats = {
    total: 0,
    quaHan: 0,
    sapDenHan: 0,
    dangXuLy: 0,
    hoanThanh: 0,
    chuyenDe: 0,
    congVan: 0,
  };

  dispatches.forEach(d => {
    stats.total++;
    const st = resolveDispatchStatus(d);
    if (st === 'QUA_HAN') stats.quaHan++;
    else if (st === 'SAP_DEN_HAN') stats.sapDenHan++;
    else if (st === 'HOAN_THANH') stats.hoanThanh++;
    else stats.dangXuLy++;

    if (isChuyenDe(d)) stats.chuyenDe++;
    else stats.congVan++;
  });

  return stats;
};

export const buildUserStats = (
  users: User[],
  dispatches: Dispatch[],
  role: 'PVT' | 'TP'
): ContextUser[] => {
  return users
    .map(u => {
      const norm = (s?: string) =>
        (s || '')
          .replace(/^Đồng chí\s+/i, '')
          .replace(/^Đ\/c\s+/i, '')
          .trim()
          .toLowerCase();

      const userDispatches = dispatches.filter(d => {
        if (role === 'PVT') {
          if (d.assignedPvtId === u.id) return true;
          if (norm(d.assignedPvtName) === norm(u.fullName)) return true;
          if (
            u.roomCode &&
            (d.assignedPvtName || '').toUpperCase().includes(u.roomCode.toUpperCase())
          )
            return true;
        } else {
          if (d.assignedTpId === u.id) return true;
          if (norm(d.assignedTpName) === norm(u.fullName)) return true;
          if (
            u.roomCode &&
            (d.assignedTpName || '').toUpperCase().includes(u.roomCode.toUpperCase())
          )
            return true;
        }
        return false;
      });

      let overdue = 0;
      let completed = 0;
      userDispatches.forEach(d => {
        const st = resolveDispatchStatus(d);
        if (st === 'QUA_HAN') overdue++;
        if (st === 'HOAN_THANH') completed++;
      });

      return {
        id: u.id,
        code: u.roomCode || '',
        name: cleanName(u.fullName),
        total: userDispatches.length,
        overdue,
        completed,
      };
    })
    .sort((a, b) => b.total - a.total);
};

export const buildAiContext = (
  dispatches: Dispatch[],
  allUsers: User[],
  departments: Array<{
    code: string;
    name: string;
    managerId?: string;
    pvtManagerId?: string;
  }> = [],
  maxDispatches = 200
): AiContext => {
  const stats = buildStats(dispatches);

  const priorityOrder: Record<string, number> = {
    QUA_HAN: 1,
    SAP_DEN_HAN: 2,
    DANG_XU_LY: 3,
    HOAN_THANH: 4,
  };

  const sorted = [...dispatches].sort((a, b) => {
    const sa = resolveDispatchStatus(a);
    const sb = resolveDispatchStatus(b);
    return (priorityOrder[sa] || 99) - (priorityOrder[sb] || 99);
  });

  const trimmed = sorted.slice(0, maxDispatches).map(toContextDispatch);

  const pvtUsers = allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG');
  const tpUsers = allUsers.filter(u => u.role === 'TRUONG_PHONG');

  const contextDepartments: ContextDepartment[] = departments.map(d => {
    const manager = allUsers.find(u => u.id === d.managerId);
    const pvt = allUsers.find(u => u.id === d.pvtManagerId);
    return {
      code: d.code,
      name: d.name,
      managerName: cleanName(manager?.fullName),
      pvtManagerName: cleanName(pvt?.fullName),
    };
  });

  return {
    stats,
    dispatches: trimmed,
    pvtList: buildUserStats(pvtUsers, dispatches, 'PVT'),
    tpList: buildUserStats(tpUsers, dispatches, 'TP'),
    departments: contextDepartments,
    todayStr: new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    builtAt: new Date().toISOString(),
  };
};

export const contextToPromptString = (ctx: AiContext): string => {
  const lines: string[] = [];

  lines.push(`=== HÔM NAY: ${ctx.todayStr} ===`);
  lines.push('');

  lines.push('=== THỐNG KÊ TỔNG QUAN ===');
  lines.push(`- Tổng số văn bản: ${ctx.stats.total}`);
  lines.push(`- Công văn: ${ctx.stats.congVan} | Chuyên đề: ${ctx.stats.chuyenDe}`);
  lines.push(`- Quá hạn: ${ctx.stats.quaHan}`);
  lines.push(`- Sắp đến hạn: ${ctx.stats.sapDenHan}`);
  lines.push(`- Đang xử lý: ${ctx.stats.dangXuLy}`);
  lines.push(`- Hoàn thành: ${ctx.stats.hoanThanh}`);
  lines.push('');

  if (ctx.pvtList.length > 0) {
    lines.push('=== DANH SÁCH PHÓ VIỆN TRƯỞNG (PVT) VÀ KHỐI LƯỢNG ===');
    ctx.pvtList.forEach(p => {
      lines.push(
        `- ${p.code || 'PVT'}: ${p.name} | Tổng: ${p.total} | Quá hạn: ${p.overdue} | Hoàn thành: ${p.completed}`
      );
    });
    lines.push('');
  }

  if (ctx.tpList.length > 0) {
    lines.push('=== DANH SÁCH TRƯỞNG PHÒNG (TP) VÀ KHỐI LƯỢNG ===');
    ctx.tpList.forEach(t => {
      lines.push(
        `- ${t.code || 'TP'}: ${t.name} | Tổng: ${t.total} | Quá hạn: ${t.overdue} | Hoàn thành: ${t.completed}`
      );
    });
    lines.push('');
  }

  if (ctx.departments.length > 0) {
    lines.push('=== PHÒNG BAN ===');
    ctx.departments.forEach(d => {
      lines.push(
        `- ${d.code}: ${d.name} | Trưởng phòng: ${d.managerName || 'Chưa có'} | PVT phụ trách: ${d.pvtManagerName || 'Chưa có'}`
      );
    });
    lines.push('');
  }

  lines.push(
    `=== CHI TIẾT ${ctx.dispatches.length} VĂN BẢN (ưu tiên quá hạn trước) ===`
  );
  ctx.dispatches.forEach((d, idx) => {
    const parts: string[] = [];
    parts.push(`[${idx + 1}]`);
    parts.push(`Số: ${d.soCongVan}`);
    parts.push(`Loại: ${d.loaiCongVan === 'CHUYEN_DE' ? 'Chuyên đề' : 'Công văn'}`);
    parts.push(`Trích yếu: ${d.tenCongVan}`);
    parts.push(`Đơn vị BH: ${d.donViBanHanh || '—'}`);
    parts.push(`Ngày gửi: ${d.ngayGui || '—'}`);
    parts.push(`Hạn: ${d.hanBaoCaoXuLy || '—'}`);
    if (d.daysLeft !== null) {
      parts.push(`Còn: ${d.daysLeft} ngày`);
    }
    parts.push(`Trạng thái: ${d.trangThaiLabel}`);
    parts.push(`Mức độ: ${d.mucDoKhan}`);
    parts.push(`PVT: ${d.assignedPvtName || 'Chưa phân'}`);
    parts.push(`TP: ${d.assignedTpName || 'Chưa phân'}`);
    parts.push(`Người TH: ${d.nguoiThucHien || '—'}`);
    parts.push(`Tiến độ: ${d.tienDo}%`);
    lines.push(parts.join(' | '));
  });

  return lines.join('\n');
};