import React, { useState, useEffect } from 'react';
import { X, CornerDownRight, ShieldAlert, Calendar } from 'lucide-react';
import { Dispatch } from '../types/dispatch';
import { formatDate } from '../utils/format';
import { User } from '../types/auth';

interface AssignTpModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: Dispatch | null;
  tpList: User[];
  currentPvt: User | null;
  onAssign: (data: {
    fromPvtId: string;
    fromPvtName: string;
    tpId: string;
    tpName: string;
    pvtChiDao: string;
    hanBaoCaoXuLy?: string;
  }) => void;
}

export const AssignTpModal: React.FC<AssignTpModalProps> = ({
  isOpen,
  onClose,
  dispatch,
  tpList,
  currentPvt,
  onAssign
}) => {
  const [selectedTpId, setSelectedTpId] = useState<string>('');
  const [pvtChiDao, setPvtChiDao] = useState<string>('');
  const [hanBaoCaoXuLy, setHanBaoCaoXuLy] = useState<string>('');

  // Filter or prioritize rooms directly under this PVT
  const subordinateRooms = tpList.filter(
    tp => currentPvt && (tp.pvtManagerId === currentPvt.id || tp.pvtManagerId === currentPvt.roomCode)
  );

  useEffect(() => {
    if (dispatch) {
      setSelectedTpId(dispatch.assignedTpId || (subordinateRooms[0]?.id || tpList[0]?.id || ''));
      setPvtChiDao(dispatch.pvtChiDao || '');
      setHanBaoCaoXuLy(dispatch.hanBaoCaoXuLy || '');
    }
  }, [dispatch, tpList, currentPvt]);

  if (!isOpen || !dispatch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTpId || !currentPvt) return;

    const targetTp = tpList.find(t => t.id === selectedTpId || t.roomCode === selectedTpId);
    const tpName = targetTp ? targetTp.fullName : selectedTpId;

    onAssign({
      fromPvtId: currentPvt.id,
      fromPvtName: currentPvt.fullName,
      tpId: selectedTpId,
      tpName,
      pvtChiDao,
      hanBaoCaoXuLy
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white border-b bg-amber-800"
        >
          <div className="flex items-center gap-2">
            <CornerDownRight className="w-5 h-5 text-amber-300" />
            <h2 className="text-base font-bold">Phó Viện Trưởng Chỉ Đạo & Giao Lãnh Đạo Phòng</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Dispatch Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Số CV: <strong className="text-slate-800 font-mono text-sm">{dispatch.soCongVan}</strong></span>
              <span>Hạn xử lý: <strong className="text-red-700">{formatDate(dispatch.hanBaoCaoXuLy) || 'Chưa định'}</strong></span>
            </div>
            <div className="text-slate-800 font-semibold line-clamp-2">
              {dispatch.tenCongVan}
            </div>
          </div>

          {/* Chỉ đạo của Viện Trưởng nếu có */}
          {dispatch.vtChiDao && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Chỉ Đạo Của Viện Trưởng:
              </div>
              <p className="text-rose-900 italic font-medium leading-relaxed pl-5">
                "{dispatch.vtChiDao}"
              </p>
            </div>
          )}

          {/* Chọn Lãnh đạo phòng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Chọn Lãnh Đạo Phòng Dưới Quyền (TP 1 - 12) <span className="text-red-600">*</span>
            </label>
            <select
              required
              value={selectedTpId}
              onChange={e => setSelectedTpId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium shadow-2xs"
            >
              <option value="" disabled>-- Chọn Lãnh đạo phòng nhận nhiệm vụ --</option>
              {subordinateRooms.length > 0 && (
                <optgroup label="Phòng trực thuộc quyền quản lý của PVT">
                  {subordinateRooms.map(tp => (
                    <option key={tp.id} value={tp.id}>
                      ★ {tp.fullName} ({tp.roomCode})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Tất cả các phòng ban khác">
                {tpList
                  .filter(tp => !subordinateRooms.some(s => s.id === tp.id))
                  .map(tp => (
                    <option key={tp.id} value={tp.id}>
                      {tp.fullName} ({tp.roomCode})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Hạn Báo Cáo cho Phòng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hạn Yêu Cầu Cấp Phòng Báo Cáo
            </label>
            <input
              type="date"
              value={hanBaoCaoXuLy}
              onChange={e => setHanBaoCaoXuLy(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Ý kiến chỉ đạo của PVT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ý Kiến Chỉ Đạo Của Phó Viện Trưởng
            </label>
            <textarea
              rows={3}
              required
              value={pvtChiDao}
              onChange={e => setPvtChiDao(e.target.value)}
              placeholder="Nhập ý kiến chỉ đạo cho Trưởng phòng (vd: Yêu cầu Đ/c Trưởng phòng phân công KSV xử lý ngay, gửi dự thảo báo cáo trước 15h...)"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-2xs"
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
              className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900"
            >
              <CornerDownRight className="w-4 h-4" />
              Lưu & Chỉ Đạo Cấp Phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
