const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry.
 *
 * @param {object} params
 * @param {string} params.action - CREATE | UPDATE | DELETE | STOCK_IN | STOCK_OUT
 * @param {string} params.entity - Entity type (e.g., 'Product')
 * @param {string} params.entityId - ID of the affected entity
 * @param {object} params.user - User object (from req.user)
 * @param {object} params.changes - { field: { from, to } }
 * @param {string} params.details - Human-readable description
 */
const createAuditLog = async ({ action, entity, entityId, user, changes, details }) => {
  try {
    await AuditLog.create({
      action,
      entity: entity || 'Product',
      entityId,
      userId: user ? user._id : null,
      userName: user ? user.name : 'System',
      changes: changes || {},
      details: details || '',
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit logging should never block the main operation
    console.error('Audit log creation failed:', error.message);
  }
};

module.exports = { createAuditLog };
