const pool = require('../config/db');

/**
 * GET /api/inventory
 * Fetch inventory stock records
 */
const getInventory = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        i.inventory_id,
        i.product_id,
        p.product_name,
        c.category_name,
        p.price,
        i.quantity,
        i.updated_at
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id
      JOIN categories c ON p.category_id = c.category_id
      ORDER BY i.inventory_id ASC
    `;

    const [inventory] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory
};
