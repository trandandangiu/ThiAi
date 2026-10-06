// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/auth';
import { apiClient } from '../services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  reloadUsers: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  isAdmin: boolean;
  isVienTruong: boolean;
  isPhoVienTruong: boolean;
  isTruongPhong: boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// NORMALIZE USER — Đảm bảo luôn có `role` (string) + `permissions`
// Backend trả: { user: {...}, roles: ['VIEN_TRUONG'], permissions: [...] }
// → Cần merge lại
// ============================================
const normalizeUser = (
  rawUser: any,
  rawRoles?: string[],
  rawPermissions?: string[]
): User => {
  // 1. Lấy role code từ nhiều nguồn
  let roleCode: UserRole | undefined;

  // Ưu tiên 1: rawRoles array (backend login trả)
  if (rawRoles && rawRoles.length > 0) {
    roleCode = rawRoles[0] as UserRole;
  }
  // Ưu tiên 2: user.roles array (backend /me trả)
  else if (rawUser?.roles && Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
    roleCode = rawUser.roles[0].code as UserRole;
  }
  // Ưu tiên 3: user.role (legacy)
  else if (rawUser?.role) {
    roleCode = rawUser.role as UserRole;
  }
  // Fallback
  else {
    roleCode = 'PHO_VIEN_TRUONG';
  }

  // 2. Lấy permissions
  const permissions = rawPermissions || rawUser?.permissions || [];

  // 3. Merge
  return {
    ...rawUser,
    role: roleCode,
    roles: rawUser?.roles || (roleCode ? [{ id: 0, code: roleCode, name: roleCode, level: 0 }] : []),
    permissions,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // INIT — Load user khi app khởi động
  // ============================================
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const token = apiClient.getToken();
        if (token) {
          // 1. Thử load user từ localStorage trước (nhanh)
          const cached = apiClient.getCurrentUser();
          if (cached) {
            const normalized = normalizeUser(cached, cached.roles?.map(r => r.code), cached.permissions);
            setCurrentUser(normalized);
          }

          // 2. Fetch user mới nhất từ server
          const user = await apiClient.fetchCurrentUser();
          if (user) {
            const normalized = normalizeUser(
              user,
              user.roles?.map(r => r.code),
              user.permissions
            );
            setCurrentUser(normalized);
            // Update localStorage với user đã normalize
            apiClient.setCurrentUser(normalized);
            await reloadUsers();
          }
        }
      } catch (e) {
        console.error('Auth init error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // ============================================
  // RELOAD USERS
  // ============================================
  const reloadUsers = async () => {
    try {
      const users = await apiClient.getAllUsers({ limit: 100 });
      setAllUsers(users);
    } catch (e) {
      console.error('Lỗi khi load users:', e);
    }
  };

  // ============================================
  // LOGIN
  // ============================================
  const login = async (username: string, password: string) => {
    const result = await apiClient.login(username, password);

    if (result.success && result.user) {
      // Merge roles + permissions vào user
      const normalized = normalizeUser(
        result.user,
        result.roles,          // ← Backend trả riêng
        result.permissions     // ← Backend trả riêng
      );
      setCurrentUser(normalized);
      apiClient.setCurrentUser(normalized);
      await reloadUsers();
      return { success: true };
    }

    return { success: false, message: result.message || 'Đăng nhập thất bại' };
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    await apiClient.logout();
    setCurrentUser(null);
    setAllUsers([]);
  };

  // ============================================
  // REFRESH
  // ============================================
  const refreshCurrentUser = async () => {
    const user = await apiClient.fetchCurrentUser();
    if (user) {
      const normalized = normalizeUser(
        user,
        user.roles?.map(r => r.code),
        user.permissions
      );
      setCurrentUser(normalized);
      apiClient.setCurrentUser(normalized);
    }
  };

  // ============================================
  // ROLE CHECKS
  // ============================================
  const getRoleCode = (): string | null => {
    if (!currentUser) return null;
    // Ưu tiên currentUser.role (đã normalize)
    if (currentUser.role) return currentUser.role;
    // Fallback: currentUser.roles[0].code
    if (currentUser.roles && currentUser.roles.length > 0) {
      return currentUser.roles[0].code;
    }
    return null;
  };

  const isAdmin = getRoleCode() === 'ADMIN';
  const isVienTruong = getRoleCode() === 'VIEN_TRUONG';
  const isPhoVienTruong = getRoleCode() === 'PHO_VIEN_TRUONG';
  const isTruongPhong = getRoleCode() === 'TRUONG_PHONG';

  const hasPermission = (perm: string): boolean => {
    return currentUser?.permissions?.includes(perm) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        login,
        logout,
        reloadUsers,
        refreshCurrentUser,
        isAdmin,
        isVienTruong,
        isPhoVienTruong,
        isTruongPhong,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};