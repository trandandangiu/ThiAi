// src/pages/TruongPhongDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../hooks/useDialog';
import { Header } from '../components/Header';
import { ReportProgressModal } from '../components/ReportProgressModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { apiClient } from '../services/apiClient';
import { Dispatch, DispatchStatus } from '../types/dispatch';
import { DEFAULT_COLUMNS } from '../constants/columns';
import { exportDispatchesToExcel } from '../services/excelService';
import { TpSidebar, TpSidebarTab } from '../components/tp/TpSidebar';
import { TpHeroHeader } from '../components/tp/TpHeroHeader';
import { TpDashboardHome } from '../components/tp/TpDashboardHome';
import { TpDispatchesList } from '../components/tp/TpDispatchesList';
import { CheckCircle2, Download } from 'lucide-react';

export const TruongPhongDashboard: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { allUsers, currentUser } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();

  // Determine current department/TP user
  const tpUser = useMemo(() => {
    if (id) {
      const cleanId = id.toLowerCase().replace('tp', '');
      const num = parseInt(cleanId, 10);
      if (!isNaN(num)) {
        return allUsers.find(u => u.roomCode === `TP${num}` || u.username === `tp${num}`);
      }
      return allUsers.find(u => u.id === id || u.username === id || u.roomCode === id);
    }
    if (currentUser?.role === 'TRUONG_PHONG') {
      return currentUser;
    }
    return allUsers.find(u => u.roomCode === 'TP1');
  }, [id, allUsers, currentUser]);

  // Find PVT managing this room
  const managingPvt = useMemo(() => {
    if (!tpUser || !tpUser.pvtManagerId) return null;
    return allUsers.find(u => u.id === tpUser.pvtManagerId || u.roomCode === tpUser.pvtManagerId);
  }, [tpUser, allUsers]);

  // Sidebar tab
  const [activeSidebarTab, setActiveSidebarTab] = useState<TpSidebarTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Data
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [dispatchToReport, setDispatchToReport] = useState<Dispatch | null>(null);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load dispatches
  const loadDispatches = async () => {
    if (!tpUser) return;
    setIsLoading(true);
    try {
      const list = await apiClient.getDispatches({
        assignedTpId: tpUser.id,
        limit: 500,
      });
      setDispatches(list);
    } catch (err) {
      console.error('Lỗi tải công văn:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, [tpUser]);
  // Summary cho Hero Header
  const heroSummary = useMemo(() => {
    const total = dispatches.length;
    const hoanThanh = dispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
    const quaHan = dispatches.filter(d => {
      if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
      return new Date(d.hanBaoCaoXuLy) < new Date();
    }).length;
    const choXuLy = dispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO').length;
    const dangXuLy = dispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    return { total, hoanThanh, quaHan, choXuLy, dangXuLy };
  }, [dispatches]);

  // KPI counts for sidebar badges
  const counts = useMemo(() => {
    const pending = dispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO').length;
    const processing = dispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
    const reported = dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET' || d.trangThai === 'CHO_VT_DUYET').length;
    const waitingPvt = dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET').length;
    return { pending, processing, reported, waitingPvt };
  }, [dispatches]);

  // Handlers
  const handleOpenReport = (d: Dispatch) => {
    setDispatchToReport(d);
    setIsReportModalOpen(true);
  };

  const handleSaveReport = async (data: any) => {
    if (!dispatchToReport) return;
    try {
      // 1. Gửi báo cáo (tpSubmit)
      const updated = await apiClient.tpSubmit(dispatchToReport.id, {
        baoCaoTienDo: data.baoCaoTienDo || data.content || '',
        tienDo: data.tienDo || data.progressPct || 0,
      });

      if (!updated) {
        showToast('Lỗi gửi báo cáo', 'error');
        return;
      }

      // 2. Upload file đính kèm (nếu có)
      const files = (data.__attachments || []) as any[];
      let uploadedCount = 0;
      for (const f of files) {
        if (f.file instanceof File) {
          const res = await apiClient.uploadAttachment(
            dispatchToReport.id,
            f.file,
            'REPORT'
          );
          if (res.success) uploadedCount++;
        }
      }

      showToast(
        uploadedCount > 0
          ? `Đã gửi báo cáo + ${uploadedCount} file`
          : 'Đã gửi báo cáo lên PVT',
        'success'
      );
      setIsReportModalOpen(false);
      loadDispatches();
    } catch (err: any) {
      showToast(err.message || 'Lỗi', 'error');
    }
  };

  const handleMarkComplete = async (d: Dispatch) => {
    const confirmed = await dialog.confirm({
      title: 'Đánh dấu hoàn thành',
      message: `Xác nhận hoàn thành công văn "${d.soCongVan}"?\n\nDùng khi đã xử lý xong ngoài hệ thống.`,
      confirmText: 'Hoàn thành',
      cancelText: 'Hủy',
      variant: 'success',
    });
    if (!confirmed) return;

    const res = await apiClient.markComplete(d.id);
    if (res.success) {
      showToast('Đã đánh dấu hoàn thành', 'success');
      loadDispatches();
    } else {
      showToast(res.message || 'Lỗi', 'error');
    }
  };

  // Filter dispatches by tab
  const getTabDispatches = (): { title: string; items: Dispatch[]; emptyMessage: string } => {
    switch (activeSidebarTab) {
      case 'action-pending':
        return {
          title: 'Chờ xử lý',
          items: dispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO'),
          emptyMessage: 'Không có công văn nào chờ xử lý',
        };
      case 'action-processing':
        return {
          title: 'Đang xử lý',
          items: dispatches.filter(d => d.trangThai === 'DANG_XU_LY'),
          emptyMessage: 'Không có công văn nào đang xử lý',
        };
      case 'action-reported':
        return {
          title: 'Đã báo cáo',
          items: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET' || d.trangThai === 'CHO_VT_DUYET' || d.trangThai === 'HOAN_THANH'),
          emptyMessage: 'Chưa có công văn nào được báo cáo',
        };
      case 'action-waiting-pvt':
        return {
          title: 'Chờ PVT duyệt',
          items: dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET'),
          emptyMessage: 'Không có công văn nào chờ PVT duyệt',
        };
      default:
        return {
          title: 'Tất cả công văn',
          items: dispatches,
          emptyMessage: 'Chưa có công văn nào được giao',
        };
    }
  };

  const tabData = getTabDispatches();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
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
          <TpSidebar
            activeTab={activeSidebarTab}
            onChangeTab={setActiveSidebarTab}
            roomCode={tpUser?.roomCode}
            pvtManagerName={managingPvt?.fullName}
            counts={counts}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            {/* Hero Header — luôn hiển thị */}
            <TpHeroHeader
              userName={tpUser?.fullName || 'Trưởng phòng'}
              roomCode={tpUser?.roomCode}
              pvtManagerName={managingPvt?.fullName}
              summary={heroSummary}
              onRefresh={loadDispatches}
              isLoading={isLoading}
            />

            {/* Tab: Dashboard */}
            {activeSidebarTab === 'dashboard' && (
              <TpDashboardHome
                dispatches={dispatches}
                tpUser={tpUser}
                pvtManager={managingPvt}
                onOpenDetail={setDetailDispatch}
                onOpenReport={handleOpenReport}
                onMarkComplete={handleMarkComplete}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as TpSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo tổng quan */}
            {activeSidebarTab === 'report-overview' && (
              <TpDashboardHome
                dispatches={dispatches}
                tpUser={tpUser}
                pvtManager={managingPvt}
                onOpenDetail={setDetailDispatch}
                onOpenReport={handleOpenReport}
                onMarkComplete={handleMarkComplete}
                onNavigateTab={(tab) => setActiveSidebarTab(tab as TpSidebarTab)}
              />
            )}

            {/* Tab: Báo cáo theo thời gian */}
            {activeSidebarTab === 'report-by-time' && (
              <TpDispatchesList
                title="Công văn theo thời gian"
                dispatches={dispatches}
                onOpenDetail={setDetailDispatch}
                onOpenReport={handleOpenReport}
                onMarkComplete={handleMarkComplete}
                onRefresh={loadDispatches}
                isLoading={isLoading}
                emptyMessage="Chưa có công văn nào"
              />
            )}

            {/* Tab: Danh sách công văn (4 tab con) */}
            {(activeSidebarTab === 'action-all' ||
              activeSidebarTab === 'action-pending' ||
              activeSidebarTab === 'action-processing' ||
              activeSidebarTab === 'action-reported' ||
              activeSidebarTab === 'action-waiting-pvt') && (
                <TpDispatchesList
                  title={tabData.title}
                  dispatches={tabData.items}
                  onOpenDetail={setDetailDispatch}
                  onOpenReport={handleOpenReport}
                  onMarkComplete={handleMarkComplete}
                  onRefresh={loadDispatches}
                  isLoading={isLoading}
                  emptyMessage={tabData.emptyMessage}
                />
              )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <ReportProgressModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        dispatch={dispatchToReport}
        onSave={handleSaveReport}
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

export default TruongPhongDashboard;