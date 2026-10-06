// backend/src/services/users.service.js
import bcrypt from 'bcrypt';
import prisma from '../config/prisma.js';

const DEFAULT_PASSWORD = 'vks@2026';
const ROLES_REQUIRE_DEPARTMENT = ['TRUONG_PHONG'];

export const usersService = {
  // ============================================
  // 1. LẤY DANH SÁCH USERS
  // ============================================
  async getUsers(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const isGuest = !currentUser || !currentUser.id;

    const where = { deletedAt: null };

    if (isGuest) {
      // Khách xem tất cả
    } else {
      const perms = currentUser.permissions || [];

      if (perms.includes('user:view:all')) {
        // All
      } else if (perms.includes('user:view:department')) {
        const managedDepts = await prisma.department.findMany({
          where: { pvtManagerId: currentUser.id },
          select: { id: true },
        });
        const deptIds = managedDepts.map(d => d.id);

        if (deptIds.length > 0) {
          where.OR = [
            { departmentId: { in: deptIds } },
            { id: currentUser.id },
          ];
        } else {
          where.id = currentUser.id;
        }
      } else {
        where.id = currentUser.id;
      }
    }

    if (filters.search) {
      const search = filters.search;
      const searchOR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    if (filters.role) {
      where.userRoles = {
        some: { role: { code: filters.role } },
      };
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.active !== undefined) {
      where.active = filters.active === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          position: true,
          active: true,
          lastLoginAt: true,
          createdAt: true,
          roomCode: true,
          departmentId: true,
          department: {
            select: { id: true, code: true, name: true },
          },
          manager: {
            select: { id: true, username: true, fullName: true },
          },
          userRoles: {
            include: {
              role: {
                select: { id: true, code: true, name: true, level: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map(u => {
      const roles = u.userRoles.map(ur => ur.role);
      const primaryRole = roles[0]?.code || 'TRUONG_PHONG';

      return {
        ...u,
        roles,
        role: primaryRole,
        userRoles: undefined,
        ...(isGuest ? { email: undefined, phone: undefined } : {}),
      };
    });

    return {
      users: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT USER
  // ============================================
  async getUserById(userId, currentUser) {
    const isGuest = !currentUser || !currentUser.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        manager: {
          select: { id: true, username: true, fullName: true },
        },
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
      },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (isGuest) {
      const roles = user.userRoles.map(ur => ur.role.code);
      const { passwordHash, totpSecret, userRoles, ...userSafe } = user;
      return {
        ...userSafe,
        roles,
        permissions: [],
      };
    }

    const perms = currentUser.permissions || [];

    if (!perms.includes('user:view:all')) {
      if (perms.includes('user:view:department')) {
        const managedDepts = await prisma.department.findMany({
          where: { pvtManagerId: currentUser.id },
          select: { id: true },
        });
        const deptIds = managedDepts.map(d => d.id);

        const canView =
          user.id === currentUser.id ||
          deptIds.includes(user.departmentId);

        if (!canView) {
          throw { status: 403, message: 'Không có quyền xem user này' };
        }
      } else {
        if (user.id !== currentUser.id) {
          throw { status: 403, message: 'Không có quyền xem user này' };
        }
      }
    }

    const roles = user.userRoles.map(ur => ur.role.code);
    const permissions = new Set();
    user.userRoles.forEach(ur => {
      ur.role.rolePermissions.forEach(rp => {
        permissions.add(rp.permission.code);
      });
    });

    const { passwordHash, totpSecret, userRoles, ...userSafe } = user;

    return {
      ...userSafe,
      roles,
      permissions: Array.from(permissions),
    };
  },

  // ============================================
  // 3. TẠO USER (⭐ ĐÃ FIX SYNC roomCode)
  // ============================================
  async createUser(data, currentUser) {
    const {
      username, password, fullName, email, phone,
      position, departmentId, managerId, roleIds,
      role: roleCode,
      roomCode,
    } = data;

    // 3.1. Check username trùng
    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existing) {
      throw { status: 400, message: 'Username đã tồn tại' };
    }

    // 3.2. Check email trùng
    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        throw { status: 400, message: 'Email đã tồn tại' };
      }
    }

    // 3.3. Xác định roleIds
    let finalRoleIds = roleIds;

    if ((!finalRoleIds || finalRoleIds.length === 0) && roleCode) {
      const roleObj = await prisma.role.findUnique({
        where: { code: roleCode },
      });
      if (!roleObj) {
        throw { status: 400, message: `Vai trò "${roleCode}" không tồn tại` };
      }
      finalRoleIds = [roleObj.id];
    }

    if (!finalRoleIds || finalRoleIds.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 vai trò' };
    }

    const roles = await prisma.role.findMany({
      where: { id: { in: finalRoleIds }, active: true },
    });

    if (roles.length !== finalRoleIds.length) {
      throw { status: 400, message: 'Một số role không tồn tại' };
    }

    // ⭐ 3.3c. FIX: Sync roomCode ↔ departmentId
    let finalDeptId = departmentId;
    let finalRoomCode = roomCode && roomCode !== 'null' ? roomCode : null;

    // Nếu có departmentId → tự lấy code
    if (finalDeptId && !finalRoomCode) {
      const dept = await prisma.department.findUnique({
        where: { id: finalDeptId },
      });
      if (dept) finalRoomCode = dept.code;
    }

    // Nếu có roomCode → tự lấy id
    if (!finalDeptId && finalRoomCode) {
      const dept = await prisma.department.findUnique({
        where: { code: finalRoomCode },
      });
      if (dept) finalDeptId = dept.id;
    }

    // 3.4. Validate role TRUONG_PHONG cần departmentId
    const hasTpRole = roles.some(r => r.code === 'TRUONG_PHONG');
    if (hasTpRole && !finalDeptId) {
      throw {
        status: 400,
        message: 'User có vai trò Trưởng phòng phải được gán vào phòng',
      };
    }

    // 3.5. Check department tồn tại
    if (finalDeptId) {
      const dept = await prisma.department.findUnique({
        where: { id: finalDeptId },
      });
      if (!dept) {
        throw { status: 400, message: 'Phòng ban không tồn tại' };
      }
    }

    // 3.6. Hash password
    const finalPassword = password || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    // 3.7. Tạo user + gán roles
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: username.trim(),
          passwordHash,
          fullName: fullName.trim(),
          email: email || null,
          phone: phone || null,
          position: position || null,
          departmentId: finalDeptId || null,
          roomCode: finalRoomCode,        // ⭐ FIX: Lưu roomCode sync với department
          managerId: managerId || null,
          active: true,
        },
      });

      await tx.userRole.createMany({
        data: finalRoleIds.map(roleId => ({
          userId: user.id,
          roleId,
          assignedBy: currentUser.id,
        })),
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'CREATE_USER',
          entityType: 'user',
          entityId: user.id,
          newValue: { username, fullName, roleIds: finalRoleIds },
        },
      });

      return user;
    });

    const { passwordHash: _, ...userSafe } = newUser;
    return userSafe;
  },

  // ============================================
  // 4. CẬP NHẬT USER (⭐ ĐÃ FIX SYNC roomCode)
  // ============================================
  async updateUser(userId, data, currentUser) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing || existing.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    const perms = currentUser.permissions || [];

    if (!perms.includes('user:update:all')) {
      if (perms.includes('user:update:own')) {
        if (userId !== currentUser.id) {
          throw { status: 403, message: 'Không có quyền sửa user này' };
        }
      } else {
        throw { status: 403, message: 'Không có quyền sửa user' };
      }
    }

    // 4.3. Build update data
    const updateData = {};
    const allowedFields = [
      'fullName', 'email', 'phone', 'avatarUrl',
      'position', 'departmentId', 'managerId', 'active',
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // ⭐ FIX: Sync roomCode khi đổi departmentId
    if (data.departmentId !== undefined) {
      if (data.departmentId === null) {
        updateData.roomCode = null;
      } else {
        const dept = await prisma.department.findUnique({
          where: { id: data.departmentId },
        });
        if (dept) {
          updateData.roomCode = dept.code;
        }
      }
    } else if (data.roomCode !== undefined) {
      // Cho phép set roomCode trực tiếp (nếu cần)
      updateData.roomCode =
        data.roomCode && data.roomCode !== 'null' ? data.roomCode : null;
    }

    // 4.4. Update
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'UPDATE_USER',
          entityType: 'user',
          entityId: userId,
          oldValue: { fullName: existing.fullName, phone: existing.phone },
          newValue: updateData,
        },
      });

      return user;
    });

    const { passwordHash, totpSecret, ...userSafe } = updated;
    return userSafe;
  },

  // ============================================
  // 5. XÓA USER (SOFT DELETE)
  // ============================================
  async deleteUser(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (userId === currentUser.id) {
      throw { status: 400, message: 'Không thể xóa chính mình' };
    }

    if (user.username === 'admin') {
      throw { status: 400, message: 'Không thể xóa tài khoản Admin' };
    }

    const isTargetAdmin = user.userRoles.some(ur => ur.role.code === 'ADMIN');
    if (isTargetAdmin) {
      const adminCount = await prisma.user.count({
        where: {
          deletedAt: null,
          userRoles: { some: { role: { code: 'ADMIN' } } },
        },
      });
      if (adminCount <= 1) {
        throw {
          status: 400,
          message: 'Không thể xóa quản trị viên cuối cùng của hệ thống',
        };
      }
    }

    const stamp = Date.now();
    const deletedUsername = `${user.username}__deleted_${stamp}`;
    const deletedEmail = user.email
      ? `${user.email}__deleted_${stamp}`
      : null;

    const MAX_USERNAME_LEN = 100;
    const MAX_EMAIL_LEN = 200;
    const finalUsername =
      deletedUsername.length > MAX_USERNAME_LEN
        ? deletedUsername.slice(0, MAX_USERNAME_LEN - 20) + `__d_${stamp}`
        : deletedUsername;
    const finalEmail =
      deletedEmail && deletedEmail.length > MAX_EMAIL_LEN
        ? deletedEmail.slice(0, MAX_EMAIL_LEN - 20) + `__d_${stamp}`
        : deletedEmail;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          active: false,
          deletedAt: new Date(),
          username: finalUsername,
          email: finalEmail,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'DELETE_USER',
          entityType: 'user',
          entityId: userId,
          oldValue: {
            username: user.username,
            email: user.email,
            fullName: user.fullName,
          },
          newValue: {
            username: finalUsername,
            email: finalEmail,
            deletedAt: new Date().toISOString(),
          },
        },
      });
    });

    return {
      success: true,
      message: `Đã xóa tài khoản "${user.fullName}".`,
    };
  },

  // ============================================
  // 6. GÁN ROLES CHO USER
  // ============================================
  async assignRoles(userId, roleIds, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (!roleIds || roleIds.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 role' };
    }

    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw { status: 400, message: 'Một số role không tồn tại' };
    }

    const hasTpRole = roles.some(r => r.code === 'TRUONG_PHONG');
    if (hasTpRole && !user.departmentId) {
      throw {
        status: 400,
        message: 'User có vai trò Trưởng phòng phải được gán vào phòng trước',
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });

      await tx.userRole.createMany({
        data: roleIds.map(roleId => ({
          userId,
          roleId,
          assignedBy: currentUser.id,
        })),
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'ASSIGN_ROLES',
          entityType: 'user',
          entityId: userId,
          newValue: { roleIds },
        },
      });
    });

    return { success: true, message: 'Đã cập nhật vai trò' };
  },

  // ============================================
  // 7. RESET PASSWORD
  // ============================================
  async resetPassword(userId, newPassword, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    const finalPassword = newPassword || DEFAULT_PASSWORD;
    const passwordHash = await bcrypt.hash(finalPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          totpSecret: null,
          totpEnabled: false,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'RESET_PASSWORD',
          entityType: 'user',
          entityId: userId,
        },
      });
    });

    return {
      success: true,
      message: `Đã reset mật khẩu cho "${user.fullName}". Mật khẩu mới: ${finalPassword}`,
      newPassword: finalPassword,
    };
  },

  // ============================================
  // 8. KHÓA / MỞ KHÓA USER
  // ============================================
  async toggleActive(userId, currentUser) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy user' };
    }

    if (userId === currentUser.id) {
      throw { status: 400, message: 'Không thể khóa chính mình' };
    }

    if (user.username === 'admin') {
      throw { status: 400, message: 'Không thể khóa tài khoản Admin' };
    }

    const newActive = !user.active;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { active: newActive },
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: newActive ? 'UNLOCK_USER' : 'LOCK_USER',
          entityType: 'user',
          entityId: userId,
        },
      });
    });

    return {
      success: true,
      message: newActive
        ? `Đã mở khóa tài khoản "${user.fullName}"`
        : `Đã khóa tài khoản "${user.fullName}"`,
      active: newActive,
    };
  },
};