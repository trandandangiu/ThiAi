// src/pages/ChuyenDeDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Clock, CheckCircle2, Lock,
  FileText, Paperclip, UserCheck, CornerDownRight, Eye,
  Calendar, TrendingUp, Building2, User, Trash2,
} from 'lucide-react';
import { Dispatch } from '../types/dispatch';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  isChuyenDe,
  getChuyenDeData,
  getChuyenDePhase,
  getMilestoneProgress,
  markMilestoneComplete,
  resolveChuyenDeStatus,
  formatChuyenDeDate,
} from '../utils/chuyenDe';

interface Attachment {
  id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileCategory?: string;
  uploaderName?: string;
  createdAt?: string;
}

const formatSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 ChuyenDeDetailPage CRASH:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-rose-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Lỗi hiển thị chuyên đề
              </h3>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
              <div className="text-xs font-mono text-rose-900 break-all">
                {this.state.error?.message || 'Lỗi không xác định'}
              </div>
              <div className="text-[10px] font-mono text-rose-700 mt-2 break-all">
                {this.state.error?.stack?.slice(0, 500)}
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ChuyenDeDetailInner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [chuyenDe, setChuyenDe] = useState<Dispatch | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const canEdit = !!currentUser &&
    ['ADMIN', 'VIEN_TRUONG', 'PHO_VIEN_TRUONG', 'TRUONG_PHONG'].includes(
      currentUser.role || ''
    );

  const canDelete = !!currentUser &&
    ['ADMIN', 'VIEN_TRUONG', 'PHO_VIEN_TRUONG'].includes(
      currentUser.role || ''
    );

  // LOAD DATA
  useEffect(() => {
    if (!id) {
      setError('Không có ID chuyên đề');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getDispatchById(id);

        if (!data) {
          setError('Không tìm thấy chuyên đề');
          return;
        }

        if (!isChuyenDe(data)) {
          navigate(`/dispatches/${id}`, { replace: true });
          return;
        }

        setChuyenDe(data);

        try {
          const files = await apiClient.getAttachments(id);
          setAttachments(Array.isArray(files) ? files : []);
        } catch (fileErr) {
          setAttachments([]);
        }
      } catch (err: any) {
        setError(err?.message || 'Lỗi tải chuyên đề');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  // DELETE
  const handleConfirmDelete = async () => {
    if (!chuyenDe) return;

    setIsDeleting(true);
    try {
      const ok = await apiClient.hardDeleteDispatch(chuyenDe.id);

      if (ok) {
        setShowDeleteConfirm(false);
        showToast(`Đã xóa vĩnh viễn chuyên đề "${chuyenDe.soCongVan}"`, 'success');

        setTimeout(() => {
          navigate(-1);
        }, 1200);
      } else {
        showToast('Không thể xóa chuyên đề', 'error');
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi xóa chuyên đề', 'error');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // COMPLETE MILESTONE
  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!chuyenDe || !canEdit) return;
    if (!window.confirm(
      'Đánh dấu hoàn thành mốc này?\n\nMốc tiếp theo sẽ tự động kích hoạt.'
    )) return;

    setCompletingId(milestoneId);
    try {
      const updatedMilestones = markMilestoneComplete(chuyenDe, milestoneId);
      const allDone = updatedMilestones.every(m => m.trangThai === 'HOAN_THANH');

      const updatedCustomFields = {
        ...(chuyenDe.customFields || {}),
        chuyenDe: { milestones: updatedMilestones },
      };

      const tempCD = {
        ...chuyenDe,
        customFields: updatedCustomFields,
        trangThai: allDone ? ('HOAN_THANH' as const) : chuyenDe.trangThai,
      };

      const newStatus = allDone ? 'HOAN_THANH' : resolveChuyenDeStatus(tempCD);

      const updated = await apiClient.updateDispatch(chuyenDe.id, {
        customFields: updatedCustomFields,
        trangThai: newStatus,
        tienDo: allDone ? 100 : chuyenDe.tienDo,
      } as any);

      if (updated) {
        setChuyenDe({
          ...chuyenDe,
          customFields: updatedCustomFields,
          trangThai: newStatus,
          tienDo: allDone ? 100 : chuyenDe.tienDo,
        });
        showToast(
          allDone
            ? '🎉 Đã hoàn thành toàn bộ chuyên đề!'
            : '✅ Đã hoàn thành mốc — mốc tiếp theo đã kích hoạt',
          'success'
        );
      } else {
        showToast('Không thể cập nhật', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi cập nhật', 'error');
    } finally {
      setCompletingId(null);
    }
  };

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

  // LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">Đang tải chuyên đề...</span>
        </div>
      </div>
    );
  }

  // ERROR
  if (error || !chuyenDe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Không tìm thấy chuyên đề
            </h2>
            <p className="text-sm text-slate-600">{error || 'Lỗi không xác định'}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-teal-600 hover:bg-teal-700 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const phase = getChuyenDePhase(chuyenDe);
  const progress = getMilestoneProgress(chuyenDe);
  const { milestones } = getChuyenDeData(chuyenDe);
  const isCompleted = chuyenDe.trangThai === 'HOAN_THANH';

  return (
    <>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        {/* HEADER */}
        <header
          className="sticky top-0 z-30 text-white shadow-md border-b-2"
          style={{ backgroundColor: '#0D9488', borderColor: '#0F766E' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer shrink-0"
                title="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="text-[10px] font-black tracking-widest uppercase text-teal-100">
                  📋 Chuyên đề
                </div>
                <div className="text-sm font-bold font-mono truncate">
                  {chuyenDe.soCongVan || '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-black uppercase ${phase.bgClass} ${phase.textClass} ${phase.borderClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${phase.dotColor}`} />
                {phase.label}
              </span>

              {canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Xóa vĩnh viễn chuyên đề này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Xóa</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* BODY */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Title Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-1">
                  Nội dung chuyên đề
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                  {chuyenDe.tenCongVan || '—'}
                </h1>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
              <MetaItem
                icon={Building2}
                label="Đơn vị ban hành"
                value={chuyenDe.donViBanHanh || '—'}
              />
              <MetaItem
                icon={Calendar}
                label="Ngày tiếp nhận"
                value={formatChuyenDeDate(chuyenDe.ngayGui)}
              />
              <MetaItem
                icon={User}
                label="Người thực hiện"
                value={chuyenDe.nguoiThucHien || '—'}
              />
              <MetaItem
                icon={Paperclip}
                label="File đính kèm"
                value={`${attachments.length} file`}
              />
            </div>
          </div>

          {/* Progress + Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tiến độ chuyên đề
                </h3>
              </div>

              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-4xl font-black text-teal-700">
                  {progress.percent}%
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {progress.done}/{progress.total} mốc
                </span>
              </div>

              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                {milestones.map((m, idx) => {
                  const isDone = m.trangThai === 'HOAN_THANH';
                  const isActive = idx === phase.milestoneIndex;
                  return (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`truncate flex-1 ${
                          isDone
                            ? 'text-slate-500 line-through'
                            : isActive
                              ? 'text-slate-900 font-bold'
                              : 'text-slate-400'
                        }`}
                      >
                        {m.ten}
                      </span>
                      {isActive && !isDone && (
                        <span className="text-[9px] font-black text-blue-600">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Chuỗi mốc thời hạn ({milestones.length})
                </h3>
              </div>

              {milestones.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Chưa có mốc nào
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200" />
                  <div className="space-y-4">
                    {milestones.map((m, idx) => {
                      const isActive = idx === phase.milestoneIndex;
                      const isDone = m.trangThai === 'HOAN_THANH';
                      const isLocked = m.trangThai === 'CHUA_KICH_HOAT';

                      let daysLeft: number | null = null;
                      if (isActive && m.han) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const han = new Date(m.han);
                        han.setHours(0, 0, 0, 0);
                        daysLeft = Math.round((han.getTime() - today.getTime()) / 86400000);
                      }

                      let cardClass = 'border-slate-200 bg-white';
                      let badge: React.ReactNode = null;

                      if (isDone) {
                        cardClass = 'border-emerald-200 bg-emerald-50/40';
                        badge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Hoàn thành
                          </span>
                        );
                      } else if (isActive) {
                        if (daysLeft !== null && daysLeft < 0) {
                          cardClass = 'border-rose-300 bg-rose-50/40';
                          badge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3 h-3" />
                              Quá hạn {Math.abs(daysLeft)} ngày
                            </span>
                          );
                        } else if (daysLeft !== null && daysLeft <= 7) {
                          cardClass = 'border-amber-300 bg-amber-50/40';
                          badge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertCircle className="w-3 h-3" />
                              Còn {daysLeft} ngày
                            </span>
                          );
                        } else {
                          cardClass = 'border-blue-300 bg-blue-50/40';
                          badge = (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <Clock className="w-3 h-3" />
                              {daysLeft !== null ? `Còn ${daysLeft} ngày` : 'Đang thực hiện'}
                            </span>
                          );
                        }
                      } else if (isLocked) {
                        cardClass = 'border-slate-200 bg-slate-50/60 opacity-70';
                        badge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <Lock className="w-3 h-3" />
                            Chờ mốc trước
                          </span>
                        );
                      }

                      return (
                        <div key={m.id} className="relative flex gap-3">
                          <div
                            className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border-4 border-white shadow ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            {isDone ? '✓' : idx + 1}
                          </div>

                          <div className={`flex-1 p-3.5 rounded-xl border-2 ${cardClass}`}>
                            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                              <div className="text-sm font-bold text-slate-900">
                                {m.ten}
                              </div>
                              {badge}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Hạn:{' '}
                                <strong className="text-slate-800">
                                  {formatChuyenDeDate(m.han)}
                                </strong>
                              </span>
                              {isDone && m.hoanThanhLuc && (
                                <span className="text-emerald-700 font-semibold">
                                  ✓ Hoàn thành: {formatChuyenDeDate(m.hoanThanhLuc)}
                                </span>
                              )}
                            </div>

                            {isActive && !isDone && canEdit && !isCompleted && (
                              <div className="mt-3 pt-3 border-t border-slate-200/60">
                                <button
                                  type="button"
                                  onClick={() => handleCompleteMilestone(m.id)}
                                  disabled={completingId === m.id}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-xs"
                                >
                                  {completingId === m.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  Đánh dấu hoàn thành mốc này
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Phân công + Files */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Phân công xử lý</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phó viện trưởng phụ trách
                  </div>
                  {chuyenDe.assignedPvtName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg font-semibold text-sm">
                      <UserCheck className="w-4 h-4" />
                      {chuyenDe.assignedPvtName}
                    </span>
                  ) : (
                    <span className="text-sm italic text-slate-400">Chưa phân công</span>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Trưởng phòng
                  </div>
                  {chuyenDe.assignedTpName ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold text-sm">
                      <CornerDownRight className="w-4 h-4" />
                      {chuyenDe.assignedTpName}
                    </span>
                  ) : (
                    <span className="text-sm italic text-slate-400">Chưa phân công</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Paperclip className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  File đính kèm ({attachments.length})
                </h3>
              </div>

              {attachments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Chưa có file đính kèm
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {attachments.map(att => (
                    <div
                      key={att.id}
                      onClick={() => handleOpenFile(att)}
                      className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer transition group"
                    >
                      <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {att.fileName}
                        </div>
                        {att.fileSize && (
                          <div className="text-[10px] text-slate-400">
                            {formatSize(att.fileSize)}
                          </div>
                        )}
                      </div>
                      <Eye className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
        </main>

        {toast && (
          <div className="fixed bottom-6 right-6 z-[70]">
            <div
              className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${
                toast.type === 'success'
                  ? 'bg-slate-900 text-white border-slate-700'
                  : 'bg-rose-600 text-white border-rose-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toast.msg}</span>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa vĩnh viễn chuyên đề"
        message={
          `Bạn có chắc chắn muốn xóa vĩnh viễn chuyên đề "${chuyenDe?.soCongVan}"?\n\n` +
          `⚠️ Hành động này KHÔNG THỂ hoàn tác.\n` +
          `Toàn bộ dữ liệu sau sẽ bị xóa vĩnh viễn:\n` +
          `• Thông tin chuyên đề và các mốc thời hạn\n` +
          `• File đính kèm (${attachments.length} file)\n` +
          `• Lịch sử phân công, báo cáo, từ chối\n` +
          `• Ý kiến chỉ đạo của các cấp`
        }
        confirmText={isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
        cancelText="Hủy bỏ"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

export const ChuyenDeDetailPage: React.FC = () => (
  <PageErrorBoundary>
    <ChuyenDeDetailInner />
  </PageErrorBoundary>
);

const MetaItem: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div>
    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
      <Icon className="w-3 h-3" />
      {label}
    </div>
    <div className="text-xs font-semibold text-slate-800 truncate">{value}</div>
  </div>
);

export default ChuyenDeDetailPage;