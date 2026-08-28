# E-Commerce Database Management System - REST API Specification

## 1. Overview & Architecture

The backend layer is built using **Node.js**, **Express.js**, and **mysql2** following a modular Model-View-Controller (MVC) architectural pattern:

- **Server Entrypoint**: [`backend/server.js`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/backend/server.js)
- **Database Connection Pool**: [`backend/config/db.js`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/backend/config/db.js)
- **Global Error Handler**: [`backend/middleware/errorHandler.js`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/backend/middleware/errorHandler.js)
- **Controllers**: [`backend/controllers/`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/backend/controllers/)
- **Routes**: [`backend/routes/`](file:///c:/Users/Nikshith%20Gurram/OneDrive/Desktop/Ecommerce-Database-Management-System/backend/routes/)

---

## 2. API Endpoint Summary Table

| HTTP Method | Route Path | Description | Access Level | Status Codes |
|---|---|---|---|---|
| `GET` | `/api/health` | Health check & DB connectivity ping (`SELECT 1`) | Public | 200, 503 |
| `GET` | `/api/products` | Fetch product catalog with categories & stock | Public | 200, 500 |
| `GET` | `/api/products/:id` | Fetch product details & reviews by ID | Public | 200, 400, 404, 500 |
| `POST` | `/api/products` | Create product and initialize inventory stock | Admin / Seller | 201, 400, 500 |
| `PUT` | `/api/products/:id` | Update product details | Admin / Seller | 200, 400, 404, 500 |
| `POST` | `/api/products/:id/reviews` | Add product review | Customer | 201, 400, 404, 409, 500 |
| `GET` | `/api/categories` | List product categories with product count | Public | 200, 500 |
| `GET` | `/api/categories/:id/products` | List products in a category | Public | 200, 400, 404, 500 |
| `GET` | `/api/inventory` | List product stock levels | Admin | 200, 500 |
| `GET` | `/api/orders` | List purchase orders summary | Admin | 200, 500 |
| `GET` | `/api/orders/:id` | Get detailed purchase order with items & payment | Customer / Admin | 200, 400, 404, 500 |
| `POST` | `/api/orders` | Multi-item order placement transaction | Customer | 201, 400, 500 |
| `POST` | `/api/orders/:id/items` | Add item to existing order transaction | Customer | 201, 400, 404, 409, 500 |
| `POST` | `/api/users` | Register new user account | Public | 201, 400, 409, 500 |
| `GET` | `/api/users/:id/orders` | List order history for a user | Customer / Admin | 200, 400, 404, 500 |
| `GET` | `/api/admin/dashboard` | High-level business overview metrics | Admin | 200, 500 |
| `GET` | `/api/admin/revenue` | Revenue analytics report | Admin | 200, 500 |
| `GET` | `/api/admin/top-products` | Top selling products ranking | Admin | 200, 500 |
| `GET` | `/api/admin/customers` | Customer spending breakdown | Admin | 200, 500 |
| `GET` | `/api/admin/low-stock` | Inventory alert report | Admin | 200, 500 |
| `GET` | `/api/admin/category-performance` | Category-wise revenue report | Admin | 200, 500 |
| `GET` | `/api/admin/orders-by-status` | Order count by status | Admin | 200, 500 |

---

## 3. Sample JSON Payloads & Schema Definitions

### 3.1. User Registration (`POST /api/users`)
**Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!",
  "phone": "9876543210"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "user_id": 4,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "phone": "9876543210",
    "created_at": "2026-08-27T21:10:00.000Z"
  }
}
```

### 3.2. Order Creation (`POST /api/orders`)
**Request Body**:
```json
{
  "user_id": 1,
  "items": [
    { "product_id": 1, "quantity": 1 },
    { "product_id": 5, "quantity": 2 }
  ],
  "payment_method": "UPI"
}
```
**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order created successfully.",
  "data": {
    "order_id": 4,
    "user_id": 1,
    "customer_name": "Rahul Sharma",
    "order_date": "2026-08-27T21:12:00.000Z",
    "status": "Confirmed",
    "total_amount": 89997.00,
    "items": [
      {
        "order_item_id": 6,
        "product_id": 1,
        "product_name": "iPhone 17",
        "quantity": 1,
        "unit_price": 79999.00,
        "item_total": 79999.00
      },
      {
        "order_item_id": 7,
        "product_id": 5,
        "product_name": "Running Shoes",
        "quantity": 2,
        "unit_price": 4999.00,
        "item_total": 9998.00
      }
    ]
  }
}
```

---

## 4. Error Responses & Validation Rules

### 4.1. Parameter Validation Error (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "message": "Invalid product ID. Must be a positive integer."
  }
}
```

### 4.2. Insufficient Inventory Error (`400 Bad Request`)
```json
{
  "success": false,
  "error": {
    "message": "Insufficient inventory",
    "code": "INSUFFICIENT_INVENTORY"
  }
}
```

### 4.3. Duplicate Record Error (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "message": "User has already submitted a review for this product."
  }
}
```
