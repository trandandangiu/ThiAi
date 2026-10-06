// backend/src/routes/assignments.routes.js
import express from 'express';
import { assignmentsController } from '../controllers/assignments.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

// Tất cả route cần đăng nhập
router.use(authenticate);

// ============================================
// 1. VT GIAO CHO 1-N PVT
// POST /api/dispatches/:id/assign-pvts
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/assign-pvts:
 *   post:
 *     summary: Viện trưởng giao công văn cho 1-N Phó Viện trưởng
 *     tags: [Assignments]
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
 *               pvts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     pvtId:
 *                       type: string
 *                     pvtName:
 *                       type: string
 *                     roomCode:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *                     example:
 *                       - pvtId: u_pvt_1
 *                         pvtName: Đ/c Phó Viện Trưởng 1
 *                         roomCode: PVT1
 *                         isPrimary: true
 *               vtChiDao:
 *                 type: string
 *                 example: Giao PVT1 chủ trì
 *               hanBaoCaoXuLy:
 *                 type: string
 *                 example: '2026-09-30'
 *               mucDoKhan:
 *                 type: string
 *                 example: KHAN
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: Đã giao công văn cho PVT
 */
router.post(
  '/dispatches/:id/assign-pvts',
  requirePermission('assignment:assign:pvt'),
  assignmentsController.assignPvts
);

// ============================================
// 2. PVT GIAO CHO 1-N TP
// POST /api/dispatches/:id/assign-tps
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/assign-tps:
 *   post:
 *     summary: PVT giao công văn cho 1-N Trưởng phòng
 *     tags: [Assignments]
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
 *               tps:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     tpId:
 *                       type: string
 *                     tpName:
 *                       type: string
 *                     roomCode:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *               pvtChiDao:
 *                 type: string
 *               hanBaoCaoXuLy:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/assign-tps',
  requirePermission('assignment:assign:tp'),
  assignmentsController.assignTps
);

// ============================================
// 3. TP ĐÁNH SỐ CÔNG VĂN
// POST /api/dispatches/:id/tp-number
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/tp-number:
 *   post:
 *     summary: Trưởng phòng đánh số công văn
 *     tags: [Assignments]
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
 *               soCongVanTP:
 *                 type: string
 *                 example: 142/BC-VKS
 *               ngayDanhSo:
 *                 type: string
 *                 example: '2026-09-19'
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/tp-number',
  requirePermission('assignment:number'),
  assignmentsController.tpNumber
);

// ============================================
// 4. TP GỬI LÊN PVT
// POST /api/dispatches/:id/tp-submit
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/tp-submit:
 *   post:
 *     summary: Trưởng phòng gửi báo cáo lên PVT
 *     tags: [Assignments]
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
 *               baoCaoTienDo:
 *                 type: string
 *               tienDo:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/tp-submit',
  requirePermission('assignment:submit:pvt'),
  assignmentsController.tpSubmit
);

// ============================================
// 5. PVT TRÌNH LÊN VT
// POST /api/dispatches/:id/pvt-submit
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/pvt-submit:
 *   post:
 *     summary: PVT trình công văn lên Viện trưởng
 *     tags: [Assignments]
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
 *               pvtChiDao:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/pvt-submit',
  requirePermission('assignment:submit:vt'),
  assignmentsController.pvtSubmit
);

// ============================================
// 6. VT ĐỒNG Ý
// POST /api/dispatches/:id/vt-agree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/vt-agree:
 *   post:
 *     summary: Viện trưởng đồng ý công văn
 *     tags: [Assignments]
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
router.post(
  '/dispatches/:id/vt-agree',
  requirePermission('assignment:agree'),
  assignmentsController.vtAgree
);

// ============================================
// 7. VT KHÔNG ĐỒNG Ý
// POST /api/dispatches/:id/vt-disagree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/vt-disagree:
 *   post:
 *     summary: Viện trưởng không đồng ý (trả lại PVT)
 *     tags: [Assignments]
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
 *               reason:
 *                 type: string
 *                 example: Cần bổ sung số liệu
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/vt-disagree',
  requirePermission('assignment:disagree'),
  assignmentsController.vtDisagree
);

// ============================================
// 8. PVT ĐỒNG Ý
// POST /api/dispatches/:id/pvt-agree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/pvt-agree:
 *   post:
 *     summary: PVT đồng ý báo cáo của TP
 *     tags: [Assignments]
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
 *               tpId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/pvt-agree',
  requirePermission('assignment:agree'),
  assignmentsController.pvtAgree
);

// ============================================
// 9. PVT KHÔNG ĐỒNG Ý
// POST /api/dispatches/:id/pvt-disagree
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/pvt-disagree:
 *   post:
 *     summary: PVT không đồng ý (trả lại TP)
 *     tags: [Assignments]
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
 *               reason:
 *                 type: string
 *               tpId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  '/dispatches/:id/pvt-disagree',
  requirePermission('assignment:disagree'),
  assignmentsController.pvtDisagree
);

// ============================================
// 10. LỊCH SỬ LUÂN CHUYỂN
// GET /api/dispatches/:id/history
// ============================================
/**
 * @swagger
 * /api/dispatches/{id}/history:
 *   get:
 *     summary: Lịch sử luân chuyển công văn
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *                 history:
 *                   - type: ASSIGNMENT
 *                     action: VT_TO_PVT
 *                     from: Viện trưởng
 *                     to: PVT1
 *                     at: '2026-09-19T10:00:00Z'
 */
router.get(
  '/dispatches/:id/history',
  assignmentsController.getHistory
);

export default router;