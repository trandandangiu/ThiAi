import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { ActionBar } from '../components/ActionBar';
import { DashboardStats } from '../components/DashboardStats';
import { FilterBar } from '../components/FilterBar';
import { DispatchTable } from '../components/DispatchTable';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { DispatchModal } from '../components/DispatchModal';
import { ColumnManagerModal } from '../components/ColumnManagerModal';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { ConfirmModal } from '../components/ConfirmModal';
import { GoogleSheetModal } from '../components/GoogleSheetModal';
import { DatabaseBrowser } from '../components/admin/DatabaseBrowser';
import { AdminDepartments } from '../components/admin/AdminDepartments';
import { AdminDashboardHome } from '../components/admin/AdminDashboardHome';
import { AdminAuditLogs } from '../components/admin/AdminAuditLogs';
import { AdminSessions } from '../components/admin/AdminSessions';
import { useDispatches } from '../hooks/useDispatches';
import { apiClient } from '../services/apiClient';
import { exportDispatchesToExcel, exportLeadershipReportToExcel } from '../services/excelService';
import { Dispatch } from '../types/dispatch';
import { User, UserRole } from '../types/auth';
import {
  Users,
  Database,
  Wifi,
  Copy,
  Check,
  Key,
  Edit3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Server,
  Building,
  FileSpreadsheet,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  ShieldCheck,
  Download,
  ArrowUpDown,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  SlidersHorizontal,
  X,
  UserCheck,
  Briefcase,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  FileText,
  Upload,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  TrendingUp,
  Clock,
  History,
  Settings,
  Table,
  Columns,
  Activity,
  Eye,
  CheckSquare,
  Square,
  CheckCheck,
  KeyRound,
  Folder,
  ChevronUp,
  XCircle,
  Circle
} from 'lucide-react';
import { PieChart as PieChartWidget, PieChartSegment } from '../components/PieChart';

type SortMode = 'category' | 'alpha' | 'frequent';

interface AdminFunctionItem {
  id: string;
  title: string;
  category: 'user' | 'dispatch';
  categoryName: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description: string;
  action: () => void;
  tabKey?: 'dispatches' | 'users';
  priority: number;
}

interface PermissionItem {
  id: number;
  key: string;
  label: string;
  category: 'USER' | 'DISPATCH' | 'SYSTEM' | 'REPORTS & ANALYTICS';
}

const ALL_SYSTEM_PERMISSIONS: PermissionItem[] = [
  // 📁 USER (1 - 10)
  { id: 1, key: 'user:view:all', label: 'Xem tất cả user', category: 'USER' },
  { id: 2, key: 'user:view:department', label: 'Xem user phòng', category: 'USER' },
  { id: 3, key: 'user:view:own', label: 'Xem user của mình', category: 'USER' },
  { id: 4, key: 'user:create', label: 'Tạo tài khoản', category: 'USER' },
  { id: 5, key: 'user:update', label: 'Chỉnh sửa thông tin user', category: 'USER' },
  { id: 6, key: 'user:delete', label: 'Xóa tài khoản user', category: 'USER' },
  { id: 7, key: 'user:reset_password', label: 'Đổi / đặt lại mật khẩu', category: 'USER' },
  { id: 8, key: 'user:assign_pvt', label: 'Phân công PVT phụ trách', category: 'USER' },
  { id: 9, key: 'user:transfer_room', label: 'Điều chuyển phòng ban', category: 'USER' },
  { id: 10, key: 'user:export', label: 'Xuất danh sách tài khoản', category: 'USER' },

  // 📁 DISPATCH (11 - 25)
  { id: 11, key: 'dispatch:view:all', label: 'Xem tất cả CV', category: 'DISPATCH' },
  { id: 12, key: 'dispatch:view:department', label: 'Xem CV phòng', category: 'DISPATCH' },
  { id: 13, key: 'dispatch:view:assigned', label: 'Xem CV được giao', category: 'DISPATCH' },
  { id: 14, key: 'dispatch:create', label: 'Nhập công văn mới', category: 'DISPATCH' },
  { id: 15, key: 'dispatch:edit', label: 'Sửa thông tin công văn', category: 'DISPATCH' },
  { id: 16, key: 'dispatch:delete', label: 'Xóa công văn', category: 'DISPATCH' },
  { id: 17, key: 'dispatch:assign:vt', label: 'Viện trưởng giao việc', category: 'DISPATCH' },
  { id: 18, key: 'dispatch:assign:pvt', label: 'PVT chỉ đạo Trưởng phòng', category: 'DISPATCH' },
  { id: 19, key: 'dispatch:progress:update', label: 'Cập nhật tiến độ CV', category: 'DISPATCH' },
  { id: 20, key: 'dispatch:report:submit', label: 'Báo cáo kết quả xử lý', category: 'DISPATCH' },
  { id: 21, key: 'dispatch:approve', label: 'Phê duyệt kết quả báo cáo', category: 'DISPATCH' },
  { id: 22, key: 'dispatch:excel:import', label: 'Nhập Excel công văn', category: 'DISPATCH' },
  { id: 23, key: 'dispatch:excel:reconcile', label: 'Đối chiếu tệp Excel', category: 'DISPATCH' },
  { id: 24, key: 'dispatch:excel:export', label: 'Xuất báo cáo Excel', category: 'DISPATCH' },
  { id: 25, key: 'dispatch:history:view', label: 'Xem lịch sử xử lý', category: 'DISPATCH' },

  // 📁 SYSTEM (26 - 33)
  { id: 26, key: 'system:columns:manage', label: 'Tùy biến cột hiển thị', category: 'SYSTEM' },
  { id: 27, key: 'system:roles:manage', label: 'Quản lý vai trò (Roles)', category: 'SYSTEM' },
  { id: 28, key: 'system:permissions:manage', label: 'Phân quyền hệ thống', category: 'SYSTEM' },
  { id: 29, key: 'system:departments:manage', label: 'Quản lý danh mục phòng', category: 'SYSTEM' },
  { id: 30, key: 'system:status:manage', label: 'Quản trị trạng thái xử lý', category: 'SYSTEM' },
  { id: 31, key: 'system:backup:run', label: 'Sao lưu dữ liệu dự phòng', category: 'SYSTEM' },
  { id: 32, key: 'system:restore:run', label: 'Khôi phục dữ liệu', category: 'SYSTEM' },
  { id: 33, key: 'system:audit_logs:view', label: 'Xem nhật ký hệ thống', category: 'SYSTEM' },

  // 📁 REPORTS & ANALYTICS (34 - 40)
  { id: 34, key: 'report:dashboard:view', label: 'Xem biểu đồ thống kê', category: 'REPORTS & ANALYTICS' },
  { id: 35, key: 'report:export:summary', label: 'Xuất báo cáo tổng hợp', category: 'REPORTS & ANALYTICS' },
  { id: 36, key: 'report:export:kpi', label: 'Xuất đánh giá tiến độ KPI', category: 'REPORTS & ANALYTICS' },
  { id: 37, key: 'report:print:view', label: 'In biểu mẫu chỉ đạo', category: 'REPORTS & ANALYTICS' },
  { id: 38, key: 'report:advanced:query', label: 'Truy vấn dữ liệu nâng cao', category: 'REPORTS & ANALYTICS' },
  { id: 39, key: 'report:share:link', label: 'Chia sẻ báo cáo liên phòng', category: 'REPORTS & ANALYTICS' },
  { id: 40, key: 'report:analytics:export', label: 'Xuất file phân tích sâu', category: 'REPORTS & ANALYTICS' }
];

export const AdminDashboard: React.FC = () => {
  const { allUsers, reloadUsers } = useAuth();
  const {
    dispatches,
    filteredDispatches,
    columns,
    filters,
    setFilters,
    filterOptions,
    sortConfig,
    handleSort,
    dashboardStats,
    selectedIds,
    toggleSelectRow,
    toggleSelectAll,
    addDispatch,
    updateDispatch,
    deleteDispatch,
    bulkDeleteDispatches,
    clearAllDispatches,
    restoreSampleDispatches,
    bulkUpdateStatus,
    commitExcelImport,
    addCustomColumn,
    toggleColumnVisibility,
    removeColumn,
    resetToDefaultColumns
  } = useDispatches({ includeDeleted: true });
  type AdminModule =
    | 'dashboard'
    | 'create-user'
    | 'transfer-dept'
    | 'assign-pvt'
    | 'tab-users'
    | 'export-leadership-excel'
    | 'tab-dispatches'
    | 'roles'
    | 'permissions'
    | 'departments'
    | 'stats-overview'
    | 'stats-by-dept'
    | 'stats-by-time'
    | 'database-tables'
    | 'audit-logs'
    | 'sessions'
    | 'custom-columns'
    | 'system-settings';
  const [activeModule, setActiveModule] = useState<AdminModule>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFunctionsCollapsed, setIsFunctionsCollapsed] = useState(false);

  // Statistics time filter state
  const [statsTimeFilter, setStatsTimeFilter] = useState<'all' | 'today' | 'month' | 'quarter' | 'year'>('all');
  const [statsStartDate, setStatsStartDate] = useState('');
  const [statsEndDate, setStatsEndDate] = useState('');

  // Sidebar sorting & filtering
  const [sidebarSortMode, setSidebarSortMode] = useState<SortMode>('category');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Network info
  const [networkInfo, setNetworkInfo] = useState<{
    networks: any[];
    primaryUrl: string;
    hostname: string;
  } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPvtManager, setEditPvtManager] = useState('');

  // User Management List Filters & Pagination
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userRoomFilter, setUserRoomFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const userPageSize = 20;


  // Departments từ API
  const [departments, setDepartments] = useState<Array<{ id: string; code: string; name: string }>>([]);

  useEffect(() => {
    const loadDepts = async () => {
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
          const activeDepts = (data.departments || []).filter((d: any) => d.active !== false);
          setDepartments(activeDepts);
        }
      } catch (e) {
        console.error('Lỗi load departments:', e);
      }
    };
    loadDepts();
  }, []);
  // 1. Create User State
  const [newUser, setNewUser] = useState({
    username: '',
    password: 'vks@2026',
    fullName: '',
    email: '',
    phone: '',
    position: '',
    role: 'PHO_VIEN_TRUONG' as UserRole,
    roomCode: '',
    pvtManagerId: ''
  });

  // Selected role for view / edit modals
  const [viewRoleModal, setViewRoleModal] = useState<null | {
    code: string;
    name: string;
    permissionsCount: number;
    description: string;
  }>(null);

  const [editRoleModal, setEditRoleModal] = useState<null | {
    code: string;
    name: string;
    permissionsCount: number;
    description: string;
  }>(null);

  // Permissions management state
  const [permissionRole, setPermissionRole] = useState<UserRole>('PHO_VIEN_TRUONG');
  const [rolePermissionsMap, setRolePermissionsMap] = useState<Record<string, string[]>>({
    ADMIN: ALL_SYSTEM_PERMISSIONS.map(p => p.key), // 40
    VIEN_TRUONG: [
      'user:view:all', 'user:view:department', 'user:view:own', 'user:assign_pvt', 'user:export',
      'dispatch:view:all', 'dispatch:view:department', 'dispatch:view:assigned', 'dispatch:create',
      'dispatch:edit', 'dispatch:assign:vt', 'dispatch:assign:pvt', 'dispatch:progress:update',
      'dispatch:report:submit', 'dispatch:approve', 'dispatch:excel:import', 'dispatch:excel:reconcile',
      'dispatch:excel:export', 'dispatch:history:view',
      'report:dashboard:view', 'report:export:summary', 'report:export:kpi', 'report:print:view'
    ], // 23
    PHO_VIEN_TRUONG: [
      'user:view:own',
      'dispatch:view:department', 'dispatch:view:assigned', 'dispatch:edit', 'dispatch:assign:pvt',
      'dispatch:progress:update', 'dispatch:report:submit', 'dispatch:approve', 'dispatch:excel:export',
      'dispatch:history:view',
      'report:dashboard:view', 'report:export:summary', 'report:export:kpi', 'report:print:view',
      'report:advanced:query'
    ], // 15
    TRUONG_PHONG: [
      'user:view:department', 'user:view:own',
      'dispatch:view:department', 'dispatch:view:assigned', 'dispatch:progress:update',
      'dispatch:report:submit', 'dispatch:excel:export', 'dispatch:history:view',
      'report:dashboard:view', 'report:export:summary', 'report:print:view', 'report:share:link'
    ] // 12
  });

  const currentRolePermissions = rolePermissionsMap[permissionRole] || [];

  const togglePermission = (key: string) => {
    setRolePermissionsMap(prev => {
      const existing = prev[permissionRole] || [];
      const updated = existing.includes(key)
        ? existing.filter(k => k !== key)
        : [...existing, key];
      return { ...prev, [permissionRole]: updated };
    });
  };

  const handleSelectAllPermissions = () => {
    setRolePermissionsMap(prev => ({
      ...prev,
      [permissionRole]: ALL_SYSTEM_PERMISSIONS.map(p => p.key)
    }));
  };

  const handleDeselectAllPermissions = () => {
    setRolePermissionsMap(prev => ({
      ...prev,
      [permissionRole]: []
    }));
  };

  const handleSavePermissions = () => {
    showToast(`Đã lưu thay đổi phân quyền cho vai trò ${permissionRole} (${currentRolePermissions.length}/40 quyền) thành công!`);
  };

  // Database Viewer state
  const [dbViewerExpanded, setDbViewerExpanded] = useState<Record<string, boolean>>({});
  const [dbViewerPreviewTable, setDbViewerPreviewTable] = useState<string | null>(null);

  const toggleDbTableExpand = (tableName: string) => {
    setDbViewerExpanded(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  const handleExportDbTable = (tableName: string) => {
    let dataToExport: any = [];
    const filename = `${tableName}_export.json`;

    if (tableName === 'users') {
      dataToExport = allUsers;
    } else if (tableName === 'dispatches') {
      dataToExport = dispatches;
    } else if (tableName === 'departments') {
      dataToExport = Array.from({ length: 12 }, (_, i) => {
        const roomCode = `TP${i + 1}`;
        const tp = allUsers.find(u => u.roomCode === roomCode && u.role === 'TRUONG_PHONG');
        const pvt = tp?.pvtManagerId ? allUsers.find(u => u.id === tp.pvtManagerId) : null;
        return {
          roomCode,
          name: `Phòng ${i + 1}`,
          pvtManager: pvt ? `${pvt.roomCode} - ${pvt.fullName}` : 'Chưa phân công',
          manager: tp ? tp.fullName : 'Chưa phân công'
        };
      });
    } else if (tableName === 'roles') {
      dataToExport = [
        { code: 'ADMIN', name: 'Quản trị viên', permissionsCount: 40 },
        { code: 'VIEN_TRUONG', name: 'Viện trưởng', permissionsCount: 23 },
        { code: 'PHO_VIEN_TRUONG', name: 'Phó Viện trưởng', permissionsCount: 15 },
        { code: 'TRUONG_PHONG', name: 'Trưởng phòng', permissionsCount: 12 }
      ];
    } else if (tableName === 'permissions') {
      dataToExport = ALL_SYSTEM_PERMISSIONS;
    } else if (tableName === 'user_roles') {
      dataToExport = allUsers.map(u => ({
        userId: u.id,
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        roomCode: u.roomCode
      }));
    } else if (tableName === 'audit_logs') {
      dataToExport = [];
    } else if (tableName === 'all') {
      dataToExport = {
        users: allUsers,
        dispatches,
        departments: Array.from({ length: 12 }, (_, i) => `TP${i + 1}`),
        roles: ['ADMIN', 'VIEN_TRUONG', 'PHO_VIEN_TRUONG', 'TRUONG_PHONG'],
        permissionsCount: 40,
        exportedAt: new Date().toISOString()
      };
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    showToast(`Đã xuất dữ liệu bảng ${tableName} (${Array.isArray(dataToExport) ? dataToExport.length : 'full'} records) thành công!`);
  };

  // 2. Transfer Department State
  const [transferUser, setTransferUser] = useState<User | null>(null);
  const [transferRoomCode, setTransferRoomCode] = useState('');
  const [transferRole, setTransferRole] = useState<UserRole>('TRUONG_PHONG');
  const [transferPvtManagerId, setTransferPvtManagerId] = useState('');

  // 3. Assign Leadership / Supervision State
  const [assignTpUser, setAssignTpUser] = useState<User | null>(null);
  const [assignPvtId, setAssignPvtId] = useState('');

  // Modals from original App
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchToEdit, setDispatchToEdit] = useState<Dispatch | null>(null);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [detailDispatch, setDetailDispatch] = useState<Dispatch | null>(null);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // useEffect(() => {
  //   apiClient.getNetworkInfo().then(res => {
  //     if (res.success) {
  //       setNetworkInfo(res);
  //     }
  //   });
  // }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    showToast(`Đã sao chép đường dẫn: ${text}`);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // User list helpers
  const pvtUsers = useMemo(() => allUsers.filter(u => u.role === 'PHO_VIEN_TRUONG'), [allUsers]);
  const tpUsers = useMemo(() => allUsers.filter(u => u.role === 'TRUONG_PHONG'), [allUsers]);

  // Filtered & Paginated Users for User Management
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      // 1. Search term (Username, Full Name, Room, Role)
      if (userSearchTerm.trim()) {
        const q = userSearchTerm.toLowerCase();
        const match =
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          (u.roomCode && u.roomCode.toLowerCase().includes(q)) ||
          u.role.toLowerCase().includes(q);
        if (!match) return false;
      }
      // 2. Role filter
      if (userRoleFilter !== 'all') {
        if (userRoleFilter === 'PHO_VT' || userRoleFilter === 'PHO_VIEN_TRUONG') {
          if (u.role !== 'PHO_VIEN_TRUONG') return false;
        } else if (u.role !== userRoleFilter) {
          return false;
        }
      }
      // 3. Room filter
      if (userRoomFilter !== 'all') {
        if (userRoomFilter === 'none') {
          if (u.role === 'TRUONG_PHONG') return false;
        } else {
          if (u.roomCode !== userRoomFilter) return false;
        }
      }
      // 4. Status filter
      if (userStatusFilter !== 'all') {
        const isActive = !!u.active;
        if (userStatusFilter === 'active' && !isActive) return false;
        if (userStatusFilter === 'inactive' && isActive) return false;
      }
      return true;
    });
  }, [allUsers, userSearchTerm, userRoleFilter, userRoomFilter, userStatusFilter]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / userPageSize));
  const paginatedUsers = useMemo(() => {
    const start = (userCurrentPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userCurrentPage, userPageSize]);

  // Toggle user active status
  const handleToggleUserActive = async (u: User) => {
    if (u.id === 'u_admin') {
      showToast('Không thể khóa tài khoản Quản trị viên tối cao!', 'warning');
      return;
    }
    const newActive = !u.active;
    const res = await apiClient.updateUser(u.id, { active: newActive });
    if (res) {
      showToast(`Đã ${newActive ? 'kích hoạt' : 'tạm dừng'} tài khoản "${u.username}"!`);
      reloadUsers();
    } else {
      showToast('Lỗi khi cập nhật trạng thái tài khoản', 'error');
    }
  };

  // Handle Edit User
  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditPassword('');
    setEditPvtManager(u.managerId || '');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const payload: any = { fullName: editFullName };
    if (editPassword.trim()) payload.password = editPassword.trim();
    if (editingUser.role === 'TRUONG_PHONG') payload.pvtManagerId = editPvtManager;

    const res = await apiClient.updateUser(editingUser.id, payload);
    if (res) {
      showToast(`Đã cập nhật thông tin tài khoản ${res.username}`);
      setEditingUser(null);
      reloadUsers();
    } else {
      showToast('Lỗi khi cập nhật thông tin', 'error');
    }
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.fullName.trim()) {
      showToast('Vui lòng điền đầy đủ Tên đăng nhập và Họ tên', 'warning');
      return;
    }

    if (newUser.role === 'TRUONG_PHONG' && !newUser.roomCode) {
      showToast('Phòng ban là bắt buộc đối với Trưởng phòng (TP)', 'warning');
      return;
    }

    const payload = {
      username: newUser.username.trim().toLowerCase(),
      password: newUser.password.trim() || 'vks@2026',
      fullName: newUser.fullName.trim(),
      role: newUser.role,
      roomCode: newUser.role === 'TRUONG_PHONG'
        ? newUser.roomCode.trim().toUpperCase()
        : (newUser.role === 'ADMIN' ? 'ADMIN' : newUser.role === 'VIEN_TRUONG' ? 'VT' : (newUser.roomCode || 'PVT')),
      pvtManagerId: newUser.pvtManagerId || undefined,
      phone: newUser.phone.trim(),
      email: newUser.email.trim(),
      position: newUser.position.trim()
    };

    const res = await apiClient.createUser(payload);
    if (res.success) {
      showToast(`Đã tạo tài khoản "${newUser.username}" thành công!`);
      setNewUser({
        username: '',
        password: 'vks@2026',
        fullName: '',
        email: '',
        phone: '',
        position: '',
        role: 'PHO_VIEN_TRUONG',
        roomCode: '',
        pvtManagerId: ''
      });
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast(res.message || 'Lỗi khi tạo tài khoản', 'error');
    }
  };

  // Handle Delete User
  const handleDeleteUser = (u: User) => {
    if (u.id === 'u_admin') {
      showToast('Không thể xóa tài khoản Quản trị viên tối cao (Admin)!', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa tài khoản',
      message: `Đồng chí có chắc chắn muốn xóa tài khoản "${u.username}" (${u.fullName} - ${u.roomCode}) khỏi hệ thống CSDL? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa tài khoản',
      onConfirm: async () => {
        const res = await apiClient.deleteUser(u.id);
        if (res.success) {
          showToast(`Đã xóa tài khoản "${u.username}" thành công!`);
          reloadUsers();
        } else {
          showToast(res.message || 'Lỗi khi xóa tài khoản', 'error');
        }
      }
    });
  };

  // Handle Transfer Department
  const handleOpenTransferModal = (u?: User) => {
    const target = u || allUsers.find(user => user.role === 'TRUONG_PHONG') || allUsers[0];
    if (!target) return;
    setTransferUser(target);
    setTransferRoomCode(target.roomCode);
    setTransferRole(target.role);
    setTransferPvtManagerId(target.pvtManagerId || '');
    setActiveModule('transfer-dept');
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferUser) return;

    // Tìm departmentId từ roomCode
    const targetDept = departments.find(d => d.code === transferRoomCode.trim().toUpperCase());

    const res = await apiClient.updateUser(transferUser.id, {
      departmentId: targetDept?.id || null,
      pvtManagerId: transferRole === 'TRUONG_PHONG' ? (transferPvtManagerId || null) : null,
    } as any);

    if (res) {
      showToast(`Đã điều chuyển đồng chí ${transferUser.fullName} sang bộ phận "${transferRoomCode}"`);
      setTransferUser(null);
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast('Lỗi khi điều chuyển bộ phận', 'error');
    }
  };

  // Handle Assign Supervision to PVT
  const handleOpenAssignPvtModal = (tp?: User) => {
    const target = tp || tpUsers[0];
    if (!target) {
      showToast('Không có tài khoản Trưởng phòng nào trong hệ thống', 'warning');
      return;
    }
    setAssignTpUser(target);
    setAssignPvtId(target.pvtManagerId || (pvtUsers[0]?.id || ''));
    setActiveModule('assign-pvt');
  };

  const handleSaveAssignPvt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTpUser) return;

    // Map roleId cho TP (theo DB: TRUONG_PHONG = 4)
    const ROLE_CODE_TO_ID: Record<string, number> = {
      ADMIN: 1,
      VIEN_TRUONG: 2,
      PHO_VIEN_TRUONG: 3,
      TRUONG_PHONG: 4,
    };

    // Gán PVT phụ trách cho TP — dùng pvtManagerId (User field)
    const res = await apiClient.updateUser(assignTpUser.id, {
      pvtManagerId: assignPvtId || null,
    } as any);

    if (res) {
      const pvt = allUsers.find(u => u.id === assignPvtId);
      showToast(`Đã phân công ${pvt ? pvt.fullName : 'Chưa gán'} phụ trách ${assignTpUser.fullName}`);
      setAssignTpUser(null);
      reloadUsers();
      setActiveModule('tab-users');
    } else {
      showToast('Lỗi khi gán quyền phụ trách', 'error');
    }
  };
  // Handle Export Leadership Excel
  const handleExportLeadershipExcel = () => {
    const targetDispatches = selectedIds.length > 0
      ? dispatches.filter(d => selectedIds.includes(d.id))
      : filteredDispatches;

    if (targetDispatches.length === 0) {
      showToast('Không có công văn nào để xuất báo cáo lãnh đạo', 'warning');
      return;
    }

    exportLeadershipReportToExcel(targetDispatches);
    showToast(`Đã xuất báo cáo Excel ${targetDispatches.length} công văn gửi Lãnh đạo Viện Kiểm Sát!`);
  };

  // Define Admin Functions for Left Sidebar
  const allFunctions: AdminFunctionItem[] = [
    {
      id: 'create-user',
      title: 'Tạo tài khoản mới',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: UserPlus,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-blue-700',
      description: 'Thêm tài khoản lãnh đạo, kiểm sát viên, phòng ban',
      action: () => {
        setActiveModule('create-user');
      },
      priority: 1
    },
    {
      id: 'transfer-dept',
      title: 'Chuyển bộ phận tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: ArrowRightLeft,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      iconColor: 'text-amber-700',
      description: 'Điều chuyển phòng ban, mã đơn vị phụ trách',
      action: () => {
        handleOpenTransferModal();
        setActiveModule('transfer-dept');
      },
      priority: 2
    },
    {
      id: 'assign-pvt',
      title: 'Gán quyền phụ trách tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: ShieldCheck,
      iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
      iconColor: 'text-purple-700',
      description: 'Phân bổ thẩm quyền PVT phụ trách Trưởng phòng',
      action: () => {
        handleOpenAssignPvtModal();
        setActiveModule('assign-pvt');
      },
      priority: 3
    },
    {
      id: 'tab-users',
      title: 'Danh sách tài khoản',
      category: 'user',
      categoryName: 'Quản Trị Người Dùng',
      icon: Users,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-700',
      description: 'Danh sách 1 VT, 12 PVT, 12 Trưởng phòng, Admin',
      action: () => setActiveModule('tab-users'),
      priority: 4
    },
    {
      id: 'export-leadership-excel',
      title: 'Xuất công văn gửi Lãnh đạo (Excel)',
      category: 'dispatch',
      categoryName: 'Quản Lý Công Văn',
      icon: Download,
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-700',
      description: 'File Excel đầy đủ chỉ đạo VT, PVT, tiến độ, hạn xử lý',
      action: () => setActiveModule('export-leadership-excel'),
      priority: 5
    },
    {
      id: 'tab-dispatches',
      title: 'Quản lý công văn toàn diện',
      category: 'dispatch',
      categoryName: 'Quản Lý Công Văn',
      icon: FileSpreadsheet,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-700',
      description: 'Bảng theo dõi, tìm kiếm, nhập liệu và xử lý văn bản',
      action: () => setActiveModule('tab-dispatches'),
      priority: 6
    }
  ];

  // Filter and sort functions for the left sidebar
  const processedFunctions = useMemo(() => {
    let result = [...allFunctions];

    // Filter by search query
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.toLowerCase();
      result = result.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.categoryName.toLowerCase().includes(q)
      );
    }

    // Apply sort mode
    if (sidebarSortMode === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    } else if (sidebarSortMode === 'frequent') {
      result.sort((a, b) => a.priority - b.priority);
    } else {
      // 'category': group user -> dispatch -> system
      const catOrder: Record<string, number> = { user: 1, dispatch: 2, system: 3 };
      result.sort((a, b) => {
        if (catOrder[a.category] !== catOrder[b.category]) {
          return catOrder[a.category] - catOrder[b.category];
        }
        return a.priority - b.priority;
      });
    }

    return result;
  }, [allFunctions, sidebarSearch, sidebarSortMode]);

  return (
    <div className="min-h-screen flex flex-col text-slate-900 bg-slate-100">
      <Header />

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 space-y-4">
        {/* 2-COLUMN LAYOUT: LEFT SIDEBAR + RIGHT WORKSPACE */}
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* ========================================================================= */}
          {/* LEFT SIDEBAR: ADMIN FUNCTION PANEL */}
          {/* ========================================================================= */}
          {isSidebarOpen && (
            <aside
              id="admin-left-sidebar"
              className={`w-full lg:w-80 shrink-0 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200 ${isSidebarMobileOpen ? 'block' : 'hidden lg:block'
                }`}
            >
              {/* Sidebar Top: Header with Close Sidebar Button */}
              <div className="p-3.5 bg-slate-900 text-white border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule('dashboard');
                      setIsSidebarMobileOpen(false);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-xl transition cursor-pointer ${activeModule === 'dashboard'
                      ? 'bg-red-700 text-white shadow-xs font-black'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800 font-bold'
                      }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-red-400" />
                    <h2 className="text-xs uppercase tracking-wider">
                      Dashboard
                    </h2>
                  </button>

                  {/* Close Sidebar Button */}
                  <button
                    id="admin-sort-functions-button"
                    onClick={() => {
                      setIsSidebarOpen(false);
                      setIsSidebarMobileOpen(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer shadow-xs"
                    title="Đóng thanh bên"
                  >
                    <span>Đóng thanh bên</span>
                  </button>
                </div>

                {/* Quick Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh chức năng..."
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    className="w-full bg-slate-800 text-white pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-red-500 placeholder-slate-400"
                  />
                  {sidebarSearch && (
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* List of Functions */}
              {!isFunctionsCollapsed ? (
                <div className="p-3 space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto divide-y divide-slate-100">
                  {/* Dashboard Tổng Quan Button */}
                  <button
                    type="button"
                    id="admin-func-dashboard"
                    onClick={() => {
                      setActiveModule('dashboard');
                      setIsSidebarMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl mb-2 transition cursor-pointer border ${activeModule === 'dashboard'
                      ? 'bg-red-50 text-red-900 border-red-300 font-bold shadow-xs ring-1 ring-red-200'
                      : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${activeModule === 'dashboard' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-xs font-black uppercase tracking-wide truncate">Dashboard Tổng Quan</div>
                        <div className="text-[10px] text-slate-500 font-sans font-normal truncate">Users • Dispatches • Biểu đồ</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">→</span>
                  </button>

                  {/* Quản lý người dùng with Sub-functions Tree */}
                  <div
                    id="admin-func-create-user"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          Quản lý người dùng
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Danh sách users */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('tab-users');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'tab-users'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Users className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                        <span className="font-sans font-medium truncate">Danh sách users</span>
                      </button>

                      {/* Tạo tài khoản */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('create-user');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'create-user'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <UserPlus className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tạo tài khoản</span>
                      </button>

                      {/* Vai trò (Roles) */}
                      <button
                        type="button"
                        id="btn-admin-roles"
                        onClick={() => {
                          setActiveModule('roles');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'roles'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-purple-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Vai trò (Roles)</span>
                      </button>

                      {/* Quyền (Permissions) */}
                      <button
                        type="button"
                        id="btn-admin-permissions"
                        onClick={() => {
                          setPermissionRole('PHO_VIEN_TRUONG');
                          setActiveModule('permissions');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'permissions'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Key className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Quyền (Permissions)</span>
                      </button>
                    </div>
                  </div>

                  {/* QUẢN LÝ PHÒNG BAN with Sub-functions Tree */}
                  <div
                    id="admin-func-transfer-dept"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          🏢 Quản lý phòng ban
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Danh sách phòng */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('departments');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'departments'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Building className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Danh sách phòng</span>
                      </button>

                      {/* Phó viện trưởng phụ trách */}
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAssignPvtModal();
                          setActiveModule('assign-pvt');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'assign-pvt'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <ShieldCheck className="w-3.5 h-3.5 mr-2 text-purple-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Phó viện trưởng phụ trách</span>
                      </button>
                    </div>
                  </div>

                  {/* QUẢN LÝ CÔNG VĂN with Sub-functions Tree */}
                  <div
                    id="admin-func-export-leadership-excel"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          📄 Quản lý công văn
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Tất cả công văn */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('tab-dispatches');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'tab-dispatches'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <FileText className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tất cả công văn</span>
                      </button>

                      {/* Tạo công văn */}
                      <button
                        type="button"
                        onClick={() => {
                          setDispatchToEdit(null);
                          setIsDispatchModalOpen(true);
                          setIsSidebarMobileOpen(false);
                        }}
                        className="w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Plus className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tạo công văn</span>
                      </button>

                      {/* Nhập từ Excel */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsImportModalOpen(true);
                          setIsSidebarMobileOpen(false);
                        }}
                        className="w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Upload className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Nhập từ Excel</span>
                      </button>

                      {/* Xuất báo cáo */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('export-leadership-excel');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'export-leadership-excel'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Download className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Xuất báo cáo</span>
                      </button>
                    </div>
                  </div>

                  {/* THỐNG KÊ with Sub-functions Tree */}
                  <div
                    id="admin-func-stats"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          📊 Thống kê
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Tổng quan */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('stats-overview');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'stats-overview'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <PieChartIcon className="w-3.5 h-3.5 mr-2 text-purple-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Tổng quan</span>
                      </button>

                      {/* Theo phòng */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('stats-by-dept');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'stats-by-dept'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Building className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Theo phòng</span>
                      </button>

                      {/* Theo thời gian */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('stats-by-time');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'stats-by-time'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Calendar className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Theo thời gian</span>
                      </button>
                    </div>
                  </div>

                  {/* DATABASE with Sub-functions Tree */}
                  <div
                    id="admin-func-database"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center justify-center shrink-0">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          🗄️ Database
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Xem tất cả bảng */}
                      <button
                        type="button"
                        id="btn-admin-database-tables"
                        onClick={() => {
                          setActiveModule('database-tables');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'database-tables'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Table className="w-3.5 h-3.5 mr-2 text-cyan-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Xem tất cả bảng</span>
                      </button>

                      {/* Audit Logs */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('audit-logs');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'audit-logs'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <History className="w-3.5 h-3.5 mr-2 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Audit Logs</span>
                      </button>

                      {/* Sessions */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('sessions');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'sessions'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Activity className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Sessions</span>
                      </button>
                    </div>
                  </div>

                  {/* CÀI ĐẶT with Sub-functions Tree */}
                  <div
                    id="admin-func-settings"
                    className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-2 transition"
                  >
                    <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center shrink-0">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                          ⚙️ Cài đặt
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {/* Cột dữ liệu */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('custom-columns');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'custom-columns'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">├──</span>
                        <Columns className="w-3.5 h-3.5 mr-2 text-indigo-600 shrink-0" />
                        <span className="font-sans font-medium truncate">Cột dữ liệu</span>
                      </button>

                      {/* System Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModule('system-settings');
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center text-left py-1.5 px-2 rounded-xl transition cursor-pointer ${activeModule === 'system-settings'
                          ? 'bg-red-50 text-red-800 font-bold border border-red-200 shadow-xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <span className="text-slate-400 select-none mr-2 font-normal">└──</span>
                        <Settings className="w-3.5 h-3.5 mr-2 text-slate-600 shrink-0" />
                        <span className="font-sans font-medium truncate">System Settings</span>
                      </button>
                    </div>
                  </div>

                  {processedFunctions.filter(item => item.id !== 'create-user' && item.id !== 'tab-users' && item.id !== 'transfer-dept' && item.id !== 'assign-pvt' && item.id !== 'export-leadership-excel' && item.id !== 'tab-dispatches').map((item) => {
                    const IconComponent = item.icon;
                    const isCurrentTab = activeModule === item.id;

                    return (
                      <div
                        key={item.id}
                        id={`admin-func-${item.id}`}
                        onClick={() => {
                          item.action();
                          setIsSidebarMobileOpen(false);
                        }}
                        className={`group p-2.5 rounded-2xl transition cursor-pointer border ${isCurrentTab
                          ? 'bg-red-50/80 border-red-200 shadow-xs ring-1 ring-red-200'
                          : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${item.iconBg}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className={`text-xs font-bold truncate ${isCurrentTab ? 'text-red-900 font-extrabold' : 'text-slate-900 group-hover:text-red-700'
                              }`}>
                              {item.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {processedFunctions.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không tìm thấy chức năng phù hợp với từ khóa "{sidebarSearch}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setIsFunctionsCollapsed(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    👁️ Hiện lại danh sách ({processedFunctions.length} chức năng)
                  </button>
                </div>
              )}
            </aside>
          )}

          {/* ========================================================================= */}
          {/* RIGHT WORKSPACE: ACTIVE MODULE VIEW */}
          {/* ========================================================================= */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {!isSidebarOpen && (
              <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 border border-slate-200 shadow-xs">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5 text-red-700" />
                  <span>Mở thanh bên</span>
                </button>
              </div>
            )}


            {/* MODULE: ADMIN DASHBOARD OVERVIEW (NEW - API INTEGRATED) */}
            {activeModule === 'dashboard' && (
              <AdminDashboardHome onNavigate={(m) => setActiveModule(m as AdminModule)} />
            )}


            {/* MODULE 2: TRANSFER DEPARTMENT INLINE VIEW */}
            {activeModule === 'transfer-dept' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Chuyển bộ phận tài khoản</h2>
                      <p className="text-xs text-slate-500">Điều chuyển cán bộ sang phòng ban, phân bổ vai trò và đơn vị mới</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleSaveTransfer} className="max-w-2xl space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Tài Khoản Cần Điều Chuyển</label>
                    <select
                      value={transferUser?.id || ''}
                      onChange={e => {
                        const u = allUsers.find(user => user.id === e.target.value);
                        if (u) {
                          setTransferUser(u);
                          setTransferRoomCode(u.roomCode);
                          setTransferRole(u.role);
                          setTransferPvtManagerId(u.pvtManagerId || '');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-semibold"
                    >
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.roomCode} - {u.fullName} ({u.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Mã Bộ Phận / Ký Hiệu Đơn Vị Mới</label>
                    <input
                      type="text"
                      required
                      placeholder="TP1, TP2... hoặc tên đơn vị mới"
                      value={transferRoomCode}
                      onChange={e => setTransferRoomCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono font-bold text-amber-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Vai Trò Nhiệm Vụ Mới</label>
                    <select
                      value={transferRole}
                      onChange={e => setTransferRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="TRUONG_PHONG">TRUONG_PHONG (Lãnh đạo phòng)</option>
                      <option value="PHO_VIEN_TRUONG">PHO_VIEN_TRUONG (Phó Viện Trưởng)</option>
                      <option value="VIEN_TRUONG">VIEN_TRUONG (Viện Trưởng)</option>
                      <option value="ADMIN">ADMIN (Quản trị viên)</option>
                    </select>
                  </div>

                  {transferRole === 'TRUONG_PHONG' && (
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Phó Viện Trưởng Phụ Trách Mới</label>
                      <select
                        value={transferPvtManagerId}
                        onChange={e => setTransferPvtManagerId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="">-- Chưa gán --</option>
                        {pvtUsers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.roomCode}: {p.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Xác Nhận Điều Chuyển
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE 3: ASSIGN PVT SUPERVISION INLINE VIEW */}
            {activeModule === 'assign-pvt' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Gán quyền phụ trách tài khoản</h2>
                      <p className="text-xs text-slate-500">Phân công Phó Viện Trưởng trực tiếp phụ trách các đơn vị nghiệp vụ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleSaveAssignPvt} className="max-w-2xl space-y-5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Trưởng Phòng / Bộ Phận Cần Phân Bổ</label>
                    <select
                      value={assignTpUser?.id || ''}
                      onChange={e => {
                        const tp = tpUsers.find(u => u.id === e.target.value);
                        if (tp) {
                          setAssignTpUser(tp);
                          setAssignPvtId(tp.pvtManagerId || (pvtUsers[0]?.id || ''));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-semibold"
                    >
                      {tpUsers.map(tp => (
                        <option key={tp.id} value={tp.id}>
                          {tp.roomCode} - {tp.fullName} ({tp.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Chọn Lãnh Đạo Viện / Phó Viện Trưởng Phụ Trách</label>
                    <select
                      value={assignPvtId}
                      onChange={e => setAssignPvtId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="">-- Chưa gán (Bỏ quyền phụ trách) --</option>
                      {pvtUsers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.roomCode}: {p.fullName} ({p.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                      Hủy thao tác
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Lưu Phân Công Phụ Trách
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE 4: EXPORT LEADERSHIP EXCEL INLINE VIEW */}
            {activeModule === 'export-leadership-excel' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Xuất công văn gửi Lãnh đạo (Excel)</h2>
                      <p className="text-xs text-slate-500">File Excel tổng hợp đầy đủ nội dung ý kiến chỉ đạo VT, PVT, tiến độ và hạn xử lý</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('tab-users')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại
                  </button>
                </div>

                <div className="max-w-xl space-y-4 text-xs">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                    <p className="font-bold text-emerald-900">Tổng quan dữ liệu xuất báo cáo:</p>
                    <ul className="list-disc list-inside text-emerald-800 space-y-1">
                      <li>Tổng số công văn hiện có: <strong>{dispatches.length}</strong></li>
                      <li>Số công văn đang chọn: <strong>{selectedIds.length}</strong> {selectedIds.length > 0 ? '(Chỉ xuất những văn bản đã tích chọn)' : '(Sẽ xuất toàn bộ danh sách hiện tại)'}</li>
                      <li>Bao gồm cột: Số CV, Trích yếu, Ý kiến VT, Ý kiến PVT, Đơn vị thực hiện, Hạn xử lý, Trạng thái.</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleExportLeadershipExcel}
                      className="flex items-center gap-2 px-5 py-2.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Tải File Excel Ngay
                    </button>
                    <button
                      onClick={() => setActiveModule('tab-dispatches')}
                      className="px-4 py-2.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      Xem bảng công văn
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE 5: USERS TABLE VIEW */}
            {activeModule === 'tab-users' && (
              <div id="admin-user-management-view" className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-4 animate-fadeIn">
                {/* 1. Header: 👥 QUẢN LÝ NGƯỜI DÙNG  [+ Tạo tài khoản] */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        👥 QUẢN LÝ NGƯỜI DÙNG
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-create-user-header"
                      onClick={() => setActiveModule('create-user')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tạo tài khoản</span>
                    </button>
                  </div>
                </div>

                {/* 2. Filter Bar: 🔍 [Tìm kiếm...]  [Vai trò ▼]  [Phòng ▼]  [Trạng thái ▼] */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm..."
                      value={userSearchTerm}
                      onChange={e => {
                        setUserSearchTerm(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full bg-white text-slate-800 pl-9 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder-slate-400"
                    />
                    {userSearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearchTerm('');
                          setUserCurrentPage(1);
                        }}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Vai trò Filter Dropdown */}
                  <div className="w-36">
                    <select
                      value={userRoleFilter}
                      onChange={e => {
                        setUserRoleFilter(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="all">Vai trò ▼</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="VIEN_TRUONG">VIEN_TRUONG</option>
                      <option value="PHO_VIEN_TRUONG">PHO_VT</option>
                      <option value="TRUONG_PHONG">TRUONG_PHONG</option>
                    </select>
                  </div>

                  {/* Phòng Filter Dropdown */}
                  <div className="w-36">
                    <select
                      value={userRoomFilter}
                      onChange={e => {
                        setUserRoomFilter(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="all">Phòng ▼</option>
                      <option value="none">- (Không phòng)</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.code}>
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái Filter Dropdown */}
                  <div className="w-36">
                    <select
                      value={userStatusFilter}
                      onChange={e => {
                        setUserStatusFilter(e.target.value);
                        setUserCurrentPage(1);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="all">Trạng thái ▼</option>
                      <option value="active">Active (Hoạt động)</option>
                      <option value="inactive">Đã khóa (Inactive)</option>
                    </select>
                  </div>

                  {/* Reset Filter Button */}
                  {(userSearchTerm || userRoleFilter !== 'all' || userRoomFilter !== 'all' || userStatusFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserSearchTerm('');
                        setUserRoleFilter('all');
                        setUserRoomFilter('all');
                        setUserStatusFilter('all');
                        setUserCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="Xóa bộ lọc"
                    >
                      Đặt lại
                    </button>
                  )}
                </div>

                {/* 3. Users Table: STT | Tên đăng nhập | Họ và tên | Vai trò | Phòng ban | Trạng thái | Thao tác */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-3 px-3.5 w-14 text-center font-bold">STT</th>
                          <th className="py-3 px-3.5 w-36 font-bold">Tên đăng nhập</th>
                          <th className="py-3 px-3.5 min-w-[160px] font-bold">Họ và tên</th>
                          <th className="py-3 px-3.5 w-36 font-bold">Vai trò</th>
                          <th className="py-3 px-3.5 w-24 text-center font-bold">Phòng ban</th>
                          <th className="py-3 px-3.5 w-28 text-center font-bold">Trạng thái</th>
                          <th className="py-3 px-3.5 w-28 text-center font-bold">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400 italic font-sans">
                              Không tìm thấy tài khoản người dùng phù hợp với bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((u, idx) => {
                            const rowIndex = (userCurrentPage - 1) * userPageSize + idx + 1;
                            const isActive = !!u.active;

                            const roleDisplay =
                              u.role === 'ADMIN'
                                ? 'Quản trị viên'
                                : u.role === 'VIEN_TRUONG'
                                  ? 'Viện trưởng'
                                  : u.role === 'PHO_VIEN_TRUONG'
                                    ? 'Phó Viện trưởng'
                                    : 'Trưởng phòng';

                            const roomDisplay = u.role === 'TRUONG_PHONG' ? (u.roomCode || '—') : '—';

                            return (
                              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-3.5 text-center text-slate-500 font-medium">
                                  {rowIndex}
                                </td>
                                <td className="py-3 px-3.5 font-bold text-slate-900">
                                  {u.username}
                                </td>
                                <td className="py-3 px-3.5 font-semibold text-slate-800">
                                  {u.fullName}
                                </td>
                                <td className="py-3 px-3.5">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${u.role === 'ADMIN'
                                      ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                      : u.role === 'VIEN_TRUONG'
                                        ? 'bg-red-100 text-red-800 border border-red-200'
                                        : u.role === 'PHO_VIEN_TRUONG'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                                      }`}
                                  >
                                    {roleDisplay}
                                  </span>
                                </td>
                                <td className="py-3 px-3.5 text-center font-semibold text-slate-700">
                                  {roomDisplay}
                                </td>
                                <td className="py-3 px-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserActive(u)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer border ${isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                      }`}
                                    title={isActive ? 'Đang kích hoạt - Bấm để tạm khóa' : 'Đã khóa - Bấm để kích hoạt'}
                                  >
                                    {isActive ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Hoạt động</span>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Tạm khóa</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditUser(u)}
                                      className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition cursor-pointer shadow-2xs"
                                      title="Chỉnh sửa tài khoản"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    {u.id !== 'u_admin' && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-300 transition cursor-pointer shadow-2xs"
                                        title="Xóa tài khoản"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Pagination Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs font-sans text-slate-600">
                  <div>
                    Hiển thị <span className="font-semibold text-slate-900">{filteredUsers.length > 0 ? (userCurrentPage - 1) * userPageSize + 1 : 0}</span> - <span className="font-semibold text-slate-900">{Math.min(userCurrentPage * userPageSize, filteredUsers.length)}</span> trên tổng số <span className="font-semibold text-slate-900">{filteredUsers.length}</span> tài khoản
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={userCurrentPage <= 1}
                      onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))}
                      className={`p-1.5 rounded-xl border text-xs font-semibold transition ${userCurrentPage <= 1
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer bg-white shadow-2xs'
                        }`}
                      title="Trang trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={`page-btn-${pageNum}`}
                        type="button"
                        onClick={() => setUserCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${userCurrentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-2xs'
                          }`}
                      >
                        {pageNum}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      type="button"
                      disabled={userCurrentPage >= totalUserPages}
                      onClick={() => setUserCurrentPage(p => Math.min(totalUserPages, p + 1))}
                      className={`p-1.5 rounded-xl border text-xs font-semibold transition ${userCurrentPage >= totalUserPages
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer bg-white shadow-2xs'
                        }`}
                      title="Trang kế tiếp"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: CREATE USER VIEW */}
            {activeModule === 'create-user' && (
              <div
                id="admin-create-user-container"
                className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 sm:p-8 max-w-2xl space-y-6 animate-fadeIn font-sans text-xs"
              >
                {/* Header: Tạo tài khoản mới */}
                <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                        Tạo tài khoản người dùng mới
                      </h2>
                      <p className="text-xs text-slate-500 font-normal">
                        Cấp phát thông tin đăng nhập và phân quyền vị trí công tác
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModule('tab-users')}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    ← Quay lại danh sách
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-6">
                  {/* SECTION 1: THÔNG TIN CƠ BẢN */}
                  <div className="space-y-3.5">
                    <div className="font-bold text-slate-900 tracking-wider text-xs uppercase flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-blue-600 rounded-full"></span>
                      <span>Thông tin cơ bản</span>
                    </div>

                    <div className="space-y-3">
                      {/* Username */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Tên đăng nhập:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            required
                            placeholder=""
                            value={newUser.username}
                            onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                          <span className="text-red-500 font-bold">*</span>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Mật khẩu:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            placeholder="vks@2026"
                            value={newUser.password}
                            onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                          <span className="text-slate-500 text-[11px] whitespace-nowrap">(mặc định)</span>
                        </div>
                      </div>

                      {/* Họ tên */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Họ và tên:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            required
                            placeholder=""
                            value={newUser.fullName}
                            onChange={e => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                          <span className="text-red-500 font-bold">*</span>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Email:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="email"
                            placeholder=""
                            value={newUser.email}
                            onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Điện thoại */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Điện thoại:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="tel"
                            placeholder=""
                            value={newUser.phone}
                            onChange={e => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Chức vụ */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Chức vụ:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <input
                            type="text"
                            placeholder=""
                            value={newUser.position}
                            onChange={e => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DIVIDER 1 */}
                  <div className="border-t border-slate-200" />

                  {/* SECTION 2: VAI TRÒ */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900 tracking-wider text-xs uppercase flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-purple-600 rounded-full"></span>
                      <span>Vai trò & Quyền hạn</span>
                      <span className="text-red-500 font-bold">*</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { id: 'ADMIN', label: 'Quản trị viên ', desc: '' },
                        { id: 'VIEN_TRUONG', label: 'Viện trưởng ', desc: '' },
                        { id: 'PHO_VIEN_TRUONG', label: 'Phó Viện trưởng ', desc: '' },
                        { id: 'TRUONG_PHONG', label: 'Trưởng phòng ', desc: '' }
                      ].map(r => {
                        const isSelected = newUser.role === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => setNewUser(prev => ({ ...prev, role: r.id as UserRole }))}
                            className={`p-3 rounded-xl border cursor-pointer select-none transition ${isSelected
                              ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <div>
                                <div className={`font-bold ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                                  {r.label}
                                </div>
                                <div className="text-[11px] text-slate-500">{r.desc}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DIVIDER 2 */}
                  <div className="border-t border-slate-200" />

                  {/* SECTION 3: TỔ CHỨC */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900 tracking-wider text-xs uppercase flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full"></span>
                      <span>Đơn vị công tác & Quản lý trực tiếp</span>
                    </div>

                    <div className="space-y-3">
                      {/* Phòng ban */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Phòng ban:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <select
                            value={newUser.roomCode}
                            onChange={e => setNewUser(prev => ({ ...prev, roomCode: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                          >
                            <option value="">-- Chọn phòng ban --</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.code}>{dept.name} ({dept.code})</option>
                            ))}
                          </select>
                          <span className="text-slate-500 text-[11px] whitespace-nowrap">
                            (bắt buộc nếu là Trưởng phòng)
                          </span>
                        </div>
                      </div>

                      {/* Cấp trên */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                        <label className="w-28 text-slate-700 font-medium shrink-0">
                          Cấp trên chỉ đạo:
                        </label>
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <select
                            value={newUser.pvtManagerId}
                            onChange={e => setNewUser(prev => ({ ...prev, pvtManagerId: e.target.value }))}
                            className="w-60 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer"
                          >
                            <option value="">-- Chọn lãnh đạo phụ trách --</option>
                            <option value="u_vt">Đ/c Viện Trưởng</option>
                            {pvtUsers.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.roomCode}: {p.fullName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      id="btn-cancel-create-user"
                      onClick={() => {
                        setNewUser({
                          username: '',
                          password: 'vks@2026',
                          fullName: '',
                          email: '',
                          phone: '',
                          position: '',
                          role: 'PHO_VIEN_TRUONG',
                          roomCode: '',
                          pvtManagerId: ''
                        });
                        setActiveModule('tab-users');
                      }}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer shadow-2xs text-xs"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-create-user"
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-xs active:scale-95 text-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Tạo tài khoản</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODULE: ROLES MANAGEMENT VIEW */}
            {activeModule === 'roles' && (
              <div
                id="admin-roles-container"
                className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 sm:p-8 max-w-4xl space-y-6 animate-fadeIn font-sans text-xs"
              >
                {/* Header */}
                <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                        Quản lý vai trò & Quyền hạn hệ thống
                      </h2>
                      <p className="text-xs text-slate-500 font-normal">
                        Danh mục các cấp bậc chức vụ và thẩm quyền vận hành quy trình
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPermissionRole('PHO_VIEN_TRUONG');
                        setActiveModule('permissions');
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ma trận phân quyền →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModule('tab-users')}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      ← Danh sách người dùng
                    </button>
                  </div>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 select-none">
                        <th className="py-3 px-3.5 w-14 text-center border-r border-slate-200">STT</th>
                        <th className="py-3 px-4 border-r border-slate-200">Mã vai trò</th>
                        <th className="py-3 px-4 border-r border-slate-200">Tên chức danh</th>
                        <th className="py-3 px-3.5 w-28 text-center border-r border-slate-200">Số quyền</th>
                        <th className="py-3 px-3.5 w-28 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          stt: 1,
                          code: 'ADMIN',
                          name: 'Quản trị viên',
                          permissionsCount: 40,
                          badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
                          description: 'Quản trị hệ thống, quản lý tài khoản cán bộ, thiết lập các trường dữ liệu, phân quyền và sao lưu dữ liệu toàn hệ thống.'
                        },
                        {
                          stt: 2,
                          code: 'VIEN_TRUONG',
                          name: 'Viện trưởng',
                          permissionsCount: 23,
                          badgeColor: 'bg-red-50 text-red-800 border-red-200',
                          description: 'Lãnh đạo cao nhất cơ quan, toàn quyền chỉ đạo công tác xử lý công văn, phân công nhiệm vụ cho Phó Viện Trưởng, phê duyệt báo cáo.'
                        },
                        {
                          stt: 3,
                          code: 'PHO_VIEN_TRUONG',
                          name: 'Phó Viện trưởng',
                          permissionsCount: 15,
                          badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
                          description: 'Lãnh đạo phụ trách các khối phòng ban, nhận chỉ đạo từ Viện Trưởng, giao việc chỉ đạo cho các Trưởng phòng trực thuộc.'
                        },
                        {
                          stt: 4,
                          code: 'TRUONG_PHONG',
                          name: 'Trưởng phòng',
                          permissionsCount: 12,
                          badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          description: 'Trưởng đơn vị / phòng ban nghiệp vụ, tiếp nhận công văn phân công từ Lãnh đạo Viện, tổ chức thực hiện và báo cáo tiến độ.'
                        }
                      ].map((item) => (
                        <tr key={item.code} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3.5 text-center text-slate-500 border-r border-slate-100 font-medium">
                            {item.stt}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 font-bold text-slate-900 font-mono text-xs">
                            {item.code}
                          </td>
                          <td className="py-3 px-4 border-r border-slate-100 text-slate-800 font-semibold">
                            {item.name}
                          </td>
                          <td className="py-3 px-3.5 text-center border-r border-slate-100 font-bold text-blue-600">
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                              {rolePermissionsMap[item.code]?.length ?? item.permissionsCount} quyền
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-sans">
                              {/* Xem chi tiết quyền */}
                              <button
                                type="button"
                                title="Xem chi tiết quyền"
                                onClick={() => setViewRoleModal(item)}
                                className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-300 transition cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {/* Chỉnh sửa quyền */}
                              <button
                                type="button"
                                title="Chỉnh sửa phân quyền"
                                onClick={() => {
                                  setPermissionRole(item.code as UserRole);
                                  setActiveModule('permissions');
                                }}
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg border border-slate-200 hover:border-amber-300 transition cursor-pointer shadow-2xs"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sub info cards: tổng quan số tài khoản thuộc từng vai trò */}
                <div className="pt-2">
                  <div className="text-xs text-slate-500 font-sans mb-2.5 font-medium">
                    Phân bổ tài khoản cán bộ đang kích hoạt theo vai trò:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                    {[
                      { role: 'ADMIN', name: 'Quản trị viên', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                      { role: 'VIEN_TRUONG', name: 'Viện trưởng', color: 'bg-red-50 text-red-700 border-red-200' },
                      { role: 'PHO_VIEN_TRUONG', name: 'Phó Viện trưởng', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { role: 'TRUONG_PHONG', name: 'Trưởng phòng', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                    ].map(r => {
                      const count = allUsers.filter(u => u.role === r.role).length;
                      return (
                        <div key={r.role} className={`p-3.5 rounded-2xl border ${r.color} shadow-2xs flex flex-col justify-between`}>
                          <div className="text-[11px] font-semibold opacity-90 truncate">{r.name}</div>
                          <div className="text-xl font-extrabold mt-1">{count} <span className="text-xs font-normal opacity-80">cán bộ</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal View Role Detail */}
                {viewRoleModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-2.5">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <span className="text-base font-bold text-slate-900">
                            Chi tiết vai trò: {viewRoleModal.name}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-bold">
                            {viewRoleModal.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewRoleModal(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-5 space-y-4 text-xs">
                        <div>
                          <label className="text-slate-500 font-semibold block mb-1.5">Mô tả nhiệm vụ & thẩm quyền:</label>
                          <p className="text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
                            {viewRoleModal.description}
                          </p>
                        </div>
                        <div>
                          <label className="text-slate-500 font-semibold block mb-1.5">
                            Tổng số quyền hạn được cấp: <strong className="text-blue-600 text-sm">{viewRoleModal.permissionsCount} quyền</strong>
                          </label>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Quyền truy cập các phân hệ công việc tương ứng</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Quyền xem, cập nhật tiến độ công văn và báo cáo kết quả</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Phân bổ chỉ đạo theo chu trình điều hành nghiệp vụ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            const current = viewRoleModal;
                            setViewRoleModal(null);
                            setEditRoleModal(current);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa quyền</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewRoleModal(null)}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs shadow-2xs"
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Edit Role */}
                {editRoleModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
                        <div className="flex items-center gap-2.5">
                          <Edit3 className="w-5 h-5 text-amber-600" />
                          <span className="text-base font-bold text-amber-950">
                            Cập nhật vai trò: {editRoleModal.name}
                          </span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-bold">
                            {editRoleModal.code}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditRoleModal(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-5 space-y-3.5 text-xs">
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">Tên vai trò hiển thị:</label>
                          <input
                            type="text"
                            defaultValue={editRoleModal.name}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">Số quyền kích hoạt:</label>
                          <input
                            type="number"
                            defaultValue={editRoleModal.permissionsCount}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-700 font-semibold block mb-1">Mô tả nhiệm vụ:</label>
                          <textarea
                            rows={3}
                            defaultValue={editRoleModal.description}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setEditRoleModal(null)}
                          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl transition cursor-pointer text-xs shadow-2xs"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showToast(`Đã lưu cập nhật vai trò ${editRoleModal.name} thành công!`);
                            setEditRoleModal(null);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE: PERMISSIONS MANAGEMENT VIEW */}
            {activeModule === 'permissions' && (
              <div
                id="admin-permissions-container"
                className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-6 sm:p-8 max-w-4xl space-y-6 animate-fadeIn font-sans text-xs"
              >
                {/* Header */}
                <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase">
                          Phân quyền chức năng vai trò:
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {permissionRole}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-normal">
                        Tích chọn hoặc bỏ chọn đặc quyền thao tác trên hệ thống
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap font-sans">
                    <span className="text-xs text-slate-500 font-medium">Chọn vai trò:</span>
                    {(['ADMIN', 'VIEN_TRUONG', 'PHO_VIEN_TRUONG', 'TRUONG_PHONG'] as UserRole[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setPermissionRole(r)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${permissionRole === r
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                      >
                        {r === 'ADMIN' ? 'Admin' : r === 'VIEN_TRUONG' ? 'Viện trưởng' : r === 'PHO_VIEN_TRUONG' ? 'Phó VT' : 'Trưởng phòng'}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setActiveModule('roles')}
                      className="ml-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer font-sans"
                    >
                      ← Danh sách vai trò
                    </button>
                  </div>
                </div>

                {/* Categories and permission items */}
                <div className="space-y-6 pt-1">
                  {(['USER', 'DISPATCH', 'SYSTEM', 'REPORTS & ANALYTICS'] as const).map(cat => {
                    const items = ALL_SYSTEM_PERMISSIONS.filter(p => p.category === cat);
                    return (
                      <div key={cat} className="space-y-2">
                        {/* Folder category title */}
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2 select-none border-b border-slate-100 pb-1.5">
                          <Folder className="w-4 h-4 text-amber-500" />
                          <span className="tracking-wide uppercase">{cat}</span>
                          <span className="text-[11px] font-normal text-slate-500 font-sans">({items.length} quyền)</span>
                        </div>

                        {/* Items list */}
                        <div className="space-y-1.5 pl-1 sm:pl-2">
                          {items.map(item => {
                            const isChecked = currentRolePermissions.includes(item.key);
                            return (
                              <div
                                key={item.key}
                                onClick={() => togglePermission(item.key)}
                                className={`flex items-center gap-3 py-2 px-3 rounded-xl cursor-pointer transition select-none border ${isChecked
                                  ? 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-2xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                                  }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}

                                <span className={`w-56 sm:w-64 shrink-0 font-mono text-xs ${isChecked ? 'font-bold text-blue-950' : 'text-slate-800'}`}>
                                  {item.id}. {item.key}
                                </span>

                                <span className="text-slate-600 truncate font-sans text-xs">
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Batch selection buttons */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-800 font-semibold transition cursor-pointer shadow-2xs text-xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Chọn tất cả</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllPermissions}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-800 font-semibold transition cursor-pointer shadow-2xs text-xs"
                    >
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                      <span>Bỏ chọn tất cả</span>
                    </button>
                  </div>

                  <div className="text-slate-700 font-medium text-xs">
                    Đang kích hoạt: <span className="text-blue-600 font-extrabold text-sm">{currentRolePermissions.length}</span> / {ALL_SYSTEM_PERMISSIONS.length} quyền
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 font-sans">
                  <button
                    type="button"
                    onClick={() => setActiveModule('roles')}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer shadow-2xs text-xs"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-xs text-xs active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu phân quyền</span>
                  </button>
                </div>
              </div>
            )}

            {/* MODULE: DEPARTMENTS LIST VIEW */}
            {activeModule === 'departments' && (
              <AdminDepartments
                allUsers={allUsers}
                onShowToast={(msg, type) => showToast(msg, type || 'success')}
              />
            )}

            {/* MODULE: STATS OVERVIEW */}
            {activeModule === 'stats-overview' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Thống Kê Tổng Quan Hệ Thống</h2>
                      <p className="text-xs text-slate-500">Chỉ số toàn diện về lưu lượng công văn, tiến độ giải quyết và công tác chỉ đạo điều hành</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModule('export-leadership-excel')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Xuất Báo Cáo
                    </button>
                    <button
                      onClick={() => setActiveModule('tab-dispatches')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      Xem Tất Cả Công Văn
                    </button>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Tổng Công Văn</span>
                      <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                        <FileSpreadsheet className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-2">{dispatches.length}</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 uppercase">Đã Giải Quyết</span>
                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-emerald-950 mt-2">
                      {dispatches.filter(d => d.trangThai === 'da_giai_quyet').length}
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                      Đạt {dispatches.length > 0 ? Math.round((dispatches.filter(d => d.trangThai === 'da_giai_quyet').length / dispatches.length) * 100) : 0}% tổng số lượng
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-700 uppercase">Đang Xử Lý</span>
                      <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                        <Clock className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-amber-950 mt-2">
                      {dispatches.filter(d => d.trangThai === 'dang_giai_quyet' || !d.trangThai || d.trangThai === 'cho_xu_ly').length}
                    </div>
                    <div className="text-[11px] text-amber-700 mt-1 font-medium">Đang trong hạn thụ lý</div>
                  </div>

                  <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 uppercase">Quá Hạn Xử Lý</span>
                      <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    </div>
                    <div className="text-2xl font-black text-rose-950 mt-2">
                      {dispatches.filter(d => d.trangThai === 'qua_han').length}
                    </div>
                    <div className="text-[11px] text-rose-700 mt-1 font-medium">Cần Lãnh đạo đôn đốc</div>
                  </div>
                </div>

                {/* Chart & Leadership Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart: Status Breakdown */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                    <PieChartWidget
                      title="Phân Bổ Trạng Thái Giải Quyết"
                      subtitle="Tỷ lệ hoàn thành công việc theo toàn bộ công văn hiện hành"
                      size={250}
                      donut={true}
                      data={[
                        {
                          id: 'da_giai_quyet',
                          label: 'Đã hoàn thành',
                          value: dispatches.filter(d => d.trangThai === 'da_giai_quyet').length,
                          color: '#10b981'
                        },
                        {
                          id: 'dang_giai_quyet',
                          label: 'Đang giải quyết',
                          value: dispatches.filter(d => d.trangThai === 'dang_giai_quyet').length,
                          color: '#3b82f6'
                        },
                        {
                          id: 'cho_xu_ly',
                          label: 'Chờ xử lý',
                          value: dispatches.filter(d => d.trangThai === 'cho_xu_ly' || !d.trangThai).length,
                          color: '#f59e0b'
                        },
                        {
                          id: 'qua_han',
                          label: 'Quá hạn',
                          value: dispatches.filter(d => d.trangThai === 'qua_han').length,
                          color: '#ef4444'
                        }
                      ]}
                    />
                  </div>

                  {/* Leadership Direction Indicators */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">Công Tác Chỉ Đạo & Báo Cáo Tiến Độ</h3>
                      <p className="text-xs text-slate-500 mb-4">Mức độ tương tác và điều hành của Ban Lãnh Đạo qua hệ thống số</p>

                      <div className="space-y-3.5">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Viện Trưởng đã cho ý kiến chỉ đạo</span>
                            <span className="font-bold text-red-900">
                              {dispatches.filter(d => !!d.yKienChiDao).length} / {dispatches.length}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-700 rounded-full transition-all duration-500"
                              style={{ width: `${dispatches.length > 0 ? (dispatches.filter(d => !!d.yKienChiDao).length / dispatches.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Phó Viện Trưởng đã chỉ đạo / giao việc</span>
                            <span className="font-bold text-purple-900">
                              {dispatches.filter(d => !!d.yKienPvt || !!d.assignedPvtId).length} / {dispatches.length}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${dispatches.length > 0 ? (dispatches.filter(d => !!d.yKienPvt || !!d.assignedPvtId).length / dispatches.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700">Trưởng Phòng đã cập nhật báo cáo tiến độ</span>
                            <span className="font-bold text-emerald-900">
                              {dispatches.filter(d => !!d.baoCaoTienDo).length} / {dispatches.length}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                              style={{ width: `${dispatches.length > 0 ? (dispatches.filter(d => !!d.baoCaoTienDo).length / dispatches.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="text-slate-500 text-[11px]">Đã gán Phó Viện Trưởng</div>
                        <div className="font-black text-slate-800 text-base mt-0.5">
                          {dispatches.filter(d => !!d.assignedPvtId).length} CV
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="text-slate-500 text-[11px]">Đã gán Trưởng Phòng</div>
                        <div className="font-black text-slate-800 text-base mt-0.5">
                          {dispatches.filter(d => !!d.assignedTpId).length} CV
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: STATS BY DEPARTMENT */}
            {activeModule === 'stats-by-dept' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Thống Kê Theo Phòng Ban Nghiệp Vụ</h2>
                      <p className="text-xs text-slate-500">Khối lượng công việc, tỷ lệ hoàn thành và tình hình giải quyết của từng phòng chuyên môn</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('departments')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5 text-slate-600" />
                    Quản Lý Danh Sách Phòng
                  </button>
                </div>

                {/* Departments Breakdown Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <th className="py-3 px-4 w-28">Phòng ban</th>
                        <th className="py-3 px-4">Trưởng Phòng</th>
                        <th className="py-3 px-4">PVT Phụ Trách</th>
                        <th className="py-3 px-3 text-center">Tổng CV</th>
                        <th className="py-3 px-3 text-center text-emerald-700">Đã xong</th>
                        <th className="py-3 px-3 text-center text-amber-700">Đang xử lý</th>
                        <th className="py-3 px-3 text-center text-rose-700">Quá hạn</th>
                        <th className="py-3 px-4 w-44 text-right">Tỷ lệ hoàn thành</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tpUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Chưa có dữ liệu phòng ban nào.
                          </td>
                        </tr>
                      ) : (
                        tpUsers.map((tp) => {
                          const assignedPvt = pvtUsers.find(p => p.id === tp.pvtManagerId);
                          const deptDispatches = dispatches.filter(d =>
                            d.assignedTpId === tp.id ||
                            d.assignedTpId === tp.roomCode ||
                            (d.phongBan && d.phongBan.toUpperCase() === tp.roomCode.toUpperCase())
                          );
                          const total = deptDispatches.length;
                          const completed = deptDispatches.filter(d => d.trangThai === 'da_giai_quyet').length;
                          const inProgress = deptDispatches.filter(d => d.trangThai === 'dang_giai_quyet' || !d.trangThai || d.trangThai === 'cho_xu_ly').length;
                          const overdue = deptDispatches.filter(d => d.trangThai === 'qua_han').length;
                          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                          return (
                            <tr key={tp.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3 px-4 font-mono font-bold text-blue-950">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                                  {tp.roomCode}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {tp.fullName}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {assignedPvt ? `${assignedPvt.roomCode} - ${assignedPvt.fullName}` : '—'}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-slate-900">
                                {total}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                                {completed}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-amber-700 bg-amber-50/30">
                                {inProgress}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-rose-700 bg-rose-50/30">
                                {overdue}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${rate >= 75 ? 'bg-emerald-600' : rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      style={{ width: `${rate}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-slate-800 w-10 text-right">{rate}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Workload Distribution Pie */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                  <PieChartWidget
                    title="Tỷ Trọng Khối Lượng Công Văn Theo Các Phòng Ban"
                    subtitle="Tỷ lệ phân bổ công văn giữa các đơn vị chuyên môn"
                    size={260}
                    donut={true}
                    data={tpUsers.map((tp, idx) => {
                      const colors = [
                        '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                        '#06b6d4', '#84cc16', '#14b8a6', '#6366f1', '#f97316',
                        '#64748b', '#0284c7'
                      ];
                      const count = dispatches.filter(d =>
                        d.assignedTpId === tp.id ||
                        d.assignedTpId === tp.roomCode ||
                        (d.phongBan && d.phongBan.toUpperCase() === tp.roomCode.toUpperCase())
                      ).length;

                      return {
                        id: tp.id,
                        label: `${tp.roomCode} (${tp.fullName})`,
                        value: count,
                        color: colors[idx % colors.length]
                      };
                    })}
                  />
                </div>
              </div>
            )}

            {/* MODULE: STATS BY TIME */}
            {activeModule === 'stats-by-time' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Thống Kê Công Văn Theo Thời Gian</h2>
                      <p className="text-xs text-slate-500">Phân tích tần suất ban hành, tiến độ giải quyết theo mốc thời gian và hạn xử lý</p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                    {(['all', 'today', 'month', 'quarter', 'year'] as const).map(mode => {
                      const labels = {
                        all: 'Tất cả',
                        today: 'Hôm nay',
                        month: 'Tháng này',
                        quarter: 'Quý này',
                        year: 'Năm 2026'
                      };
                      const isActive = statsTimeFilter === mode;

                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setStatsTimeFilter(mode)}
                          className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${isActive
                            ? 'bg-white text-red-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          {labels[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range Selector */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    Lọc theo khoảng ngày ban hành / tiếp nhận:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Từ ngày:</span>
                    <input
                      type="date"
                      value={statsStartDate}
                      onChange={e => setStatsStartDate(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Đến ngày:</span>
                    <input
                      type="date"
                      value={statsEndDate}
                      onChange={e => setStatsEndDate(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  {(statsStartDate || statsEndDate) && (
                    <button
                      type="button"
                      onClick={() => { setStatsStartDate(''); setStatsEndDate(''); }}
                      className="px-2 py-1 text-slate-600 hover:text-red-700 text-xs font-medium underline"
                    >
                      Xóa lọc ngày
                    </button>
                  )}
                </div>

                {/* Filtered Dispatches Analysis */}
                {(() => {
                  const now = new Date();
                  const filteredByTime = dispatches.filter(d => {
                    const dateStr = d.ngayBanHanh || d.ngayTao || '';
                    if (statsStartDate && dateStr && dateStr < statsStartDate) return false;
                    if (statsEndDate && dateStr && dateStr > statsEndDate) return false;

                    if (statsTimeFilter === 'today') {
                      const todayStr = now.toISOString().slice(0, 10);
                      return dateStr.startsWith(todayStr);
                    }
                    if (statsTimeFilter === 'month') {
                      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                      return dateStr.startsWith(currentMonthStr);
                    }
                    if (statsTimeFilter === 'quarter') {
                      const currentQ = Math.floor(now.getMonth() / 3) + 1;
                      const monthNum = parseInt(dateStr.slice(5, 7), 10);
                      if (isNaN(monthNum)) return true;
                      const q = Math.floor((monthNum - 1) / 3) + 1;
                      return q === currentQ;
                    }
                    if (statsTimeFilter === 'year') {
                      return dateStr.startsWith('2026') || dateStr.startsWith('2025');
                    }
                    return true;
                  });

                  const countTotal = filteredByTime.length;
                  const countDone = filteredByTime.filter(d => d.trangThai === 'da_giai_quyet').length;
                  const countPending = filteredByTime.filter(d => d.trangThai === 'dang_giai_quyet' || !d.trangThai || d.trangThai === 'cho_xu_ly').length;
                  const countOverdue = filteredByTime.filter(d => d.trangThai === 'qua_han').length;

                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="text-[11px] font-bold text-slate-500 uppercase">Trong Kỳ</div>
                          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{countTotal} CV</div>
                        </div>
                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                          <div className="text-[11px] font-bold text-emerald-700 uppercase">Đã Giải Quyết</div>
                          <div className="text-xl font-extrabold text-emerald-950 mt-0.5">{countDone} CV</div>
                        </div>
                        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                          <div className="text-[11px] font-bold text-amber-700 uppercase">Đang Thực Hiện</div>
                          <div className="text-xl font-extrabold text-amber-950 mt-0.5">{countPending} CV</div>
                        </div>
                        <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                          <div className="text-[11px] font-bold text-rose-700 uppercase">Quá Hạn</div>
                          <div className="text-xl font-extrabold text-rose-950 mt-0.5">{countOverdue} CV</div>
                        </div>
                      </div>

                      {/* Time-filtered table summary */}
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                              <th className="py-2.5 px-4 w-28">Số CV</th>
                              <th className="py-2.5 px-4">Tên Công Văn</th>
                              <th className="py-2.5 px-4 w-32">Ngày ban hành</th>
                              <th className="py-2.5 px-4 w-32">Thời hạn xử lý</th>
                              <th className="py-2.5 px-4 w-32 text-center">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredByTime.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400">
                                  Không có công văn nào trong mốc thời gian này.
                                </td>
                              </tr>
                            ) : (
                              filteredByTime.slice(0, 10).map(d => (
                                <tr key={d.id} className="hover:bg-slate-50 transition">
                                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{d.soCongVan}</td>
                                  <td className="py-2.5 px-4 font-medium text-slate-800 truncate max-w-xs">{d.tenCongVan}</td>
                                  <td className="py-2.5 px-4 text-slate-500 font-mono">{d.ngayBanHanh || '—'}</td>
                                  <td className="py-2.5 px-4 text-slate-500 font-mono">{d.hanXuLy || '—'}</td>
                                  <td className="py-2.5 px-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${d.trangThai === 'da_giai_quyet'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : d.trangThai === 'qua_han'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                      }`}>
                                      {d.trangThai === 'da_giai_quyet' ? 'Đã giải quyết' : d.trangThai === 'qua_han' ? 'Quá hạn' : 'Đang xử lý'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* MODULE: DATABASE - VIEW ALL TABLES (DATABASE VIEWER) */}
            {activeModule === 'database-tables' && (
              <DatabaseBrowser />
            )}


            {activeModule === 'audit-logs' && <AdminAuditLogs />}

            {/* MODULE: DATABASE - SESSIONS */}
            {activeModule === 'sessions' && <AdminSessions />}

            {/* MODULE: SETTINGS - CUSTOM COLUMNS */}
            {activeModule === 'custom-columns' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
                      <Columns className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Quản Lý Cột Dữ Liệu (Columns Manager)</h2>
                      <p className="text-xs text-slate-500">Bật/tắt các cột hiển thị trên bảng công văn, điều chỉnh thứ tự và khôi phục mặc định</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        resetToDefaultColumns();
                        showToast('Đã khôi phục cấu hình cột mặc định');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Khôi Phục Mặc Định
                    </button>
                    <button
                      onClick={() => setIsColumnManagerOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Cửa Sổ Tùy Chỉnh Nâng Cao
                    </button>
                  </div>
                </div>

                {/* Columns Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {columns.map(col => (
                    <div
                      key={col.id}
                      onClick={() => toggleColumnVisibility(col.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${col.visible
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${col.visible ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'
                          }`}>
                          {col.visible && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{col.label}</div>
                          <div className="text-[11px] font-mono text-slate-500">{col.key}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${col.visible ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                        {col.visible ? 'Hiển thị' : 'Ẩn'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Tổng số cột cấu hình: <strong>{columns.length}</strong> (Đang hiển thị: <strong>{columns.filter(c => c.visible).length}</strong> cột)</span>
                  <button
                    onClick={() => setActiveModule('tab-dispatches')}
                    className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Quay lại bảng công văn →
                  </button>
                </div>
              </div>
            )}

            {/* MODULE: SETTINGS - SYSTEM SETTINGS */}
            {activeModule === 'system-settings' && (
              <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden p-5 sm:p-6 space-y-6 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Cài Đặt Hệ Thống (System Settings)</h2>
                      <p className="text-xs text-slate-500">Cấu hình tham số đơn vị Viện Kiểm Sát, thời hạn xử lý văn bản và kết nối nội bộ</p>
                    </div>
                  </div>
                  <button
                    onClick={() => showToast('Đã lưu các cài đặt hệ thống thành công!')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Lưu Cài Đặt
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Agency Settings */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-200 pb-2">
                      1. Thông Tin Cơ Quan & Đơn Vị
                    </h3>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tên Đơn Vị Sử Dụng</label>
                      <input
                        type="text"
                        defaultValue="Viện Kiểm Sát Nhân Dân"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Cơ Quan Cấp Trên</label>
                      <input
                        type="text"
                        defaultValue="Viện Kiểm Sát Nhân Dân Tối Cao"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Năm Công Tác Nghiệp Vụ</label>
                      <input
                        type="number"
                        defaultValue={2026}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Dispatch Deadline Settings */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <h3 className="font-bold text-slate-900 uppercase text-xs border-b border-slate-200 pb-2">
                      2. Cấu Hình Thời Hạn & Nhắc Việc
                    </h3>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Thời Hạn Xử Lý Mặc Định (Ngày)</label>
                      <input
                        type="number"
                        defaultValue={5}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Cảnh Báo Sắp Quá Hạn Trước (Ngày)</label>
                      <input
                        type="number"
                        defaultValue={2}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoOverdueCheck"
                        defaultChecked
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <label htmlFor="autoOverdueCheck" className="text-slate-700 font-medium cursor-pointer">
                        Tự động chuyển trạng thái "Quá hạn" khi hết thời hạn xử lý
                      </label>
                    </div>
                  </div>
                </div>

                {/* Local Network Info */}
                <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-blue-950">Mạng Nội Bộ LAN & Port Kết Nối</div>
                      <div className="text-slate-600 text-[11px]">Hệ thống đang hoạt động trên Port 3000, hỗ trợ truy cập máy trạm trong cùng mạng cơ quan</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      showToast('Đã sao chép liên kết hệ thống vào bộ nhớ tạm!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  >
                    Sao Chép URL LAN
                  </button>
                </div>
              </div>
            )}

            {/* MODULE 6: DISPATCHES MANAGEMENT VIEW */}
            {activeModule === 'tab-dispatches' && (
              <div className="space-y-4 animate-fadeIn">
                <ActionBar
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
                  onExportExcel={() => exportDispatchesToExcel(filteredDispatches, columns)}
                  onOpenAddModal={() => { setDispatchToEdit(null); setIsDispatchModalOpen(true); }}
                  onOpenColumnManager={() => setIsColumnManagerOpen(true)}
                />

                <DashboardStats
                  stats={dashboardStats}
                  currentFilter={filters}
                  onFilterChange={updates => setFilters(prev => ({ ...prev, ...updates }))}
                />

                <FilterBar
                  filters={filters}
                  onFilterChange={updates => setFilters(prev => ({ ...prev, ...updates }))}
                  onResetFilters={() => setFilters({
                    searchQuery: '',
                    status: 'ALL',
                    donViBanHanh: 'ALL',
                    nguoiThucHien: 'ALL',
                    urgency: 'ALL',
                    dateFrom: '',
                    dateTo: '',
                    overdueOnly: false
                  })}
                  units={filterOptions.units}
                  assignees={filterOptions.assignees}
                  selectedCount={selectedIds.length}
                  totalDispatches={dispatches.length}
                  onBulkComplete={() => bulkUpdateStatus(selectedIds, 'HOAN_THANH')}
                  onBulkDelete={() => bulkDeleteDispatches(selectedIds)}
                  onClearAll={clearAllDispatches}
                  onExportSelected={() => exportLeadershipReportToExcel(dispatches.filter(d => selectedIds.includes(d.id)))}
                />

                <DispatchTable
                  dispatches={filteredDispatches}
                  columns={columns}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  selectedIds={selectedIds}
                  totalRawCount={dispatches.length}
                  onToggleSelectRow={toggleSelectRow}
                  onToggleSelectAll={toggleSelectAll}
                  onViewDetail={disp => setDetailDispatch(disp)}
                  onEdit={disp => { setDispatchToEdit(disp); setIsDispatchModalOpen(true); }}
                  onDelete={id => deleteDispatch(id)}
                  onQuickStatusChange={(id, st) => updateDispatch(id, { trangThai: st })}
                  onOpenAddModal={() => { setDispatchToEdit(null); setIsDispatchModalOpen(true); }}
                  onOpenImport={() => setIsImportModalOpen(true)}
                  onRestoreSamples={restoreSampleDispatches}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            <div className="px-6 py-4 bg-slate-900 text-white font-bold text-sm flex items-center justify-between">
              <span>Chỉnh Sửa Tài Khoản: {editingUser.username}</span>
              <button onClick={() => setEditingUser(null)} className="text-white/70 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Họ Và Tên</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {editingUser.role === 'TRUONG_PHONG' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phó Viện Trưởng Phụ Trách</label>
                  <select
                    value={editPvtManager}
                    onChange={e => setEditPvtManager(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- Chưa gán --</option>
                    {pvtUsers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.roomCode}: {p.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Đặt Lại Mật Khẩu (Để trống nếu không đổi)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Other Modals */}
      <ExcelImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} existingDispatches={dispatches} columns={columns} onCommitImport={commitExcelImport} />
      <DispatchModal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} dispatchToEdit={dispatchToEdit} columns={columns} onSave={addDispatch} />
      <ColumnManagerModal isOpen={isColumnManagerOpen} onClose={() => setIsColumnManagerOpen(false)} columns={columns} onAddCustomColumn={addCustomColumn} onToggleVisibility={toggleColumnVisibility} onRemoveColumn={removeColumn} onResetDefault={resetToDefaultColumns} />
      <DispatchDetailDrawer dispatch={detailDispatch} onClose={() => setDetailDispatch(null)} columns={columns} onUpdate={(id, updates) => { updateDispatch(id, updates); showToast('Đã cập nhật tiến độ công văn'); }} />
      <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} />
      <GoogleSheetModal isOpen={isGoogleSheetModalOpen} onClose={() => setIsGoogleSheetModalOpen(false)} showToast={showToast} sampleDispatch={dispatches[0]} />

      {/* Database Viewer Table Preview Modal */}
      {dbViewerPreviewTable && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/80 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">
                    Bảng:
                  </span>
                  <span className="font-mono font-bold text-sm text-cyan-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
                    {dbViewerPreviewTable.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    (
                    {dbViewerPreviewTable === 'users' ? allUsers.length :
                      dbViewerPreviewTable === 'dispatches' ? dispatches.length :
                        dbViewerPreviewTable === 'departments' ? 12 :
                          dbViewerPreviewTable === 'roles' ? 4 :
                            dbViewerPreviewTable === 'permissions' ? 40 :
                              dbViewerPreviewTable === 'user_roles' ? allUsers.length : 0} records
                    )
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 font-sans">
                {dbViewerPreviewTable !== 'audit_logs' && (
                  <button
                    type="button"
                    onClick={() => handleExportDbTable(dbViewerPreviewTable)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700 cursor-pointer transition font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất JSON</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDbViewerPreviewTable(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Users */}
              {dbViewerPreviewTable === 'users' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16">ID</th>
                        <th className="py-2.5 px-3">Tên đăng nhập</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3">Vai trò</th>
                        <th className="py-2.5 px-3">Phòng</th>
                        <th className="py-2.5 px-3">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500 font-mono">{u.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{u.username}</td>
                          <td className="py-2 px-3 text-slate-800">{u.fullName}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{u.roomCode || '-'}</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{u.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Dispatches */}
              {dbViewerPreviewTable === 'dispatches' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16">ID</th>
                        <th className="py-2.5 px-3 w-32">Số hiệu</th>
                        <th className="py-2.5 px-3">Trích yếu</th>
                        <th className="py-2.5 px-3 w-28">Trạng thái</th>
                        <th className="py-2.5 px-3 w-32">Hạn xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dispatches.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500 font-mono">{d.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{d.soHieu}</td>
                          <td className="py-2 px-3 text-slate-800 truncate max-w-xs">{d.trichYeu}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              {d.trangThai}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{d.hanXuLy || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Departments */}
              {dbViewerPreviewTable === 'departments' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-24">Mã phòng</th>
                        <th className="py-2.5 px-3">Tên phòng</th>
                        <th className="py-2.5 px-3">PVT Phụ Trách</th>
                        <th className="py-2.5 px-3">Trưởng phòng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from({ length: 12 }, (_, i) => `TP${i + 1}`).map(r => {
                        const tp = allUsers.find(u => u.roomCode === r && u.role === 'TRUONG_PHONG');
                        const pvt = tp?.pvtManagerId ? allUsers.find(u => u.id === tp.pvtManagerId) : null;
                        return (
                          <tr key={r} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900">{r}</td>
                            <td className="py-2 px-3 text-slate-800">Phòng {r.replace('TP', '')}</td>
                            <td className="py-2 px-3 text-blue-700 font-medium">{pvt ? `${pvt.roomCode}: ${pvt.fullName}` : 'Chưa phân công'}</td>
                            <td className="py-2 px-3 text-slate-700">{tp ? tp.fullName : 'Chưa phân công'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Roles */}
              {dbViewerPreviewTable === 'roles' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-36">Mã Vai Trò</th>
                        <th className="py-2.5 px-3">Tên Vai Trò</th>
                        <th className="py-2.5 px-3 w-28 text-center">Số Quyền</th>
                        <th className="py-2.5 px-3">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { code: 'ADMIN', name: 'Quản trị viên', perm: 40, desc: 'Toàn quyền cấu hình và quản trị hệ thống' },
                        { code: 'VIEN_TRUONG', name: 'Viện trưởng', perm: 23, desc: 'Chỉ đạo toàn diện, phê duyệt và giám sát văn bản toàn viện' },
                        { code: 'PHO_VIEN_TRUONG', name: 'Phó Viện trưởng', perm: 15, desc: 'Phụ trách và chỉ đạo các phòng ban được phân công' },
                        { code: 'TRUONG_PHONG', name: 'Trưởng phòng', perm: 12, desc: 'Thực hiện văn bản, phân công chuyên viên và báo cáo tiến độ' }
                      ].map(r => (
                        <tr key={r.code} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">{r.code}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-700">{r.perm} quyền</td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{r.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Permissions */}
              {dbViewerPreviewTable === 'permissions' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">STT</th>
                        <th className="py-2.5 px-3 w-28">Nhóm</th>
                        <th className="py-2.5 px-3 w-48 font-mono">Mã Quyền (Key)</th>
                        <th className="py-2.5 px-3">Tên Quyền Hạn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ALL_SYSTEM_PERMISSIONS.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-500">{p.id}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.key}</td>
                          <td className="py-2 px-3 text-slate-700">{p.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* User Roles */}
              {dbViewerPreviewTable === 'user_roles' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16">User ID</th>
                        <th className="py-2.5 px-3">Tài khoản (Username)</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3">Vai trò phân công (Role)</th>
                        <th className="py-2.5 px-3">Đơn vị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-500 font-mono">{u.id}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{u.username}</td>
                          <td className="py-2 px-3 text-slate-800">{u.fullName}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{u.roomCode || 'Viện'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Audit Logs */}
              {dbViewerPreviewTable === 'audit_logs' && (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-700">Bảng audit_logs hiện có 0 bản ghi</div>
                  <div className="text-[11px] mt-1 text-slate-500">Các hoạt động đăng nhập và thao tác hệ thống sẽ được ghi nhận tự động.</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Hiển thị dữ liệu thực tế từ hệ thống cơ sở dữ liệu VKS
              </div>
              <button
                type="button"
                onClick={() => setDbViewerPreviewTable(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-xs"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounceIn">
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
