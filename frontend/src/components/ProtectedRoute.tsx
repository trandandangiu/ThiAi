// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  // Đang load → hiện spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Chưa đăng nhập → về login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser.roles?.[0]?.code || currentUser.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
            <h1 className="text-2xl font-bold text-rose-700 mb-2">
              Không có quyền truy cập
            </h1>
            <p className="text-sm text-slate-600">
              Tài khoản của bạn không được phép truy cập trang này.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};