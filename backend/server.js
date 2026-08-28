const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (Dashboard UI)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Fallback to Dashboard SPA for non-API routes
app.get('{*path}', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Route Handler for unhandled API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route '${req.originalUrl}' not found on server.`
    }
  });
});

// Global Error Middleware
app.use(errorHandler);

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`E-Commerce REST API & Dashboard Server running on port ${PORT}`);
  });
}

module.exports = app;
