// src/components/ui/PromptDialog.tsx
import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';

export interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  multiline?: boolean;
  required?: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  title,
  message,
  placeholder = 'Nhập nội dung...',
  defaultValue = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  multiline = false,
  required = false,
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !value.trim()) {
      setError('Vui lòng nhập nội dung');
      return;
    }
    onConfirm(value.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 flex items-start gap-4 border-b border-slate-100">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border-2"
            style={{
              backgroundColor: '#FEF2F2',
              borderColor: '#FECACA',
            }}
          >
            <Edit3 className="w-5 h-5" style={{ color: '#B71C1C' }} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {title}
            </h3>
            {message && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {message}
              </p>
            )}
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            {multiline ? (
              <textarea
                autoFocus
                rows={4}
                value={value}
                onChange={e => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition resize-none ${
                  error
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-red-500/20 focus:border-red-500'
                }`}
              />
            ) : (
              <input
                autoFocus
                type="text"
                value={value}
                onChange={e => {
                  setValue(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 transition ${
                  error
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-red-500/20 focus:border-red-500'
                }`}
              />
            )}

            {error && (
              <div className="mt-2 text-xs text-rose-600 font-bold">
                ⚠ {error}
              </div>
            )}

            {required && !error && (
              <div className="mt-2 text-[11px] text-slate-500">
                <span className="text-rose-500">*</span> Bắt buộc
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer active:scale-95"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#B71C1C' }}
              className="px-5 py-2.5 text-xs font-black text-white rounded-xl shadow-md transition cursor-pointer active:scale-95 hover:opacity-90"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptDialog;