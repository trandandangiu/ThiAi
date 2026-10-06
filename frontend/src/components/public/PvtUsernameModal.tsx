// src/components/public/PvtUsernameModal.tsx
import React, { useState, useEffect } from 'react';
import { X, KeyRound, User, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface PvtUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  pvt: {
    id: string;
    name: string;
    roomCode?: string;
  } | null;
  onVerified: (pvt: { id: string; name: string }) => void;
}

export const PvtUsernameModal: React.FC<PvtUsernameModalProps> = ({
  isOpen,
  onClose,
  pvt,
  onVerified,
}) => {
  const [username, setUsername] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, pvt?.id]);

  if (!isOpen || !pvt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.verifyPvtUsername(username.trim(), pvt.id);
      if (res.success) {
        onVerified({ id: pvt.id, name: pvt.name });
        onClose();
      } else {
        setError(res.message || 'Xác thực thất bại');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header */}
        <div
          className="px-5 py-4 text-white flex items-center justify-between"
          style={{ backgroundColor: '#B71C1C' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-sm font-bold">Xác thực lãnh đạo</div>
              <div className="text-[11px] text-red-100">
                Xem công văn của Phó Viện trưởng
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info lãnh đạo */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-sm shrink-0">
              {pvt.name
                .replace(/^Đồng chí\s+/i, '')
                .replace(/^Đ\/c\s+/i, '')
                .split(' ')
                .slice(-2)
                .map(w => w[0])
                .join('')
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Đang xem công văn của
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {pvt.name}
              </div>
              {pvt.roomCode && (
                <div className="text-[10px] text-slate-500 font-mono">
                  {pvt.roomCode}
                </div>
              )}
            </div>
          </div>

          {/* Username input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                autoFocus
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Nhập tên đăng nhập của lãnh đạo"
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 flex items-start gap-2">
            <KeyRound className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Nhập tên đăng nhập của lãnh đạo để xem công văn được giao cho họ.
              Không cần mật khẩu.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#B71C1C' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Xác nhận
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PvtUsernameModal;