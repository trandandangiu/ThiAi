// frontend/src/components/header/NotificationBell.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, ArrowRight, Inbox } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatRelativeTime } from '../../utils/format';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    latestNotification,
    markAsRead,
    markAllAsRead,
    markAllAsReadOnOpen,   // ⭐ THÊM
    isConnected,
  } = useNotifications();

  // Toast hiện khi có thông báo mới
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    content?: string;
    dispatchId?: string;
  } | null>(null);

  useEffect(() => {
    if (latestNotification && !latestNotification.isRead) {
      setToast({
        id: latestNotification.id,
        title: latestNotification.title,
        content: latestNotification.content,
        dispatchId: latestNotification.dispatchId,
      });

      const t = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(t);
    }
  }, [latestNotification]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ⭐ KHI MỞ CHUÔNG → TỰ ĐỘNG ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
  const handleToggleOpen = async () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    // Chỉ khi MỞ và có thông báo chưa đọc → đánh dấu đã đọc
    if (willOpen && unreadCount > 0) {
      // Đợi 1 nhịp cho animation mở xong → mới ẩn badge
      setTimeout(() => {
        markAllAsReadOnOpen();
      }, 500);
    }
  };

  const handleClickNotification = async (n: any) => {
    if (!n.isRead) {
      await markAsRead(n.id);
    }
    setIsOpen(false);
    setToast(null);

    if (n.dispatchId) {
      navigate(`/dispatches/${n.dispatchId}`);
    } else if (n.referenceType === 'dispatch' && n.referenceId) {
      navigate(`/dispatches/${n.referenceId}`);
    } else {
      navigate('/');
    }
  };

  const handleToastView = async () => {
    if (!toast) return;
    try {
      await markAsRead(toast.id);
    } catch {}
    const dispatchId = toast.dispatchId;
    setToast(null);
    if (dispatchId) navigate(`/dispatches/${dispatchId}`);
    else navigate('/');
  };

  // ⭐ LỌC: Chỉ hiển thị thông báo CHƯA ĐỌC trong dropdown
  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleToggleOpen}
          className="relative p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          title="Thông báo"
        >
          <Bell className="w-5 h-5 text-white" />

          {/* Badge đỏ — chỉ hiện khi có thông báo chưa đọc */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white/90 animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {isConnected && (
            <span
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 border border-white"
              title="Đang nhận thông báo realtime"
            />
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-700" />
                <span className="font-bold text-slate-900 text-sm">
                  Thông báo mới
                </span>
                {unreadNotifications.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {/* ⭐ CHỈ HIỂN THỊ THÔNG BÁO CHƯA ĐỌC */}
              {unreadNotifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <div className="font-medium">Không có thông báo mới</div>
                  <div className="text-xs mt-1">Các thông báo đã xem sẽ tự động ẩn</div>
                </div>
              ) : (
                unreadNotifications.slice(0, 20).map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClickNotification(n)}
                    className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 active:bg-slate-100 transition cursor-pointer bg-blue-50/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-blue-600" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900">
                          {n.title}
                        </div>
                        {n.content && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {n.content}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center justify-between">
                          <span>{formatRelativeTime(n.createdAt)}</span>
                          {n.dispatchId && (
                            <span className="text-blue-600 font-bold flex items-center gap-0.5">
                              Xem
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer: nút đánh dấu tất cả đã đọc */}
            {unreadNotifications.length > 0 && (
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button
                  onClick={async () => {
                    await markAllAsReadOnOpen();
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast — giữ nguyên */}
      {toast && (
        <div className="fixed top-20 right-4 z-[60] max-w-sm animate-slideInRight">
          <div className="bg-white rounded-2xl shadow-2xl border-l-4 border-red-600 border border-slate-200 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-0.5">
                    Thông báo mới
                  </div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">
                    {toast.title}
                  </div>
                  {toast.content && (
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {toast.content}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleToastView}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Xem ngay
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setToast(null)}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};