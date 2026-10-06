// backend/src/routes/attachments.routes.js
import express from 'express';
import { attachmentsController } from '../controllers/attachments.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// ============================================
// ⭐ LIST — GET /api/dispatches/:id/attachments — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/dispatches/:id/attachments',
  optionalAuth,
  attachmentsController.getAttachments
);

// ============================================
// ⭐ UPLOAD — POST /api/dispatches/:id/attachments — CẦN LOGIN
// ============================================
router.post(
  '/dispatches/:id/attachments',
  authenticate,
  upload.single('file'),
  attachmentsController.uploadAttachment
);

// ============================================
// ⭐ DOWNLOAD — GET /api/attachments/:id/download — CHO PHÉP KHÁCH
// ============================================
router.get(
  '/attachments/:id/download',
  optionalAuth,
  attachmentsController.downloadAttachment
);

// ============================================
// DELETE — DELETE /api/attachments/:id — CẦN LOGIN
// ============================================
router.delete(
  '/attachments/:id',
  authenticate,
  attachmentsController.deleteAttachment
);

export default router;