import React, { useState, useEffect } from 'react';
import { X, UserCheck, Calendar, AlertCircle } from 'lucide-react';
import { Dispatch } from '../types/dispatch';
import { User } from '../types/auth';

interface AssignPvtModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: Dispatch | null;
  pvtList: User[];
  onAssign: (data: {
    pvtId: string;
    pvtName: string;
    vtChiDao: string;
    hanBaoCaoXuLy?: string;
    mucDoKhan?: string;
  }) => void;
}

export const AssignPvtModal: React.FC<AssignPvtModalProps> = ({
  isOpen,
  onClose,
  dispatch,
  pvtList,
  onAssign
}) => {
  const [selectedPvtId, setSelectedPvtId] = useState<string>('');
  const [vtChiDao, setVtChiDao] = useState<string>('');
  const [hanBaoCaoXuLy, setHanBaoCaoXuLy] = useState<string>('');
  const [mucDoKhan, setMucDoKhan] = useState<string>('THUONG');

  useEffect(() => {
    if (dispatch) {
      setSelectedPvtId(dispatch.assignedPvtId || (pvtList[0]?.id || ''));
      setVtChiDao(dispatch.vtChiDao || '');
      setHanBaoCaoXuLy(dispatch.hanBaoCaoXuLy || '');
      setMucDoKhan(dispatch.mucDoKhan || 'THUONG');
    }
  }, [dispatch, pvtList]);

  if (!isOpen || !dispatch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPvtId) return;

    const targetPvt = pvtList.find(p => p.id === selectedPvtId || p.roomCode === selectedPvtId);
    const pvtName = targetPvt ? targetPvt.fullName : selectedPvtId;

    onAssign({
      pvtId: selectedPvtId,
      pvtName,
      vtChiDao,
      hanBaoCaoXuLy,
      mucDoKhan
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white border-b"
          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-300" />
            <h2 className="text-base font-bold">Viện Trưởng Phân Công Phó Viện Trưởng</h2>
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
          {/* Dispatch Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Số công văn: <strong className="text-slate-800 font-mono text-sm">{dispatch.soCongVan}</strong></span>
              <span>Đơn vị gửi: <strong className="text-slate-700">{dispatch.donViBanHanh}</strong></span>
            </div>
            <div className="text-slate-800 font-semibold leading-relaxed line-clamp-2">
              {dispatch.tenCongVan}
            </div>
          </div>

          {/* Chọn Phó Viện Trưởng (1 -> 12) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Chọn Phó Viện Trưởng Phụ Trách (1 - 12) <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={selectedPvtId}
              onChange={e => setSelectedPvtId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white font-medium shadow-2xs"
            >
              <option value="" disabled>-- Chọn Phó Viện Trưởng --</option>
              {pvtList.map(pvt => (
                <option key={pvt.id} value={pvt.id}>
                  {pvt.fullName} ({pvt.roomCode})
                </option>
              ))}
            </select>
          </div>

          {/* Hạn báo cáo & Mức độ khẩn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hạn Báo Cáo / Hoàn Thành
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={hanBaoCaoXuLy}
                  onChange={e => setHanBaoCaoXuLy(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mức Độ Khẩn
              </label>
              <select
                value={mucDoKhan}
                onChange={e => setMucDoKhan(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
              >
                <option value="THUONG">Bình thường</option>
                <option value="KHAN">Khẩn</option>
                <option value="THUONG_KHAN">Thượng khẩn</option>
                <option value="HOA_TOC">Hỏa tốc</option>
              </select>
            </div>
          </div>

          {/* Ý kiến chỉ đạo của Viện Trưởng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ý Kiến Chỉ Đạo Của Viện Trưởng
            </label>
            <textarea
              rows={3}
              value={vtChiDao}
              onChange={e => setVtChiDao(e.target.value)}
              placeholder="Nhập ý kiến chỉ đạo cụ thể cho Phó Viện trưởng (vd: Giao Đ/c PVT trực tiếp chỉ đạo thẩm tra, báo cáo kết quả trước ngày...)"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none shadow-2xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: '#B71C1C' }}
            >
              <UserCheck className="w-4 h-4" />
              Lưu & Phân Công PVT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
