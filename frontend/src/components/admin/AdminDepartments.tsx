// src/components/admin/AdminDepartments.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building,
  Plus,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  X,
  Save,
  AlertCircle,
  Loader2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { User } from '../../types/auth';

// ============================================
// TYPES
// ============================================
interface Department {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  order?: number;
  active: boolean;
  managerId?: string;
  pvtManagerId?: string;
  manager?: {
    id: string;
    username: string;
    fullName: string;
  };
  pvtManager?: {
    id: string;
    username: string;
    fullName: string;
  };
  users?: Array<{
    id: string;
    username: string;
    fullName: string;
    position?: string;
  }>;
}

interface AdminDepartmentsProps {
  allUsers: User[];
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// ============================================
// MAIN COMPONENT
// ============================================
export const AdminDepartments: React.FC<AdminDepartmentsProps> = ({
  allUsers,
  onShowToast,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    dept: Department | null;
  }>({ isOpen: false, mode: 'create', dept: null });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    dept: Department | null;
  }>({ isOpen: false, dept: null });

  // ============================================
  // LOAD DATA
  // ============================================
  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/departments', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments || []);
      } else {
        setError(data.message || 'Không thể tải phòng ban');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // ============================================
  // FILTER
  // ============================================
  const filteredDepts = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    const q = searchTerm.toLowerCase();
    return departments.filter(
      d =>
        d.code.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        (d.manager?.fullName || '').toLowerCase().includes(q) ||
        (d.pvtManager?.fullName || '').toLowerCase().includes(q)
    );
  }, [departments, searchTerm]);

  // ============================================
  // STATS
  // ============================================
  const stats = useMemo(() => {
    const total = departments.length;
    const withPvt = departments.filter(d => !!d.pvtManagerId).length;
    const withoutPvt = total - withPvt;
    const withManager = departments.filter(d => !!d.managerId).length;
    return { total, withPvt, withoutPvt, withManager };
  }, [departments]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleOpenCreate = () => {
    setEditModal({ isOpen: true, mode: 'create', dept: null });
  };

  const handleOpenEdit = (dept: Department) => {
    setEditModal({ isOpen: true, mode: 'edit', dept });
  };

  const handleOpenDelete = (dept: Department) => {
    setDeleteModal({ isOpen: true, dept });
  };

  const handleSave = async (formData: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const url =
        editModal.mode === 'create'
          ? '/api/departments'
          : `/api/departments/${editModal.dept?.id}`;

      const method = editModal.mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success || res.ok) {
        onShowToast?.(
          editModal.mode === 'create'
            ? `Đã tạo phòng ban "${formData.code}"`
            : `Đã cập nhật phòng ban "${formData.code}"`,
          'success'
        );
        setEditModal({ isOpen: false, mode: 'create', dept: null });
        await loadDepartments();
      } else {
        onShowToast?.(data.message || 'Lỗi lưu phòng ban', 'error');
      }
    } catch (err: any) {
      onShowToast?.(err.message || 'Lỗi kết nối', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.dept) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/departments/${deleteModal.dept.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        onShowToast?.(`Đã xóa phòng "${deleteModal.dept.code}"`, 'success');
        setDeleteModal({ isOpen: false, dept: null });
        await loadDepartments();
      } else {
        onShowToast?.(data.message || 'Không thể xóa', 'error');
      }
    } catch (err: any) {
      onShowToast?.(err.message || 'Lỗi kết nối', 'error');
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-5 animate-fadeIn font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Quản lý Phòng ban
            </h2>
            <p className="text-xs text-slate-500">
              {stats.total} phòng • {stats.withPvt} có PVT • {stats.withoutPvt} chưa phân
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDepartments}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm phòng ban</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Tổng phòng" value={stats.total} icon={Building} color="blue" />
        <StatCard label="Có PVT phụ trách" value={stats.withPvt} icon={ShieldCheck} color="emerald" />
        <StatCard label="Chưa phân PVT" value={stats.withoutPvt} icon={AlertCircle} color="amber" />
        <StatCard label="Có Trưởng phòng" value={stats.withManager} icon={UserCheck} color="purple" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo mã phòng, tên, trưởng phòng, PVT phụ trách..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white text-slate-800 pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
      {isLoading && departments.length === 0 && (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <span className="text-xs text-slate-500">Đang tải danh sách phòng ban...</span>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3 w-24">Mã phòng</th>
                  <th className="py-3 px-3 min-w-[200px]">Tên phòng</th>
                  <th className="py-3 px-3 w-52">Trưởng phòng</th>
                  <th className="py-3 px-3 w-52">PVT phụ trách</th>
                  <th className="py-3 px-3 w-20 text-center">Số CB</th>
                  <th className="py-3 px-3 w-24 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      {departments.length === 0
                        ? 'Chưa có phòng ban nào trong hệ thống'
                        : 'Không tìm thấy phòng ban phù hợp'}
                    </td>
                  </tr>
                ) : (
                  filteredDepts.map((dept, idx) => (
                    <tr key={dept.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold">
                          {dept.code}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{dept.name}</div>
                        {dept.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {dept.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {dept.manager ? (
                          <div>
                            <div className="font-bold text-slate-800">{dept.manager.fullName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              @{dept.manager.username}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                            <AlertCircle className="w-3 h-3" /> Chưa có
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {dept.pvtManager ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                            <span>{dept.pvtManager.fullName}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                            <AlertCircle className="w-3 h-3" /> Chưa phân
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          <Users className="w-3 h-3" />
                          {dept.users?.length || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(dept)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Sửa phòng ban"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(dept)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Xóa phòng ban"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <DepartmentEditModal
          mode={editModal.mode}
          department={editModal.dept}
          allUsers={allUsers}
          onClose={() => setEditModal({ isOpen: false, mode: 'create', dept: null })}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteModal.isOpen && deleteModal.dept && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold">Xác nhận xóa phòng ban</h3>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-700">
                Bạn có chắc chắn muốn xóa phòng <strong className="text-rose-700">"{deleteModal.dept.code}"</strong> — {deleteModal.dept.name}?
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Chỉ có thể xóa phòng khi không còn cán bộ nào bên trong.</span>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteModal({ isOpen: false, dept: null })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
              >
                Xóa phòng ban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// STAT CARD
// ============================================
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'emerald' | 'amber' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }[color];

  return (
    <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={`w-7 h-7 rounded-lg ${colors} border flex items-center justify-center`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
};

// ============================================
// EDIT MODAL
// ============================================
interface DepartmentEditModalProps {
  mode: 'create' | 'edit';
  department: Department | null;
  allUsers: User[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const DepartmentEditModal: React.FC<DepartmentEditModalProps> = ({
  mode,
  department,
  allUsers,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    code: department?.code || '',
    name: department?.name || '',
    shortName: department?.shortName || '',
    description: department?.description || '',
    managerId: department?.managerId || '',
    pvtManagerId: department?.pvtManagerId || '',
    order: department?.order || 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tpUsers = useMemo(
    () => allUsers.filter(u => u.role === 'TRUONG_PHONG'),
    [allUsers]
  );
  const pvtUsers = useMemo(
    () => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'),
    [allUsers]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.code.trim() || !formData.name.trim()) {
      setError('Vui lòng nhập mã phòng và tên phòng');
      return;
    }

    setIsSaving(true);
    await onSave({
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      shortName: formData.shortName.trim() || formData.code.trim().toUpperCase(),
      description: formData.description.trim() || null,
      managerId: formData.managerId || null,
      pvtManagerId: formData.pvtManagerId || null,
      order: Number(formData.order) || 0,
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-fadeIn">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {mode === 'create' ? 'Thêm phòng ban mới' : 'Cập nhật phòng ban'}
              </h3>
              <p className="text-xs text-blue-100">
                {mode === 'create' ? 'Tạo phòng ban nghiệp vụ mới' : `Đang sửa: ${department?.code}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã phòng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="TP1, TP2, PVT1..."
                disabled={mode === 'edit'}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold uppercase disabled:bg-slate-100 disabled:text-slate-500"
              />
              {mode === 'edit' && (
                <p className="mt-1 text-[10px] text-slate-500">Không thể sửa mã phòng</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên phòng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Phòng 1 (Án an ninh)"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mô tả
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả chức năng nhiệm vụ của phòng..."
              rows={2}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trưởng phòng
              </label>
              <select
                value={formData.managerId}
                onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">-- Chưa phân công --</option>
                {tpUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.roomCode}: {u.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Phó Viện trưởng phụ trách
              </label>
              <select
                value={formData.pvtManagerId}
                onChange={e => setFormData({ ...formData, pvtManagerId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">-- Chưa phân công --</option>
                {pvtUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.roomCode}: {u.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{mode === 'create' ? 'Tạo phòng ban' : 'Lưu thay đổi'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDepartments;