// src/components/attachments/AttachmentUploader.tsx
import React, { useRef, useState } from 'react';
import { Upload, FileText, X, Plus, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface AttachmentItem {
  id?: string;
  file?: File;              // File chưa upload (pending)
  fileName: string;
  fileSize: number;
  fileType: string;
  fileCategory?: string;
  description?: string;
  uploading?: boolean;
  error?: string;
}

interface AttachmentUploaderProps {
  dispatchId?: string;                       // Nếu có → upload ngay lên server
  attachments: AttachmentItem[];
  onChange: (items: AttachmentItem[]) => void;
  category?: string;                         // "ORIGINAL" | "DRAFT" | "REPORT" | ...
  showCategorySelect?: boolean;
  label?: string;
  hint?: string;
  required?: boolean;
  maxSizeMB?: number;                        // default 20
  accept?: string;                           // default pdf, word, excel, ảnh
}

const DEFAULT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv';

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  dispatchId,
  attachments,
  onChange,
  category = 'ORIGINAL',
  showCategorySelect = false,
  label = 'File đính kèm',
  hint = '',
  required = false,
  maxSizeMB = 20,
  accept = DEFAULT_ACCEPT,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(category);

  const hasFiles = attachments.length > 0;

  // ============================================
  // FORMAT SIZE
  // ============================================
  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // ============================================
  // HANDLE FILES
  // ============================================
  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const maxBytes = maxSizeMB * 1024 * 1024;

    // Tạo item tạm
    const newItems: AttachmentItem[] = arr.map(f => ({
      file: f,
      fileName: f.name,
      fileSize: f.size,
      fileType: f.type || 'application/octet-stream',
      fileCategory: selectedCategory,
      uploading: !!dispatchId,   // chỉ uploading nếu upload ngay
      error: f.size > maxBytes ? `Vượt quá ${maxSizeMB}MB` : undefined,
    }));

    // Nếu có dispatchId → upload ngay
    if (dispatchId) {
      // Hiển thị trạng thái uploading trước
      const withPlaceholders = [...attachments, ...newItems];
      onChange(withPlaceholders);

      // Upload tuần tự
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        if (item.error) continue;

        try {
          const res = await apiClient.uploadAttachment(
            dispatchId,
            item.file!,
            selectedCategory,
            item.description
          );
          if (res?.success && res.attachment) {
            // Cập nhật lại item với id từ server
            onChange(
              attachments.concat(
                newItems.map((it, idx) =>
                  idx === i
                    ? {
                        id: res.attachment.id,
                        fileName: res.attachment.fileName,
                        fileSize: res.attachment.fileSize,
                        fileType: res.attachment.fileType,
                        fileCategory: res.attachment.fileCategory,
                        description: res.attachment.description,
                        uploading: false,
                      }
                    : it
                )
              )
            );
          } else {
            onChange(
              attachments.concat(
                newItems.map((it, idx) =>
                  idx === i
                    ? { ...it, uploading: false, error: res?.message || 'Upload lỗi' }
                    : it
                )
              )
            );
          }
        } catch (err: any) {
          onChange(
            attachments.concat(
              newItems.map((it, idx) =>
                idx === i
                  ? { ...it, uploading: false, error: err?.message || 'Upload lỗi' }
                  : it
              )
            )
          );
        }
      }
    } else {
      // Không có dispatchId → chỉ lưu vào state, upload sau
      onChange([...attachments, ...newItems]);
    }
  };

  // ============================================
  // DRAG & DROP
  // ============================================
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // ============================================
  // REMOVE
  // ============================================
  const handleRemove = async (idx: number) => {
    const item = attachments[idx];
    // Nếu đã có id trên server → xoá mềm
    if (item.id) {
      try {
        await apiClient.deleteAttachment(item.id);
      } catch (err) {
        console.error('Lỗi xoá file:', err);
      }
    }
    onChange(attachments.filter((_, i) => i !== idx));
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-2">
      {/* Header: label + category select */}
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {showCategorySelect && !hasFiles && (
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            // className="px-2 py-1 text-[11px] border border-slate-300 rounded-lg bg-white font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-red-500/20"
          >
            {/* <option value="ORIGINAL">Bản gốc</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="REPORT">Báo cáo</option>
            <option value="APPROVAL">Phê duyệt</option>
            <option value="REJECTION">Từ chối</option>
            <option value="OTHER">Khác</option> */}
          </select>
        )}
      </div>

      {/* ============================================
          STATE 1: CHƯA CÓ FILE → HIỆN FORM UPLOAD
          ============================================ */}
      {!hasFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            isDragging
              ? 'border-red-500 bg-red-50'
              : 'border-slate-300 bg-slate-50 hover:border-red-400 hover:bg-red-50/30'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-bold text-slate-700">
            
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{hint}</p>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
              data-attachment-input="true"  
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
                e.target.value = ''; // reset để chọn lại cùng file
              }
            }}
          />
        </div>
      )}

      {/* ============================================
          STATE 2: ĐÃ CÓ FILE → CHỈ HIỆN DANH SÁCH FILE
          ============================================ */}
      {hasFiles && (
        <div className="space-y-1.5">
          {attachments.map((item, idx) => (
            <div
              key={item.id || `pending-${idx}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${
                item.error
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
              } transition`}
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                {item.uploading ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-slate-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {item.fileName}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                  <span>{formatSize(item.fileSize)}</span>
                  {item.fileCategory && (
                    <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase">
                      {item.fileCategory}
                    </span>
                  )}
                  {item.uploading && (
                    <span className="text-blue-600 font-medium">Đang tải lên...</span>
                  )}
                  {item.error && (
                    <span className="text-rose-600 font-medium">{item.error}</span>
                  )}
                </div>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                disabled={item.uploading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Xoá file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Nút "Thêm file" — mở lại khung chọn */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-dashed border-slate-300 hover:border-red-400 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm file khác
          </button>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;