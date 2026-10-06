import React from 'react';
import { 
  Bell, 
  Send, 
  AlertCircle, 
  Clock, 
  FileText, 
  CheckCircle2, 
  CheckCheck,
  ChevronRight
} from 'lucide-react';
import { Dispatch } from '../../types/dispatch';

interface PvtNotificationsViewProps {
  pendingSubmitVtDispatches: Dispatch[];
  dispatchesFromVt: Dispatch[];
  onOpenDetail: (disp: Dispatch) => void;
  onOpenSubmitVt: (disp: Dispatch) => void;
}

export const PvtNotificationsView: React.FC<PvtNotificationsViewProps> = ({
  pendingSubmitVtDispatches,
  dispatchesFromVt,
  onOpenDetail,
  onOpenSubmitVt
}) => {
  const notifications = [
    ...pendingSubmitVtDispatches.map(d => ({
      id: `notif-pending-${d.id}`,
      type: 'PENDING_VT',
      title: `${d.customFields?.submittedBy || d.assignedTpName || 'Trưởng phòng'} vừa trình báo cáo công văn ${d.soCongVan}`,
      description: d.tenCongVan,
      time: d.customFields?.submittedTimeAgo || '1 giờ trước',
      isUnread: true,
      dispatch: d
    })),
    ...dispatchesFromVt.slice(0, 3).map(d => ({
      id: `notif-vt-${d.id}`,
      type: 'VT_ASSIGN',
      title: `Viện Trưởng đã giao công văn ${d.soCongVan}`,
      description: d.vtChiDao || d.tenCongVan,
      time: 'Hôm nay',
      isUnread: false,
      dispatch: d
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Thông Báo Điều Hành & Nhắc Việc ({notifications.length})
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cập nhật tức thì các văn bản mới từ Viện Trưởng và báo cáo thẩm định từ các phòng nghiệp vụ
          </p>
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs italic">
            Không có thông báo mới nào.
          </div>
        ) : (
          notifications.map(item => (
            <div
              key={item.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                item.isUnread ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  item.type === 'PENDING_VT'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {item.type === 'PENDING_VT' ? (
                    <Send className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    {item.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 max-w-2xl">
                    {item.description}
                  </p>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {item.type === 'PENDING_VT' && (
                  <button
                    onClick={() => onOpenSubmitVt(item.dispatch)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition cursor-pointer"
                  >
                    Duyệt Trình VT
                  </button>
                )}
                <button
                  onClick={() => onOpenDetail(item.dispatch)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Xem
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
