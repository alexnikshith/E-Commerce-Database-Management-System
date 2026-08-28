const pool = require('../config/db');

/**
 * GET /api/products
 * Fetch all products with category and stock quantity
 */
const getProducts = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.brand,
        p.image_url,
        p.created_at,
        c.category_id,
        c.category_name,
        COALESCE(i.quantity, 0) AS stock_quantity
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      ORDER BY p.product_id ASC
    `;

    const [products] = await pool.query(query);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:id
 * Fetch single product by ID with stock and reviews
 */
const getProductById = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid product ID. Must be a positive integer.' }
      });
    }

    const productQuery = `
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.price,
        p.brand,
        p.image_url,
        p.created_at,
        c.category_id,
        c.category_name,
        COALESCE(i.quantity, 0) AS stock_quantity
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      WHERE p.product_id = ?
    `;

    const [products] = await pool.execute(productQuery, [productId]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Product with ID ${productId} not found.` }
      });
    }

    const reviewsQuery = `
      SELECT 
        r.review_id,
        r.rating,
        r.comment,
        r.review_date,
        u.user_id,
        u.name AS reviewer_name
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.product_id = ?
      ORDER BY r.review_date DESC
    `;

    const [reviews] = await pool.execute(reviewsQuery, [productId]);

    const productData = {
      ...products[0],
      reviews_count: reviews.length,
      reviews: reviews
    };

    res.status(200).json({
      success: true,
      data: productData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Create a new product and initialize stock in inventory
 */
const createProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { category_id, product_name, description, price, brand, image_url, initial_stock } = req.body;

    const catId = parseInt(category_id, 10);
    if (isNaN(catId) || catId <= 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: { message: 'category_id is required and must be a positive integer.' }
      });
    }

    if (!product_name || typeof product_name !== 'string' || product_name.trim().length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: { message: 'product_name is required.' }
      });
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: { message: 'price must be a positive number.' }
      });
    }

    const stock = initial_stock !== undefined ? parseInt(initial_stock, 10) : 0;
    if (isNaN(stock) || stock < 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: { message: 'initial_stock must be a non-negative integer.' }
      });
    }

    // Foreign key validation: category exists
    const [catCheck] = await connection.execute(
      'SELECT category_id FROM categories WHERE category_id = ?',
      [catId]
    );

    if (catCheck.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: { message: `Category with ID ${catId} does not exist.` }
      });
    }

    await connection.beginTransaction();

    const productInsert = `
      INSERT INTO products (category_id, product_name, description, price, brand, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [prodResult] = await connection.execute(productInsert, [
      catId,
      product_name.trim(),
      description ? description.trim() : null,
      numPrice,
      brand ? brand.trim() : null,
      image_url ? image_url.trim() : null
    ]);

    const newProductId = prodResult.insertId;

    const inventoryInsert = `
      INSERT INTO inventory (product_id, quantity)
      VALUES (?, ?)
    `;
    await connection.execute(inventoryInsert, [newProductId, stock]);

    await connection.commit();
    connection.release();

    const [newProduct] = await pool.execute(
      `SELECT p.product_id, p.product_name, p.description, p.price, p.brand, p.image_url, p.created_at, c.category_name, i.quantity AS stock_quantity
       FROM products p
       JOIN categories c ON p.category_id = c.category_id
       JOIN inventory i ON p.product_id = i.product_id
       WHERE p.product_id = ?`,
      [newProductId]
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: newProduct[0]
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

/**
 * PUT /api/products/:id
 * Update an existing product
 */
const updateProduct = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid product ID. Must be a positive integer.' }
      });
    }

    const [existingProd] = await pool.execute(
      'SELECT product_id, category_id, product_name, description, price, brand FROM products WHERE product_id = ?',
      [productId]
    );

    if (existingProd.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Product with ID ${productId} not found.` }
      });
    }

    const current = existingProd[0];
    const { category_id, product_name, description, price, brand } = req.body;

    let updatedCatId = current.category_id;
    if (category_id !== undefined) {
      updatedCatId = parseInt(category_id, 10);
      if (isNaN(updatedCatId) || updatedCatId <= 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid category_id. Must be a positive integer.' }
        });
      }

      const [catCheck] = await pool.execute(
        'SELECT category_id FROM categories WHERE category_id = ?',
        [updatedCatId]
      );
      if (catCheck.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: `Category with ID ${updatedCatId} does not exist.` }
        });
      }
    }

    let updatedPrice = current.price;
    if (price !== undefined) {
      updatedPrice = parseFloat(price);
      if (isNaN(updatedPrice) || updatedPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'price must be a positive number.' }
        });
      }
    }

    const updatedName = product_name !== undefined ? String(product_name).trim() : current.product_name;
    const updatedDesc = description !== undefined ? (description ? String(description).trim() : null) : current.description;
    const updatedBrand = brand !== undefined ? (brand ? String(brand).trim() : null) : current.brand;

    if (!updatedName || updatedName.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'product_name cannot be empty.' }
      });
    }

    const updateQuery = `
      UPDATE products
      SET category_id = ?, product_name = ?, description = ?, price = ?, brand = ?
      WHERE product_id = ?
    `;

    await pool.execute(updateQuery, [
      updatedCatId,
      updatedName,
      updatedDesc,
      updatedPrice,
      updatedBrand,
      productId
    ]);

    const [updatedProduct] = await pool.execute(
      `SELECT p.product_id, p.product_name, p.description, p.price, p.brand, p.created_at, c.category_name, COALESCE(i.quantity, 0) AS stock_quantity
       FROM products p
       JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN inventory i ON p.product_id = i.product_id
       WHERE p.product_id = ?`,
      [productId]
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updatedProduct[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products/:id/reviews
 * Add a review for a product
 */
const createProductReview = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid product ID. Must be a positive integer.' }
      });
    }

    const { user_id, rating, comment } = req.body;

    const userId = parseInt(user_id, 10);
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid user_id (positive integer) is required.' }
      });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        error: { message: 'rating is required and must be an integer between 1 and 5.' }
      });
    }

    // Verify product exists
    const [prodCheck] = await pool.execute(
      'SELECT product_id FROM products WHERE product_id = ?',
      [productId]
    );
    if (prodCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: `Product with ID ${productId} not found.` }
      });
    }

    // Verify user exists
    const [userCheck] = await pool.execute(
      'SELECT user_id FROM users WHERE user_id = ?',
      [userId]
    );
    if (userCheck.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: `User with ID ${userId} does not exist.` }
      });
    }

    const insertQuery = `
      INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.execute(insertQuery, [
        userId,
        productId,
        numRating,
        comment ? String(comment).trim() : null
      ]);

      const [newReview] = await pool.execute(
        `SELECT r.review_id, r.user_id, u.name AS reviewer_name, r.product_id, r.rating, r.comment, r.review_date
         FROM reviews r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.review_id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: 'Review created successfully.',
        data: newReview[0]
      });
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
        return res.status(409).json({
          success: false,
          error: { message: 'User has already submitted a review for this product.' }
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Delete a product and its associated inventory/reviews in a transaction
 */
const deleteProduct = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId) || productId <= 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid product ID. Must be a positive integer.' }
      });
    }

    const [existing] = await connection.execute(
      'SELECT product_id, product_name FROM products WHERE product_id = ?',
      [productId]
    );

    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        error: { message: `Product with ID ${productId} not found.` }
      });
    }

    await connection.beginTransaction();

    await connection.execute('DELETE FROM reviews WHERE product_id = ?', [productId]);
    await connection.execute('DELETE FROM inventory WHERE product_id = ?', [productId]);
    await connection.execute('DELETE FROM cart_items WHERE product_id = ?', [productId]);
    await connection.execute('DELETE FROM order_items WHERE product_id = ?', [productId]);
    await connection.execute('DELETE FROM products WHERE product_id = ?', [productId]);

    await connection.commit();
    connection.release();

    res.status(200).json({
      success: true,
      message: `Product '${existing[0].product_name}' (ID #${productId}) deleted successfully.`
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  createProductReview,
  deleteProduct
};
