// src/types/admin/permission.ts

export type PermissionCategory = 'USER' | 'DISPATCH' | 'SYSTEM' | 'REPORTS & ANALYTICS';

export interface PermissionItem {
  id: number;
  key: string;
  label: string;
  category: PermissionCategory;
}