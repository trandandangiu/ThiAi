// backend/src/services/stats.service.js
import prisma from '../config/prisma.js';

export const statsService = {
  // ============================================
  // 1. DASHBOARD VIỆN TRƯỞNG (OVERVIEW)
  // ============================================
  async getVTOverview(currentUser) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setHours(23, 59, 59, 999);

    // Tổng quan
    const [
      total,
      hoanThanh,
      dangXuLy,
      choPvtXuLy,
      choTpXuLy,
      choPvtDuyet,
      choVtDuyet,
      quaHan,
      sapDenHan,
      chuaToiHan,
    ] = await Promise.all([
      prisma.dispatch.count({ where: { deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'HOAN_THANH', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'DANG_XU_LY', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_PVT_XU_LY', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_TP_XU_LY', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_PVT_DUYET', deletedAt: null } }),
      prisma.dispatch.count({ where: { trangThai: 'CHO_VT_DUYET', deletedAt: null } }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: {
            gte: today,              // ⭐ Bao gồm hôm nay
            lte: in3Days,
          },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gte: today, lte: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gt: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
    ]);

    // Thống kê theo PVT
    const pvts = await prisma.user.findMany({
      where: {
        userRoles: { some: { role: { code: 'PHO_VIEN_TRUONG' } } },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        roomCode: true,
      },
    });

    const pvtStats = await Promise.all(
      pvts.map(async (pvt) => {
        const pvtDispatches = await prisma.dispatch.findMany({
          where: {
            dispatchPvts: { some: { pvtId: pvt.id } },
            deletedAt: null,
          },
          select: { trangThai: true, tienDo: true },
        });

        const pvtTotal = pvtDispatches.length;
        const pvtCompleted = pvtDispatches.filter(
          d => d.trangThai === 'HOAN_THANH'
        ).length;
        const pvtOverdue = pvtDispatches.filter(
          d => d.trangThai === 'QUA_HAN'
        ).length;
        const avgProgress = pvtTotal > 0
          ? Math.round(
            pvtDispatches.reduce((sum, d) => sum + (d.tienDo || 0), 0) / pvtTotal
          )
          : 0;

        return {
          id: pvt.id,
          code: pvt.roomCode,
          name: pvt.fullName,
          total: pvtTotal,
          completed: pvtCompleted,
          overdue: pvtOverdue,
          avgProgress,
          completionRate: pvtTotal > 0
            ? Math.round((pvtCompleted / pvtTotal) * 100)
            : 0,
        };
      })
    );

    // Thống kê theo TP
    const tps = await prisma.user.findMany({
      where: {
        userRoles: { some: { role: { code: 'TRUONG_PHONG' } } },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        roomCode: true,
        department: { select: { id: true, code: true, name: true } },
      },
    });

    const tpStats = await Promise.all(
      tps.map(async (tp) => {
        const tpDispatches = await prisma.dispatch.findMany({
          where: {
            dispatchTps: { some: { tpId: tp.id } },
            deletedAt: null,
          },
          select: { trangThai: true, tienDo: true },
        });

        const tpTotal = tpDispatches.length;
        const tpCompleted = tpDispatches.filter(
          d => d.trangThai === 'HOAN_THANH'
        ).length;
        const tpOverdue = tpDispatches.filter(
          d => d.trangThai === 'QUA_HAN'
        ).length;
        const avgProgress = tpTotal > 0
          ? Math.round(
            tpDispatches.reduce((sum, d) => sum + (d.tienDo || 0), 0) / tpTotal
          )
          : 0;

        return {
          id: tp.id,
          code: tp.roomCode,
          name: tp.fullName,
          department: tp.department,
          total: tpTotal,
          completed: tpCompleted,
          overdue: tpOverdue,
          avgProgress,
          completionRate: tpTotal > 0
            ? Math.round((tpCompleted / tpTotal) * 100)
            : 0,
        };
      })
    );

    return {
      summary: {
        total,
        hoanThanh,
        dangXuLy,
        choPvtXuLy,
        choTpXuLy,
        choPvtDuyet,
        choVtDuyet,
        quaHan,
        sapDenHan,
        chuaToiHan,
        tyLeHoanThanh: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
      },
      pvtStats,
      tpStats,
    };
  },

  // ============================================
  // 2. CHART DATA — BIỂU ĐỒ TRÒN
  // ============================================
  async getChartData(currentUser) {
    const today = new Date();
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const [quaHan, sapDenHan, chuaToiHan, hoanThanh] = await Promise.all([
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { lt: today },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gte: today, lte: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: {
          hanBaoCaoXuLy: { gt: in3Days },
          trangThai: { not: 'HOAN_THANH' },
          deletedAt: null,
        },
      }),
      prisma.dispatch.count({
        where: { trangThai: 'HOAN_THANH', deletedAt: null },
      }),
    ]);

    return {
      chartData: [
        { name: 'Quá hạn', value: quaHan, color: '#ef4444' },
        { name: 'Sắp đến hạn', value: sapDenHan, color: '#f59e0b' },
        { name: 'Chưa tới hạn', value: chuaToiHan, color: '#10b981' },
        { name: 'Hoàn thành', value: hoanThanh, color: '#3b82f6' },
      ],
      total: quaHan + sapDenHan + chuaToiHan + hoanThanh,
    };
  },

  // ============================================
  // 3. DASHBOARD THEO PVT
  // ============================================
  async getPvtDashboard(currentUser) {
    const pvtId = currentUser.id;

    const pvtDispatches = await prisma.dispatch.findMany({
      where: {
        dispatchPvts: { some: { pvtId } },
        deletedAt: null,
      },
      include: {
        dispatchTps: true,
      },
    });

    const total = pvtDispatches.length;
    const hoanThanh = pvtDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const dangXuLy = pvtDispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    const choPvtXuLy = pvtDispatches.filter(d => d.trangThai === 'CHO_PVT_XU_LY').length;
    const choPvtDuyet = pvtDispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    const choVtDuyet = pvtDispatches.filter(d => d.trangThai === 'CHO_VT_DUYET').length;

    return {
      summary: {
        total,
        hoanThanh,
        dangXuLy,
        choPvtXuLy,
        choPvtDuyet,
        choVtDuyet,
        tyLeHoanThanh: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
      },
    };
  },

  // ============================================
  // 4. DASHBOARD THEO TP
  // ============================================
  async getTpDashboard(currentUser) {
    const tpId = currentUser.id;

    const tpDispatches = await prisma.dispatch.findMany({
      where: {
        dispatchTps: { some: { tpId } },
        deletedAt: null,
      },
    });

    const total = tpDispatches.length;
    const hoanThanh = tpDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const dangXuLy = tpDispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    const choTpXuLy = tpDispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY').length;
    const choPvtDuyet = tpDispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    const pvtTraLai = tpDispatches.filter(d => d.trangThai === 'PVT_TRA_LAI').length;

    return {
      summary: {
        total,
        hoanThanh,
        dangXuLy,
        choTpXuLy,
        choPvtDuyet,
        pvtTraLai,
        tyLeHoanThanh: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
      },
    };
  },
};