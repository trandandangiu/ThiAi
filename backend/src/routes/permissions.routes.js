// backend/src/routes/permissions.routes.js
import express from 'express';
import { permissionsController } from '../controllers/permissions.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     tags: [Permissions]
 *     summary: Danh sách permissions (grouped by module)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 total: 40
 *                 grouped:
 *                   user:
 *                     - id: 1
 *                       code: user:view:all
 *                       name: Xem tất cả user
 *                   dispatch:
 *                     - id: 11
 *                       code: dispatch:view:all
 */
router.get('/', permissionsController.getPermissions);

/**
 * @swagger
 * /api/permissions/modules:
 *   get:
 *     tags: [Permissions]
 *     summary: Danh sách modules
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/modules', permissionsController.getModules);

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: Chi tiết permission
 */
router.get('/:id', permissionsController.getPermissionById);

export default router;