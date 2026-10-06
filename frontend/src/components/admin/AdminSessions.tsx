// src/components/admin/AdminSessions.tsx
import React from 'react';
import {
  Activity,
  RefreshCw,
  Loader2,
  AlertCircle,
  Monitor,
  Smartphone,
  Globe,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useAdminSessions } from '../../hooks/admin/useAdminSessions';

const getDeviceIcon = (deviceType?: string, userAgent?: string): React.ElementType => {
  const ua = (userAgent || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return Smartphone;
  }
  return Monitor;
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

export const AdminSessions: React.FC = () => {
  const { sessions, isLoading, error, refresh } = useAdminSessions();

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-5 animate-fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Phiên Đăng Nhập
            </h2>
            <p className="text-xs text-slate-500">
              Giám sát các phiên kết nối đang hoạt động • {sessions.length} phiên
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && sessions.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-xs">Đang tải phiên đăng nhập...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sessions.length === 0 && (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-4">
            <LogIn className="w-7 h-7 text-slate-300" />
          </div>
          <div className="font-bold text-slate-600 mb-1">
            Chưa có phiên đăng nhập nào
          </div>
          <div className="text-xs text-slate-500 text-center max-w-md px-4">
            Hệ thống sử dụng JWT stateless — phiên đăng nhập không được lưu trong CSDL.
            Bảng <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">sessions</code> sẽ hiển thị khi backend bổ sung tính năng tracking.
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && sessions.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Tài Khoản</th>
                  <th className="py-3 px-4">Thiết Bị</th>
                  <th className="py-3 px-3 font-mono">IP</th>
                  <th className="py-3 px-4">Đăng Nhập</th>
                  <th className="py-3 px-4">Hết Hạn</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map(session => {
                  const DeviceIcon = getDeviceIcon(session.deviceType, session.userAgent);
                  const isRevoked = !!session.revokedAt;
                  const isExpired = new Date(session.expiresAt) < new Date();

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {session.user?.fullName || 'Không rõ'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          @{session.user?.username || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="text-slate-700 truncate max-w-[200px]">
                            {session.deviceType || session.userAgent || 'Không rõ'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px] text-slate-600">
                            {session.ipAddress || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-600">
                          {formatDateTime(session.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-600">
                          {formatDateTime(session.expiresAt)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <LogOut className="w-3 h-3" />
                            Đã thu hồi
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Hết hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Online
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessions;