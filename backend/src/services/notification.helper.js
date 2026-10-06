// backend/src/services/notification.helper.js
import prisma from '../config/prisma.js';
import { sseService } from './sse.service.js';
import { pushService } from './push.service.js';

/**
 * Tạo notification + push realtime (SSE + Web Push)
 *
 * @param tx - Prisma transaction (nullable)
 * @param params:
 *   - userId?: string        → gửi cho 1 user (optional)
 *   - broadcast?: boolean    → gửi cho TẤT CẢ (user + khách)
 *   - dispatchId?: string
 *   - type: string
 *   - title: string
 *   - content?: string
 *   - url?: string           → deep link khi click notification
 */
// backend/src/services/notification.helper.js

export async function createAndPushNotification(tx, params) {
  const client = tx || prisma;

  let notif = null;
  if (params.userId) {
    notif = await client.notification.create({
      data: {
        userId: params.userId,
        dispatchId: params.dispatchId || null,   // ⭐ PHẢI CÓ
        type: params.type,
        title: params.title,
        content: params.content || null,
        referenceType: params.referenceType || null,
        referenceId: params.referenceId || null,
      },
    });
  }

  setImmediate(async () => {
    if (params.userId && notif) {
      try {
        sseService.sendToUser(params.userId, 'notification', {
          id: notif.id,
          type: notif.type,
          title: notif.title,
          content: notif.content,
          dispatchId: notif.dispatchId,     // ⭐ PHẢI CÓ
          isRead: false,
          createdAt: notif.createdAt,
        });
      } catch (err) {
        console.error('❌ SSE push lỗi:', err.message);
      }
    }

    try {
      if (params.broadcast) {
        await pushService.broadcast({
          title: notif?.title || params.title,
          content: notif?.content || params.content,
          dispatchId: params.dispatchId,     // ⭐ PHẢI CÓ
          notificationId: notif?.id,
          url: params.dispatchId ? `/dispatches/${params.dispatchId}` : '/',
        });
      } else if (params.userId) {
        await pushService.sendToUser(params.userId, {
          title: notif?.title || params.title,
          content: notif?.content || params.content,
          dispatchId: params.dispatchId,     // ⭐ PHẢI CÓ
          notificationId: notif?.id,
          url: params.dispatchId ? `/dispatches/${params.dispatchId}` : '/',
        });
      }
    } catch (err) {
      console.error('❌ Web Push lỗi:', err.message);
    }
  });

  return notif;
}