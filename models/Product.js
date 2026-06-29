const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    barcode: {
      type: String,
      unique: true,
      uppercase: true,
      sparse: true,
      trim: true,
      index: true,
    },
    partNumber: {
      type: String,
      trim: true,
       required: false,
      default: '',
    },
    serialNumber: {
      type: String,
      trim: true,
       required: false,
      default: '',
    },
    category: {
      type: String,
      required: [false, 'Category is required'],
      trim: true,
      enum: {
        values: [
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
        ],
        message: '{VALUE} is not a valid category',
      },
    },
    quantity: {
      type: Number,
      required: [false, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    minStockLevel: {
      type: Number,
      default: 10,
       required: false,
      min: [0, 'Minimum stock level cannot be negative'],
    },
    unit: {
      type: String,
      default: 'pcs',
       required: false,
      enum: ['pcs', 'kg', 'liters', 'meters', 'sets', 'pairs', 'rolls'],
    },
    expiryDate: {
      type: Date,
      required: false,
      index: true,
    },
    // models/Product.js ke schema ke andar yeh add karein:
tsoDate: {
type: Date,
required: false // Chunke har product ka overhaul nahi hota, isay optional rakhein
},
    manufacturingDate: {
      type: Date,
      required: false
    },
    batchNumber: {
      type: String,
      trim: true,
      required: false,
      default: '',
    },
    supplier: {
      name: {
        type: String,
        required: [false, 'Supplier name is required'],
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
         required: false,
        default: '',
      },
      email: {
        type: String,
        trim: true,
         required: false,
        lowercase: true,
        default: '',
      },
    },
    location: {
      type: String,
      trim: true,
       required: false,
      default: 'Main Warehouse',
    },
    condition: {
      type: String,
      enum: ['New', 'Overhauled', 'Serviceable', 'Unserviceable', 'Repaired'],
      default: 'New',
       required: false,
    },
    certificationRef: {
      type: String,
      trim: true,
       required: false,
      default: '',
    },
    lifecycleStatus: {
      type: String,
       required: false,
      enum: ['Active', 'Quarantined', 'Scrapped', 'Expired'],
      default: 'Active',
    },
    notes: {
      type: String,
      trim: true,
       required: false,
      default: '',
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
    isNotifiedExpiry: {
      type: Boolean,
      default: false,
    },
    isNotifiedLowStock: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Compound index for expiry checks
productSchema.index({ expiryDate: 1, isNotifiedExpiry: 1 });
// Index for low stock queries
productSchema.index({ quantity: 1, minStockLevel: 1 });

/**
 * Virtual: check if product stock is low
 */
productSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.minStockLevel;
});

/**
 * Virtual: days until expiry
 */
productSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const now = new Date();
  const diffTime = this.expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

/**
 * Pre-save hook: auto-set isExpired flag
 */
productSchema.pre('save', function (next) {
  if (this.expiryDate) {
    this.isExpired = new Date() > this.expiryDate;
    if (this.isExpired) {
      this.lifecycleStatus = 'Expired';
    }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
