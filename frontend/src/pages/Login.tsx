// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';


export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('vks@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  // // ⭐ Chống autofill — đợi 1 nhịp để browser fill xong rồi clear
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setUsername('');
  //     setPassword('');
  //   }, 150);
  //   return () => clearTimeout(timer);
  // }, []);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        const currentUser = apiClient.getCurrentUser();
        const userRole = currentUser?.roles?.[0]?.code || currentUser?.role;
        redirectByRole(userRole, username);
      } else {
        setError(res.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const redirectByRole = (role?: string, fallbackUsername?: string) => {
    switch (role) {
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'VIEN_TRUONG':
        navigate('/vt');
        break;
      case 'PHO_VIEN_TRUONG':
        navigate('/home');
        break;
      case 'TRUONG_PHONG':
        navigate('/home');
        break;
      default:
        navigate('/home');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-800 selection:bg-red-600 selection:text-white">
      <main
        className="flex-1 w-full min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundColor: '#9A1010',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/45 via-black/15 to-black/35 pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-center flex flex-col items-center justify-center py-4">
            <div className="relative mb-6 group">
              <div className="absolute -inset-5 bg-amber-400/30 rounded-full blur-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
              <img
                src="/logo.svg"
                alt="Huy hiệu VKSND"
                className="relative w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] mx-auto transition-transform duration-300 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="text-xs sm:text-sm lg:text-base font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-amber-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] mb-3 leading-relaxed max-w-xl text-center">
              VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
            </h3>

            <div className="flex items-center justify-center gap-3 w-48 mb-3">
              <span className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]" />
              <span className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-200 to-amber-400 drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] leading-tight whitespace-nowrap">
              Hệ thống báo cáo công việc
            </h2>
          </div>

          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/80 overflow-hidden p-6 sm:p-8">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-50 to-white p-2 shadow-sm border border-amber-200 flex items-center justify-center ring-2 ring-red-100">
                  <img
                    src="/logo.svg"
                    alt="Logo VKS"
                    className="w-full h-full object-contain drop-shadow"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-lg font-black uppercase tracking-wider text-slate-900">
                  Đăng Nhập Hệ Thống
                </h3>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 font-medium shadow-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <form
                onSubmit={handleFormLogin}
                className="space-y-4"
                autoComplete="off"
              >
                {/* ⭐ 2 field ẩn để chống autofill */}
                <input
                  type="text"
                  name="fakeusernameremembered"
                  autoComplete="off"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />
                <input
                  type="password"
                  name="fakepasswordremembered"
                  autoComplete="off"
                  style={{ display: 'none' }}
                  tabIndex={-1}
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tên truy cập
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      name="vks_username_noautofill"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-red-600 focus:ring-2 focus:ring-red-100 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      name="vks_password_noautofill"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mật khẩu (mặc định: vks@2026)"  // ⭐ Gợi ý cho user
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-red-600 focus:ring-2 focus:ring-red-100 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-sm font-bold text-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-75 mt-3"
                  style={{ backgroundColor: '#B71C1C' }}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isLoading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;