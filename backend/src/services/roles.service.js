// backend/src/services/roles.service.js
import prisma from '../config/prisma.js';

export const rolesService = {
  // ============================================
  // 1. LẤY DANH SÁCH ROLES
  // ============================================
  async getRoles(filters = {}) {
    const where = {};

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.active !== undefined) {
      where.active = filters.active === 'true';
    }

    const roles = await prisma.role.findMany({
      where,
      orderBy: { level: 'asc' },
      include: {
        _count: {
          select: {
            userRoles: true,
            rolePermissions: true,
          },
        },
      },
    });

    return {
      roles: roles.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        level: r.level,
        isSystem: r.isSystem,
        active: r.active,
        userCount: r._count.userRoles,
        permissionCount: r._count.rolePermissions,
      })),
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT ROLE + PERMISSIONS
  // ============================================
  async getRoleById(id) {
    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      level: role.level,
      isSystem: role.isSystem,
      active: role.active,
      permissions: role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        code: rp.permission.code,
        name: rp.permission.name,
        module: rp.permission.module,
        action: rp.permission.action,
        scope: rp.permission.scope,
      })),
      users: role.userRoles.map(ur => ur.user),
    };
  },

  // ============================================
  // 3. TẠO ROLE MỚI
  // ============================================
  async createRole(data, currentUser) {
    const { code, name, description, level, permissionIds } = data;

    if (!code || !name) {
      throw { status: 400, message: 'Thiếu code hoặc name' };
    }

    const existing = await prisma.role.findUnique({
      where: { code },
    });

    if (existing) {
      throw { status: 400, message: `Role "${code}" đã tồn tại` };
    }

    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          code,
          name,
          description: description || null,
          level: level || 99,
          isSystem: false,
        },
      });

      // Gán permissions
      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(pid => ({
            roleId: created.id,
            permissionId: pid,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'CREATE_ROLE',
          entityType: 'role',
          entityId: String(created.id),
          newValue: { code, name },
        },
      });

      return created;
    });

    return role;
  },

  // ============================================
  // 4. CẬP NHẬT ROLE
  // ============================================
  async updateRole(id, data, currentUser) {
    const roleId = parseInt(id);
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    const updateData = {};
    const allowed = ['name', 'description', 'level', 'active'];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const updated = await prisma.role.update({
      where: { id: roleId },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_ROLE',
        entityType: 'role',
        entityId: String(roleId),
        oldValue: { name: role.name },
        newValue: updateData,
      },
    });

    return updated;
  },

  // ============================================
  // 5. GÁN PERMISSIONS CHO ROLE
  // ============================================
  async assignPermissions(id, permissionIds, currentUser) {
    const roleId = parseInt(id);

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    // Check permissions tồn tại
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      throw { status: 400, message: 'Một số permission không tồn tại' };
    }

    await prisma.$transaction(async (tx) => {
      // Xóa cũ
      await tx.rolePermission.deleteMany({ where: { roleId } });

      // Tạo mới
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(pid => ({
            roleId,
            permissionId: pid,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'ASSIGN_PERMISSIONS',
          entityType: 'role',
          entityId: String(roleId),
          newValue: { permissionIds },
        },
      });
    });

    return { success: true, message: 'Đã cập nhật permissions' };
  },

  // ============================================
  // 6. XÓA ROLE
  // ============================================
  async deleteRole(id, currentUser) {
    const roleId = parseInt(id);
    const role = await prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw { status: 404, message: 'Không tìm thấy role' };
    }

    if (role.isSystem) {
      throw { status: 400, message: 'Không thể xóa role hệ thống' };
    }

    // Check có user không
    const userCount = await prisma.userRole.count({
      where: { roleId },
    });

    if (userCount > 0) {
      throw {
        status: 400,
        message: `Không thể xóa: còn ${userCount} user có role này`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.role.delete({ where: { id: roleId } });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'DELETE_ROLE',
          entityType: 'role',
          entityId: String(roleId),
        },
      });
    });

    return { success: true, message: 'Đã xóa role' };
  },
};