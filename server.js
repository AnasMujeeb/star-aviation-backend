require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { runAllChecks } = require('./jobs/expiryChecker');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const scanRoutes = require('./routes/scanRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const toolIssueRoutes = require('./routes/toolIssueRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────

// CORS Configuration updated to support withCredentials and explicit Vercel origin
const allowedOrigins = [
  'https://star-aviation-frontend.vercel.app', // Aapka live frontend URL
  'http://localhost:3000',                     // Local React (agar 3000 port ho)
  'http://localhost:5173'                      // Vite Local testing ke liye
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Yeh cookies aur auth headers pass karne ke liye zaroori hai
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/tool-issues', toolIssueRoutes);

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Star Air Aviation Inventory API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Manual trigger for expiry/stock checks ─────────────────
app.post('/api/admin/run-checks', async (req, res) => {
  try {
    const result = await runAllChecks();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express
    app.listen(PORT, () => {
      console.log(`\n Star Air Aviation Inventory API`);
      console.log(`   Server running on http://localhost:${PORT}`);
      console.log(`   Health check:  http://localhost:${PORT}/api/health`);
      console.log(`   Environment:   ${process.env.NODE_ENV || 'development'}\n`);
    });

    // Run initial checks on startup
    console.log('Running initial inventory checks...');
    await runAllChecks();

  } catch (error) {
    console.error(' Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
