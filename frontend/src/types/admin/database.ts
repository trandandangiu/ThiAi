// src/types/admin/database.ts

export interface DatabaseTable {
  name: string;
  count: number;
  label?: string;
  description?: string;
}

export interface DatabaseTableData {
  table: string;
  data: Record<string, any>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DatabaseStats {
  users: number;
  dispatches: number;
  departments: number;
  roles: number;
  permissions: number;
}