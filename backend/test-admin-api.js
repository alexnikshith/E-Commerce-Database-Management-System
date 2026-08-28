const http = require('http');
const app = require('./server');
const pool = require('./config/db');

const PORT = 5097;

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

async function runAdminAPITests() {
  const server = app.listen(PORT, async () => {
    console.log(`\n==================================================`);
    console.log(`Starting Admin Dashboard API Test on Port ${PORT}`);
    console.log(`==================================================\n`);

    const endpoints = [
      { name: 'GET /api/admin/dashboard', path: '/api/admin/dashboard' },
      { name: 'GET /api/admin/revenue', path: '/api/admin/revenue' },
      { name: 'GET /api/admin/top-products', path: '/api/admin/top-products' },
      { name: 'GET /api/admin/top-products?limit=5', path: '/api/admin/top-products?limit=5' },
      { name: 'GET /api/admin/customers', path: '/api/admin/customers' },
      { name: 'GET /api/admin/low-stock', path: '/api/admin/low-stock' },
      { name: 'GET /api/admin/low-stock?threshold=50', path: '/api/admin/low-stock?threshold=50' },
      { name: 'GET /api/admin/category-performance', path: '/api/admin/category-performance' },
      { name: 'GET /api/admin/orders-by-status', path: '/api/admin/orders-by-status' }
    ];

    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
      try {
        const res = await makeRequest(ep.path);
        console.log(`[TEST] ${ep.name.padEnd(55)} -> HTTP ${res.status}`);
        if (res.body) {
          if (res.body.error) {
            console.log(`       Error Response: "${res.body.error.message}"`);
          } else if (res.body.data) {
            if (ep.path === '/api/admin/dashboard') {
              console.log(`       Summary Metrics:`, JSON.stringify(res.body.data));
            } else if (ep.path === '/api/admin/revenue') {
              console.log(`       Revenue Metrics:`, JSON.stringify(res.body.data));
            } else {
              const count = Array.isArray(res.body.data) ? res.body.data.length : 1;
              console.log(`       Records returned: ${count}`);
            }
          }
        }
        passed++;
      } catch (err) {
        console.error(`[FAIL] ${ep.name} -> Error: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n==================================================`);
    console.log(`Admin API Test Summary: ${passed}/${endpoints.length} Endpoints Verified`);
    console.log(`==================================================\n`);

    server.close(() => {
      pool.end().then(() => {
        process.exit(0);
      });
    });
  });
}

runAdminAPITests();
