// src/types/admin/common.ts

export type AdminModuleType =
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

export type ToastType = 'success' | 'info' | 'error' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}