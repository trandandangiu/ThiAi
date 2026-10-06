import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  RotateCcw, 
  Check, 
  SlidersHorizontal,
  Info,
  Paperclip
} from 'lucide-react';
import { ColumnDataType, ColumnDefinition } from '../types/dispatch';

interface ColumnManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  onAddCustomColumn: (newCol: { label: string; type: ColumnDataType; description?: string }) => void;
  onToggleVisibility: (colId: string) => void;
  onRemoveColumn: (colId: string) => void;
  onResetDefault: () => void;
}

export const ColumnManagerModal: React.FC<ColumnManagerModalProps> = ({
  isOpen,
  onClose,
  columns,
  onAddCustomColumn,
  onToggleVisibility,
  onRemoveColumn,
  onResetDefault
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<ColumnDataType>('text');
  const [newDescription, setNewDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    onAddCustomColumn({
      label: newLabel.trim(),
      type: newType,
      description: newDescription.trim() || undefined
    });

    setNewLabel('');
    setNewDescription('');
    setNewType('text');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div 
          className="px-6 py-3.5 flex items-center justify-between text-white border-b"
          style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
        >
          <h2 className="text-base font-bold">Cột dữ liệu</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Add New Column Form */}
          {isAdding ? (
            <form onSubmit={handleAddSubmit} className="bg-purple-50/60 border border-purple-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Thêm cột dữ liệu mới
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Hủy
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tên cột hiển thị *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewLabel('Đính kèm file');
                        setNewType('file');
                        setNewDescription('Tệp tin, tài liệu công văn đính kèm');
                      }}
                      className="inline-flex items-center text-[11px] font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      <span>+ Đính kèm file</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewLabel('Văn bản ngắn');
                        setNewType('text');
                        setNewDescription('Ghi chú hoặc thông tin dạng văn bản');
                      }}
                      className="inline-flex items-center text-[11px] font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      <span>+ Văn bản ngắn</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kiểu dữ liệu
                  </label>
                  <select
                    value={newType}
                    onChange={e => {
                      const selectedType = e.target.value as ColumnDataType;
                      setNewType(selectedType);
                      if (selectedType === 'file' && !newLabel) {
                        setNewLabel('Đính kèm file');
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                  >
                    <option value="text">Văn bản ngắn</option>
                    <option value="date">Ngày tháng</option>
                    <option value="number">Số lượng / Tỷ lệ</option>
                    <option value="select">Danh mục chọn</option>
                    <option value="file">Đính kèm file</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mô tả mục đích sử dụng (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú thêm về mục đích của cột này..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-purple-600 hover:bg-purple-700 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu cột mới</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm cột dữ liệu mới</span>
            </button>
          )}

          {/* List of current columns */}
          <div className="space-y-2">
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-[350px] overflow-y-auto">
              {columns.map(col => (
                <div
                  key={col.id}
                  className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleVisibility(col.id)}
                      className={`p-1.5 rounded-md transition cursor-pointer ${
                        col.visible
                          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                          : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                      }`}
                      title={col.visible ? 'Bấm để ẩn cột' : 'Bấm để hiện cột'}
                    >
                      {col.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${col.visible ? 'text-slate-900' : 'text-slate-400'}`}>
                          {col.label}
                        </span>
                        {col.type === 'file' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded">
                            <Paperclip className="w-2.5 h-2.5" /> Tệp đính kèm
                          </span>
                        )}
                      </div>
                      {col.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{col.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {col.isCustom && (
                      <button
                        type="button"
                        onClick={() => onRemoveColumn(col.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Xóa cột tự tạo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              Khôi phục về biểu mẫu mặc định ban đầu:
            </span>
            <button
              type="button"
              onClick={onResetDefault}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại mặc định</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
