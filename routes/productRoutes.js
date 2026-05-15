const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createProductRules, updateProductRules, expiryQueryRules, barcodeLookupRules } = require('../utils/validators');
const {
  createProduct, getProducts, getProductById, getProductByBarcode,
  getExpiringProductsHandler, updateProduct, deleteProduct, adjustStock,
} = require('../controllers/productController');

// Public-ish routes (still protected by JWT)
router.get('/expiring', protect, expiryQueryRules, getExpiringProductsHandler);
router.get('/barcode/:code', protect, barcodeLookupRules, getProductByBarcode);
router.get('/', protect, getProducts);
router.get('/:id', protect, getProductById);

// Admin/Manager routes
router.post('/', protect, authorize('admin', 'manager'), createProductRules, createProduct);
router.put('/:id', protect, authorize('admin', 'manager'), updateProductRules, updateProduct);
router.patch('/:id/stock', protect, authorize('admin', 'manager'), adjustStock);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
