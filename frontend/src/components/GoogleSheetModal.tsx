import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Check, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw,
  Send,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  getGoogleSheetUrl, 
  setGoogleSheetUrl, 
  syncDispatchToGoogleSheet, 
  GOOGLE_APPS_SCRIPT_SAMPLE 
} from '../services/googleSheetSync';
import { Dispatch } from '../types/dispatch';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  sampleDispatch?: Dispatch;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  showToast,
  sampleDispatch
}) => {
  const [url, setUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; text?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getGoogleSheetUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveUrl = () => {
    if (!url.trim()) {
      showToast('Vui lòng không để trống URL Google Apps Script', 'warning');
      return;
    }
    setGoogleSheetUrl(url.trim());
    showToast('Đã lưu cấu hình Google Apps Script Web App URL thành công!');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SAMPLE);
    setIsCopied(true);
    showToast('Đã sao chép mã Apps Script chống trùng lặp vào bộ nhớ tạm!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleTestSync = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const dummy: Dispatch = sampleDispatch || {
        id: `test-${Date.now()}`,
        soCongVan: `TEST-${Math.floor(1000 + Math.random() * 9000)}/VKS`,
        ngayGui: new Date().toISOString().split('T')[0],
        ngayPhatHanh: new Date().toISOString().split('T')[0],
        tenCongVan: 'Kiểm tra kết nối đồng bộ từ Hệ thống Quản lý Công văn VKS',
        donViBanHanh: 'Viện kiểm sát nhân dân',
        hanBaoCaoXuLy: new Date().toISOString().split('T')[0],
        nguoiThucHien: 'Quản trị viên',
        thoiHanXuLy: 'Hôm nay',
        trangThai: 'DANG_XU_LY',
        doKhan: 'BINH_THUONG',
        ghiChu: 'Gửi thử nghiệm đối chiếu trùng số công văn',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const success = await syncDispatchToGoogleSheet(dummy);
      if (success) {
        setTestResult({
          success: true,
          text: `Đã gửi thành công công văn kiểm tra: ${dummy.soCongVan} tới Google Sheets!`
        });
        showToast('Kết nối Google Sheets thành công!');
      } else {
        setTestResult({
          success: false,
          text: 'Không thể kết nối. Vui lòng kiểm tra lại URL Web App hoặc quyền truy cập ("Anyone").'
        });
        showToast('Kết nối thất bại!', 'error');
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        text: e?.message || 'Lỗi gửi yêu cầu tới Google Apps Script'
      });
      showToast('Lỗi gửi kết nối', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Red/White */}
        <div 
          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
          className="p-4 sm:p-5 border-b text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-300 tracking-wider uppercase">
                VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
              </div>
              <h2 className="text-base sm:text-lg font-bold">
                KẾT NỐI & ĐỒNG BỘ GOOGLE SHEETS
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          {/* Duplicate protection guarantee banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-emerald-950">
                Cơ chế đối chiếu chống trùng số công văn đã được kích hoạt:
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Khi đưa dữ liệu vào hệ thống và Google Sheets:
                Hệ thống tự động so khớp <strong>Số công văn</strong>. Nếu số công văn đã tồn tại trong database hoặc trên Google Sheets, 
                hệ thống <strong>sẽ bỏ qua không đưa vào database</strong>, đảm bảo dữ liệu luôn duy nhất và không bị nhân bản trùng lặp.
              </p>
            </div>
          </div>

          {/* Web App URL Config */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>Đường dẫn Web App (Google Apps Script URL):</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/30 focus:border-red-600 transition"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveUrl}
                  style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
                  className="px-4 py-2.5 text-xs font-bold text-white rounded-xl hover:brightness-110 border shadow-xs transition cursor-pointer whitespace-nowrap"
                >
                  Lưu cấu hình
                </button>
                <button
                  type="button"
                  onClick={handleTestSync}
                  disabled={isTesting}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                  title="Gửi 1 công văn thử nghiệm để kiểm tra đồng bộ"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Gửi kiểm tra</span>
                </button>
              </div>
            </div>
            {testResult && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {testResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                <span>{testResult.text}</span>
              </div>
            )}
          </div>

          {/* Google Apps Script Code template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Mã Google Apps Script mẫu (Tự động chống trùng trên Sheet):</span>
              </label>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{isCopied ? 'Đã sao chép' : 'Sao chép mã'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Nếu bảng tính Google Sheet của bạn đang thêm trùng số công văn, bạn chỉ cần sao chép mã dưới đây dán vào menu <strong>Tiện ích mở rộng &gt; Apps Script</strong> trong Google Sheet rồi bấm <strong>Triển khai (Deploy)</strong> lại:
            </p>
            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                {GOOGLE_APPS_SCRIPT_SAMPLE}
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
            <div className="font-bold text-slate-800">Hướng dẫn nhanh 3 bước:</div>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Mở bảng tính Google Sheets &gt; Vào <strong>Tiện ích mở rộng (Extensions)</strong> &gt; Chọn <strong>Apps Script</strong>.</li>
              <li>Dán mã kịch bản ở trên vào, bấm <strong>Lưu (Ctrl+S)</strong>.</li>
              <li>Bấm <strong>Triển khai (Deploy)</strong> &gt; <strong>Triển khai mới (New deployment)</strong> &gt; Chọn <strong>Ứng dụng web (Web app)</strong> &gt; Tại mục <em>Ai có quyền truy cập (Who has access)</em> chọn <strong>Bất kỳ ai (Anyone)</strong> &gt; Bấm Triển khai và dán URL vào đây.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white rounded-xl hover:brightness-110 border shadow-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
