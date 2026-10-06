import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authService = {
  // ============================================
  // LOGIN
  // ============================================
  async login({ username, password }) {
    // 1. Tìm user + roles + permissions
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        department: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!user) {
      throw { status: 401, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }

    if (!user.active || user.deletedAt) {
      throw { status: 403, message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa' };
    }

    // 2. Verify password
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw { status: 401, message: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
    }

    // 3. Lấy roles + permissions
    const roles = user.userRoles.map(ur => ur.role.code);
    const permissions = new Set();
    
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    // 4. Tạo JWT (KHÔNG chứa permissions để gọn)
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        roles,
        departmentId: user.departmentId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 5. Cập nhật lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 6. Ẩn sensitive fields
    const { passwordHash, totpSecret, userRoles, ...userSafe } = user;

    return {
      success: true,
      user: userSafe,
      roles,
      permissions: Array.from(permissions),
      token,
    };
  },

  // ============================================
  // GET CURRENT USER — /api/auth/me
  // ============================================
  async getCurrentUser(userId) {
    // 1. Tìm user + roles + permissions
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        department: {
          select: { id: true, code: true, name: true },
        },
        manager: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (!user.active || user.deletedAt) {
      throw { status: 403, message: 'Tài khoản đã bị khóa' };
    }

    // 2. Lấy roles + permissions
    const roles = user.userRoles.map(ur => ({
      id: ur.role.id,
      code: ur.role.code,
      name: ur.role.name,
      level: ur.role.level,
    }));

    const permissions = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    // 3. Ẩn sensitive
    const { passwordHash, totpSecret, userRoles, ...userSafe } = user;

    return {
      ...userSafe,
      roles,
      permissions: Array.from(permissions),
    };
  },
    // ============================================
  // CHANGE PASSWORD — User tự đổi
  // ============================================
  async changePassword(userId, oldPassword, newPassword) {
    // 1. Validate input
    if (!oldPassword || !newPassword) {
      throw { status: 400, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới' };
    }

    if (newPassword.length < 6) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }

    if (!/[A-Z]/.test(newPassword)) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 1 chữ in hoa' };
    }

    if (!/[a-z]/.test(newPassword)) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 1 chữ thường' };
    }

    if (!/[0-9]/.test(newPassword)) {
      throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 1 chữ số' };
    }

    if (oldPassword === newPassword) {
      throw { status: 400, message: 'Mật khẩu mới phải khác mật khẩu cũ' };
    }

    // 2. Tìm user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    // 3. Verify mật khẩu cũ
    const match = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!match) {
      throw { status: 401, message: 'Mật khẩu hiện tại không chính xác' };
    }

    // 4. Hash mật khẩu mới
    const newHash = await bcrypt.hash(newPassword, 10);

    // 5. Update
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          // Reset TOTP khi đổi password (bảo mật)
          totpSecret: null,
          totpEnabled: false,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: userId,
          userName: user.fullName,
          action: 'CHANGE_PASSWORD',
          entityType: 'user',
          entityId: userId,
        },
      });

      // Thu hồi tất cả sessions cũ (bảo mật)
      await tx.session.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });
    });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  },
};
