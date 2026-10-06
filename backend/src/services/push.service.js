// backend/src/services/push.service.js
import webpush from 'web-push';
import prisma from '../config/prisma.js';

// ═══ Cấu hình VAPID ═══
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.warn('⚠️  [PUSH] Chưa cấu hình VAPID keys — Web Push sẽ không hoạt động');
} else {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@vks.gov.vn',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('✅ [PUSH] Đã cấu hình VAPID');
}

export const pushService = {
  /**
   * ⭐ Lưu subscription — hỗ trợ cả user login và khách
   */
  async saveSubscription(userId, subscription, userAgent, isGuest = false) {
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw { status: 400, message: 'Subscription không hợp lệ' };
    }

    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: userId || null,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
        deviceType: userAgent?.includes('Mobile') ? 'mobile' : 'desktop',
        isGuest: !userId,
        subscriptionType: 'ALL',
      },
      update: {
        userId: userId || null,
        p256dh: keys.p256dh,
        auth: keys.auth,
        lastUsedAt: new Date(),
        isGuest: !userId,
      },
    });

    console.log(
      `✅ [PUSH] Đã lưu sub cho ${isGuest ? 'KHÁCH' : 'user ' + userId}`
    );
    return saved;
  },

  async removeSubscription(endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  },

  /**
   * Gửi push đến 1 user cụ thể (tất cả thiết bị của user đó)
   */
  async sendToUser(userId, payload) {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
    });
    return this._sendToSubs(subs, payload, `user ${userId}`);
  },

  /**
   * ⭐ Gửi push đến 1 endpoint cụ thể (cho khách test)
   */
  async sendToEndpoint(endpoint, payload) {
    const subs = await prisma.pushSubscription.findMany({
      where: { endpoint },
    });
    return this._sendToSubs(subs, payload, `endpoint ${endpoint.slice(0, 30)}...`);
  },

  /**
   * ⭐ BROADCAST — gửi đến TẤT CẢ (user + khách)
   */
  async broadcast(payload) {
    const subs = await prisma.pushSubscription.findMany({});
    console.log(`📡 [PUSH] Broadcast đến ${subs.length} thiết bị`);
    return this._sendToSubs(subs, payload, 'BROADCAST');
  },

  /**
   * ⭐ Gửi đến nhiều userId cụ thể
   */
  async sendToUsers(userIds, payload) {
    if (!userIds || userIds.length === 0) {
      return { sent: 0, failed: 0 };
    }
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });
    return this._sendToSubs(subs, payload, `${userIds.length} users`);
  },

  /**
   * ⭐ Helper — gửi tới danh sách subscriptions
   */
  async _sendToSubs(subs, payload, label = '') {
    if (subs.length === 0) {
      console.log(`📭 [PUSH] Không có sub nào cho ${label}`);
      return { sent: 0, failed: 0 };
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.content || payload.body || '',
      icon: '/icons/192.png',
      badge: '/icons/192.png',
      data: {
        dispatchId: payload.dispatchId,
        url: payload.url || '/',
        notificationId: payload.notificationId,
      },
      tag: payload.tag || payload.notificationId || `notif-${Date.now()}`,
    });

    let sent = 0;
    let failed = 0;
    const toDelete = [];

    await Promise.all(
      subs.map(async sub => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushPayload
          );
          sent++;
          await prisma.pushSubscription
            .update({
              where: { id: sub.id },
              data: { lastUsedAt: new Date() },
            })
            .catch(() => {});
        } catch (err) {
          failed++;
          console.error(
            `❌ [PUSH] Lỗi sub ${sub.id} (${sub.isGuest ? 'khách' : 'user ' + sub.userId}):`,
            err.statusCode,
            err.body
          );

          // 410 Gone / 404 Not Found → subscription hết hạn → xóa
          if (err.statusCode === 410 || err.statusCode === 404) {
            toDelete.push(sub.id);
          }
        }
      })
    );

    if (toDelete.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: toDelete } },
      });
      console.log(`🧹 [PUSH] Đã xóa ${toDelete.length} sub chết`);
    }

    console.log(`📤 [PUSH] ${label}: sent=${sent}, failed=${failed}`);
    return { sent, failed };
  },
};