import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// ══════════════════════════════════════════════
// ĐĂNG KÝ SERVICE WORKER
// Tự động check update mỗi 1 giờ
// ══════════════════════════════════════════════
const updateSW = registerSW({
  onNeedRefresh() {
    const ok = window.confirm(
      '🔔 Có bản cập nhật mới cho ứng dụng VKS-QLCV.\n\n' +
      'Cập nhật ngay bây giờ?'
    );
    if (ok) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ Ứng dụng đã sẵn sàng dùng offline');
  },
  onRegistered(registration) {
    // Tự động check update mỗi 1 giờ
    if (registration) {
      setInterval(
        () => {
          console.log('🔄 Đang kiểm tra bản cập nhật...');
          registration.update();
        },
        60 * 60 * 1000
      );
    }
  },
  onRegisterError(error) {
    console.error('❌ Lỗi đăng ký Service Worker:', error);
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);