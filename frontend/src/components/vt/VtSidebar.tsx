// src/components/vt/VtSidebar.tsx
import React from 'react';
import {
  FileText,
  Plus,
  ChevronRight,
  Building,
  // ─── Các icon không dùng nữa (giữ lại để sau này bật) ───
  // LayoutDashboard,
  // PieChart,
  // Calendar,
  // Trophy,
  // Clock,
  // Users,
  // CheckCircle2,
} from 'lucide-react';

export type VtSidebarTab =
  // ─── CHỈ GIỮ 2 TAB NÀY ───
  | 'action-all'
  | 'action-create';

// ─── Các tab cũ (comment lại để sau này bật) ───
// | 'report-overview'
// | 'report-by-dept'
// | 'report-by-time'
// | 'report-leaderboard'
// | 'action-pending'
// | 'action-assigned'
// | 'action-approve';

interface VtSidebarProps {
  activeTab: VtSidebarTab;
  onChangeTab: (tab: VtSidebarTab) => void;
  pendingCount?: number;
  approveCount?: number;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  // ⭐ THÊM 2 dòng này
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// src/components/vt/VtSidebar.tsx
// ... (giữ nguyên import)

export const VtSidebar: React.FC<VtSidebarProps> = ({
  activeTab,
  onChangeTab,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const handleClick = (tab: VtSidebarTab) => {
    onChangeTab(tab);
    onCloseMobile();
  };

  // ⭐ Nếu collapsed → chỉ hiện cột hẹp với icon
  if (isCollapsed) {
    return (
      <aside className="hidden lg:flex w-14 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex-col items-center py-3 gap-2">
        {/* Nút mở rộng */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center transition cursor-pointer"
          title="Mở rộng menu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Icon các tab */}
        <button
          onClick={() => handleClick('action-all')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer ${activeTab === 'action-all'
              ? 'bg-red-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
          title="Tất cả công văn"
        >
          <FileText className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${isMobileOpen ? 'block' : 'hidden lg:block'
        }`}
    >
      {/* Header đỏ — THÊM NÚT THU GỌN */}
      <div
        className="px-4 py-3.5 text-white flex items-center justify-between"
        style={{
          backgroundColor: '#B71C1C',
          backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 100%)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
            <Building className="w-4 h-4 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-white truncate uppercase tracking-wide">
              QUẢN LÝ CÔNG VĂN
            </div>
          </div>
        </div>

        {/* ⭐ Nút thu gọn */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer shrink-0"
          title="Thu gọn menu"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* MENU */}
      <nav className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
        <div className="space-y-0.5">
          <MenuItem
            icon={FileText}
            label="Tất cả công văn"
            isActive={activeTab === 'action-all'}
            onClick={() => handleClick('action-all')}
          />
        </div>
      </nav>
    </aside>
  );
};

// ... (giữ nguyên MenuItem ở dưới)

// ============================================
// MENU ITEM
// ============================================
interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  badgeColor?: 'amber' | 'purple' | 'red';
  accent?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
  badgeColor = 'amber',
  accent,
}) => {
  const badgeClasses = {
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }[badgeColor];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition cursor-pointer group ${isActive
        ? 'bg-red-50 text-red-900 font-bold border shadow-2xs'
        : 'text-slate-700 hover:bg-slate-50 font-medium border border-transparent'
        }`}
      style={
        isActive
          ? { borderColor: '#B71C1C', backgroundColor: '#FEF2F2' }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${isActive
            ? 'text-white border-transparent'
            : accent
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-white'
            }`}
          style={isActive ? { backgroundColor: '#B71C1C' } : undefined}
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
        {isActive && <ChevronRight className="w-3 h-3 text-red-500" />}
      </div>
    </button>
  );
};

export default VtSidebar;