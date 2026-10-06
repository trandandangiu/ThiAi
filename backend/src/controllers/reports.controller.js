// backend/src/controllers/reports.controller.js
import { reportsService } from '../services/reports.service.js';

export const reportsController = {
  async createReport(req, res, next) {
    try {
      const report = await reportsService.createReport(
        req.params.id,
        req.body,
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'Tạo báo cáo thành công',
        report,
      });
    } catch (err) {
      next(err);
    }
  },

  async getReportsByDispatch(req, res, next) {
    try {
      const result = await reportsService.getReportsByDispatch(
        req.params.id,
        req.user
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getAllReports(req, res, next) {
    try {
      const result = await reportsService.getAllReports(req.user, req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async deleteReport(req, res, next) {
    try {
      const result = await reportsService.deleteReport(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};