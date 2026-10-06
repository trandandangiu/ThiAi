// src/components/Header.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserMenuDropdown } from './header/UserMenuDropdown';
import { NotificationBell } from './header/NotificationBell';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className="text-white sticky top-0 z-40 shadow-md border-b-2"
      style={{ backgroundColor: '#B71C1C', borderColor: '#7F0E0E' }}
    >
      {/* Padding: nhỏ trên mobile, lớn trên desktop */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between py-2 sm:py-3 gap-2 sm:gap-3">
          {/* Logo + Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group min-w-0">
            <img
              src="/logo.svg"
              alt="Logo VKSND"
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain shrink-0 drop-shadow-sm group-hover:scale-105 transition"
              referrerPolicy="no-referrer"
            />

            <div className="min-w-0 space-y-0.5">
              {/* Tên cơ quan — ẩn/ngắn trên mobile */}
              <div
                className="text-[8px] sm:text-[11px] font-bold tracking-wider uppercase truncate"
                style={{ color: '#FFD700' }}
              >
                <span className="hidden sm:inline">
                  VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
                </span>
                <span className="sm:hidden">
                  VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH
                </span>
              </div>

              {/* Tiêu đề — ngắn trên mobile */}
              <h1 className="text-xs sm:text-base lg:text-xl font-black tracking-wide uppercase text-white leading-tight">
                <span className="hidden sm:inline">Theo dõi tiến độ xử lý công văn</span>
                <span className="sm:hidden">Theo dõi tiến độ xử lý công văn</span>
              </h1>
            </div>
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <NotificationBell />
            <UserMenuDropdown
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;