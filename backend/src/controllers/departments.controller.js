// backend/src/controllers/departments.controller.js
import { departmentsService } from '../services/departments.service.js';

export const departmentsController = {
  // ============================================
  // 1. GET /api/departments
  // ============================================
  async getDepartments(req, res, next) {
    try {
      const result = await departmentsService.getDepartments(req.query);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. GET /api/departments/:id
  // ============================================
  async getDepartmentById(req, res, next) {
    try {
      const result = await departmentsService.getDepartmentById(req.params.id);
      res.json({ success: true, department: result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. POST /api/departments
  // ============================================
  async createDepartment(req, res, next) {
    try {
      const result = await departmentsService.createDepartment(
        req.body,
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'Tạo phòng ban thành công',
        department: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. PUT /api/departments/:id
  // ============================================
  async updateDepartment(req, res, next) {
    try {
      const result = await departmentsService.updateDepartment(
        req.params.id,
        req.body,
        req.user
      );
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        department: result,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 5. DELETE /api/departments/:id
  // ============================================
  async deleteDepartment(req, res, next) {
    try {
      const result = await departmentsService.deleteDepartment(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};