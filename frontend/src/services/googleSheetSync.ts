import { Dispatch } from '../types/dispatch';

const DEFAULT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz4KfWg7-7TkPUcpm9ainoTFfKlJYs-b70-ANBkM5bz8zaoFbeCdbZ9UPET_ybtnfbKCA/exec";

export const getGoogleSheetUrl = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vks_google_sheet_url') || DEFAULT_WEB_APP_URL;
  }
  return DEFAULT_WEB_APP_URL;
};

export const setGoogleSheetUrl = (url: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vks_google_sheet_url', url.trim());
  }
};

/**
 * Tự động đồng bộ một công văn lên Google Sheet khi thêm mới hoặc chỉnh sửa
 */
export const syncDispatchToGoogleSheet = async (dispatch: Dispatch): Promise<boolean> => {
  const url = getGoogleSheetUrl();
  if (!url || url.includes("DÁN_")) return false;

  try {
    // Dùng no-cors để trình duyệt gọi thẳng tới Google Apps Script an toàn không bị chặn
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: 'ADD_OR_UPDATE',
        checkDuplicate: true,
        ...dispatch
      }),
    });
    console.log(`[Google Sheet Sync] Đã gửi đồng bộ công văn: ${dispatch.soCongVan}`);
    return true;
  } catch (error) {
    console.error("[Google Sheet Sync Error]:", error);
    return false;
  }
};

/**
 * Đồng bộ hàng loạt nhiều công văn lên Google Sheet khi nhập từ Excel
 * Tự động chia nhỏ theo nhóm (batch) và hỗ trợ gửi payload gộp
 */
export const syncBulkDispatchesToGoogleSheet = async (
  dispatches: Dispatch[],
  onProgress?: (sent: number, total: number) => void
): Promise<{ success: boolean; sentCount: number; message: string }> => {
  const url = getGoogleSheetUrl();
  if (!url || url.includes("DÁN_")) {
    return {
      success: false,
      sentCount: 0,
      message: "Chưa cấu hình Google Apps Script Web App URL."
    };
  }

  if (dispatches.length === 0) {
    return { success: true, sentCount: 0, message: "Không có công văn cần gửi." };
  }

  try {
    // Chia theo nhóm 25 công văn / request để đồng bộ ngầm nhanh và không nghẽn mạng
    const CHUNK_SIZE = 25;
    let sentCount = 0;

    for (let i = 0; i < dispatches.length; i += CHUNK_SIZE) {
      const chunk = dispatches.slice(i, i + CHUNK_SIZE);
      await fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: 'BULK_IMPORT',
          checkDuplicate: true,
          total: chunk.length,
          items: chunk
        }),
      });

      sentCount += chunk.length;
      if (onProgress) {
        onProgress(sentCount, dispatches.length);
      }
    }

    console.log(`[Google Sheet Bulk Sync] Đồng bộ ngầm hoàn thành ${sentCount} công văn`);
    return {
      success: true,
      sentCount,
      message: `Đã đồng bộ ngầm thành công ${sentCount} công văn lên Google Sheets.`
    };
  } catch (error: any) {
    console.error("[Google Sheet Bulk Sync Error]:", error);
    return {
      success: false,
      sentCount: 0,
      message: error?.message || "Lỗi kết nối tới Google Sheets Web App."
    };
  }
};

/**
 * Phân tích dòng CSV cơ bản hỗ trợ dấu nháy kép
 */
function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Đọc dữ liệu công văn từ link Google Sheet (hỗ trợ cả link Google Sheets thông thường qua CSV và Web App Apps Script qua JSON)
 */
export const pullDispatchesFromGoogleSheet = async (): Promise<Dispatch[]> => {
  const url = getGoogleSheetUrl();
  if (!url || url.includes("DÁN_")) return [];

  try {
    // 1. Trường hợp 1: Link trực tiếp Google Spreadsheet (https://docs.google.com/spreadsheets/d/...)
    const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetIdMatch) {
      const spreadsheetId = sheetIdMatch[1];
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
      const res = await fetch(csvUrl);
      if (!res.ok) {
        console.warn(`[Google Sheet Pull] Không thể tải CSV từ Google Sheet (${res.status})`);
        return [];
      }
      const csvText = await res.text();
      const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) return [];

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
      
      const findColIndex = (keywords: string[]) => {
        return headers.findIndex(h => keywords.some(k => h.includes(k)));
      };

      const ngayGuiIdx = findColIndex(['ngày gửi', 'tiếp nhận', 'ngaygui']);
      const soCvIdx = findColIndex(['số công văn', 'số cv', 'socongvan', 'số hiệu']);
      const ngayPhatHanhIdx = findColIndex(['ngày phát hành', 'ngày ban hành', 'ngày ký']);
      const tenCvIdx = findColIndex(['tên công văn', 'trích yếu', 'tiêu đề', 'nội dung']);
      const donViIdx = findColIndex(['đơn vị', 'cơ quan', 'nơi gửi']);
      const hanBaoCaoIdx = findColIndex(['hạn báo cáo', 'hạn xử lý', 'thời hạn']);
      const nguoiThucHienIdx = findColIndex(['người thực hiện', 'người xử lý', 'cán bộ']);
      const thoiHanIdx = findColIndex(['thời hạn xử lý']);
      const ghiChuIdx = findColIndex(['ghi chú', 'ý kiến', 'chỉ đạo']);

      const parsedItems: Dispatch[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        const soCongVan = (soCvIdx >= 0 ? row[soCvIdx] : row[1]) || '';
        const tenCongVan = (tenCvIdx >= 0 ? row[tenCvIdx] : row[3]) || '';
        if (!soCongVan && !tenCongVan) continue;

        parsedItems.push({
          id: `gs_${Date.now()}_${i}_${soCongVan.replace(/[^a-zA-Z0-9]/g, '')}`,
          ngayGui: (ngayGuiIdx >= 0 ? row[ngayGuiIdx] : row[0]) || '',
          soCongVan: soCongVan.trim(),
          ngayPhatHanh: (ngayPhatHanhIdx >= 0 ? row[ngayPhatHanhIdx] : row[2]) || '',
          tenCongVan: tenCongVan.trim(),
          donViBanHanh: (donViIdx >= 0 ? row[donViIdx] : row[4]) || '',
          hanBaoCaoXuLy: (hanBaoCaoIdx >= 0 ? row[hanBaoCaoIdx] : row[5]) || '',
          nguoiThucHien: (nguoiThucHienIdx >= 0 ? row[nguoiThucHienIdx] : row[6]) || '',
          thoiHanXuLy: (thoiHanIdx >= 0 ? row[thoiHanIdx] : row[7]) || '',
          ghiChu: (ghiChuIdx >= 0 ? row[ghiChuIdx] : row[8]) || '',
          trangThai: 'DANG_XU_LY',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      return parsedItems;
    }

    // 2. Trường hợp 2: Link Google Apps Script Web App (https://script.google.com/macros/s/...)
    if (url.includes('script.google.com')) {
      const fetchUrl = url + (url.includes('?') ? '&' : '?') + 'action=GET_ALL';
      const res = await fetch(fetchUrl);
      if (!res.ok) return [];
      const json = await res.json();
      if (Array.isArray(json)) return json;
      if (json && json.status === 'success' && Array.isArray(json.items)) {
        return json.items;
      }
    }

    return [];
  } catch (err) {
    // Nếu gặp lỗi kết nối hoặc Google Sheet chưa cấp quyền, im lặng bỏ qua (không gây lỗi cho ứng dụng)
    console.warn("[Google Sheet Pull]: Không có dữ liệu hoặc không kết nối được", err);
    return [];
  }
};

/**
 * Tự động đồng bộ ngầm: Nếu trong Google Sheet có dữ liệu mới thì tự động thêm vào database, nếu không có thì thôi
 */
export const autoSyncFromGoogleSheet = async (
  currentDispatches: Dispatch[],
  onNewDispatchesAdded?: (newCount: number) => void
): Promise<number> => {
  try {
    const sheetDispatches = await pullDispatchesFromGoogleSheet();
    if (!sheetDispatches || sheetDispatches.length === 0) {
      return 0;
    }

    // Lập danh sách số công văn hiện tại để đối chiếu chống trùng
    const existingMap = new Set<string>();
    currentDispatches.forEach(d => {
      if (d.soCongVan) {
        existingMap.add(d.soCongVan.trim().toLowerCase());
      }
    });

    const newItemsToAdd: Dispatch[] = [];
    sheetDispatches.forEach(item => {
      const normSo = (item.soCongVan || '').trim().toLowerCase();
      if (normSo && !existingMap.has(normSo)) {
        existingMap.add(normSo);
        newItemsToAdd.push({
          ...item,
          id: item.id || `gs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          createdAt: item.createdAt || new Date().toISOString(),
          trangThai: item.trangThai || 'DANG_XU_LY'
        });
      }
    });

    if (newItemsToAdd.length > 0) {
      const merged = [...newItemsToAdd, ...currentDispatches];
      if (typeof window !== 'undefined') {
        localStorage.setItem('vks_dispatches_data', JSON.stringify(merged));
        window.dispatchEvent(new Event('storage'));
      }
      if (onNewDispatchesAdded) {
        onNewDispatchesAdded(newItemsToAdd.length);
      }
      console.log(`[Google Sheet AutoSync] Đã tự động thêm ${newItemsToAdd.length} công văn từ Google Sheet`);
      return newItemsToAdd.length;
    }

    return 0;
  } catch (err) {
    // Không có dữ liệu hoặc lỗi mạng -> im lặng bỏ qua
    return 0;
  }
};

/**
 * Mã nguồn mẫu Google Apps Script để gắn vào Google Sheet (Extensions > Apps Script)
 * Hỗ trợ cả 2 chiều:
 * - doGet: Đọc toàn bộ danh sách công văn (nếu ứng dụng cần lấy dữ liệu)
 * - doPost: Nhận công văn mới từ web, ĐỐI CHIẾU CHỐNG TRÙNG số công văn
 */
export const GOOGLE_APPS_SCRIPT_SAMPLE = `// 1. Nhận dữ liệu công văn từ website (Chống trùng lặp 100%)
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    
    // Thu thập danh sách công văn gửi lên
    var items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data.soCongVan) {
      items = [data];
    }
    
    if (items.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ status: "no_data" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Quét tất cả Số công văn hiện có trên Sheet để đối chiếu chống trùng
    var existingSoCV = {};
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var allData = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
      for (var r = 0; r < allData.length; r++) {
        for (var c = 0; c < allData[r].length; c++) {
          var val = String(allData[r][c] || '').trim().toLowerCase();
          if (val) {
            existingSoCV[val] = true;
          }
        }
      }
    }
    
    var inserted = 0;
    var skipped = 0;
    
    // Thêm từng công văn nếu chưa trùng số công văn
    items.forEach(function(item) {
      var soCV = String(item.soCongVan || '').trim().toLowerCase();
      if (!soCV || existingSoCV[soCV]) {
        skipped++;
        return; // ĐÃ TRÙNG SỐ CÔNG VĂN -> KHÔNG THÊM VÀO SHEET
      }
      
      sheet.appendRow([
        item.ngayGui || '',
        item.soCongVan || '',
        item.ngayPhatHanh || '',
        item.tenCongVan || '',
        item.donViBanHanh || '',
        item.hanBaoCaoXuLy || '',
        item.nguoiThucHien || '',
        item.thoiHanXuLy || '',
        item.ghiChu || ''
      ]);
      
      existingSoCV[soCV] = true;
      inserted++;
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      inserted: inserted,
      skipped: skipped
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. Cung cấp dữ liệu công văn cho website (Đồng bộ chiều ngược lại)
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", items: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    var items = data.map(function(row, idx) {
      return {
        id: "gs_" + idx + "_" + (row[1] || idx),
        ngayGui: row[0] ? (row[0] instanceof Date ? Utilities.formatDate(row[0], "GMT+7", "yyyy-MM-dd") : String(row[0])) : "",
        soCongVan: String(row[1] || "").trim(),
        ngayPhatHanh: row[2] ? (row[2] instanceof Date ? Utilities.formatDate(row[2], "GMT+7", "yyyy-MM-dd") : String(row[2])) : "",
        tenCongVan: String(row[3] || "").trim(),
        donViBanHanh: String(row[4] || "").trim(),
        hanBaoCaoXuLy: row[5] ? (row[5] instanceof Date ? Utilities.formatDate(row[5], "GMT+7", "yyyy-MM-dd") : String(row[5])) : "",
        nguoiThucHien: String(row[6] || "").trim(),
        thoiHanXuLy: String(row[7] || "").trim(),
        ghiChu: String(row[8] || "").trim()
      };
    }).filter(function(item) {
      return Boolean(item.soCongVan || item.tenCongVan);
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success", items: items }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;