const notificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await notificationService.getNotifications({ page, limit });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) { next(error); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead();
    res.json({ success: true, message: `Marked ${result.modifiedCount} notifications as read` });
  } catch (error) { next(error); }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount();
    res.json({ success: true, count });
  } catch (error) { next(error); }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, getUnreadCount };
