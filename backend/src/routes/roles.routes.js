// backend/src/routes/roles.routes.js
import express from 'express';
import { rolesController } from '../controllers/roles.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Danh sách roles
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 roles:
 *                   - id: 1
 *                     code: ADMIN
 *                     name: Quản trị viên
 *                     userCount: 1
 *                     permissionCount: 40
 */
router.get('/', rolesController.getRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Chi tiết role + permissions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:id', rolesController.getRoleById);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Tạo role mới
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               level:
 *                 type: integer
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: OK
 */
router.post(
  '/',
  requirePermission('user:assign-role'),
  rolesController.createRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Cập nhật role
 */
router.put(
  '/:id',
  requirePermission('user:assign-role'),
  rolesController.updateRole
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     tags: [Roles]
 *     summary: Gán permissions cho role
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.put(
  '/:id/permissions',
  requirePermission('user:assign-permission'),
  rolesController.assignPermissions
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Xóa role
 */
router.delete(
  '/:id',
  requirePermission('user:assign-role'),
  rolesController.deleteRole
);

export default router;