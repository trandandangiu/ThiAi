// backend/src/routes/sse.routes.js
import express from 'express';
import { sseService } from '../services/sse.service.js';   // ← CHÚ Ý: ../services/
import { authenticate } from '../middlewares/auth.js';      // ← CHÚ Ý: ../middlewares/

const router = express.Router();

/**
 * GET /api/sse/stream — Kết nối SSE
 */
router.get('/stream', authenticate, (req, res) => {
  const userId = req.user.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write(`event: connected\n`);
  res.write(`data: ${JSON.stringify({ userId, at: new Date().toISOString() })}\n\n`);

  sseService.addClient(userId, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\n`);
      res.write(`data: ${JSON.stringify({ t: Date.now() })}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseService.removeClient(userId, res);
    res.end();
  });
});

router.get('/stats', authenticate, (req, res) => {
  res.json({
    success: true,
    onlineUsers: sseService.getOnlineUserCount(),
    totalConnections: sseService.getTotalConnections(),
  });
});

router.post('/test', authenticate, (req, res) => {
  const sent = sseService.sendToUser(req.user.id, 'notification', {
    id: 'test-' + Date.now(),
    type: 'TEST',
    title: '🔔 Test thông báo realtime',
    content: 'Nếu thấy tin này → SSE hoạt động!',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    sent,
    message: sent > 0 ? `Đã gửi đến ${sent} thiết bị` : 'Không có kết nối SSE nào',
  });
});

export default router;