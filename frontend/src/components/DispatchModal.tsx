// src/components/DispatchModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Paperclip, Calendar, AlertTriangle, Clock,
  FileSpreadsheet, Upload, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { ColumnDefinition, Dispatch } from '../types/dispatch';
import {
  resolveDispatchStatus,
  parseExcelAndReconcile,
} from '../services/excelService';
import { AttachmentUploader, AttachmentItem } from './attachments/AttachmentUploader';
import { apiClient } from '../services/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AgencyCombobox } from './ui/AgencyCombobox';
import { DocumentTypeCombobox } from './ui/DocumentTypeCombobox';
// ⭐ THÊM

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchToEdit: Dispatch | null;
  columns: ColumnDefinition[];
  onSave: (data: any) => Promise<boolean> | boolean | void;
  onBulkImport?: (items: Partial<Dispatch>[]) => Promise<boolean> | void;
}

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
}


const DEFAULT_FORM: Partial<Dispatch> = {
  ngayGui: new Date().toISOString().slice(0, 10),
  soCongVan: '',
  ngayPhatHanh: new Date().toISOString().slice(0, 10),
  tenCongVan: '',
  hanBaoCaoXuLy: '',
  thoiHanXuLy: '',
  donViBanHanh: '',
  loaiCongVan: '',           // ⭐ THÊM
  nguoiThucHien: '',
  ghiChu: '',
  trangThai: 'DANG_XU_LY',
  mucDoKhan: 'THUONG',
  tienDo: 0,
  customFields: {},
};

// ============================================
// HELPERS
// ============================================
function diffDays(fromISO: string, toISO: string): number | null {
  if (!fromISO || !toISO) return null;
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDMY(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

interface WarningMeta {
  key: 'DANG_XU_LY' | 'SAP_DEN_HAN' | 'QUA_HAN' | 'HOAN_THANH';
  warning: string;
  daysLeft: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

function getWarningMeta(
  daysFromToday: number | null,
  isCompleted: boolean,
  hasDeadline: boolean
): WarningMeta {
  if (!hasDeadline) {
    return {
      key: 'HOAN_THANH',
      warning: 'HOÀN THÀNH',
      daysLeft: '—',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300',
    };
  }

  if (isCompleted) {
    return {
      key: 'HOAN_THANH',
      warning: 'HOÀN THÀNH',
      daysLeft: '—',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-800',
      borderClass: 'border-emerald-300',
    };
  }
  if (daysFromToday === null) {
    return {
      key: 'DANG_XU_LY',
      warning: 'CHƯA CÓ HẠN',
      daysLeft: '—',
      bgClass: 'bg-white',
      textClass: 'text-slate-500',
      borderClass: 'border-slate-300',
    };
  }
  if (daysFromToday < 0) {
    return {
      key: 'QUA_HAN',
      warning: 'QUÁ HẠN',
      daysLeft: `${Math.abs(daysFromToday)} NGÀY`,
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-800',
      borderClass: 'border-rose-400',
    };
  }
  if (daysFromToday === 0) {
    return {
      key: 'QUA_HAN',
      warning: 'QUÁ HẠN',
      daysLeft: '0 NGÀY',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-800',
      borderClass: 'border-rose-400',
    };
  }
  if (daysFromToday === 1) {
    return {
      key: 'SAP_DEN_HAN',
      warning: 'ĐẾN HẠN',
      daysLeft: '1 NGÀY',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-800',
      borderClass: 'border-orange-400',
    };
  }
  if (daysFromToday >= 2 && daysFromToday <= 10) {
    return {
      key: 'SAP_DEN_HAN',
      warning: 'SẮP HẾT HẠN',
      daysLeft: `${daysFromToday} NGÀY`,
      bgClass: 'bg-yellow-50',
      textClass: 'text-yellow-800',
      borderClass: 'border-yellow-400',
    };
  }
  return {
    key: 'DANG_XU_LY',
    warning: 'CÒN NHIỀU',
    daysLeft: `${daysFromToday} NGÀY`,
    bgClass: 'bg-white',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300',
  };
}

// ============================================
// MAIN
// ============================================
export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  dispatchToEdit,
  columns,
  onSave,
  onBulkImport,
}) => {
  const { allUsers } = useAuth();

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Dispatch>>(DEFAULT_FORM);

  // Phân công
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState<string>('');
  const [selectedPvtId, setSelectedPvtId] = useState<string>('');
  const [selectedTpId, setSelectedTpId] = useState<string>('');

  // Excel Import
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importedItems, setImportedItems] = useState<Partial<Dispatch>[]>([]);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // ============================================
  // LOAD DEPARTMENTS
  // ============================================
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // ============================================
  // LOAD DISPATCH KHI EDIT
  // ============================================
  useEffect(() => {
    if (!isOpen) {
      setAttachments([]);
      setErrorMsg(null);
      setImportedItems([]);
      setImportedFileName('');
      setImportError(null);
      setImportPreviewOpen(false);
      return;
    }

    setErrorMsg(null);
    setImportedItems([]);
    setImportedFileName('');
    setImportError(null);
    setImportPreviewOpen(false);

    if (dispatchToEdit) {
      setFormData({
        ...dispatchToEdit,
        loaiCongVan: dispatchToEdit.loaiCongVan || '',   // ⭐ load loaiCongVan
        customFields: dispatchToEdit.customFields ? { ...dispatchToEdit.customFields } : {},
      });
      setSelectedPvtId(dispatchToEdit.assignedPvtId || '');
      setSelectedTpId(dispatchToEdit.assignedTpId || '');
      const matched = departments.find(d => d.name === dispatchToEdit.donViBanHanh);
      setSelectedDeptCode(matched?.code || '');

      apiClient
        .getAttachments(dispatchToEdit.id)
        .then(items => {
          setAttachments(
            items.map((a: any) => ({
              id: a.id,
              fileName: a.fileName,
              fileSize: a.fileSize,
              fileCategory: a.fileCategory,
              fileType: a.fileType,
            }))
          );
        })
        .catch(err => console.error('Lỗi load attachments:', err));
    } else {
      setFormData({ ...DEFAULT_FORM, customFields: {} });
      setAttachments([]);
      setSelectedDeptCode('');
      setSelectedPvtId('');
      setSelectedTpId('');
    }
  }, [dispatchToEdit, isOpen, departments]);

  // ============================================
  // AUTO-CALC: THỜI HẠN XỬ LÝ
  // ============================================
  useEffect(() => {
    if (!formData.hanBaoCaoXuLy) {
      if (formData.thoiHanXuLy !== '') {
        setFormData(prev => ({ ...prev, thoiHanXuLy: '' }));
      }
      return;
    }

    if (!formData.ngayPhatHanh) return;
    const days = diffDays(formData.ngayPhatHanh, formData.hanBaoCaoXuLy);
    if (days === null) return;
    let text = '';
    if (days > 0) text = `${days} ngày`;
    else if (days === 0) text = 'Trong ngày';
    else text = `Không hợp lệ (${days} ngày)`;
    if (text !== formData.thoiHanXuLy) {
      setFormData(prev => ({ ...prev, thoiHanXuLy: text }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.ngayPhatHanh, formData.hanBaoCaoXuLy]);

  if (!isOpen) return null;

  const customColumns = columns.filter(c => c.isCustom);
  const pvtUsers = allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG');
  const allTpUsers = allUsers.filter(u => u.role === 'TRUONG_THONG' as any || u.role === 'TRUONG_PHONG');
  const filteredTpUsers = selectedDeptCode
    ? allTpUsers.filter(u => u.roomCode === selectedDeptCode)
    : allTpUsers;

  const isCompleted = formData.trangThai === 'HOAN_THANH';
  const hasDeadline = !!formData.hanBaoCaoXuLy;

  const daysFromToday = (() => {
    if (!formData.hanBaoCaoXuLy) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(formData.hanBaoCaoXuLy + 'T00:00:00');
    if (isNaN(deadline.getTime())) return null;
    return Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })();

  const warnMeta = getWarningMeta(daysFromToday, isCompleted, hasDeadline);

  // ============================================
  // HANDLE EXCEL IMPORT
  // ============================================
  const handleExcelFile = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    try {
      const analysis = await parseExcelAndReconcile(file, [], customColumns);

      const newItems = analysis.newItems || [];

      if (newItems.length === 0) {
        setImportError('File Excel không có dòng dữ liệu mới nào');
        return;
      }

      const pvtUser = pvtUsers.find(u => u.id === selectedPvtId);
      const tpUser = filteredTpUsers.find(u => u.id === selectedTpId);
      const enriched = newItems.map(item => ({
        ...item,
        __assignPvt: pvtUser
          ? { pvtId: pvtUser.id, pvtName: pvtUser.fullName, roomCode: pvtUser.roomCode || '', isPrimary: true }
          : undefined,
        __assignTp: tpUser
          ? { tpId: tpUser.id, tpName: tpUser.fullName, roomCode: tpUser.roomCode || '', isPrimary: true }
          : undefined,
      }));

      setImportedItems(enriched);
      setImportedFileName(file.name);

      if (newItems.length === 1) {
        const first = newItems[0];
        setFormData(prev => ({
          ...prev,
          ...(first.ngayGui ? { ngayGui: first.ngayGui } : {}),
          ...(first.soCongVan ? { soCongVan: first.soCongVan } : {}),
          ...(first.ngayPhatHanh ? { ngayPhatHanh: first.ngayPhatHanh } : {}),
          ...(first.tenCongVan ? { tenCongVan: first.tenCongVan } : {}),
          ...(first.hanBaoCaoXuLy ? { hanBaoCaoXuLy: first.hanBaoCaoXuLy } : {}),
          ...(first.donViBanHanh ? { donViBanHanh: first.donViBanHanh } : {}),
          ...(first.loaiCongVan ? { loaiCongVan: first.loaiCongVan } : {}),   // ⭐
          ...(first.nguoiThucHien ? { nguoiThucHien: first.nguoiThucHien } : {}),
          ...(first.ghiChu ? { ghiChu: first.ghiChu } : {}),
          ...(first.thoiHanXuLy ? { thoiHanXuLy: first.thoiHanXuLy } : {}),
          ...(first.mucDoKhan ? { mucDoKhan: first.mucDoKhan } : {}),
          customFields: { ...prev.customFields, ...(first.customFields || {}) },
        }));
      } else {
        setImportPreviewOpen(true);
      }
    } catch (err: any) {
      console.error('Lỗi import Excel:', err);
      setImportError(err?.message || 'Không đọc được file Excel');
    } finally {
      setIsImporting(false);
    }
  };

  // ============================================
  // ÁP DỤNG 1 DÒNG TỪ PREVIEW
  // ============================================
  const applyImportedItem = (idx: number) => {
    const item = importedItems[idx];
    if (!item) return;
    setFormData(prev => ({
      ...prev,
      ...(item.ngayGui ? { ngayGui: item.ngayGui } : {}),
      ...(item.soCongVan ? { soCongVan: item.soCongVan } : {}),
      ...(item.ngayPhatHanh ? { ngayPhatHanh: item.ngayPhatHanh } : {}),
      ...(item.tenCongVan ? { tenCongVan: item.tenCongVan } : {}),
      ...(item.hanBaoCaoXuLy ? { hanBaoCaoXuLy: item.hanBaoCaoXuLy } : {}),
      ...(item.donViBanHanh ? { donViBanHanh: item.donViBanHanh } : {}),
      ...(item.loaiCongVan ? { loaiCongVan: item.loaiCongVan } : {}),   // ⭐
      ...(item.nguoiThucHien ? { nguoiThucHien: item.nguoiThucHien } : {}),
      ...(item.ghiChu ? { ghiChu: item.ghiChu } : {}),
      ...(item.thoiHanXuLy ? { thoiHanXuLy: item.thoiHanXuLy } : {}),
      ...(item.mucDoKhan ? { mucDoKhan: item.mucDoKhan } : {}),
      customFields: { ...prev.customFields, ...(item.customFields || {}) },
    }));
    setImportPreviewOpen(false);
  };

  // ============================================
  // SUBMIT
  // ============================================
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitting) return;

    // Bulk import
    if (importedItems.length > 1 && !dispatchToEdit) {
      setIsSubmitting(true);
      setErrorMsg(null);
      try {
        if (onBulkImport) {
          await onBulkImport(importedItems);
        } else {
          for (const item of importedItems) {
            await onSave(item);
          }
        }
        onClose();
      } catch (err: any) {
        setErrorMsg(err?.message || 'Lỗi khi import');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ⭐ Validate
    if (!formData.loaiCongVan?.trim()) {
      setErrorMsg('Vui lòng chọn hoặc nhập Loại văn bản');
      return;
    }
    if (!formData.soCongVan?.trim()) {
      setErrorMsg('Vui lòng nhập Số / Ký hiệu văn bản');
      return;
    }
    if (!formData.tenCongVan?.trim()) {
      setErrorMsg('Vui lòng nhập Nội dung trích yếu');
      return;
    }
    if (!formData.donViBanHanh?.trim()) {
      setErrorMsg('Vui lòng nhập Đơn vị ban hành');
      return;
    }

    if (formData.ngayGui && !/^\d{4}-\d{2}-\d{2}$/.test(formData.ngayGui)) {
      setErrorMsg('Ngày tiếp nhận không hợp lệ (cần định dạng DD/MM/YYYY)');
      return;
    }
    if (
      formData.hanBaoCaoXuLy &&
      !/^\d{4}-\d{2}-\d{2}$/.test(formData.hanBaoCaoXuLy)
    ) {
      setErrorMsg('Hạn báo cáo không hợp lệ (cần định dạng DD/MM/YYYY)');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      let resolvedStatus: Dispatch['trangThai'];

      if (!formData.hanBaoCaoXuLy) {
        resolvedStatus = 'HOAN_THANH';
      } else {
        resolvedStatus = resolveDispatchStatus({
          ...formData,
          trangThai: warnMeta.key,
        });
      }

      const pvtUser = pvtUsers.find(u => u.id === selectedPvtId);
      const tpUser = filteredTpUsers.find(u => u.id === selectedTpId);
      // ⭐ Lấy phòng đã chọn
      const selectedDept = departments.find(d => d.code === selectedDeptCode);

      const finalTienDo = !formData.hanBaoCaoXuLy
        ? 100
        : (formData.tienDo ?? 0);

      const success = await onSave({
        ...formData,
        trangThai: resolvedStatus,
        tienDo: finalTienDo,
        __attachments: attachments,

        // ⭐ PVT
        __assignPvt: pvtUser
          ? {
            pvtId: pvtUser.id,
            pvtName: pvtUser.fullName,
            roomCode: pvtUser.roomCode || '',
            isPrimary: true,
          }
          : undefined,

        // ⭐ FIX: Ưu tiên selectedDeptCode (từ dropdown)
        __assignTp: (() => {
          const roomCode = selectedDeptCode || tpUser?.roomCode || '';

          if (tpUser) {
            return {
              tpId: tpUser.id,
              tpName: tpUser.fullName,
              roomCode,
              isPrimary: true,
            };
          }

          // Fallback: nếu không có TP user nhưng có chọn phòng
          if (selectedDept) {
            return {
              tpId: selectedDept.id,
              tpName: selectedDept.name,
              roomCode: selectedDept.code,
              isPrimary: true,
            };
          }

          return undefined;
        })(),
      });

      if (success === false) {
        setErrorMsg('Không thể lưu. Vui lòng kiểm tra lại dữ liệu.');
        return;
      }
      onClose();
    } catch (err: any) {
      console.error('Lỗi submit:', err);
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi lưu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [key]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-fadeIn">
        {/* HEADER */}
        <div
          className="px-6 py-4 text-white flex items-center justify-between"
          style={{ backgroundColor: '#B71C1C' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Paperclip className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {dispatchToEdit ? 'Chỉnh sửa công văn' : 'Tạo công văn'}
              </h2>
              <p className="text-xs text-red-100">
                {dispatchToEdit
                  ? `: ${dispatchToEdit.soCongVan}`
                  : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}
        <form
          id="dispatch-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* ===== HÀNG ĐẦU ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="NGÀY TIẾP NHẬN" required>
              <DateInput
                value={formData.ngayGui}
                onChange={v => setFormData({ ...formData, ngayGui: v })}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="SỐ / KÝ HIỆU VĂN BẢN" required>
              <input
                type="text"
                value={formData.soCongVan || ''}
                onChange={e => setFormData({ ...formData, soCongVan: e.target.value })}
                placeholder=""
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </Field>

            <Field label="HẠN BÁO CÁO, XỬ LÝ">
              <DateInput
                value={formData.hanBaoCaoXuLy}
                onChange={v => setFormData({ ...formData, hanBaoCaoXuLy: v })}
                className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <p className="mt-1 text-[10px] text-slate-500 italic">
                <span className="font-bold text-emerald-700"></span>.
              </p>
            </Field>

            {/* ⭐ ĐƠN VỊ BAN HÀNH */}
            <Field label="ĐƠN VỊ BAN HÀNH" required>
              <AgencyCombobox
                value={formData.donViBanHanh || ''}
                onChange={val => setFormData({ ...formData, donViBanHanh: val })}
                placeholder=""
                required
              />
            </Field>


          </div>

          {/* ===== 3 CỘT ĐỘNG: THỜI HẠN & CẢNH BÁO ===== */}
          <div className="pt-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
              Thời hạn & Cảnh báo
            </div>
            <div className="grid grid-cols-3 border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-r border-slate-300">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  THỜI HẠN XỬ LÝ
                </div>
              </div>
              <div className="bg-slate-100 px-3 py-2 border-b border-r border-slate-300">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  CẢNH BÁO
                </div>
              </div>
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-300">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  NGÀY CÒN LẠI
                </div>
              </div>

              <div className="bg-white px-3 py-2.5 border-r border-slate-200 flex items-center">
                <span className="text-sm font-bold text-slate-900">
                  {formData.hanBaoCaoXuLy
                    ? formatDMY(formData.hanBaoCaoXuLy)
                    : <span className="text-slate-400 italic text-xs">Không có hạn</span>}
                </span>
              </div>
              <div className={`px-3 py-2.5 border-r border-slate-200 flex items-center ${warnMeta.bgClass}`}>
                <span className={`text-sm font-black uppercase tracking-wide ${warnMeta.textClass}`}>
                  {warnMeta.warning}
                </span>
              </div>
              <div className={`px-3 py-2.5 flex items-center ${warnMeta.bgClass}`}>
                <span className={`text-sm font-black ${warnMeta.textClass}`}>
                  {warnMeta.daysLeft}
                </span>
              </div>
            </div>


          </div>

          {/* ⭐ ĐỔI LABEL: NỘI DUNG CÔNG VIỆC → NỘI DUNG TRÍCH YẾU */}
          <Field label="NỘI DUNG TRÍCH YẾU" required>
            <textarea
              rows={2}
              value={formData.tenCongVan || ''}
              onChange={e => setFormData({ ...formData, tenCongVan: e.target.value })}
              placeholder=""
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </Field>
          {/* ⭐ LOẠI VĂN BẢN — TRƯỜNG MỚI */}
          <Field label="LOẠI VĂN BẢN" required>
            <DocumentTypeCombobox
              value={formData.loaiCongVan || ''}
              onChange={val => setFormData({ ...formData, loaiCongVan: val })}
              placeholder=""
              required
            />
          </Field>

          {/* Empty cell để giữ layout 2 cột */}
          <div />

          {/* ===== PHÂN CÔNG XỬ LÝ ===== */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
              Phân công xử lý
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="PHÓ VIỆN TRƯỞNG PHỤ TRÁCH">
                <select
                  value={selectedPvtId}
                  onChange={e => setSelectedPvtId(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white cursor-pointer"
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
              <div />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Field label="ĐƠN VỊ THỰC HIỆN">
                <select
                  value={selectedDeptCode}
                  onChange={e => {
                    const code = e.target.value;
                    setSelectedDeptCode(code);

                    // ⭐ Auto chọn Trưởng phòng khi chọn phòng (vẫn cần cho logic lưu)
                    const matchedTp = allTpUsers.find(u => u.roomCode === code);
                    if (matchedTp) {
                      setSelectedTpId(matchedTp.id);
                    } else {
                      setSelectedTpId('');
                    }
                  }}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white cursor-pointer"
                >
                  <option value="">-- Chọn phòng --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="NGƯỜI THỰC HIỆN">
                <input
                  type="text"
                  value={formData.nguoiThucHien || ''}
                  onChange={e => setFormData({ ...formData, nguoiThucHien: e.target.value })}
                  placeholder=""
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </Field>
            </div>
          </div>

          {/* ===== ĐÍNH KÈM ===== */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
              📎 Đính kèm & Nhập liệu
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              {!dispatchToEdit && (
                <>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleExcelFile(f);
                      e.target.value = '';
                    }}
                  />

                </>
              )}

              <button
                type="button"
                onClick={() => {
                  const inp = document.querySelector<HTMLInputElement>(
                    'input[type="file"][data-attachment-input="true"]'
                  );
                  inp?.click();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition cursor-pointer active:scale-95"
              >
                <Upload className="w-3 h-3" />
                Tải file lên
              </button>

              {importedFileName && importedItems.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <FileSpreadsheet className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-900 truncate max-w-[120px]">
                    {importedFileName}
                  </span>
                  <span className="px-1 py-0.5 bg-emerald-200 text-emerald-900 rounded text-[9px] font-bold">
                    {importedItems.length}
                  </span>
                  {importedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setImportPreviewOpen(!importPreviewOpen)}
                      className="p-0.5 rounded hover:bg-emerald-100 cursor-pointer"
                    >
                      {importPreviewOpen ? (
                        <ChevronUp className="w-3 h-3 text-emerald-700" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-emerald-700" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setImportedItems([]);
                      setImportedFileName('');
                      setImportPreviewOpen(false);
                      setImportError(null);
                    }}
                    className="p-0.5 rounded hover:bg-rose-100 cursor-pointer"
                    title="Xoá file Excel đã import"
                  >
                    <X className="w-3 h-3 text-rose-600" />
                  </button>
                </div>
              )}
            </div>

            {importPreviewOpen && importedItems.length > 1 && (
              <div className="mb-2 max-h-32 overflow-y-auto rounded-md border border-emerald-200 bg-white">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-emerald-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 font-bold text-emerald-900 w-6">#</th>
                      <th className="px-2 py-1 font-bold text-emerald-900">Số CV</th>
                      <th className="px-2 py-1 font-bold text-emerald-900">Trích yếu</th>
                      <th className="px-2 py-1 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100">
                    {importedItems.map((it, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50">
                        <td className="px-2 py-1 text-slate-500">{idx + 1}</td>
                        <td className="px-2 py-1 font-bold text-slate-900">
                          {it.soCongVan || '—'}
                        </td>
                        <td className="px-2 py-1 text-slate-700 truncate max-w-xs">
                          {it.tenCongVan || '—'}
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            type="button"
                            onClick={() => applyImportedItem(idx)}
                            className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 hover:bg-emerald-100 rounded"
                          >
                            Điền
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {importError && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[10px] text-rose-700 font-medium">
                {importError}
              </div>
            )}

            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50/40 p-2">
              <AttachmentUploader
                dispatchId={dispatchToEdit?.id}
                attachments={attachments}
                onChange={setAttachments}
                category="ORIGINAL"
                showCategorySelect={false}
                label=""
                required={false}
              />
            </div>
          </div>

          {customColumns.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Trường tùy chỉnh
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customColumns.map(col => (
                  <Field key={col.id} label={col.label}>
                    <input
                      type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                      value={(formData.customFields?.[col.id] as string) || ''}
                      onChange={e => handleCustomFieldChange(col.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="pt-4 -mx-6 -mb-6 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              style={{ backgroundColor: '#B71C1C' }}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </>
              ) : importedItems.length > 1 ? (
                `Lưu ${importedItems.length} công việc`
              ) : (
                'Lưu công việc'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// DATE INPUT
// ============================================
interface DateInputProps {
  value?: string;
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
}

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  className,
  disabled,
}) => {
  // ⭐ Ref trỏ tới input date ẩn (native picker của trình duyệt)
  const nativeInputRef = React.useRef<HTMLInputElement>(null);

  const displayValue = React.useMemo(() => {
    if (!value) return '';
    const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return value;
    return `${m[3]}/${m[2]}/${m[1]}`;
  }, [value]);

  const [text, setText] = React.useState(displayValue);
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setText(displayValue);
  }, [displayValue, focused]);

  const handleChange = (raw: string) => {
    let cleaned = raw.replace(/[^\d/]/g, '');

    const digits = cleaned.replace(/\//g, '');
    if (digits.length <= 2) {
      cleaned = digits;
    } else if (digits.length <= 4) {
      cleaned = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      cleaned = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }

    setText(cleaned);

    const m = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
      if (
        d.getFullYear() === Number(yyyy) &&
        d.getMonth() === Number(mm) - 1 &&
        d.getDate() === Number(dd)
      ) {
        onChange(`${yyyy}-${mm}-${dd}`);
      }
    } else if (cleaned === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (text !== displayValue) {
      const m = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) setText(displayValue);
    }
  };

  // ⭐ Bấm icon lịch → mở native date picker
  const openNativePicker = () => {
    if (disabled) return;
    const nativeInput = nativeInputRef.current;
    if (!nativeInput) return;

    // Cách 1: Dùng showPicker() (Chrome/Edge mới hỗ trợ)
    if (typeof (nativeInput as any).showPicker === 'function') {
      try {
        (nativeInput as any).showPicker();
        return;
      } catch (err) {
        // Fallback nếu lỗi
      }
    }

    // Cách 2: Fallback — focus + click
    nativeInput.focus();
    nativeInput.click();
  };

  // ⭐ Khi user chọn ngày từ native picker
  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value; // YYYY-MM-DD
    if (newVal) {
      onChange(newVal);
    }
  };

  return (
    <div className="relative">
      {/* Input text hiển thị DD/MM/YYYY — cho phép gõ tay */}
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={text}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        maxLength={10}
        className={className}
        style={{ paddingRight: '32px' }}   // ⭐ chừa chỗ cho icon
      />

      {/* ⭐ Nút icon lịch SVG — bấm mở native date picker */}
      <button
        type="button"
        onClick={openNativePicker}
        disabled={disabled}
        tabIndex={-1}
        title="Chọn ngày từ lịch"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {/* Icon lịch SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* ⭐ Input date ẩn — native picker của trình duyệt */}
      <input
        ref={nativeInputRef}
        type="date"
        value={value || ''}
        onChange={handleNativeChange}
        disabled={disabled}
        tabIndex={-1}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          pointerEvents: 'none',   // ⭐ KHÔNG cho click trực tiếp — chỉ mở qua nút icon
        }}
      />
    </div>
  );
};

// ============================================
// FIELD WRAPPER
// ============================================
interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
);

export default DispatchModal;