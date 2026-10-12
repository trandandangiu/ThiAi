import express from 'express';
import { optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/chat', optionalAuth, async (req, res, next) => {
  try {
    const { messages } = req.body;
    const key = process.env.DEEPSEEK_API_KEY;

    if (!key) {
      return res.status(500).json({
        success: false,
        message: 'Chưa cấu hình DEEPSEEK_API_KEY trên server',
      });
    }

    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages,
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    next(err);
  }
});

export default router;