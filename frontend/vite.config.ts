import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // ══════════════════════════════════════════════
    // PWA — Cho phép cài app lên điện thoại
    // ══════════════════════════════════════════════
    VitePWA({
      registerType: 'autoUpdate',

      // Assets cần có sẵn trong bản build
      includeAssets: ['logo.svg', 'background.jpg', 'icons/*.png'],

      // ═══ MANIFEST — Thông tin app khi cài lên máy ═══
      manifest: {
        name: 'VKS-QLCV — Quản lý công văn',
        short_name: 'VKS-QLCV',
        description: 'Hệ thống quản lý công văn VKSND TP.HCM',
        theme_color: '#B71C1C',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'vi',
        categories: ['productivity', 'government', 'business'],

        icons: [
          {
            src: '/icons/192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/512.png',
            sizes: 'any',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],

        shortcuts: [
          {
            name: 'Xem công văn',
            short_name: 'Công văn',
            description: 'Mở danh sách công văn',
            url: '/?view=dispatches',
            icons: [{ src: '/icons/192.png', sizes: '192x192' }],
          },
          {
            name: 'Đăng nhập',
            short_name: 'Đăng nhập',
            url: '/login',
            icons: [{ src: '/icons/192.png', sizes: '192x192' }],
          },
        ],
      },

      // ═══ WORKBOX — Service Worker cache ═══
      // ═══ DÙNG CUSTOM SERVICE WORKER ═══
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,jpg,jpeg}'],
      },

      // Tắt PWA trong dev (tránh cache lỗi khi code)
      devOptions: {
        enabled: false,
      },
    }),
  ],

  // ═══ GIỮ NGUYÊN cấu hình cũ ═══
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  server: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});