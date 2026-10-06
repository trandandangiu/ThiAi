import React, { useState } from 'react';
import { X, Send, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Dispatch } from '../types/dispatch';

interface SubmitVtModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: Dispatch | null;
  onSubmitVt: (dispatchId: string, yKienTrinhVt: string) => Promise<void>;
  onReturnTp: (dispatchId: string, lyDoTraLai: string) => Promise<void>;
}

export const SubmitVtModal: React.FC<SubmitVtModalProps> = ({
  isOpen,
  onClose,
  dispatch,
  onSubmitVt,
  onReturnTp
}) => {
  const [mode, setMode] = useState<'SUBMIT' | 'RETURN'>('SUBMIT');
  const [yKienTrinhVt, setYKienTrinhVt] = useState('');
  const [lyDoTraLai, setLyDoTraLai] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (dispatch) {
      setYKienTrinhVt(
        `Kính trình Đ/c Viện Trưởng xem xét, phê duyệt báo cáo/dự thảo của ${dispatch.assignedTpName || 'cấp phòng'}. PVT đã kiểm tra tính chính xác và thẩm định nội dung theo quy định.`
      );
      setLyDoTraLai('Yêu cầu đồng chí Trưởng phòng kiểm tra lại số liệu mục 2 và hoàn thiện hồ sơ dự thảo trước khi trình.');
      setMode('SUBMIT');
    }
  }, [dispatch]);

  if (!isOpen || !dispatch) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === 'SUBMIT') {
        await onSubmitVt(dispatch.id, yKienTrinhVt);
      } else {
        await onReturnTp(dispatch.id, lyDoTraLai);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          mode === 'SUBMIT' ? 'bg-amber-800' : 'bg-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {mode === 'SUBMIT' ? (
              <Send className="w-5 h-5 text-amber-300" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-300" />
            )}
            <h2 className="text-base font-bold">
              {mode === 'SUBMIT' ? 'Phê Duyệt & Trình Viện Trưởng' : 'Trả Lại Phòng Yêu Cầu Chỉnh Sửa'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setMode('SUBMIT')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
              mode === 'SUBMIT'
                ? 'border-amber-700 text-amber-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Phê Duyệt Trình Viện Trưởng
          </button>
          <button
            type="button"
            onClick={() => setMode('RETURN')}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
              mode === 'RETURN'
                ? 'border-rose-700 text-rose-900 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Trả Lại Cho Trưởng Phòng
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dispatch info card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {dispatch.soCongVan}
              </span>
              <span className="text-amber-800 font-semibold">
                Phòng gửi: {dispatch.assignedTpName || 'Trưởng phòng'}
              </span>
            </div>
            <div className="font-semibold text-slate-800 line-clamp-2">
              {dispatch.tenCongVan}
            </div>
            {dispatch.baoCaoTienDo && (
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200/80">
                <strong>Báo cáo của cấp phòng:</strong> {dispatch.baoCaoTienDo}
              </div>
            )}
          </div>

          {mode === 'SUBMIT' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ý Kiến Của Phó Viện Trưởng Kính Trình Viện Trưởng:
              </label>
              <textarea
                value={yKienTrinhVt}
                onChange={e => setYKienTrinhVt(e.target.value)}
                rows={4}
                required
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Nhập ý kiến thẩm định và đề xuất trình Viện Trưởng..."
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Công văn sau khi trình sẽ được chuyển sang trạng thái <strong>Chờ Viện Trưởng cho ý kiến</strong>.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-rose-800 mb-1">
                Lý Do & Nội Dung Yêu Cầu Trưởng Phòng Chỉnh Sửa / Bổ Sung:
              </label>
              <textarea
                value={lyDoTraLai}
                onChange={e => setLyDoTraLai(e.target.value)}
                rows={4}
                required
                className="w-full text-xs p-3 border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/20"
                placeholder="Nêu rõ lý do, yêu cầu bổ sung số liệu hoặc hoàn thiện dự thảo..."
              />
              <p className="text-[11px] text-rose-600 mt-1">
                Hồ sơ sẽ được trả lại trạng thái <strong>Đang xử lý</strong> tại phòng để cán bộ tiếp tục hoàn thiện.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 ${
                mode === 'SUBMIT'
                  ? 'bg-amber-700 hover:bg-amber-800 shadow-amber-900/20'
                  : 'bg-rose-700 hover:bg-rose-800 shadow-rose-900/20'
              }`}
            >
              {isSubmitting ? (
                'Đang xử lý...'
              ) : mode === 'SUBMIT' ? (
                <>
                  <Send className="w-4 h-4" />
                  Ký Duyệt & Trình Viện Trưởng
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Trả Lại Hồ Sơ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
