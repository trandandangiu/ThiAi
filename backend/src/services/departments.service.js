// backend/src/services/departments.service.js
import prisma from '../config/prisma.js';

export const departmentsService = {
  // ============================================
  // 1. LẤY DANH SÁCH
  // ============================================
async getDepartments(filters = {}) {
  // ⭐ Không cần check quyền — khách cũng xem được

  const where = {
    active: filters.active !== undefined ? filters.active === 'true' : true,
  };

  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const departments = await prisma.department.findMany({
    where,
    orderBy: { code: 'asc' },
    include: {
      users: {
        select: {
          id: true,
          username: true,
          fullName: true,
          position: true,
        },
      },
    },
  });

  const enriched = await Promise.all(
    departments.map(async (dept) => {
      let manager = null;
      let pvtManager = null;

      if (dept.managerId) {
        manager = await prisma.user.findUnique({
          where: { id: dept.managerId },
          select: { id: true, username: true, fullName: true },
        });
      }

      if (dept.pvtManagerId) {
        pvtManager = await prisma.user.findUnique({
          where: { id: dept.pvtManagerId },
          select: { id: true, username: true, fullName: true },
        });
      }

      return {
        ...dept,
        manager,
        pvtManager,
      };
    })
  );

  return { departments: enriched };
},

  // ============================================
  // 2. LẤY CHI TIẾT
  // ============================================
  async getDepartmentById(id) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    if (!dept) {
      throw { status: 404, message: 'Không tìm thấy phòng ban' };
    }

    // Lấy manager + pvt manager
    const manager = dept.managerId
      ? await prisma.user.findUnique({
        where: { id: dept.managerId },
        select: { id: true, username: true, fullName: true },
      })
      : null;

    const pvtManager = dept.pvtManagerId
      ? await prisma.user.findUnique({
        where: { id: dept.pvtManagerId },
        select: { id: true, username: true, fullName: true },
      })
      : null;

    return { ...dept, manager, pvtManager };
  },

  // ============================================
  // 3. TẠO PHÒNG BAN
  // ============================================
  async createDepartment(data, currentUser) {
    const { code, name, shortName, managerId, pvtManagerId, description, order } = data;

    if (!code || !name) {
      throw { status: 400, message: 'Thiếu mã hoặc tên phòng ban' };
    }

    // Check trùng code
    const existing = await prisma.department.findUnique({
      where: { code },
    });

    if (existing) {
      throw { status: 400, message: `Mã phòng "${code}" đã tồn tại` };
    }

    const dept = await prisma.department.create({
      data: {
        code,
        name,
        shortName: shortName || code,
        managerId: managerId || null,
        pvtManagerId: pvtManagerId || null,
        description: description || null,
        order: order || 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,    // ← THÊM
        userRole: currentUser.roles?.[0] || 'ADMIN',   // ← THÊM
        action: 'CREATE_DEPARTMENT',
        entityType: 'department',
        entityId: dept.id,
        newValue: { code, name },
      },
    });

    return dept;
  },

  // ============================================
  // 4. CẬP NHẬT
  // ============================================
  async updateDepartment(id, data, currentUser) {
    const dept = await prisma.department.findUnique({ where: { id } });

    if (!dept) {
      throw { status: 404, message: 'Không tìm thấy phòng ban' };
    }

    const updateData = {};
    const allowed = ['name', 'shortName', 'managerId', 'pvtManagerId', 'description', 'order', 'active'];

    allowed.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const updated = await prisma.department.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,    // ← THÊM
        userRole: currentUser.roles?.[0] || 'ADMIN',   // ← THÊM
        action: 'UPDATE_DEPARTMENT',
        entityType: 'department',
        entityId: id,
        oldValue: { name: dept.name },
        newValue: updateData,
      },
    });

    return updated;
  },

  // ============================================
  // 5. XÓA (SOFT DELETE)
  // ============================================
  async deleteDepartment(id, currentUser) {
    const dept = await prisma.department.findUnique({ where: { id } });

    if (!dept) {
      throw { status: 404, message: 'Không tìm thấy phòng ban' };
    }

    // Check có user không
    const userCount = await prisma.user.count({
      where: { departmentId: id, deletedAt: null },
    });

    if (userCount > 0) {
      throw {
        status: 400,
        message: `Không thể xóa: còn ${userCount} user trong phòng`,
      };
    }

    await prisma.department.update({
      where: { id },
      data: { active: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.fullName,    // ← THÊM
        userRole: currentUser.roles?.[0] || 'ADMIN',   // ← THÊM
        action: 'DELETE_DEPARTMENT',
        entityType: 'department',
        entityId: id,
      },
    });

    return { success: true, message: 'Đã xóa phòng ban' };
  },
};