export interface VtFilters {
  searchQuery: string;
  pvtIds: string[];
  deptCodes: string[];
  status: string;
  urgency: string;
  dateFrom: string;
  dateTo: string;
  sortMode?: 'priority' | 'deadline_asc' | 'deadline_desc' | 'overdue_desc' | 'newest' | 'oldest';
  loaiVanBan: 'ALL' | 'CONG_VAN' | 'CHUYEN_DE';
}

export const DEFAULT_VT_FILTERS: VtFilters = {
  searchQuery: '',
  pvtIds: [],
  deptCodes: [],
  status: 'ALL',
  urgency: 'ALL',
  dateFrom: '',
  dateTo: '',
  sortMode: 'priority',  
   loaiVanBan: 'ALL',
};