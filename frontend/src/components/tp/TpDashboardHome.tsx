  // src/components/tp/TpDashboardHome.tsx
  import React, { useMemo } from 'react';
  import {
    FileText,
    Clock,
    Send,
    CheckCircle2,
    AlertTriangle,
    Flame,
    Eye,
    ArrowRight,
    Building,
    User,
  } from 'lucide-react';
  import { Dispatch } from '../../types/dispatch';

  interface TpDashboardHomeProps {
    dispatches: Dispatch[];
    tpUser: any;
    pvtManager: any;
    onOpenDetail: (d: Dispatch) => void;
    onOpenReport: (d: Dispatch) => void;
    onMarkComplete: (d: Dispatch) => void;
    onNavigateTab: (tab: string) => void;
  }

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  const getStatusInfo = (d: Dispatch) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (d.trangThai === 'HOAN_THANH') {
      return { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
    }
    if (d.hanBaoCaoXuLy && new Date(d.hanBaoCaoXuLy) < today) {
      return { label: 'Quá hạn', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: AlertTriangle };
    }
    if (d.trangThai === 'CHO_PVT_DUYET') {
      return { label: 'Chờ PVT duyệt', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Clock };
    }
    return { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Send };
  };

  export const TpDashboardHome: React.FC<TpDashboardHomeProps> = ({
    dispatches,
    tpUser,
    pvtManager,
    onOpenDetail,
    onOpenReport,
    onMarkComplete,
    onNavigateTab,
  }) => {
    // KPI
    const kpis = useMemo(() => {
      const total = dispatches.length;
      const pending = dispatches.filter(d => d.trangThai === 'CHO_TP_XU_LY' || d.trangThai === 'MOI_TAO').length;
      const processing = dispatches.filter(d => d.trangThai === 'DANG_XU_LY').length;
      const reported = dispatches.filter(d => d.trangThai === 'CHO_PVT_DUYET' || d.trangThai === 'CHO_VT_DUYET').length;
      const completed = dispatches.filter(d => d.trangThai === 'HOAN_THANH').length;
      const overdue = dispatches.filter(d => {
        if (d.trangThai === 'HOAN_THANH' || !d.hanBaoCaoXuLy) return false;
        return new Date(d.hanBaoCaoXuLy) < new Date();
      }).length;
      return { total, pending, processing, reported, completed, overdue };
    }, [dispatches]);

    // 5 công văn gần đây
    const recentDispatches = useMemo(() => {
      return [...dispatches]
        .sort((a, b) => {
          const da = a.ngayGui ? new Date(a.ngayGui).getTime() : 0;
          const db = b.ngayGui ? new Date(b.ngayGui).getTime() : 0;
          return db - da;
        })
        .slice(0, 5);
    }, [dispatches]);

    return (
      <div className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="Tổng nhận" value={kpis.total} icon={FileText} color="slate" onClick={() => onNavigateTab('action-all')} />
          <KpiCard label="Chờ xử lý" value={kpis.pending} icon={Clock} color="amber" alert={kpis.pending > 0} onClick={() => onNavigateTab('action-pending')} />
          <KpiCard label="Đang xử lý" value={kpis.processing} icon={Send} color="blue" onClick={() => onNavigateTab('action-processing')} />
          <KpiCard label="Đã báo cáo" value={kpis.reported} icon={CheckCircle2} color="purple" onClick={() => onNavigateTab('action-reported')} />
          <KpiCard label="Quá hạn" value={kpis.overdue} icon={AlertTriangle} color="rose" alert={kpis.overdue > 0} />
        </div>

        {/* Recent dispatches */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Công văn gần đây</h3>
                <p className="text-xs text-slate-500">{recentDispatches.length} công văn mới nhất</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('action-all')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentDispatches.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 text-slate-200" />
              <div className="text-sm font-bold">Chưa có công văn nào</div>
              <div className="text-xs mt-1">Công văn sẽ xuất hiện khi PVT giao việc</div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDispatches.map(d => {
                const status = getStatusInfo(d);
                const StatusIcon = status.icon;

                return (
                  <div key={d.id} className="px-5 py-3 hover:bg-red-50/30 transition">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-mono font-black text-[11px] text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {d.soCongVan}
                          </span>
                          {d.mucDoKhan === 'HOA_TOC' && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800 border border-red-200">
                              <Flame className="w-2.5 h-2.5" />
                              HỎA TỐC
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <div
                          onClick={() => onOpenDetail(d)}
                          className="text-sm font-semibold text-slate-900 line-clamp-1 cursor-pointer hover:text-red-700"
                        >
                          {d.tenCongVan}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                          <span>Hạn: {formatDate(d.hanBaoCaoXuLy)}</span>
                          {d.donViBanHanh && <span>• {d.donViBanHanh}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onOpenDetail(d)}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {d.trangThai !== 'HOAN_THANH' && (
                          <button
                            onClick={() => onOpenReport(d)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition cursor-pointer active:scale-95"
                            style={{ backgroundColor: '#B71C1C' }}
                          >
                            Báo cáo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // KPI CARD
  // ============================================
  const KpiCard: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
    color: 'slate' | 'amber' | 'blue' | 'purple' | 'rose';
    alert?: boolean;
    onClick?: () => void;
  }> = ({ label, value, icon: Icon, color, alert, onClick }) => {
    const colors = {
      slate: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'bg-slate-600', text: 'text-slate-700' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-600', text: 'text-amber-800' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-600', text: 'text-blue-800' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'bg-purple-600', text: 'text-purple-800' },
      rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-600', text: 'text-rose-800' },
    }[color];

    return (
      <div
        onClick={onClick}
        className={`p-3.5 rounded-2xl ${colors.bg} border ${colors.border} shadow-xs relative ${
          onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition' : ''
        }`}
      >
        {alert && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-pulse border-2 border-white" />
        )}
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[10px] font-black ${colors.text} uppercase tracking-wider`}>
            {label}
          </span>
          <div className={`w-7 h-7 rounded-lg ${colors.icon} text-white flex items-center justify-center shadow-sm`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-black text-slate-900 leading-none tabular-nums">
          {value}
        </div>
      </div>
    );
  };

  export default TpDashboardHome;