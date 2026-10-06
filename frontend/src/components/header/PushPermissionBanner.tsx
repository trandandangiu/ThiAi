// frontend/src/components/header/PushPermissionBanner.tsx
import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { pushService } from '../../services/pushService';

export const PushPermissionBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pushService.isSupported()) return;

    const perm = pushService.getPermission();
    if (perm === 'granted') return;
    if (perm === 'denied') return;
    if (localStorage.getItem('push_banner_dismissed') === '1') return;

    // Đợi 2s cho trang ổn định
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    const ok = await pushService.subscribe();
    setLoading(false);

    if (ok) {
      setShow(false);
      alert(
        '✅ Đã bật thông báo!\n\n' +
        'Từ giờ bạn sẽ nhận được thông báo khi có công văn mới, ' +
        'kể cả khi đã đóng ứng dụng.'
      );
    } else {
      const perm = pushService.getPermission();
      if (perm === 'denied') {
        alert(
          '❌ Trình duyệt đã từ chối quyền thông báo.\n\n' +
          'Vào Cài đặt trình duyệt → Site settings → Notifications → Cho phép.'
        );
      } else {
        alert('❌ Không thể bật thông báo. Vui lòng thử lại.');
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_banner_dismissed', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-red-700 to-red-800 text-white px-3 sm:px-4 py-2.5 sm:py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm">Bật thông báo</div>
            <div className="text-[10px] sm:text-xs text-white/90 truncate">
             
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-white text-red-800 font-bold text-[11px] sm:text-xs rounded-lg hover:bg-amber-100 transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? 'Đang bật...' : 'Bật ngay'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            title="Bỏ qua"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};