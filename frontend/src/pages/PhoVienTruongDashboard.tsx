import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../hooks/useDialog';
import { Header } from '../components/Header';
import { AssignTpModal } from '../components/AssignTpModal';
import { SubmitVtModal } from '../components/SubmitVtModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { PvtDashboardHome } from '../components/pvt/PvtDashboardHome';
import { PvtAssignedDispatches } from '../components/pvt/PvtAssignedDispatches';
import { PvtAssignTpView } from '../components/pvt/PvtAssignTpView';
import { PvtPendingVtView } from '../components/pvt/pvtPendingVtView';
import { PvtRoomsDispatchesView } from '../components/pvt/PvtRoomsDispatchesView';
import { PvtStatsView } from '../components/pvt/pvtStatsView';
import { PvtNotificationsView } from '../components/pvt/pvtNotificationsView';
import { PvtSidebar, PvtSidebarTab } from '../components/pvt/PvtSidebar';
import { PvtHeroHeader } from '../components/pvt/PvtHeroHeader';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { User } from '../types/auth';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import {
  LayoutDashboard,
  FileText,
  CornerDownRight,
  Send,
  Building2,
  BarChart3,
  Bell,
  CheckCircle2,
  RefreshCw,
  Download,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export type PvtTabKey =
  | 'dashboard'
  | 'cv-duoc-giao'
  | 'giao-tp'
  | 'cho-trinh-vt'
  | 'cv-cua-phong'
  | 'thong-ke'
  | 'thong-bao';

export const PhoVienTruongDashboard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { allUsers, currentUser } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();

  // Active navigation tab
  const [activeSidebarTab, setActiveSidebarTab] = useState<PvtSidebarTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Determine which PVT is being viewed (defaults to PVT1)
  const pvtUser = useMemo(() => {
    if (id) {
      const cleanId = id.toLowerCase().replace('pvt', '');
      const num = parseInt(cleanId, 10);
      if (!isNaN(num)) {
        return allUsers.find(u => u.roomCode === `PVT${num}` || u.username === `pvt${num}`);
      }
      return allUsers.find(u => u.id === id || u.username === id || u.roomCode === id);
    }
    if (currentUser?.role === 'PHO_VIEN_TRUONG') {
      return currentUser;
    }
    // Default fallback to PVT 1
    return allUsers.find(u => u.roomCode === 'PVT1');
  }, [id, allUsers, currentUser]);

  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [allSystemDispatches, setAllSystemDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAssignTpModalOpen, setIsAssignTpModalOpen] = useState(false);
  const [dispatchToAssign, setDispatchToAssign] = useState<Dispatch | null>(null);
  const [isSubmitVtModalOpen, setIsSubmitVtModalOpen] = useState(false);
  const [dispatchToSubmitVt, setDispatchToSubmitVt] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Subordinate departments (Phòng phụ trách)
  // For PVT1: explicitly includes TP1 and TP2
  const subordinateRooms = useMemo(() => {
    if (!pvtUser) return [];
    const subs = allUsers.filter(u =>
      u.role === 'TRUONG_PHONG' &&
      (u.pvtManagerId === pvtUser.id || u.pvtManagerId === pvtUser.roomCode)
    );
    // If this is PVT1 and list is empty or needs fallback, ensure TP1 and TP2 are present
    if (pvtUser.roomCode === 'PVT1' && subs.length === 0) {
      return allUsers.filter(u => u.roomCode === 'TP1' || u.roomCode === 'TP2');
    }
    return subs;
  }, [pvtUser, allUsers]);

  const allTpUsers = useMemo(() => {
    return allUsers.filter(u => u.role === 'TRUONG_PHONG');
  }, [allUsers]);

  // Load dispatches for this PVT
  const loadDispatches = async () => {
    if (!pvtUser) return;
    setIsLoading(true);
    try {
      // 1. Fetch PVT's dispatches from VT
      const pvtList = await apiClient.getDispatches({
        assignedPvtId: pvtUser.id,
        limit: 500
      });
      setDispatches(pvtList);

      // 2. Fetch all dispatches to get subordinate department dispatches
      const allList = await apiClient.getDispatches({});
      setAllSystemDispatches(allList);
    } catch (err) {
      console.error('Lỗi khi tải công văn của PVT:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [pvtUser]);

  // 1. CÔNG VĂN ĐƯỢC VT GIAO
  // All dispatches where assignedPvt matches this PVT
  const dispatchesFromVt = useMemo(() => {
    return dispatches.filter(d =>
      d.assignedPvtId === pvtUser?.id ||
      d.assignedPvtName === pvtUser?.fullName ||
      (pvtUser?.roomCode && d.assignedPvtName?.includes(pvtUser.roomCode))
    );
  }, [dispatches, pvtUser]);

  // 2. CHỜ TÔI TRÌNH VT
  // Dispatches with status CHO_TRINH_VT or submitted by subordinate rooms waiting for PVT approval
  const pendingSubmitVtDispatches = useMemo(() => {
    const subCodes = subordinateRooms.map(r => r.roomCode);
    const subIds = subordinateRooms.map(r => r.id);

    return allSystemDispatches.filter(d => {
      const isStatusPending = d.trangThai === 'CHO_TRINH_VT' || d.customFields?.trinhVtStatus === 'CHO_TRINH';
      const isPvtMatch = d.assignedPvtId === pvtUser?.id || (pvtUser?.roomCode && d.assignedPvtName?.includes(pvtUser.roomCode));
      const isTpMatch = (d.assignedTpId && subIds.includes(d.assignedTpId)) ||
        (d.assignedTpName && subCodes.some(c => d.assignedTpName?.includes(c)));
      return isStatusPending && (isPvtMatch || isTpMatch);
    });
  }, [allSystemDispatches, subordinateRooms, pvtUser]);

  // Handlers
  const handleOpenAssignTp = (disp: Dispatch) => {
    setDispatchToAssign(disp);
    setIsAssignTpModalOpen(true);
  };
  const handleSaveAssignTp = async (data: any) => {
    if (!dispatchToAssign) return;

    // Tìm roomCode của TP
    const targetTp = allTpUsers.find(u =>
      u.id === data.tpId || u.roomCode === data.tpId
    );

    const updated = await apiClient.assignToTps(dispatchToAssign.id, {
      tps: [{
        tpId: data.tpId,
        tpName: data.tpName,
        roomCode: targetTp?.roomCode || data.roomCode || '',
        isPrimary: true
      }],
      pvtChiDao: data.pvtChiDao,
      hanBaoCaoXuLy: data.hanBaoCaoXuLy
    });
    if (updated) {
      showToast(`Đã giao công văn số ${updated.soCongVan} cho ${data.tpName}`);
      loadDispatches();
    }
  };

  const handleOpenSubmitVt = (disp: Dispatch) => {
    setDispatchToSubmitVt(disp);
    setIsSubmitVtModalOpen(true);
  };

  const handleSubmitVt = async (dispatchId: string, yKienTrinhVt: string) => {
    const updated = await apiClient.pvtSubmit(dispatchId, {
      pvtChiDao: yKienTrinhVt
    });
    if (updated) {
      showToast(`Đã ký duyệt và trình Viện Trưởng công văn số ${updated.soCongVan}!`, 'success');
      loadDispatches();
    }
  };



  const handleReturnTp = async (dispatchId: string, lyDoTraLai: string) => {
    const updated = await apiClient.pvtDisagree(dispatchId, lyDoTraLai);
    if (updated) {
      showToast(`Đã trả lại hồ sơ công văn số ${updated.soCongVan} cho cấp phòng!`, 'info');
      loadDispatches();
    }
  };

  // Summary cho Hero Header
  const heroSummary = useMemo(() => {
    const total = dispatches.length;
    const hoanThanh = dispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const quaHan = dispatches.filter(d => {
      if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
      return new Date(d.hanBaoCaoXuLy) < new Date();
    }).length;
    const choTrinhVt = dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    const choGiaoTp = dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH').length;
    return { total, hoanThanh, quaHan, choTrinhVt, choGiaoTp };
  }, [dispatches]);

  // KPI counts cho sidebar
  const sidebarCounts = useMemo(() => {
    return {
      pendingTp: dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH').length,
      assignedTp: dispatches.filter(d => !!d.assignedTpId).length,
      waitingVt: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length,
      notifications: 0,   // TODO: nối với useNotifications sau
    };
  }, [dispatches]);

  // Helper: lấy danh sách theo tab
  const getTabData = (): { title: string; items: Dispatch[]; emptyMessage: string } => {
    switch (activeSidebarTab) {
      case 'action-pending-tp':
        return {
          title: 'Chờ giao Trưởng phòng',
          items: dispatches.filter(d => !d.assignedTpId && d.trangThai !== 'HOAN_THANH'),
          emptyMessage: 'Tất cả công văn đã được giao cho phòng',
        };
      case 'action-assigned-tp':
        return {
          title: 'Đã giao Trưởng phòng',
          items: dispatches.filter(d => !!d.assignedTpId),
          emptyMessage: 'Chưa có công văn nào được giao TP',
        };
      case 'action-waiting-vt':
        return {
          title: 'Hồ sơ chờ trình Viện trưởng',
          items: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET'),
          emptyMessage: 'Không có hồ sơ nào chờ trình',
        };
      default:
        return {
          title: 'Tất cả công văn',
          items: dispatches,
          emptyMessage: 'Chưa có công văn nào',
        };
    }
  };

  const tabData = getTabData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Mobile toggle */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
          >
            {isMobileSidebarOpen ? '✕ Đóng menu' : '☰ Mở menu'}
          </button>
        </div>

        {/* Layout 2 cột */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Sidebar */}
          <PvtSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            roomCode={pvtUser?.roomCode}
            userName={pvtUser?.fullName}
            counts={sidebarCounts}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* Hero Header — luôn hiển thị */}
            <PvtHeroHeader
              userName={pvtUser?.fullName || 'Phó Viện trưởng'}
              roomCode={pvtUser?.roomCode}
              summary={heroSummary}
              onRefresh={loadDispatches}
              isLoading={isLoading}
            />

            {/* Tab: Dashboard — dùng component cũ */}
            {activeSidebarTab === 'dashboard' && (
              <PvtDashboardHome
                pvtUser={pvtUser || null}
                dispatchesFromVt={dispatchesFromVt}
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as PvtSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo tổng quan */}
            {activeSidebarTab === 'report-overview' && (
              <PvtDashboardHome
                pvtUser={pvtUser || null}
                dispatchesFromVt={dispatchesFromVt}
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as PvtSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo theo thời gian */}
            {activeSidebarTab === 'report-by-time' && (
              <PvtAssignedDispatches
                dispatches={dispatchesFromVt}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Xếp hạng PVT */}
            {activeSidebarTab === 'report-leaderboard' && (
              <PvtStatsView
                subordinateRooms={subordinateRooms}
                allDispatches={allSystemDispatches}
              />
            )}

            {/* Tab: Tất cả công văn */}
            {activeSidebarTab === 'action-all' && (
              <PvtAssignedDispatches
                dispatches={dispatchesFromVt}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Chờ giao TP */}
            {activeSidebarTab === 'action-pending-tp' && (
              <PvtAssignTpView
                dispatches={tabData.items}
                subordinateRooms={subordinateRooms}
                allTpUsers={allTpUsers}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Đã giao TP */}
            {activeSidebarTab === 'action-assigned-tp' && (
              <PvtAssignTpView
                dispatches={tabData.items}
                subordinateRooms={subordinateRooms}
                allTpUsers={allTpUsers}
                onOpenAssignTp={handleOpenAssignTp}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Chờ trình VT */}
            {activeSidebarTab === 'action-waiting-vt' && (
              <PvtPendingVtView
                dispatches={pendingSubmitVtDispatches}
                onOpenSubmitVt={handleOpenSubmitVt}
                onOpenDetail={setDetailDispatch}
                onRefresh={loadDispatches}
                isLoading={isLoading}
              />
            )}

            {/* Tab: Thông báo */}
            {activeSidebarTab === 'action-notifications' && (
              <PvtNotificationsView
                pendingSubmitVtDispatches={pendingSubmitVtDispatches}
                dispatchesFromVt={dispatchesFromVt}
                onOpenDetail={setDetailDispatch}
                onOpenSubmitVt={handleOpenSubmitVt}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AssignTpModal
        isOpen={isAssignTpModalOpen}
        onClose={() => setIsAssignTpModalOpen(false)}
        dispatch={dispatchToAssign}
        tpList={allTpUsers}
        currentPvt={pvtUser || null}
        onAssign={handleSaveAssignTp}
      />

      <SubmitVtModal
        isOpen={isSubmitVtModalOpen}
        onClose={() => setIsSubmitVtModalOpen(false)}
        dispatch={dispatchToSubmitVt}
        onSubmitVt={handleSubmitVt}
        onReturnTp={handleReturnTp}
      />

      <DispatchDetailDrawer
        dispatch={detailDispatch}
        onClose={() => setDetailDispatch(null)}
        columns={DEFAULT_COLUMNS}
        onUpdate={(id, updates) => {
          apiClient.updateDispatch(id, updates);
          loadDispatches();
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-amber-900 text-white border-amber-700'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoVienTruongDashboard;
