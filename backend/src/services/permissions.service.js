// backend/src/services/permissions.service.js
import prisma from '../config/prisma.js';

export const permissionsService = {
  // ============================================
  // 1. LẤY TẤT CẢ PERMISSIONS (GROUPED BY MODULE)
  // ============================================
  async getPermissions(filters = {}) {
    const where = {};

    if (filters.module) {
      where.module = filters.module;
    }

    if (filters.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [
        { module: 'asc' },
        { id: 'asc' },
      ],
    });

    // Group by module
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push({
        id: p.id,
        code: p.code,
        name: p.name,
        action: p.action,
        scope: p.scope,
        description: p.description,
      });
    });

    return {
      permissions,
      grouped,
      total: permissions.length,
    };
  },

  // ============================================
  // 2. LẤY CHI TIẾT
  // ============================================
  async getPermissionById(id) {
    const perm = await prisma.permission.findUnique({
      where: { id: parseInt(id) },
    });

    if (!perm) {
      throw { status: 404, message: 'Không tìm thấy permission' };
    }

    return perm;
  },

  // ============================================
  // 3. LẤY DANH SÁCH MODULES
  // ============================================
  async getModules() {
    const modules = await prisma.permission.groupBy({
      by: ['module'],
      _count: { id: true },
    });

    return {
      modules: modules.map(m => ({
        name: m.module,
        count: m._count.id,
      })),
    };
  },
};