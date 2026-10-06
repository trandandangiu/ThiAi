// backend/src/controllers/stats.controller.js
import { statsService } from '../services/stats.service.js';

export const statsController = {
  async getVTOverview(req, res, next) {
    try {
      const result = await statsService.getVTOverview(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getChartData(req, res, next) {
    try {
      const result = await statsService.getChartData(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getPvtDashboard(req, res, next) {
    try {
      const result = await statsService.getPvtDashboard(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getTpDashboard(req, res, next) {
    try {
      const result = await statsService.getTpDashboard(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};