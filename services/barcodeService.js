const Product = require('../models/Product');
const { generateBarcode } = require('../utils/generateBarcode');

/**
 * Generate a unique barcode that doesn't already exist in the database.
 * Retries up to 10 times to avoid collisions.
 *
 * @returns {Promise<string>} Unique barcode string
 */
const generateUniqueBarcode = async () => {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const barcode = generateBarcode();
    const existing = await Product.findOne({ barcode });
    if (!existing) {
      return barcode;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique barcode after maximum attempts');
};

/**
 * Lookup a product by its barcode.
 *
 * @param {string} barcode - The barcode to search for
 * @returns {Promise<object|null>} Product or null
 */
const lookupByBarcode = async (barcode) => {
  return Product.findOne({ barcode: barcode.toUpperCase().trim() });
};

module.exports = {
  generateUniqueBarcode,
  lookupByBarcode,
};
