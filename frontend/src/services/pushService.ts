// frontend/src/services/pushService.ts

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushService = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermission(): NotificationPermission | null {
    if (typeof window === 'undefined' || !('Notification' in window)) return null;
    return Notification.permission;
  },

  async getVapidPublicKey(): Promise<string | null> {
    try {
      // ⭐ KHÔNG gửi token — route này public
      const res = await fetch('/api/push/vapid-public-key');
      const data = await res.json();
      return data.success ? data.publicKey : null;
    } catch {
      return null;
    }
  },

  async askPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return !!sub;
    } catch {
      return false;
    }
  },

  /**
   * ⭐ Subscribe — CHO PHÉP KHÁCH (không cần login)
   */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('⚠️  Push không được hỗ trợ');
      return false;
    }

    try {
      // 1. Xin quyền
      const perm = await this.askPermission();
      if (perm !== 'granted') {
        console.warn('⚠️  Người dùng từ chối quyền thông báo');
        return false;
      }

      // 2. Lấy Service Worker registration
      const registration = await navigator.serviceWorker.ready;

      // 3. Kiểm tra subscription cũ
      let subscription = await registration.pushManager.getSubscription();

      // 4. Nếu chưa có → tạo mới
      if (!subscription) {
        const vapidPublicKey = await this.getVapidPublicKey();
        if (!vapidPublicKey) {
          console.error('❌ Không lấy được VAPID public key');
          return false;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // ⭐ 5. Gửi subscription — token optional (khách OK)
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      const data = await res.json();
      if (data.success) {
        console.log(
          '✅ [PUSH] Đã đăng ký nhận thông báo',
          data.isGuest ? '(khách)' : ''
        );
        return true;
      }
      console.error('❌ Backend từ chối subscription:', data);
      return false;
    } catch (err) {
      console.error('❌ Lỗi đăng ký push:', err);
      return false;
    }
  },

  async unsubscribe(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return true;

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const token = localStorage.getItem('access_token');
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint }),
      });

      return true;
    } catch (err) {
      console.error('❌ Lỗi hủy push:', err);
      return false;
    }
  },

  /**
   * ⭐ Test push
   * Nếu truyền endpoint → test 1 sub cụ thể (dùng cho khách)
   * Nếu không → test sub của user hiện tại
   */
  async testPush(endpoint?: string): Promise<{ success: boolean; sent?: number; message?: string }> {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};