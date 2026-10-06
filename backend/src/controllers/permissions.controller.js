// backend/src/controllers/permissions.controller.js
import { permissionsService } from '../services/permissions.service.js';

export const permissionsController = {
  async getPermissions(req, res, next) {
    try {
      const result = await permissionsService.getPermissions(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getPermissionById(req, res, next) {
    try {
      const permission = await permissionsService.getPermissionById(req.params.id);
      res.json({ success: true, permission });
    } catch (err) {
      next(err);
    }
  },

  async getModules(req, res, next) {
    try {
      const result = await permissionsService.getModules();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};