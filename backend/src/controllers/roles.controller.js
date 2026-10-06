// backend/src/controllers/roles.controller.js
import { rolesService } from '../services/roles.service.js';

export const rolesController = {
  async getRoles(req, res, next) {
    try {
      const result = await rolesService.getRoles(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getRoleById(req, res, next) {
    try {
      const role = await rolesService.getRoleById(req.params.id);
      res.json({ success: true, role });
    } catch (err) {
      next(err);
    }
  },

  async createRole(req, res, next) {
    try {
      const role = await rolesService.createRole(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Tạo role thành công',
        role,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req, res, next) {
    try {
      const role = await rolesService.updateRole(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        role,
      });
    } catch (err) {
      next(err);
    }
  },

  async assignPermissions(req, res, next) {
    try {
      const { permissionIds } = req.body;
      const result = await rolesService.assignPermissions(
        req.params.id,
        permissionIds,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteRole(req, res, next) {
    try {
      const result = await rolesService.deleteRole(req.params.id, req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};