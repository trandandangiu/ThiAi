// backend/src/routes/dispatches.routes.js
import express from 'express';
import { dispatchesController } from '../controllers/dispatches.controller.js';
import { attachmentsController } from '../controllers/attachments.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// router.use(authenticate);

// ============================================
// 1. GET /api/dispatches
// ============================================
/**
 * @swagger
 * /api/dispatches:
 * tags: [Dispatches]
 *   get:
 *     summary: Danh sách công văn (filter theo role)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: trangThai
 *         schema:
 *           type: string
 *       - in: query
 *         name: mucDoKhan
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 dispatches:
 *                   - id: cv-001
 *                     soCongVan: 142/BC-UBND
 *                     tenCongVan: Báo cáo Q3
 *                     trangThai: DANG_XU_LY
 *                 pagination:
 *                   page: 1
 *                   limit: 20
 *                   total: 9
 *                   totalPages: 1
 */
router.get(
  '/',
  optionalAuth,
  dispatchesController.getDispatches
);

// ============================================
// 2. GET /api/dispatches/stats — PHẢI ĐẶT TRƯỚC /:id
// ============================================
/**
 * @swagger
 * /api/dispatches/stats:
 * tags: [Dispatches]
 *   get:
 *     summary: Thống kê công văn
 *     responses:
 *       200:
 *         description: OK
 */
router.get(
  '/stats',
  optionalAuth,
  dispatchesController.getStats
);

// ============================================
// 3. GET /api/dispatches/:id
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}:
 * tags: [Dispatches]
 *   get:
 *     summary: Chi tiết công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Không tìm thấy
 */
router.get(
  '/:id',
  optionalAuth,
  dispatchesController.getDispatchById
);
// ============================================
// 4. POST /api/dispatches
// ============================================
/**
 * @swagger
 * /api/dispatches:
 * tags: [Dispatches]
 *   post:
 *     summary: mới
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               soCongVan:
 *                 type: string
 *                 example: 142/BC-UBND
 *               tenCongVan:
 *                 type: string
 *                 example: Báo cáo rà soát Q3
 *               ngayGui:
 *                 type: string
 *                 example: '2026-09-19'
 *               ngayPhatHanh:
 *                 type: string
 *                 example: '2026-09-18'
 *               hanBaoCaoXuLy:
 *                 type: string
 *                 example: '2026-09-30'
 *               donViBanHanh:
 *                 type: string
 *                 example: UBND Tỉnh
 *               mucDoKhan:
 *                 type: string
 *                 example: KHAN
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post(
  '/',
  authenticate,                          // ⭐ THÊM — chạy trước
  requirePermission('dispatch:create'),
  dispatchesController.createDispatch
);

// ============================================
// 5. PUT /api/dispatches/:id
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}:
 * tags: [Dispatches]
 *   put:
 *     summary: Cập nhật công văn
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
 *               tenCongVan:
 *                 type: string
 *               nguoiThucHien:
 *                 type: string
 *               ghiChu:
 *                 type: string
 *               mucDoKhan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  '/:id',
  authenticate,                                                          // ⭐ THÊM DÒNG NÀY
  requirePermission('dispatch:update:all', 'dispatch:update:assigned'),
  dispatchesController.updateDispatch
);

// ============================================
// 6. DELETE /api/dispatches/:id
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}:
 *   tags: [Dispatches]
 *   delete:
 *     summary: Xóa mềm công văn
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/:id',
  authenticate,                          // ⭐ THÊM
  requirePermission('dispatch:delete'),
  dispatchesController.deleteDispatch
);

// ============================================
// 7. PATCH /api/dispatches/:id/complete
// PVT/TP/VT tự đánh dấu hoàn thành — CẦN LOGIN
// ============================================
router.patch(
  '/:id/complete',
  authenticate,                       // ⭐ THÊM DÒNG NÀY
  dispatchesController.markComplete
);

// ============================================
// 8. PATCH /api/dispatches/:id/reopen
// Mở lại công văn đã hoàn thành (undo)
// ============================================
router.patch(
  '/:id/reopen',
  authenticate,
  dispatchesController.reopenDispatch
);
export default router;