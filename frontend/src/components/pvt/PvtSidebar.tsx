// src/components/pvt/PvtSidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Calendar,
  Trophy,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  Search,
  Bell,
  ChevronRight,
  User,
} from 'lucide-react';

export type PvtSidebarTab =
  | 'dashboard'
  | 'report-overview'
  | 'report-by-time'
  | 'report-leaderboard'
  | 'action-all'
  | 'action-pending-tp'
  | 'action-assigned-tp'
  | 'action-waiting-vt'
  | 'action-notifications';

interface PvtSidebarProps {
  activeTab: PvtSidebarTab;
  onChangeTab: (tab: PvtSidebarTab) => void;
  roomCode?: string;
  userName?: string;
  counts: {
    pendingTp: number;      // Chờ giao TP
    assignedTp: number;     // Đã giao TP
    waitingVt: number;      // Chờ trình VT
    notifications: number;  // Thông báo chưa đọc
  };
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const PvtSidebar: React.FC<PvtSidebarProps> = ({
  activeTab,
  onChangeTab,
  roomCode,
  userName,
  counts,
  isMobileOpen,
  onCloseMobile,
}) => {
  const handleClick = (tab: PvtSidebarTab) => {
    onChangeTab(tab);
    onCloseMobile();
  };

  return (
    <aside
      className={`w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${
        isMobileOpen ? 'block' : 'hidden lg:block'
      }`}
    >
      {/* Header đỏ */}
      <div
        className="px-4 py-3.5 text-white"
        style={{
          backgroundColor: '#B71C1C',
          backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 100%)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center">
            <User className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold tracking-widest uppercase text-amber-200">
              Phó Viện trưởng
            </div>
            <div className="text-xs font-black text-white truncate">
              {roomCode || 'BÀN LÀM VIỆC'}
            </div>
            {userName && (
              <div className="text-[9px] text-red-100 truncate mt-0.5">
                {userName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
        {/* Dashboard chính */}
        <MenuItem
          icon={LayoutDashboard}
          label="Bảng điều khiển"
          isActive={activeTab === 'dashboard'}
          onClick={() => handleClick('dashboard')}
        />

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Section 1: BÁO CÁO */}
        <div>
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full" style={{ backgroundColor: '#B71C1C' }} />
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              📊 Báo cáo
            </span>
          </div>

          <div className="space-y-0.5">
            <MenuItem
              icon={PieChart}
              label="Tổng quan"
              isActive={activeTab === 'report-overview'}
              onClick={() => handleClick('report-overview')}
            />
            <MenuItem
              icon={Calendar}
              label="Theo thời gian"
              isActive={activeTab === 'report-by-time'}
              onClick={() => handleClick('report-by-time')}
            />
            <MenuItem
              icon={Trophy}
              label="Xếp hạng PVT"
              isActive={activeTab === 'report-leaderboard'}
              onClick={() => handleClick('report-leaderboard')}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Section 2: CÔNG VIỆC */}
        <div>
          <div className="px-3 py-1.5 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              ⚙️ Công việc
            </span>
          </div>

          <div className="space-y-0.5">
            <MenuItem
              icon={FileText}
              label="Tất cả công văn"
              isActive={activeTab === 'action-all'}
              onClick={() => handleClick('action-all')}
            />
            <MenuItem
              icon={Clock}
              label="Chờ giao TP"
              isActive={activeTab === 'action-pending-tp'}
              onClick={() => handleClick('action-pending-tp')}
              badge={counts.pendingTp}
              badgeColor="amber"
            />
            <MenuItem
              icon={Send}
              label="Đã giao TP"
              isActive={activeTab === 'action-assigned-tp'}
              onClick={() => handleClick('action-assigned-tp')}
              badge={counts.assignedTp}
              badgeColor="blue"
            />
            <MenuItem
              icon={CheckCircle2}
              label="Chờ trình VT"
              isActive={activeTab === 'action-waiting-vt'}
              onClick={() => handleClick('action-waiting-vt')}
              badge={counts.waitingVt}
              badgeColor="purple"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100" />

        {/* Section 3: THÔNG BÁO */}
        <div>
          <MenuItem
            icon={Bell}
            label="Thông báo"
            isActive={activeTab === 'action-notifications'}
            onClick={() => handleClick('action-notifications')}
            badge={counts.notifications}
            badgeColor="red"
          />
        </div>
      </nav>
    </aside>
  );
};

// ============================================
// MENU ITEM
// ============================================
interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  badgeColor?: 'amber' | 'purple' | 'red' | 'blue' | 'emerald';
  disabled?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
  badgeColor = 'amber',
  disabled,
}) => {
  const badgeClasses = {
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  }[badgeColor];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer group ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : isActive
          ? 'bg-red-50 text-red-900 font-bold border shadow-2xs'
          : 'text-slate-700 hover:bg-slate-50 font-medium border border-transparent'
      }`}
      style={
        isActive && !disabled
          ? { borderColor: '#B71C1C', backgroundColor: '#FEF2F2' }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
            isActive && !disabled
              ? 'text-white border-transparent'
              : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-white'
          }`}
          style={isActive && !disabled ? { backgroundColor: '#B71C1C' } : undefined}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="truncate font-medium">{label}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {badge !== undefined && badge > 0 && (
          <span
            className={`min-w-[20px] h-5 px-1.5 rounded-full border text-[10px] font-black flex items-center justify-center ${badgeClasses}`}
          >
            {badge}
          </span>
        )}
        {isActive && !disabled && <ChevronRight className="w-3 h-3 text-red-500" />}
      </div>
    </button>
  );
};

export default PvtSidebar;