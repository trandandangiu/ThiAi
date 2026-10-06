// frontend/src/hooks/useDispatches.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ColumnDefinition,
  Dispatch,
  DispatchFilter,
  DispatchStatus,
  ExcelImportAnalysis,
  LeadershipDashboardStats,
  ReconciliationStrategy,
} from '../types/dispatch';
import { apiClient } from '../services/apiClient';
import { calculateTimeRemaining, resolveDispatchStatus } from '../services/excelService';
import { getDispatchSortTimestamp, parseDateToTimestamp } from '../services/dateSort';

// ============================================
// DEFAULT COLUMNS
// ============================================
const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: 'stt', label: 'STT', type: 'number', visible: true, isCustom: false, width: '60px', required: false },
  { id: 'soCongVan', label: 'Số công văn', type: 'text', visible: true, isCustom: false, width: '140px', required: true },
  { id: 'ngayGui', label: 'Ngày gửi', type: 'date', visible: true, isCustom: false, width: '110px', required: true },
  { id: 'tenCongVan', label: 'Tên công văn', type: 'text', visible: true, isCustom: false, width: '320px', required: true },
  { id: 'hanBaoCaoXuLy', label: 'Hạn báo cáo', type: 'date', visible: true, isCustom: false, width: '120px', required: false },
  { id: 'thoiHanXuLy', label: 'Thời hạn xử lý', type: 'text', visible: true, isCustom: false, width: '150px', required: false },
  { id: 'donViBanHanh', label: 'Đơn vị ban hành', type: 'text', visible: true, isCustom: false, width: '180px', required: true },
  { id: 'nguoiThucHien', label: 'Người thực hiện', type: 'text', visible: true, isCustom: false, width: '180px', required: false },
  { id: 'ghiChu', label: 'Ghi chú', type: 'text', visible: true, isCustom: false, width: '250px', required: false },
];

export const useDispatches = (options: { includeDeleted?: boolean } = {}) => {
  // ============================================
  // STATE
  // ============================================
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DispatchFilter>({
    searchQuery: '',
    status: 'ALL',
    donViBanHanh: 'ALL',
    nguoiThucHien: 'ALL',
    urgency: 'ALL',
    dateFrom: '',
    dateTo: '',
    overdueOnly: false,
  });

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Dispatch | string;
    direction: 'asc' | 'desc';
  }>({
    key: 'ngayGui',
    direction: 'desc',
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ============================================
  // LOAD FROM API
  // ============================================
  const loadDispatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getDispatches({
        limit: 500,
        includeDeleted: options.includeDeleted === true,
      });
      setDispatches(data);
    } catch (e: any) {
      setError(e.message || 'Lỗi tải dữ liệu');
      console.error('Lỗi load dispatches:', e);
    } finally {
      setIsLoading(false);
    }
  }, [options.includeDeleted]);

  useEffect(() => {
    loadDispatches();
  }, [loadDispatches]);

  // ============================================
  // FILTERED & SORTED
  // ============================================
  const filteredDispatches = useMemo(() => {
    return dispatches
      .filter(item => {
        // Search
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchNumber = item.soCongVan?.toLowerCase().includes(q);
          const matchTitle = item.tenCongVan?.toLowerCase().includes(q);
          const matchUnit = item.donViBanHanh?.toLowerCase().includes(q);
          const matchAssignee = item.nguoiThucHien?.toLowerCase().includes(q);
          const matchNotes = item.ghiChu?.toLowerCase().includes(q) || false;

          if (!matchNumber && !matchTitle && !matchUnit && !matchAssignee && !matchNotes) {
            return false;
          }
        }

        // Status
        if (filters.status !== 'ALL') {
          const resolved = resolveDispatchStatus(item);
          if (filters.status === 'QUA_HAN' && !filters.overdueOnly) {
            if (resolved !== 'QUA_HAN') return false;
          } else if (resolved !== filters.status) {
            return false;
          }
        }

        // Overdue only
        if (filters.overdueOnly) {
          const resolved = resolveDispatchStatus(item);
          if (resolved !== 'QUA_HAN') return false;
        }

        // Urgency
        if (filters.urgency !== 'ALL' && item.mucDoKhan !== filters.urgency) {
          return false;
        }

        // Unit
        if (filters.donViBanHanh !== 'ALL' && item.donViBanHanh !== filters.donViBanHanh) {
          return false;
        }

        // Assignee
        if (filters.nguoiThucHien !== 'ALL' && item.nguoiThucHien !== filters.nguoiThucHien) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Dispatch];
        const bVal = b[sortConfig.key as keyof Dispatch];

        // Date sort
        if (sortConfig.key === 'ngayGui' || sortConfig.key === 'hanBaoCaoXuLy') {
          const aTime = parseDateToTimestamp(aVal as string);
          const bTime = parseDateToTimestamp(bVal as string);
          return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
        }

        // Default string sort
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr, 'vi');
        }
        return bStr.localeCompare(aStr, 'vi');
      });
  }, [dispatches, filters, sortConfig]);

  // ============================================
  // DASHBOARD STATS
  // ============================================
  const dashboardStats: LeadershipDashboardStats = useMemo(() => {
    const total = dispatches.length;
    let dangXuLy = 0;
    let sapDenHan = 0;
    let quaHan = 0;
    let hoanThanh = 0;

    dispatches.forEach(d => {
      const status = resolveDispatchStatus(d);
      if (status === 'HOAN_THANH') hoanThanh++;
      else if (status === 'QUA_HAN') quaHan++;
      else if (status === 'SAP_DEN_HAN') sapDenHan++;
      else dangXuLy++;
    });

    return {
      total,
      dangXuLy,
      sapDenHan,
      quaHan,
      hoanThanh,
    };
  }, [dispatches]);

  // ============================================
  // FILTER OPTIONS
  // ============================================
  const filterOptions = useMemo(() => {
    const units = new Set<string>();
    const assignees = new Set<string>();

    dispatches.forEach(d => {
      if (d.donViBanHanh) units.add(d.donViBanHanh);
      if (d.nguoiThucHien) assignees.add(d.nguoiThucHien);
    });

    return {
      units: Array.from(units).sort(),
      assignees: Array.from(assignees).sort(),
    };
  }, [dispatches]);

  // ============================================
  // SELECTION
  // ============================================
  const toggleSelectRow = useCallback((id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.length === filteredDispatches.length
        ? []
        : filteredDispatches.map(d => d.id)
    );
  }, [filteredDispatches]);

  // ============================================
  // CRUD — GỌI API
  // ============================================
  /**
   * addDispatch — tạo mới công văn
   * Trả về true nếu thành công, false nếu thất bại.
   * Nếu có file đính kèm (`__attachments`), sẽ upload sau khi tạo.
   */
// frontend/src/hooks/useDispatches.ts

const addDispatch = useCallback(
  async (
    dispatchData: Partial<Dispatch> & {
      __attachments?: any[];
      __assignPvt?: { pvtId: string; pvtName: string; roomCode: string; isPrimary?: boolean };
      __assignTp?: { tpId: string; tpName: string; roomCode: string; isPrimary?: boolean };
    }
  ): Promise<boolean> => {
    try {
      // 1. Tách phần mở rộng
      const { __attachments, __assignPvt, __assignTp, ...payload } = dispatchData;

      // 2. Tạo dispatch
      const created = await apiClient.createDispatch(payload as Partial<Dispatch>);
      if (!created) {
        console.error('Tạo công văn thất bại');
        return false;
      }

      // 3. Phân công PVT (nếu có)
      if (__assignPvt) {
        try {
          await apiClient.assignToPvts(created.id, {
            pvts: [{
              pvtId: __assignPvt.pvtId,
              pvtName: __assignPvt.pvtName,
              roomCode: __assignPvt.roomCode,
              isPrimary: __assignPvt.isPrimary ?? true,
            }],
          });
        } catch (err) {
          console.error('Lỗi phân công PVT:', err);
        }
      }

      // 4. Phân công TP (nếu có)
      if (__assignTp) {
        try {
          await apiClient.assignToTps(created.id, {
            tps: [{
              tpId: __assignTp.tpId,
              tpName: __assignTp.tpName,
              roomCode: __assignTp.roomCode,
              isPrimary: __assignTp.isPrimary ?? true,
            }],
          });
        } catch (err) {
          console.error('Lỗi phân công TP:', err);
        }
      }

      // 5. Upload attachments (nếu có)
      if (Array.isArray(__attachments) && __attachments.length > 0) {
        for (const item of __attachments) {
          if (item?.file instanceof File) {
            try {
              await apiClient.uploadAttachment(
                created.id,
                item.file,
                item.fileCategory || 'ORIGINAL',
                item.description
              );
            } catch (uploadErr) {
              console.error('Lỗi upload file đính kèm:', uploadErr);
            }
          }
        }
      }

      // 6. Cập nhật state cục bộ
      setDispatches(prev => [created, ...prev]);
      return true;
    } catch (e) {
      console.error('Lỗi thêm công văn:', e);
      return false;
    }
  },
  []
);

  /**
   * updateDispatch — cập nhật công văn
   */
  const updateDispatch = useCallback(
    async (id: string, updates: Partial<Dispatch>): Promise<boolean> => {
      try {
        const updated = await apiClient.updateDispatch(id, updates);
        if (updated) {
          setDispatches(prev =>
            prev.map(d => (d.id === id ? { ...d, ...updated } : d))
          );
          return true;
        }
        return false;
      } catch (e) {
        console.error('Lỗi cập nhật công văn:', e);
        return false;
      }
    },
    []
  );

  /**
   * deleteDispatch — xoá mềm công văn
   */
  const deleteDispatch = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await apiClient.deleteDispatch(id);
      if (success) {
        setDispatches(prev => prev.filter(d => d.id !== id));
        setSelectedIds(prev => prev.filter(x => x !== id));
        return true;
      }
      return false;
    } catch (e) {
      console.error('Lỗi xóa công văn:', e);
      return false;
    }
  }, []);

  /**
   * bulkDeleteDispatches — xoá nhiều công văn
   */
  const bulkDeleteDispatches = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        let allSuccess = true;
        for (const id of ids) {
          const success = await apiClient.deleteDispatch(id);
          if (!success) allSuccess = false;
        }
        if (allSuccess) {
          setDispatches(prev => prev.filter(d => !ids.includes(d.id)));
          setSelectedIds([]);
        }
        return allSuccess;
      } catch (e) {
        console.error('Lỗi xóa nhiều công văn:', e);
        return false;
      }
    },
    []
  );

  /**
   * clearAllDispatches — xoá tất cả
   */
  const clearAllDispatches = useCallback(async (): Promise<boolean> => {
    try {
      const ids = dispatches.map(d => d.id);
      return await bulkDeleteDispatches(ids);
    } catch (e) {
      console.error('Lỗi xóa tất cả:', e);
      return false;
    }
  }, [dispatches, bulkDeleteDispatches]);

  /**
   * restoreSampleDispatches — không còn sample, chỉ reload
   */
  const restoreSampleDispatches = useCallback(async (): Promise<void> => {
    await loadDispatches();
  }, [loadDispatches]);

  /**
   * bulkUpdateStatus — cập nhật trạng thái nhiều công văn
   */
  const bulkUpdateStatus = useCallback(
    async (ids: string[], status: DispatchStatus): Promise<void> => {
      try {
        for (const id of ids) {
          await apiClient.updateDispatch(id, { trangThai: status } as any);
        }
        await loadDispatches();
        setSelectedIds([]);
      } catch (e) {
        console.error('Lỗi cập nhật trạng thái:', e);
      }
    },
    [loadDispatches]
  );

  // ============================================
  // COLUMNS
  // ============================================
  const addCustomColumn = useCallback(
    (newCol: { label: string; type: string; description?: string }) => {
      const id = `custom_${Date.now()}`;
      setColumns(prev => [
        ...prev,
        {
          id,
          label: newCol.label,
          type: newCol.type as any,
          description: newCol.description,
          visible: true,
          isCustom: true,
          required: false,
          width: '150px',
        },
      ]);
    },
    []
  );

  const toggleColumnVisibility = useCallback((colId: string) => {
    setColumns(prev =>
      prev.map(c => (c.id === colId ? { ...c, visible: !c.visible } : c))
    );
  }, []);

  const removeColumn = useCallback((colId: string) => {
    setColumns(prev => prev.filter(c => c.id !== colId));
  }, []);

  const resetToDefaultColumns = useCallback(() => {
    setColumns(DEFAULT_COLUMNS);
  }, []);

  // ============================================
  // EXCEL IMPORT
  // ============================================
  const commitExcelImport = useCallback(
    async (
      analysis: ExcelImportAnalysis,
      strategy: ReconciliationStrategy,
      itemActions?: any
    ) => {
      try {
        const items = analysis.newItems || [];
        for (const item of items) {
          await apiClient.createDispatch(item);
        }
        await loadDispatches();
      } catch (e) {
        console.error('Lỗi import Excel:', e);
      }
    },
    [loadDispatches]
  );

  // ============================================
  // SORT
  // ============================================
  const handleSort = useCallback((columnId: string) => {
    setSortConfig(prev => ({
      key: columnId,
      direction:
        prev.key === columnId && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // ============================================
  // RETURN
  // ============================================
  return {
    // State
    dispatches,
    filteredDispatches,
    columns,
    filters,
    filterOptions,
    sortConfig,
    dashboardStats,
    selectedIds,
    isLoading,
    error,

    // Setters
    setFilters,
    setColumns,

    // Actions
    handleSort,
    toggleSelectRow,
    toggleSelectAll,
    addDispatch,
    updateDispatch,
    deleteDispatch,
    bulkDeleteDispatches,
    clearAllDispatches,
    restoreSampleDispatches,
    bulkUpdateStatus,
    commitExcelImport,
    addCustomColumn,
    toggleColumnVisibility,
    removeColumn,
    resetToDefaultColumns,
    reload: loadDispatches,
  };
};