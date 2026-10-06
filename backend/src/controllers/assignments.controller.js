// backend/src/controllers/assignments.controller.js
import { assignmentsService } from '../services/assignments.service.js';

export const assignmentsController = {
  // ============================================
  // 1. VT GIAO CHO 1-N PVT
  // POST /api/dispatches/:id/assign-pvts
  // ============================================
  async assignPvts(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.assignPvts(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã giao công văn cho PVT',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. PVT GIAO CHO 1-N TP
  // POST /api/dispatches/:id/assign-tps
  // ============================================
  async assignTps(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.assignTps(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã giao công văn cho TP',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. TP ĐÁNH SỐ CÔNG VĂN
  // POST /api/dispatches/:id/tp-number
  // ============================================
  async tpNumber(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.tpNumber(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã đánh số công văn',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. TP GỬI LÊN PVT
  // POST /api/dispatches/:id/tp-submit
  // ============================================
  async tpSubmit(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.tpSubmit(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã gửi báo cáo lên PVT',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 5. PVT TRÌNH LÊN VT
  // POST /api/dispatches/:id/pvt-submit
  // ============================================
  async pvtSubmit(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.pvtSubmit(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã trình công văn lên Viện trưởng',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 6. VT ĐỒNG Ý
  // POST /api/dispatches/:id/vt-agree
  // ============================================
  async vtAgree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.vtAgree(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Viện trưởng đã đồng ý',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 7. VT KHÔNG ĐỒNG Ý (TRẢ LẠI PVT)
  // POST /api/dispatches/:id/vt-disagree
  // ============================================
  async vtDisagree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.vtDisagree(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã trả lại công văn cho PVT',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 8. PVT ĐỒNG Ý
  // POST /api/dispatches/:id/pvt-agree
  // ============================================
  async pvtAgree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.pvtAgree(
        dispatchId,
        req.body,
        req.user
      );

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 9. PVT KHÔNG ĐỒNG Ý (TRẢ LẠI TP)
  // POST /api/dispatches/:id/pvt-disagree
  // ============================================
  async pvtDisagree(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const result = await assignmentsService.pvtDisagree(
        dispatchId,
        req.body,
        req.user
      );

      res.json({
        success: true,
        message: 'Đã trả lại công văn cho TP',
        dispatch: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 10. LỊCH SỬ LUÂN CHUYỂN
  // GET /api/dispatches/:id/history
  // ============================================
  async getHistory(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const history = await assignmentsService.getHistory(dispatchId);

      res.json({
        success: true,
        history,
      });
    } catch (err) {
      next(err);
    }
  },
};