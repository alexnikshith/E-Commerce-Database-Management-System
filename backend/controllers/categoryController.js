const pool = require('../config/db');

/**
 * GET /api/categories
 * List all product categories
 */
const getCategories = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        c.category_id,
        c.category_name,
        c.description,
        COUNT(p.product_id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      GROUP BY c.category_id, c.category_name, c.description
      ORDER BY c.category_id ASC
    `;

    const [categories] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id/products
 * Fetch products belonging to a specific category
 */
const getCategoryProducts = async (req, res, next) => {
  try {
    const categoryId = parseInt(req.params.id, 10);

    if (isNaN(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid category ID. Must be a positive integer.' }
      });
    }

    // Verify category exists
    const [categoryCheck] = await pool.execute(
      'SELECT category_id, category_name, description FROM categories WHERE category_id = ?',
      [categoryId]
    );

    if (categoryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Category with ID ${categoryId} not found.` }
      });
    }

    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.brand,
        p.created_at,
        COALESCE(i.quantity, 0) AS stock_quantity
      FROM products p
      LEFT JOIN inventory i ON p.product_id = i.product_id
      WHERE p.category_id = ?
      ORDER BY p.product_id ASC
    `;

    const [products] = await pool.execute(query, [categoryId]);

    res.status(200).json({
      success: true,
      category: categoryCheck[0],
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryProducts
};
