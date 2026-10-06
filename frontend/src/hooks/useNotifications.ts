// frontend/src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { useSSE } from './useSSE';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content?: string;
  dispatchId?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ⭐ Load ban đầu
  const loadInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await apiClient.getNotifications({ page: 1 });
      setNotifications(list || []);

      // ⭐ Dùng số đếm từ backend (chính xác)
      const count = await apiClient.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Lỗi load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ⭐ SSE — nhận realtime
  const { isConnected } = useSSE({
    enabled: true,
    onNotification: (notif: NotificationItem) => {
      console.log('🔔 Nhận notification realtime:', notif);

      // 1. Chèn vào đầu list (tránh trùng)
      setNotifications(prev => {
        if (prev.some(n => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });

      // 2. Tăng badge +1
      setUnreadCount(prev => prev + 1);

      // 3. Báo cho component khác (hiện toast)
      setLatestNotification(notif);

      // 4. Browser notification (nếu đã cấp quyền)
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notif.title, {
            body: notif.content || '',
            icon: '/icons/192.png',
            badge: '/icons/192.png',
            tag: notif.id,
          });
        } catch (err) {
          // Bỏ qua lỗi
        }
      }

      // 5. Rung (mobile)
      if ('vibrate' in navigator) {
        try { navigator.vibrate?.([200, 100, 200]); } catch { }
      }
    },
  });

  // ⭐ markAsRead — DÙNG unreadCount từ BACKEND (chính xác 100%)
  const markAsRead = useCallback(async (id: string) => {
    // Tìm trong state
    const target = notifications.find(n => n.id === id);

    // Nếu đã đọc rồi → không gọi API, không giảm số
    if (target?.isRead) {
      return { success: true };
    }

    try {
      const res = await apiClient.markNotificationRead(id);

      // Update state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );

      // ⭐ Dùng số từ backend — chính xác
      if (res && typeof res.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      } else {
        // Fallback
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      return res;
    } catch (err) {
      console.error('Lỗi mark read:', err);
      return { success: false };
    }
  }, [notifications]);

  // ⭐ markAllAsRead
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.markAllNotificationsRead();

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi mark all read:', err);
    }
  }, []);

  const markAllAsReadOnOpen = useCallback(async () => {
    // Nếu không còn gì chưa đọc → không cần gọi API
    if (unreadCount === 0) return;

    try {
      // 1. Gọi API mark-all-read
      await apiClient.markAllNotificationsRead?.();

      // 2. Ẩn hết thông báo khỏi danh sách hiển thị
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      // 3. Reset badge về 0
      setUnreadCount(0);
    } catch (err) {
      console.error('Lỗi đánh dấu đã đọc:', err);
    }
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    latestNotification,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    reload: loadInitial,
  };


}