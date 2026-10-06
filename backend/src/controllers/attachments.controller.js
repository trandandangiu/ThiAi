// backend/src/controllers/attachments.controller.js
import { attachmentsService } from '../services/attachments.service.js';
import fs from 'fs';
import path from 'path';

export const attachmentsController = {
  // ============================================
  // 1. POST /api/dispatches/:id/attachments
  // ============================================
  async uploadAttachment(req, res, next) {
    try {
      const dispatchId = req.params.id;
      const attachment = await attachmentsService.uploadAttachment(
        dispatchId,
        req.file,
        req.body,
        req.user
      );

      res.status(201).json({
        success: true,
        message: 'Upload file thành công',
        attachment,
      });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 2. GET /api/dispatches/:id/attachments
  // ============================================
  async getAttachments(req, res, next) {
    try {
      const result = await attachmentsService.getAttachments(
        req.params.id,
        req.user
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 3. GET /api/attachments/:id/download
  // ============================================
  async downloadAttachment(req, res, next) {
    try {
      const attachment = await attachmentsService.getAttachmentForDownload(
        req.params.id,
        req.user
      );

      // ⭐ inline=1 → mở xem trực tiếp trên Chrome
      //    mặc định      → tải về máy
      const isInline = req.query.inline === '1';
      const disposition = isInline ? 'inline' : 'attachment';

      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(attachment.fileName)}"`
      );
      res.setHeader('Content-Type', attachment.fileType);

      const fileStream = fs.createReadStream(attachment.filePath);
      fileStream.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  // ============================================
  // 4. DELETE /api/attachments/:id
  // ============================================
  async deleteAttachment(req, res, next) {
    try {
      const result = await attachmentsService.deleteAttachment(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};