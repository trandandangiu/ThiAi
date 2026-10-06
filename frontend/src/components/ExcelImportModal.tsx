import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  FileCheck2, 
  Check
} from 'lucide-react';
import { 
  ColumnDefinition, 
  Dispatch, 
  ExcelImportAnalysis, 
  ReconciliationStrategy 
} from '../types/dispatch';
import { 
  parseExcelAndReconcile
} from '../services/excelService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDispatches: Dispatch[];
  columns: ColumnDefinition[];
  onCommitImport: (
    analysis: ExcelImportAnalysis,
    strategy: ReconciliationStrategy,
    itemActions?: Record<string, 'UPDATE' | 'SKIP' | 'APPEND'>
  ) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingDispatches,
  columns,
  onCommitImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ExcelImportAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'EXISTING'>('NEW');
  const [strategy, setStrategy] = useState<ReconciliationStrategy>('UPDATE_EXISTING');
  const [itemActions, setItemActions] = useState<Record<string, 'UPDATE' | 'SKIP' | 'APPEND'>>({});

  if (!isOpen) return null;

  const handleProcessAnalysisResult = (result: ExcelImportAnalysis) => {
    setAnalysis(result);

    const initialActions: Record<string, 'UPDATE' | 'SKIP' | 'APPEND'> = {};
    result.existingMatches.forEach(match => {
      initialActions[match.existing.id] = 'UPDATE';
    });
    setItemActions(initialActions);

    if (result.existingMatches.length > 0) {
      setActiveTab('EXISTING');
    } else {
      setActiveTab('NEW');
    }
  };

  const handleFileChange = async (selectedFile: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    setFile(selectedFile);

    try {
      const result = await parseExcelAndReconcile(selectedFile, existingDispatches, columns);
      handleProcessAnalysisResult(result);
    } catch (err: any) {
      console.error('Lỗi phân tích file Excel:', err);
      setErrorMsg(err.message || 'Không thể đọc tệp Excel. Vui lòng kiểm tra lại định dạng.');
      setAnalysis(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith('.xlsx') ||
        droppedFile.name.endsWith('.xls') ||
        droppedFile.name.endsWith('.csv')
      ) {
        handleFileChange(droppedFile);
      } else {
        setErrorMsg('Vui lòng chọn định dạng tệp Excel (.xlsx, .xls) hoặc .csv');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleStrategyChange = (newStrategy: ReconciliationStrategy) => {
    setStrategy(newStrategy);
    if (!analysis) return;

    const actionMap: Record<string, 'UPDATE' | 'SKIP' | 'APPEND'> = {};
    const defaultAction =
      newStrategy === 'UPDATE_EXISTING'
        ? 'UPDATE'
        : newStrategy === 'APPEND_AS_NEW'
        ? 'APPEND'
        : 'SKIP';
    analysis.existingMatches.forEach(match => {
      actionMap[match.existing.id] = defaultAction;
    });
    setItemActions(actionMap);
  };

  const handleItemActionChange = (id: string, action: 'UPDATE' | 'SKIP' | 'APPEND') => {
    setItemActions(prev => ({ ...prev, [id]: action }));
  };

  const handleConfirm = () => {
    if (!analysis) return;
    onCommitImport(analysis, strategy, itemActions);
    onClose();
  };

  const resetModal = () => {
    setFile(null);
    setAnalysis(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Modal Header */}
        <div 
          className="px-6 py-4 flex items-center justify-between text-white border-b shadow-xs"
          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div 
                className="text-[11px] font-bold tracking-wider uppercase text-amber-300 leading-tight"
              >
                VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase text-white mt-0.5">
                Nhập dữ liệu Công văn từ Excel
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/15 p-1.5 rounded-lg transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Input Source Selection (When no analysis is performed yet) */}
          {!analysis && (
            <div className="space-y-4">
              {/* Upload File */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl p-10 text-center cursor-pointer bg-slate-50/60 hover:bg-red-50/20 transition flex flex-col items-center justify-center"
                title="Bấm để chọn tệp Excel hoặc kéo thả file vào đây"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 text-[#B71C1C] flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">
                  Nhấp để tải lên tệp Excel (.xlsx, .xls, .csv)
                </div>
                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                  Kéo thả file trực tiếp vào vùng này. Hệ thống sẽ tự động quét, khớp các cột và đối chiếu công văn sẵn có.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Processing spinner */}
          {isProcessing && (
            <div className="py-12 text-center text-slate-600 space-y-3">
              <div 
                className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto" 
                style={{ borderColor: '#B71C1C', borderTopColor: 'transparent' }}
              />
              <p className="text-sm font-medium">Đang đối chiếu dữ liệu với bảng công văn trên màn hình...</p>
            </div>
          )}

          {/* STEP 2: Analysis & Reconciliation Results */}
          {analysis && !isProcessing && (
            <div className="space-y-5">
              {/* Summary Banner */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900">{analysis.fileName}</span>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                      {analysis.totalRowsParsed} dòng dữ liệu hợp lệ
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-1.5">
                    <span>Đã nhận diện các cột:</span>
                    {analysis.detectedColumns.map((col, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-[11px]"
                      >
                        {col.excelHeader}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                  >
                    Chọn tệp khác
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 rounded-lg shadow-xs transition cursor-pointer border"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Xác nhận nhập dữ liệu</span>
                  </button>
                </div>
              </div>

              {/* Status Notice */}
              {analysis.existingMatches.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Phát hiện {analysis.existingMatches.length} công văn trùng khớp với dữ liệu trên màn hình
                    </span>
                    <span className="text-xs bg-amber-200/80 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                      Cần đối chiếu
                    </span>
                  </div>
                  <p className="text-xs text-amber-800">
                    Hệ thống tìm thấy số hiệu công văn đã có sẵn trên trang chính. Chọn cách xử lý đối chiếu:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <label
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        strategy === 'UPDATE_EXISTING'
                          ? 'bg-white border-[#B71C1C] ring-2 ring-[#B71C1C]/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reconcileStrategy"
                        className="hidden"
                        checked={strategy === 'UPDATE_EXISTING'}
                        onChange={() => handleStrategyChange('UPDATE_EXISTING')}
                      />
                      <div className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-[#B71C1C]" />
                        1. Cập nhật dữ liệu mới
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Cập nhật ngày gửi, trích yếu, người thực hiện và ghi chú mới vào bản ghi hiện có
                      </p>
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        strategy === 'APPEND_AS_NEW'
                          ? 'bg-white border-[#B71C1C] ring-2 ring-[#B71C1C]/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reconcileStrategy"
                        className="hidden"
                        checked={strategy === 'APPEND_AS_NEW'}
                        onChange={() => handleStrategyChange('APPEND_AS_NEW')}
                      />
                      <div className="font-bold text-slate-900 mb-0.5">2. Thêm dòng mới riêng biệt</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Giữ nguyên bản ghi cũ, tạo thêm bản ghi mới riêng biệt có ghi chú (Bổ sung)
                      </p>
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                        strategy === 'SKIP_EXISTING'
                          ? 'bg-white border-[#B71C1C] ring-2 ring-[#B71C1C]/20 shadow-xs'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reconcileStrategy"
                        className="hidden"
                        checked={strategy === 'SKIP_EXISTING'}
                        onChange={() => handleStrategyChange('SKIP_EXISTING')}
                      />
                      <div className="font-bold text-slate-900 mb-0.5">3. Bỏ qua (Không thay đổi)</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Giữ nguyên dữ liệu cũ, chỉ thêm những công văn mới hoàn toàn
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Tabs: Đã có vs Mới */}
              <div className="flex border-b border-slate-200">
                {analysis.existingMatches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('EXISTING')}
                    className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                      activeTab === 'EXISTING'
                        ? 'border-amber-600 text-amber-700'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span>Công văn đã có trên giao diện (Cần đối chiếu)</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      {analysis.existingMatches.length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('NEW')}
                  className={`pb-2.5 px-4 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'NEW'
                      ? 'border-[#B71C1C] text-[#B71C1C]'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>Công văn mới chưa có trên giao diện</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-[#B71C1C]">
                    {analysis.newItems.length}
                  </span>
                </button>
              </div>

              {/* TAB 1: Existing Matches Diff View */}
              {activeTab === 'EXISTING' && (
                <div className="space-y-3">
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                    {analysis.existingMatches.map((match, idx) => {
                      const currentAction = itemActions[match.existing.id] || 'UPDATE';
                      return (
                        <div
                          key={idx}
                          className="bg-white border-2 border-amber-200 rounded-xl p-4 space-y-3 shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-bold text-xs text-white px-2.5 py-0.5 rounded shadow-2xs"
                                  style={{ backgroundColor: '#B71C1C' }}
                                >
                                  {match.existing.soCongVan}
                                </span>
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Khớp số công văn
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-800 mt-1 line-clamp-1">
                                {match.incoming.tenCongVan || match.existing.tenCongVan}
                              </h4>
                            </div>

                            {/* Per-item action selector */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[11px] text-slate-500 font-medium">Hành động:</span>
                              <select
                                value={currentAction}
                                onChange={e =>
                                  handleItemActionChange(match.existing.id, e.target.value as any)
                                }
                                className="text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none"
                              >
                                <option value="UPDATE">Cập nhật (Update)</option>
                                <option value="APPEND">Thêm dòng mới (Append)</option>
                                <option value="SKIP">Bỏ qua (Skip)</option>
                              </select>
                            </div>
                          </div>

                          {/* Side-by-Side Diff Table */}
                          {match.differences.length > 0 ? (
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                Chi tiết các trường thay đổi so với trang giao diện:
                              </span>
                              <div className="grid grid-cols-1 gap-2">
                                {match.differences.map((diff, dIdx) => (
                                  <div
                                    key={dIdx}
                                    className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-xs"
                                  >
                                    <div className="font-semibold text-slate-700">
                                      {diff.fieldLabel}:
                                    </div>
                                    <div className="text-rose-700 bg-rose-50/60 p-1.5 rounded border border-rose-100 font-medium truncate">
                                      <span className="text-[10px] text-rose-500 uppercase block font-bold">Hiện có trên trang:</span>
                                      {diff.oldValue || '(Trống)'}
                                    </div>
                                    <div className="text-emerald-800 bg-emerald-50/80 p-1.5 rounded border border-emerald-200 font-bold truncate flex items-center gap-1">
                                      <div>
                                        <span className="text-[10px] text-emerald-600 uppercase block font-bold">Mới trong tệp Excel:</span>
                                        {diff.newValue || '(Trống)'}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg">
                              Nội dung tệp Excel hoàn toàn trùng khớp với trang giao diện, không có trường nào thay đổi.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: New Items View */}
              {activeTab === 'NEW' && (
                <div className="space-y-3">
                  {analysis.newItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl">
                      Không có công văn mới nào (tất cả các dòng đều đã có trên trang giao diện).
                    </div>
                  ) : (
                    <div className="border border-slate-300 rounded-xl overflow-x-auto overflow-y-auto max-h-[340px] shadow-xs">
                      <table className="w-full text-left text-xs min-w-[980px] border-collapse">
                        <thead 
                          className="text-white sticky top-0 font-bold z-10 shadow-xs border-b"
                          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
                        >
                          <tr>
                            <th className="px-3.5 py-2.5 font-bold text-xs uppercase tracking-wider border-r border-red-800/60 whitespace-nowrap text-center w-36">
                              SỐ CÔNG VĂN
                            </th>
                            <th className="px-3.5 py-2.5 font-bold text-xs uppercase tracking-wider border-r border-red-800/60 whitespace-nowrap text-center w-28">
                              NGÀY GỬI
                            </th>
                            <th className="px-3.5 py-2.5 font-bold text-xs uppercase tracking-wider border-r border-red-800/60 min-w-[320px]">
                              TÊN CÔNG VĂN
                            </th>
                            <th className="px-3.5 py-2.5 font-bold text-xs uppercase tracking-wider border-r border-red-800/60 whitespace-nowrap text-center">
                              ĐƠN VỊ BAN HÀNH
                            </th>
                            <th className="px-3.5 py-2.5 font-bold text-xs uppercase tracking-wider border-r border-red-800/60 whitespace-nowrap text-center">
                              NGƯỜI THỰC HIỆN
                            </th>
                            <th className="px-3.5 py-2.5 font-bold text-xs uppercase tracking-wider min-w-[200px]">
                              GHI CHÚ
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {analysis.newItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-red-50/20 transition">
                              <td className="px-3.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap border-r border-slate-100 text-center">
                                {item.soCongVan}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap border-r border-slate-100 text-center">
                                {item.ngayGui}
                              </td>
                              <td className="px-3.5 py-2.5 font-medium text-slate-900 border-r border-slate-100 leading-relaxed" title={item.tenCongVan}>
                                {item.tenCongVan}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-700 whitespace-nowrap border-r border-slate-100 text-center">
                                {item.donViBanHanh}
                              </td>
                              <td className="px-3.5 py-2.5 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-100 text-center">
                                {item.nguoiThucHien}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600 leading-relaxed" title={item.ghiChu}>
                                {item.ghiChu || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="pt-3 pb-1 flex justify-end border-t border-slate-200 mt-2">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 rounded-xl shadow-xs transition cursor-pointer border whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4 text-amber-300" />
                      <span>
                        Xác nhận đưa vào hệ thống & Google Sheets (
                        {analysis.newItems.length > 0 ? `Thêm ${analysis.newItems.length} mới` : ''}
                        {analysis.newItems.length > 0 && analysis.existingMatches.length > 0 ? ', ' : ''}
                        {analysis.existingMatches.length > 0 ? `Cập nhật ${analysis.existingMatches.length} công văn` : ''}
                        )
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
