// backend/src/controllers/admin.controller.js
import { adminService } from '../services/admin.service.js';

export const adminController = {
  async getTables(req, res, next) {
    try {
      const result = await adminService.getTables();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getTableData(req, res, next) {
    try {
      const result = await adminService.getTableData(
        req.params.table,
        req.query
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const result = await adminService.getStats();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const result = await adminService.getAuditLogs(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getSessions(req, res, next) {
    try {
      const result = await adminService.getSessions(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};