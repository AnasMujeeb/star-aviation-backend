require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');

const categories = [
  'Engine Parts', 'Avionics', 'Hydraulics', 'Airframe',
  'Landing Gear', 'Electrical', 'Fuel System', 'Safety Equipment',
  'Consumables', 'Tools', 'General',
];

const suppliers = [
  { name: 'Boeing Supply Chain', contact: '+1-312-555-0101', email: 'parts@boeing-supply.com' },
  { name: 'Airbus Spares Int.', contact: '+33-1-555-0202', email: 'orders@airbus-spares.com' },
  { name: 'Honeywell Aero Parts', contact: '+1-602-555-0303', email: 'sales@honeywell-aero.com' },
  { name: 'GE Aviation Services', contact: '+1-513-555-0404', email: 'service@ge-aviation.com' },
  { name: 'Pratt & Whitney Dist.', contact: '+1-860-555-0505', email: 'dist@pw-parts.com' },
];

const conditions = ['New', 'Overhauled', 'Serviceable', 'Repaired'];

/**
 * Generate sample products with varied expiry dates for testing.
 */
const generateProducts = () => {
  const now = new Date();
  const products = [
    { name: 'Turbine Blade Assembly', category: 'Engine Parts', quantity: 12, minStockLevel: 5, partNumber: 'PN-737-ENG-042', serialNumber: 'SN-TB-20240001', daysUntilExpiry: 5, condition: 'New', location: 'Hangar A - Bay 1' },
    { name: 'Hydraulic Pump Seal Kit', category: 'Hydraulics', quantity: 45, minStockLevel: 20, partNumber: 'PN-HYD-SEAL-017', serialNumber: 'SN-HS-20240002', daysUntilExpiry: 15, condition: 'New', location: 'Warehouse B - Shelf 3' },
    { name: 'Avionics Display Unit', category: 'Avionics', quantity: 3, minStockLevel: 5, partNumber: 'PN-AV-DISP-089', serialNumber: 'SN-AD-20240003', daysUntilExpiry: 60, condition: 'Overhauled', location: 'Hangar A - Bay 4' },
    { name: 'Landing Gear Actuator', category: 'Landing Gear', quantity: 8, minStockLevel: 3, partNumber: 'PN-LG-ACT-023', serialNumber: 'SN-LA-20240004', daysUntilExpiry: 180, condition: 'New', location: 'Warehouse C - Rack 7' },
    { name: 'Fuel Filter Element', category: 'Fuel System', quantity: 2, minStockLevel: 15, partNumber: 'PN-FUEL-FLT-056', serialNumber: 'SN-FF-20240005', daysUntilExpiry: -3, condition: 'New', location: 'Warehouse A - Shelf 1' },
    { name: 'Oxygen Mask Assembly', category: 'Safety Equipment', quantity: 50, minStockLevel: 25, partNumber: 'PN-SAF-OXY-012', serialNumber: 'SN-OM-20240006', daysUntilExpiry: 365, condition: 'New', location: 'Emergency Store' },
    { name: 'Wire Harness - Main Bus', category: 'Electrical', quantity: 6, minStockLevel: 4, partNumber: 'PN-EL-WIRE-078', serialNumber: 'SN-WH-20240007', daysUntilExpiry: 25, condition: 'New', location: 'Hangar B - Bay 2' },
    { name: 'Airframe Skin Panel', category: 'Airframe', quantity: 15, minStockLevel: 5, partNumber: 'PN-AF-SKIN-034', serialNumber: 'SN-SP-20240008', daysUntilExpiry: 730, condition: 'New', location: 'Warehouse D' },
    { name: 'Engine Oil - Mobil Jet II', category: 'Consumables', quantity: 100, minStockLevel: 50, partNumber: 'PN-CON-OIL-001', serialNumber: 'SN-OIL-20240009', daysUntilExpiry: 90, condition: 'New', location: 'Fluid Store' },
    { name: 'Torque Wrench Calibrated', category: 'Tools', quantity: 4, minStockLevel: 2, partNumber: 'PN-TOOL-TW-045', serialNumber: 'SN-TW-20240010', daysUntilExpiry: 120, condition: 'Serviceable', location: 'Tool Crib' },
    { name: 'Brake Assembly Disc', category: 'Landing Gear', quantity: 0, minStockLevel: 4, partNumber: 'PN-LG-BRK-019', serialNumber: 'SN-BD-20240011', daysUntilExpiry: 200, condition: 'New', location: 'Warehouse C - Rack 2' },
    { name: 'Navigation Light Bulb', category: 'Electrical', quantity: 30, minStockLevel: 10, partNumber: 'PN-EL-NAV-003', serialNumber: 'SN-NL-20240012', daysUntilExpiry: 45, condition: 'New', location: 'Hangar A - Spares' },
    { name: 'Pneumatic Valve Assy', category: 'General', quantity: 7, minStockLevel: 3, partNumber: 'PN-PNEU-VAL-067', serialNumber: 'SN-PV-20240013', daysUntilExpiry: -10, condition: 'Overhauled', location: 'Warehouse B - Shelf 7' },
    { name: 'Cockpit Instrument Panel', category: 'Avionics', quantity: 1, minStockLevel: 2, partNumber: 'PN-AV-CIP-091', serialNumber: 'SN-CI-20240014', daysUntilExpiry: 3, condition: 'Repaired', location: 'Hangar A - Bay 6' },
    { name: 'Fire Extinguisher Bottle', category: 'Safety Equipment', quantity: 20, minStockLevel: 10, partNumber: 'PN-SAF-FE-008', serialNumber: 'SN-FE-20240015', daysUntilExpiry: 30, condition: 'New', location: 'Emergency Store' },
  ];

  return products.map((p, i) => {
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + p.daysUntilExpiry);
    const mfg = new Date(now);
    mfg.setFullYear(mfg.getFullYear() - 1);

    return {
      name: p.name,
      barcode: `SAA-${String(i + 1).padStart(3, '0')}${String.fromCharCode(65 + i)}XR`,
      partNumber: p.partNumber,
      serialNumber: p.serialNumber,
      category: p.category,
      quantity: p.quantity,
      minStockLevel: p.minStockLevel,
      unit: 'pcs',
      expiryDate: expiry,
      manufacturingDate: mfg,
      batchNumber: `BATCH-2024-${String(i + 1).padStart(4, '0')}`,
      supplier: suppliers[i % suppliers.length],
      location: p.location,
      condition: p.condition,
      certificationRef: `EASA-FORM1-${String(i + 1).padStart(6, '0')}`,
      lifecycleStatus: p.daysUntilExpiry < 0 ? 'Expired' : 'Active',
      isExpired: p.daysUntilExpiry < 0,
      notes: '',
    };
  });
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Product.deleteMany({}),
      User.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@starair.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log(`👤 Created admin: admin@starair.com / admin123`);

    // Create manager user
    await User.create({
      name: 'Operations Manager',
      email: 'manager@starair.com',
      password: 'manager123',
      role: 'manager',
    });
    console.log(`👤 Created manager: manager@starair.com / manager123`);

    // Create viewer user
    await User.create({
      name: 'Inventory Viewer',
      email: 'viewer@starair.com',
      password: 'viewer123',
      role: 'viewer',
    });
    console.log(`👤 Created viewer: viewer@starair.com / viewer123`);

    // Create products
    const products = generateProducts();
    const createdProducts = await Product.insertMany(products);
    console.log(`📦 Created ${createdProducts.length} products`);

    // Create audit logs for seeded products
    const auditLogs = createdProducts.map((p) => ({
      action: 'CREATE',
      entity: 'Product',
      entityId: p._id,
      userId: admin._id,
      userName: admin.name,
      details: `Seeded product "${p.name}" (${p.barcode})`,
      timestamp: new Date(),
    }));
    await AuditLog.insertMany(auditLogs);
    console.log(`📝 Created ${auditLogs.length} audit log entries`);

    console.log('\n✅ Database seeded successfully!\n');

    // Print summary
    console.log('=== SEED SUMMARY ===');
    console.log(`Products: ${createdProducts.length}`);
    console.log(`Users: 3 (admin, manager, viewer)`);
    console.log(`Expired products: ${products.filter(p => p.isExpired).length}`);
    console.log(`Low stock products: ${products.filter(p => p.quantity <= p.minStockLevel).length}`);
    console.log('===================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
