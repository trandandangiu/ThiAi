// src/utils/chuyenDe.ts
import { Dispatch, DispatchStatus } from '../types/dispatch';

// ============================================
// TYPES
// ============================================
export interface ChuyenDeMilestone {
    id: string;
    ten: string;
    han: string;                  // YYYY-MM-DD
    trangThai: 'CHUA_KICH_HOAT' | 'DANG_THUC_HIEN' | 'HOAN_THANH';
    hoanThanhLuc?: string;        // ISO datetime khi bấm hoàn thành
    ghiChu?: string;
}

export interface ChuyenDeData {
    milestones: ChuyenDeMilestone[];
}

export type ChuyenDePhase =
    | 'CHUAN_BI'
    | 'DANG_THUC_HIEN'
    | 'SAP_DEN_HAN'
    | 'QUA_HAN'
    | 'HOAN_THANH';

export interface ChuyenDePhaseMeta {
    phase: ChuyenDePhase;
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotColor: string;
    milestoneIndex: number;        // Index mốc đang active
    activeMilestone?: ChuyenDeMilestone;
    daysLeft?: number;
}

// ============================================
// KIỂM TRA & LẤY DỮ LIỆU
// ============================================
export const isChuyenDe = (d: Dispatch | Partial<Dispatch>): boolean => {
    return (d as any)?.loaiCongVan === 'CHUYEN_DE';
};

export const getChuyenDeData = (d: Dispatch | Partial<Dispatch>): ChuyenDeData => {
    const raw = (d as any)?.customFields?.chuyenDe;
    if (!raw || typeof raw !== 'object') return { milestones: [] };
    const milestones = Array.isArray(raw.milestones) ? raw.milestones : [];
    return { milestones };
};

// ============================================
// HELPERS NGÀY THÁNG
// ============================================
const parseDate = (val?: string): Date | null => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

const today = (): Date => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const daysBetween = (from: Date, to: Date): number => {
    return Math.round((to.getTime() - from.getTime()) / 86400000);
};

// ============================================
// TÌM MỐC ĐANG ACTIVE
// Mốc active = mốc đầu tiên chưa HOAN_THANH
// ============================================
export const findActiveMilestone = (
    milestones: ChuyenDeMilestone[]
): { index: number; milestone: ChuyenDeMilestone | null } => {
    if (!Array.isArray(milestones) || milestones.length === 0) {
        return { index: -1, milestone: null };
    }
    const idx = milestones.findIndex(m => m.trangThai !== 'HOAN_THANH');
    if (idx === -1) {
        // Tất cả đã xong
        return { index: -1, milestone: null };
    }
    return { index: idx, milestone: milestones[idx] };
};

// ============================================
// TÍNH GIAI ĐOẠN HIỆN TẠI
// ============================================
export const getChuyenDePhase = (
    d: Dispatch | Partial<Dispatch>,
    canhBaoTruocNgay = 7
): ChuyenDePhaseMeta => {
    // 1. Nếu đã HOÀN THÀNH
    if ((d as any).trangThai === 'HOAN_THANH') {
        return {
            phase: 'HOAN_THANH',
            label: 'Đã hoàn thành',
            bgClass: 'bg-emerald-50',
            textClass: 'text-emerald-800',
            borderClass: 'border-emerald-300',
            dotColor: 'bg-emerald-500',
            milestoneIndex: -1,
        };
    }

    const { milestones } = getChuyenDeData(d);

    // 2. Không có mốc nào
    if (milestones.length === 0) {
        return {
            phase: 'DANG_THUC_HIEN',
            label: 'Chuyên đề',
            bgClass: 'bg-slate-50',
            textClass: 'text-slate-700',
            borderClass: 'border-slate-300',
            dotColor: 'bg-slate-400',
            milestoneIndex: -1,
        };
    }

    // 3. Tìm mốc active
    const { index, milestone } = findActiveMilestone(milestones);

    // 3.1. Tất cả mốc đã xong → HOAN_THANH
    if (!milestone || index === -1) {
        return {
            phase: 'HOAN_THANH',
            label: `Hoàn thành ${milestones.length} mốc`,
            bgClass: 'bg-emerald-50',
            textClass: 'text-emerald-800',
            borderClass: 'border-emerald-300',
            dotColor: 'bg-emerald-500',
            milestoneIndex: -1,
        };
    }

    // 3.2. Mốc active chưa có hạn
    const hanDate = parseDate(milestone.han);
    const t = today();

    if (!hanDate) {
        return {
            phase: 'DANG_THUC_HIEN',
            label: `${milestone.ten} (chưa có hạn)`,
            bgClass: 'bg-blue-50',
            textClass: 'text-blue-800',
            borderClass: 'border-blue-300',
            dotColor: 'bg-blue-500',
            milestoneIndex: index,
            activeMilestone: milestone,
        };
    }

    const days = daysBetween(t, hanDate);

    // 3.3. QUÁ HẠN
    if (days < 0) {
        return {
            phase: 'QUA_HAN',
            label: `Quá hạn ${Math.abs(days)} ngày (${milestone.ten})`,
            bgClass: 'bg-rose-50',
            textClass: 'text-rose-800',
            borderClass: 'border-rose-300',
            dotColor: 'bg-rose-500',
            milestoneIndex: index,
            activeMilestone: milestone,
            daysLeft: days,
        };
    }

    // 3.4. Đến hạn hôm nay
    if (days === 0) {
        return {
            phase: 'SAP_DEN_HAN',
            label: `Hạn hôm nay (${milestone.ten})`,
            bgClass: 'bg-rose-50',
            textClass: 'text-rose-800',
            borderClass: 'border-rose-300',
            dotColor: 'bg-rose-500',
            milestoneIndex: index,
            activeMilestone: milestone,
            daysLeft: 0,
        };
    }

    // 3.5. SẮP ĐẾN HẠN (trong vòng canhBaoTruocNgay)
    if (days <= canhBaoTruocNgay) {
        return {
            phase: 'SAP_DEN_HAN',
            label: `Còn ${days} ngày (${milestone.ten})`,
            bgClass: 'bg-amber-50',
            textClass: 'text-amber-800',
            borderClass: 'border-amber-300',
            dotColor: 'bg-amber-500',
            milestoneIndex: index,
            activeMilestone: milestone,
            daysLeft: days,
        };
    }

    // 3.6. ĐANG THỰC HIỆN bình thường
    return {
        phase: 'DANG_THUC_HIEN',
        label: `${milestone.ten} (còn ${days} ngày)`,
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-800',
        borderClass: 'border-blue-300',
        dotColor: 'bg-blue-500',
        milestoneIndex: index,
        activeMilestone: milestone,
        daysLeft: days,
    };
};

// ============================================
// TIẾN ĐỘ (%)
// ============================================
export const getMilestoneProgress = (d: Dispatch | Partial<Dispatch>): {
    done: number;
    total: number;
    percent: number;
} => {
    const { milestones } = getChuyenDeData(d);
    const total = milestones.length;
    const done = milestones.filter(m => m.trangThai === 'HOAN_THANH').length;
    return {
        done,
        total,
        percent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
};

// ⭐ Khi bấm hoàn thành mốc → chuyển mốc kế tiếp sang DANG_THUC_HIEN
export const markMilestoneComplete = (
    d: Dispatch | Partial<Dispatch>,
    milestoneId: string
): ChuyenDeMilestone[] => {
    const { milestones } = getChuyenDeData(d);
    const updated = milestones.map(m => {
        if (m.id === milestoneId) {
            return {
                ...m,
                trangThai: 'HOAN_THANH' as const,
                hoanThanhLuc: new Date().toISOString(),
            };
        }
        return m;
    });

    // Kích hoạt mốc tiếp theo (nếu có và đang CHUA_KICH_HOAT)
    const completedIdx = updated.findIndex(m => m.id === milestoneId);
    if (completedIdx !== -1 && completedIdx + 1 < updated.length) {
        const next = updated[completedIdx + 1];
        if (next.trangThai === 'CHUA_KICH_HOAT') {
            updated[completedIdx + 1] = { ...next, trangThai: 'DANG_THUC_HIEN' };
        }
    }

    return updated;
};

// ⭐ Khi khởi tạo danh sách mốc mới — mốc đầu active
export const initMilestones = (
    rawMilestones: Omit<ChuyenDeMilestone, 'trangThai' | 'hoanThanhLuc'>[]
): ChuyenDeMilestone[] => {
    return rawMilestones.map((m, idx) => ({
        ...m,
        id: m.id || `m_${Date.now()}_${idx}`,
        trangThai: idx === 0 ? 'DANG_THUC_HIEN' : 'CHUA_KICH_HOAT',
        hoanThanhLuc: undefined,
    }));
};

// ============================================
// RESOLVE STATUS CHO DISPATCH.TRANGTHAI
// (để Public Home hiển thị đúng badge)
// ============================================
export const resolveChuyenDeStatus = (
    d: Dispatch | Partial<Dispatch>
): DispatchStatus => {
    const phase = getChuyenDePhase(d).phase;
    switch (phase) {
        case 'HOAN_THANH':
            return 'HOAN_THANH';
        case 'QUA_HAN':
            return 'QUA_HAN';
        case 'SAP_DEN_HAN':
            return 'SAP_DEN_HAN';
        case 'DANG_THUC_HIEN':
        case 'CHUAN_BI':
        default:
            return 'DANG_XU_LY';
    }
};

// ============================================
// FORMAT
// ============================================
export const formatChuyenDeDate = (val?: string): string => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
};
// ============================================
// VALIDATE CHUYÊN ĐỀ — trả về lỗi đầu tiên gặp
// ============================================
export interface ChuyenDeValidationError {
    field: string;
    message: string;
}

export const validateChuyenDe = (data: {
    soCongVan?: string;
    tenCongVan?: string;
    donViBanHanh?: string;
    milestones: { ten: string; han: string }[];
}): ChuyenDeValidationError | null => {
    if (!data.soCongVan?.trim()) {
        return { field: 'soCongVan', message: 'Vui lòng nhập Số / Ký hiệu chuyên đề' };
    }
    if (!data.tenCongVan?.trim()) {
        return { field: 'tenCongVan', message: 'Vui lòng nhập Nội dung chuyên đề' };
    }
    if (!data.donViBanHanh?.trim()) {
        return { field: 'donViBanHanh', message: 'Vui lòng chọn Đơn vị ban hành' };
    }
    if (!data.milestones || data.milestones.length === 0) {
        return { field: 'milestones', message: 'Phải có ít nhất 1 mốc thời hạn' };
    }
    for (let i = 0; i < data.milestones.length; i++) {
        const m = data.milestones[i];
        if (!m.ten?.trim()) {
            return {
                field: `milestone_${i}_ten`,
                message: `Vui lòng nhập tên cho mốc ${i + 1}`,
            };
        }
        if (!m.han) {
            return {
                field: `milestone_${i}_han`,
                message: `Vui lòng nhập hạn cho mốc ${i + 1}`,
            };
        }
    }
    return null;
};