// src/pages/VienTruongDashboard.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { AssignPvtModal } from '../components/AssignPvtModal';
import { AssignTpModal } from '../components/AssignTpModal';
import { DispatchModal } from '../components/DispatchModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import { useVtDashboard } from '../hooks/vt/useVtDashboard';
import { PublicDesktopTable } from '../components/public/PublicDesktopTable';
import { PublicMobileCardList } from '../components/vt/PublicMobileCardList';
import { MobileFab } from '../components/vt/MobileFab';
import { VtFilters, DEFAULT_VT_FILTERS } from '../types/vt';
import { formatDate } from '../utils/format';
import { resolveDispatchStatus } from '../services/excelService';

// VT Components
import { VtHeroHeader } from '../components/vt/VtHeroHeader';
import { VtKpiGrid } from '../components/vt/VtKpiGrid';
import { VtPvtLeaderboard } from '../components/vt/VtPvtLeaderboard';
import { VtDeptHeatmap } from '../components/vt/VtDeptHeatmap';
import { ChuyenDeModal } from '../components/chuyende/ChuyenDeModal';
import { ChuyenDeDrawer } from '../components/chuyende/ChuyenDeDrawer';
import { isChuyenDe } from '../utils/chuyenDe';
import {
  VtTrendChart,
  VtTopPvtChart,
  VtDeptChart,
} from '../components/vt/VtAdvancedCharts';
import { VtFilterBar } from '../components/vt/VtFilterBar';
import { VtPvtDetailDrawer } from '../components/vt/VtPvtDetailDrawer';
import { VtSidebar, VtSidebarTab } from '../components/vt/VtSidebar';

import {
  CheckCircle2,
  Download,
  Plus,
} from 'lucide-react';

// ============================================
// 🎯 HELPER — XẾP HẠNG ƯU TIÊN TRẠNG THÁI
// ============================================
function getStatusPriority(d: Dispatch): number {
  if (d.trangThai === 'HOAN_THANH') return 5;
  if (!d.hanBaoCaoXuLy) return 4;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = parseToDate(d.hanBaoCaoXuLy);
  if (!deadline) return 4;

  const days = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return 1;
  if (days === 1) return 2;
  if (days <= 10) return 3;
  return 4;
}

// ============================================
// 🎯 HELPER — PARSE NGÀY AN TOÀN
// ============================================
function parseToDate(input?: string | null): Date | null {
  if (!input) return null;

  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const formatted = formatDate(input);
  const parts = formatted.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d2 = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
}

// ============================================
// MAIN
// ============================================
export const VienTruongDashboard: React.FC = () => {
  const { allUsers, currentUser } = useAuth();

  const {
    dispatches,
    summary,
    pvtStats,
    tpStats,
    trendData,
    heatmapData,
    isLoading,
    reload,
  } = useVtDashboard(allUsers);

  const [filters, setFilters] = useState<VtFilters>(DEFAULT_VT_FILTERS);
  const [activeSidebarTab, setActiveSidebarTab] = useState<VtSidebarTab>('action-all');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vt_sidebar_collapsed') === '1';
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('vt_sidebar_collapsed', next ? '1' : '0');
      return next;
    });
  };
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignTpDirectOpen, setIsAssignTpDirectOpen] = useState(false);
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);

  // ⭐ Tách riêng state cho công văn và chuyên đề
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [chuyenDeDetail, setChuyenDeDetail] = useState<Dispatch | null>(null);

  // ⭐ Modal tạo/sửa chuyên đề
  const [isChuyenDeModalOpen, setIsChuyenDeModalOpen] = useState(false);
  const [chuyenDeToEdit, setChuyenDeToEdit] = useState<Dispatch | null>(null);

  const [pvtDetailStat, setPvtDetailStat] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const pvtList = useMemo(
    () => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'),
    [allUsers]
  );

  const pendingCount = useMemo(
    () => dispatches.filter(d => !d.assignedPvtId && d.trangThai !== 'HOAN_THANH').length,
    [dispatches]
  );

  const approveCount = useMemo(
    () => dispatches.filter(d => d.trangThai === 'CHO_VT_DUYET').length,
    [dispatches]
  );

  const deptList = useMemo(() => {
    return allUsers
      .filter(u => u.role === 'TRUONG_PHONG' && u.roomCode)
      .map(u => ({ code: u.roomCode || '', name: u.fullName }))
      .sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));
  }, [allUsers]);

  // ============================================
  // FILTER + SORT
  // ============================================
  const filteredDispatches = useMemo(() => {
    const safeDispatches: Dispatch[] = Array.isArray(dispatches) ? dispatches : [];

    const list: Dispatch[] = safeDispatches.filter(d => {
      if (!d) return false;

      if (filters.loaiVanBan === 'CONG_VAN' && isChuyenDe(d)) return false;
      if (filters.loaiVanBan === 'CHUYEN_DE' && !isChuyenDe(d)) return false;

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          (d.soCongVan || '').toLowerCase().includes(q) ||
          (d.tenCongVan || '').toLowerCase().includes(q) ||
          (d.donViBanHanh || '').toLowerCase().includes(q) ||
          (d.assignedPvtName || '').toLowerCase().includes(q) ||
          (d.assignedTpName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (filters.pvtIds.length > 0) {
        const matchPvt = filters.pvtIds.some(id => {
          const pvt = pvtList.find(p => p.id === id);
          return (
            d.assignedPvtId === id ||
            (pvt && d.assignedPvtName === pvt.fullName) ||
            (pvt?.roomCode && d.assignedPvtName?.includes(pvt.roomCode))
          );
        });
        if (!matchPvt) return false;
      }

      if (filters.deptCodes.length > 0) {
        const matchDept = filters.deptCodes.some(code => {
          return (
            d.assignedTpId === code ||
            (d.assignedTpName && d.assignedTpName.includes(code)) ||
            (d.phongBan && d.phongBan.toUpperCase() === code.toUpperCase())
          );
        });
        if (!matchDept) return false;
      }

      if (filters.status !== 'ALL' && d.trangThai !== filters.status) return false;
      if (filters.urgency !== 'ALL' && d.mucDoKhan !== filters.urgency) return false;

      if (filters.dateFrom || filters.dateTo) {
        const dateStr = (d.ngayGui || d.ngayPhatHanh || '').slice(0, 10);
        if (filters.dateFrom && dateStr < filters.dateFrom) return false;
        if (filters.dateTo && dateStr > filters.dateTo) return false;
      }

      return true;
    });

    const sortMode = filters.sortMode || 'newest';

    const extractSortValue = (mode: string, prefix: string): string | null => {
      if (!mode.startsWith(prefix)) return null;
      const rest = mode.substring(prefix.length);
      if (rest.startsWith('asc_')) return rest.substring(4);
      if (rest.startsWith('desc_')) return rest.substring(5);
      return null;
    };

    const isDesc = sortMode.includes('_desc_');

    const loaiVbValue = extractSortValue(sortMode, 'sort_loai_vb_');
    if (loaiVbValue !== null) {
      return list.slice().sort((a, b) => {
        const aVal = (a.loaiCongVan || '').toLowerCase();
        const bVal = (b.loaiCongVan || '').toLowerCase();
        const target = loaiVbValue.toLowerCase();
        const aMatch = aVal === target ? 1 : 0;
        const bMatch = bVal === target ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return isDesc ? bVal.localeCompare(aVal, 'vi') : aVal.localeCompare(bVal, 'vi');
      });
    }

    const donViValue = extractSortValue(sortMode, 'sort_don_vi_');
    if (donViValue !== null) {
      return list.slice().sort((a, b) => {
        const aVal = (a.donViBanHanh || '').toLowerCase();
        const bVal = (b.donViBanHanh || '').toLowerCase();
        const target = donViValue.toLowerCase();
        const aMatch = aVal === target ? 1 : 0;
        const bMatch = bVal === target ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return isDesc ? bVal.localeCompare(aVal, 'vi') : aVal.localeCompare(bVal, 'vi');
      });
    }

    const pvtValue = extractSortValue(sortMode, 'sort_pvt_');
    if (pvtValue !== null) {
      return list.slice().sort((a, b) => {
        const aVal = (a.assignedPvtId || '').toLowerCase();
        const bVal = (b.assignedPvtId || '').toLowerCase();
        const target = pvtValue.toLowerCase();
        const aMatch = aVal === target ? 1 : 0;
        const bMatch = bVal === target ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        const aName = (a.assignedPvtName || '').toLowerCase();
        const bName = (b.assignedPvtName || '').toLowerCase();
        return isDesc ? bName.localeCompare(aName, 'vi') : aName.localeCompare(bName, 'vi');
      });
    }

    if (sortMode === 'sort_status_priority') {
      const order: Record<string, number> = {
        QUA_HAN: 1,
        SAP_DEN_HAN: 2,
        DANG_XU_LY: 3,
        HOAN_THANH: 4,
      };
      return list.slice().sort((a, b) => {
        const sa = resolveDispatchStatus(a);
        const sb = resolveDispatchStatus(b);
        return (order[sa] || 99) - (order[sb] || 99);
      });
    }

    if (sortMode === 'sort_status_overdue_first') {
      return list.slice().sort((a, b) => {
        const sa = resolveDispatchStatus(a);
        const sb = resolveDispatchStatus(b);
        if (sa === 'QUA_HAN' && sb !== 'QUA_HAN') return -1;
        if (sb === 'QUA_HAN' && sa !== 'QUA_HAN') return 1;
        return 0;
      });
    }

    if (sortMode === 'sort_status_completed_last') {
      return list.slice().sort((a, b) => {
        const sa = resolveDispatchStatus(a);
        const sb = resolveDispatchStatus(b);
        if (sa === 'HOAN_THANH' && sb !== 'HOAN_THANH') return 1;
        if (sb === 'HOAN_THANH' && sa !== 'HOAN_THANH') return -1;
        return 0;
      });
    }

    if (sortMode === 'oldest') {
      return list.slice().sort((a, b) => {
        const da = new Date(a.ngayGui || a.ngayPhatHanh || 0).getTime();
        const db = new Date(b.ngayGui || b.ngayPhatHanh || 0).getTime();
        return da - db;
      });
    }

    return list.slice().sort((a, b) => {
      const da = new Date(a.ngayGui || a.ngayPhatHanh || 0).getTime();
      const db = new Date(b.ngayGui || b.ngayPhatHanh || 0).getTime();
      return db - da;
    });
  }, [dispatches, filters, pvtList]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filters]);

  // ============================================
  // SELECTION HANDLERS
  // ============================================
  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev =>
      prev.length === filteredDispatches.length
        ? []
        : filteredDispatches.map(d => d.id)
    );
  };

  const selectedDispatches = useMemo(
    () => dispatches.filter(d => selectedIds.includes(d.id)),
    [dispatches, selectedIds]
  );

  const completableSelected = useMemo(
    () => selectedDispatches.filter(d => d.trangThai !== 'HOAN_THANH'),
    [selectedDispatches]
  );

  const canBulkComplete = completableSelected.length > 0;

  // ============================================
  // BULK ACTIONS
  // ============================================
  const handleBulkComplete = async () => {
    if (!canBulkComplete) return;
    const ids = completableSelected.map(d => d.id);
    const confirmed = window.confirm(
      `Xác nhận đánh dấu HOÀN THÀNH ${ids.length} công văn?`
    );
    if (!confirmed) return;

    let ok = 0;
    for (const id of ids) {
      try {
        const res = await apiClient.markComplete(id);
        if (res?.success) ok++;
      } catch (err) {
        console.error('Lỗi hoàn thành:', id, err);
      }
    }
    showToast(`Đã hoàn thành ${ok}/${ids.length} công văn`, 'success');
    setSelectedIds([]);
    reload();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(
      `Xác nhận XÓA ${selectedIds.length} công văn? Hành động không thể hoàn tác.`
    );
    if (!confirmed) return;

    let ok = 0;
    for (const id of selectedIds) {
      try {
        const success = await apiClient.deleteDispatch(id);
        if (success) ok++;
      } catch (err) {
        console.error('Lỗi xóa:', id, err);
      }
    }
    showToast(`Đã xóa ${ok}/${selectedIds.length} công văn`, 'success');
    setSelectedIds([]);
    reload();
  };

  const handleEditSingle = () => {
    if (selectedIds.length !== 1) return;
    const target = dispatches.find(d => d.id === selectedIds[0]);
    if (!target) return;
    setDispatchToEdit(target);
    setIsAddEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsAddEditModalOpen(false);
    setSelectedIds([]);
    reload();
  };

  // ============================================
  // VIEW FILE TRỰC TIẾP
  // ============================================
  const handleViewFiles = async (d: Dispatch) => {
    try {
      const items = await apiClient.getAttachments(d.id);
      if (!items || items.length === 0) {
        showToast('Không có file đính kèm', 'info');
        return;
      }
      const first = items[0];
      await apiClient.downloadAttachment(first.id);
    } catch (err: any) {
      console.error('Lỗi xem file:', err);
      showToast(err?.message || 'Không mở được file', 'error');
    }
  };

  // ⭐ Handler mở detail — phân loại chuyên đề vs công văn
  const handleOpenDetail = (d: Dispatch) => {
    if (isChuyenDe(d)) {
      setChuyenDeDetail(d);
    } else {
      setDetailDispatch(d);
    }
  };

  // ⭐ Handler sửa — phân loại chuyên đề vs công văn
  const handleEditItem = (d: Dispatch) => {
    if (isChuyenDe(d)) {
      setChuyenDeToEdit(d);
      setIsChuyenDeModalOpen(true);
    } else {
      setDispatchToEdit(d);
      setIsAddEditModalOpen(true);
    }
  };

  // ⭐ Handler xóa — phân loại chuyên đề vs công văn
  const handleDeleteItem = async (d: Dispatch) => {
    const isCD = isChuyenDe(d);
    const label = isCD ? 'chuyên đề' : 'công văn';
    const confirmed = window.confirm(
      `Xác nhận xóa ${label} "${d.soCongVan}"?\n\nHành động này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      const ok = await apiClient.deleteDispatch(d.id);
      if (ok) {
        showToast(`Đã xóa ${label} ${d.soCongVan}`, 'success');
        if (detailDispatch?.id === d.id) setDetailDispatch(null);
        if (chuyenDeDetail?.id === d.id) setChuyenDeDetail(null);
        reload();
      } else {
        showToast(`Không thể xóa ${label}`, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi', 'error');
    }
  };

  const handleHardDeleteChuyenDe = async (chuyenDe: Dispatch) => {
    try {
      const ok = await apiClient.hardDeleteDispatch(chuyenDe.id);

      if (ok) {
        showToast(
          `🗑️ Đã xóa vĩnh viễn chuyên đề "${chuyenDe.soCongVan}"`,
          'success'
        );

        if (chuyenDeDetail?.id === chuyenDe.id) setChuyenDeDetail(null);
        if (chuyenDeToEdit?.id === chuyenDe.id) setChuyenDeToEdit(null);
        setIsChuyenDeModalOpen(false);

        reload();
      } else {
        showToast('Không thể xóa chuyên đề', 'error');
        throw new Error('Không thể xóa chuyên đề');
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi xóa chuyên đề', 'error');
      throw err;
    }
  };

  // ⭐ Đếm số chuyên đề trong kết quả
  const chuyenDeCount = useMemo(
    () => filteredDispatches.filter(d => isChuyenDe(d)).length,
    [filteredDispatches]
  );

  // ⭐ Check xem có đang ở tab bảng không (để hiện FAB)
  const isTableTab =
    activeSidebarTab === 'action-all' ||
    activeSidebarTab === 'action-assigned' ||
    activeSidebarTab === 'action-pending' ||
    activeSidebarTab === 'action-approve';

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5 pb-24 sm:pb-5">
        {/* ⭐ Mobile sticky toolbar */}
        <div className="lg:hidden sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2 bg-slate-100/95 backdrop-blur-md border-b border-slate-200 mb-3 flex items-center gap-2">



        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <VtSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            pendingCount={pendingCount}
            approveCount={approveCount}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-5">

            {/* TAB: BÁO CÁO — TỔNG QUAN */}
            {activeSidebarTab === 'report-overview' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <VtKpiGrid
                  summary={summary}
                  onCardClick={key => {
                    if (key === 'overdue') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'QUA_HAN' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'due-soon') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'SAP_DEN_HAN' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'completed') {
                      setFilters({ ...DEFAULT_VT_FILTERS, status: 'HOAN_THANH' });
                      setActiveSidebarTab('action-all');
                    } else if (key === 'assigned') {
                      setActiveSidebarTab('action-assigned');
                    } else if (key === 'total') {
                      setActiveSidebarTab('action-all');
                    }
                  }}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtTrendChart data={trendData} />
                  <VtTopPvtChart pvtStats={pvtStats} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtPvtLeaderboard
                    pvtStats={pvtStats}
                    onSelectPvt={pvt => setPvtDetailStat(pvt)}
                  />
                  <VtDeptHeatmap heatmapData={heatmapData} tpStats={tpStats} />
                </div>
                <VtDeptChart tpStats={tpStats} />
              </>
            )}

            {/* TAB: BÁO CÁO — THEO PHÒNG BAN */}
            {activeSidebarTab === 'report-by-dept' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtDeptHeatmap heatmapData={heatmapData} tpStats={tpStats} />
                  <VtDeptChart tpStats={tpStats} />
                </div>
              </>
            )}

            {/* TAB: BÁO CÁO — THEO THỜI GIAN */}
            {activeSidebarTab === 'report-by-time' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <VtTrendChart data={trendData} />
              </>
            )}

            {/* TAB: BÁO CÁO — XẾP HẠNG PVT */}
            {activeSidebarTab === 'report-leaderboard' && (
              <>
                <VtHeroHeader
                  userName={currentUser?.fullName || 'Viện trưởng'}
                  summary={summary}
                  onRefresh={reload}
                  isLoading={isLoading}
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <VtPvtLeaderboard
                    pvtStats={pvtStats}
                    onSelectPvt={pvt => setPvtDetailStat(pvt)}
                  />
                  <VtTopPvtChart pvtStats={pvtStats} />
                </div>
              </>
            )}

            {/* TAB: THAO TÁC — BẢNG CÔNG VĂN */}
            {isTableTab && (
              <>
                {/* Header — responsive: desktop có 3 nút, mobile chỉ title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl px-4 sm:px-5 py-3 sm:py-4 border border-slate-200 shadow-xs">
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {activeSidebarTab === 'action-all' && 'Tất cả công văn'}
                      {activeSidebarTab === 'action-assigned' && 'Đã phân công'}
                      {activeSidebarTab === 'action-pending' && 'Chờ phân công PVT'}
                      {activeSidebarTab === 'action-approve' && 'Chờ phê duyệt'}
                    </h1>
                    <span className="shrink-0 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {filteredDispatches.length}
                    </span>
                  </div>

                  {/* Actions — chỉ hiện từ sm */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => exportDispatchesToExcel(filteredDispatches, DEFAULT_COLUMNS)}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất Excel
                    </button>

                    <button
                      onClick={() => {
                        setChuyenDeToEdit(null);
                        setIsChuyenDeModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tạo chuyên đề
                    </button>

                    <button
                      onClick={() => { setDispatchToEdit(null); setIsAddEditModalOpen(true); }}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white rounded-lg shadow-sm hover:shadow transition cursor-pointer active:scale-95"
                      style={{ backgroundColor: '#B71C1C' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tạo công văn
                    </button>
                  </div>
                </div>

                {/* Filter */}
                <VtFilterBar
                  filters={filters}
                  onChange={setFilters}
                  pvtList={pvtList}
                  deptList={deptList}
                  totalResults={filteredDispatches.length}
                  chuyenDeCount={chuyenDeCount}
                  dispatches={dispatches}
                />

                {/* ⭐ BẢNG / CARD LIST — responsive */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Desktop / Tablet: table */}
                  <div className="hidden md:block">
                    <PublicDesktopTable
                      dispatches={filteredDispatches}
                      currentPage={1}
                      pageSize={filteredDispatches.length || 20}
                      selectedPvtId={null}
                      onSelectDispatch={handleOpenDetail}
                      onViewFiles={handleViewFiles}
                    />
                  </div>

                  {/* Mobile: card list */}
                  <div className="md:hidden">
                    <PublicMobileCardList
                      dispatches={filteredDispatches}
                      onSelectDispatch={handleOpenDetail}
                      onViewFiles={handleViewFiles}
                    />
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </main>

      {/* ⭐ FAB cho mobile — chỉ hiện ở tab bảng */}
      {isTableTab && (
        <MobileFab
          onCreateCongVan={() => {
            setDispatchToEdit(null);
            setIsAddEditModalOpen(true);
          }}
          onCreateChuyenDe={() => {
            setChuyenDeToEdit(null);
            setIsChuyenDeModalOpen(true);
          }}
          onExport={() => exportDispatchesToExcel(filteredDispatches, DEFAULT_COLUMNS)}
        />
      )}

      {/* Modal giao TP trực tiếp */}
      <AssignTpModal
        isOpen={isAssignTpDirectOpen}
        onClose={() => setIsAssignTpDirectOpen(false)}
        dispatch={dispatchToAssign}
        tpList={allUsers.filter(u => u.role === 'TRUONG_PHONG')}
        currentPvt={null}
        onAssign={async data => {
          if (!dispatchToAssign) return;
          try {
            const res = await apiClient.assignToTps(dispatchToAssign.id, {
              tps: [{
                tpId: data.tpId,
                tpName: data.tpName,
                roomCode: allUsers.find(u => u.id === data.tpId)?.roomCode || '',
                isPrimary: true,
              }],
              pvtChiDao: data.pvtChiDao || undefined,
              hanBaoCaoXuLy: data.hanBaoCaoXuLy || undefined,
            });
            if (res) {
              showToast(`Đã giao trực tiếp cho ${data.tpName}`);
              setIsAssignTpDirectOpen(false);
              setDispatchToAssign(null);
              reload();
            } else {
              showToast('Không thể giao TP', 'error');
            }
          } catch (err: any) {
            showToast(err.message || 'Lỗi', 'error');
          }
        }}
      />

      <AssignPvtModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        dispatch={dispatchToAssign}
        pvtList={pvtList}
        onAssign={async data => {
          if (!dispatchToAssign) return;
          const targetPvt = pvtList.find(p => p.id === data.pvtId);
          const updated = await apiClient.assignToPvts(dispatchToAssign.id, {
            pvts: [{
              pvtId: data.pvtId,
              pvtName: data.pvtName,
              roomCode: targetPvt?.roomCode || '',
              isPrimary: true,
            }],
            vtChiDao: data.vtChiDao,
            hanBaoCaoXuLy: data.hanBaoCaoXuLy,
            mucDoKhan: data.mucDoKhan,
          });
          if (updated) {
            showToast(`Đã giao công văn ${updated.soCongVan} cho ${data.pvtName}`);
            reload();
          }
        }}
      />

      <DispatchModal
        isOpen={isAddEditModalOpen}
        onClose={handleCloseEditModal}
        dispatchToEdit={dispatchToEdit}
        columns={DEFAULT_COLUMNS}
        onSave={async (formData: any) => {
          try {
            const { __attachments, __assignPvt, __assignTp, ...dispatchData } = formData;

            if (dispatchToEdit) {
              const updated = await apiClient.updateDispatch(dispatchToEdit.id, dispatchData);
              if (updated) {
                if (__assignPvt) {
                  try {
                    await apiClient.assignToPvts(dispatchToEdit.id, { pvts: [__assignPvt] });
                  } catch (err) {
                    console.error('Lỗi cập nhật PVT:', err);
                  }
                }
                if (__assignTp) {
                  try {
                    await apiClient.assignToTps(dispatchToEdit.id, { tps: [__assignTp] });
                  } catch (err) {
                    console.error('Lỗi cập nhật TP:', err);
                  }
                }
                showToast('Đã cập nhật công việc');
              } else {
                showToast('Lỗi cập nhật', 'error');
              }
            } else {
              const created = await apiClient.createDispatch(dispatchData);
              if (!created) {
                showToast('Lỗi tạo công việc', 'error');
                return;
              }

              if (__assignPvt) {
                try {
                  await apiClient.assignToPvts(created.id, { pvts: [__assignPvt] });
                } catch (err) {
                  console.error('Lỗi phân công PVT:', err);
                }
              }

              if (__assignTp) {
                try {
                  await apiClient.assignToTps(created.id, { tps: [__assignTp] });
                } catch (err) {
                  console.error('Lỗi phân công TP:', err);
                }
              }

              const fileList = (__attachments || []) as any[];
              if (fileList.length > 0) {
                let uploadedCount = 0;
                for (const fileItem of fileList) {
                  if (fileItem.file instanceof File) {
                    const res = await apiClient.uploadAttachment(
                      created.id,
                      fileItem.file,
                      fileItem.fileCategory || 'ORIGINAL'
                    );
                    if (res.success) uploadedCount++;
                  }
                }
                if (uploadedCount > 0) {
                  showToast(`Đã tạo công việc và upload ${uploadedCount} file`, 'success');
                } else {
                  showToast('Đã tạo công việc mới', 'success');
                }
              } else {
                showToast('Đã tạo công việc mới', 'success');
              }
            }
          } catch (err: any) {
            showToast(err.message || 'Lỗi', 'error');
            throw err;
          }
        }}
      />

      {/* Drawer công văn thường */}
      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        canEdit={true}
        onUpdate={async (id, updates) => {
          await apiClient.updateDispatch(id, updates);
          reload();
        }}
        onMarkComplete={async (d) => {
          const res = await apiClient.markComplete(d.id);
          if (!res?.success) throw new Error(res?.message || 'Lỗi');
          setDetailDispatch(prev => prev ? { ...prev, trangThai: 'HOAN_THANH', tienDo: 100 } : prev);
          reload();
        }}
        onDelete={async (d) => {
          const ok = await apiClient.deleteDispatch(d.id);
          if (!ok) throw new Error('Không thể xoá công văn');
          setDetailDispatch(null);
          reload();
        }}
      />

      <VtPvtDetailDrawer
        pvtStat={pvtDetailStat}
        allDispatches={dispatches}
        onClose={() => setPvtDetailStat(null)}
        onViewDispatch={d => {
          setPvtDetailStat(null);
          handleOpenDetail(d);
        }}
      />

      {/* ⭐ Toast — mobile căn giữa, desktop bottom-right */}
      {toast && (
        <div className="fixed z-[100] bottom-20 left-1/2 -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 px-4 w-[calc(100%-2rem)] sm:w-auto max-w-sm">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : toast.type === 'error'
                  ? 'bg-rose-900 text-white border-rose-700'
                  : 'bg-amber-900 text-white border-amber-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ⭐ MODAL CHUYÊN ĐỀ */}
      <ChuyenDeModal
        isOpen={isChuyenDeModalOpen}
        onClose={() => {
          setIsChuyenDeModalOpen(false);
          setChuyenDeToEdit(null);
        }}
        chuyenDeToEdit={chuyenDeToEdit}
        onSaved={() => {
          reload();
        }}
        onDelete={handleHardDeleteChuyenDe}
        onSave={async (formData: any) => {
          try {
            const { __attachments, __assignPvt, __assignTp, ...dispatchData } = formData;
            let createdId = chuyenDeToEdit?.id;

            if (chuyenDeToEdit) {
              const updated = await apiClient.updateDispatch(chuyenDeToEdit.id, dispatchData);
              if (!updated) {
                showToast('Lỗi cập nhật chuyên đề', 'error');
                return false;
              }
            } else {
              const created = await apiClient.createDispatch(dispatchData);
              if (!created) {
                showToast('Lỗi tạo chuyên đề', 'error');
                return false;
              }
              createdId = created.id;

              if (Array.isArray(__attachments) && __attachments.length > 0) {
                for (const item of __attachments) {
                  if (item?.file instanceof File) {
                    await apiClient.uploadAttachment(
                      created.id,
                      item.file,
                      item.fileCategory || 'ORIGINAL'
                    );
                  }
                }
              }
            }

            if (__assignPvt && createdId) {
              try {
                await apiClient.assignToPvts(createdId, { pvts: [__assignPvt] });
              } catch (err) {
                console.error('Lỗi phân công PVT:', err);
              }
            }

            if (__assignTp && createdId) {
              try {
                await apiClient.assignToTps(createdId, { tps: [__assignTp] });
              } catch (err) {
                console.error('Lỗi phân công TP:', err);
              }
            }

            showToast(
              chuyenDeToEdit ? 'Đã cập nhật chuyên đề' : 'Đã tạo chuyên đề mới',
              'success'
            );
            return true;
          } catch (err: any) {
            showToast(err?.message || 'Lỗi lưu chuyên đề', 'error');
            return false;
          }
        }}
      />

      {/* DRAWER CHI TIẾT CHUYÊN ĐỀ */}
      <ChuyenDeDrawer
        chuyenDe={chuyenDeDetail}
        onClose={() => setChuyenDeDetail(null)}
        canEdit={true}
        onUpdate={async (id, updates) => {
          await apiClient.updateDispatch(id, updates);
          reload();
        }}
      />
    </div>
  );
};

export default VienTruongDashboard;