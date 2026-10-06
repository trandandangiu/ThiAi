// src/components/admin/AdminDashboardHome.tsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Activity,
  UserPlus,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  LogIn,
} from 'lucide-react';
import { PieChart as PieChartWidget } from '../PieChart';

// ============================================
// TYPES
// ============================================
interface AdminStats {
  users: number;
  dispatches: number;
  departments: number;
  roles: number;
  permissions: number;
}

interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
}

interface DispatchStats {
  total: number;
  dangXuLy: number;
  hoanThanh: number;
  quaHan: number;
  sapDenHan: number;
}

interface AdminDashboardHomeProps {
  onNavigate?: (module: string) => void;
}

// ============================================
// HELPER — Format action label
// ============================================
const getActionMeta = (action: string): { label: string; color: string; icon: React.ElementType } => {
  const map: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    CREATE_USER: { label: 'Tạo tài khoản', color: 'text-emerald-600 bg-emerald-50', icon: UserPlus },
    UPDATE_USER: { label: 'Cập nhật user', color: 'text-blue-600 bg-blue-50', icon: Edit3 },
    DELETE_USER: { label: 'Xóa tài khoản', color: 'text-rose-600 bg-rose-50', icon: Trash2 },
    LOCK_USER: { label: 'Khóa tài khoản', color: 'text-amber-600 bg-amber-50', icon: Lock },
    UNLOCK_USER: { label: 'Mở khóa', color: 'text-emerald-600 bg-emerald-50', icon: Unlock },
    RESET_PASSWORD: { label: 'Reset mật khẩu', color: 'text-purple-600 bg-purple-50', icon: KeyRound },
    CHANGE_PASSWORD: { label: 'Đổi mật khẩu', color: 'text-purple-600 bg-purple-50', icon: KeyRound },
    CREATE_DEPARTMENT: { label: 'Tạo phòng ban', color: 'text-emerald-600 bg-emerald-50', icon: Building },
    UPDATE_DEPARTMENT: { label: 'Cập nhật phòng', color: 'text-blue-600 bg-blue-50', icon: Edit3 },
    DELETE_DEPARTMENT: { label: 'Xóa phòng ban', color: 'text-rose-600 bg-rose-50', icon: Trash2 },
    CREATE_DISPATCH: { label: 'Tạo công văn', color: 'text-emerald-600 bg-emerald-50', icon: FileSpreadsheet },
    UPDATE_DISPATCH: { label: 'Cập nhật CV', color: 'text-blue-600 bg-blue-50', icon: Edit3 },
    DELETE_DISPATCH: { label: 'Xóa công văn', color: 'text-rose-600 bg-rose-50', icon: Trash2 },
    ASSIGN_PVTS: { label: 'Giao PVT', color: 'text-indigo-600 bg-indigo-50', icon: ShieldCheck },
    ASSIGN_TPS: { label: 'Giao TP', color: 'text-indigo-600 bg-indigo-50', icon: ShieldCheck },
    ASSIGN_ROLES: { label: 'Gán vai trò', color: 'text-purple-600 bg-purple-50', icon: KeyRound },
    TP_SUBMIT: { label: 'TP báo cáo', color: 'text-blue-600 bg-blue-50', icon: FileSpreadsheet },
    PVT_SUBMIT: { label: 'PVT trình VT', color: 'text-indigo-600 bg-indigo-50', icon: ShieldCheck },
    VT_AGREE: { label: 'VT đồng ý', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
    VT_DISAGREE: { label: 'VT từ chối', color: 'text-rose-600 bg-rose-50', icon: AlertCircle },
    PVT_DISAGREE: { label: 'PVT từ chối', color: 'text-rose-600 bg-rose-50', icon: AlertCircle },
  };
  return map[action] || { label: action, color: 'text-slate-600 bg-slate-50', icon: Activity };
};

const formatTimeAgo = (dateStr: string): string => {
  const now = new Date().getTime();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = String(vn.getUTCDate()).padStart(2, '0');
  const month = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const year = vn.getUTCFullYear();
  const hour = String(vn.getUTCHours()).padStart(2, '0');
  const min = String(vn.getUTCMinutes()).padStart(2, '0');
  return `${hour}:${min} ${day}/${month}/${year}`;
};

// ============================================
// MAIN COMPONENT
// ============================================
export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [dispatchStats, setDispatchStats] = useState<DispatchStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [statsRes, dispatchStatsRes, logsRes] = await Promise.all([
        fetch('/api/admin/database/stats', { headers }),
        fetch('/api/dispatches/stats', { headers }),
        fetch('/api/admin/audit-logs?limit=8', { headers }),
      ]);

      // Stats
      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success) setStats(data.stats);
      }

      // Dispatch stats
      if (dispatchStatsRes.ok) {
        const data = await dispatchStatsRes.json();
        if (data.success) {
          const s = data.stats || data.summary || {};
          setDispatchStats({
            total: s.total || 0,
            dangXuLy: s.dangXuLy || 0,
            hoanThanh: s.hoanThanh || 0,
            quaHan: s.quaHan || 0,
            sapDenHan: s.sapDenHan || 0,
          });
        }
      }

      // Recent logs
      if (logsRes.ok) {
        const data = await logsRes.json();
        if (data.success) {
          setRecentLogs(data.logs || []);
        }
      }
    } catch (e: any) {
      setError(e.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Loading state
  if (isLoading && !stats) {
    return (
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <span className="text-xs font-medium">Đang tải dữ liệu tổng quan...</span>
      </div>
    );
  }

  const totalDispatches = dispatchStats?.total || stats?.dispatches || 0;
  const completed = dispatchStats?.hoanThanh || 0;
  const processing = dispatchStats?.dangXuLy || 0;
  const overdue = dispatchStats?.quaHan || 0;
  const dueSoon = dispatchStats?.sapDenHan || 0;


  // Pie chart data
  const pieData = [
    { id: 'completed', label: 'Hoàn thành', value: completed, color: '#10b981' },
    { id: 'processing', label: 'Đang xử lý', value: processing, color: '#3b82f6' },
    { id: 'dueSoon', label: 'Sắp đến hạn', value: dueSoon, color: '#f59e0b' },
    { id: 'overdue', label: 'Quá hạn', value: overdue, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadData}
            className="ml-auto text-xs font-bold underline hover:no-underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Header refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
            Tổng quan hệ thống
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu thật từ cơ sở dữ liệu — cập nhật lúc {formatDateTime(new Date().toISOString())}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Users"
          value={stats?.users ?? 0}
          icon={Users}
          color="blue"
          sub="Tài khoản đang hoạt động"
          onClick={() => onNavigate?.('tab-users')}
        />
        <KpiCard
          label="Dispatches"
          value={stats?.dispatches ?? 0}
          icon={FileSpreadsheet}
          color="red"
          sub="Hồ sơ công văn trong CSDL"
          onClick={() => onNavigate?.('tab-dispatches')}
        />
        <KpiCard
          label="Phòng ban"
          value={stats?.departments ?? 0}
          icon={Building}
          color="purple"
          sub="Đơn vị đang hoạt động"
          onClick={() => onNavigate?.('departments')}
        />
        <KpiCard
          label="Roles"
          value={stats?.roles ?? 0}
          icon={ShieldCheck}
          color="amber"
          sub={`${stats?.permissions ?? 0} quyền phân bổ`}
          onClick={() => onNavigate?.('roles')}
        />
      </div>

      {/* Chart + KPI hàng 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trạng thái công văn</h3>
              <p className="text-xs text-slate-500">
                Tổng {totalDispatches} công văn — {completed} đã xong
              </p>
            </div>
          </div>

          {totalDispatches === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có công văn nào trong hệ thống
            </div>
          ) : (
            <PieChartWidget
              title=""
              subtitle=""
              data={pieData}
              size={220}
              donut={true}
            />
          )}
        </div>

        {/* Progress bars */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tiến độ xử lý</h3>
              <p className="text-xs text-slate-500">Thống kê theo trạng thái</p>
            </div>
          </div>

          <ProgressRow label="Hoàn thành" value={completed} total={totalDispatches} color="emerald" icon={CheckCircle2} />
          <ProgressRow label="Đang xử lý" value={processing} total={totalDispatches} color="blue" icon={Clock} />
          <ProgressRow label="Sắp đến hạn" value={dueSoon} total={totalDispatches} color="amber" icon={Clock} />
          <ProgressRow label="Quá hạn" value={overdue} total={totalDispatches} color="rose" icon={AlertCircle} />
        </div>
      </div>

      {/* Recent activity */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">🕐 Hoạt động gần đây</h3>
              <p className="text-xs text-slate-500">{recentLogs.length} thao tác mới nhất</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('audit-logs')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Xem toàn bộ →
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs italic">
            Chưa có hoạt động nào
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentLogs.map(log => {
              const meta = getActionMeta(log.action);
              const Icon = meta.icon;
              const userName = log.userName || log.user?.fullName || 'Hệ thống';

              return (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-7 h-7 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-slate-800 truncate">
                        <strong className="font-bold">{userName}</strong>
                        <span className="text-slate-500"> — {meta.label}</span>
                        {log.entityId && (
                          <span className="ml-1.5 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {log.entityId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      {log.ipAddress && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 shrink-0">
                    {formatTimeAgo(log.createdAt)}
                  </span>
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
interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'red' | 'purple' | 'amber';
  sub: string;
  onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon, color, sub, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[color];

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-xl ${colorClasses} border flex items-center justify-center group-hover:scale-110 transition`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-3xl font-black text-slate-900 tabular-nums">
        {value.toLocaleString('vi-VN')}
      </div>
      <div className="text-[11px] text-slate-500 mt-1 font-medium">{sub}</div>
    </div>
  );
};

// ============================================
// PROGRESS ROW
// ============================================
interface ProgressRowProps {
  label: string;
  value: number;
  total: number;
  color: 'emerald' | 'blue' | 'amber' | 'rose';
  icon: React.ElementType;
}

const ProgressRow: React.FC<ProgressRowProps> = ({ label, value, total, color, icon: Icon }) => {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const colors = {
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    blue: { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    rose: { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
  }[color];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-black ${colors.text} tabular-nums`}>{value}</span>
          <span className="text-[11px] text-slate-400">/ {total}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
export default AdminDashboardHome;