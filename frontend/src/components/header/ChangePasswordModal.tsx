// src/components/header/ChangePasswordModal.tsx
import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  onSuccess,
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!/[A-Z]/.test(pwd)) return 'Mật khẩu phải có ít nhất 1 chữ in hoa';
    if (!/[a-z]/.test(pwd)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (!/[0-9]/.test(pwd)) return 'Mật khẩu phải có ít nhất 1 chữ số';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oldPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword === oldPassword) {
      setError('Mật khẩu mới phải khác mật khẩu cũ');
      return;
    }

    const strength = validatePassword(newPassword);
    if (strength) {
      setError(strength);
      return;
    }

    setIsLoading(true);
    try {
      // Backend dùng endpoint /users/:id/reset-password (cần cập nhật để nhận oldPassword)
      const res = await apiClient.changePassword(oldPassword, newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          resetForm();
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(res.message || 'Không thể đổi mật khẩu');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { level: 1, label: 'Yếu', color: 'bg-rose-500' };
    if (score === 3) return { level: 2, label: 'Trung bình', color: 'bg-amber-500' };
    if (score === 4) return { level: 3, label: 'Mạnh', color: 'bg-emerald-500' };
    return { level: 4, label: 'Rất mạnh', color: 'bg-emerald-600' };
  };

  const strength = getStrength(newPassword);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Đổi mật khẩu</h2>
              <p className="text-xs text-red-100">{userName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Đổi mật khẩu thành công!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đang tự động đóng cửa sổ...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Old password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự, có chữ + số"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            level <= strength.level ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      Độ mạnh:{' '}
                      <span
                        className={
                          strength.level <= 2
                            ? 'text-rose-600'
                            : strength.level === 3
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }
                      >
                        {strength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={`w-full px-3.5 py-2.5 pr-10 text-xs border rounded-xl focus:outline-none focus:ring-2 transition ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                        : 'border-slate-300 focus:ring-red-500/20 focus:border-red-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <div className="mt-1 text-[10px] font-bold text-rose-600">
                    Mật khẩu xác nhận không khớp
                  </div>
                )}
                {confirmPassword && confirmPassword === newPassword && newPassword && (
                  <div className="mt-1 text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Mật khẩu khớp
                  </div>
                )}
              </div>

              {/* Requirements note */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <strong>Yêu cầu bảo mật:</strong> Ít nhất 6 ký tự, có chữ hoa, chữ thường và chữ số.
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          {!success && (
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;