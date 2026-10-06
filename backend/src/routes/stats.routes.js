// backend/src/routes/stats.routes.js
import express from 'express';
import { statsController } from '../controllers/stats.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/stats/vt-overview:
 *   get:
 *     tags: [Stats]
 *     summary: Dashboard Viện trưởng — tổng quan
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 summary:
 *                   total: 245
 *                   hoanThanh: 180
 *                   quaHan: 12
 *                   sapDenHan: 25
 *                   chuaToiHan: 208
 *                   tyLeHoanThanh: 73
 *                 pvtStats:
 *                   - id: u_pvt_1
 *                     name: Phó Viện trưởng 1
 *                     total: 30
 *                     completed: 27
 *                     completionRate: 90
 */
router.get(
  '/vt-overview',
  requirePermission('stats:view:all'),
  statsController.getVTOverview
);

/**
 * @swagger
 * /api/stats/chart:
 *   get:
 *     tags: [Stats]
 *     summary: Dữ liệu biểu đồ tròn
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 chartData:
 *                   - name: Quá hạn
 *                     value: 12
 *                     color: '#ef4444'
 *                   - name: Sắp đến hạn
 *                     value: 25
 *                     color: '#f59e0b'
 *                   - name: Chưa tới hạn
 *                     value: 208
 *                     color: '#10b981'
 */
router.get('/chart', statsController.getChartData);

/**
 * @swagger
 * /api/stats/pvt-dashboard:
 *   get:
 *     tags: [Stats]
 *     summary: Dashboard PVT
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/pvt-dashboard',
  requirePermission('stats:view:department'),
  statsController.getPvtDashboard
);

/**
 * @swagger
 * /api/stats/tp-dashboard:
 *   get:
 *     tags: [Stats]
 *     summary: Dashboard TP
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/tp-dashboard',
  requirePermission('stats:view:department'),
  statsController.getTpDashboard
);

export default router;