import { Dispatch } from '../types/dispatch';

/**
 * Chuyển đổi các định dạng ngày (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, ISO) thành timestamp (ms)
 */
export const parseDateToTimestamp = (dateStr?: string): number => {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const str = dateStr.trim();
  if (!str) return 0;

  // 1. Dạng chuẩn ISO (có chữ T hoặc YYYY-MM-DD)
  if (str.includes('T') || /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str)) {
    const t = new Date(str).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 2. Dạng DD/MM/YYYY hoặc DD-MM-YYYY (thường gặp tại Việt Nam)
  const separator = str.includes('/') ? '/' : str.includes('-') ? '-' : null;
  if (separator) {
    const parts = str.split(separator);
    if (parts.length === 3) {
      // Nếu phần tử đầu là 4 số -> YYYY/MM/DD
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const t = new Date(y, m, d).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
      // Nếu phần tử cuối là 4 số -> DD/MM/YYYY
      if (parts[2].length === 4) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const t = new Date(y, m, d).getTime();
        if (!isNaN(t) && t > 0) return t;
      }
    }
  }

  const fallback = new Date(str).getTime();
  return isNaN(fallback) ? 0 : fallback;
};

/**
 * Lấy mốc thời gian đại diện cho công văn theo thứ tự ưu tiên:
 * 1. Ngày gửi / Ngày tiếp nhận (ngayGui)
 * 2. Ngày phát hành văn bản (ngayPhatHanh)
 * 3. Ngày tạo trên hệ thống (createdAt)
 * 4. Hạn báo cáo xử lý (hanBaoCaoXuLy)
 */
export const getDispatchSortTimestamp = (disp: Dispatch): number => {
  if (!disp) return 0;

  // Thử lấy ngày gửi trước (thể hiện thời điểm mới nhất của công văn tiếp nhận)
  const ngayGuiTime = parseDateToTimestamp(disp.ngayGui);
  const ngayPhatHanhTime = parseDateToTimestamp(disp.ngayPhatHanh);
  const createdTime = parseDateToTimestamp(disp.createdAt);

  // Lấy mốc ngày lớn nhất giữa ngayGui và ngayPhatHanh
  const maxDocDateTime = Math.max(ngayGuiTime, ngayPhatHanhTime);
  if (maxDocDateTime > 0) {
    // Nếu ngày văn bản bằng nhau, dùng createdTime hoặc timestamp id làm tie-breaker
    return maxDocDateTime * 1000 + (createdTime % 1000);
  }

  if (createdTime > 0) return createdTime;

  const hanTime = parseDateToTimestamp(disp.hanBaoCaoXuLy);
  if (hanTime > 0) return hanTime;

  // Fallback nếu id chứa timestamp số ví dụ cv-1726550...
  if (disp.id && disp.id.includes('-')) {
    const parts = disp.id.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum) && lastNum > 10000000) return lastNum;
  }

  return 0;
};

/**
 * Sắp xếp danh sách công văn luôn ưu tiên công văn MỚI NHẤT lên đầu tiên
 */
export const sortDispatchesNewestFirst = (list: Dispatch[]): Dispatch[] => {
  return [...list].sort((a, b) => {
    const timeA = getDispatchSortTimestamp(a);
    const timeB = getDispatchSortTimestamp(b);
    if (timeB !== timeA) {
      return timeB - timeA; // Mới nhất lên đầu
    }
    // Nếu cùng ngày, so sánh chuỗi số công văn hoặc ID
    return (b.id || '').localeCompare(a.id || '');
  });
};
