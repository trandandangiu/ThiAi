// backend/src/controllers/auth.controller.js
import { authService } from '../services/auth.service.js';

export const authController = {
  async login(req, res, next) {
    try {
      if (!req.body) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu dữ liệu',
        });
      }

      const { username, password } = req.body || {};

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập tên đăng nhập và mật khẩu',
        });
      }

      const result = await authService.login({ username, password });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res) {
    res.json({ success: true, message: 'Đã đăng xuất' });
  },
    async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};