const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique barcode for Star Air Aviation.
 * Format: SAA-XXXXXX (6-character alphanumeric uppercase)
 *
 * @returns {string} Unique barcode string
 */
const generateBarcode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const uuid = uuidv4().replace(/-/g, '').toUpperCase();
  // Take 6 characters from UUID for uniqueness
  const code = uuid.substring(0, 6);
  return `SAA-${code}`;
};

/**
 * Validate barcode format.
 * Must match SAA-XXXXXX pattern.
 *
 * @param {string} barcode
 * @returns {boolean}
 */
const isValidBarcode = (barcode) => {
  return /^SAA-[A-Z0-9]{6}$/.test(barcode);
};

module.exports = { generateBarcode, isValidBarcode };
