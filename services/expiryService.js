const Product = require('../models/Product');
const Notification = require('../models/Notification');

/**
 * Find products expiring within a given number of days.
 *
 * @param {number} days - Number of days from now to check expiry
 * @returns {Promise<Array>} Array of expiring products
 */
const getExpiringProducts = async (days = 30) => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return Product.find({
    expiryDate: { $gte: now, $lte: futureDate },
    lifecycleStatus: { $ne: 'Scrapped' },
  }).sort({ expiryDate: 1 });
};

/**
 * Find all products that have already expired.
 *
 * @returns {Promise<Array>} Array of expired products
 */
const getExpiredProducts = async () => {
  const now = new Date();
  return Product.find({
    expiryDate: { $lt: now },
    lifecycleStatus: { $ne: 'Scrapped' },
  }).sort({ expiryDate: 1 });
};

/**
 * Run the full expiry check:
 * 1. Mark expired products
 * 2. Create notifications for expiring-soon products
 * 3. Create notifications for expired products
 *
 * @returns {object} Summary of actions taken
 */
const runExpiryCheck = async () => {
  const now = new Date();
  const warningDays = parseInt(process.env.EXPIRY_WARNING_DAYS) || 30;
  const criticalDays = parseInt(process.env.EXPIRY_CRITICAL_DAYS) || 7;

  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + warningDays);

  const criticalDate = new Date();
  criticalDate.setDate(criticalDate.getDate() + criticalDays);

  let warningCount = 0;
  let criticalCount = 0;
  let expiredCount = 0;

  // --- 1. Handle already-expired products ---
  const expiredProducts = await Product.find({
    expiryDate: { $lt: now },
    isExpired: false,
    lifecycleStatus: { $ne: 'Scrapped' },
  });

  for (const product of expiredProducts) {
    product.isExpired = true;
    product.lifecycleStatus = 'Expired';
    product.isNotifiedExpiry = true;
    await product.save();

    await Notification.create({
      type: 'EXPIRED',
      title: 'Product Expired',
      message: `"${product.name}" (${product.barcode}) has expired on ${product.expiryDate.toLocaleDateString()}.`,
      severity: 'critical',
      productId: product._id,
    });

    expiredCount++;
  }

  // --- 2. Handle critical expiry (within criticalDays) ---
  const criticalProducts = await Product.find({
    expiryDate: { $gte: now, $lte: criticalDate },
    isNotifiedExpiry: false,
    lifecycleStatus: { $ne: 'Scrapped' },
  });

  for (const product of criticalProducts) {
    product.isNotifiedExpiry = true;
    await product.save();

    const daysLeft = Math.ceil(
      (product.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    await Notification.create({
      type: 'EXPIRY_WARNING',
      title: 'Critical: Expiry Imminent',
      message: `"${product.name}" (${product.barcode}) expires in ${daysLeft} day(s).`,
      severity: 'critical',
      productId: product._id,
    });

    criticalCount++;
  }

  // --- 3. Handle warning expiry (within warningDays but beyond criticalDays) ---
  const warningProducts = await Product.find({
    expiryDate: { $gt: criticalDate, $lte: warningDate },
    isNotifiedExpiry: false,
    lifecycleStatus: { $ne: 'Scrapped' },
  });

  for (const product of warningProducts) {
    product.isNotifiedExpiry = true;
    await product.save();

    const daysLeft = Math.ceil(
      (product.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    await Notification.create({
      type: 'EXPIRY_WARNING',
      title: 'Warning: Expiry Approaching',
      message: `"${product.name}" (${product.barcode}) expires in ${daysLeft} day(s).`,
      severity: 'warning',
      productId: product._id,
    });

    warningCount++;
  }

  return {
    expired: expiredCount,
    critical: criticalCount,
    warning: warningCount,
    checkedAt: now.toISOString(),
  };
};

/**
 * Check for low stock products and create notifications.
 *
 * @returns {object} Summary of low stock alerts created
 */
const runLowStockCheck = async () => {
  const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;

  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$quantity', '$minStockLevel'] },
    isNotifiedLowStock: false,
    lifecycleStatus: 'Active',
  });

  let count = 0;

  for (const product of lowStockProducts) {
    product.isNotifiedLowStock = true;
    await product.save();

    await Notification.create({
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `"${product.name}" (${product.barcode}) has only ${product.quantity} ${product.unit} remaining (min: ${product.minStockLevel}).`,
      severity: product.quantity === 0 ? 'critical' : 'warning',
      productId: product._id,
    });

    count++;
  }

  return { lowStockAlerts: count };
};

module.exports = {
  getExpiringProducts,
  getExpiredProducts,
  runExpiryCheck,
  runLowStockCheck,
};
