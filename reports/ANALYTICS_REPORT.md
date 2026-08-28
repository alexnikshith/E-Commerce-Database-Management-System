# E-Commerce Database Management System - Analytics & Business Intelligence Report

## 1. Executive Summary

This report presents business metrics, product sales performance, category revenue trends, inventory alerts, and customer spending analytics compiled from the `ecommerce_db` relational database.

---

## 2. Admin Dashboard High-Level Metrics

```sql
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM products) AS total_products,
    (SELECT COUNT(*) FROM orders) AS total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM orders) AS total_revenue,
    (SELECT COUNT(*) FROM orders WHERE status = 'Confirmed') AS confirmed_orders,
    (SELECT COUNT(*) FROM inventory WHERE quantity < 20) AS low_stock_products;
```

### Business Summary Snapshot:
- **Total Registered Users**: 3
- **Total Products Cataloged**: 10
- **Total Purchase Orders Placed**: 3
- **Total Platform Revenue**: ₹1,70,894.00
- **Confirmed Orders**: 3 (100% fulfillment rate)
- **Low-Stock Alert Count**: 0 products (< 20 threshold)

---

## 3. Revenue Analytics Report

```sql
SELECT
    COUNT(*) AS total_orders,
    COALESCE(SUM(total_amount), 0) AS total_revenue,
    COALESCE(AVG(total_amount), 0) AS average_order_value
FROM orders;
```

### Financial Performance Breakdown:
- **Total Revenue**: ₹1,70,894.00
- **Total Orders**: 3
- **Average Order Value (AOV)**: ₹56,964.67

---

## 4. Top-Selling Products Performance Report

Reusing Database View: `product_sales_summary`

| Rank | Product Name | Units Sold | Price (₹) | Total Revenue (₹) |
|---|---|---|---|---|
| 1 | iPhone 17 | 1 | 79,999.00 | ₹79,999.00 |
| 2 | Galaxy S26 | 1 | 74,999.00 | ₹74,999.00 |
| 3 | Running Shoes | 3 | 4,999.00 | ₹14,997.00 |
| 4 | Clean Code | 1 | 899.00 | ₹899.00 |
| 5 | WH-1000XM6 Headphones | 0 | 34,999.00 | ₹0.00 |

---

## 5. Category Performance Report

```sql
SELECT
    c.category_name,
    COUNT(DISTINCT p.product_id) AS total_products,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS category_revenue
FROM categories c
LEFT JOIN products p ON c.category_id = p.category_id
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY c.category_id, c.category_name
ORDER BY category_revenue DESC;
```

| Category Name | Total Catalog Products | Total Units Sold | Total Revenue (₹) |
|---|---|---|---|
| Electronics | 3 | 2 | ₹1,54,998.00 |
| Clothing | 2 | 3 | ₹14,997.00 |
| Books | 2 | 1 | ₹899.00 |
| Home Appliances | 2 | 0 | ₹0.00 |
| Sports | 1 | 0 | ₹0.00 |

---

## 6. Customer Spending Breakdown

```sql
SELECT
    u.user_id,
    u.name AS customer_name,
    u.email,
    COUNT(o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.user_id = o.user_id
GROUP BY u.user_id, u.name, u.email
ORDER BY total_spent DESC;
```

| Customer ID | Customer Name | Email | Total Orders Placed | Total Amount Spent (₹) |
|---|---|---|---|---|
| 1 | Rahul Sharma | rahul@gmail.com | 1 | ₹90,896.00 |
| 3 | David Thomas | david@gmail.com | 1 | ₹74,999.00 |
| 2 | Ananya Reddy | ananya@gmail.com | 1 | ₹4,999.00 |

---

## 7. Low-Stock Alert Report

Reusing Database View: `product_inventory_view`

```sql
SELECT product_id, product_name, category_name, price, stock_quantity
FROM product_inventory_view
WHERE stock_quantity < 35
ORDER BY stock_quantity ASC;
```

| Product ID | Product Name | Category | Price (₹) | Current Stock Quantity | Status Alert |
|---|---|---|---|---|---|
| 7 | Database System Concepts | Books | 1,299.00 | 25 | Low Stock Warning |
| 6 | Clean Code | Books | 899.00 | 30 | Low Stock Warning |
| 9 | Mixer Grinder | Home Appliances | 3,499.00 | 35 | Stock Reorder Threshold |
