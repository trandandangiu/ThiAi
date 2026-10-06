// src/components/admin/AdminAuditLogs.tsx
import React, { useState } from 'react';
import {
  History,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  Building,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Search,
  X,
} from 'lucide-react';
import { useAdminAuditLogs } from '../../hooks/admin/useAdminAuditLogs';

// ============================================
// ACTION META — Icon + Label + Color
// ============================================
const getActionMeta = (action: string): {
  label: string;
  color: string;
  icon: React.ElementType;
  level: 'INFO' | 'SECURITY' | 'ERROR';
} => {
  const map: Record<string, { label: string; color: string; icon: React.ElementType; level: 'INFO' | 'SECURITY' | 'ERROR' }> = {
    CREATE_USER: { label: 'Tạo tài khoản', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: UserPlus, level: 'INFO' },
    UPDATE_USER: { label: 'Cập nhật user', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Edit3, level: 'INFO' },
    DELETE_USER: { label: 'Xóa tài khoản', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: Trash2, level: 'SECURITY' },
    LOCK_USER: { label: 'Khóa tài khoản', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Lock, level: 'SECURITY' },
    UNLOCK_USER: { label: 'Mở khóa', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Unlock, level: 'SECURITY' },
    RESET_PASSWORD: { label: 'Reset mật khẩu', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: KeyRound, level: 'SECURITY' },
    CHANGE_PASSWORD: { label: 'Đổi mật khẩu', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: KeyRound, level: 'SECURITY' },
    ASSIGN_ROLES: { label: 'Gán vai trò', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: ShieldCheck, level: 'SECURITY' },
    CREATE_DEPARTMENT: { label: 'Tạo phòng ban', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Building, level: 'INFO' },
    UPDATE_DEPARTMENT: { label: 'Cập nhật phòng', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Edit3, level: 'INFO' },
    DELETE_DEPARTMENT: { label: 'Xóa phòng ban', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: Trash2, level: 'SECURITY' },
    CREATE_DISPATCH: { label: 'Tạo công văn', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: FileSpreadsheet, level: 'INFO' },
    UPDATE_DISPATCH: { label: 'Cập nhật công văn', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Edit3, level: 'INFO' },
    DELETE_DISPATCH: { label: 'Xóa công văn', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: Trash2, level: 'SECURITY' },
    ASSIGN_PVTS: { label: 'Giao PVT', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: ShieldCheck, level: 'INFO' },
    ASSIGN_TPS: { label: 'Giao TP', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: ShieldCheck, level: 'INFO' },
    TP_SUBMIT: { label: 'TP báo cáo', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: FileSpreadsheet, level: 'INFO' },
    PVT_SUBMIT: { label: 'PVT trình VT', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', icon: ShieldCheck, level: 'INFO' },
    VT_AGREE: { label: 'VT đồng ý', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2, level: 'INFO' },
    VT_DISAGREE: { label: 'VT từ chối', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertCircle, level: 'INFO' },
    PVT_DISAGREE: { label: 'PVT từ chối', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertCircle, level: 'INFO' },
  };
  return map[action] || { label: action, color: 'text-slate-700 bg-slate-50 border-slate-200', icon: Activity, level: 'INFO' };
};

const formatDateTime = (dateStr: string): { date: string; time: string } => {
  const d = new Date(dateStr);
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const day = String(vn.getUTCDate()).padStart(2, '0');
  const month = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const year = vn.getUTCFullYear();
  const hour = String(vn.getUTCHours()).padStart(2, '0');
  const min = String(vn.getUTCMinutes()).padStart(2, '0');
  const sec = String(vn.getUTCSeconds()).padStart(2, '0');
  return {
    date: `${day}/${month}/${year}`,
    time: `${hour}:${min}:${sec}`,
  };
};

// ============================================
// MAIN COMPONENT
// ============================================
export const AdminAuditLogs: React.FC = () => {
  const { logs, page, totalPages, isLoading, error, setPage, reload } = useAdminAuditLogs(50);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter client-side
  const filtered = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const meta = getActionMeta(log.action);
    return (
      log.action.toLowerCase().includes(q) ||
      meta.label.toLowerCase().includes(q) ||
      (log.userName || log.user?.fullName || '').toLowerCase().includes(q) ||
      (log.entityId || '').toLowerCase().includes(q) ||
      (log.ipAddress || '').includes(q)
    );
  });

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-5 animate-fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Nhật Ký Hoạt Động Hệ Thống
            </h2>
            <p className="text-xs text-slate-500">
              Truy vết mọi thao tác trong CSDL • {filtered.length} / {logs.length} bản ghi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reload}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo hành động, người thao tác, IP, entity ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white text-slate-800 pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium placeholder-slate-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && logs.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-xs">Đang tải nhật ký...</span>
        </div>
      )}

      {/* Table */}
      {!isLoading && logs.length >= 0 && (
        <>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-32">Thời Gian</th>
                    <th className="py-3 px-4 w-44">Người Thao Tác</th>
                    <th className="py-3 px-3 w-44">Hành Động</th>
                    <th className="py-3 px-3 w-36 font-mono">Entity</th>
                    <th className="py-3 px-3 w-32 font-mono">IP</th>
                    <th className="py-3 px-3 w-24 text-center">Mức Độ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                        {logs.length === 0
                          ? 'Chưa có bản ghi nhật ký nào trong hệ thống'
                          : 'Không có bản ghi khớp với từ khóa tìm kiếm'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(log => {
                      const meta = getActionMeta(log.action);
                      const Icon = meta.icon;
                      const time = formatDateTime(log.createdAt);
                      const actorName = log.userName || log.user?.fullName || 'Hệ thống';
                      const actorRole = log.userRole || log.user?.username || '';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-4">
                            <div className="font-mono text-[11px] font-bold text-slate-800">
                              {time.time}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {time.date}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-slate-900 truncate max-w-[150px]">
                              {actorName}
                            </div>
                            {actorRole && (
                              <div className="text-[10px] font-mono text-slate-500 truncate">
                                {actorRole}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${meta.color}`}>
                              <Icon className="w-3 h-3" />
                              <span>{meta.label}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {log.entityId ? (
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">
                                  {log.entityType || '—'}
                                </div>
                                <div className="font-mono text-[10px] text-slate-700 truncate max-w-[120px]">
                                  {log.entityId.slice(0, 12)}...
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono text-[11px] text-slate-600">
                              {log.ipAddress || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                                meta.level === 'SECURITY'
                                  ? 'bg-purple-100 text-purple-800'
                                  : meta.level === 'ERROR'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {meta.level}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-600">
                Trang <strong>{page}</strong> / <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAuditLogs;