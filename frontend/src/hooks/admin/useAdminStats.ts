// src/hooks/admin/useAdminStats.ts
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/adminApi';

export interface AdminStats {
  users: number;
  dispatches: number;
  departments: number;
  roles: number;
  permissions: number;
  userRoles?: number;
  rolePermissions?: number;
  assignments?: number;
  attachments?: number;
  reports?: number;
  auditLogs?: number;
  sessions?: number;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDatabaseStats();
      setStats(res.stats || null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thống kê');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, isLoading, error, refresh: load };
};