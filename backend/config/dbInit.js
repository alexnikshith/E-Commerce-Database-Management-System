const pool = require('./db');

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Electronics', description: 'Electronic devices and accessories' },
  { id: 2, name: 'Clothing', description: 'Men and women clothing' },
  { id: 3, name: 'Books', description: 'Books and educational materials' },
  { id: 4, name: 'Home Appliances', description: 'Appliances for home use' },
  { id: 5, name: 'Sports', description: 'Sports equipment and accessories' }
];

const DEFAULT_PRODUCTS = [
  { id: 1, category_id: 1, name: 'iPhone 17', description: 'Latest Apple smartphone', price: 79999.00, brand: 'Apple', image_url: '/images/iphone17.jpg', stock: 50 },
  { id: 2, category_id: 1, name: 'Galaxy S26', description: 'Samsung flagship smartphone', price: 74999.00, brand: 'Samsung', image_url: '/images/galaxys26.jpg', stock: 40 },
  { id: 3, category_id: 1, name: 'WH-1000XM6 Headphones', description: 'Wireless noise cancelling headphones', price: 34999.00, brand: 'Sony', image_url: '/images/sony_headphones.jpg', stock: 75 },
  { id: 4, category_id: 2, name: 'Classic Cotton T-Shirt', description: 'Comfortable cotton t-shirt', price: 999.00, brand: 'Puma', image_url: '/images/cotton_tshirt.jpg', stock: 100 },
  { id: 5, category_id: 2, name: 'Running Shoes', description: 'Lightweight running shoes', price: 4999.00, brand: 'Nike', image_url: '/images/running_shoes.jpg', stock: 60 },
  { id: 6, category_id: 3, name: 'Clean Code', description: 'Programming best practices book', price: 899.00, brand: 'Robert C. Martin', image_url: '/images/clean_code.jpg', stock: 30 },
  { id: 7, category_id: 3, name: 'Database System Concepts', description: 'Database management textbook', price: 1299.00, brand: 'McGraw Hill', image_url: '/images/db_concepts.jpg', stock: 25 },
  { id: 8, category_id: 4, name: 'Air Fryer', description: 'Digital air fryer for home cooking', price: 5999.00, brand: 'Philips', image_url: '/images/air_fryer.jpg', stock: 45 },
  { id: 9, category_id: 4, name: 'Mixer Grinder', description: 'Multi-speed kitchen mixer grinder', price: 3499.00, brand: 'Prestige', image_url: '/images/mixer_grinder.jpg', stock: 35 },
  { id: 10, category_id: 5, name: 'Football', description: 'Professional size football', price: 1499.00, brand: 'Adidas', image_url: '/images/football.jpg', stock: 80 }
];

const DEFAULT_USERS = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul@gmail.com', password_hash: 'hash_rahul_123', phone: '9999999999' },
  { id: 2, name: 'Ananya Reddy', email: 'ananya@gmail.com', password_hash: 'hash_ananya_456', phone: '9876543211' },
  { id: 3, name: 'David Thomas', email: 'david@gmail.com', password_hash: 'hash_david_789', phone: '9876543212' },
  { id: 4, name: 'nicky', email: 'nicky@gmail.com', password_hash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', phone: '9999999999' },
  { id: 5, name: 'Nikshith Gurram', email: 'nikshith@gmail.com', password_hash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', phone: '9876543210' }
];


const DEFAULT_ORDERS = [
  { id: 1, user_id: 1, status: 'Confirmed', total_amount: 90896.00, order_date: '2026-08-27 14:04:10' },
  { id: 2, user_id: 2, status: 'Confirmed', total_amount: 4999.00, order_date: '2026-08-27 14:41:17' },
  { id: 3, user_id: 3, status: 'Confirmed', total_amount: 74999.00, order_date: '2026-08-27 14:52:52' },
  { id: 4, user_id: 4, status: 'Confirmed', total_amount: 90896.00, order_date: '2026-08-27 14:04:10' },
  { id: 5, user_id: 5, status: 'Confirmed', total_amount: 155897.00, order_date: '2026-08-28 10:15:00' }
];

const DEFAULT_ORDER_ITEMS = [
  { id: 1, order_id: 1, product_id: 1, quantity: 1, unit_price: 79999.00 },
  { id: 2, order_id: 1, product_id: 5, quantity: 2, unit_price: 4999.00 },
  { id: 3, order_id: 1, product_id: 6, quantity: 1, unit_price: 899.00 },
  { id: 4, order_id: 2, product_id: 5, quantity: 1, unit_price: 4999.00 },
  { id: 5, order_id: 3, product_id: 2, quantity: 1, unit_price: 74999.00 },
  { id: 6, order_id: 4, product_id: 1, quantity: 1, unit_price: 79999.00 },
  { id: 7, order_id: 5, product_id: 1, quantity: 1, unit_price: 79999.00 },
  { id: 8, order_id: 5, product_id: 2, quantity: 1, unit_price: 74999.00 },
  { id: 9, order_id: 5, product_id: 6, quantity: 1, unit_price: 899.00 }
];

const DEFAULT_PAYMENTS = [
  { id: 1, order_id: 1, method: 'UPI', status: 'Paid', amount: 90896.00 },
  { id: 2, order_id: 3, method: 'UPI', status: 'Paid', amount: 74999.00 },
  { id: 3, order_id: 5, method: 'UPI', status: 'Paid', amount: 155897.00 }
];

/**
 * Seed default catalog items, inventory stock, and historical revenue orders
 */
async function seedDefaultCatalogData() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Seed Categories
    for (const cat of DEFAULT_CATEGORIES) {
      await connection.query(
        `INSERT INTO categories (category_id, category_name, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE category_name = VALUES(category_name), description = VALUES(description)`,
        [cat.id, cat.name, cat.description]
      );
    }

    // 2. Seed Products & Inventory
    for (const prod of DEFAULT_PRODUCTS) {
      await connection.query(
        `INSERT INTO products (product_id, category_id, product_name, description, price, brand, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), description = VALUES(description), price = VALUES(price), brand = VALUES(brand), image_url = VALUES(image_url)`,
        [prod.id, prod.category_id, prod.name, prod.description, prod.price, prod.brand, prod.image_url]
      );

      await connection.query(
        `INSERT INTO inventory (product_id, quantity)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE quantity = IF(quantity <= 0, VALUES(quantity), quantity)`,
        [prod.id, prod.stock]
      );
    }

    // 3. Seed Default Users
    for (const user of DEFAULT_USERS) {
      await connection.query(
        `INSERT INTO users (user_id, name, email, password_hash, phone)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), phone = VALUES(phone)`,
        [user.id, user.name, user.email, user.password_hash, user.phone]
      );
    }

    // 4. Seed Default Orders
    for (const o of DEFAULT_ORDERS) {
      await connection.query(
        `INSERT INTO orders (order_id, user_id, status, total_amount, order_date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), total_amount = VALUES(total_amount)`,
        [o.id, o.user_id, o.status, o.total_amount, o.order_date]
      );
    }

    // 5. Seed Order Items
    for (const oi of DEFAULT_ORDER_ITEMS) {
      await connection.query(
        `INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), unit_price = VALUES(unit_price)`,
        [oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price]
      );
    }

    // 6. Seed Payments
    for (const p of DEFAULT_PAYMENTS) {
      await connection.query(
        `INSERT INTO payments (payment_id, order_id, payment_method, payment_status, amount)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE payment_method = VALUES(payment_method), amount = VALUES(amount)`,
        [p.id, p.order_id, p.method, p.status, p.amount]
      );
    }

    await connection.commit();
    connection.release();
    console.log('Successfully verified and seeded default catalog, inventory stock, and historical orders.');
    return { success: true, count: DEFAULT_PRODUCTS.length };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error seeding default catalog data:', error.message);
    throw error;
  }
}

/**
 * Ensure Database Schema & Views Exist
 */
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();

    // Table creation SQLs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(15),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id INT PRIMARY KEY AUTO_INCREMENT,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INT PRIMARY KEY AUTO_INCREMENT,
        category_id INT NOT NULL,
        product_name VARCHAR(150) NOT NULL,
        description VARCHAR(500),
        price DECIMAL(10,2) NOT NULL,
        brand VARCHAR(100),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        inventory_id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL UNIQUE,
        quantity INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(30) NOT NULL DEFAULT 'Pending',
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        UNIQUE (order_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        rating INT NOT NULL,
        comment VARCHAR(500),
        review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        UNIQUE (user_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL UNIQUE,
        payment_method VARCHAR(30) NOT NULL,
        payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
        amount DECIMAL(10,2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        shipment_id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL UNIQUE,
        carrier VARCHAR(100),
        tracking_number VARCHAR(100) UNIQUE,
        shipment_status VARCHAR(30) NOT NULL DEFAULT 'Processing',
        shipped_date DATE,
        delivered_date DATE,
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Views
    await connection.query(`
      CREATE OR REPLACE VIEW product_inventory_view AS
      SELECT p.product_id, p.product_name, c.category_name, p.price, COALESCE(i.quantity, 0) AS stock_quantity
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      LEFT JOIN inventory i ON p.product_id = i.product_id;
    `);

    await connection.query(`
      CREATE OR REPLACE VIEW product_sales_summary AS
      SELECT p.product_id, p.product_name, COALESCE(SUM(oi.quantity), 0) AS units_sold, COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      GROUP BY p.product_id, p.product_name;
    `);

    // Check if products count is 0 or orders count is 0
    const [prodCheck] = await connection.query('SELECT COUNT(*) AS count FROM products');
    const [ordCheck] = await connection.query('SELECT COUNT(*) AS count FROM orders');
    connection.release();

    if (prodCheck[0].count === 0 || ordCheck[0].count === 0) {
      console.log('Catalog or historical orders missing. Triggering automatic database seed...');
      await seedDefaultCatalogData();
    } else {
      console.log(`Database initialized cleanly with ${prodCheck[0].count} active products and ${ordCheck[0].count} historical orders.`);
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
}

module.exports = {
  initializeDatabase,
  seedDefaultCatalogData
};
