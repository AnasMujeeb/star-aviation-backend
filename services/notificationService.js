const Notification = require('../models/Notification');

/**
 * Create a notification and return it.
 *
 * @param {object} data - Notification data
 * @param {string} data.type - EXPIRY_WARNING | EXPIRED | LOW_STOCK
 * @param {string} data.title - Short title
 * @param {string} data.message - Detailed message
 * @param {string} data.severity - info | warning | critical
 * @param {string} data.productId - Related product ObjectId
 * @returns {Promise<object>} Created notification
 */
const createNotification = async ({ type, title, message, severity, productId }) => {
  const notification = await Notification.create({
    type,
    title,
    message,
    severity: severity || 'info',
    productId,
  });

  return notification;
};

/**
 * Get all notifications, unread first, newest first.
 *
 * @param {object} options
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.limit - Items per page
 * @returns {Promise<object>} { notifications, total, page, pages }
 */
const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find()
      .populate('productId', 'name barcode')
      .sort({ isRead: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(),
  ]);

  return {
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Mark a notification as read.
 *
 * @param {string} notificationId
 * @returns {Promise<object|null>} Updated notification or null
 */
const markAsRead = async (notificationId) => {
  return Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
};

/**
 * Mark all notifications as read.
 *
 * @returns {Promise<object>} Update result
 */
const markAllAsRead = async () => {
  return Notification.updateMany({ isRead: false }, { isRead: true });
};

/**
 * Get count of unread notifications.
 *
 * @returns {Promise<number>}
 */
const getUnreadCount = async () => {
  return Notification.countDocuments({ isRead: false });
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
