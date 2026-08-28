const pool = require('../config/db');
const crypto = require('crypto');

/**
 * GET /api/users/:id/orders
 * Fetch order history for a specific user ID
 */
const getUserOrders = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid user ID. Must be a positive integer.' }
      });
    }

    // Verify user exists
    const [userCheck] = await pool.execute(
      'SELECT user_id, name, email FROM users WHERE user_id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `User with ID ${userId} not found.` }
      });
    }

    const query = `
      SELECT 
        o.order_id,
        o.order_date,
        o.status,
        o.total_amount
      FROM orders o
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `;

    const [orders] = await pool.execute(query, [userId]);

    res.status(200).json({
      success: true,
      user: userCheck[0],
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Register/create a new user
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name is required and must be at least 2 characters long.' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: { message: 'A valid email address is required.' }
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password is required and must be at least 6 characters long.' }
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? String(phone).trim() : null;

    // Password Hash using SHA-256
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const insertQuery = `
      INSERT INTO users (name, email, password_hash, phone)
      VALUES (?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(insertQuery, [
        cleanName,
        cleanEmail,
        passwordHash,
        cleanPhone
      ]);

      const newUserId = result.insertId;

      const [newUser] = await pool.execute(
        'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?',
        [newUserId]
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: newUser[0]
      });
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
        return res.status(409).json({
          success: false,
          error: { message: `Email '${cleanEmail}' is already registered.` }
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserOrders,
  createUser
};
