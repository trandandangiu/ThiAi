// src/services/adminApi.ts
import {
  DatabaseTable,
  DatabaseTableData,
  AuditLog,
  Session,
  DatabaseStats,
} from '../types/admin';

const API_BASE = '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    throw new Error('Unauthorized');
  }

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text.substring(0, 200)}`);
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const adminApi = {
  // ============================================
  // DATABASE
  // ============================================
  async getDatabaseTables(): Promise<{ success: boolean; tables: DatabaseTable[] }> {
    return request<{ success: boolean; tables: DatabaseTable[] }>(
      '/admin/database/tables'
    );
  },

  async getTableData(
    tableName: string,
    params: { page?: number; limit?: number; search?: string } = {}
  ): Promise<{ success: boolean } & DatabaseTableData> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return request<{ success: boolean } & DatabaseTableData>(
      `/admin/database/table/${tableName}${qs ? `?${qs}` : ''}`
    );
  },

  async getDatabaseStats(): Promise<{ success: boolean; stats: DatabaseStats }> {
    return request<{ success: boolean; stats: DatabaseStats }>(
      '/admin/database/stats'
    );
  },

  // ============================================
  // AUDIT LOGS
  // ============================================
  async getAuditLogs(
    params: {
      page?: number;
      limit?: number;
      userId?: string;
      action?: string;
      entityType?: string;
    } = {}
  ): Promise<{
    success: boolean;
    logs: AuditLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const qs = query.toString();
    return request<{
      success: boolean;
      logs: AuditLog[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },

  // ============================================
  // SESSIONS
  // ============================================
  async getSessions(
    params: { userId?: string } = {}
  ): Promise<{ success: boolean; sessions: Session[] }> {
    const query = new URLSearchParams();
    if (params.userId) query.set('userId', params.userId);
    const qs = query.toString();
    return request<{ success: boolean; sessions: Session[] }>(
      `/admin/sessions${qs ? `?${qs}` : ''}`
    );
  },
};