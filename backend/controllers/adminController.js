const pool = require('../config/db');

/**
 * GET /api/admin/dashboard
 * Business metrics summary
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders) AS total_revenue,
        (SELECT COUNT(*) FROM orders WHERE status = 'Confirmed') AS confirmed_orders,
        (SELECT COUNT(*) FROM inventory WHERE quantity < 20) AS low_stock_products
    `;

    const [rows] = await pool.query(query);
    const summary = rows[0];

    res.status(200).json({
      success: true,
      data: {
        total_users: Number(summary.total_users),
        total_products: Number(summary.total_products),
        total_orders: Number(summary.total_orders),
        total_revenue: Number(summary.total_revenue),
        confirmed_orders: Number(summary.confirmed_orders),
        low_stock_products: Number(summary.low_stock_products)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/revenue
 * Overall revenue report
 */
const getRevenueReport = async (req, res, next) => {
  try {
    const query = `
      SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COALESCE(AVG(total_amount), 0) AS average_order_value
      FROM orders
    `;

    const [rows] = await pool.query(query);
    const metrics = rows[0];

    res.status(200).json({
      success: true,
      data: {
        total_orders: Number(metrics.total_orders),
        total_revenue: Number(metrics.total_revenue),
        average_order_value: Number(metrics.average_order_value)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/top-products
 * Top performing products using database view product_sales_summary
 */
const getTopProducts = async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      limit = 10;
    }

    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        c.category_name,
        p.price,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      GROUP BY p.product_id, p.product_name, c.category_name, p.price
      ORDER BY total_revenue DESC, units_sold DESC
      LIMIT ?
    `;

    const [products] = await pool.query(query, [limit]);

    res.status(200).json({
      success: true,
      count: products.length,
      limit: limit,
      data: products.map(p => ({
        ...p,
        price: Number(p.price),
        units_sold: Number(p.units_sold),
        total_revenue: Number(p.total_revenue)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/customers
 * Customer spending report
 */
const getCustomerAnalytics = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        u.name AS customer_name,
        u.email,
        COUNT(o.order_id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM users u
      LEFT JOIN orders o ON u.user_id = o.user_id
      GROUP BY u.user_id, u.name, u.email
      ORDER BY total_spent DESC
    `;

    const [customers] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers.map(c => ({
        ...c,
        total_orders: Number(c.total_orders),
        total_spent: Number(c.total_spent)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/low-stock
 * Low-stock inventory report using database view product_inventory_view
 */
const getLowStockReport = async (req, res, next) => {
  try {
    let threshold = parseInt(req.query.threshold, 10);
    if (isNaN(threshold) || threshold < 0) {
      threshold = 20;
    }

    const query = `
      SELECT 
        product_id,
        product_name,
        category_name,
        price,
        stock_quantity
      FROM product_inventory_view
      WHERE stock_quantity < ?
      ORDER BY stock_quantity ASC
    `;

    const [items] = await pool.query(query, [threshold]);

    res.status(200).json({
      success: true,
      threshold: threshold,
      count: items.length,
      data: items.map(i => ({
        ...i,
        price: Number(i.price),
        stock_quantity: Number(i.stock_quantity)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/category-performance
 * Category sales and revenue metrics
 */
const getCategoryPerformance = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        c.category_id,
        c.category_name,
        COUNT(DISTINCT p.product_id) AS total_products,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS category_revenue
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      GROUP BY c.category_id, c.category_name
      ORDER BY category_revenue DESC
    `;

    const [categories] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories.map(c => ({
        ...c,
        total_products: Number(c.total_products),
        units_sold: Number(c.units_sold),
        category_revenue: Number(c.category_revenue)
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders-by-status
 * Orders aggregated by status
 */
const getOrdersByStatus = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        status,
        COUNT(*) AS order_count,
        COALESCE(SUM(total_amount), 0) AS total_value
      FROM orders
      GROUP BY status
      ORDER BY order_count DESC
    `;

    const [statuses] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: statuses.length,
      data: statuses.map(s => ({
        status: s.status,
        order_count: Number(s.order_count),
        total_value: Number(s.total_value)
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getRevenueReport,
  getTopProducts,
  getCustomerAnalytics,
  getLowStockReport,
  getCategoryPerformance,
  getOrdersByStatus
};
