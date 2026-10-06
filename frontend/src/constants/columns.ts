// frontend/src/constants/columns.ts
import { ColumnDefinition } from '../types/dispatch';

export const DEFAULT_COLUMNS: ColumnDefinition[] = [
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
