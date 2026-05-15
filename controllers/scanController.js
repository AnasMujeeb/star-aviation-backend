const Product = require('../models/Product');
const { createAuditLog } = require('../middleware/auditMiddleware');

const lookupByBarcode = async (req, res, next) => {
  try {
    const barcode = req.params.barcode.toUpperCase().trim();
    const product = await Product.findOne({ barcode });
    if (!product) {
      return res.status(404).json({ success: false, message: `No product found with barcode: ${barcode}` });
    }
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

const stockIn = async (req, res, next) => {
  try {
    const { barcode, quantity } = req.body;
    if (!barcode || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Barcode and positive quantity required' });
    }
    const product = await Product.findOne({ barcode: barcode.toUpperCase().trim() });
    if (!product) {
      return res.status(404).json({ success: false, message: `No product found with barcode: ${barcode}` });
    }
    const oldQty = product.quantity;
    product.quantity += parseInt(quantity);
    if (product.quantity > product.minStockLevel) product.isNotifiedLowStock = false;
    await product.save();
    await createAuditLog({ action: 'STOCK_IN', entity: 'Product', entityId: product._id, user: req.user, changes: { quantity: { from: oldQty, to: product.quantity } }, details: `Scanned IN: +${quantity} ${product.unit} of "${product.name}" (${product.barcode})` });
    res.json({ success: true, message: `Added ${quantity} ${product.unit}`, data: product, adjustment: { action: 'STOCK_IN', previousQuantity: oldQty, newQuantity: product.quantity, change: parseInt(quantity) } });
  } catch (error) { next(error); }
};

const stockOut = async (req, res, next) => {
  try {
    const { barcode, quantity } = req.body;
    if (!barcode || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Barcode and positive quantity required' });
    }
    const product = await Product.findOne({ barcode: barcode.toUpperCase().trim() });
    if (!product) {
      return res.status(404).json({ success: false, message: `No product found with barcode: ${barcode}` });
    }
    if (product.quantity < parseInt(quantity)) {
      return res.status(400).json({ success: false, message: `Insufficient stock. Current: ${product.quantity}, Requested: ${quantity}` });
    }
    const oldQty = product.quantity;
    product.quantity -= parseInt(quantity);
    await product.save();
    await createAuditLog({ action: 'STOCK_OUT', entity: 'Product', entityId: product._id, user: req.user, changes: { quantity: { from: oldQty, to: product.quantity } }, details: `Scanned OUT: -${quantity} ${product.unit} of "${product.name}" (${product.barcode})` });
    res.json({ success: true, message: `Removed ${quantity} ${product.unit}`, data: product, adjustment: { action: 'STOCK_OUT', previousQuantity: oldQty, newQuantity: product.quantity, change: -parseInt(quantity) } });
  } catch (error) { next(error); }
};

module.exports = { lookupByBarcode, stockIn, stockOut };
