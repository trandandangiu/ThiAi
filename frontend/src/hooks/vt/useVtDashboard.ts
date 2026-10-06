// src/hooks/vt/useVtDashboard.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';
import {
  VtSummary,
  VtPvtStat,
  VtTpStat,
  VtTrendPoint,
  VtHeatmapCell,
} from '../../types/vt';

export const useVtDashboard = (allUsers: User[]) => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await apiClient.getDispatches({ limit: 1000 });
      setDispatches(list);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================
  // SUMMARY
  // ============================================
  const summary: VtSummary = useMemo(() => {
    const total = dispatches.length;
    let daPhanCongPvt = 0;
    let hoanThanh = 0;
    let dangXuLy = 0;
    let sapDenHan = 0;
    let quaHan = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    dispatches.forEach(d => {
      if (d.assignedPvtId) daPhanCongPvt++;

      if (d.trangThai === 'HOAN_THANH') {
        hoanThanh++;
      } else {
        // Kiểm tra quá hạn
        if (d.hanBaoCaoXuLy) {
          const han = new Date(d.hanBaoCaoXuLy);
          if (han < today) quaHan++;
          else if (han <= in3Days) sapDenHan++;
          else dangXuLy++;
        } else {
          dangXuLy++;
        }
      }
    });

    return {
      total,
      daPhanCongPvt,
      chuaPhanCongPvt: total - daPhanCongPvt,
      hoanThanh,
      dangXuLy,
      sapDenHan,
      quaHan,
      rateOnTime: total > 0 ? Math.round((hoanThanh / total) * 100) : 0,
    };
  }, [dispatches]);

  // ============================================
  // PVT STATS (12 PVT)
  // ============================================
  const pvtStats: VtPvtStat[] = useMemo(() => {
    const pvtUsers = allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG');

    return pvtUsers.map(pvt => {
      const pvtDispatches = dispatches.filter(d =>
        d.assignedPvtId === pvt.id ||
        d.assignedPvtName === pvt.fullName ||
        (pvt.roomCode && d.assignedPvtName?.includes(pvt.roomCode))
      );

      const total = pvtDispatches.length;
      const completed = pvtDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
      const overdue = pvtDispatches.filter(d => {
        if (d.trangThai === 'HOAN_THANH') return false;
        if (!d.hanBaoCaoXuLy) return false;
        return new Date(d.hanBaoCaoXuLy) < new Date();
      }).length;
      const inProgress = total - completed - overdue;

      return {
        id: pvt.id,
        name: pvt.fullName,
        roomCode: pvt.roomCode || '',
        total,
        completed,
        inProgress,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [allUsers, dispatches]);

  // ============================================
  // TP STATS (12 TP)
  // ============================================
  const tpStats: VtTpStat[] = useMemo(() => {
    const tpUsers = allUsers.filter(u => u.role === 'TRUONG_PHONG');

    return tpUsers.map(tp => {
      const tpDispatches = dispatches.filter(d =>
        d.assignedTpId === tp.id ||
        d.assignedTpId === tp.roomCode ||
        (d.phongBan && d.phongBan.toUpperCase() === (tp.roomCode || '').toUpperCase())
      );

      const total = tpDispatches.length;
      const completed = tpDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
      const overdue = tpDispatches.filter(d => {
        if (d.trangThai === 'HOAN_THANH') return false;
        if (!d.hanBaoCaoXuLy) return false;
        return new Date(d.hanBaoCaoXuLy) < new Date();
      }).length;

      const pvtManager = tp.pvtManagerId
        ? allUsers.find(u => u.id === tp.pvtManagerId)
        : undefined;

      return {
        id: tp.id,
        code: tp.roomCode || '',
        name: tp.fullName,
        pvtManagerName: pvtManager?.fullName,
        total,
        completed,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [allUsers, dispatches]);

  // ============================================
  // TREND (30 ngày gần nhất)
  // ============================================
  const trendData: VtTrendPoint[] = useMemo(() => {
    const points: VtTrendPoint[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);

      const newCount = dispatches.filter(disp => {
        const dg = disp.ngayGui || disp.ngayPhatHanh;
        return dg && dg.slice(0, 10) === dateStr;
      }).length;

      const completedCount = dispatches.filter(disp => {
        if (disp.trangThai !== 'HOAN_THANH') return false;
        const updatedAt = (disp as any).updatedAt || disp.ngayGui;
        return updatedAt && updatedAt.slice(0, 10) === dateStr;
      }).length;

      points.push({ date: dateStr, newCount, completedCount });
    }

    return points;
  }, [dispatches]);

  // ============================================
  // HEATMAP (12 dept × 7 days)
  // ============================================
  const heatmapData: VtHeatmapCell[] = useMemo(() => {
    const cells: VtHeatmapCell[] = [];
    const today = new Date();

    tpStats.forEach(tp => {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);

        const count = dispatches.filter(disp => {
          const isDept =
            disp.assignedTpId === tp.id ||
            disp.assignedTpId === tp.code ||
            (disp.phongBan && disp.phongBan.toUpperCase() === tp.code.toUpperCase());
          if (!isDept) return false;
          const dg = disp.ngayGui || disp.ngayPhatHanh;
          return dg && dg.slice(0, 10) === dateStr;
        }).length;

        cells.push({ deptCode: tp.code, date: dateStr, count });
      }
    });

    return cells;
  }, [dispatches, tpStats]);

  return {
    dispatches,
    summary,
    pvtStats,
    tpStats,
    trendData,
    heatmapData,
    isLoading,
    error,
    reload: load,
  };
};