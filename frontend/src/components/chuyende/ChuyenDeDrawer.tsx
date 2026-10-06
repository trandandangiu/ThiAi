// src/components/chuyende/ChuyenDeDrawer.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  X, Clock, CheckCircle2, Lock, AlertCircle, Loader2,
  UserCheck, CornerDownRight, FileText, Paperclip,
  Eye, Save, Pencil, Check, Calendar,
  Building2, User, Hash, Info,
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { AgencyCombobox } from '../ui/AgencyCombobox';
import {
  ChuyenDeMilestoneEditor,
  MilestoneDraft,
} from './ChuyenDeMilestoneEditor';
import {
  getChuyenDeData,
  getChuyenDePhase,
  getMilestoneProgress,
  markMilestoneComplete,
  resolveChuyenDeStatus,
  formatChuyenDeDate,
  validateChuyenDe,
  ChuyenDeMilestone,
} from '../../utils/chuyenDe';

interface ChuyenDeDrawerProps {
  chuyenDe: Dispatch | null;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Dispatch>) => Promise<void>;
  canEdit?: boolean;
  readOnly?: boolean;
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize?: number;
  fileCategory?: string;
}

// ============================================
// HELPERS
// ============================================
const formatSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const toDateInput = (val?: string | null): string => {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
export const ChuyenDeDrawer: React.FC<ChuyenDeDrawerProps> = ({
  chuyenDe,
  onClose,
  onUpdate,
  canEdit = false,
  readOnly = false,
}) => {
  const { allUsers } = useAuth();

  const [localCD, setLocalCD] = useState<Dispatch | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ⭐ Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [form, setForm] = useState({
    soCongVan: '',
    tenCongVan: '',
    donViBanHanh: '',
    ngayGui: '',
    nguoiThucHien: '',
    ghiChu: '',
  });

  // Milestones (dùng chung cho cả xem + edit)
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);

  // Assignments trong edit mode
  const [selectedPvtId, setSelectedPvtId] = useState('');
  const [selectedTpId, setSelectedTpId] = useState('');
  const [selectedDeptCode, setSelectedDeptCode] = useState('');
  const [departments, setDepartments] = useState<Array<{ id: string; code: string; name: string }>>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ⭐ Danh sách PVT / TP — chấp nhận cả TRUONG_THONG + TRUONG_PHONG (giống DispatchModal)
  const pvtUsers = useMemo(
    () => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'),
    [allUsers]
  );
  const allTpUsers = useMemo(
    () =>
      allUsers.filter(
        u => (u.role as any) === 'TRUONG_THONG' || u.role === 'TRUONG_PHONG'
      ),
    [allUsers]
  );
  const filteredTpUsers = selectedDeptCode
    ? allTpUsers.filter(u => u.roomCode === selectedDeptCode)
    : allTpUsers;

  // ⭐ Điều kiện cho phép edit — giống DispatchDetailDrawer
  const canEditInfo = canEdit && !readOnly && !!onUpdate;

  // ⭐ Sync khi prop chuyenDe thay đổi
  useEffect(() => {
    if (chuyenDe) {
      setLocalCD(chuyenDe);

      setForm({
        soCongVan: chuyenDe.soCongVan || '',
        tenCongVan: chuyenDe.tenCongVan || '',
        donViBanHanh: chuyenDe.donViBanHanh || '',
        ngayGui: toDateInput(chuyenDe.ngayGui),
        nguoiThucHien: chuyenDe.nguoiThucHien || '',
        ghiChu: chuyenDe.ghiChu || '',
      });

      const data = getChuyenDeData(chuyenDe);
      setMilestones(
        data.milestones.map(m => ({
          id: m.id,
          ten: m.ten,
          han: m.han,
        }))
      );

      setSelectedPvtId(chuyenDe.assignedPvtId || '');
      setSelectedTpId(chuyenDe.assignedTpId || '');

      // ⭐ Đọc roomCode trực tiếp từ dispatchTps — không map qua tên
      const roomCode = (chuyenDe as any).dispatchTps?.[0]?.roomCode || '';
      setSelectedDeptCode(roomCode);

      setIsEditing(false);
      setIsDirty(false);
      setFormError(null);
    } else {
      setLocalCD(null);
    }
  }, [chuyenDe]);

  // ⭐ Load departments 1 lần
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  // ⭐ Load attachments
  useEffect(() => {
    if (chuyenDe?.id) {
      setLoadingFiles(true);
      apiClient
        .getAttachments(chuyenDe.id)
        .then(items => setAttachments(Array.isArray(items) ? items : []))
        .catch(() => setAttachments([]))
        .finally(() => setLoadingFiles(false));
    } else {
      setAttachments([]);
    }
  }, [chuyenDe?.id]);

  // ⭐ ESC — đóng edit trước, đóng drawer sau (giống DispatchDetailDrawer)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          handleCancelEdit();
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, isEditing, localCD, isDirty]);

  // ⭐ Update field
  const updateField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    if (formError) setFormError(null);
  };

  // ⭐ Đóng drawer có cảnh báo (giống Dispatch)
  const handleClose = () => {
    if (isEditing && isDirty) {
      if (!window.confirm('Bạn có thay đổi chưa lưu. Đóng và bỏ thay đổi?')) {
        return;
      }
    }
    onClose();
  };

  // ⭐ Hủy edit
  const handleCancelEdit = () => {
    if (!localCD) return;
    setForm({
      soCongVan: localCD.soCongVan || '',
      tenCongVan: localCD.tenCongVan || '',
      donViBanHanh: localCD.donViBanHanh || '',
      ngayGui: toDateInput(localCD.ngayGui),
      nguoiThucHien: localCD.nguoiThucHien || '',
      ghiChu: localCD.ghiChu || '',
    });

    const data = getChuyenDeData(localCD);
    setMilestones(
      data.milestones.map(m => ({ id: m.id, ten: m.ten, han: m.han }))
    );

    setSelectedPvtId(localCD.assignedPvtId || '');
    setSelectedTpId(localCD.assignedTpId || '');

    // ⭐ Reset selectedDeptCode từ roomCode
    const roomCode = (localCD as any).dispatchTps?.[0]?.roomCode || '';
    setSelectedDeptCode(roomCode);

    setIsEditing(false);
    setIsDirty(false);
    setFormError(null);
  };

  // ⭐ LƯU THAY ĐỔI
  const handleSave = async () => {
    if (!localCD || !onUpdate) return;

    // Validate
    const validationError = validateChuyenDe({
      soCongVan: form.soCongVan,
      tenCongVan: form.tenCongVan,
      donViBanHanh: form.donViBanHanh,
      milestones: milestones.map(m => ({ ten: m.ten, han: m.han })),
    });

    if (validationError) {
      setFormError(validationError.message);
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const existingMilestones = getChuyenDeData(localCD).milestones;
      const finalMilestones: ChuyenDeMilestone[] = milestones.map((m, idx) => {
        const existing = existingMilestones.find(e => e.id === m.id);
        if (existing) {
          return { ...existing, ten: m.ten, han: m.han };
        }
        return {
          id: m.id || `m_${Date.now()}_${idx}`,
          ten: m.ten,
          han: m.han,
          trangThai: existingMilestones.length === 0 && idx === 0
            ? 'DANG_THUC_HIEN'
            : 'CHUA_KICH_HOAT',
        };
      });

      const lastMilestone = finalMilestones[finalMilestones.length - 1];
      const hanBaoCaoXuLy = lastMilestone?.han || localCD.hanBaoCaoXuLy;

      const payload: Partial<Dispatch> = {
        soCongVan: form.soCongVan.trim(),
        tenCongVan: form.tenCongVan.trim(),
        donViBanHanh: form.donViBanHanh.trim(),
        ngayGui: form.ngayGui || undefined,
        nguoiThucHien: form.nguoiThucHien.trim() || undefined,
        ghiChu: form.ghiChu,
        hanBaoCaoXuLy,
        customFields: {
          ...(localCD.customFields || {}),
          chuyenDe: { milestones: finalMilestones },
        },
      };

      // 1. Update dispatch cơ bản
      await onUpdate(localCD.id, payload);

      // 2. Update phân công nếu có thay đổi
      const pvtChanged = selectedPvtId !== (localCD.assignedPvtId || '');
      const tpChanged = selectedTpId !== (localCD.assignedTpId || '');

      let newPvtName = localCD.assignedPvtName;
      let newTpName = localCD.assignedTpName;

      if (pvtChanged && selectedPvtId) {
        const pvt = pvtUsers.find(u => u.id === selectedPvtId);
        if (pvt) {
          try {
            await apiClient.assignToPvts(localCD.id, {
              pvts: [{
                pvtId: pvt.id,
                pvtName: pvt.fullName,
                roomCode: pvt.roomCode || '',
                isPrimary: true,
              }],
            });
            newPvtName = pvt.fullName;
          } catch (err) {
            console.error('Lỗi cập nhật PVT:', err);
          }
        }
      }

      if (tpChanged && selectedTpId) {
        let tp = filteredTpUsers.find(u => u.id === selectedTpId)
          || allTpUsers.find(u => u.id === selectedTpId);

        // ⭐ Fallback: nếu không có TP user nhưng có chọn phòng → dùng dept
        if (!tp && selectedDeptCode) {
          const dept = departments.find(dd => dd.code === selectedDeptCode);
          if (dept) {
            tp = {
              id: dept.id,
              fullName: dept.name,
              roomCode: dept.code,
            } as any;
          }
        }

        if (tp) {
          try {
            await apiClient.assignToTps(localCD.id, {
              tps: [{
                tpId: tp.id,
                tpName: tp.fullName,
                roomCode: tp.roomCode || selectedDeptCode || '',
                isPrimary: true,
              }],
            });
            newTpName = tp.fullName;
          } catch (err) {
            console.error('Lỗi cập nhật TP:', err);
          }
        }
      }

      // ⭐ Update local state ĐẦY ĐỦ — giống DispatchDetailDrawer
      setLocalCD(prev =>
        prev
          ? {
            ...prev,
            ...payload,
            assignedPvtId: pvtChanged ? selectedPvtId : prev.assignedPvtId,
            assignedPvtName: newPvtName,
            assignedTpId: tpChanged ? selectedTpId : prev.assignedTpId,
            assignedTpName: newTpName,
          }
          : prev
      );

      setIsEditing(false);
      setIsDirty(false);
      showToast('Đã lưu thay đổi chuyên đề', 'success');
    } catch (err: any) {
      setFormError(err?.message || 'Không thể lưu thay đổi');
    } finally {
      setIsSaving(false);
    }
  };

  // ⭐ Đánh dấu hoàn thành 1 mốc
  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!localCD || !onUpdate) return;
    if (!window.confirm('Đánh dấu hoàn thành mốc này? Mốc tiếp theo sẽ tự động kích hoạt.')) return;

    setCompletingId(milestoneId);
    try {
      const updatedMilestones = markMilestoneComplete(localCD, milestoneId);
      const allDone = updatedMilestones.every(m => m.trangThai === 'HOAN_THANH');

      const tempCD = {
        ...localCD,
        customFields: {
          ...(localCD.customFields || {}),
          chuyenDe: { milestones: updatedMilestones },
        },
        trangThai: allDone ? ('HOAN_THANH' as const) : localCD.trangThai,
      };

      const newStatus = allDone ? 'HOAN_THANH' : resolveChuyenDeStatus(tempCD);

      await onUpdate(localCD.id, {
        customFields: tempCD.customFields,
        trangThai: newStatus,
        tienDo: allDone ? 100 : localCD.tienDo,
      });

      setLocalCD(prev =>
        prev
          ? {
            ...prev,
            customFields: tempCD.customFields,
            trangThai: newStatus,
            tienDo: allDone ? 100 : prev.tienDo,
          }
          : prev
      );

      setMilestones(
        updatedMilestones.map(m => ({ id: m.id, ten: m.ten, han: m.han }))
      );

      showToast(
        allDone
          ? '🎉 Đã hoàn thành toàn bộ chuyên đề!'
          : '✅ Đã hoàn thành mốc — mốc tiếp theo đã kích hoạt',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật', 'error');
    } finally {
      setCompletingId(null);
    }
  };

  // ⭐ Mở file
  const handleOpenFile = (att: Attachment) => {
    const token = apiClient.getToken();
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    params.set('inline', '1');
    window.open(
      `/api/attachments/${att.id}/download?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // ============================================
  // RENDER
  // ============================================
  if (!chuyenDe || !localCD) return null;

  const phase = getChuyenDePhase(localCD);
  const progress = getMilestoneProgress(localCD);
  const displayMilestones = getChuyenDeData(localCD).milestones;
  const isCompleted = localCD.trangThai === 'HOAN_THANH';

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end"
        onClick={handleClose}
      >
        <div
          className="bg-white w-full sm:max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ═══════════ HEADER ═══════════ */}
          <div
            className="px-4 py-3 text-white shrink-0"
            style={{ backgroundColor: '#0D9488' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-xs font-bold font-mono bg-white/20 border border-white/30 px-2 py-0.5 rounded">
                  {localCD.soCongVan || '—'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-200 text-teal-900 uppercase">
                  Chuyên đề
                </span>
                {isDirty && !isCompleted && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950">
                    ● Chưa lưu
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-2 rounded-lg shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ═══════════ BODY ═══════════ */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">

            {/* FORM ERROR */}
            {formError && (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-sm text-rose-800 font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1">
                  <div className="font-bold mb-0.5">Không thể lưu</div>
                  <div className="text-xs font-normal">{formError}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="p-1 rounded hover:bg-rose-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ═══ SECTION 1: THÔNG TIN CHUNG ═══ */}
            <Section
              icon={FileText}
              title="Thông tin chung"
              action={
                canEditInfo ? (
                  isEditing ? (
                    // ⭐ EDIT MODE: X + ✓ ngay trong header (giống Dispatch)
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer disabled:opacity-50"
                        title="Hủy (ESC)"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
                        title="Lưu"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    // ⭐ VIEW MODE: Pencil
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                      title="Sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )
                ) : null
              }
            >
              {/* Số công văn */}
              <Field label="Số / Ký hiệu" icon={Hash}>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.soCongVan}
                    onChange={e => updateField('soCongVan', e.target.value)}
                    className={inputCls}
                    placeholder="VD: 142/CD-VKS"
                  />
                ) : (
                  <span className="font-mono font-semibold text-slate-800">
                    {localCD.soCongVan || '—'}
                  </span>
                )}
              </Field>

              {/* Nội dung */}
              <Field label="Nội dung chuyên đề" icon={FileText}>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.tenCongVan}
                    onChange={e => updateField('tenCongVan', e.target.value)}
                    className={inputCls}
                    placeholder="Nhập nội dung chuyên đề..."
                  />
                ) : (
                  <span className="font-semibold text-slate-800">
                    {localCD.tenCongVan || '—'}
                  </span>
                )}
              </Field>

              {/* Đơn vị ban hành */}
              <Field label="Đơn vị ban hành" icon={Building2}>
                {isEditing ? (
                  <AgencyCombobox
                    value={form.donViBanHanh}
                    onChange={val => updateField('donViBanHanh', val)}
                    placeholder="Chọn hoặc nhập đơn vị..."
                  />
                ) : (
                  <span className="font-medium text-slate-800">
                    {localCD.donViBanHanh || '—'}
                  </span>
                )}
              </Field>

              {/* Ngày + Người */}
              {/* Ngày tiếp nhận */}
              <Field label="Ngày tiếp nhận" icon={Calendar}>
                {isEditing ? (
                  <input
                    type="date"
                    value={form.ngayGui}
                    onChange={e => updateField('ngayGui', e.target.value)}
                    className={inputCls}
                  />
                ) : (
                  <span className="text-slate-800">
                    {formatChuyenDeDate(localCD.ngayGui)}
                  </span>
                )}
              </Field>


            </Section>

            {/* ═══ SECTION 2: MỐC THỜI HẠN ═══ */}
            <Section
              icon={Clock}
              title={
                isEditing
                  ? `Chuỗi mốc thời hạn (${milestones.length}) `
                  : `Chuỗi mốc thời hạn (${displayMilestones.length})`
              }
            >
              {isEditing ? (
                <div className="space-y-3">
                  <ChuyenDeMilestoneEditor
                    milestones={milestones}
                    onChange={ms => {
                      setMilestones(ms);
                      setIsDirty(true);
                    }}
                    disabled={isSaving}
                  />
                </div>
              ) : (
                <>
                  {displayMilestones.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-[11px] italic">
                      Chưa có mốc nào
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {displayMilestones.map((m, idx) => {
                        const isActive = idx === phase.milestoneIndex;
                        const isDone = m.trangThai === 'HOAN_THANH';
                        const isLocked = m.trangThai === 'CHUA_KICH_HOAT';

                        let daysLeft: number | null = null;
                        if (isActive && m.han) {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const han = new Date(m.han);
                          han.setHours(0, 0, 0, 0);
                          daysLeft = Math.round(
                            (han.getTime() - today.getTime()) / 86400000
                          );
                        }

                        let statusBadge = null;
                        let cardClass = 'border-slate-200 bg-white';

                        if (isDone) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Hoàn thành
                            </span>
                          );
                          cardClass = 'border-emerald-200 bg-emerald-50/40';
                        } else if (isActive) {
                          if (daysLeft !== null && daysLeft < 0) {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertCircle className="w-3 h-3" />
                                Quá hạn {Math.abs(daysLeft)} ngày
                              </span>
                            );
                            cardClass = 'border-rose-300 bg-rose-50/40';
                          } else if (daysLeft !== null && daysLeft <= 7) {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertCircle className="w-3 h-3" />
                                Còn {daysLeft} ngày
                              </span>
                            );
                            cardClass = 'border-amber-300 bg-amber-50/40';
                          } else {
                            statusBadge = (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                <Clock className="w-3 h-3" />
                                {daysLeft !== null
                                  ? `Còn ${daysLeft} ngày`
                                  : 'Đang thực hiện'}
                              </span>
                            );
                            cardClass = 'border-blue-300 bg-blue-50/40';
                          }
                        } else if (isLocked) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <Lock className="w-3 h-3" />
                              Chờ mốc trước
                            </span>
                          );
                          cardClass = 'border-slate-200 bg-slate-50/60 opacity-70';
                        }

                        return (
                          <div
                            key={m.id}
                            className={`p-3 rounded-lg border-2 transition ${cardClass}`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isDone
                                    ? 'bg-emerald-600 text-white'
                                    : isActive
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-300 text-slate-600'
                                    }`}
                                >
                                  {isDone ? '✓' : idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {m.ten}
                                </span>
                              </div>
                              {statusBadge}
                            </div>

                            <div className="flex items-center justify-between gap-2 pl-8">
                              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Hạn:{' '}
                                  <strong className="text-slate-800">
                                    {formatChuyenDeDate(m.han)}
                                  </strong>
                                </span>
                                {isDone && m.hoanThanhLuc && (
                                  <span className="text-emerald-700">
                                    ✓ {formatChuyenDeDate(m.hoanThanhLuc)}
                                  </span>
                                )}
                              </div>

                              {isActive &&
                                !isDone &&
                                canEditInfo &&
                                !isCompleted && (
                                  <button
                                    type="button"
                                    onClick={() => handleCompleteMilestone(m.id)}
                                    disabled={completingId === m.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                                    title="Đánh dấu hoàn thành mốc này"
                                  >
                                    {completingId === m.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    Hoàn thành
                                  </button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {displayMilestones.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-bold text-slate-700">
                          Tiến độ chuyên đề
                        </span>
                        <span className="font-black text-teal-700">
                          {progress.done}/{progress.total} mốc ({progress.percent}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </Section>

            {/* ═══ SECTION 3: PHÂN CÔNG ═══ */}
            {(isEditing ||
              localCD.assignedPvtName ||
              localCD.assignedTpName ||
              localCD.nguoiThucHien ||
              localCD.ghiChu) && (
                <Section icon={UserCheck} title="Phân công xử lý">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Field label="Phó viện trưởng phụ trách" icon={UserCheck}>
                        <select
                          value={selectedPvtId}
                          onChange={e => {
                            setSelectedPvtId(e.target.value);
                            setIsDirty(true);
                          }}
                          className={inputCls}
                        >
                          <option value="">-- Chưa phân công --</option>
                          {pvtUsers.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.roomCode ? `${u.roomCode} - ` : ''}
                              {u.fullName}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field label="Đơn vị thực hiện" icon={Building2}>
                          <select
                            value={selectedDeptCode}
                            onChange={e => {
                              const code = e.target.value;
                              setSelectedDeptCode(code);
                              // ⭐ Auto chọn Trưởng phòng khi chọn phòng (giống DispatchModal)
                              const matchedTp = allTpUsers.find(u => u.roomCode === code);
                              if (matchedTp) {
                                setSelectedTpId(matchedTp.id);
                              } else {
                                setSelectedTpId('');
                              }
                              setIsDirty(true);
                            }}
                            className={inputCls}
                          >
                            <option value="">-- Chọn phòng --</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.code}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Trưởng phòng" icon={CornerDownRight}>
                          <select
                            value={selectedTpId}
                            onChange={e => {
                              setSelectedTpId(e.target.value);
                              setIsDirty(true);
                            }}
                            className={inputCls}
                          >
                            <option value="">-- Chưa phân công --</option>
                            {filteredTpUsers.map(u => (
                              <option key={u.id} value={u.id}>
                                {u.roomCode ? `${u.roomCode} - ` : ''}
                                {u.fullName}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      {/* ⭐ Người thực hiện */}
                      <Field label="Người thực hiện" icon={User}>
                        <input
                          type="text"
                          value={form.nguoiThucHien}
                          onChange={e => updateField('nguoiThucHien', e.target.value)}
                          className={inputCls}
                          placeholder="Họ tên cán bộ / Kiểm sát viên..."
                        />
                      </Field>

                      {/* ⭐ Ghi chú */}
                      <Field label="Ghi chú" icon={Info}>
                        <textarea
                          rows={2}
                          value={form.ghiChu}
                          onChange={e => updateField('ghiChu', e.target.value)}
                          className={inputCls}
                          placeholder="Ghi chú xử lý..."
                        />
                      </Field>
                    </div>
                  ) : (
                    <>
                      {localCD.assignedPvtName && (
                        <Field label="Phó viện trưởng phụ trách" icon={UserCheck}>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-md font-semibold">
                            <UserCheck className="w-3.5 h-3.5" />
                            {localCD.assignedPvtName}
                          </span>
                        </Field>
                      )}

                      {localCD.assignedTpName && (
                        <Field label="Trưởng phòng" icon={CornerDownRight}>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-semibold">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            {localCD.assignedTpName}
                          </span>
                        </Field>
                      )}

                      {/* ⭐ Người thực hiện */}
                      {localCD.nguoiThucHien && (
                        <Field label="Người thực hiện" icon={User}>
                          <span className="text-slate-800 font-medium">
                            {localCD.nguoiThucHien}
                          </span>
                        </Field>
                      )}

                      {/* ⭐ Ghi chú */}
                      {localCD.ghiChu && (
                        <Field label="Ghi chú" icon={Info}>
                          <span className="text-slate-600">{localCD.ghiChu}</span>
                        </Field>
                      )}
                    </>
                  )}
                </Section>
              )}

            {/* ═══ SECTION 4: FILES ═══ */}
            <Section
              icon={Paperclip}
              title={`File đính kèm${attachments.length ? ` (${attachments.length})` : ''}`}
            >
              {loadingFiles ? (
                <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[11px]">Đang tải...</span>
                </div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[11px] italic">
                  Chưa có file đính kèm
                </div>
              ) : (
                <div className="space-y-1.5">
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      onClick={() => handleOpenFile(att)}
                      className="flex items-center gap-2 px-2.5 py-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 cursor-pointer transition"
                    >
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-800 truncate">
                          {att.fileName}
                        </div>
                        {att.fileSize && (
                          <div className="text-[9px] text-slate-400">
                            {formatSize(att.fileSize)}
                          </div>
                        )}
                      </div>
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ═══ TRẠNG THÁI TỔNG ═══ */}
            <div className={`p-3 rounded-lg border-2 ${phase.bgClass} ${phase.borderClass}`}>
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-1">
                Trạng thái hiện tại
              </div>
              <div className={`text-sm font-black ${phase.textClass}`}>
                {phase.label}
              </div>
            </div>
          </div>

          {/* ═══════════ FOOTER ═══════════ */}
          <div className="px-4 py-3 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between gap-2">
            {/* Cụm bên trái: nút Lưu (chỉ hiện khi đang edit) */}
            <div className="flex items-center gap-2">
              {isEditing && canEditInfo && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Lưu thay đổi"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Cụm bên phải: nút Đóng */}
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-300 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70]">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-600 text-white border-rose-700'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================
const inputCls =
  'w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white';

interface SectionProps {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  icon: Icon,
  title,
  action,
  children,
}) => (
  <section className="border border-slate-200 rounded-xl bg-white overflow-hidden">
    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {action}
    </div>
    <div className="p-3 space-y-2.5">{children}</div>
  </section>
);

interface FieldProps {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, icon: Icon, children }) => (
  <div>
    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </div>
    {children}
  </div>
);

const MiniField: React.FC<FieldProps> = ({ label, icon: Icon, children }) => (
  <div>
    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </div>
    <div className="text-[11px]">{children}</div>
  </div>
);

export default ChuyenDeDrawer;