import React, { useState, useEffect } from 'react';
import { X, CheckCircle, FileText, UserCheck } from 'lucide-react';
import { Dispatch, DispatchStatus } from '../types/dispatch';

interface ReportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: Dispatch | null;
  onSave: (data: {
    tienDo?: number;
    trangThai?: DispatchStatus;
    baoCaoTienDo?: string;
    nguoiThucHien?: string;
  }) => void;
}

export const ReportProgressModal: React.FC<ReportProgressModalProps> = ({
  isOpen,
  onClose,
  dispatch,
  onSave
}) => {
  const [tienDo, setTienDo] = useState<number>(0);
  const [trangThai, setTrangThai] = useState<DispatchStatus>('DANG_XU_LY');
  const [baoCaoTienDo, setBaoCaoTienDo] = useState<string>('');
  const [nguoiThucHien, setNguoiThucHien] = useState<string>('');

  useEffect(() => {
    if (dispatch) {
      setTienDo(dispatch.tienDo ?? 0);
      setTrangThai(dispatch.trangThai || 'DANG_XU_LY');
      setBaoCaoTienDo(dispatch.baoCaoTienDo || '');
      setNguoiThucHien(dispatch.nguoiThucHien || '');
    }
  }, [dispatch]);

  if (!isOpen || !dispatch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      tienDo,
      trangThai,
      baoCaoTienDo,
      nguoiThucHien
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between text-white border-b bg-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-300" />
            <h2 className="text-base font-bold">Cập Nhật Tiến Độ & Báo Cáo Lãnh Đạo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span>Số CV: <strong className="text-slate-800 font-mono">{dispatch.soCongVan}</strong></span>
              <span>Hạn xử lý: <strong className="text-red-700">{dispatch.hanBaoCaoXuLy || 'Chưa định'}</strong></span>
            </div>
            <div className="text-slate-800 font-semibold line-clamp-2">
              {dispatch.tenCongVan}
            </div>
          </div>

          {/* Cán bộ / Chuyên viên xử lý */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cán Bộ / Kiểm Sát Viên Trực Tiếp Thực Hiện
            </label>
            <input
              type="text"
              value={nguoiThucHien}
              onChange={e => setNguoiThucHien(e.target.value)}
              placeholder="Nhập họ tên cán bộ thụ lý (vd: Đ/c Nguyễn Văn A - KSV)"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Tiến độ % */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tiến Độ Thực Hiện ({tienDo}%)
              </label>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${tienDo === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                {tienDo === 100 ? 'Đã hoàn tất' : `${tienDo}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={tienDo}
              onChange={e => {
                const val = Number(e.target.value);
                setTienDo(val);
                if (val === 100) setTrangThai('HOAN_THANH');
                else if (trangThai === 'HOAN_THANH' && val < 100) setTrangThai('DANG_XU_LY');
              }}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Trạng thái xử lý */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Trạng Thái Xử Lý
            </label>
            <select
              value={trangThai}
              onChange={e => setTrangThai(e.target.value as DispatchStatus)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
            >
              <option value="DANG_XU_LY">Đang xử lý</option>
              <option value="SAP_DEN_HAN">Sắp đến hạn</option>
              <option value="CHO_Y_KIEN_LANH_DAO">Chờ ý kiến Lãnh đạo duyệt</option>
              <option value="HOAN_THANH">Đã hoàn thành</option>
            </select>
          </div>

          {/* Báo cáo kết quả xử lý */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nội Dung Báo Cáo Tiến Độ / Kết Quả Giải Quyết
            </label>
            <textarea
              rows={3}
              value={baoCaoTienDo}
              onChange={e => setBaoCaoTienDo(e.target.value)}
              placeholder="Tóm tắt kết quả đã thực hiện gửi Lãnh đạo Viện (vd: Đã lập biên bản kiểm tra, hoàn thành dự thảo văn bản báo cáo...)"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800"
            >
              <CheckCircle className="w-4 h-4" />
              Lưu Báo Cáo Tiến Độ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
