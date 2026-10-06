// src/services/excelService.ts
import * as XLSX from 'xlsx';
import { ColumnDefinition, Dispatch, ExcelImportAnalysis, ReconciledDifference, ReconciledExistingItem } from '../types/dispatch';
import { isChuyenDe, getChuyenDePhase } from '../utils/chuyenDe';

// ============================================
// NORMALIZE
// ============================================
export const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

export const normalizeDispatchKey = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// ============================================
// HEADER MAPPING
// ============================================
const HEADER_MAPPING: Record<string, string[]> = {
  ngayGui: ['ngaygui', 'ngaynhan', 'ngaytiepnhan', 'ngayden', 'ngaychuyen', 'ngay'],
  soCongVan: [
    'socongvan',
    'scv',
    'socv',
    'sovanban',
    'sohieu',
    'sohieucv',
    'sohieuvb',
    'sohieucongvan',
    'so',
    'mavanban',
    'macongvan',
    'sohieugiayto'
  ],
  ngayPhatHanh: ['ngayphathanh', 'ngaybanhanh', 'ngayky', 'ngayvanban', 'ngayvb'],
  tenCongVan: ['tencongvan', 'trichyeu', 'noidung', 'tenvanban', 'trichyeunoidung', 'tieude', 'noidungvanban', 'noidungcongvan'],
  hanBaoCaoXuLy: ['hanbaocaoxuly', 'hanxuly', 'hanbaocao', 'thoihanbaocao', 'deadline', 'hanhoanthanh', 'ngayhethan', 'han'],
  thoiHanXuLy: ['thoihanxuly', 'thoihan', 'tinhtrangthoihan', 'songayconlai', 'tiendo', 'tinhtrang'],
  donViBanHanh: ['donvibanhanh', 'noibanhanh', 'coquanbanhanh', 'coquan', 'donvi', 'noigui', 'coquannoigui'],
  nguoiThucHien: ['nguoithuchien', 'canbothuchien', 'nguoiphutrach', 'chuyenvien', 'canbo', 'nguoixuly', 'nguoinhan', 'canbophutrach'],
  ghiChu: ['ghichu', 'ykienchidao', 'luuy', 'chidao', 'ketquaxuly', 'note', 'chuyen', 'ykien']
};

export const matchFieldToHeader = (headerText: string, customColumns: ColumnDefinition[] = []): string | null => {
  const normalized = normalizeString(headerText);
  if (!normalized) return null;

  for (const [fieldKey, aliases] of Object.entries(HEADER_MAPPING)) {
    if (aliases.includes(normalized)) return fieldKey;
  }

  for (const [fieldKey, aliases] of Object.entries(HEADER_MAPPING)) {
    if (
      aliases.some(
        alias =>
          normalized === alias ||
          normalized.includes(alias) ||
          (alias.length > 2 && alias.includes(normalized))
      )
    ) {
      return fieldKey;
    }
  }

  for (const col of customColumns) {
    if (normalizeString(col.label) === normalized || normalizeString(col.id) === normalized) {
      return `custom_${col.id}`;
    }
  }

  return null;
};

// ============================================
// PARSE DATE AN TOÀN
// ============================================
export const parseDateSafely = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'number') {
    const d = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  const s = String(dateVal).trim();
  if (!s) return null;

  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const ymdMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
};

// ============================================
// ⭐ RESOLVE STATUS — FULLY FIXED
// ============================================
export const resolveDispatchStatus = (d: Partial<Dispatch>): Dispatch['trangThai'] => {
  if (!d) return 'DANG_XU_LY';

  const thoiHanText = String(d.thoiHanXuLy || '').trim().toLowerCase();

  // 1. HOÀN THÀNH
  if (
    d.trangThai === 'HOAN_THANH' ||
    thoiHanText.includes('hoàn thành') ||
    thoiHanText.includes('đã xong') ||
    thoiHanText === 'xong' ||
    d.tienDo === 100
  ) {
    return 'HOAN_THANH';
  }

  // 2. CHỜ Ý KIẾN LÃNH ĐẠO
  if (d.trangThai === 'CHO_Y_KIEN_LANH_DAO' || thoiHanText.includes('chờ ý kiến')) {
    return 'CHO_Y_KIEN_LANH_DAO';
  }

  // 3. QUÁ HẠN (theo text)
  if (
    d.trangThai === 'QUA_HAN' ||
    thoiHanText.includes('quá hạn') ||
    thoiHanText.includes('trễ hạn') ||
    thoiHanText.includes('hết hạn')
  ) {
    return 'QUA_HAN';
  }

  // 4. SẮP ĐẾN HẠN (theo text)
  if (
    d.trangThai === 'SAP_DEN_HAN' ||
    thoiHanText.includes('sắp đến hạn') ||
    thoiHanText.includes('sắp hết hạn') ||
    thoiHanText.includes('còn 1 ngày') ||
    thoiHanText.includes('còn 2 ngày') ||
    thoiHanText.includes('còn 3 ngày') ||
    thoiHanText.includes('hôm nay') ||
    thoiHanText.includes('khẩn')
  ) {
    return 'SAP_DEN_HAN';
  }

  // 5. TÍNH THEO HẠN — QUY TẮC MỚI
  if (d.hanBaoCaoXuLy) {
    const dDate = parseDateSafely(d.hanBaoCaoXuLy);
    if (dDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dDate.setHours(0, 0, 0, 0);
      const diffMs = dDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return 'QUA_HAN';
      } else if (diffDays <= 3) {
        return 'SAP_DEN_HAN';
      } else {
        return 'DANG_XU_LY';
      }
    }
  }

  // ⭐ FALLBACK CUỐI — BẮT BUỘC PHẢI CÓ
  return (d.trangThai as Dispatch['trangThai']) || 'DANG_XU_LY';
};

// ============================================
// ⭐ CALCULATE TIME REMAINING
// ============================================
export const calculateTimeRemaining = (
  deadlineDateStr: string,
  currentStatus?: string,
  existingThoiHanText?: string
): { text: string; status: Dispatch['trangThai'] } => {
  const existingText = String(existingThoiHanText || '').trim();
  const lower = existingText.toLowerCase();

  if (
    currentStatus === 'HOAN_THANH' ||
    lower.includes('hoàn thành') ||
    lower.includes('đã xong') ||
    lower === 'xong'
  ) {
    return { text: existingText || 'Đã hoàn thành', status: 'HOAN_THANH' };
  }

  if (currentStatus === 'CHO_Y_KIEN_LANH_DAO' || lower.includes('chờ ý kiến')) {
    return { text: existingText || 'Chờ ý kiến Lãnh đạo', status: 'CHO_Y_KIEN_LANH_DAO' };
  }

  const dDate = parseDateSafely(deadlineDateStr);
  if (!dDate) {
    if (existingText) {
      if (lower.includes('quá hạn') || lower.includes('trễ') || lower.includes('hết hạn')) {
        return { text: existingText, status: 'QUA_HAN' };
      }
      if (
        lower.includes('sắp') ||
        lower.includes('còn 1 ngày') ||
        lower.includes('còn 2 ngày') ||
        lower.includes('còn 3 ngày') ||
        lower.includes('hôm nay') ||
        lower.includes('khẩn')
      ) {
        return { text: existingText, status: 'SAP_DEN_HAN' };
      }
      return { text: existingText, status: (currentStatus as Dispatch['trangThai']) || 'DANG_XU_LY' };
    }
    return { text: 'Chưa có hạn', status: (currentStatus as Dispatch['trangThai']) || 'DANG_XU_LY' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dDate.setHours(0, 0, 0, 0);

  const diffMs = dDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, status: 'QUA_HAN' };
  } else if (diffDays === 0) {
    return { text: 'Đến hạn', status: 'SAP_DEN_HAN' };
  } else if (diffDays <= 3) {
    return { text: `Sắp đến hạn`, status: 'SAP_DEN_HAN' };
  } else {
    return { text: `Đang xử lý`, status: 'DANG_XU_LY' };
  }
};

// ============================================
// FORMAT DATE VALUE
// ============================================
export const formatDateValue = (val: any): string => {
  if (!val) return '';
  if (val instanceof Date) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const str = String(val).trim();
  const dmYRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
  const match = str.match(dmYRegex);
  if (match) {
    const dd = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    const yyyy = match[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return str;
};

// ============================================
// IS DATE LIKE
// ============================================
export const isDateLike = (val: any): boolean => {
  if (!val) return false;
  if (val instanceof Date) return true;
  if (typeof val === 'number' && val > 30000 && val < 60000) return true;
  const str = String(val).trim();
  return /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(str) || /^\d{4}-\d{2}-\d{2}$/.test(str);
};

// ============================================
// INFERENCE
// ============================================
export const inferAgencyFromDispatchNumber = (scv: string): string => {
  if (!scv) return 'Chưa xác định';
  const parts = scv.split('/');
  if (parts.length > 1) {
    const rawAgency = parts[1].trim();
    const upper = rawAgency.toUpperCase();
    if (upper.includes('BTP') && upper.includes('CQLTHADS')) {
      return 'Bộ Tư pháp (Cục QLTHADS)';
    }
    if (upper.includes('BTP')) return 'Bộ Tư pháp';
    if (upper.includes('VKSNDTC') || upper.includes('VKSTC')) return 'VKSND Tối cao';
    if (upper.includes('TANDTC')) return 'TAND Tối cao';
    if (upper.includes('BCA')) return 'Bộ Công an';
    if (upper.includes('VPCP')) return 'Văn phòng Chính phủ';
    if (upper.includes('UBND')) return 'UBND';
    if (upper.includes('STC')) return 'Sở Tài chính';
    if (upper.includes('TTR')) return 'Thanh tra';
    return rawAgency;
  }
  return 'Chưa xác định';
};

export const inferAssigneeFromNotes = (notes: string): string => {
  if (!notes) return 'Chưa phân công';
  const nameMatch = notes.match(
    /(?:chuy[ểe]n|giao|ph[âa]n\s*c[ôo]ng|k[íi]nh\s*chuy[ểe]n|[đd]\/c|[đd][ồồ]ng\s*ch[íi])\s*(?:pvt|vt|pct|ct|pbgd|bgd|tr[ưở]ng\s*ph[òo]ng|ph[óo]\s*ph[òo]ng|chuy[êe]n\s*vi[êe]n)?\s*[-:–]?\s*([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+(?:\s+[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ][a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+){1,3})/i
  );
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1].trim();
  }
  return 'Chưa phân công';
};

// ============================================
// PARSE TEXT TO ROWS
// ============================================
export const parseTextToRows = (text: string): any[][] => {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  return lines.map(line => {
    if (line.includes('\t')) {
      return line.split('\t').map(c => c.trim());
    }
    if (line.includes(',')) {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      cells.push(current.trim());
      return cells;
    }
    return line.split(/\s{2,}/).map(c => c.trim());
  });
};

// ============================================
// PARSE ROWS TO ANALYSIS
// ============================================
export const parseRowsToAnalysis = (
  rows: any[][],
  sourceName: string,
  existingDispatches: Dispatch[],
  customColumns: ColumnDefinition[]
): ExcelImportAnalysis => {
  if (!rows || rows.length === 0) {
    throw new Error('Không có dữ liệu nào được cung cấp.');
  }

  let headerRowIndex = -1;
  let maxMatchedHeaders = 0;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    let matchedCount = 0;
    row.forEach((cell: any) => {
      const str = String(cell || '').trim();
      if (!str) return;
      if (matchFieldToHeader(str, customColumns)) {
        matchedCount++;
      }
    });

    if (matchedCount > maxMatchedHeaders) {
      maxMatchedHeaders = matchedCount;
      headerRowIndex = r;
    }
  }

  if (headerRowIndex === -1 || maxMatchedHeaders < 1) {
    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      const rowStr = row.map((c: any) => normalizeString(String(c || ''))).join(' ');
      if (
        rowStr.includes('scv') ||
        rowStr.includes('socongvan') ||
        rowStr.includes('congvan') ||
        rowStr.includes('ngaygui') ||
        rowStr.includes('trichyeu')
      ) {
        headerRowIndex = r;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const rawHeaders: string[] = rows[headerRowIndex].map((cell: any) => String(cell || '').trim());
  const columnMapping: { index: number; originalHeader: string; mappedField: string | null }[] = [];
  const unrecognizedColumns: string[] = [];
  const detectedColumns: { excelHeader: string; mappedField: string }[] = [];

  rawHeaders.forEach((headerText, index) => {
    if (!headerText) return;
    const mapped = matchFieldToHeader(headerText, customColumns);
    columnMapping.push({ index, originalHeader: headerText, mappedField: mapped });
    if (mapped) {
      detectedColumns.push({ excelHeader: headerText, mappedField: mapped });
    } else {
      unrecognizedColumns.push(headerText);
    }
  });

  const parsedItems: Dispatch[] = [];
  let lastSeenNgayGui = '';

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((cell: any) => String(cell || '').trim() === '')) {
      continue;
    }

    const nonDateValues = row.filter((c: any) => {
      const s = String(c || '').trim();
      return s !== '' && !isDateLike(s);
    });

    if (nonDateValues.length === 0) {
      const dateCell = row.find((c: any) => isDateLike(c));
      if (dateCell) {
        lastSeenNgayGui = formatDateValue(dateCell);
      }
      continue;
    }

    const rowObj: Partial<Dispatch> = {
      id: `imported-${Date.now()}-${r}`,
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    columnMapping.forEach(({ index, mappedField, originalHeader }) => {
      const cellValue = row[index];
      if (cellValue === undefined || cellValue === null || String(cellValue).trim() === '') return;

      if (mappedField) {
        if (mappedField.startsWith('custom_')) {
          const customKey = mappedField.replace('custom_', '');
          rowObj.customFields![customKey] = cellValue;
        } else if (
          mappedField === 'ngayGui' ||
          mappedField === 'ngayPhatHanh' ||
          mappedField === 'hanBaoCaoXuLy'
        ) {
          (rowObj as any)[mappedField] = formatDateValue(cellValue);
        } else {
          (rowObj as any)[mappedField] = String(cellValue).trim();
        }
      } else {
        const cleanKey = originalHeader.trim();
        rowObj.customFields![cleanKey] = cellValue;
      }
    });

    if (!rowObj.soCongVan && !rowObj.tenCongVan) {
      const dispatchNumberCell = row.find((c: any) => {
        const s = String(c || '').trim();
        return /\d+\/[A-Za-z0-9-]+/.test(s);
      });
      if (dispatchNumberCell) {
        rowObj.soCongVan = String(dispatchNumberCell).trim();
      } else {
        continue;
      }
    }

    if (!rowObj.ngayGui) {
      rowObj.ngayGui = lastSeenNgayGui || formatDateValue(new Date());
    } else {
      lastSeenNgayGui = rowObj.ngayGui;
    }

    if (!rowObj.soCongVan) {
      rowObj.soCongVan = `CV-${Date.now().toString().slice(-4)}-${r}`;
    }

    if (!rowObj.tenCongVan) {
      rowObj.tenCongVan = 'Công văn chưa có trích yếu';
    }

    if (!rowObj.donViBanHanh || rowObj.donViBanHanh === 'Chưa xác định') {
      rowObj.donViBanHanh = inferAgencyFromDispatchNumber(rowObj.soCongVan);
    }

    if (!rowObj.nguoiThucHien || rowObj.nguoiThucHien === 'Chưa phân công') {
      if (rowObj.ghiChu) {
        const inferredName = inferAssigneeFromNotes(rowObj.ghiChu);
        if (inferredName !== 'Chưa phân công') {
          rowObj.nguoiThucHien = inferredName;
        } else {
          rowObj.nguoiThucHien = 'Chưa phân công';
        }
      } else {
        rowObj.nguoiThucHien = 'Chưa phân công';
      }
    }

    if (!rowObj.ghiChu) {
      rowObj.ghiChu = '';
    }

    const timing = calculateTimeRemaining(rowObj.hanBaoCaoXuLy || '', rowObj.trangThai, rowObj.thoiHanXuLy);
    if (!rowObj.thoiHanXuLy) {
      rowObj.thoiHanXuLy = timing.text;
    }
    rowObj.trangThai = resolveDispatchStatus(rowObj);

    parsedItems.push(rowObj as Dispatch);
  }

  // Reconciliation
  const newItems: Dispatch[] = [];
  const existingMatches: ReconciledExistingItem[] = [];

  const existingMap = new Map<string, Dispatch>();
  existingDispatches.forEach(disp => {
    const key = normalizeDispatchKey(disp.soCongVan);
    if (key) {
      existingMap.set(key, disp);
    }
  });

  const fieldLabels: Record<string, string> = {
    ngayGui: 'Ngày gửi',
    soCongVan: 'Số công văn',
    ngayPhatHanh: 'Ngày phát hành',
    tenCongVan: 'Tên công văn',
    hanBaoCaoXuLy: 'Hạn báo cáo, xử lý',
    thoiHanXuLy: 'Thời hạn xử lý',
    donViBanHanh: 'Đơn vị ban hành',
    nguoiThucHien: 'Người thực hiện',
    ghiChu: 'Ghi chú'
  };

  parsedItems.forEach(incoming => {
    const normalizedKey = normalizeDispatchKey(incoming.soCongVan);
    const matchedExisting = normalizedKey ? existingMap.get(normalizedKey) : null;

    if (matchedExisting) {
      const differences: ReconciledDifference[] = [];
      const keysToCheck: (keyof Dispatch)[] = [
        'ngayGui',
        'ngayPhatHanh',
        'tenCongVan',
        'hanBaoCaoXuLy',
        'thoiHanXuLy',
        'donViBanHanh',
        'nguoiThucHien',
        'ghiChu'
      ];

      keysToCheck.forEach(key => {
        const oldVal = (matchedExisting as any)[key] || '';
        const newVal = (incoming as any)[key] || '';
        if (oldVal !== newVal && newVal !== '') {
          differences.push({
            field: String(key),
            fieldLabel: fieldLabels[String(key)] || String(key),
            oldValue: oldVal,
            newValue: newVal
          });
        }
      });

      if (incoming.customFields) {
        Object.entries(incoming.customFields).forEach(([cKey, cVal]) => {
          const oldCVal = matchedExisting.customFields?.[cKey] || '';
          if (oldCVal !== cVal && cVal !== '') {
            differences.push({
              field: `custom_${cKey}`,
              fieldLabel: cKey,
              oldValue: oldCVal,
              newValue: cVal
            });
          }
        });
      }

      existingMatches.push({
        existing: matchedExisting,
        incoming,
        differences,
        action: 'UPDATE'
      });
    } else {
      newItems.push(incoming);
    }
  });

  return {
    fileName: sourceName,
    totalRowsParsed: parsedItems.length,
    newItems,
    existingMatches,
    unrecognizedColumns,
    detectedColumns
  };
};

// ============================================
// PARSE EXCEL & RECONCILE
// ============================================
export const parseExcelAndReconcile = async (
  file: File,
  existingDispatches: Dispatch[],
  customColumns: ColumnDefinition[]
): Promise<ExcelImportAnalysis> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: true, type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  return parseRowsToAnalysis(rows, file.name, existingDispatches, customColumns);
};

// ============================================
// PARSE PASTED TEXT & RECONCILE
// ============================================
export const parsePastedTextAndReconcile = (
  text: string,
  existingDispatches: Dispatch[],
  customColumns: ColumnDefinition[]
): ExcelImportAnalysis => {
  const rows = parseTextToRows(text);
  return parseRowsToAnalysis(rows, 'Dữ liệu dán trực tiếp', existingDispatches, customColumns);
};

// ============================================
// EXPORT DISPATCHES TO EXCEL
// ============================================
export const exportDispatchesToExcel = (
  dispatches: Dispatch[],
  columns: ColumnDefinition[],
  reportTitle: string = 'THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN'
) => {
  const visibleColumns = columns.filter(c => c.visible);

  const headerRow: string[] = [
    'STT',
    ...visibleColumns.map(c => c.label.toUpperCase()),
  ];

  const dataRows: any[][] = dispatches.map((item, idx) => {
    const row: any[] = [idx + 1];

    visibleColumns.forEach(col => {
      let cell: any = '';

      if (col.id === 'donViThucHien' || col.label.toLowerCase().includes('thực hiện')) {
        const parts: string[] = [];
        if (item.assignedPvtName) {
          parts.push(
            `PVT: ${item.assignedPvtName.replace(/^Đ\/c\s+/, '').replace(/^Đồng chí\s+/i, '').trim()}`
          );
        }
        if (item.assignedTpName) {
          parts.push(
            `TP: ${item.assignedTpName.replace(/^Đ\/c\s+/, '').replace(/^Đồng chí\s+/i, '').trim()}`
          );
        }
        if (item.nguoiThucHien) {
          parts.push(item.nguoiThucHien);
        }
        cell = parts.join('\n');
        row.push(cell);
        return;
      }

      if (col.id === 'attachments' || col.label.toLowerCase() === 'file') {
        const cnt =
          (item as any)._count?.attachments ??
          (Array.isArray((item as any).attachments)
            ? (item as any).attachments.length
            : 0);
        cell = cnt > 0 ? cnt : '';
        row.push(cell);
        return;
      }

      if (col.id === 'trangThai') {
        const st = resolveDispatchStatus(item);
        const map: Record<string, string> = {
          HOAN_THANH: 'Đã hoàn thành',
          QUA_HAN: 'Quá hạn',
          SAP_DEN_HAN: 'Sắp đến hạn',
          DANG_XU_LY: 'Đang xử lý',
          CHO_PVT_XU_LY: 'Chờ PVT xử lý',
          CHO_TP_XU_LY: 'Chờ TP xử lý',
          CHO_PVT_DUYET: 'Chờ PVT duyệt',
          CHO_VT_DUYET: 'Chờ VT duyệt',
          MOI_TAO: 'Mới tạo',
        };
        cell = map[st || ''] || st || '';
        row.push(cell);
        return;
      }

      if (col.isCustom) {
        const val = item.customFields?.[col.id];
        if (val && typeof val === 'object' && (val as any).name) {
          cell = (val as any).name;
        } else {
          cell = val ?? '';
        }
        row.push(cell);
        return;
      }

      if (col.type === 'date') {
        const val = (item as any)[col.id];
        if (val) {
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            cell = `${dd}/${mm}/${d.getFullYear()}`;
          } else {
            cell = String(val);
          }
        }
        row.push(cell);
        return;
      }

      const val = (item as any)[col.id];
      if (val && typeof val === 'object' && (val as any).name) {
        cell = (val as any).name;
      } else {
        cell = val ?? '';
      }
      row.push(cell);
    });

    return row;
  });

  const tableData: any[][] = [];

  const titleRow = new Array(headerRow.length).fill('');
  titleRow[0] = reportTitle.toUpperCase();
  tableData.push(titleRow);

  tableData.push(headerRow);

  dataRows.forEach(r => tableData.push(r));

  const ws = XLSX.utils.aoa_to_sheet(tableData);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } },
  ];

  ws['!cols'] = headerRow.map((label, idx) => {
    if (idx === 0) return { wch: 6 };
    const col = visibleColumns[idx - 1];
    if (!col) return { wch: 15 };

    if (col.id === 'tenCongVan') return { wch: 55 };
    if (col.id === 'donViThucHien') return { wch: 30 };
    if (col.id === 'donViBanHanh') return { wch: 25 };
    if (col.id === 'soCongVan') return { wch: 20 };
    if (col.id === 'ngayGui' || col.id === 'hanBaoCaoXuLy') return { wch: 14 };
    if (col.id === 'thoiHanXuLy') return { wch: 16 };
    if (col.id === 'trangThai') return { wch: 18 };
    if (col.id === 'ghiChu') return { wch: 30 };
    if (col.id === 'nguoiThucHien') return { wch: 22 };
    if (col.id === 'attachments') return { wch: 8 };
    return { wch: 15 };
  });

  ws['!rows'] = [{ hpt: 24 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'CongVan');

  const currentDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BaoCao_CongVan_${currentDate}.xlsx`);
};

// ============================================
// EXPORT LEADERSHIP REPORT
// ============================================
export const exportLeadershipReportToExcel = (
  dispatches: Dispatch[],
  title: string = 'BÁO CÁO TIẾN ĐỘ XỬ LÝ CÔNG VĂN GỬI LÃNH ĐẠO VIỆN KIỂM SÁT'
) => {
  const headers = [
    'STT',
    'Số công văn',
    'Ngày gửi/nhận',
    'Ngày ban hành',
    'Đơn vị ban hành',
    'Trích yếu nội dung',
    'Phó Viện Trưởng phụ trách',
    'Chỉ đạo của Viện Trưởng',
    'Phòng ban thụ lý',
    'Chỉ đạo của PVT',
    'Cán bộ thực hiện',
    'Hạn báo cáo / xử lý',
    'Tình trạng thời hạn',
    'Tiến độ (%)',
    'Trạng thái',
    'Báo cáo kết quả / tiến độ'
  ];

  const tableData: any[][] = [];
  const titleRow = new Array(headers.length).fill('');
  titleRow[0] = title.toUpperCase();
  tableData.push(titleRow);
  tableData.push(headers);

  dispatches.forEach((d, idx) => {
    const st = resolveDispatchStatus(d);
    tableData.push([
      idx + 1,
      d.soCongVan || '',
      d.ngayGui || '',
      d.ngayPhatHanh || '',
      d.donViBanHanh || '',
      d.tenCongVan || '',
      d.assignedPvtName || '',
      d.vtChiDao || '',
      d.assignedTpName || '',
      d.pvtChiDao || '',
      d.nguoiThucHien || '',
      d.hanBaoCaoXuLy || '',
      d.thoiHanXuLy || '',
      `${d.tienDo ?? 0}%`,
      st === 'HOAN_THANH'
        ? 'Đã hoàn thành'
        : st === 'QUA_HAN'
          ? 'Quá hạn'
          : st === 'SAP_DEN_HAN'
            ? 'Sắp đến hạn'
            : 'Đang xử lý',
      d.baoCaoTienDo || ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(tableData);
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }
  ];

  ws['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 45 },
    { wch: 24 },
    { wch: 30 },
    { wch: 24 },
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 35 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoLanhDao');
  const currentDate = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `BaoCao_CongVan_Gui_LanhDao_${currentDate}.xlsx`);
};

// ============================================
// DOWNLOAD SAMPLE TEMPLATE
// ============================================
export const downloadSampleTemplate = (columns: ColumnDefinition[]) => {
  const visibleColumns = columns.filter(c => c.visible);
  const headerLabels = visibleColumns.map(c => c.label.toUpperCase());

  const sampleRows = [
    [
      '2026-06-18',
      '4320/BTP-CQLTHADS',
      '2026-06-17',
      'V/v phối hợp thực hiện Quy chế số 14/2013/QCLN/BTP-BCA-TANDTC-VKSNDTC',
      '2026-06-28',
      'Còn 10 ngày',
      'Bộ Tư pháp (Cục QLTHADS)',
      'Nguyễn Phước Trung',
      'Chuyển PVT - Nguyễn Phước Trung'
    ],
    [
      '2026-09-16',
      '188/UBND-TH',
      '2026-09-15',
      'Báo cáo tổng kết công tác chỉ đạo điều hành Quý III và nhiệm vụ trọng tâm Quý IV',
      '2026-09-22',
      'Còn 6 ngày',
      'Văn phòng UBND',
      'Nguyễn Văn An',
      'Xin ý kiến Thường trực Lãnh đạo trước ngày 20/9'
    ],
    [
      '2026-09-14',
      '95/KH-SXD',
      '2026-09-12',
      'Kế hoạch kiểm tra quy hoạch đô thị và các dự án phát triển nhà ở xã hội',
      '2026-09-18',
      'Còn 2 ngày',
      'Sở Xây dựng',
      'Lê Thị Mai',
      'Chuẩn bị tài liệu cho buổi làm việc với Đoàn công tác'
    ]
  ];

  const tableData: any[][] = [];
  const titleRow = new Array(visibleColumns.length).fill('');
  titleRow[0] = 'CÔNG VĂN GỬI LÃNH ĐẠO';
  tableData.push(titleRow);
  tableData.push(headerLabels);

  sampleRows.forEach(row => {
    const fullRow = [...row];
    while (fullRow.length < visibleColumns.length) {
      fullRow.push('');
    }
    tableData.push(fullRow.slice(0, visibleColumns.length));
  });

  const ws = XLSX.utils.aoa_to_sheet(tableData);
  if (visibleColumns.length > 1) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: visibleColumns.length - 1 } }
    ];
  }

  ws['!cols'] = visibleColumns.map(c => {
    if (c.id === 'tenCongVan') return { wch: 45 };
    if (c.id === 'ghiChu') return { wch: 30 };
    if (c.id === 'donViBanHanh') return { wch: 22 };
    if (c.id === 'soCongVan') return { wch: 18 };
    return { wch: 16 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BieuMau_CongVan');
  XLSX.writeFile(wb, 'BieuMau_CongVan_GuiLanhDao.xlsx');
};