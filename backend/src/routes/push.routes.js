// backend/src/routes/push.routes.js
import express from 'express';
import { pushService } from '../services/push.service.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

/**
 * ⭐ PUBLIC — không cần auth
 * Client lấy VAPID public key để subscribe
 */
router.get('/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });
});

/**
 * ⭐ POST /api/push/subscribe — CHO PHÉP KHÁCH
 */
router.post('/subscribe', optionalAuth, async (req, res, next) => {
  try {
    const isGuest = !req.user || !req.user.id;
    const userId = req.user?.id || null;

    const saved = await pushService.saveSubscription(
      userId,
      req.body.subscription,
      req.headers['user-agent'],
      isGuest
    );

    res.json({
      success: true,
      id: saved.id,
      isGuest,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ⭐ POST /api/push/unsubscribe — CHO PHÉP KHÁCH
 */
router.post('/unsubscribe', optionalAuth, async (req, res, next) => {
  try {
    await pushService.removeSubscription(req.body.endpoint);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * ⭐ POST /api/push/test — Test push (hỗ trợ khách)
 * Body: { endpoint?: string }
 * - Nếu có endpoint → test 1 sub cụ thể
 * - Nếu không → test tất cả sub của user (nếu login)
 */
router.post('/test', optionalAuth, async (req, res, next) => {
  try {
    const endpoint = req.body?.endpoint;
    let result;

    if (endpoint) {
      // Test 1 endpoint cụ thể
      result = await pushService.sendToEndpoint(endpoint, {
        title: '🔔 Test Web Push',
        content: 'Đây là thông báo test — hiện dù app đóng!',
        url: '/',
      });
    } else if (req.user?.id) {
      // Test tất cả sub của user
      result = await pushService.sendToUser(req.user.id, {
        title: '🔔 Test Web Push',
        content: 'Đây là thông báo test!',
        url: '/',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp endpoint hoặc đăng nhập',
      });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * ⭐ POST /api/push/broadcast-test — Test broadcast đến TẤT CẢ
 * CHỈ DÙNG KHI DEV — không nên public trong production
 */
router.post('/broadcast-test', async (req, res, next) => {
  try {
    const result = await pushService.broadcast({
      title: '📢 Broadcast Test',
      content: 'Đây là thông báo broadcast đến tất cả thiết bị đã subscribe!',
      url: '/',
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

export default router;