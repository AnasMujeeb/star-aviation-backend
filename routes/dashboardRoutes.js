const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardSummary, getExpiryTimeline, getStockLevels, getRecentActivity } = require('../controllers/dashboardController');

router.get('/summary', protect, getDashboardSummary);
router.get('/expiry-timeline', protect, getExpiryTimeline);
router.get('/stock-levels', protect, getStockLevels);
router.get('/recent-activity', protect, getRecentActivity);

module.exports = router;
