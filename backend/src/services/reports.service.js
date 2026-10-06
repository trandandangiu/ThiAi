// backend/src/services/reports.service.js
import prisma from '../config/prisma.js';

export const reportsService = {
  // ============================================
  // 1. TẠO BÁO CÁO
  // ============================================
  async createReport(dispatchId, data, currentUser) {
    const { content, progressPct, reportType, attachmentIds } = data;

    if (!content) {
      throw { status: 400, message: 'Thiếu nội dung báo cáo' };
    }

    // Check dispatch
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check user có trong công văn không
    const canReport = await prisma.dispatch.findFirst({
      where: {
        id: dispatchId,
        OR: [
          { createdById: currentUser.id },
          { dispatchPvts: { some: { pvtId: currentUser.id } } },
          { dispatchTps: { some: { tpId: currentUser.id } } },
        ],
      },
    });

    if (!canReport && !currentUser.permissions?.includes('dispatch:view:all')) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    // Tạo report
    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.report.create({
        data: {
          dispatchId,
          reporterId: currentUser.id,
          reporterName: currentUser.fullName,
          reporterRole: currentUser.roles?.[0] || 'USER',
          content,
          progressPct: progressPct || 0,
          reportType: reportType || 'PROGRESS',
          status: 'SUBMITTED',
          attachmentIds: attachmentIds || [],
        },
      });

      // Cập nhật tiến độ dispatch nếu có
      if (progressPct !== undefined) {
        await tx.dispatch.update({
          where: { id: dispatchId },
          data: {
            tienDo: progressPct,
            baoCaoTienDo: content,
            updatedAt: new Date(),
          },
        });
      }

      // Audit
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'CREATE_REPORT',
          entityType: 'report',
          entityId: created.id,
          newValue: { content, progressPct },
        },
      });

      return created;
    });

    return report;
  },

  // ============================================
  // 2. LẤY DANH SÁCH BÁO CÁO CỦA CÔNG VĂN
  // ============================================
  async getReportsByDispatch(dispatchId, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch || dispatch.deletedAt) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const reports = await prisma.report.findMany({
      where: { dispatchId },
      orderBy: { createdAt: 'desc' },
    });

    return { reports };
  },

  // ============================================
  // 3. LẤY TẤT CẢ BÁO CÁO (THEO ROLE)
  // ============================================
  async getAllReports(currentUser, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {};

    // Phân quyền
    const perms = currentUser.permissions || [];

    if (perms.includes('report:view:all')) {
      // Xem tất cả
    } else if (perms.includes('report:view:department')) {
      // PVT: xem báo cáo của công văn mình được giao
      where.dispatch = {
        dispatchPvts: { some: { pvtId: currentUser.id } },
      };
    } else {
      // TP: chỉ xem báo cáo mình tạo
      where.reporterId = currentUser.id;
    }

    if (filters.reportType) {
      where.reportType = filters.reportType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          dispatch: {
            select: {
              id: true,
              soCongVan: true,
              tenCongVan: true,
              trangThai: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // ============================================
  // 4. XÓA BÁO CÁO
  // ============================================
  async deleteReport(reportId, currentUser) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw { status: 404, message: 'Không tìm thấy báo cáo' };
    }

    // Chỉ người tạo mới được xóa
    if (report.reporterId !== currentUser.id 
        && !currentUser.permissions?.includes('report:view:all')) {
      throw { status: 403, message: 'Không có quyền xóa báo cáo này' };
    }

    await prisma.report.delete({ where: { id: reportId } });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_REPORT',
        entityType: 'report',
        entityId: reportId,
      },
    });

    return { success: true, message: 'Đã xóa báo cáo' };
  },
};