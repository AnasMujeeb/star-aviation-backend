const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'STOCK_IN', 'STOCK_OUT'],
  },
  entity: {
    type: String,
    required: true,
    default: 'Product',
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userName: {
    type: String,
    default: 'System',
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // { field: { from: old, to: new } }
    default: {},
  },
  details: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Index for querying by entity
auditLogSchema.index({ entityId: 1 });
// Index for date-based queries (descending for recent-first)
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
