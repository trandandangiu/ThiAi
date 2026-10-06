// src/components/admin/DatabaseBrowser.tsx
import React, { useState, useMemo } from 'react';
import {
  Database,
  Table,
  Eye,
  Download,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  Loader2,
  Users,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  Key,
  Link2,
  History,
  Paperclip,
  FileText,
  XCircle,
  Bell,
  Activity,
  Folder,
  Settings,
  Columns,
  Send,
  Inbox,
} from 'lucide-react';
import { useAdminDatabase } from '../../hooks/admin/useAdminDatabase';
import { DatabaseTable, DatabaseTableData } from '../../types/admin';

// ============================================
// TABLE METADATA — Nhóm + Nhãn + Icon + Màu
// ============================================
type TableGroup = 'CORE' | 'WORKFLOW' | 'MAPPINGS' | 'SYSTEM' | 'LOGS';

interface TableMeta {
  label: string;
  group: TableGroup;
  icon: React.ElementType;
  color: string;      // Tailwind bg class
  textColor: string;  // Tailwind text class
  borderColor: string;
  sensitiveColumns?: string[];  // Cột cần che (password hash...)
}

const TABLE_META: Record<string, TableMeta> = {
  // ============ CORE DATA ============
  users: {
    label: 'Tài khoản người dùng',
    group: 'CORE',
    icon: Users,
    color: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    sensitiveColumns: ['passwordHash', 'totpSecret'],
  },
  dispatches: {
    label: 'Công văn',
    group: 'CORE',
    icon: FileSpreadsheet,
    color: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  departments: {
    label: 'Phòng ban',
    group: 'CORE',
    icon: Building,
    color: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  roles: {
    label: 'Vai trò',
    group: 'CORE',
    icon: ShieldCheck,
    color: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  permissions: {
    label: 'Quyền hạn',
    group: 'CORE',
    icon: Key,
    color: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },

  // ============ WORKFLOW ============
  dispatch_pvts: {
    label: 'PVT được giao',
    group: 'WORKFLOW',
    icon: Send,
    color: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
  dispatch_tps: {
    label: 'TP được giao',
    group: 'WORKFLOW',
    icon: Inbox,
    color: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
  },
  assignments: {
    label: 'Lịch sử phân công',
    group: 'WORKFLOW',
    icon: Link2,
    color: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
  },
  attachments: {
    label: 'File đính kèm',
    group: 'WORKFLOW',
    icon: Paperclip,
    color: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    borderColor: 'border-cyan-200',
  },
  reports: {
    label: 'Báo cáo tiến độ',
    group: 'WORKFLOW',
    icon: FileText,
    color: 'bg-lime-50',
    textColor: 'text-lime-700',
    borderColor: 'border-lime-200',
  },
  rejections: {
    label: 'Lịch sử từ chối',
    group: 'WORKFLOW',
    icon: XCircle,
    color: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },

  // ============ MAPPINGS ============
  user_roles: {
    label: 'Ánh xạ user ↔ role',
    group: 'MAPPINGS',
    icon: Link2,
    color: 'bg-fuchsia-50',
    textColor: 'text-fuchsia-700',
    borderColor: 'border-fuchsia-200',
  },
  role_permissions: {
    label: 'Ánh xạ role ↔ quyền',
    group: 'MAPPINGS',
    icon: Link2,
    color: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
  },

  // ============ SYSTEM ============
  columns: {
    label: 'Cột động',
    group: 'SYSTEM',
    icon: Columns,
    color: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
  },
  system_settings: {
    label: 'Cấu hình hệ thống',
    group: 'SYSTEM',
    icon: Settings,
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  exports: {
    label: 'Lịch sử xuất file',
    group: 'SYSTEM',
    icon: Folder,
    color: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  notifications: {
    label: 'Thông báo',
    group: 'SYSTEM',
    icon: Bell,
    color: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },

  // ============ LOGS ============
  audit_logs: {
    label: 'Nhật ký hệ thống',
    group: 'LOGS',
    icon: History,
    color: 'bg-stone-100',
    textColor: 'text-stone-700',
    borderColor: 'border-stone-300',
  },
  sessions: {
    label: 'Phiên đăng nhập',
    group: 'LOGS',
    icon: Activity,
    color: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    sensitiveColumns: ['refreshToken'],
  },
};

const GROUP_LABELS: Record<TableGroup, { name: string; icon: string; order: number }> = {
  CORE: { name: 'Dữ liệu lõi', icon: '📦', order: 1 },
  WORKFLOW: { name: 'Quy trình xử lý', icon: '🔄', order: 2 },
  MAPPINGS: { name: 'Ánh xạ quan hệ', icon: '🔗', order: 3 },
  SYSTEM: { name: 'Hệ thống', icon: '🛠️', order: 4 },
  LOGS: { name: 'Nhật ký & Phiên', icon: '📋', order: 5 },
};

// ============================================
// HELPERS — Format value, mask sensitive
// ============================================
const maskValue = (value: any, columnName: string, sensitive: string[]): string => {
  if (value === null || value === undefined) return '—';
  if (sensitive.includes(columnName)) {
    const str = String(value);
    if (str.length <= 8) return '••••••••';
    return str.substring(0, 4) + '••••••' + str.substring(str.length - 2);
  }
  return formatValue(value);
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓ Đúng' : '✗ Sai';
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      return str.length > 60 ? str.substring(0, 60) + '...' : str;
    } catch {
      return '[Object]';
    }
  }
  if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
      // ISO date → format VN
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
        const day = String(vn.getUTCDate()).padStart(2, '0');
        const month = String(vn.getUTCMonth() + 1).padStart(2, '0');
        const year = vn.getUTCFullYear();
        const hour = String(vn.getUTCHours()).padStart(2, '0');
        const min = String(vn.getUTCMinutes()).padStart(2, '0');
        return `${hour}:${min} ${day}/${month}/${year}`;
      }
    }
    return value.length > 80 ? value.substring(0, 80) + '...' : value;
  }
  return String(value);
};

// ============================================
// MAIN COMPONENT
// ============================================
export const DatabaseBrowser: React.FC = () => {
  const {
    tables,
    stats,
    loading,
    error,
    loadTables,
  } = useAdminDatabase();

  const [previewTable, setPreviewTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Group tables by category
  const groupedTables = useMemo(() => {
    const groups: Record<TableGroup, DatabaseTable[]> = {
      CORE: [],
      WORKFLOW: [],
      MAPPINGS: [],
      SYSTEM: [],
      LOGS: [],
    };

    const filtered = tables.filter((t: DatabaseTable) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const meta = TABLE_META[t.name];
      return (
        t.name.toLowerCase().includes(q) ||
        (meta?.label || '').toLowerCase().includes(q)
      );
    });

    filtered.forEach((t: DatabaseTable) => {
      const meta = TABLE_META[t.name];
      const group = meta?.group || 'SYSTEM';
      groups[group].push(t);
    });

    return groups;
  }, [tables, searchTerm]);

  const totalRecords = useMemo(
    () => tables.reduce((sum: number, t: DatabaseTable) => sum + (t.count || 0), 0),
    [tables]
  );

  return (
    <div
      id="admin-database-browser"
      className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-5 animate-fadeIn font-sans"
    >
      {/* ============ HEADER ============ */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
              Database Explorer
            </h2>
            <p className="text-xs text-slate-500">
              Xem toàn bộ cấu trúc và dữ liệu trong CSDL — {tables.length} bảng • {totalRecords} bản ghi
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadTables()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl font-bold transition cursor-pointer shadow-xs text-xs active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </div>

      {/* ============ SEARCH ============ */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm bảng theo tên hoặc nhãn..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white text-slate-800 pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium placeholder-slate-400"
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

      {/* ============ ERROR ============ */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ============ LOADING ============ */}
      {loading && tables.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-xs">Đang tải danh sách bảng...</span>
        </div>
      )}

      {/* ============ GROUPED TABLE LIST ============ */}
      {!loading && tables.length > 0 && (
        <div className="space-y-5">
          {(Object.keys(GROUP_LABELS) as TableGroup[])
            .sort((a, b) => GROUP_LABELS[a].order - GROUP_LABELS[b].order)
            .map(groupKey => {
              const groupTables = groupedTables[groupKey];
              if (groupTables.length === 0) return null;
              const groupInfo = GROUP_LABELS[groupKey];

              return (
                <div key={groupKey} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 select-none">
                    <span>{groupInfo.icon}</span>
                    <span className="tracking-wider uppercase">{groupInfo.name}</span>
                    <span className="text-slate-400 font-normal normal-case">
                      ({groupTables.length} bảng)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {groupTables.map((table: DatabaseTable) => {
                      const meta = TABLE_META[table.name];
                      const Icon = meta?.icon || Table;
                      const label = meta?.label || table.name;

                      return (
                        <div
                          key={table.name}
                          className={`group p-3 rounded-2xl border ${meta?.borderColor || 'border-slate-200'} bg-white hover:shadow-md hover:border-cyan-300 transition cursor-pointer`}
                          onClick={() => setPreviewTable(table.name)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-xl ${meta?.color || 'bg-slate-100'} ${meta?.textColor || 'text-slate-700'} border ${meta?.borderColor || 'border-slate-200'} flex items-center justify-center shrink-0`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                              {table.count} records
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="font-mono text-xs font-bold text-slate-900 truncate group-hover:text-cyan-700 transition">
                              {table.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-sans truncate">
                              {label}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setPreviewTable(table.name);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[11px] transition cursor-pointer border border-cyan-200"
                            >
                              <Eye className="w-3 h-3" />
                              Xem
                            </button>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                // Export JSON — gọi API getTableData và download
                                import('../../services/adminApi').then(({ adminApi }) => {
                                  adminApi.getTableData(table.name, { limit: 1000 }).then(res => {
                                    const blob = new Blob(
                                      [JSON.stringify(res.data, null, 2)],
                                      { type: 'application/json' }
                                    );
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${table.name}_export.json`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  });
                                });
                              }}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[11px] transition cursor-pointer border border-slate-200"
                              title="Xuất JSON"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* Empty after filter */}
          {(Object.values(groupedTables) as DatabaseTable[][]).every(arr => arr.length === 0) && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Không tìm thấy bảng nào phù hợp với từ khóa "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* ============ TABLE PREVIEW MODAL ============ */}
      {previewTable && (
        <TablePreviewModal
          tableName={previewTable}
          meta={TABLE_META[previewTable]}
          onClose={() => setPreviewTable(null)}
        />
      )}
    </div>
  );
};

// ============================================
// TABLE PREVIEW MODAL
// ============================================
interface TablePreviewModalProps {
  tableName: string;
  meta?: TableMeta;
  onClose: () => void;
}

const TablePreviewModal: React.FC<TablePreviewModalProps> = ({
  tableName,
  meta,
  onClose,
}) => {
  const [data, setData] = useState<DatabaseTableData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  // Fetch data
  const loadData = React.useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const { adminApi } = await import('../../services/adminApi');
      const res = await adminApi.getTableData(tableName, { page: p, limit });
      setData({
        table: res.table,
        data: res.data,
        pagination: res.pagination,
      });
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [tableName, limit]);

  React.useEffect(() => {
    loadData(1);
  }, [loadData]);

  // Detect columns from data
  const columns = useMemo(() => {
    if (!data?.data || data.data.length === 0) return [];
    const firstRow = data.data[0];
    return Object.keys(firstRow);
  }, [data]);

  const sensitiveColumns = meta?.sensitiveColumns || [];
  const Icon = meta?.icon || Table;
  const label = meta?.label || tableName;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className={`px-6 py-4 ${meta?.color || 'bg-slate-100'} border-b ${meta?.borderColor || 'border-slate-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-white/70 border ${meta?.borderColor || 'border-slate-200'} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${meta?.textColor || 'text-slate-700'}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="font-mono">{tableName}</span>
                <span className="text-slate-400 font-normal text-sm">— {label}</span>
              </h3>
              <p className="text-xs text-slate-600">
                {data?.pagination.total || 0} bản ghi • Trang {page}/{data?.pagination.totalPages || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(page)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/60 hover:bg-white text-slate-700 border border-slate-200 cursor-pointer transition disabled:opacity-50"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/60 hover:bg-white text-slate-700 border border-slate-200 cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-auto">
          {isLoading && !data && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <span className="text-xs">Đang tải dữ liệu bảng {tableName}...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLoading && data && columns.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center font-bold bg-slate-100">#</th>
                      {columns.map((col: string) => {
                        const isSensitive = sensitiveColumns.includes(col);
                        return (
                          <th
                            key={col}
                            className={`py-2.5 px-3 font-bold whitespace-nowrap bg-slate-50 ${isSensitive ? 'text-rose-700' : ''}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px]">{col}</span>
                              {isSensitive && (
                                <span className="px-1 py-0.5 rounded text-[9px] bg-rose-100 text-rose-700 border border-rose-200">
                                  🔒
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data.data.map((row: Record<string, any>, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px] bg-slate-50/50">
                          {idx + 1}
                        </td>
                        {columns.map((col: string) => {
                          const rawValue = row[col];
                          const displayValue = maskValue(rawValue, col, sensitiveColumns);
                          const isSensitive = sensitiveColumns.includes(col);
                          const isLong = String(displayValue).length > 40;

                          return (
                            <td
                              key={col}
                              className={`py-2 px-3 whitespace-nowrap ${isSensitive ? 'font-mono text-rose-700 bg-rose-50/30' : 'text-slate-700'}`}
                              title={isLong ? String(displayValue) : undefined}
                            >
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {data.data.length === 0 && (
                      <tr>
                        <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400 italic">
                          Bảng này chưa có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && data && columns.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              Bảng này chưa có dữ liệu để hiển thị.
            </div>
          )}
        </div>

        {/* Footer — Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Hiển thị <strong>{(page - 1) * limit + 1}</strong> -{' '}
              <strong>{Math.min(page * limit, data.pagination.total)}</strong> /{' '}
              <strong>{data.pagination.total}</strong> bản ghi
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => loadData(page - 1)}
                className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-bold text-slate-700">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.pagination.totalPages || isLoading}
                onClick={() => loadData(page + 1)}
                className="p-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseBrowser;