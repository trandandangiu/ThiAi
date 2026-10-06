// backend/src/controllers/notifications.controller.js
import { notificationsService } from '../services/notifications.service.js';

export const notificationsController = {
  async getNotifications(req, res, next) {
    try {
      const result = await notificationsService.getNotifications(
        req.user,
        req.query
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const result = await notificationsService.markAsRead(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationsService.markAllAsRead(req.user);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async deleteNotification(req, res, next) {
    try {
      const result = await notificationsService.deleteNotification(
        req.params.id,
        req.user
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationsService.getUnreadCount(req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  async getUnreadNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const result = await notificationsService.getUnreadNotifications(
        req.user,
        limit
      );
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

};