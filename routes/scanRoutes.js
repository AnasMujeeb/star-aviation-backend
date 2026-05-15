const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { lookupByBarcode, stockIn, stockOut } = require('../controllers/scanController');

router.get('/lookup/:barcode', protect, lookupByBarcode);
router.post('/stock-in', protect, authorize('admin', 'manager'), stockIn);
router.post('/stock-out', protect, authorize('admin', 'manager'), stockOut);

module.exports = router;
