// src/hooks/admin/useAdminAuditLogs.ts
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/adminApi';
import { AuditLog } from '../../types/admin';

export const useAdminAuditLogs = (limit: number = 50) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAuditLogs({ page: p, limit });
      setLogs(res.logs || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Không thể tải audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load(1);
  }, [load]);

  return {
    logs,
    page,
    totalPages,
    isLoading,
    error,
    setPage: (p: number) => load(p),
    reload: () => load(page),
  };
};