// src/components/DispatchDetailDrawer.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  X, Flame, Paperclip, Download, FileText, Loader2, CheckCircle2,
  AlertCircle, Upload, Trash2, Plus, UserCheck, Pencil, Check,
  ExternalLink, RotateCcw, CornerDownRight,
} from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../types/dispatch';
import { apiClient } from '../services/apiClient';
import { calculateTimeRemaining } from '../services/excelService';

// ============================================
// TYPES
// ============================================
interface Attachment {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileCategory?: string;
  uploaderName?: string;
  createdAt?: string;
}

interface PvtUser {
  id: string;
  fullName: string;
  roomCode?: string;
}

interface TpUser {
  id: string;
  fullName: string;
  roomCode?: string;
  department?: { name: string; code?: string };
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface DispatchDetailDrawerProps {
  dispatch: Dispatch | null;
  onClose: () => void;
  columns: ColumnDefinition[];
  onUpdate?: (id: string, updates: Partial<Dispatch>) => void | Promise<void>;
  canEdit?: boolean;
  onMarkComplete?: (d: Dispatch) => void | Promise<void>;
  onReopen?: (d: Dispatch) => void | Promise<void>;
  onDelete?: (d: Dispatch) => void | Promise<void>;
}

const MAX_FILE_SIZE_MB = 20;
const ACCEPT_TYPES =
  '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv,.zip,.rar';

// ============================================
// HELPERS
// ============================================
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

const formatSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

// ============================================
// MAIN
// ============================================
export const DispatchDetailDrawer: React.FC<DispatchDetailDrawerProps> = ({
  dispatch,
  onClose,
  onUpdate,
  canEdit = false,
  onMarkComplete,
  onReopen,
  onDelete,
}) => {
  const [localDispatch, setLocalDispatch] = useState<Dispatch | null>(null);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Users để chọn PVT / TP
  const [pvtUsers, setPvtUsers] = useState<PvtUser[]>([]);
  const [tpUsers, setTpUsers] = useState<TpUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Actions
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState({
    tenCongVan: '',
    donViBanHanh: '',
    hanBaoCaoXuLy: '',
    ghiChu: '',
    assignedPvtId: '',
    assignedTpId: '',
    assignedDeptCode: '',    // ⭐ THÊM
    nguoiThucHien: '',
  });

  const showToast = (
    msg: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ===== SYNC WHEN DISPATCH CHANGES =====
  useEffect(() => {
    setLocalDispatch(dispatch);
    setIsEditing(false);
    setIsDirty(false);
    if (dispatch) {
      setForm({
        tenCongVan: dispatch.tenCongVan || '',
        donViBanHanh: dispatch.donViBanHanh || '',
        hanBaoCaoXuLy: toDateInput(dispatch.hanBaoCaoXuLy),
        ghiChu: dispatch.ghiChu || '',
        assignedPvtId: dispatch.assignedPvtId || '',
        assignedTpId: dispatch.assignedTpId || '',
        assignedDeptCode: (dispatch as any).dispatchTps?.[0]?.roomCode || '',
        nguoiThucHien: dispatch.nguoiThucHien || '',
      });
    }
  }, [dispatch?.id]);

  // ===== LOAD PVT + TP + DEPARTMENTS =====
  useEffect(() => {
    (async () => {
      try {
        const [pvts, tps, deptsRes] = await Promise.all([
          apiClient.getAllUsers({ role: 'PHO_VIEN_TRUONG', limit: 100 }),
          apiClient.getAllUsers({ role: 'TRUONG_PHONG', limit: 100 }),
          fetch('/api/departments', {
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('access_token')
                ? { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
                : {}),
            },
          }).then(r => r.json()),
        ]);

        setPvtUsers(
          (pvts || []).map(u => ({
            id: u.id,
            fullName: u.fullName,
            roomCode: u.roomCode,
          }))
        );
        setTpUsers(
          (tps || []).map(u => ({
            id: u.id,
            fullName: u.fullName,
            roomCode: u.roomCode,
            department: u.department ? { name: u.department.name, code: u.department.code } : undefined,
          }))
        );

        if (deptsRes?.success && Array.isArray(deptsRes.departments)) {
          setDepartments(
            deptsRes.departments
              .filter((dd: any) => dd.active !== false)
              .map((dd: any) => ({ id: dd.id, code: dd.code, name: dd.name }))
          );
        }
      } catch (err) {
        console.error('Lỗi load PVT/TP/departments:', err);
      }
    })();
  }, []);

  // ===== LOAD ATTACHMENTS =====
  const loadAttachments = async (dispatchId: string) => {
    setLoadingFiles(true);
    try {
      const items = await apiClient.getAttachments(dispatchId);
      setAttachments(items || []);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (dispatch?.id) loadAttachments(dispatch.id);
    else setAttachments([]);
  }, [dispatch?.id]);

  // ===== ESC CLOSE =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) setIsEditing(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, isEditing]);

  if (!dispatch || !localDispatch) return null;

  const d = localDispatch;
  const isCompleted = d.trangThai === 'HOAN_THANH';
  const statusInfo = calculateTimeRemaining(
    d.hanBaoCaoXuLy,
    d.trangThai,

  );

  const statusTone =
    statusInfo.status === 'QUA_HAN'
      ? 'text-rose-700'
      : statusInfo.status === 'SAP_DEN_HAN'
        ? 'text-amber-700'
        : statusInfo.status === 'HOAN_THANH'
          ? 'text-emerald-700'
          : 'text-slate-700';

  // ⭐ Tính tên phòng hiển thị (KHÔNG dùng IIFE)
  const roomCodeFromRelation = (d as any).dispatchTps?.[0]?.roomCode || '';
  const matchedDept = departments.find(dept => dept.code === roomCodeFromRelation);
  const displayDeptName = matchedDept ? matchedDept.name : roomCodeFromRelation;

  // ===== EDIT HANDLERS =====
  const updateField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsDirty(false);
    setForm({
      tenCongVan: d.tenCongVan || '',
      donViBanHanh: d.donViBanHanh || '',
      hanBaoCaoXuLy: toDateInput(d.hanBaoCaoXuLy),
      ghiChu: d.ghiChu || '',
      assignedPvtId: d.assignedPvtId || '',
      assignedTpId: d.assignedTpId || '',
      assignedDeptCode: (d as any).dispatchTps?.[0]?.roomCode || '',
      nguoiThucHien: d.nguoiThucHien || '',
    });
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    if (!form.tenCongVan.trim()) {
      showToast('Vui lòng nhập nội dung công văn', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const originalPvtId = d.assignedPvtId || '';
      const originalDeptCode = (d as any).dispatchTps?.[0]?.roomCode || '';

      // ⭐ Local dispatch mới
      const updated: Partial<Dispatch> = {};

      // 1. Update các field cơ bản
      const payload: Partial<Dispatch> = {
        tenCongVan: form.tenCongVan.trim(),
        donViBanHanh: form.donViBanHanh.trim(),
        hanBaoCaoXuLy: form.hanBaoCaoXuLy || undefined,
        ghiChu: form.ghiChu,
        nguoiThucHien: form.nguoiThucHien.trim() || undefined,
      };
      await onUpdate(d.id, payload);
      Object.assign(updated, payload);

      // 2. Đổi PVT → gọi assignToPvts
      if (form.assignedPvtId && form.assignedPvtId !== originalPvtId) {
        const pvt = pvtUsers.find(u => u.id === form.assignedPvtId);
        if (!pvt) {
          throw new Error('Không tìm thấy Phó Viện trưởng đã chọn');
        }

        const res = await apiClient.assignToPvts(d.id, {
          pvts: [
            {
              pvtId: pvt.id,
              pvtName: pvt.fullName,
              roomCode: pvt.roomCode || '',
              isPrimary: true,
            },
          ],
        });

        if (!res) throw new Error('Giao PVT thất bại');

        updated.assignedPvtId = res.assignedPvtId || pvt.id;
        updated.assignedPvtName = res.assignedPvtName || pvt.fullName;
        updated.trangThai = res.trangThai || 'CHO_PVT_XU_LY';
      }

      // 3. ⭐ Đổi ĐƠN VỊ THỰC HIỆN → gọi assignToTps
      if (form.assignedDeptCode && form.assignedDeptCode !== originalDeptCode) {
        const tp = tpUsers.find(u => u.roomCode === form.assignedDeptCode);
        if (!tp) {
          throw new Error('Không tìm thấy Trưởng phòng của phòng đã chọn');
        }

        const res = await apiClient.assignToTps(d.id, {
          tps: [
            {
              tpId: tp.id,
              tpName: tp.fullName,
              roomCode: tp.roomCode || form.assignedDeptCode,
              isPrimary: true,
            },
          ],
        });

        if (!res) throw new Error('Giao Đơn vị thực hiện thất bại');

        updated.assignedTpId = res.assignedTpId || tp.id;
        updated.assignedTpName = res.assignedTpName || tp.fullName;
        updated.trangThai = res.trangThai || 'CHO_TP_XU_LY';
      }

      // 4. Update local state
      setLocalDispatch(prev => (prev ? { ...prev, ...updated } : prev));
      setIsEditing(false);
      setIsDirty(false);
      showToast('Đã lưu thay đổi', 'success');
    } catch (err: any) {
      console.error('Lỗi lưu:', err);
      showToast(err?.message || 'Không thể lưu thay đổi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ===== MARK COMPLETE =====
  const handleMarkComplete = async () => {
    if (!onMarkComplete) return;
    if (!window.confirm(`Đánh dấu HOÀN THÀNH công văn "${d.soCongVan}"?`)) return;
    setIsCompleting(true);
    try {
      await onMarkComplete(d);
      setLocalDispatch(prev =>
        prev ? { ...prev, trangThai: 'HOAN_THANH', tienDo: 100 } : prev
      );
      showToast('Đã đánh dấu hoàn thành', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // ===== REOPEN =====
  const handleReopen = async () => {
    if (!onReopen) return;
    if (
      !window.confirm(
        `Mở lại công văn "${d.soCongVan}"?\n\nCông văn sẽ quay về trạng thái đang xử lý.`
      )
    )
      return;

    setIsReopening(true);
    try {
      await onReopen(d);
      setLocalDispatch(prev =>
        prev
          ? {
            ...prev,
            trangThai: 'DANG_XU_LY',
            tienDo: 0,
            completedAt: undefined,
          }
          : prev
      );
      showToast('Đã mở lại công văn', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể mở lại', 'error');
    } finally {
      setIsReopening(false);
    }
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    if (!onDelete) return;
    if (
      !window.confirm(
        `Xoá công văn "${d.soCongVan}"?\n\nCông văn sẽ bị ẩn khỏi danh sách.`
      )
    )
      return;

    setIsDeleting(true);
    try {
      await onDelete(d);
      showToast('Đã xoá công văn', 'success');
      setTimeout(() => onClose(), 400);
    } catch (err: any) {
      showToast(err?.message || 'Không thể xoá công văn', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== UPLOAD / DOWNLOAD / DELETE FILE =====
  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!canEdit) return showToast('Bạn không có quyền tải file lên', 'error');
    const arr = Array.from(files);
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    const valid = arr.filter(f => {
      if (f.size > maxBytes) {
        showToast(`File "${f.name}" vượt quá ${MAX_FILE_SIZE_MB}MB`, 'error');
        return false;
      }
      return true;
    });
    if (!valid.length) return;

    setUploadingCount(valid.length);
    let ok = 0;
    let fail = 0;
    for (const f of valid) {
      try {
        const res = await apiClient.uploadAttachment(d.id, f, 'ORIGINAL');
        if (res?.success) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    setUploadingCount(0);

    await loadAttachments(d.id);

    if (ok > 0 && fail === 0) showToast(`Đã tải lên ${ok} file`, 'success');
    else if (ok > 0) showToast(`Tải lên ${ok} file, ${fail} lỗi`, 'info');
    else showToast('Không thể tải file lên', 'error');
  };

  const handleDownload = async (att: Attachment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDownloadingId(att.id);
    try {
      await apiClient.downloadAttachment(att.id);
    } catch (err: any) {
      showToast(err?.message || 'Không tải được file', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteAttachment = async (
    att: Attachment,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();
    if (!canEdit) return;
    if (!window.confirm(`Xóa file "${att.fileName}"?`)) return;

    try {
      const ok = await apiClient.deleteAttachment(att.id);
      if (ok) {
        await loadAttachments(d.id);
        showToast('Đã xóa file', 'success');
      } else {
        showToast('Không thể xóa file', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi', 'error');
    }
  };

  const handleOpenFile = (att: Attachment) => {
    const token = apiClient.getToken();
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    params.set('inline', '1');

    const url = `/api/attachments/${att.id}/download?${params.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end"
        onClick={onClose}
      >
        <div
          className="bg-white w-full sm:max-w-lg h-full shadow-2xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* ════════ HEADER ════════ */}
          <div
            className="px-4 py-3 text-white shrink-0"
            style={{ backgroundColor: '#B71C1C' }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-sm font-bold font-mono bg-white/20 border border-white/30 px-2.5 py-0.5 rounded">
                  {d.soCongVan || '—'}
                </span>
                {d.mucDoKhan && d.mucDoKhan !== 'THUONG' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-700/80 border border-rose-300/50 flex items-center gap-0.5">
                    <Flame className="w-3 h-3" /> {d.mucDoKhan}
                  </span>
                )}
                {isDirty && !isCompleted && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950">
                    ● Chưa lưu
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/10 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-[11px] text-white/85 mt-1">Chi tiết công văn</div>
          </div>

          {/* ════════ BODY ════════ */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-xs">
            {/* ───── SECTION 1: THÔNG TIN ───── */}
            <Section
              icon={FileText}
              title="Thông tin công văn"
              action={
                canEdit && onUpdate && !isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                    title="Sửa"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            >
              <Field label="Nội dung">
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.tenCongVan}
                    onChange={e => updateField('tenCongVan', e.target.value)}
                    className={inputCls}
                    placeholder="Trích yếu nội dung công văn..."
                  />
                ) : (
                  <span className="font-semibold text-slate-800">
                    {d.tenCongVan || '—'}
                  </span>
                )}
              </Field>

              <Field label="Đơn vị ban hành">
                {isEditing ? (
                  <input
                    type="text"
                    value={form.donViBanHanh}
                    onChange={e => updateField('donViBanHanh', e.target.value)}
                    className={inputCls}
                    placeholder="UBND, Bộ Tư pháp..."
                  />
                ) : (
                  <span className="font-medium text-slate-800">
                    {d.donViBanHanh || '—'}
                  </span>
                )}
              </Field>

              <div className="grid grid-cols-3 gap-2">
                <MiniField label="Ngày ban hành">
                  <span className="text-slate-800">{formatDateVN(d.ngayGui)}</span>
                </MiniField>
                <MiniField label="Hạn báo cáo">
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.hanBaoCaoXuLy}
                      onChange={e => updateField('hanBaoCaoXuLy', e.target.value)}
                      className={inputCls}
                    />
                  ) : (
                    <span className="text-slate-800">
                      {formatDateVN(d.hanBaoCaoXuLy)}
                    </span>
                  )}
                </MiniField>
                <MiniField label="Tình trạng">
                  <span className={`font-bold ${statusTone}`}>
                    {statusInfo.text}
                  </span>
                </MiniField>
              </div>
            </Section>

            {/* ───── SECTION 2: PHÂN CÔNG XỬ LÝ ───── */}
            <Section icon={UserCheck} title="Phân công xử lý">
              <Field label="Phó viện trưởng phụ trách">
                {isEditing ? (
                  <select
                    value={form.assignedPvtId}
                    onChange={e => updateField('assignedPvtId', e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Chưa phân công —</option>
                    {pvtUsers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.roomCode ? `${p.roomCode} — ` : ''}
                        {p.fullName}
                      </option>
                    ))}
                  </select>
                ) : d.assignedPvtName ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-md font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    {d.assignedPvtName}
                  </span>
                ) : (
                  <span className="italic text-slate-400">Chưa phân công</span>
                )}
              </Field>

              {/* ⭐ ĐỔI: "Trưởng phòng thực hiện" → "Đơn vị thực hiện" */}
              <Field label="Đơn vị thực hiện">
                {isEditing ? (
                  <select
                    value={form.assignedDeptCode}
                    onChange={e => {
                      const code = e.target.value;
                      updateField('assignedDeptCode', code);

                      // Tự động tìm Trưởng phòng của phòng đó
                      const matchedTp = tpUsers.find(t => t.roomCode === code);
                      if (matchedTp) {
                        updateField('assignedTpId', matchedTp.id);
                      } else {
                        updateField('assignedTpId', '');
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="">— Chưa phân công —</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.code}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                ) : displayDeptName ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-semibold">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    {displayDeptName}
                  </span>
                ) : (
                  <span className="italic text-slate-400">Chưa phân công</span>
                )}
              </Field>

              <Field label="Người thực hiện">
                {isEditing ? (
                  <input
                    type="text"
                    value={form.nguoiThucHien}
                    onChange={e => updateField('nguoiThucHien', e.target.value)}
                    className={inputCls}
                    placeholder="Họ tên cán bộ / Kiểm sát viên..."
                  />
                ) : (
                  <span className="text-slate-800 font-medium">
                    {d.nguoiThucHien || '—'}
                  </span>
                )}
              </Field>

              <Field label="Ghi chú">
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={form.ghiChu}
                    onChange={e => updateField('ghiChu', e.target.value)}
                    className={inputCls}
                    placeholder="Ghi chú xử lý..."
                  />
                ) : (
                  <span className="text-slate-600">{d.ghiChu || '—'}</span>
                )}
              </Field>
            </Section>

            {/* ───── SECTION 3: FILE ĐÍNH KÈM ───── */}
            <Section
              icon={Paperclip}
              title={`File đính kèm${attachments.length ? ` (${attachments.length})` : ''}`}
              action={
                canEdit ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCount > 0}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer disabled:opacity-50"
                  >
                    {uploadingCount > 0 ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Đang tải ({uploadingCount})
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Tải lên
                      </>
                    )}
                  </button>
                ) : null
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPT_TYPES}
                onChange={e => {
                  if (e.target.files?.length) handleUploadFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />

              {loadingFiles && (
                <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[11px]">Đang tải...</span>
                </div>
              )}

              {!loadingFiles && attachments.length === 0 && (
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    if (canEdit) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (canEdit && e.dataTransfer.files?.length)
                      handleUploadFiles(e.dataTransfer.files);
                  }}
                  onClick={() => canEdit && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition ${!canEdit
                    ? 'border-slate-200 bg-slate-50 cursor-default'
                    : isDragging
                      ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                      : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer'
                    }`}
                >
                  <Upload
                    className={`w-5 h-5 mx-auto mb-1 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                  <p className="text-[11px] font-semibold text-slate-600">
                    {!canEdit
                      ? 'Chưa có file đính kèm'
                      : isDragging
                        ? 'Thả file vào đây'
                        : 'Kéo thả hoặc bấm để chọn file'}
                  </p>
                </div>
              )}

              {!loadingFiles && attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      onClick={() => handleOpenFile(att)}
                      className="flex items-center gap-2 px-2.5 py-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 cursor-pointer transition group"
                      title="Bấm để mở trong tab mới"
                    >
                      <div className="w-7 h-7 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[11px] font-semibold text-slate-800 truncate"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                          {att.fileSize && <span>{formatSize(att.fileSize)}</span>}
                          {att.fileCategory && (
                            <span className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600">
                              {att.fileCategory}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="p-1.5 rounded-md text-slate-400 group-hover:text-indigo-600 transition">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>

                        <button
                          onClick={e => handleDownload(att, e)}
                          disabled={downloadingId === att.id}
                          className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 cursor-pointer"
                          title="Tải về"
                        >
                          {downloadingId === att.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {canEdit && (
                          <button
                            onClick={e => handleDeleteAttachment(att, e)}
                            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* ════════ FOOTER ════════ */}
          <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            {/* ─── Cụm bên trái: Nút hành động chính ─── */}
            <div className="flex items-center gap-2">
              {!isCompleted && canEdit && onMarkComplete && (
                <button
                  onClick={handleMarkComplete}
                  disabled={isCompleting || isDeleting || isReopening}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-300 transition cursor-pointer disabled:opacity-50"
                  title="Đánh dấu hoàn thành"
                >
                  {isCompleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Đánh dấu hoàn thành
                </button>
              )}

              {isCompleted && canEdit && onReopen && (
                <button
                  onClick={handleReopen}
                  disabled={isReopening || isDeleting || isCompleting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-300 transition cursor-pointer disabled:opacity-50"
                  title="Mở lại công văn để tiếp tục xử lý"
                >
                  {isReopening ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  Bỏ hoàn thành
                </button>
              )}

              {isCompleted && (!canEdit || !onReopen) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã hoàn thành
                </span>
              )}

              {canEdit && onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isCompleting || isReopening}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                  title="Xoá công văn (ẩn khỏi danh sách)"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Xoá
                </button>
              )}
            </div>

            {/* ─── Cụm bên phải: Lưu (khi edit) + Đóng ─── */}
            <div className="flex items-center gap-2">
              {/* ⭐ Khi đang edit → CHỈ hiện nút Lưu (bỏ Hủy vì đã có Đóng) */}
              {isEditing && canEdit && onUpdate && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Lưu thay đổi"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Lưu thay đổi
                </button>
              )}

              {/* Nút Đóng — luôn hiện */}
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70]">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : toast.type === 'error'
                  ? 'bg-rose-600 text-white border-rose-700'
                  : 'bg-blue-600 text-white border-blue-700'
              }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4" />}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </>
  );
};
// ============================================
// REUSABLE SUB-COMPONENTS
// ============================================
const inputCls =
  'w-full px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white';

interface SectionProps {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ icon: Icon, title, action, children }) => (
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

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </div>
    {children}
  </div>
);

const MiniField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </div>
    <div className="text-[11px]">{children}</div>
  </div>
);

export default DispatchDetailDrawer;