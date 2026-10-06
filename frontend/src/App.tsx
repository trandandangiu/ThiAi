// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DialogProvider } from './hooks/useDialog';
import { ProtectedRoute } from './components/ProtectedRoute';

import { PublicHome } from './pages/PublicHome';
import { Login } from './pages/Login';
import { DispatchDeepLink } from './pages/DispatchDeepLink';
import { AdminDashboard } from './pages/AdminDashboard';
import { VienTruongDashboard } from './pages/VienTruongDashboard';
import { PhoVienTruongDashboard } from './pages/PhoVienTruongDashboard';
import { TruongPhongDashboard } from './pages/TruongPhongDashboard';
import { useAutoPush } from './hooks/useAutoPush';
import { ChuyenDeDetailPage } from './pages/ChuyenDeDetailPage';

const AppContent: React.FC = () => {
  useAutoPush();

  return (
    <Routes>
      {/* ── CHUYỂN HƯỚNG MẶC ĐỊNH ── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ── TRANG ĐĂNG NHẬP ── */}
      <Route path="/login" element={<Login />} />

      {/* ── PUBLIC HOME (YÊU CẦU ĐĂNG NHẬP - MỌI ROLE ĐỀU VÀO ĐƯỢC) ── */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <PublicHome />
          </ProtectedRoute>
        }
      />

      {/* ── DEEP LINK (YÊU CẦU ĐĂNG NHẬP) ── */}
      <Route
        path="/dispatches/:id"
        element={
          <ProtectedRoute>
            <DispatchDeepLink />
          </ProtectedRoute>
        }
      />

      {/* ── ADMIN ── */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── VIỆN TRƯỞNG ── */}
      <Route
        path="/vt/*"
        element={
          <ProtectedRoute allowedRoles={['VIEN_TRUONG', 'ADMIN']}>
            <VienTruongDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── PHÓ VIỆN TRƯỞNG ── */}
      <Route
        path="/pvt/*"
        element={
          <ProtectedRoute allowedRoles={['PHO_VIEN_TRUONG', 'ADMIN']}>
            <PhoVienTruongDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── TRƯỞNG PHÒNG ── */}
      <Route
        path="/tp/*"
        element={
          <ProtectedRoute allowedRoles={['TRUONG_PHONG', 'ADMIN']}>
            <TruongPhongDashboard />
          </ProtectedRoute>
        }
      />

      {/* ── CHUYÊN ĐỀ CHI TIẾT ── */}
      <Route
        path="/chuyende/:id"
        element={
          <ProtectedRoute>
            <ChuyenDeDetailPage />
          </ProtectedRoute>
        }
      />

      {/* ── FALLBACK ── */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DialogProvider>
        <AppContent />
      </DialogProvider>
    </AuthProvider>
  );
};

export default App;