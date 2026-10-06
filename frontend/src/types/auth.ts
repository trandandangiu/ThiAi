// frontend/src/types/auth.ts

export type UserRole =
  | 'ADMIN'
  | 'VIEN_TRUONG'
  | 'PHO_VIEN_TRUONG'
  | 'TRUONG_PHONG';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  position?: string;
  active: boolean;
  departmentId?: string;
  department?: {
    id: string;
    code: string;
    name: string;
  };
  managerId?: string;
  pvtManagerId?: string;
  manager?: {
    id: string;
    username: string;
    fullName: string;
  };
  // Roles (mới — array)
  roles?: { id: number; code: string; name: string; level: number }[];
  // Legacy (giữ để tương thích)
  role?: UserRole;
  roomCode?: string;
  // Permissions
  permissions?: string[];
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  roles?: string[];
  permissions?: string[];
  token?: string;
  message?: string;
}

export interface VTDashboardStatsResponse {
  success: boolean;
  summary: {
    total: number;
    hoanThanh: number;
    dangXuLy: number;
    quaHan: number;
    sapDenHan: number;
    chuaToiHan: number;
    tyLeHoanThanh: number;
  };
  pvtStats: any[];
  tpStats: any[];
}