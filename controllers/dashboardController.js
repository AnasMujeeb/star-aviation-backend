const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

/**
 * GET /api/dashboard/summary
 * Returns aggregate dashboard statistics.
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const warningDays = parseInt(process.env.EXPIRY_WARNING_DAYS) || 30;
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + warningDays);

    // Run all queries in parallel for performance
    const [
      totalProducts,
      totalQuantity,
      lowStockCount,
      expiringSoonCount,
      expiredCount,
      categoryCounts,
      conditionCounts,
      recentActivity,
      unreadNotifications,
    ] = await Promise.all([
      // Total unique products
      Product.countDocuments(),

      // Total quantity across all products
      Product.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]),

      // Products with quantity <= minStockLevel
      Product.countDocuments({
        $expr: { $lte: ['$quantity', '$minStockLevel'] },
        lifecycleStatus: 'Active',
      }),

      // Products expiring within warningDays
      Product.countDocuments({
        expiryDate: { $gte: now, $lte: warningDate },
        lifecycleStatus: { $ne: 'Scrapped' },
      }),

      // Already expired products
      Product.countDocuments({
        expiryDate: { $lt: now },
        lifecycleStatus: { $ne: 'Scrapped' },
      }),

      // Products grouped by category
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } },
        { $sort: { count: -1 } },
      ]),

      // Products grouped by condition
      Product.aggregate([
        { $group: { _id: '$condition', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Last 10 audit log entries
      AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .lean(),

      // Unread notification count
      Notification.countDocuments({ isRead: false }),
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts,
          totalQuantity: totalQuantity[0]?.total || 0,
          lowStockCount,
          expiringSoonCount,
          expiredCount,
          unreadNotifications,
        },
        categoryCounts: categoryCounts.map((c) => ({
          category: c._id,
          count: c.count,
          totalQuantity: c.totalQty,
        })),
        conditionCounts: conditionCounts.map((c) => ({
          condition: c._id,
          count: c.count,
        })),
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/expiry-timeline
 * Returns products grouped by expiry timeframe.
 */
const getExpiryTimeline = async (req, res, next) => {
  try {
    const now = new Date();

    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);

    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);

    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);

    const [expired, within7, within30, within60, within90] = await Promise.all([
      Product.find({ expiryDate: { $lt: now }, lifecycleStatus: { $ne: 'Scrapped' } })
        .select('name barcode category expiryDate quantity')
        .sort({ expiryDate: 1 })
        .limit(50),

      Product.find({ expiryDate: { $gte: now, $lte: sevenDays } })
        .select('name barcode category expiryDate quantity')
        .sort({ expiryDate: 1 }),

      Product.find({ expiryDate: { $gt: sevenDays, $lte: thirtyDays } })
        .select('name barcode category expiryDate quantity')
        .sort({ expiryDate: 1 }),

      Product.find({ expiryDate: { $gt: thirtyDays, $lte: sixtyDays } })
        .select('name barcode category expiryDate quantity')
        .sort({ expiryDate: 1 }),

      Product.find({ expiryDate: { $gt: sixtyDays, $lte: ninetyDays } })
        .select('name barcode category expiryDate quantity')
        .sort({ expiryDate: 1 }),
    ]);

    res.json({
      success: true,
      data: {
        expired: { count: expired.length, items: expired },
        within7Days: { count: within7.length, items: within7 },
        within30Days: { count: within30.length, items: within30 },
        within60Days: { count: within60.length, items: within60 },
        within90Days: { count: within90.length, items: within90 },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/stock-levels
 * Returns stock levels grouped by category.
 */
const getStockLevels = async (req, res, next) => {
  try {
    const stockData = await Product.aggregate([
      { $match: { lifecycleStatus: 'Active' } },
      {
        $group: {
          _id: '$category',
          totalQuantity: { $sum: '$quantity' },
          productCount: { $sum: 1 },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0],
            },
          },
          avgQuantity: { $avg: '$quantity' },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    res.json({
      success: true,
      data: stockData.map((s) => ({
        category: s._id,
        totalQuantity: s.totalQuantity,
        productCount: s.productCount,
        lowStockCount: s.lowStockCount,
        avgQuantity: Math.round(s.avgQuantity),
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/dashboard/recent-activity
 * Returns the latest audit log entries.
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const activity = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getExpiryTimeline,
  getStockLevels,
  getRecentActivity,
};
