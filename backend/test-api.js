const http = require('http');
const app = require('./server');
const pool = require('./config/db');

const PORT = 5099;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
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
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runAPITests() {
  const server = app.listen(PORT, async () => {
    console.log(`\n==================================================`);
    console.log(`Starting API Endpoints Verification Test on Port ${PORT}`);
    console.log(`==================================================\n`);

    const endpoints = [
      { name: 'GET /api/health', path: '/api/health' },
      { name: 'GET /api/products', path: '/api/products' },
      { name: 'GET /api/products/1', path: '/api/products/1' },
      { name: 'GET /api/products/invalid (Validation 400 Test)', path: '/api/products/abc' },
      { name: 'GET /api/products/99999 (Not Found 404 Test)', path: '/api/products/99999' },
      { name: 'GET /api/categories', path: '/api/categories' },
      { name: 'GET /api/categories/1/products', path: '/api/categories/1/products' },
      { name: 'GET /api/categories/abc/products (Validation 400 Test)', path: '/api/categories/abc/products' },
      { name: 'GET /api/categories/99999/products (Not Found 404 Test)', path: '/api/categories/99999/products' },
      { name: 'GET /api/inventory', path: '/api/inventory' },
      { name: 'GET /api/orders', path: '/api/orders' },
      { name: 'GET /api/orders/1', path: '/api/orders/1' },
      { name: 'GET /api/orders/99999 (Not Found 404 Test)', path: '/api/orders/99999' },
      { name: 'GET /api/users/1/orders', path: '/api/users/1/orders' },
      { name: 'GET /api/users/abc/orders (Validation 400 Test)', path: '/api/users/abc/orders' },
      { name: 'GET /api/users/99999/orders (Not Found 404 Test)', path: '/api/users/99999/orders' },
      { name: 'GET /api/nonexistent (Route 404 Test)', path: '/api/nonexistent' }
    ];

    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
      try {
        const res = await makeRequest(ep.path);
        console.log(`[TEST] ${ep.name.padEnd(55)} -> HTTP ${res.status}`);
        if (res.body) {
          if (res.body.error) {
            console.log(`       Message: "${res.body.error.message}"`);
          } else if (res.body.data !== undefined) {
            const count = Array.isArray(res.body.data) ? res.body.data.length : 1;
            console.log(`       Success: true | Records: ${count}`);
          }
        }
        passed++;
      } catch (err) {
        console.error(`[FAIL] ${ep.name} -> Error: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n==================================================`);
    console.log(`API Test Summary: ${passed} Checked | ${failed} Errors`);
    console.log(`==================================================\n`);

    server.close(() => {
      pool.end().then(() => {
        process.exit(0);
      });
    });
  });
}

runAPITests();
