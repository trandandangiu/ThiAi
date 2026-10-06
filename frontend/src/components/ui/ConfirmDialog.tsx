// src/components/ui/ConfirmDialog.tsx
import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, HelpCircle } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  btnColor: string;
  borderColor: string;
}> = {
  danger: {
    icon: AlertTriangle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    btnColor: '#B71C1C',
    borderColor: 'border-rose-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    btnColor: '#D97706',
    borderColor: 'border-amber-200',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    btnColor: '#2563EB',
    borderColor: 'border-blue-200',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    btnColor: '#059669',
    borderColor: 'border-emerald-200',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-scaleIn">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center shrink-0 shadow-sm`}
          >
            <Icon className={`w-6 h-6 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-black text-slate-900 leading-tight">
              {title}
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{ backgroundColor: config.btnColor }}
            className="px-5 py-2.5 text-xs font-black text-white rounded-xl shadow-md transition cursor-pointer active:scale-95 hover:opacity-90"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;