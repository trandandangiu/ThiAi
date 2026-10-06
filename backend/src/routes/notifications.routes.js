// backend/src/routes/notifications.routes.js
import express from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Danh sách thông báo của user
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 unreadCount: 5
 *                 notifications:
 *                   - id: uuid
 *                     type: TASK_ASSIGNED
 *                     title: Công văn mới được giao
 *                     isRead: false
 */
router.get('/', notificationsController.getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Số thông báo chưa đọc
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 unreadCount: 5
 */
router.get('/unread-count', notificationsController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu tất cả đã đọc
 *     responses:
 *       200:
 *         description: OK
 */
router.patch('/read-all', notificationsController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Đánh dấu 1 thông báo đã đọc
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.patch('/:id/read', notificationsController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Xóa thông báo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:id', notificationsController.deleteNotification);

/**
 * @swagger
 * /api/notifications/unread:
 *   get:
 *     tags: [Notifications]
 *     summary: Danh sách thông báo CHƯA ĐỌC (dùng cho dropdown chuông)
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/unread', notificationsController.getUnreadNotifications);

export default router;