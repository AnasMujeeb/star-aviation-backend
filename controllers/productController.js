const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const { generateUniqueBarcode } = require('../services/barcodeService');
const { getExpiringProducts } = require('../services/expiryService');
const { createAuditLog } = require('../middleware/auditMiddleware');

/**
 * POST /api/products
 * Create a new product with auto-generated barcode.
 */
const createProduct = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Generate unique barcode if not provided
    const barcode = req.body.barcode || (await generateUniqueBarcode());

    const productData = {
      ...req.body,
      barcode,
    };

    const product = await Product.create(productData);

    // Audit log
    await createAuditLog({
      action: 'CREATE',
      entity: 'Product',
      entityId: product._id,
      user: req.user,
      details: `Created product "${product.name}" with barcode ${product.barcode}`,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products
 * Get all products with pagination, search, and filtering.
 *
 * Query params:
 *   page (default 1), limit (default 20), search, category,
 *   condition, lifecycleStatus, sortBy, sortOrder
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      condition,
      lifecycleStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { 'supplier.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (lifecycleStatus) filter.lifecycleStatus = lifecycleStatus;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/expiring?days=7
 * Get products expiring within X days.
 */
const getExpiringProductsHandler = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const products = await getExpiringProducts(days);

    res.json({
      success: true,
      count: products.length,
      days,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/barcode/:code
 * Fetch product by barcode.
 */
const getProductByBarcode = async (req, res, next) => {
  try {
    const barcode = req.params.code.toUpperCase().trim();

    const product = await Product.findOne({ barcode });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `No product found with barcode: ${barcode}`,
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Get single product by ID.
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Update a product. Tracks changes in audit log.
 */
const updateProduct = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Track changes for audit log
    const changes = {};
    const updateFields = req.body;

    for (const key of Object.keys(updateFields)) {
      if (key === 'supplier') {
        // Handle nested supplier object
        if (JSON.stringify(product.supplier) !== JSON.stringify(updateFields.supplier)) {
          changes.supplier = { from: product.supplier, to: updateFields.supplier };
        }
      } else if (product[key] !== undefined && String(product[key]) !== String(updateFields[key])) {
        changes[key] = { from: product[key], to: updateFields[key] };
      }
    }

    // Don't allow barcode changes (it's a permanent identifier)
    delete updateFields.barcode;

    // If quantity changes, reset low stock notification flag
    if (updateFields.quantity !== undefined && updateFields.quantity !== product.quantity) {
      if (updateFields.quantity > product.minStockLevel) {
        updateFields.isNotifiedLowStock = false;
      }
    }

    // If expiryDate changes, reset expiry notification flag
    if (updateFields.expiryDate && updateFields.expiryDate !== product.expiryDate) {
      updateFields.isNotifiedExpiry = false;
      updateFields.isExpired = new Date(updateFields.expiryDate) < new Date();
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    // Audit log
    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        action: 'UPDATE',
        entity: 'Product',
        entityId: product._id,
        user: req.user,
        changes,
        details: `Updated product "${product.name}" (${product.barcode})`,
      });
    }

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Delete a product. Admin only.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Audit log
    await createAuditLog({
      action: 'DELETE',
      entity: 'Product',
      entityId: product._id,
      user: req.user,
      details: `Deleted product "${product.name}" (${product.barcode})`,
    });

    res.json({
      success: true,
      message: `Product "${product.name}" deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/products/:id/stock
 * Adjust stock quantity (stock in or stock out).
 * Body: { adjustment: +5 or -3 }
 */
const adjustStock = async (req, res, next) => {
  try {
    const { adjustment } = req.body;

    if (adjustment === undefined || adjustment === 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment value is required and cannot be zero',
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const oldQuantity = product.quantity;
    const newQuantity = product.quantity + parseInt(adjustment);

    if (newQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current: ${product.quantity}, Requested: ${Math.abs(adjustment)}`,
      });
    }

    product.quantity = newQuantity;

    // Reset low stock notification if restocked above threshold
    if (newQuantity > product.minStockLevel) {
      product.isNotifiedLowStock = false;
    }

    await product.save();

    // Audit log
    const action = adjustment > 0 ? 'STOCK_IN' : 'STOCK_OUT';
    await createAuditLog({
      action,
      entity: 'Product',
      entityId: product._id,
      user: req.user,
      changes: { quantity: { from: oldQuantity, to: newQuantity } },
      details: `${action === 'STOCK_IN' ? 'Added' : 'Removed'} ${Math.abs(adjustment)} ${product.unit} of "${product.name}" (${product.barcode}). ${oldQuantity} → ${newQuantity}`,
    });

    res.json({
      success: true,
      data: product,
      adjustment: {
        action,
        previousQuantity: oldQuantity,
        newQuantity,
        change: parseInt(adjustment),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductByBarcode,
  getExpiringProductsHandler,
  updateProduct,
  deleteProduct,
  adjustStock,
};
