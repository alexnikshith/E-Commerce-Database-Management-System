const pool = require('../config/db');

/**
 * GET /api/orders
 * List all orders
 */
const getOrders = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        o.order_id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.order_date,
        o.status,
        o.total_amount,
        COUNT(oi.order_item_id) AS total_items
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY o.order_id, o.user_id, u.name, u.email, o.order_date, o.status, o.total_amount
      ORDER BY o.order_date DESC
    `;

    const [orders] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 * Fetch detailed single order with customer, items, payment, and shipment info
 */
const getOrderById = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID. Must be a positive integer.' }
      });
    }

    const orderQuery = `
      SELECT 
        o.order_id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        o.order_date,
        o.status,
        o.total_amount
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      WHERE o.order_id = ?
    `;

    const [orders] = await pool.execute(orderQuery, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${orderId} not found.` }
      });
    }

    const itemsQuery = `
      SELECT 
        oi.order_item_id,
        oi.product_id,
        p.product_name,
        p.brand,
        oi.quantity,
        oi.unit_price,
        (oi.quantity * oi.unit_price) AS item_total
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = ?
    `;

    const [items] = await pool.execute(itemsQuery, [orderId]);

    const paymentQuery = `
      SELECT payment_id, payment_method, payment_status, amount, payment_date
      FROM payments
      WHERE order_id = ?
    `;
    const [payments] = await pool.execute(paymentQuery, [orderId]);

    const shipmentQuery = `
      SELECT shipment_id, carrier, tracking_number, shipment_status, shipped_date, delivered_date
      FROM shipments
      WHERE order_id = ?
    `;
    const [shipments] = await pool.execute(shipmentQuery, [orderId]);

    const orderDetail = {
      ...orders[0],
      items: items,
      payment: payments.length > 0 ? payments[0] : null,
      shipment: shipments.length > 0 ? shipments[0] : null
    };

    res.status(200).json({
      success: true,
      data: orderDetail
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders
 * Transactional multi-item order creation
 */
const createOrder = async (req, res, next) => {
  let connection = null;
  try {
    const { user_id, items, payment_method } = req.body;

    const userId = parseInt(user_id, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid user_id (positive integer) is required.' }
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'items must be a non-empty array of objects containing product_id and quantity.' }
      });
    }

    // Validate item structure upfront
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const prodId = parseInt(item.product_id, 10);
      const qty = parseInt(item.quantity, 10);

      if (isNaN(prodId) || prodId <= 0) {
        return res.status(400).json({
          success: false,
          error: { message: `Item at index ${i} has an invalid product_id.` }
        });
      }

      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: { message: `Item at index ${i} must have quantity greater than zero.` }
        });
      }
    }

    connection = await pool.getConnection();

    // Validate user exists
    const [userCheck] = await connection.execute(
      'SELECT user_id FROM users WHERE user_id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      connection.release();
      connection = null;
      return res.status(400).json({
        success: false,
        error: { message: `User with ID ${userId} does not exist.` }
      });
    }

    await connection.beginTransaction();

    // 1. Create Order Header
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, status, total_amount) VALUES (?, ?, ?)',
      [userId, 'Pending', 0.00]
    );

    const newOrderId = orderResult.insertId;
    let runningTotal = 0.0;

    // 2. Insert Order Items (Database Triggers check inventory & deduct stock automatically)
    for (const item of items) {
      const prodId = parseInt(item.product_id, 10);
      const qty = parseInt(item.quantity, 10);

      const [productRows] = await connection.execute(
        'SELECT product_id, product_name, price FROM products WHERE product_id = ?',
        [prodId]
      );

      if (productRows.length === 0) {
        await connection.rollback();
        connection.release();
        connection = null;
        return res.status(400).json({
          success: false,
          error: { message: `Product with ID ${prodId} does not exist.` }
        });
      }

      const unitPrice = parseFloat(productRows[0].price);

      try {
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [newOrderId, prodId, qty, unitPrice]
        );
      } catch (itemErr) {
        await connection.rollback();
        connection.release();
        connection = null;

        // Handle DB trigger signal errors (e.g. Insufficient inventory)
        if (itemErr.sqlState === '45000' || itemErr.errno === 1644) {
          return res.status(400).json({
            success: false,
            error: {
              message: itemErr.message || 'Inventory constraint violation during order placement.',
              code: 'INSUFFICIENT_INVENTORY'
            }
          });
        }
        throw itemErr;
      }

      runningTotal += qty * unitPrice;
    }

    // 3. Update Order Total Amount and Status
    await connection.execute(
      'UPDATE orders SET total_amount = ?, status = ? WHERE order_id = ?',
      [runningTotal, 'Confirmed', newOrderId]
    );

    // 4. Create Payment if payment_method provided
    if (payment_method && typeof payment_method === 'string' && payment_method.trim().length > 0) {
      await connection.execute(
        'INSERT INTO payments (order_id, payment_method, payment_status, amount) VALUES (?, ?, ?, ?)',
        [newOrderId, payment_method.trim(), 'Paid', runningTotal]
      );
    }

    await connection.commit();
    connection.release();
    connection = null;

    // Fetch created order details
    const [finalOrder] = await pool.execute(
      `SELECT o.order_id, o.user_id, u.name AS customer_name, o.order_date, o.status, o.total_amount
       FROM orders o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = ?`,
      [newOrderId]
    );

    const [finalItems] = await pool.execute(
      `SELECT oi.order_item_id, oi.product_id, p.product_name, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) AS item_total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [newOrderId]
    );

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: {
        ...finalOrder[0],
        items: finalItems
      }
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rErr) {}
      connection.release();
    }
    next(error);
  }
};

/**
 * POST /api/orders/:id/items
 * Add an item to an existing order
 */
const addOrderItem = async (req, res, next) => {
  let connection = null;
  try {
    const orderId = parseInt(req.params.id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID. Must be a positive integer.' }
      });
    }

    const { product_id, quantity } = req.body;

    const prodId = parseInt(product_id, 10);
    if (isNaN(prodId) || prodId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid product_id (positive integer) is required.' }
      });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'quantity must be a positive integer greater than zero.' }
      });
    }

    connection = await pool.getConnection();

    // Verify order exists
    const [orderCheck] = await connection.execute(
      'SELECT order_id FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (orderCheck.length === 0) {
      connection.release();
      connection = null;
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${orderId} not found.` }
      });
    }

    // Verify product exists and get unit price
    const [prodCheck] = await connection.execute(
      'SELECT product_id, price FROM products WHERE product_id = ?',
      [prodId]
    );

    if (prodCheck.length === 0) {
      connection.release();
      connection = null;
      return res.status(400).json({
        success: false,
        error: { message: `Product with ID ${prodId} does not exist.` }
      });
    }

    const unitPrice = parseFloat(prodCheck[0].price);

    await connection.beginTransaction();

    try {
      await connection.execute(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, prodId, qty, unitPrice]
      );
    } catch (itemErr) {
      await connection.rollback();
      connection.release();
      connection = null;

      if (itemErr.code === 'ER_DUP_ENTRY' || itemErr.errno === 1062) {
        return res.status(409).json({
          success: false,
          error: { message: `Product with ID ${prodId} is already added to Order ${orderId}.` }
        });
      }

      if (itemErr.sqlState === '45000' || itemErr.errno === 1644) {
        return res.status(400).json({
          success: false,
          error: {
            message: itemErr.message || 'Inventory constraint violation.',
            code: 'INSUFFICIENT_INVENTORY'
          }
        });
      }
      throw itemErr;
    }

    // Recalculate order total amount
    await connection.execute(
      `UPDATE orders 
       SET total_amount = (SELECT COALESCE(SUM(quantity * unit_price), 0) FROM order_items WHERE order_id = ?) 
       WHERE order_id = ?`,
      [orderId, orderId]
    );

    await connection.commit();
    connection.release();
    connection = null;

    const [updatedOrder] = await pool.execute(
      'SELECT order_id, total_amount, status FROM orders WHERE order_id = ?',
      [orderId]
    );

    const [orderItems] = await pool.execute(
      `SELECT oi.order_item_id, oi.product_id, p.product_name, oi.quantity, oi.unit_price, (oi.quantity * oi.unit_price) AS item_total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.status(201).json({
      success: true,
      message: 'Item added to order successfully.',
      data: {
        ...updatedOrder[0],
        items: orderItems
      }
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rErr) {}
      connection.release();
    }
    next(error);
  }
};

/**
 * DELETE /api/orders/:id
 * Delete an order and its associated payments/shipments/items in a transaction
 */
const deleteOrder = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const orderId = parseInt(req.params.id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID. Must be a positive integer.' }
      });
    }

    const [existing] = await connection.execute(
      'SELECT order_id FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${orderId} not found.` }
      });
    }

    await connection.beginTransaction();

    await connection.execute('DELETE FROM payments WHERE order_id = ?', [orderId]);
    await connection.execute('DELETE FROM shipments WHERE order_id = ?', [orderId]);
    await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await connection.execute('DELETE FROM orders WHERE order_id = ?', [orderId]);

    await connection.commit();
    connection.release();

    res.status(200).json({
      success: true,
      message: `Order #${orderId} deleted successfully.`
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

/**
 * PUT /api/orders/:id/status
 * Update status of an existing order
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10);

    if (isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID. Must be a positive integer.' }
      });
    }

    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: `status is required and must be one of: ${validStatuses.join(', ')}.` }
      });
    }

    const [existing] = await pool.execute(
      'SELECT order_id, status FROM orders WHERE order_id = ?',
      [orderId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Order with ID ${orderId} not found.` }
      });
    }

    await pool.execute(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      [status, orderId]
    );

    res.status(200).json({
      success: true,
      message: `Order #${orderId} status updated to '${status}'.`,
      data: { order_id: orderId, status: status }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  addOrderItem,
  deleteOrder,
  updateOrderStatus
};
