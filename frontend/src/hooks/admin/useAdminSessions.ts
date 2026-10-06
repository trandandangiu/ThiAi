// src/hooks/admin/useAdminSessions.ts
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/adminApi';
import { Session } from '../../types/admin';

export const useAdminSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getSessions();
      setSessions(res.sessions || []);
    } catch (err: any) {
      setError(err.message || 'Không thể tải sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto refresh mỗi 30s
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { sessions, isLoading, error, refresh: load };
};