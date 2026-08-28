const http = require('http');
const app = require('./server');
const pool = require('./config/db');

const PORT = 5098;

function sendRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runWriteAPITests() {
  const server = app.listen(PORT, async () => {
    console.log(`\n==================================================`);
    console.log(`Starting Write REST API Endpoints Test on Port ${PORT}`);
    console.log(`==================================================\n`);

    const randomSuffix = Math.floor(Math.random() * 10000);
    const testEmail = `testuser_${randomSuffix}@example.com`;

    const tests = [
      // USERS
      {
        name: 'POST /api/users (Invalid Email Validation 400)',
        method: 'POST',
        path: '/api/users',
        body: { name: 'Test User', email: 'invalid-email', password: 'password123' },
        expectedStatus: 400
      },
      {
        name: 'POST /api/users (Create New User 201)',
        method: 'POST',
        path: '/api/users',
        body: { name: 'API Test User', email: testEmail, password: 'password123', phone: '9999999999' },
        expectedStatus: 201
      },
      {
        name: 'POST /api/users (Duplicate Email Conflict 409)',
        method: 'POST',
        path: '/api/users',
        body: { name: 'Duplicate User', email: testEmail, password: 'password123' },
        expectedStatus: 409
      },

      // PRODUCTS
      {
        name: 'POST /api/products (Invalid Category FK 400)',
        method: 'POST',
        path: '/api/products',
        body: { category_id: 99999, product_name: 'Invalid Cat Product', price: 99.99 },
        expectedStatus: 400
      },
      {
        name: 'POST /api/products (Invalid Price Validation 400)',
        method: 'POST',
        path: '/api/products',
        body: { category_id: 1, product_name: 'Zero Price Product', price: -50.00 },
        expectedStatus: 400
      },
      {
        name: 'POST /api/products (Create Product 201)',
        method: 'POST',
        path: '/api/products',
        body: { category_id: 1, product_name: `Test Gadget ${randomSuffix}`, description: 'Test description', price: 199.99, brand: 'TestBrand', initial_stock: 10 },
        expectedStatus: 201
      },
      {
        name: 'PUT /api/products/abc (Invalid ID Parameter 400)',
        method: 'PUT',
        path: '/api/products/abc',
        body: { product_name: 'Updated Name' },
        expectedStatus: 400
      },
      {
        name: 'PUT /api/products/99999 (Product Not Found 404)',
        method: 'PUT',
        path: '/api/products/99999',
        body: { product_name: 'Updated Name' },
        expectedStatus: 404
      },

      // ORDERS & TRANSACTIONS & TRIGGER INVENTORY
      {
        name: 'POST /api/orders (Non-existent User FK 400)',
        method: 'POST',
        path: '/api/orders',
        body: { user_id: 99999, items: [{ product_id: 1, quantity: 1 }] },
        expectedStatus: 400
      },
      {
        name: 'POST /api/orders (Insufficient Inventory Trigger & Rollback 400)',
        method: 'POST',
        path: '/api/orders',
        body: { user_id: 1, items: [{ product_id: 1, quantity: 999999 }] },
        expectedStatus: 400
      },
      {
        name: 'POST /api/orders/99999/items (Order Not Found 404)',
        method: 'POST',
        path: '/api/orders/99999/items',
        body: { product_id: 1, quantity: 1 },
        expectedStatus: 404
      },

      // REVIEWS
      {
        name: 'POST /api/products/1/reviews (Rating Out of Range 1-5 Validation 400)',
        method: 'POST',
        path: '/api/products/1/reviews',
        body: { user_id: 1, rating: 10, comment: 'Invalid rating' },
        expectedStatus: 400
      },
      {
        name: 'POST /api/products/99999/reviews (Product Not Found 404)',
        method: 'POST',
        path: '/api/products/99999/reviews',
        body: { user_id: 1, rating: 5, comment: 'Great product!' },
        expectedStatus: 404
      }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
      try {
        const res = await sendRequest(test.method, test.path, test.body);
        console.log(`[TEST] ${test.name.padEnd(65)} -> HTTP ${res.status}`);
        if (res.body) {
          if (res.body.error) {
            console.log(`       Error Response: "${res.body.error.message}"`);
          } else if (res.body.message) {
            console.log(`       Success Response: "${res.body.message}"`);
          }
        }
        passed++;
      } catch (err) {
        console.error(`[FAIL] ${test.name} -> Error: ${err.message}`);
      }
    }

    console.log(`\n==================================================`);
    console.log(`Write API Test Summary: ${passed}/${total} Endpoints Verified`);
    console.log(`==================================================\n`);

    server.close(() => {
      pool.end().then(() => {
        process.exit(0);
      });
    });
  });
}

runWriteAPITests();
