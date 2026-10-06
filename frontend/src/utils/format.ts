// src/utils/format.ts

/**
 * Format ngày tháng hiển thị theo chuẩn Việt Nam: DD/MM/YYYY
 * Xử lý được:
 *  - Chuỗi ISO 8601 có timezone: "2026-09-09T18:00:00.000Z"
 *  - Chuỗi ISO 8601 không timezone: "2026-09-09T18:00:00"
 *  - Chuỗi ngày thuần: "2026-09-09"
 *  - Chuỗi đã đúng VN: "09/09/2026"
 *  - Date object
 *  - Dữ liệu cũ đã bị hỏng: "18T00:00:00.000Z/09/2026"
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '';

  // Nếu đã là Date object
  if (dateString instanceof Date) {
    if (isNaN(dateString.getTime())) return '';
    return formatToVN(dateString);
  }

  const str = String(dateString).trim();
  if (!str) return '';

  // Cứu dữ liệu đã bị hỏng từ logic cũ: "18T00:00:00.000Z/09/2026"
  const brokenMatch = str.match(/^(\d{1,2})T[\d:.]+Z\/(\d{2})\/(\d{4})$/);
  if (brokenMatch) {
    const [, d, m, y] = brokenMatch;
    return `${d.padStart(2, '0')}/${m}/${y}`;
  }

  // Chuỗi ISO 8601: "2026-09-09T18:00:00.000Z" hoặc "2026-09-09T18:00:00+07:00"
  const isoMatch = str.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/
  );
  if (isoMatch) {
    const [, y, m, d, hh, mm, , tz] = isoMatch;

    // Có giờ + timezone → convert sang giờ VN (UTC+7)
    if (hh !== undefined && tz !== undefined) {
      const iso = `${y}-${m}-${d}T${hh}:${mm}:00${tz === 'Z' ? 'Z' : tz}`;
      const dt = new Date(iso);
      if (!isNaN(dt.getTime())) return formatToVN(dt);
    }

    // Có giờ nhưng không timezone → coi như giờ local, giữ nguyên ngày
    // Chỉ có ngày YYYY-MM-DD → giữ nguyên ngày
    return `${d}/${m}/${y}`;
  }

  // Dạng DD/MM/YYYY đã đúng → chuẩn hóa padStart
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Fallback: thử parse tự động
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return formatToVN(fallback);

  return str;
};

/** Helper: format Date object theo giờ Việt Nam (UTC+7) */
function formatToVN(date: Date): string {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const d = String(vn.getUTCDate()).padStart(2, '0');
  const m = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const y = vn.getUTCFullYear();
  return `${d}/${m}/${y}`;
};
/**
 * Hiển thị thời gian tương đối: "Vừa xong", "5 phút trước", "2 giờ trước"...
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  const now = Date.now();
  const t = new Date(isoString).getTime();
  if (isNaN(t)) return '';

  const diff = Math.floor((now - t) / 1000); // giây

  if (diff < 30) return 'Vừa xong';
  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(isoString).toLocaleDateString('vi-VN');
}