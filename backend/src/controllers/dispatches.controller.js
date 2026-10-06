// backend/src/controllers/dispatches.controller.js
import { dispatchesService } from '../services/dispatches.service.js';

export const dispatchesController = {
  // ============================================
  // 1. GET /api/dispatches
  // ============================================
  async getDispatches(req, res, next) {
    try {
      const result = await dispatchesService.getDispatches(
        req.user,
        req.query
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. GET /api/dispatches/:id
  // ============================================
  async getDispatchById(req, res, next) {
    try {
      const dispatch = await dispatchesService.getDispatchById(
        req.params.id,
        req.user
      );
      res.json({ success: true, dispatch });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. POST /api/dispatches
  // ============================================
  async createDispatch(req, res, next) {
    try {
      const dispatch = await dispatchesService.createDispatch(
        req.body,
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'Tạo công văn thành công',
        dispatch,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. PUT /api/dispatches/:id
  // ============================================
  async updateDispatch(req, res, next) {
    try {
      const dispatch = await dispatchesService.updateDispatch(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        dispatch,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 5. DELETE /api/dispatches/:id
  // ============================================
  async deleteDispatch(req, res, next) {
    try {
      const result = await dispatchesService.deleteDispatch(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 6. GET /api/dispatches/stats
  // ============================================
  async getStats(req, res, next) {
    try {
      const stats = await dispatchesService.getStats(req.user);
      res.json({ success: true, stats });
    } catch (err) {
      next(err);
    }
  },
  async markComplete(req, res, next) {
    try {
      const result = await dispatchesService.markComplete(
        req.params.id,
        req.user,
        req.body?.note
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
  async reopenDispatch(req, res, next) {
    try {
      const result = await dispatchesService.reopenDispatch(
        req.params.id,
        req.user,
        req.body?.note
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};