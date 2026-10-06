// backend/src/services/admin.service.js
import prisma from '../config/prisma.js';

export const adminService = {
  // ============================================
  // 1. DANH SÁCH BẢNG + SỐ RECORDS
  // ============================================
  async getTables() {
    const [
      users,
      dispatches,
      departments,
      roles,
      permissions,
      userRoles,
      rolePermissions,
      assignments,
      attachments,
      reports,
      rejections,
      notifications,
      auditLogs,
      sessions,
      exports,
      columns,
      systemSettings,
      dispatchPvts,      // ← THÊM
      dispatchTps,       // ← THÊM
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.dispatch.count({ where: { deletedAt: null } }),
      prisma.department.count({ where: { active: true } }),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.userRole.count(),
      prisma.rolePermission.count(),
      prisma.assignment.count(),
      prisma.attachment.count(),
      prisma.report.count(),
      prisma.rejection.count(),
      prisma.notification.count(),
      prisma.auditLog.count(),
      prisma.session.count(),
      prisma.export.count(),
      prisma.column.count(),
      prisma.systemSetting.count(),
      prisma.dispatchPvt.count(),       // ← THÊM
      prisma.dispatchTp.count(),
    ]);

    return {
      tables: [
        { name: 'users', count: users },
        { name: 'dispatches', count: dispatches },
        { name: 'departments', count: departments },
        { name: 'roles', count: roles },
        { name: 'permissions', count: permissions },
        { name: 'user_roles', count: userRoles },
        { name: 'role_permissions', count: rolePermissions },
        { name: 'assignments', count: assignments },
        { name: 'attachments', count: attachments },
        { name: 'reports', count: reports },
        { name: 'rejections', count: rejections },
        { name: 'notifications', count: notifications },
        { name: 'audit_logs', count: auditLogs },
        { name: 'sessions', count: sessions },
        { name: 'exports', count: exports },
        { name: 'columns', count: columns },
        { name: 'system_settings', count: systemSettings },
        { name: 'dispatch_pvts', count: dispatchPvts },   // ← THÊM
        { name: 'dispatch_tps', count: dispatchTps },
      ],
    };
  },

  // ============================================
  // 2. XEM DATA CỦA 1 BẢNG
  // ============================================
  async getTableData(tableName, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    // Whitelist tables
    const allowedTables = [
      'users', 'dispatches', 'departments', 'roles', 'permissions',
      'user_roles', 'role_permissions', 'assignments', 'attachments',
      'reports', 'rejections', 'notifications', 'audit_logs',
      'sessions', 'exports', 'columns', 'system_settings', 'dispatch_pvts', 'dispatch_tps',
    ];

    if (!allowedTables.includes(tableName)) {
      throw { status: 400, message: 'Bảng không được phép truy cập' };
    }

    // Query raw
    const data = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${tableName}" LIMIT ${limit} OFFSET ${skip}`
    );

    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );

    const total = Number(countResult[0].count);

    // Convert BigInt + Date → String
    const sanitized = data.map(row => {
      const newRow = {};
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'bigint') {
          newRow[key] = value.toString();
        } else if (value instanceof Date) {
          newRow[key] = value.toISOString();
        } else {
          newRow[key] = value;
        }
      }
      return newRow;
    });

    return {
      table: tableName,
      data: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 3. THỐNG KÊ TỔNG QUAN DATABASE
  // ============================================
  async getStats() {
    const [users, dispatches, departments, roles, permissions] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.dispatch.count({ where: { deletedAt: null } }),
      prisma.department.count({ where: { active: true } }),
      prisma.role.count(),
      prisma.permission.count(),
    ]);

    return {
      stats: {
        users,
        dispatches,
        departments,
        roles,
        permissions,
      },
    };
  },

  // ============================================
  // 4. AUDIT LOGS
  // ============================================
  async getAuditLogs(filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, fullName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 5. SESSIONS
  // ============================================
  async getSessions(filters = {}) {
    const where = {};
    if (filters.userId) where.userId = filters.userId;

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: {
          select: { id: true, username: true, fullName: true },
        },
      },
    });

    return { sessions };
  },
};