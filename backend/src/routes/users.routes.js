// backend/src/routes/users.routes.js
import express from 'express';
import { usersController } from '../controllers/users.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/permission.js';
import prisma from '../config/prisma.js';
import {
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
} from '../middlewares/validate.js';

const router = express.Router();

// ⚠️ KHÔNG dùng router.use(authenticate) — vì GET cần public

// ============================================
// GET /api/users — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/',
  optionalAuth,
  usersController.getUsers
);

// ============================================
// GET /api/users/:id — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/:id',
  optionalAuth,
  usersController.getUserById
);

// ============================================
// ⭐ POST /api/users — CẦN LOGIN + QUYỀN user:create
// (ĐÃ THÊM LẠI — TRƯỚC ĐÓ BỊ THIẾU)
// ============================================
router.post(
  '/',
  authenticate,
  requirePermission('user:create'),
  validateCreateUser,
  usersController.createUser
);

// ============================================
// POST /api/users/verify-pvt-username — Public
// ============================================
router.post(
  '/verify-pvt-username',
  async (req, res) => {
    try {
      const { username, pvtId } = req.body || {};

      if (!username || !pvtId) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin xác thực',
        });
      }

      const user = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
        include: {
          userRoles: { include: { role: true } },
        },
      });

      if (!user || user.deletedAt || !user.active) {
        return res.json({ success: false, message: 'Tên đăng nhập không tồn tại' });
      }

      // Check đúng PVT này
      if (user.id !== pvtId) {
        return res.json({
          success: false,
          message: 'Tên đăng nhập không khớp với lãnh đạo đã chọn',
        });
      }

      // Check có role PHO_VIEN_TRUONG
      const isPvt = user.userRoles.some(ur => ur.role.code === 'PHO_VIEN_TRUONG');
      if (!isPvt) {
        return res.json({ success: false, message: 'Tài khoản không phải Phó Viện trưởng' });
      }

      return res.json({
        success: true,
        message: 'Xác thực thành công',
        pvt: {
          id: user.id,
          fullName: user.fullName,
          roomCode: user.roomCode,
        },
      });
    } catch (err) {
      console.error('[VERIFY_PVT]', err);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
  }
);

// ============================================
// PUT /api/users/:id — CẦN LOGIN
// ============================================
router.put(
  '/:id',
  authenticate,
  requirePermission('user:update:all', 'user:update:own'),
  validateUpdateUser,
  usersController.updateUser
);

// ============================================
// DELETE /api/users/:id — CẦN LOGIN
// ============================================
router.delete(
  '/:id',
  authenticate,
  requirePermission('user:delete'),
  usersController.deleteUser
);

// ============================================
// PUT /api/users/:id/roles — CẦN LOGIN
// ============================================
router.put(
  '/:id/roles',
  authenticate,
  requirePermission('user:assign-role'),
  usersController.assignRoles
);

// ============================================
// POST /api/users/:id/reset-password — CẦN LOGIN
// ============================================
router.post(
  '/:id/reset-password',
  authenticate,
  requirePermission('user:reset-password'),
  validateResetPassword,
  usersController.resetPassword
);

// ============================================
// PATCH /api/users/:id/toggle-active — CẦN LOGIN
// ============================================
router.patch(
  '/:id/toggle-active',
  authenticate,
  requirePermission('user:update:all'),
  usersController.toggleActive
);

export default router;