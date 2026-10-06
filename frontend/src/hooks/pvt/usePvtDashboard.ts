// src/hooks/pvt/usePvtDashboard.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';
import { PvtSummary, PvtDeptStat } from '../../types/pvt';

export const usePvtDashboard = (currentUser: User | null, allUsers: User[]) => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // LOAD
  // ============================================
  const load = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await apiClient.getDispatches({
        limit: 1000,
        assignedPvtId: currentUser.id,
      });
      setDispatches(list);
    } catch (e: any) {
      setError(e.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================
  // STATS
  // ============================================
  const summary: PvtSummary = useMemo(() => {
    const total = dispatches.length;
    let choGiaoTp = 0;
    let daGiaoTp = 0;
    let choTrinhVt = 0;
    let daTrinhVt = 0;
    let hoanThanh = 0;
    let quaHan = 0;
    let sapDenHan = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    dispatches.forEach(d => {
      // Trạng thái
      if (d.trangThai === 'HOAN_THANH') hoanThanh++;
      else if (d.trangThai === 'CHO_TP_XU_LY') daGiaoTp++;
      else if (d.trangThai === 'CHO_PVT_DUYET') choTrinhVt++;
      else if (d.trangThai === 'CHO_VT_DUYET') daTrinhVt++;
      else if (d.trangThai === 'CHO_PVT_XU_LY' || d.trangThai === 'MOI_TAO') choGiaoTp++;

      // Đếm quá hạn
      if (d.trangThai !== 'HOAN_THANH' && d.hanBaoCaoXuLy) {
        const han = new Date(d.hanBaoCaoXuLy);
        if (han < today) quaHan++;
        else if (han <= in3Days) sapDenHan++;
      }
    });

    return { total, choGiaoTp, daGiaoTp, choTrinhVt, daTrinhVt, hoanThanh, quaHan, sapDenHan };
  }, [dispatches]);

  // ============================================
  // DEPT STATS — Phòng phụ trách
  // ============================================
  const deptStats: PvtDeptStat[] = useMemo(() => {
    if (!currentUser) return [];

    // Tìm các TP có pvtManagerId = currentUser.id
    const myTps = allUsers.filter(
      u => u.role === 'TRUONG_PHONG' && u.managerId === currentUser.id
    );

    return myTps.map(tp => {
      const deptDispatches = dispatches.filter(
        d => d.assignedTpId === tp.id || d.assignedTpId === tp.roomCode
      );
      const total = deptDispatches.length;
      const completed = deptDispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
      const overdue = deptDispatches.filter(d => {
        if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
        return new Date(d.hanBaoCaoXuLy) < new Date();
      }).length;
      const inProgress = total - completed - overdue;

      return {
        code: tp.roomCode || '',
        name: (tp as any).department?.name || `Phòng ${tp.roomCode}`,
        managerName: tp.fullName,
        managerId: tp.id,
        total,
        completed,
        inProgress,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }, [dispatches, allUsers, currentUser]);

  // ============================================
  // FILTERED LISTS
  // ============================================
  const choGiaoTpList = useMemo(
    () => dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH'),
    [dispatches]
  );

  const daGiaoTpList = useMemo(
    () => dispatches.filter(d => d.assignedTpId),
    [dispatches]
  );

  const choTrinhVtList = useMemo(
    () => dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET'),
    [dispatches]
  );

  const daTrinhVtList = useMemo(
    () => dispatches.filter(d => d.trangThai === 'CHO_VT_DUYET' || d.trangThai === 'HOAN_THANH'),
    [dispatches]
  );

  return {
    dispatches,
    summary,
    deptStats,
    choGiaoTpList,
    daGiaoTpList,
    choTrinhVtList,
    daTrinhVtList,
    isLoading,
    error,
    reload: load,
  };
};