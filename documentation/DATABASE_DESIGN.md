# E-Commerce Database Management System - Database Design Specification

## 1. Executive Summary & Overview
The `ecommerce_db` database is a production-ready relational database engineered on **MySQL 8.0.45**. It provides a robust, ACID-compliant backend data storage layer for an e-commerce platform handling customer user accounts, addresses, category taxonomies, product catalogs, stock inventory, user shopping carts, purchase orders, order line items, payment processing, shipping fulfillment, and customer product reviews.

---

## 2. ER Diagram & Architectural Layout

- **Model File**: [`er-diagram/ecommerce_erd.mwb`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/er-diagram/ecommerce_erd.mwb)
- **Backup Script**: [`database/ecommerce_db_backup.sql`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/database/ecommerce_db_backup.sql)
- **SQL Source Script**: [`database/ecommerce.sql`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/database/ecommerce.sql)

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

## 3. Table Specifications (12 Tables)

### 3.1. `users`
Stores registered customer accounts and authentication credentials.
- `user_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `name` (`VARCHAR(100)`, `NOT NULL`)
- `email` (`VARCHAR(150)`, `UNIQUE`, `NOT NULL`)
- `password_hash` (`VARCHAR(255)`, `NOT NULL`)
- `phone` (`VARCHAR(15)`, `DEFAULT NULL`)
- `created_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)

### 3.2. `categories`
Hierarchical or grouped product classification taxonomy.
- `category_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `category_name` (`VARCHAR(100)`, `UNIQUE`, `NOT NULL`)
- `description` (`VARCHAR(255)`, `DEFAULT NULL`)

### 3.3. `products`
Product catalog items.
- `product_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `category_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `categories(category_id)`)
- `product_name` (`VARCHAR(150)`, `NOT NULL`, `INDEX: idx_product_name`)
- `description` (`VARCHAR(500)`, `DEFAULT NULL`)
- `price` (`DECIMAL(10,2)`, `NOT NULL`)
- `brand` (`VARCHAR(100)`, `DEFAULT NULL`)
- `created_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)

### 3.4. `inventory`
Real-time stock quantities per product.
- `inventory_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `product_id` (`INT`, `UNIQUE`, `NOT NULL`, `FOREIGN KEY` -> `products(product_id)`)
- `quantity` (`INT`, `NOT NULL`, `DEFAULT 0`)
- `updated_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)

### 3.5. `addresses`
Shipping and billing addresses for users.
- `address_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `user_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `users(user_id)`)
- `address_type` (`VARCHAR(20)`, `DEFAULT 'Home'`)
- `street` (`VARCHAR(255)`, `NOT NULL`)
- `city` (`VARCHAR(100)`, `NOT NULL`)
- `state` (`VARCHAR(100)`, `NOT NULL`)
- `pincode` (`VARCHAR(10)`, `NOT NULL`)

### 3.6. `carts`
Shopping cart header for active user sessions.
- `cart_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `user_id` (`INT`, `UNIQUE`, `NOT NULL`, `FOREIGN KEY` -> `users(user_id)`)
- `created_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)

### 3.7. `cart_items`
Line items stored in shopping carts.
- `cart_item_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `cart_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `carts(cart_id)`)
- `product_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `products(product_id)`)
- `quantity` (`INT`, `NOT NULL`, `DEFAULT 1`)
- **Constraint**: `UNIQUE (cart_id, product_id)`

### 3.8. `orders`
Purchase order records.
- `order_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `user_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `users(user_id)`, `INDEX: idx_orders_user`)
- `order_date` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`, `INDEX: idx_order_date`)
- `status` (`VARCHAR(30)`, `NOT NULL`, `DEFAULT 'Pending'`)
- `total_amount` (`DECIMAL(10,2)`, `NOT NULL`, `DEFAULT 0.00`)

### 3.9. `order_items`
Individual line items inside purchase orders.
- `order_item_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `order_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `orders(order_id)`)
- `product_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `products(product_id)`, `INDEX: idx_order_items_product`)
- `quantity` (`INT`, `NOT NULL`)
- `unit_price` (`DECIMAL(10,2)`, `NOT NULL`)
- **Constraint**: `UNIQUE (order_id, product_id)`

### 3.10. `payments`
Payment transaction processing for orders.
- `payment_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `order_id` (`INT`, `UNIQUE`, `NOT NULL`, `FOREIGN KEY` -> `orders(order_id)`)
- `payment_method` (`VARCHAR(30)`, `NOT NULL`)
- `payment_status` (`VARCHAR(30)`, `NOT NULL`, `DEFAULT 'Pending'`)
- `amount` (`DECIMAL(10,2)`, `NOT NULL`)
- `payment_date` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)

### 3.11. `shipments`
Shipping and carrier tracking details for orders.
- `shipment_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `order_id` (`INT`, `UNIQUE`, `NOT NULL`, `FOREIGN KEY` -> `orders(order_id)`)
- `carrier` (`VARCHAR(100)`, `DEFAULT NULL`)
- `tracking_number` (`VARCHAR(100)`, `UNIQUE`, `DEFAULT NULL`)
- `shipment_status` (`VARCHAR(30)`, `NOT NULL`, `DEFAULT 'Processing'`)
- `shipped_date` (`DATE`, `DEFAULT NULL`)
- `delivered_date` (`DATE`, `DEFAULT NULL`)

### 3.12. `reviews`
Product ratings and written user feedback.
- `review_id` (`INT`, `PRIMARY KEY`, `AUTO_INCREMENT`)
- `user_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `users(user_id)`)
- `product_id` (`INT`, `NOT NULL`, `FOREIGN KEY` -> `products(product_id)`)
- `rating` (`INT`, `NOT NULL`)
- `comment` (`VARCHAR(500)`, `DEFAULT NULL`)
- `review_date` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)
- **Constraints**: `CHECK (rating BETWEEN 1 AND 5)`, `UNIQUE (user_id, product_id)`

---

## 4. Views (2 Views)

### 4.1. `product_inventory_view`
```sql
CREATE VIEW product_inventory_view AS
SELECT 
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    i.quantity AS stock_quantity
FROM products p
JOIN categories c ON p.category_id = c.category_id
JOIN inventory i ON p.product_id = i.product_id;
```

### 4.2. `product_sales_summary`
```sql
CREATE VIEW product_sales_summary AS
SELECT 
    p.product_id,
    p.product_name,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name;
```

---

## 5. Stored Procedures (2 Procedures)

### 5.1. `get_customer_orders(IN p_user_id INT)`
```sql
DELIMITER //
CREATE PROCEDURE get_customer_orders(IN p_user_id INT)
BEGIN
    SELECT 
        o.order_id,
        o.order_date,
        o.status,
        o.total_amount
    FROM orders o
    WHERE o.user_id = p_user_id
    ORDER BY o.order_date DESC;
END //
DELIMITER ;
```

### 5.2. `get_product_sales(IN p_product_id INT)`
```sql
DELIMITER //
CREATE PROCEDURE get_product_sales(IN p_product_id INT)
BEGIN
    SELECT 
        p.product_id,
        p.product_name,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
    FROM products p
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    WHERE p.product_id = p_product_id
    GROUP BY p.product_id, p.product_name;
END //
DELIMITER ;
```

---

## 6. Stored Functions (1 Function)

### 6.1. `calculate_order_total(p_order_id INT) RETURNS DECIMAL(10,2)`
```sql
DELIMITER //
CREATE FUNCTION calculate_order_total(p_order_id INT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE total DECIMAL(10,2);
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    INTO total
    FROM order_items
    WHERE order_id = p_order_id;
    RETURN total;
END //
DELIMITER ;
```

---

## 7. Triggers (2 Triggers)

### 7.1. `check_inventory_before_order` (`BEFORE INSERT ON order_items`)
Prevents order placement if inventory is missing, quantity is non-positive, or requested quantity exceeds available stock.
```sql
DELIMITER //
CREATE TRIGGER check_inventory_before_order
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
    DECLARE available_stock INT;
    SELECT quantity INTO available_stock
    FROM inventory
    WHERE product_id = NEW.product_id;

    IF available_stock IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Product does not have inventory';
    END IF;

    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Order quantity must be greater than zero';
    END IF;

    IF NEW.quantity > available_stock THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient inventory';
    END IF;
END //
DELIMITER ;
```

### 7.2. `reduce_inventory_after_order_item` (`AFTER INSERT ON order_items`)
Automatically decrements inventory stock level upon successful insertion into `order_items`.
```sql
DELIMITER //
CREATE TRIGGER reduce_inventory_after_order_item
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE inventory
    SET quantity = quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
END //
DELIMITER ;
```
