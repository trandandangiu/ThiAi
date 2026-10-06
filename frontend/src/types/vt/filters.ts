// src/types/vt/filters.ts
export interface VtFilters {
  searchQuery: string;
  pvtIds: string[];
  deptCodes: string[];
  status: string;
  urgency: string;
  dateFrom: string;
  dateTo: string;
  // ⭐ Sort mode là string tự do vì có thể chứa giá trị động
  // VD: "sort_loai_vb_asc_Công văn", "sort_don_vi_desc_Bộ Tư pháp"
  sortMode?: string;
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
  sortMode: 'newest',
  loaiVanBan: 'ALL',
};

export type VtSortMode =
  | 'newest'
  | 'oldest'
  | 'priority'
  | 'sort_loai_vb_asc'
  | 'sort_loai_vb_desc'
  | 'sort_don_vi_asc'
  | 'sort_don_vi_desc'
  | 'sort_pvt_asc'
  | 'sort_pvt_desc'
  | 'sort_deadline_asc'
  | 'sort_deadline_desc';