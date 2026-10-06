// backend/src/routes/admin.routes.js
import express from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/admin/database/tables:
 *   get:
 *     tags: [Admin]
 *     summary: Danh sách bảng + số records
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 tables:
 *                   - name: users
 *                     count: 27
 *                   - name: dispatches
 *                     count: 9
 */
router.get(
  '/database/tables',
  requirePermission('admin:database:view'),
  adminController.getTables
);

/**
 * @swagger
 * /api/admin/database/table/{table}:
 *   get:
 *     tags: [Admin]
 *     summary: Xem data của 1 bảng
 *     parameters:
 *       - in: path
 *         name: table
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/database/table/:table',
  requirePermission('admin:database:view'),
  adminController.getTableData
);

/**
 * @swagger
 * /api/admin/database/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Thống kê tổng quan database
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/database/stats',
  requirePermission('admin:database:view'),
  adminController.getStats
);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Nhật ký hệ thống
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/audit-logs',
  requirePermission('admin:audit-logs:view'),
  adminController.getAuditLogs
);

/**
 * @swagger
 * /api/admin/sessions:
 *   get:
 *     tags: [Admin]
 *     summary: Phiên đăng nhập
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/sessions',
  requirePermission('admin:database:view'),
  adminController.getSessions
);

export default router;