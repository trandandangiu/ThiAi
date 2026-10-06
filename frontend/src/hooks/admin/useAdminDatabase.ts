// src/hooks/admin/useAdminDatabase.ts
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/adminApi';
import { DatabaseTable, DatabaseTableData, DatabaseStats } from '../../types/admin';

export const useAdminDatabase = () => {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<DatabaseTableData | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  // Load danh sách bảng + stats
  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tablesRes, statsRes] = await Promise.all([
        adminApi.getDatabaseTables(),
        adminApi.getDatabaseStats(),
      ]);
      setTables(tablesRes.tables || []);
      setStats(statsRes.stats || null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách bảng');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data của 1 bảng
  const loadTableData = useCallback(async (tableName: string, page = 1) => {
    setTableLoading(true);
    setTableError(null);
    try {
      const res = await adminApi.getTableData(tableName, { page, limit: pageSize });
      setTableData({
        table: res.table,
        data: res.data,
        pagination: res.pagination,
      });
      setCurrentPage(page);
    } catch (err: any) {
      setTableError(err.message || `Không thể tải bảng ${tableName}`);
    } finally {
      setTableLoading(false);
    }
  }, [pageSize]);

  const selectTable = useCallback((tableName: string) => {
    setSelectedTable(tableName);
    loadTableData(tableName, 1);
  }, [loadTableData]);

  const refresh = useCallback(() => {
    loadTables();
    if (selectedTable) {
      loadTableData(selectedTable, currentPage);
    }
  }, [loadTables, loadTableData, selectedTable, currentPage]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  return {
    // Danh sách bảng
    tables,
    stats,
    loading,
    error,
    loadTables,

    // Bảng đang xem
    selectedTable,
    tableData,
    tableLoading,
    tableError,
    currentPage,
    pageSize,
    selectTable,
    loadTableData,

    // Utility
    refresh,
  };
};