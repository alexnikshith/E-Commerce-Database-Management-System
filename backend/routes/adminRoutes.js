const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getRevenueReport,
  getTopProducts,
  getCustomerAnalytics,
  getLowStockReport,
  getCategoryPerformance,
  getOrdersByStatus,
  verifyAdminPassword
} = require('../controllers/adminController');

router.post('/login', verifyAdminPassword);
router.get('/dashboard', getDashboardSummary);
router.get('/revenue', getRevenueReport);
router.get('/top-products', getTopProducts);
router.get('/customers', getCustomerAnalytics);
router.get('/low-stock', getLowStockReport);
router.get('/category-performance', getCategoryPerformance);
router.get('/orders-by-status', getOrdersByStatus);

module.exports = router;
