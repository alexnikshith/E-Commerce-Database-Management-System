CREATE DATABASE ecommerce_db;
USE ecommerce_db;
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users (name, email, password_hash, phone)
VALUES
('Rahul Sharma', 'rahul@gmail.com', 'hash_rahul_123', '9876543210'),
('Ananya Reddy', 'ananya@gmail.com', 'hash_ananya_456', '9876543211'),
('David Thomas', 'david@gmail.com', 'hash_david_789', '9876543212');
SELECT * FROM users;
select name , email from users;
SELECT * FROM users
WHERE name = 'Rahul Sharma';

UPDATE users
SET phone = '9999999999'
WHERE user_id = 1;

select * from users;

INSERT INTO users (name, email, password_hash, phone)
VALUES ('Test User', 'test@gmail.com', 'test_hash', '9000000000');
select * from users;

delete from users where email = "test@gmail.com";
select * from users;

CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO categories (category_name, description)
VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Men and women clothing'),
('Books', 'Books and educational materials'),
('Home Appliances', 'Appliances for home use'),
('Sports', 'Sports equipment and accessories');

SELECT * FROM categories;
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    brand VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
);

INSERT INTO products
(category_id, product_name, description, price, brand)
VALUES
(1, 'iPhone 17', 'Latest Apple smartphone', 79999.00, 'Apple'),
(1, 'Galaxy S26', 'Samsung flagship smartphone', 74999.00, 'Samsung'),
(1, 'WH-1000XM6 Headphones', 'Wireless noise cancelling headphones', 34999.00, 'Sony'),
(2, 'Classic Cotton T-Shirt', 'Comfortable cotton t-shirt', 999.00, 'Puma'),
(2, 'Running Shoes', 'Lightweight running shoes', 4999.00, 'Nike'),
(3, 'Clean Code', 'Programming best practices book', 899.00, 'Robert C. Martin'),
(3, 'Database System Concepts', 'Database management textbook', 1299.00, 'McGraw Hill'),
(4, 'Air Fryer', 'Digital air fryer for home cooking', 5999.00, 'Philips'),
(4, 'Mixer Grinder', 'Multi-speed kitchen mixer grinder', 3499.00, 'Prestige'),
(5, 'Football', 'Professional size football', 1499.00, 'Adidas');

select * from products;

SELECT p.product_id,p.product_name,p.price,c.category_name FROM products p
JOIN categories c ON p.category_id = c.category_id;


CREATE TABLE inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);

INSERT INTO inventory (product_id, quantity)
VALUES
(1, 50),
(2, 40),
(3, 75),
(4, 100),
(5, 60),
(6, 30),
(7, 25),
(8, 45),
(9, 35),
(10, 80);

SELECT * FROM inventory;


select p.product_id , p.product_name , p.price , i.quantity from products p
join inventory i on p.product_id = i.product_id
order by p.product_id;


CREATE TABLE addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    address_type VARCHAR(20) DEFAULT 'Home',
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

INSERT INTO addresses
(user_id, address_type, street, city, state, pincode)
VALUES
(1, 'Home', '12 MG Road', 'Hyderabad', 'Telangana', '500001'),
(1, 'College', '45 University Road', 'Coimbatore', 'Tamil Nadu', '641001'),
(2, 'Home', '78 Lake View Road', 'Bengaluru', 'Karnataka', '560001'),
(3, 'Home', '21 Park Street', 'Chennai', 'Tamil Nadu', '600001');


select * from addresses

SELECT
    u.user_id,
    u.name,
    a.address_type,
    a.street,
    a.city,
    a.state,
    a.pincode
FROM users u
JOIN addresses a
    ON u.user_id = a.user_id
ORDER BY u.user_id;


CREATE TABLE carts (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);



CREATE TABLE cart_items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,

    FOREIGN KEY (cart_id)
        REFERENCES carts(cart_id),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    UNIQUE (cart_id, product_id)
);


INSERT INTO carts (user_id)
VALUES
(1),
(2),
(3);


INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES
(1, 1, 1),
(1, 5, 2),
(1, 6, 1);



SELECT
    u.name,
    p.product_name,
    p.price,
    ci.quantity,
    (p.price * ci.quantity) AS item_total
FROM users u
JOIN carts c
    ON u.user_id = c.user_id
JOIN cart_items ci
    ON c.cart_id = ci.cart_id
JOIN products p
    ON ci.product_id = p.product_id
WHERE u.user_id = 1;




CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);


INSERT INTO orders (user_id, status, total_amount)
VALUES
(1, 'Confirmed', 90896.00);


CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    UNIQUE (order_id, product_id)
);


INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(1, 1, 1, 79999.00),
(1, 5, 2, 4999.00),
(1, 6, 1, 899.00);


select * from orders;

select * from order_items;

SELECT
    o.order_id,
    u.name,
    p.product_name,
    oi.quantity,
    oi.unit_price,
    (oi.quantity * oi.unit_price) AS item_total,
    o.status
FROM orders o
JOIN users u
    ON o.user_id = u.user_id
JOIN order_items oi
    ON o.order_id = oi.order_id
JOIN products p
    ON oi.product_id = p.product_id
WHERE o.order_id = 1;



CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE,
    payment_method VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);

INSERT INTO payments
(order_id, payment_method, payment_status, amount)
VALUES
(1, 'UPI', 'Paid', 90896.00);

SELECT * FROM payments;


CREATE TABLE shipments (
    shipment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL UNIQUE,
    carrier VARCHAR(100),
    tracking_number VARCHAR(100) UNIQUE,
    shipment_status VARCHAR(30) NOT NULL DEFAULT 'Processing',
    shipped_date DATE,
    delivered_date DATE,

    FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
);




INSERT INTO shipments
(order_id, carrier, tracking_number, shipment_status, shipped_date)
VALUES
(1, 'India Post', 'EM123456789IN', 'Shipped', '2026-08-27');


SELECT * FROM shipments;


SELECT
    o.order_id,
    u.name,
    o.total_amount,
    o.status AS order_status,
    p.payment_method,
    p.payment_status,
    s.carrier,
    s.tracking_number,
    s.shipment_status
FROM orders o
JOIN users u
    ON o.user_id = u.user_id
LEFT JOIN payments p
    ON o.order_id = p.order_id
LEFT JOIN shipments s
    ON o.order_id = s.order_id
WHERE o.order_id = 1;


CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    rating INT NOT NULL,
    comment VARCHAR(500),
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CHECK (rating BETWEEN 1 AND 5),

    UNIQUE (user_id, product_id)
);


INSERT INTO reviews
(user_id, product_id, rating, comment)
VALUES
(1, 1, 5, 'Excellent phone and great performance!');


select * from reviews;

-- Count our users
SELECT COUNT(*) AS total_users
FROM users;

-- Count our products
SELECT COUNT(*) AS total_products
FROM products;

-- Find the average product price
SELECT AVG(price) AS average_price
FROM products;



-- Find the cheapest and most expensive product
SELECT
    MIN(price) AS cheapest_product,
    MAX(price) AS most_expensive_product
FROM products;

-- How many products are in each category?
SELECT
    c.category_name,
    COUNT(p.product_id) AS product_count
FROM categories c
LEFT JOIN products p
    ON c.category_id = p.category_id
GROUP BY c.category_id, c.category_name;


-- total inventory.
SELECT SUM(quantity) AS total_units_in_stock
FROM inventory;

-- Inventory by product
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
ORDER BY i.quantity DESC;

-- Find low-stock products
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE i.quantity < 40
ORDER BY i.quantity;



-- Show categories containing at least 2 products.
SELECT
    c.category_name,
    COUNT(p.product_id) AS product_count
FROM categories c
JOIN products p
    ON c.category_id = p.category_id
GROUP BY c.category_id, c.category_name
HAVING COUNT(p.product_id) >= 2;




-- Find the highest-spending customers
SELECT
    u.user_id,
    u.name,
    SUM(o.total_amount) AS total_spent
FROM users u
JOIN orders o
    ON u.user_id = o.user_id
GROUP BY u.user_id, u.name
ORDER BY total_spent DESC;


-- Which products have sold the most units?
SELECT
    p.product_id,
    p.product_name,
    SUM(oi.quantity) AS units_sold
FROM products p
JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name
ORDER BY units_sold DESC;


-- How much revenue did each product generate?
SELECT
    p.product_name,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM products p
JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name
ORDER BY revenue DESC;



-- Revenue by category
SELECT
    c.category_name,
    SUM(oi.quantity * oi.unit_price) AS category_revenue
FROM categories c
JOIN products p
    ON c.category_id = p.category_id
JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY c.category_id, c.category_name
ORDER BY category_revenue DESC;



-- Average Order Value
SELECT
    AVG(total_amount) AS average_order_value
FROM orders;


-- Which customers have never placed an order?
SELECT
    u.user_id,
    u.name,
    u.email
FROM users u
LEFT JOIN orders o
    ON u.user_id = o.user_id
WHERE o.order_id IS NULL;


-- Find products that have never been ordered
SELECT
    p.product_id,
    p.product_name
FROM products p
LEFT JOIN order_items oi
    ON p.product_id = oi.product_id
WHERE oi.order_item_id IS NULL;



-- Which products are selling AND running low on stock?
SELECT
    p.product_name,
    SUM(oi.quantity) AS units_sold,
    i.quantity AS current_stock
FROM products p
JOIN order_items oi
    ON p.product_id = oi.product_id
JOIN inventory i
    ON p.product_id = i.product_id
GROUP BY
    p.product_id,
    p.product_name,
    i.quantity
HAVING i.quantity < 40
ORDER BY units_sold DESC;



-- subqueries
-- First find the average price
SELECT AVG(price) AS average_price
FROM products;

-- Now use that result inside another query
SELECT
    product_id,
    product_name,
    price
FROM products
WHERE price > (
    SELECT AVG(price)
    FROM products
)
ORDER BY price DESC;



-- Find customers who have placed an order
-- Which users have placed at least one order?
SELECT
    user_id,
    name,
    email
FROM users
WHERE user_id IN (
    SELECT user_id
    FROM orders
);


-- Find customers who haven't ordered
SELECT
    user_id,
    name,
    email
FROM users
WHERE user_id NOT IN (
    SELECT user_id
    FROM orders
);

-- Find products whose price is greater than the average price of their own category.
SELECT
    p.product_name,
    p.price,
    p.category_id
FROM products p
WHERE p.price > (
    SELECT AVG(p2.price)
    FROM products p2
    WHERE p2.category_id = p.category_id
);




-- CTE
-- your first CTE
WITH customer_spending AS (
    SELECT
        u.user_id,
        u.name,
        SUM(o.total_amount) AS total_spent
    FROM users u
    JOIN orders o
        ON u.user_id = o.user_id
    GROUP BY u.user_id, u.name
)
SELECT *
FROM customer_spending
ORDER BY total_spent DESC;


-- CTE + filtering

WITH customer_spending AS (
    SELECT
        u.user_id,
        u.name,
        SUM(o.total_amount) AS total_spent
    FROM users u
    JOIN orders o
        ON u.user_id = o.user_id
    GROUP BY u.user_id, u.name
)
SELECT
    user_id,
    name,
    total_spent
FROM customer_spending
WHERE total_spent > 50000;


-- Multiple CTEs
WITH product_sales AS (
    SELECT
        product_id,
        SUM(quantity) AS units_sold
    FROM order_items
    GROUP BY product_id
),
product_inventory AS (
    SELECT
        product_id,
        quantity AS current_stock
    FROM inventory
)
SELECT
    p.product_name,
    COALESCE(ps.units_sold, 0) AS units_sold,
    pi.current_stock
FROM products p
LEFT JOIN product_sales ps
    ON p.product_id = ps.product_id
JOIN product_inventory pi
    ON p.product_id = pi.product_id
ORDER BY units_sold DESC;




-- CTE for category revenue
WITH category_sales AS (
    SELECT
        c.category_id,
        c.category_name,
        SUM(oi.quantity * oi.unit_price) AS revenue
    FROM categories c
    JOIN products p
        ON c.category_id = p.category_id
    JOIN order_items oi
        ON p.product_id = oi.product_id
    GROUP BY c.category_id, c.category_name
)
SELECT
    category_name,
    revenue
FROM category_sales
ORDER BY revenue DESC;



-- Which products are selling the most?
SELECT
    p.product_name,
    SUM(oi.quantity) AS units_sold,
    RANK() OVER (
        ORDER BY SUM(oi.quantity) DESC
    ) AS sales_rank
FROM products p
JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name;


-- DENSE_RANK():

SELECT
    p.product_name,
    SUM(oi.quantity) AS units_sold,
    DENSE_RANK() OVER (
        ORDER BY SUM(oi.quantity) DESC
    ) AS sales_rank
FROM products p
JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name;




-- ROW_NUMBER()
select version();
SELECT VERSION() AS mysql_version;


SELECT
    p.product_name,
    SUM(oi.quantity) AS units_sold,
    ROW_NUMBER() OVER (
        ORDER BY SUM(oi.quantity) DESC
    ) AS rn
FROM products p
JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY p.product_id, p.product_name
ORDER BY rn;



-- Rank products within each category.
SELECT
    c.category_name,
    p.product_name,
    p.price,
    RANK() OVER (
        PARTITION BY c.category_id
        ORDER BY p.price DESC
    ) AS price_rank
FROM products p
JOIN categories c
    ON p.category_id = c.category_id
ORDER BY c.category_name, price_rank;



-- Running total of revenue

SELECT
    order_id,
    order_date,
    total_amount,
    SUM(total_amount) OVER (
        ORDER BY order_date, order_id
    ) AS running_revenue
FROM orders;



-- Create our first view

CREATE VIEW product_inventory_view AS
SELECT
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    i.quantity AS stock_quantity
FROM products p
JOIN categories c
    ON p.category_id = c.category_id
JOIN inventory i
    ON p.product_id = i.product_id;
    
    
    
SELECT *
FROM product_inventory_view;



-- Create a sales summary view

CREATE VIEW product_sales_summary AS
SELECT
    p.product_id,
    p.product_name,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
FROM products p
LEFT JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY
    p.product_id,
    p.product_name;
    
    
    
SELECT *
FROM product_sales_summary
ORDER BY total_revenue DESC;



SHOW INDEX FROM users;


SHOW INDEX FROM products;



-- Create a product-name index
CREATE INDEX idx_product_name
ON products(product_name);

SHOW INDEX FROM products;


-- "Show me recent orders."

CREATE INDEX idx_order_date
ON orders(order_date);


SHOW INDEX FROM orders;



-- Index foreign keys used for searching/joining

CREATE INDEX idx_orders_user
ON orders(user_id);


CREATE INDEX idx_order_items_product
ON order_items(product_id);



EXPLAIN
SELECT *
FROM products
WHERE product_name = 'iPhone 17';



-- Create our first procedure
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


CALL get_customer_orders(1);

-- Ananya currently has no orders, so you should get an empty result.
CALL get_customer_orders(2);




-- Create a product-sales procedure

DELIMITER //

CREATE PROCEDURE get_product_sales(IN p_product_id INT)
BEGIN
    SELECT
        p.product_id,
        p.product_name,
        COALESCE(SUM(oi.quantity), 0) AS units_sold,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue
    FROM products p
    LEFT JOIN order_items oi
        ON p.product_id = oi.product_id
    WHERE p.product_id = p_product_id
    GROUP BY p.product_id, p.product_name;
END //

DELIMITER ;


CALL get_product_sales(1);


CALL get_product_sales(5);

-- See our procedures
SHOW PROCEDURE STATUS
WHERE Db = 'ecommerce_db';



-- Create a Function
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


SELECT calculate_order_total(1) AS calculated_total;


-- Use the function with every order
SELECT
    order_id,
    total_amount AS stored_total,
    calculate_order_total(order_id) AS calculated_total
FROM orders;


-- See our functions
SHOW FUNCTION STATUS
WHERE Db = 'ecommerce_db';


-- Create the inventory trigger
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



-- Check current inventory
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE p.product_id = 5;


-- Test the trigger
INSERT INTO orders (user_id, status, total_amount)
VALUES
(2, 'Confirmed', 4999.00);


-- Then add one Running Shoes to the new order:
INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(2, 5, 1, 4999.00);


-- Verify it
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE p.product_id = 5;



SHOW TRIGGERS;


-- Create a validation trigger
DELIMITER //

CREATE TRIGGER check_inventory_before_order
BEFORE INSERT ON order_items
FOR EACH ROW
BEGIN
    DECLARE available_stock INT;

    SELECT quantity
    INTO available_stock
    FROM inventory
    WHERE product_id = NEW.product_id;

    IF available_stock IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Product does not have inventory';
    END IF;

    IF NEW.quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order quantity must be greater than zero';
    END IF;

    IF NEW.quantity > available_stock THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient inventory';
    END IF;
END //

DELIMITER ;



SHOW TRIGGERS;




-- Test the safety mechanism
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE p.product_id = 5;




INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(2, 5, 100, 4999.00);



SELECT quantity
FROM inventory
WHERE product_id = 5;



-- Learn COMMIT and ROLLBACK
SELECT *
FROM users
WHERE email = 'transaction@test.com';



ROLLBACK;
START TRANSACTION;


INSERT INTO users (name, email, password_hash)
VALUES ('Transaction Test', 'transaction@test.com', 'test_hash_123');

SELECT *
FROM users
WHERE email = 'transaction@test.com';



ROLLBACK;


SELECT *
FROM users
WHERE email = 'transaction@test.com';


-- Start the transaction
START TRANSACTION;

-- insert the test user
INSERT INTO users (name, email, password_hash)
VALUES ('Committed User', 'committed@test.com', 'test_hash_456');


commit;


-- verify
SELECT *
FROM users
WHERE email = 'committed@test.com';



-- Clean up the test user
DELETE FROM users
WHERE email = 'committed@test.com';

SELECT *
FROM users
WHERE email = 'committed@test.com';



-- First, check Galaxy stock\

SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE p.product_id = 2;


-- execute the trancations
START TRANSACTION;

INSERT INTO orders
(user_id, status, total_amount)
VALUES
(3, 'Confirmed', 74999.00);

SET @new_order_id = LAST_INSERT_ID();

INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(@new_order_id, 2, 1, 74999.00);

INSERT INTO payments
(order_id, payment_method, payment_status, amount)
VALUES
(@new_order_id, 'UPI', 'Paid', 74999.00);

COMMIT;



-- Check the new order
SELECT *
FROM orders
ORDER BY order_id DESC
LIMIT 1;


-- Check the order item

SELECT *
FROM order_items
ORDER BY order_item_id DESC
LIMIT 1;



-- check payment
SELECT *
FROM payments
ORDER BY payment_id DESC
LIMIT 1;


-- check galaxy inventory
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE p.product_id = 2;



-- 1. Check current Galaxy stock\
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE p.product_id = 2;


-- 2. Start the transaction
start transaction;

-- 3. Create a deliberately invalid order
INSERT INTO orders
(user_id, status, total_amount)
VALUES
(3, 'Confirmed', 99999999.00);

SET @failed_order_id = LAST_INSERT_ID();



-- 4. Try to order too many Galaxy phones
INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(@failed_order_id, 2, 1000, 74999.00);
-- insufficient invetory error



-- 5. Roll back the entire transaction
ROLLBACK;


-- 6. Verify the failed order is gone
SELECT *
FROM orders
WHERE order_id = @failed_order_id;



-- 7. Verify inventory wasn't changed
SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE p.product_id = 2;


-- Database Integrity & Testing 🧪

-- Test 1 — Foreign Key Protection
INSERT INTO orders (user_id, status, total_amount)
VALUES (9999, 'Confirmed', 1000.00);

-- expected result Cannot add or update a child row: a foreign key constraint fails


-- Test 2 — Invalid Product in Order

INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(1, 9999, 1, 1000.00);


-- expected:  Foreign key constraint fails


-- Test 3 — Invalid Review Rating
INSERT INTO reviews
(user_id, product_id, rating, comment)
VALUES
(1, 1, 10, 'Invalid rating test');




SELECT *
FROM reviews
WHERE comment = 'Invalid rating test';


-- Test 4 — Zero Quantity
INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(1, 1, 0, 79999.00);



-- Test 5 — Negative Quantity
INSERT INTO order_items
(order_id, product_id, quantity, unit_price)
VALUES
(1, 1, -5, 79999.00);





-- Step 88 — Check for orphan records
SELECT oi.*
FROM order_items oi
LEFT JOIN products p
    ON oi.product_id = p.product_id
WHERE p.product_id IS NULL;


-- Check orphan addresses
SELECT a.*
FROM addresses a
LEFT JOIN users u
    ON a.user_id = u.user_id
WHERE u.user_id IS NULL;



-- Check orphan payments

SELECT p.*
FROM payments p
LEFT JOIN orders o
    ON p.order_id = o.order_id
WHERE o.order_id IS NULL;



-- Check inventory for negative values

SELECT *
FROM inventory
WHERE quantity < 0;


-- CHECK ALL INVENTORY

SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
ORDER BY i.quantity;


-- ER

-- Step 92 — E-commerce Analytics 📊
-- First: Total Revenue
SELECT
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue,
    AVG(total_amount) AS average_order_value
FROM orders;



-- Step 93 — Top-selling products
SELECT
    p.product_name,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM products p
JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY
    p.product_id,
    p.product_name
ORDER BY revenue DESC;


-- Step 94 — Customer spending
SELECT
    u.user_id,
    u.name,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o
    ON u.user_id = o.user_id
GROUP BY
    u.user_id,
    u.name
ORDER BY total_spent DESC;



-- Step 95 — Low-stock products

SELECT
    p.product_name,
    i.quantity
FROM products p
JOIN inventory i
    ON p.product_id = i.product_id
WHERE i.quantity < 20
ORDER BY i.quantity ASC;







-- Step 96 — Orders by status

SELECT
    status,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_value
FROM orders
GROUP BY status
ORDER BY order_count DESC;




-- Step 97 — Admin Dashboard Summary 📊

SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM products) AS total_products,
    (SELECT COUNT(*) FROM orders) AS total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders) AS total_revenue,
    (SELECT COUNT(*) FROM orders WHERE status = 'Confirmed') AS confirmed_orders,
    (SELECT COUNT(*) FROM products p
     JOIN inventory i ON p.product_id = i.product_id
     WHERE i.quantity < 20) AS low_stock_products;
     
     
-- Step 98 — Customer Order Report
SELECT
    u.name AS customer,
    o.order_id,
    o.order_date,
    o.status,
    o.total_amount
FROM users u
JOIN orders o
    ON u.user_id = o.user_id
ORDER BY o.order_date DESC;


-- Step 99 — Product Performance Report

SELECT
    p.product_name,
    c.category_name,
    p.price,
    i.quantity AS current_stock,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
FROM products p
JOIN categories c
    ON p.category_id = c.category_id
JOIN inventory i
    ON p.product_id = i.product_id
LEFT JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY
    p.product_id,
    p.product_name,
    c.category_name,
    p.price,
    i.quantity
ORDER BY revenue DESC;





-- Step 100 — Category Revenue Report 🎯

SELECT
    c.category_name,
    COUNT(DISTINCT p.product_id) AS total_products,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
FROM categories c
LEFT JOIN products p
    ON c.category_id = p.category_id
LEFT JOIN order_items oi
    ON p.product_id = oi.product_id
GROUP BY
    c.category_id,
    c.category_name
ORDER BY revenue DESC;



-- Step 101 — Export / Backup Your Database 💾

USE ecommerce_db;

SHOW TABLES;

-- Verify views
SHOW FULL TABLES
WHERE Table_type = 'VIEW';


-- 2. Verify procedures
SHOW PROCEDURE STATUS
WHERE Db = 'ecommerce_db';

-- 3. Verify functions
SHOW FUNCTION STATUS
WHERE Db = 'ecommerce_db';

-- 4. Verify triggers
SHOW TRIGGERS;



