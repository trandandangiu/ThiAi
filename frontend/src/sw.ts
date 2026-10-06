// frontend/src/sw.ts
/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// ════ 1. PRECACHE ════
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ════ 2. KHÔNG cache API ════
// App chạy LAN nội bộ nên network đủ nhanh.
// Cache API gây bug: upload/xoá file rồi mở lại vẫn thấy dữ liệu cũ.

// ════ 3. PUSH NOTIFICATION ════
self.addEventListener('push', (event: PushEvent) => {
  let data: any = {
    title: 'VKS-QLCV',
    body: 'Bạn có thông báo mới',
    icon: '/icons/192.png',
    badge: '/icons/192.png',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag || 'vks-notification',
    data: data.data,
  } as any;

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ════ 4. NOTIFICATION CLICK ════
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) return (client as WindowClient).navigate(fullUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(fullUrl);
    })
  );
});

// ════ 5. ACTIVATE ════
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

// ════ 6. MESSAGE ════
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

export {};