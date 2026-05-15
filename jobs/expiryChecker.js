const { runExpiryCheck, runLowStockCheck } = require('../services/expiryService');

/**
 * Run all scheduled checks (expiry + low stock).
 * Called by the cron scheduler or manually via API.
 */
const runAllChecks = async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n⏰ [${timestamp}] Running scheduled inventory checks...`);

  try {
    const expiryResult = await runExpiryCheck();
    console.log(`   📅 Expiry check: ${expiryResult.expired} expired, ${expiryResult.critical} critical, ${expiryResult.warning} warning`);

    const stockResult = await runLowStockCheck();
    console.log(`   📦 Low stock check: ${stockResult.lowStockAlerts} new alerts`);

    return { expiry: expiryResult, stock: stockResult };
  } catch (error) {
    console.error(`   ❌ Check failed: ${error.message}`);
    return { error: error.message };
  }
};

module.exports = { runAllChecks };
