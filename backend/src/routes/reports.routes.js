// backend/src/routes/reports.routes.js
import express from 'express';
import { reportsController } from '../controllers/reports.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// ============================================
// TẠO BÁO CÁO — POST /api/dispatches/:id/reports
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/reports:
 *   post:
 *     tags: [Reports]
 *     summary: Tạo báo cáo tiến độ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: Đã hoàn thành 75% khối lượng
 *               progressPct:
 *                 type: integer
 *                 example: 75
 *               reportType:
 *                 type: string
 *                 enum: [PROGRESS, ISSUE, COMPLETION]
 *               attachmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: Tạo báo cáo thành công
 *                 report:
 *                   id: uuid
 *                   content: Đã hoàn thành 75%
 *                   progressPct: 75
 */
router.post(
  '/dispatches/:id/reports',
  reportsController.createReport
);

// ============================================
// DS BÁO CÁO CỦA CÔNG VĂN — GET /api/dispatches/:id/reports
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Danh sách báo cáo của công văn
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
router.get(
  '/dispatches/:id/reports',
  reportsController.getReportsByDispatch
);

// ============================================
// DS TẤT CẢ BÁO CÁO — GET /api/reports
// ============================================
/**
 * @swagger
 * /api/reports:
 *   get:
 *     tags: [Reports]
 *     summary: Tất cả báo cáo (theo role)
 *     parameters:
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
router.get('/reports', reportsController.getAllReports);

// ============================================
// XÓA BÁO CÁO — DELETE /api/reports/:id
// ============================================
/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     tags: [Reports]
 *     summary: Xóa báo cáo
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
router.delete('/reports/:id', reportsController.deleteReport);

export default router;