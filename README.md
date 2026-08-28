# E-Commerce Database Management System & REST API

An enterprise-grade relational database management system and Node.js REST API service built for an E-Commerce platform using **MySQL 8.0**, **Express.js**, and **mysql2**.

---

### 🌐 Live Production Deployment URLs
- **🛒 Customer Shopping Storefront**: [https://nicks-ecommerce-db-system.vercel.app](https://nicks-ecommerce-db-system.vercel.app)
- **⚙️ Admin Management Control Panel**: [https://nicks-ecommerce-db-system.vercel.app/admin](https://nicks-ecommerce-db-system.vercel.app/admin)

---

## 1. Project Overview
This project delivers a complete database-backed RESTful backend architecture for an e-commerce platform. It manages user accounts, user addresses, category taxonomies, product catalogs, inventory stock, shopping carts, purchase orders, order line items, payments, shipment tracking, and product reviews. The system incorporates database-level business logic (triggers, stored procedures, deterministic functions, and views) combined with an Express.js API layer featuring ACID-compliant transactions and parameterized SQL queries.

---

## 2. Problem Statement
Modern e-commerce platforms require real-time stock inventory management, data consistency across concurrent order placements, protection against invalid transactions, and business analytics. Without database-level constraints and transactional safeguards, applications face race conditions (such as overselling out-of-stock items), orphan records, unvalidated user inputs, and SQL injection security vulnerabilities.

---

## 3. Objectives
- **ACID Integrity**: Enforce strict relational integrity, primary/foreign key constraints, and multi-step transaction rollbacks.
- **Automated Stock Protection**: Prevent negative stock and overselling using database-level `BEFORE INSERT` and `AFTER INSERT` triggers on `order_items`.
- **Modular Backend Architecture**: Implement a clean MVC Express REST API (`config/`, `controllers/`, `routes/`, `middleware/`).
- **Parameterized SQL Security**: Prevent SQL injection by using parameterized queries (`?`) across all endpoints.
- **Analytics & BI Reporting**: Expose dedicated admin analytics endpoints for sales performance, revenue metrics, customer spending, and stock alert monitoring.

---

## 4. Technologies Used
- **Database Engine**: MySQL 8.0 (Tested on MySQL 8.0.45 Win64)
- **Database Modeling**: MySQL Workbench (`.mwb`)
- **Runtime Environment**: Node.js (v20.12.2) & npm (10.8.1)
- **Web Framework**: Express.js (`^5.2.1`)
- **Database Client**: `mysql2` (`^3.24.2`) with Promise API
- **Environment Management**: `dotenv` (`^17.4.2`)
- **Middleware**: `cors` (`^2.8.6`)

---

## 5. Database Architecture
The database layer (`ecommerce_db`) consists of **12 relational tables**, **2 views**, **2 stored procedures**, **1 stored function**, and **2 database triggers**.

- **Detailed Schema Specification**: [`documentation/DATABASE_DESIGN.md`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/documentation/DATABASE_DESIGN.md)
- **Analytics & BI Specification**: [`reports/ANALYTICS_REPORT.md`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/reports/ANALYTICS_REPORT.md)

---

## 6. ER Diagram & Model
- **Workbench ER Model**: [`er-diagram/ecommerce_erd.mwb`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/er-diagram/ecommerce_erd.mwb)
- **SQL Backup Dump**: [`database/ecommerce_db_backup.sql`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/database/ecommerce_db_backup.sql)

```
                       ┌──────────────┐
                       │  categories  │
                       └──────┬───────┘
                              │ 1
                              │ N
 ┌─────────────┐ 1   N ┌──────┴───────┐ 1   1 ┌─────────────┐
 │    users    ├───────┤   products   ├───────┤  inventory  │
 └──────┬──────┘       └──────┬───────┘       └─────────────┘
        │ 1                   │ 1
        │ N                   │ N
 ┌──────┴───────┐      ┌──────┴───────┐
 │   addresses  │      │   reviews    │
 └──────────────┘      └──────────────┘
        │ 1                   │
        │ 1                   │
 ┌──────┴───────┐      ┌──────┴───────┐
 │    carts     │      │  order_items │
 └──────┬───────┘      └──────┬───────┘
        │ 1                   │ N
        │ N                   │ 1
 ┌──────┴───────┐      ┌──────┴───────┐
 │  cart_items  │      │    orders    │
 └──────────────┘      └──────┬───────┘
                              │ 1
                 ┌────────────┼────────────┐
                 │ 1                       │ 1
          ┌──────┴───────┐          ┌──────┴───────┐
          │   payments   │          │   shipments  │
          └──────────────┘          └──────────────┘
```

---

## 7. Table Descriptions
1. **`users`**: Customer user profiles (`user_id`, `name`, `email`, `password_hash`, `phone`, `created_at`).
2. **`categories`**: Product taxonomy (`category_id`, `category_name`, `description`).
3. **`products`**: Product catalog (`product_id`, `category_id`, `product_name`, `description`, `price`, `brand`, `created_at`).
4. **`inventory`**: Stock levels (`inventory_id`, `product_id`, `quantity`, `updated_at`).
5. **`addresses`**: User shipping/billing addresses (`address_id`, `user_id`, `address_type`, `street`, `city`, `state`, `pincode`).
6. **`carts`**: Active shopping cart headers (`cart_id`, `user_id`, `created_at`).
7. **`cart_items`**: Shopping cart line items (`cart_item_id`, `cart_id`, `product_id`, `quantity`).
8. **`orders`**: Purchase orders (`order_id`, `user_id`, `order_date`, `status`, `total_amount`).
9. **`order_items`**: Order line items (`order_item_id`, `order_id`, `product_id`, `quantity`, `unit_price`).
10. **`payments`**: Payment processing (`payment_id`, `order_id`, `payment_method`, `payment_status`, `amount`, `payment_date`).
11. **`shipments`**: Shipping fulfillment & tracking (`shipment_id`, `order_id`, `carrier`, `tracking_number`, `shipment_status`, `shipped_date`, `delivered_date`).
12. **`reviews`**: Product ratings & comments (`review_id`, `user_id`, `product_id`, `rating`, `comment`, `review_date`).

---

## 8. Relationships
- **One-to-Many (1:N)**:
  - `users` (1) ── (N) `addresses`
  - `users` (1) ── (N) `orders`
  - `users` (1) ── (N) `reviews`
  - `categories` (1) ── (N) `products`
  - `carts` (1) ── (N) `cart_items`
  - `orders` (1) ── (N) `order_items`
  - `products` (1) ── (N) `reviews`
  - `products` (1) ── (N) `cart_items`
  - `products` (1) ── (N) `order_items`
- **One-to-One (1:1)**:
  - `users` (1) ── (1) `carts`
  - `products` (1) ── (1) `inventory`
  - `orders` (1) ── (1) `payments`
  - `orders` (1) ── (1) `shipments`

---

## 9. Primary Keys & Foreign Keys
- **`products.category_id`** -> `categories(category_id)`
- **`inventory.product_id`** -> `products(product_id)` (`UNIQUE`)
- **`addresses.user_id`** -> `users(user_id)`
- **`carts.user_id`** -> `users(user_id)` (`UNIQUE`)
- **`cart_items.cart_id`** -> `carts(cart_id)`, **`cart_items.product_id`** -> `products(product_id)`
- **`orders.user_id`** -> `users(user_id)`
- **`order_items.order_id`** -> `orders(order_id)`, **`order_items.product_id`** -> `products(product_id)`
- **`payments.order_id`** -> `orders(order_id)` (`UNIQUE`)
- **`shipments.order_id`** -> `orders(order_id)` (`UNIQUE`)
- **`reviews.user_id`** -> `users(user_id)`, **`reviews.product_id`** -> `products(product_id)`

---

## 10. Database Views
1. **`product_inventory_view`**: Combines products, categories, and real-time inventory stock levels.
2. **`product_sales_summary`**: Aggregates total units sold and total revenue per product.

---

## 11. Stored Procedures
1. **`get_customer_orders(IN p_user_id INT)`**: Fetches complete order history for a specific customer.
2. **`get_product_sales(IN p_product_id INT)`**: Calculates aggregate units sold and total revenue generated for a specific product.

---

## 12. Stored Functions
1. **`calculate_order_total(p_order_id INT) RETURNS DECIMAL(10,2)`**: Calculates the subtotal of all items inside a purchase order (`SUM(quantity * unit_price)`).

---

## 13. Database Triggers
1. **`check_inventory_before_order`** (`BEFORE INSERT ON order_items`): Validates stock quantity before placing an item. Signals `SQLSTATE '45000'` if quantity <= 0, inventory is missing, or requested quantity > available stock.
2. **`reduce_inventory_after_order_item`** (`AFTER INSERT ON order_items`): Automatically updates `inventory` by deducting ordered quantity upon successful insertion.

---

## 14. Database Transactions
Multi-step operations (such as order creation in `POST /api/orders` and product registration in `POST /api/products`) run inside MySQL transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`). If any step or trigger fails, the entire transaction rolls back automatically.

---

## 15. Database Integrity Constraints
- **Primary Keys (`PRIMARY KEY`)**: Surrogate auto-increment integer IDs on all 12 tables.
- **Unique Constraints (`UNIQUE`)**: `users.email`, `categories.category_name`, `inventory.product_id`, `carts.user_id`, `payments.order_id`, `shipments.order_id`, `shipments.tracking_number`, `cart_items(cart_id, product_id)`, `order_items(order_id, product_id)`, `reviews(user_id, product_id)`.
- **Check Constraints (`CHECK`)**: `reviews.rating BETWEEN 1 AND 5`.
- **Foreign Keys (`FOREIGN KEY`)**: Referenced integrity with default restrict enforcement.

---

## 16. Analytics & SQL Queries
The database features analytics queries for business intelligence:
- Platform Admin Summary (total users, total products, total orders, total revenue, confirmed orders, low-stock count)
- Financial Revenue & Average Order Value (AOV)
- Top-Selling Products by Revenue
- Customer Spending Leaderboard
- Category Revenue & Units Sold Performance
- Inventory Alert Monitoring (< 20 threshold)

See [`reports/ANALYTICS_REPORT.md`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/reports/ANALYTICS_REPORT.md) for full report details.

---

## 17. REST API Architecture
Built with Express.js following MVC pattern:
```
backend/
├── config/
│   └── db.js                 # mysql2/promise Connection Pool
├── controllers/
│   ├── adminController.js     # Admin & Analytics Endpoints
│   ├── categoryController.js  # Category Endpoints
│   ├── healthController.js    # System & Database Health Check
│   ├── inventoryController.js # Stock Inventory Endpoints
│   ├── orderController.js     # Orders & Transactions Endpoints
│   ├── productController.js   # Products & Reviews Endpoints
│   └── userController.js      # User Account Endpoints
├── middleware/
│   └── errorHandler.js       # Centralized Error Middleware
├── routes/
│   ├── adminRoutes.js
│   ├── categoryRoutes.js
│   ├── healthRoutes.js
│   ├── inventoryRoutes.js
│   ├── orderRoutes.js
│   ├── productRoutes.js
│   └── userRoutes.js
├── .env                      # Local Environment Variables (Git-Ignored)
├── .env.example              # Environment Variable Template
├── package.json              # Dependencies & Scripts
├── server.js                 # Express Application Entrypoint
├── test-suite.js             # Unified 19-Case Test Suite
├── test-api.js               # Read-Only API Test Script
└── test-write-api.js         # Write API Test Script
```

See [`documentation/API_DOCUMENTATION.md`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/documentation/API_DOCUMENTATION.md) for full endpoint specifications.

---

## 18. API Endpoint Table

| HTTP Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | System health check (`SELECT 1`) |
| `GET` | `/api/products` | Fetch product catalog with categories & stock |
| `GET` | `/api/products/:id` | Fetch product details & reviews by ID |
| `POST` | `/api/products` | Create product and initialize inventory stock |
| `PUT` | `/api/products/:id` | Update product profile |
| `POST` | `/api/products/:id/reviews` | Add product review (1–5 rating check) |
| `GET` | `/api/categories` | List categories with product count |
| `GET` | `/api/categories/:id/products` | List products in a category |
| `GET` | `/api/inventory` | List product stock levels |
| `GET` | `/api/orders` | List purchase orders summary |
| `GET` | `/api/orders/:id` | Get detailed purchase order with items |
| `POST` | `/api/orders` | Multi-item transactional order creation |
| `POST` | `/api/orders/:id/items` | Add item to order in a transaction |
| `POST` | `/api/users` | Register user profile (SHA-256 password hash) |
| `GET` | `/api/users/:id/orders` | List customer order history |
| `GET` | `/api/admin/dashboard` | Admin dashboard overview metrics |
| `GET` | `/api/admin/revenue` | Revenue & Average Order Value report |
| `GET` | `/api/admin/top-products` | Top selling products ranking |
| `GET` | `/api/admin/customers` | Customer spending breakdown |
| `GET` | `/api/admin/low-stock` | Low-stock inventory alert report |
| `GET` | `/api/admin/category-performance` | Category sales & revenue report |
| `GET` | `/api/admin/orders-by-status` | Order distribution by status |

---

## 19. Installation Instructions

1. **Clone or Extract Project Workspace**:
   ```bash
   cd Ecommerce-Database-Management-System
   ```
2. **Navigate to Backend Directory**:
   ```bash
   cd backend
   ```
3. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```

---

## 20. Environment Variable Setup

1. Copy `.env.example` to `.env` inside `backend/`:
   ```bash
   cp .env.example .env
   ```
2. Edit `backend/.env` with your local MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_root_password
   DB_NAME=ecommerce_db
   PORT=5000
   ```

---

## 21. How to Run the Backend Server

- **Start Server (Production Mode)**:
  ```bash
  npm start
  ```
- **Start Server (Development Mode with Auto-Reload)**:
  ```bash
  npm run dev
  ```

---

## 22. How to Restore MySQL Database from Backup

Restore the database using MySQL CLI in Terminal or PowerShell:

### Option A: MySQL Command Line (Recommended)
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ecommerce_db;"
mysql -u root -p ecommerce_db < database/ecommerce_db_backup.sql
```

### Option B: MySQL Workbench
1. Open MySQL Workbench and connect to Local Instance.
2. Go to **Server** -> **Data Import**.
3. Select **Import from Self-Contained File** and choose `database/ecommerce_db_backup.sql`.
4. Set Target Schema to `ecommerce_db` and click **Start Import**.

---

## 23. Testing & Verification

Run the unified 19-case test suite:
```bash
cd backend
npm test
```

See [`reports/TEST_EXECUTION_REPORT.md`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/reports/TEST_EXECUTION_REPORT.md) for full execution logs and results.

---

## 24. Future Improvements
- **Authentication & JWT**: Add JSON Web Token (JWT) authentication middleware for user sessions.
- **Payment Gateway Integration**: Integrate Stripe or Razorpay webhooks for live payment processing.
- **Pagination & Search**: Implement page-based pagination (`?page=1&limit=20`) and full-text search filters on product endpoints.
- **Frontend Dashboard**: Build a React.js or Next.js user storefront and admin dashboard web UI.
