// backend/src/routes/departments.routes.js
import express from 'express';
import { departmentsController } from '../controllers/departments.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';

const router = express.Router();

// ⚠️ KHÔNG dùng router.use(authenticate) — vì GET cần public

// ============================================
// GET /api/departments — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/',
  optionalAuth,
  departmentsController.getDepartments
);

// ============================================
// GET /api/departments/:id — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/:id',
  optionalAuth,
  departmentsController.getDepartmentById
);

// ============================================
// POST — CẦN LOGIN
// ============================================
router.post(
  '/',
  authenticate,
  requirePermission('user:create'),
  departmentsController.createDepartment
);

// ============================================
// PUT — CẦN LOGIN
// ============================================
router.put(
  '/:id',
  authenticate,
  requirePermission('user:update:all'),
  departmentsController.updateDepartment
);

// ============================================
// DELETE — CẦN LOGIN
// ============================================
router.delete(
  '/:id',
  authenticate,
  requirePermission('user:delete'),
  departmentsController.deleteDepartment
);

export default router;