// src/components/attachments/AttachmentList.tsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  AlertCircle,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileCategory: string;
  uploaderName?: string;
  uploaderRole?: string;
  description?: string;
  createdAt: string;
}

interface AttachmentListProps {
  dispatchId: string;
  onCountChange?: (count: number) => void;
  canDelete?: boolean;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) return ImageIcon;
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return FileSpreadsheet;
  return File;
};

const getFileColor = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'bg-red-100 text-red-700 border-red-200';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const getCategoryBadge = (category: string) => {
  const map: Record<string, { label: string; color: string }> = {
    ORIGINAL: { label: 'Bản gốc', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    DRAFT: { label: 'Dự thảo', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    REPORT: { label: 'Báo cáo', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    APPROVAL: { label: 'Phê duyệt', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    REJECTION: { label: 'Từ chối', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    OTHER: { label: 'Khác', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  return map[category] || map.OTHER;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = String(vn.getUTCDate()).padStart(2, '0');
  const month = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const year = vn.getUTCFullYear();
  const hour = String(vn.getUTCHours()).padStart(2, '0');
  const min = String(vn.getUTCMinutes()).padStart(2, '0');
  return `${hour}:${min} ${day}/${month}/${year}`;
};

// ⭐ Kiểm tra file có xem trực tiếp được không
const getPreviewType = (fileName: string): 'image' | 'pdf' | 'text' | 'office' | 'none' => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext || '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(ext || '')) return 'text';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) return 'office';
  return 'none';
};

// ⭐ Detect mobile
const isMobile = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const AttachmentList: React.FC<AttachmentListProps> = ({
  dispatchId,
  onCountChange,
  canDelete = false,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // ⭐ State cho preview modal
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAttachments(dispatchId);
      setAttachments(data);
      onCountChange?.(data.length);
    } catch (e: any) {
      setError(e.message || 'Không thể tải file');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dispatchId) load();
  }, [dispatchId]);

  // ⭐ Xem trước file
  const handlePreview = async (att: Attachment) => {
    setPreviewAttachment(att);
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
    setPreviewError(null);
    
    const type = getPreviewType(att.fileName);
    const mobile = isMobile();
    
    // Office/khác → không preview
    if (type === 'office' || type === 'none') {
      return;
    }
    
    // ⭐ Mobile + PDF → mở native viewer (không dùng iframe)
    if (mobile && type === 'pdf') {
      setIsLoadingPreview(true);
      try {
        const blobUrl = await apiClient.getAttachmentBlobUrl(att.id);
        setPreviewBlobUrl(blobUrl);
      } catch (e: any) {
        setPreviewError(e.message || 'Không thể tải file');
      } finally {
        setIsLoadingPreview(false);
      }
      return;
    }
    
    // Text → fetch nội dung dạng text (chạy cả mobile + desktop)
    if (type === 'text') {
      setIsLoadingPreview(true);
      try {
        const text = await apiClient.getAttachmentTextContent(att.id);
        setPreviewTextContent(text);
      } catch (e: any) {
        setPreviewError(e.message || 'Không thể tải nội dung');
      } finally {
        setIsLoadingPreview(false);
      }
      return;
    }
    
    // Image + Desktop PDF → dùng blob
    setIsLoadingPreview(true);
    try {
      const blobUrl = await apiClient.getAttachmentBlobUrl(att.id);
      setPreviewBlobUrl(blobUrl);
    } catch (e: any) {
      setPreviewError(e.message || 'Không thể tải file');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ⭐ Đóng preview + cleanup blob URL
  const closePreview = () => {
    if (previewBlobUrl && previewBlobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewAttachment(null);
    setPreviewBlobUrl(null);
    setPreviewTextContent(null);
    setPreviewError(null);
  };

  // ⭐ Tải file
  const handleDownload = async (att: Attachment, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setDownloadingId(att.id);
    try {
      await apiClient.downloadAttachment(att.id);
    } catch (e) {
      alert('Không thể tải file');
    } finally {
      setDownloadingId(null);
    }
  };

  // ⭐ Mở file trong tab mới (native viewer của mobile)
  const openInNewTab = async (att: Attachment) => {
    try {
      const blobUrl = await apiClient.getAttachmentBlobUrl(att.id);
      window.open(blobUrl, '_blank');
    } catch (e) {
      alert('Không thể mở file');
    }
  };

  const handleDelete = async (att: Attachment) => {
    if (!window.confirm(`Xóa file "${att.fileName}"?`)) return;
    const ok = await apiClient.deleteAttachment(att.id);
    if (ok) {
      setAttachments(prev => prev.filter(a => a.id !== att.id));
      onCountChange?.(attachments.length - 1);
    } else {
      alert('Không thể xóa file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-xs">Đang tải file...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        <Paperclip className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <div className="text-xs italic">Chưa có file đính kèm</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map(att => {
          const Icon = getFileIcon(att.fileName);
          const color = getFileColor(att.fileName);
          const cat = getCategoryBadge(att.fileCategory);
          const previewType = getPreviewType(att.fileName);
          const canPreview = previewType === 'image' || previewType === 'pdf' || previewType === 'text';

          return (
            <div
              key={att.id}
              onClick={() => handlePreview(att)}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer group ${
                canPreview
                  ? 'bg-white border-slate-200 hover:bg-blue-50/40 hover:border-blue-300 active:bg-blue-50'
                  : 'bg-white border-slate-200 hover:bg-slate-50 active:bg-slate-100'
              }`}
              title={canPreview ? 'Bấm để xem trước' : 'Bấm để xem/tải file'}
            >
              <div className={`w-9 h-9 rounded-lg ${color} border flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {att.fileName}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${cat.color}`}>
                    {cat.label}
                  </span>
                  {canPreview && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />
                      XEM
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span>{formatSize(att.fileSize)}</span>
                  {att.uploaderName && (
                    <>
                      <span>•</span>
                      <span>{att.uploaderName}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatDate(att.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={e => handleDownload(att, e)}
                  disabled={downloadingId === att.id}
                  className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition cursor-pointer disabled:opacity-50"
                  title="Tải về"
                >
                  {downloadingId === att.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                </button>

                {canDelete && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(att);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-300 transition cursor-pointer"
                    title="Xóa file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ⭐ PREVIEW MODAL */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 text-white">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold truncate">
                    {previewAttachment.fileName}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-white/60">
                    {formatSize(previewAttachment.fileSize)} • {formatDate(previewAttachment.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleDownload(previewAttachment)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-red-950 rounded-lg font-bold text-[10px] sm:text-xs transition cursor-pointer"
                >
                  <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Tải về</span>
                </button>

                <button
                  onClick={closePreview}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-2 sm:p-4">
              {isLoadingPreview && (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span className="text-sm font-medium">Đang tải file...</span>
                </div>
              )}

              {previewError && (
                <div className="flex flex-col items-center gap-3 text-center max-w-md">
                  <AlertCircle className="w-12 h-12 text-rose-500" />
                  <div className="font-bold text-slate-800">{previewError}</div>
                  <button
                    onClick={() => handleDownload(previewAttachment)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Tải về để xem
                  </button>
                </div>
              )}

              {!isLoadingPreview && !previewError && (() => {
                const type = getPreviewType(previewAttachment.fileName);
                const mobile = isMobile();

                // ⭐ IMAGE — Chạy cả mobile + desktop
                if (type === 'image' && previewBlobUrl) {
                  return (
                    <img
                      src={previewBlobUrl}
                      alt={previewAttachment.fileName}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  );
                }

                // ⭐ TEXT — Hiển thị nội dung text trực tiếp
                if (type === 'text' && previewTextContent !== null) {
                  return (
                    <pre className="w-full h-full min-h-[60vh] bg-white rounded-lg shadow-lg p-4 text-xs sm:text-sm text-slate-800 overflow-auto whitespace-pre-wrap break-words font-mono">
                      {previewTextContent}
                    </pre>
                  );
                }

                // ⭐ PDF trên MOBILE — Hiện nút mở native viewer
                if (type === 'pdf' && mobile) {
                  return (
                    <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
                      <div className="w-20 h-20 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-red-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg mb-1">
                          File PDF
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed">
                          Điện thoại không hỗ trợ xem PDF trong trang web.
                          <br />
                          Bấm nút bên dưới để mở bằng ứng dụng xem PDF.
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <button
                          onClick={() => openInNewTab(previewAttachment)}
                          className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Mở PDF
                        </button>
                        <button
                          onClick={() => handleDownload(previewAttachment)}
                          className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 border border-slate-300"
                        >
                          <Download className="w-4 h-4" />
                          Tải về
                        </button>
                      </div>
                    </div>
                  );
                }

                // ⭐ PDF trên DESKTOP — Hiện iframe
                if (type === 'pdf' && previewBlobUrl) {
                  return (
                    <iframe
                      src={previewBlobUrl}
                      title={previewAttachment.fileName}
                      className="w-full h-full min-h-[70vh] rounded-lg shadow-lg bg-white"
                    />
                  );
                }

                // ⭐ OFFICE — Không hỗ trợ preview
                if (type === 'office') {
                  return (
                    <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
                      <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
                        <FileText className="w-10 h-10 text-amber-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg mb-1">
                          File Office
                        </div>
                        <div className="text-sm text-slate-600 leading-relaxed">
                          File Word / Excel / PowerPoint không hỗ trợ xem trực tiếp trên trình duyệt.
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(previewAttachment)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        Tải về để xem
                      </button>
                    </div>
                  );
                }

                // ⭐ FILE KHÁC
                if (type === 'none') {
                  return (
                    <div className="flex flex-col items-center gap-4 text-center max-w-md p-6">
                      <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center">
                        <File className="w-10 h-10 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-lg mb-1">
                          Định dạng không hỗ trợ xem trực tiếp
                        </div>
                        <div className="text-sm text-slate-600">
                          Vui lòng tải về để mở bằng ứng dụng phù hợp.
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(previewAttachment)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        Tải về
                      </button>
                    </div>
                  );
                }

                return null;
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentList;