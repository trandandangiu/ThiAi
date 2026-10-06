// backend/src/middlewares/validate.js
import prisma from '../config/prisma.js';

// ============================================
// VALIDATE TẠO USER
// ============================================
export function validateCreateUser(req, res, next) {
  const { username, fullName, roleIds, role, departmentId, roomCode } = req.body;
  const errors = [];

  // 1. Username
  if (!username || username.trim().length < 3) {
    errors.push('Username phải có ít nhất 3 ký tự');
  }

  // 2. Full name
  if (!fullName || fullName.trim().length < 2) {
    errors.push('Họ tên phải có ít nhất 2 ký tự');
  }

  // 3. Role — chấp nhận roleIds (array) HOẶC role (string)
  const hasRoleIds = roleIds && Array.isArray(roleIds) && roleIds.length > 0;
  const hasRoleCode = role && typeof role === 'string' && role.trim().length > 0;

  if (!hasRoleIds && !hasRoleCode) {
    errors.push('Phải chọn ít nhất 1 vai trò');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors,
    });
  }

  next();
}
// ============================================
// VALIDATE UPDATE USER
// ============================================
export function validateUpdateUser(req, res, next) {
  const { fullName, email, phone } = req.body;

  if (fullName !== undefined && fullName.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Họ tên phải có ít nhất 2 ký tự',
    });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email không hợp lệ',
    });
  }

  if (phone && !/^[0-9]{10,11}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Số điện thoại không hợp lệ',
    });
  }

  next();
}

// ============================================
// VALIDATE RESET PASSWORD
// ============================================
export function validateResetPassword(req, res, next) {
  const { newPassword } = req.body;

  if (newPassword !== undefined && newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải có ít nhất 6 ký tự',
    });
  }

  next();
}