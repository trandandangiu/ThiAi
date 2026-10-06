export type DispatchStatus =
  // Trạng thái cơ bản
  | 'MOI_TAO'
  | 'DANG_XU_LY'
  | 'HOAN_THANH'
  | 'QUA_HAN'
  | 'SAP_DEN_HAN'
  | 'CHO_Y_KIEN_LANH_DAO'
  // Trạng thái workflow
  | 'CHO_PVT_XU_LY'      // Chờ PVT xử lý
  | 'CHO_TP_XU_LY'       // Chờ TP xử lý
  | 'CHO_PVT_DUYET'      // Chờ PVT duyệt (TP đã báo cáo)
  | 'CHO_VT_DUYET'       // Chờ VT duyệt (PVT đã trình)
  | 'CHO_TRINH_VT'       // Chờ trình VT (legacy)
  | 'VT_TRA_LAI'         // VT trả lại
  | 'PVT_TRA_LAI';       // PVT trả lại

export type UrgencyLevel = 'HOA_TOC' | 'THUONG_KHAN' | 'KHAN' | 'THUONG';

export interface Dispatch {
  id: string;
  ngayGui: string;          // NGÀY GỬI
  soCongVan: string;        // SỐ CÔNG VĂN (Mã định danh đối chiếu)
  ngayPhatHanh: string;     // NGÀY PHÁT HÀNH
  tenCongVan: string;       // TÊN CÔNG VĂN
  hanBaoCaoXuLy: string;    // HẠN BÁO CÁO, XỬ LÝ
  thoiHanXuLy: string;      // THỜI HẠN XỬ LÝ (ví dụ: Còn 3 ngày, Đúng hạn, Gấp...)
  donViBanHanh: string;     // ĐƠN VỊ BAN HÀNH
  nguoiThucHien: string;    // NGƯỜI THỰC HIỆN
  ghiChu: string;           // GHI CHÚ
  
  // Trạng thái & nâng cao phục vụ Lãnh đạo
  trangThai?: DispatchStatus;
  mucDoKhan?: UrgencyLevel;
  tienDo?: number;          // 0 - 100%
  
  // Phân công & Chỉ đạo điều hành
  assignedPvtId?: string;   // ID hoặc mã của PVT được giao (vd: u_pvt_1 hoặc PVT1)
  assignedPvtName?: string; // Tên PVT phụ trách
  vtChiDao?: string;        // Ý kiến chỉ đạo của Viện Trưởng
  assignedTpId?: string;    // ID hoặc mã của Trưởng phòng được giao (vd: u_tp_1 hoặc TP1)
  assignedTpName?: string;  // Tên Trưởng phòng phụ trách
  pvtChiDao?: string;       // Ý kiến chỉ đạo của Phó Viện Trưởng
  baoCaoTienDo?: string;    // Báo cáo kết quả của cấp phòng

  // Các cột linh hoạt người dùng có thể tùy biến thêm
  customFields?: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
}

export interface AttachedFile {
  name: string;
  size?: number | string;
  type?: string;
  dataUrl?: string;
}

export type ColumnDataType = 'text' | 'date' | 'number' | 'select' | 'status' | 'badge' | 'file';

export interface ColumnDefinition {
  id: string;               // key in Dispatch or customFields key
  label: string;            // Display title (e.g. NGÀY GỬI, SỐ CÔNG VĂN)
  type: ColumnDataType;
  required?: boolean;
  visible: boolean;
  isCustom: boolean;        // Standard template column vs user-created custom column
  width?: string;
  options?: string[];       // for select type
  description?: string;
}

export interface ReconciledDifference {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface ReconciledExistingItem {
  existing: Dispatch;
  incoming: Dispatch;
  differences: ReconciledDifference[];
  action: 'UPDATE' | 'SKIP' | 'APPEND'; // user can toggle per item or bulk
}

export interface ExcelImportAnalysis {
  fileName: string;
  totalRowsParsed: number;
  newItems: Dispatch[];
  existingMatches: ReconciledExistingItem[];
  unrecognizedColumns: string[];
  detectedColumns: { excelHeader: string; mappedField: string }[];
}

export type ReconciliationStrategy = 'UPDATE_EXISTING' | 'SKIP_EXISTING' | 'APPEND_AS_NEW' | 'CUSTOM';

export interface DispatchFilter {
  searchQuery: string;
  status: DispatchStatus | 'ALL';
  donViBanHanh: string | 'ALL';
  nguoiThucHien: string | 'ALL';
  urgency: UrgencyLevel | 'ALL';
  dateFrom: string;
  dateTo: string;
  overdueOnly: boolean;
}

export interface LeadershipDashboardStats {
  total: number;
  dangXuLy: number;
  sapDenHan: number;
  quaHan: number;
  hoanThanh: number;
  choYKien: number;
  rateOnTime: number; // percentage %
}
