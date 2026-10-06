// backend/src/controllers/users.controller.js
import { usersService } from '../services/users.service.js';

export const usersController = {
  // 1. GET /api/users
  async getUsers(req, res, next) {
    try {
      const result = await usersService.getUsers(req.user, req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // 2. GET /api/users/:id
  async getUserById(req, res, next) {
    try {
      const user = await usersService.getUserById(req.params.id, req.user);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  // 3. POST /api/users
  async createUser(req, res, next) {
    try {
      const user = await usersService.createUser(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Tạo tài khoản thành công',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  // 4. PUT /api/users/:id
  async updateUser(req, res, next) {
    try {
      const user = await usersService.updateUser(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  // 5. DELETE /api/users/:id
  async deleteUser(req, res, next) {
    try {
      const result = await usersService.deleteUser(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 6. PUT /api/users/:id/roles
  async assignRoles(req, res, next) {
    try {
      const { roleIds } = req.body;
      const result = await usersService.assignRoles(
        req.params.id,
        roleIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 7. POST /api/users/:id/reset-password
  async resetPassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      const result = await usersService.resetPassword(
        req.params.id,
        newPassword,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // 8. PATCH /api/users/:id/toggle-active
  async toggleActive(req, res, next) {
    try {
      const result = await usersService.toggleActive(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};