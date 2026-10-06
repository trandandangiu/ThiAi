// frontend/src/hooks/useSSE.ts
import { useEffect, useRef, useState, useCallback } from 'react';

type SSEHandler = (data: any) => void;

interface UseSSEOptions {
  enabled?: boolean;
  onNotification?: SSEHandler;
  onConnected?: () => void;
  onError?: (err: Event) => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const { enabled = true, onNotification, onConnected, onError } = options;

  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  // Dùng ref cho callbacks để tránh re-connect khi callback thay đổi
  const onNotificationRef = useRef(onNotification);
  const onConnectedRef = useRef(onConnected);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onNotificationRef.current = onNotification;
    onConnectedRef.current = onConnected;
    onErrorRef.current = onError;
  }, [onNotification, onConnected, onError]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️  [SSE] Không có token — bỏ qua kết nối');
      return;
    }

    // EventSource không set được header → dùng query param
    const url = `/api/sse/stream?token=${encodeURIComponent(token)}`;

    console.log('🔌 [SSE] Đang kết nối...');
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('connected', (e: any) => {
      console.log('✅ [SSE] Đã kết nối:', e.data);
      setIsConnected(true);
      retryCountRef.current = 0;
      onConnectedRef.current?.();
    });

    es.addEventListener('notification', (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        console.log('🔔 [SSE] Nhận thông báo:', payload);
        onNotificationRef.current?.(payload.data);
      } catch (err) {
        console.error('❌ Lỗi parse notification:', err);
      }
    });

    es.addEventListener('ping', () => {
      // Heartbeat — bỏ qua
    });

    es.onerror = (err) => {
      console.warn('⚠️  [SSE] Lỗi kết nối, thử lại sau...');
      setIsConnected(false);
      es.close();
      onErrorRef.current?.(err);

      // Exponential backoff: 3s, 6s, 12s... max 30s
      const delay = Math.min(3000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current += 1;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      console.log('🔌 [SSE] Đóng kết nối');
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [enabled, connect]);

  return { isConnected };
}