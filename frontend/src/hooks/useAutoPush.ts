// src/hooks/useAutoPush.ts
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { pushService } from '../services/pushService';

export function useAutoPush() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    if (!pushService.isSupported()) return;

    const init = async () => {
      try {
        const perm = pushService.getPermission();
        if (perm === 'denied') return;

        if (perm === 'default') {
          const newPerm = await pushService.askPermission();
          if (newPerm !== 'granted') return;
        }

        if (pushService.getPermission() === 'granted') {
          const already = await pushService.isSubscribed();
          if (already) return;

          await pushService.subscribe();
        }
      } catch (err) {
        console.error('[AUTO-PUSH] Lỗi:', err);
      }
    };

    const timer = setTimeout(init, 2000);
    return () => clearTimeout(timer);
  }, [currentUser?.id]);
}