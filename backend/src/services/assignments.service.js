// backend/src/services/assignments.service.js
import prisma from '../config/prisma.js';
import { createAndPushNotification } from './notification.helper.js';

export const assignmentsService = {
  // ============================================
  // 1. VT GIAO CHO 1-N PVT
  // ============================================
  async assignPvts(dispatchId, data, currentUser) {
    const { pvts, vtChiDao, hanBaoCaoXuLy, mucDoKhan } = data;

    if (!pvts || !Array.isArray(pvts) || pvts.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 PVT' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    if (dispatch.trangThai !== 'MOI_TAO' && dispatch.trangThai !== 'VT_TRA_LAI') {
      throw { status: 400, message: 'Công văn không ở trạng thái có thể giao' };
    }

    // Validate PVT tồn tại + có role
    for (const pvt of pvts) {
      const user = await prisma.user.findUnique({
        where: { id: pvt.pvtId },
        include: { userRoles: { include: { role: true } } },
      });

      if (!user) {
        throw { status: 404, message: `Không tìm thấy PVT: ${pvt.pvtId}` };
      }

      const hasPvtRole = user.userRoles.some(
        ur => ur.role.code === 'PHO_VIEN_TRUONG'
      );

      if (!hasPvtRole) {
        throw {
          status: 400,
          message: `User ${user.fullName} không phải Phó Viện trưởng`,
        };
      }
    }

    const hasPrimary = pvts.some(p => p.isPrimary === true);
    if (!hasPrimary && pvts.length > 1) {
      throw { status: 400, message: 'Phải chọn 1 PVT chính khi giao nhiều người' };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Xóa PVT cũ
      await tx.dispatchPvt.deleteMany({ where: { dispatchId } });

      // Tạo PVT mới
      await tx.dispatchPvt.createMany({
        data: pvts.map(pvt => ({
          dispatchId,
          pvtId: pvt.pvtId,
          pvtName: pvt.pvtName,
          roomCode: pvt.roomCode || '',
          isPrimary: pvt.isPrimary || pvts.length === 1,
          role: pvt.isPrimary ? 'CHINH' : 'PHOI_HOP',
          status: 'PENDING',
        })),
      });

      // Cập nhật dispatch
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_PVT_XU_LY',
          vtChiDao: vtChiDao || dispatch.vtChiDao,
          hanBaoCaoXuLy: hanBaoCaoXuLy
            ? new Date(hanBaoCaoXuLy)
            : dispatch.hanBaoCaoXuLy,
          mucDoKhan: mucDoKhan || dispatch.mucDoKhan,
          assignedPvtId: pvts[0].pvtId,
          assignedPvtName: pvts[0].pvtName,
          updatedAt: new Date(),
        },
      });

      // ⭐ Log + thông báo cho TỪNG PVT
      for (const pvt of pvts) {
        await tx.assignment.create({
          data: {
            dispatchId,
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromRole: currentUser.roles?.[0] || 'VIEN_TRUONG',
            toUserId: pvt.pvtId,
            toUserName: pvt.pvtName,
            toRole: 'PHO_VIEN_TRUONG',
            assignLevel: 'VT_TO_PVT',
            chiDao: vtChiDao,
            hanXuLy: hanBaoCaoXuLy ? new Date(hanBaoCaoXuLy) : null,
            status: 'PENDING',
          },
        });

        // ⭐ Gửi notification + push realtime cho PVT được giao
        await createAndPushNotification(tx, {
          userId: pvt.pvtId,
          dispatchId,
          type: 'TASK_ASSIGNED',
          title: ' Công văn mới được chuyển tới',
          content: `${currentUser.fullName} đã chuyển công văn ${dispatch.soCongVan} cho bạn${
            vtChiDao ? `: "${vtChiDao}"` : ''
          }`,
        });
      }

      // ⭐⭐ THÔNG BÁO CHO TẤT CẢ VT KHÁC (trừ người giao)
      const allVienTruongs = await tx.user.findMany({
        where: {
          deletedAt: null,
          active: true,
          id: { not: currentUser.id }, // trừ người giao
          userRoles: {
            some: { role: { code: 'VIEN_TRUONG' } },
          },
        },
        select: { id: true, fullName: true },
      });

      const pvtNames = pvts.map(p => p.pvtName).join(', ');
      for (const vt of allVienTruongs) {
        await createAndPushNotification(tx, {
          userId: vt.id,
          dispatchId,
          type: 'TASK_ASSIGNED',
          title: 'Thông báo mới',
          content: `${currentUser.fullName} đã giao công văn ${dispatch.soCongVan} cho ${pvtNames}`,
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'ASSIGN_PVTS',
          entityType: 'dispatch',
          entityId: dispatchId,
          newValue: { pvts, vtChiDao },
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: { dispatchPvts: true },
      });
    });

    return result;
  },

  // ============================================
  // 2. PVT GIAO CHO 1-N TP
  // ============================================
  async assignTps(dispatchId, data, currentUser) {
    const { tps, pvtChiDao, hanBaoCaoXuLy } = data;

    if (!tps || !Array.isArray(tps) || tps.length === 0) {
      throw { status: 400, message: 'Phải chọn ít nhất 1 TP' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchPvts: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    // Check quyền: PVT được giao HOẶC VT HOẶC Admin
    const isAssignedPvt = dispatch.dispatchPvts.some(
      dp => dp.pvtId === currentUser.id
    );
    const isVienTruong = currentUser.roles?.includes('VIEN_TRUONG');
    const isAdmin = currentUser.roles?.includes('ADMIN');

    if (!isAssignedPvt && !isVienTruong && !isAdmin) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    // Check trạng thái
    const validStatuses = [
      'MOI_TAO',
      'CHO_PVT_XU_LY',
      'CHO_TP_XU_LY',
      'DANG_XU_LY',
      'CHO_PVT_DUYET',
      'CHO_VT_DUYET',
      'PVT_TRA_LAI',
      'VT_TRA_LAI',
    ];

    if (dispatch.trangThai === 'HOAN_THANH') {
      throw {
        status: 400,
        message: 'Công văn đã hoàn thành, không thể giao Trưởng phòng',
      };
    }

    if (!validStatuses.includes(dispatch.trangThai)) {
      throw {
        status: 400,
        message: `Công văn đang ở trạng thái "${dispatch.trangThai}", không thể giao`,
      };
    }

    // Validate TP tồn tại + có role
    for (const tp of tps) {
      const user = await prisma.user.findUnique({
        where: { id: tp.tpId },
        include: { userRoles: { include: { role: true } } },
      });

      if (!user) {
        throw { status: 404, message: `Không tìm thấy TP: ${tp.tpId}` };
      }

      const hasTpRole = user.userRoles.some(
        ur => ur.role.code === 'TRUONG_PHONG'
      );

      if (!hasTpRole) {
        throw {
          status: 400,
          message: `User ${user.fullName} không phải Trưởng phòng`,
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Xóa TP cũ
      await tx.dispatchTp.deleteMany({ where: { dispatchId } });

      // Tạo TP mới
      await tx.dispatchTp.createMany({
        data: tps.map(tp => ({
          dispatchId,
          assignedByPvtId: currentUser.id,
          assignedByPvtName: currentUser.fullName,
          tpId: tp.tpId,
          tpName: tp.tpName,
          roomCode: tp.roomCode || '',
          isPrimary: tp.isPrimary || tps.length === 1,
          role: tp.isPrimary ? 'CHINH' : 'PHOI_HOP',
          status: 'PENDING',
        })),
      });

      // Cập nhật dispatch
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_TP_XU_LY',
          pvtChiDao,
          assignedTpId: tps[0].tpId,
          assignedTpName: tps[0].tpName,
          updatedAt: new Date(),
        },
      });

      // Nếu VT giao trực tiếp (không qua PVT)
      if (isVienTruong && !isAssignedPvt) {
        await tx.dispatch.update({
          where: { id: dispatchId },
          data: {
            customFields: {
              ...(dispatch.customFields || {}),
              assignedDirectlyByVt: true,
              assignedByUserId: currentUser.id,
            },
          },
        });
      }

      // ⭐ Log + thông báo cho TỪNG TP
      for (const tp of tps) {
        await tx.assignment.create({
          data: {
            dispatchId,
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromRole: currentUser.roles?.[0] || 'PHO_VIEN_TRUONG',
            toUserId: tp.tpId,
            toUserName: tp.tpName,
            toRole: 'TRUONG_PHONG',
            assignLevel: isVienTruong && !isAssignedPvt ? 'VT_TO_TP' : 'PVT_TO_TP',
            chiDao: pvtChiDao,
            status: 'PENDING',
          },
        });

        // ⭐ Gửi notification + push cho TP
        await createAndPushNotification(tx, {
          userId: tp.tpId,
          dispatchId,
          type: 'TASK_ASSIGNED',
          title: '📋 Công văn mới được giao',
          content: `${currentUser.fullName} đã giao công văn ${dispatch.soCongVan} cho bạn${
            pvtChiDao ? `: "${pvtChiDao}"` : ''
          }`,
        });
      }

      // ⭐⭐ THÔNG BÁO CHO TẤT CẢ VT
      // Nếu chính VT đang giao → trừ VT đó (biết rồi)
      // Nếu PVT đang giao → gửi cho HẾT VT (để theo dõi)
      const vtFilter = isVienTruong
        ? { id: { not: currentUser.id } }
        : {};

      const allVienTruongs = await tx.user.findMany({
        where: {
          deletedAt: null,
          active: true,
          userRoles: { some: { role: { code: 'VIEN_TRUONG' } } },
          ...vtFilter,
        },
        select: { id: true, fullName: true },
      });

      const tpNames = tps.map(t => t.tpName).join(', ');
      for (const vt of allVienTruongs) {
        await createAndPushNotification(tx, {
          userId: vt.id,
          dispatchId,
          type: 'TASK_ASSIGNED',
          title: 'Thông báo mới',
          content: ` `,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'ASSIGN_TPS',
          entityType: 'dispatch',
          entityId: dispatchId,
          newValue: { tps, pvtChiDao },
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          dispatchPvts: true,
          dispatchTps: true,
        },
      });
    });

    return result;
  },

  // ============================================
  // 3. TP ĐÁNH SỐ CÔNG VĂN
  // ============================================
  async tpNumber(dispatchId, data, currentUser) {
    const { soCongVanTP, ngayDanhSo } = data;

    if (!soCongVanTP) {
      throw { status: 400, message: 'Phải nhập số công văn' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const tp = await prisma.dispatchTp.findFirst({
      where: {
        dispatchId,
        tpId: currentUser.id,
      },
    });

    if (!tp && !currentUser.roles?.includes('ADMIN')) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    const updated = await prisma.dispatch.update({
      where: { id: dispatchId },
      data: {
        soCongVanTP,
        updatedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'TP_NUMBER',
        entityType: 'dispatch',
        entityId: dispatchId,
        newValue: { soCongVanTP, ngayDanhSo },
      },
    });

    return updated;
  },

  // ============================================
  // 4. TP GỬI LÊN PVT
  // ============================================
  async tpSubmit(dispatchId, data, currentUser) {
    const { baoCaoTienDo, tienDo, attachmentIds } = data;

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchPvts: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const tp = await prisma.dispatchTp.findFirst({
      where: {
        dispatchId,
        tpId: currentUser.id,
      },
    });

    if (!tp) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    if (dispatch.trangThai !== 'DANG_XU_LY' && dispatch.trangThai !== 'PVT_TRA_LAI') {
      throw { status: 400, message: 'Công văn không ở trạng thái có thể gửi' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_PVT_DUYET',
          baoCaoTienDo,
          tienDo: tienDo || 100,
          updatedAt: new Date(),
        },
      });

      await tx.dispatchTp.update({
        where: { id: tp.id },
        data: {
          status: 'DONE',
          baoCaoTienDo,
          tienDo: tienDo || 100,
          completedAt: new Date(),
        },
      });

      await tx.assignment.create({
        data: {
          dispatchId,
          fromUserId: currentUser.id,
          fromUserName: currentUser.fullName,
          fromRole: 'TRUONG_PHONG',
          toUserId: tp.assignedByPvtId,
          toUserName: tp.assignedByPvtName,
          toRole: 'PHO_VIEN_TRUONG',
          assignLevel: 'TP_TO_PVT',
          chiDao: baoCaoTienDo,
          status: 'PENDING',
        },
      });

      // Thông báo + push cho PVT
      await createAndPushNotification(tx, {
        userId: tp.assignedByPvtId,
        dispatchId,
        type: 'REPORT_SUBMITTED',
        title: '📝 Trưởng phòng đã báo cáo',
        content: `TP ${currentUser.fullName} đã gửi báo cáo cho công văn ${dispatch.soCongVan}`,
      });

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'TP_SUBMIT',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          dispatchPvts: true,
          dispatchTps: true,
        },
      });
    });

    return result;
  },

  // ============================================
  // 5. PVT TRÌNH LÊN VT
  // ============================================
  async pvtSubmit(dispatchId, data, currentUser) {
    const { pvtChiDao } = data;

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchTps: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const pvt = await prisma.dispatchPvt.findFirst({
      where: {
        dispatchId,
        pvtId: currentUser.id,
      },
    });

    if (!pvt) {
      throw { status: 403, message: 'Bạn không được giao công văn này' };
    }

    if (dispatch.trangThai !== 'CHO_PVT_DUYET') {
      throw { status: 400, message: 'Công văn chưa sẵn sàng để trình' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'CHO_VT_DUYET',
          pvtChiDao,
          updatedAt: new Date(),
        },
      });

      // Lấy VT đầu tiên (hoặc tất cả VT) để gửi thông báo
      const allVienTruongs = await tx.user.findMany({
        where: {
          deletedAt: null,
          active: true,
          userRoles: { some: { role: { code: 'VIEN_TRUONG' } } },
        },
        select: { id: true, fullName: true },
      });

      for (const vt of allVienTruongs) {
        await tx.assignment.create({
          data: {
            dispatchId,
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromRole: 'PHO_VIEN_TRUONG',
            toUserId: vt.id,
            toUserName: vt.fullName,
            toRole: 'VIEN_TRUONG',
            assignLevel: 'PVT_TO_VT',
            chiDao: pvtChiDao,
            status: 'PENDING',
          },
        });

        // Thông báo + push cho VT
        await createAndPushNotification(tx, {
          userId: vt.id,
          dispatchId,
          type: 'REPORT_SUBMITTED',
          title: '📤 PVT đã trình công văn',
          content: `${currentUser.fullName} đã trình công văn ${dispatch.soCongVan} lên Viện trưởng`,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'PVT_SUBMIT',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          dispatchPvts: true,
          dispatchTps: true,
        },
      });
    });

    return result;
  },

  // ============================================
  // 6. VT ĐỒNG Ý
  // ============================================
  async vtAgree(dispatchId, data, currentUser) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchPvts: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    if (dispatch.trangThai !== 'CHO_VT_DUYET') {
      throw { status: 400, message: 'Công văn không ở trạng thái chờ VT duyệt' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'HOAN_THANH',
          tienDo: 100,
          completedAt: new Date(),
        },
      });

      // Thông báo cho PVT
      for (const pvt of dispatch.dispatchPvts) {
        await createAndPushNotification(tx, {
          userId: pvt.pvtId,
          dispatchId,
          type: 'APPROVED',
          title: '✅ Viện trưởng đã đồng ý',
          content: `Công văn ${dispatch.soCongVan} đã được Viện trưởng đồng ý`,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'VT_AGREE',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({ where: { id: dispatchId } });
    });

    return result;
  },

  // ============================================
  // 7. VT KHÔNG ĐỒNG Ý (TRẢ LẠI PVT)
  // ============================================
  async vtDisagree(dispatchId, data, currentUser) {
    const { reason } = data;

    if (!reason) {
      throw { status: 400, message: 'Phải nhập lý do không đồng ý' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: { dispatchPvts: true },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'VT_TRA_LAI',
          lyDoKhongDongYVT: reason,
          soLanTraLai: (dispatch.soLanTraLai || 0) + 1,
        },
      });

      const primaryPvt =
        dispatch.dispatchPvts.find(p => p.isPrimary) ||
        dispatch.dispatchPvts[0];

      if (primaryPvt) {
        await tx.rejection.create({
          data: {
            dispatchId,
            fromUserId: currentUser.id,
            fromUserName: currentUser.fullName,
            fromRole: 'VIEN_TRUONG',
            toUserId: primaryPvt.pvtId,
            toUserName: primaryPvt.pvtName,
            toRole: 'PHO_VIEN_TRUONG',
            reason,
            category: 'CONTENT',
          },
        });

        await createAndPushNotification(tx, {
          userId: primaryPvt.pvtId,
          dispatchId,
          type: 'REJECTED',
          title: '❌ Viện trưởng không đồng ý',
          content: `Công văn ${dispatch.soCongVan}: ${reason}`,
        });
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'VT_DISAGREE',
          entityType: 'dispatch',
          entityId: dispatchId,
          newValue: { reason },
        },
      });

      return tx.dispatch.findUnique({ where: { id: dispatchId } });
    });

    return result;
  },

  // ============================================
  // 8. PVT ĐỒNG Ý
  // ============================================
  async pvtAgree(dispatchId, data, currentUser) {
    const tpId = data.tpId;

    const tp = await prisma.dispatchTp.findFirst({
      where: { dispatchId, tpId },
    });

    if (!tp) {
      throw { status: 404, message: 'Không tìm thấy TP được giao' };
    }

    await prisma.dispatchTp.update({
      where: { id: tp.id },
      data: { status: 'ACCEPTED' },
    });

    return { success: true, message: 'Đã đồng ý' };
  },

  // ============================================
  // 9. PVT KHÔNG ĐỒNG Ý (TRẢ LẠI TP)
  // ============================================
  async pvtDisagree(dispatchId, data, currentUser) {
    const { reason, tpId } = data;

    if (!reason) {
      throw { status: 400, message: 'Phải nhập lý do không đồng ý' };
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      throw { status: 404, message: 'Không tìm thấy công văn' };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          trangThai: 'PVT_TRA_LAI',
          lyDoKhongDongYPVT: reason,
          soLanTraLai: (dispatch.soLanTraLai || 0) + 1,
        },
      });

      if (tpId) {
        const tp = await tx.dispatchTp.findFirst({
          where: { dispatchId, tpId },
        });

        if (tp) {
          await tx.rejection.create({
            data: {
              dispatchId,
              fromUserId: currentUser.id,
              fromUserName: currentUser.fullName,
              fromRole: 'PHO_VIEN_TRUONG',
              toUserId: tp.tpId,
              toUserName: tp.tpName,
              toRole: 'TRUONG_PHONG',
              reason,
              category: 'CONTENT',
            },
          });

          await createAndPushNotification(tx, {
            userId: tp.tpId,
            dispatchId,
            type: 'REJECTED',
            title: '❌ PVT không đồng ý',
            content: `Công văn ${dispatch.soCongVan}: ${reason}`,
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: 'PVT_DISAGREE',
          entityType: 'dispatch',
          entityId: dispatchId,
        },
      });

      return tx.dispatch.findUnique({ where: { id: dispatchId } });
    });

    return result;
  },

  // ============================================
  // 10. LỊCH SỬ LUÂN CHUYỂN
  // ============================================
  async getHistory(dispatchId) {
    const [assignments, rejections] = await Promise.all([
      prisma.assignment.findMany({
        where: { dispatchId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.rejection.findMany({
        where: { dispatchId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const history = [
      ...assignments.map(a => ({
        type: 'ASSIGNMENT',
        action: a.assignLevel,
        from: a.fromUserName,
        to: a.toUserName,
        chiDao: a.chiDao,
        at: a.createdAt,
      })),
      ...rejections.map(r => ({
        type: 'REJECTION',
        from: r.fromUserName,
        to: r.toUserName,
        reason: r.reason,
        at: r.createdAt,
      })),
    ].sort((a, b) => new Date(a.at) - new Date(b.at));

    return history;
  },
};