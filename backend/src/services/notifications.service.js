// backend/src/services/notifications.service.js
import prisma from '../config/prisma.js';

export const notificationsService = {
  // ============================================
  // 1. LẤY THÔNG BÁO CỦA USER
  // ============================================
  async getNotifications(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { userId: currentUser.id };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: currentUser.id, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 2. ĐÁNH DẤU ĐÃ ĐỌC — TRẢ VỀ unreadCount MỚI
  // ============================================
  async markAsRead(notificationId, currentUser) {
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif) {
      throw { status: 404, message: 'Không tìm thấy thông báo' };
    }

    if (notif.userId !== currentUser.id) {
      throw { status: 403, message: 'Không có quyền' };
    }

    if (!notif.isRead) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: currentUser.id, isRead: false },
    });

    return {
      success: true,
      message: 'Đã đánh dấu đã đọc',
      unreadCount,
    };
  },

  // ============================================
  // 3. ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
  // ============================================
  async markAllAsRead(currentUser) {
    const result = await prisma.notification.updateMany({
      where: { userId: currentUser.id, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      success: true,
      message: `Đã đánh dấu ${result.count} thông báo`,
      count: result.count,
      unreadCount: 0,
    };
  },

  // ============================================
  // 4. XÓA THÔNG BÁO
  // ============================================
  async deleteNotification(notificationId, currentUser) {
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif) {
      throw { status: 404, message: 'Không tìm thấy thông báo' };
    }

    if (notif.userId !== currentUser.id) {
      throw { status: 403, message: 'Không có quyền' };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: currentUser.id, isRead: false },
    });

    return {
      success: true,
      message: 'Đã xóa thông báo',
      unreadCount,
    };
  },

  // ============================================
  // 5. ĐẾM SỐ CHƯA ĐỌC
  // ============================================
  async getUnreadCount(currentUser) {
    const count = await prisma.notification.count({
      where: { userId: currentUser.id, isRead: false },
    });

    return { unreadCount: count };
  },

  // ============================================
  // 6. LẤY THÔNG BÁO CHƯA ĐỌC (CHO DROPDOWN CHUÔNG)
  // ============================================
  async getUnreadNotifications(currentUser, limit = 20) {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: currentUser.id,
        isRead: false,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.length;

    return {
      notifications,
      unreadCount,
    };
  },
};