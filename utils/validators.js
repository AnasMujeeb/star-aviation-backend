const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a product.
 */
const createProductRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'Engine Parts',
      'Avionics',
      'Hydraulics',
      'Airframe',
      'Landing Gear',
      'Electrical',
      'Fuel System',
      'Pneumatics',
      'Safety Equipment',
      'Consumables',
      'Tools',
      'General',
    ])
    .withMessage('Invalid category'),

  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date'),

  body('supplier.name')
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required'),

  body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min stock level must be a non-negative integer'),

  body('unit')
    .optional()
    .isIn(['pcs', 'kg', 'liters', 'meters', 'sets', 'pairs', 'rolls'])
    .withMessage('Invalid unit'),

  body('condition')
    .optional()
    .isIn(['New', 'Overhauled', 'Serviceable', 'Unserviceable', 'Repaired'])
    .withMessage('Invalid condition'),

  body('lifecycleStatus')
    .optional()
    .isIn(['Active', 'Quarantined', 'Scrapped', 'Expired'])
    .withMessage('Invalid lifecycle status'),
];

/**
 * Validation rules for updating a product.
 * All fields optional since it's a partial update.
 */
const updateProductRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Product name cannot exceed 200 characters'),

  body('category')
    .optional()
    .trim()
    .isIn([
      'Engine Parts',
      'Avionics',
      'Hydraulics',
      'Airframe',
      'Landing Gear',
      'Electrical',
      'Fuel System',
      'Pneumatics',
      'Safety Equipment',
      'Consumables',
      'Tools',
      'General',
    ])
    .withMessage('Invalid category'),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date'),

  body('minStockLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min stock level must be a non-negative integer'),
];

/**
 * Validation for the expiry query parameter.
 */
const expiryQueryRules = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365'),
];

/**
 * Validation for barcode lookup parameter.
 */
const barcodeLookupRules = [
  param('code')
    .trim()
    .notEmpty()
    .withMessage('Barcode is required'),
];

/**
 * Validation for stock adjustment.
 */
const stockAdjustmentRules = [
  body('barcode')
    .trim()
    .notEmpty()
    .withMessage('Barcode is required'),

  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
];

module.exports = {
  createProductRules,
  updateProductRules,
  expiryQueryRules,
  barcodeLookupRules,
  stockAdjustmentRules,
};
