/**
 * E-Commerce DBMS Dashboard - Interactive JavaScript SPA Controller
 */

let pendingDeleteAction = null;

document.addEventListener('DOMContentLoaded', () => {
  // Admin Password Gate Verification
  checkAdminAuth();

  // Navigation Tabs Logic
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageHeading = document.getElementById('page-heading');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabTarget = item.getAttribute('data-tab');

      navItems.forEach(i => i.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(`tab-${tabTarget}`).classList.add('active');
      pageHeading.textContent = item.textContent.trim();

      // Refresh tab data
      loadTabData(tabTarget);
    });
  });

  // Modals Controller
  setupModals();
});

// Admin Password Gate Check
function checkAdminAuth() {
  const token = localStorage.getItem('admin_token');
  const loginModal = document.getElementById('modal-admin-login');

  if (token === 'admin-auth-token-nikshith123') {
    if (loginModal) loginModal.classList.remove('active');
    loadDashboardKPIs();
    loadOverviewAnalytics();
    loadProducts();
  } else {
    if (loginModal) loginModal.classList.add('active');
  }
}

// Currency Formatter (INR ₹)
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';
  
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal Handlers
function setupModals() {
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  
  document.getElementById('btn-open-order-modal')?.addEventListener('click', async () => {
    await populateOrderModalSelects();
    openModal('modal-order');
  });

  document.getElementById('btn-open-product-modal')?.addEventListener('click', async () => {
    await populateCategorySelect('product-category-select');
    openModal('modal-product');
  });

  document.getElementById('btn-open-user-modal')?.addEventListener('click', () => {
    openModal('modal-user');
  });

  document.getElementById('btn-open-review-modal')?.addEventListener('click', async () => {
    await populateReviewModalSelects();
    openModal('modal-review');
  });

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      if (overlay.id !== 'modal-admin-login') {
        closeModal(overlay.id);
      }
    });
  });

  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && overlay.id !== 'modal-admin-login') {
        closeModal(overlay.id);
      }
    });
  });

  // Submit Forms
  document.getElementById('form-admin-login')?.addEventListener('submit', handleAdminLoginSubmit);
  document.getElementById('form-create-order')?.addEventListener('submit', handleOrderSubmit);
  document.getElementById('form-create-product')?.addEventListener('submit', handleProductSubmit);
  document.getElementById('form-create-user')?.addEventListener('submit', handleUserSubmit);
  document.getElementById('form-create-review')?.addEventListener('submit', handleReviewSubmit);
  document.getElementById('form-update-order-status')?.addEventListener('submit', handleUpdateOrderStatusSubmit);

  // Logout Button
  document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
    localStorage.removeItem('admin_token');
    showToast('Admin session logged out.', 'success');
    setTimeout(() => location.reload(), 500);
  });

  // Confirm Delete Button Handler
  document.getElementById('btn-confirm-delete-submit')?.addEventListener('click', async () => {
    if (typeof pendingDeleteAction === 'function') {
      await pendingDeleteAction();
      pendingDeleteAction = null;
      closeModal('modal-confirm-delete');
    }
  });
}

// Handle Admin Password Login Form Submit
async function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password-input').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      localStorage.setItem('admin_token', json.token);
      showToast('Admin authenticated successfully!', 'success');
      document.getElementById('modal-admin-login').classList.remove('active');
      loadDashboardKPIs();
      loadOverviewAnalytics();
      loadProducts();
    } else {
      showToast(json.error ? json.error.message : 'Invalid Admin password.', 'error');
    }
  } catch (err) {
    showToast('Authentication server error', 'error');
  }
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Load Tab Data
function loadTabData(tab) {
  switch (tab) {
    case 'overview':
      loadDashboardKPIs();
      loadOverviewAnalytics();
      break;
    case 'products':
      loadProducts();
      break;
    case 'orders':
      loadOrders();
      break;
    case 'inventory':
      loadInventory();
      break;
    case 'customers':
      loadCustomers();
      break;
    case 'reviews':
      loadReviews();
      break;
  }
}

// 1. Load Dashboard KPIs
async function loadDashboardKPIs() {
  try {
    const res = await fetch('/api/admin/dashboard');
    const json = await res.json();

    if (json.success) {
      const d = json.data;
      document.getElementById('kpi-revenue').textContent = formatCurrency(d.total_revenue);
      document.getElementById('kpi-orders').textContent = d.total_orders;
      document.getElementById('kpi-products').textContent = d.total_products;
      document.getElementById('kpi-customers').textContent = d.total_users;
      document.getElementById('kpi-low-stock').textContent = d.low_stock_products;
    }
  } catch (e) {
    console.error('Failed to load KPIs:', e);
  }
}

// 2. Load Overview Analytics
async function loadOverviewAnalytics() {
  try {
    const [topRes, catRes] = await Promise.all([
      fetch('/api/admin/top-products?limit=5'),
      fetch('/api/admin/category-performance')
    ]);

    const topJson = await topRes.json();
    const catJson = await catRes.json();

    // Top Products Table
    const topBody = document.getElementById('overview-top-products-body');
    if (topJson.success && topJson.data.length > 0) {
      topBody.innerHTML = topJson.data.map(p => `
        <tr>
          <td><strong>${p.product_name}</strong></td>
          <td><span class="badge badge-info">${p.category_name}</span></td>
          <td>${formatCurrency(p.price)}</td>
          <td><strong>${p.units_sold}</strong> units</td>
          <td style="color: var(--accent-yellow-dark); font-weight:700;">${formatCurrency(p.total_revenue)}</td>
        </tr>
      `).join('');
    } else {
      topBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No product sales recorded yet.</td></tr>';
    }

    // Category Revenue Table
    const catBody = document.getElementById('overview-category-body');
    if (catJson.success && catJson.data.length > 0) {
      catBody.innerHTML = catJson.data.map(c => `
        <tr>
          <td><strong>${c.category_name}</strong></td>
          <td style="color: var(--accent-yellow-dark); font-weight:700;">${formatCurrency(c.category_revenue)}</td>
        </tr>
      `).join('');
    } else {
      catBody.innerHTML = '<tr><td colspan="2" style="text-align:center;">No categories found.</td></tr>';
    }
  } catch (e) {
    console.error('Failed to load overview analytics:', e);
  }
}

// 3. Load Products Tab
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const json = await res.json();

    const body = document.getElementById('products-table-body');
    if (json.success && json.data.length > 0) {
      window.productsCache = json.data;
      renderProductsTable(json.data);
    } else {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;">No products found in database.</td></tr>';
    }
  } catch (e) {
    console.error('Failed to load products:', e);
  }
}

function renderProductsTable(products) {
  const body = document.getElementById('products-table-body');
  body.innerHTML = products.map(p => {
    const stockBadge = p.stock_quantity < 35 
      ? `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Low (${p.stock_quantity})</span>`
      : `<span class="badge badge-success">${p.stock_quantity} units</span>`;

    const safeName = p.product_name.replace(/'/g, "\\'");

    return `
      <tr>
        <td>#${p.product_id}</td>
        <td><strong>${p.product_name}</strong><br><small style="color:var(--text-muted);">${p.description || ''}</small></td>
        <td><span class="badge badge-info">${p.category_name}</span></td>
        <td>${p.brand || 'N/A'}</td>
        <td style="font-weight:700;">${formatCurrency(p.price)}</td>
        <td>${stockBadge}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary" onclick="viewProductDetails(${p.product_id})" style="padding: 4px 10px; font-size: 11.5px;">
              <i class="fa-solid fa-eye"></i> Details
            </button>
            <button class="btn btn-secondary" onclick="confirmDeleteProduct(${p.product_id}, '${safeName}')" style="padding: 4px 10px; font-size: 11.5px; color:var(--danger); border-color:var(--danger);">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Search Filter for Products
document.getElementById('product-search-input')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!window.productsCache) return;

  const filtered = window.productsCache.filter(p => 
    p.product_name.toLowerCase().includes(query) || 
    (p.brand && p.brand.toLowerCase().includes(query)) ||
    p.category_name.toLowerCase().includes(query)
  );
  renderProductsTable(filtered);
});

// Custom UI Popup: View Product Details
async function viewProductDetails(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    const json = await res.json();

    if (json.success) {
      const p = json.data;
      const reviewsHtml = p.reviews.length > 0
        ? p.reviews.map(r => `
            <div style="background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px; margin-bottom:8px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <strong style="font-size:13px;">${r.reviewer_name}</strong>
                <span style="color:var(--warning); font-weight:700;">⭐ ${r.rating}/5</span>
              </div>
              <p style="font-size:12.5px; color:var(--text-secondary);">"${r.comment || 'No comment.'}"</p>
              <small style="font-size:10.5px; color:var(--text-muted);">${new Date(r.review_date).toLocaleDateString()}</small>
            </div>
          `).join('')
        : '<p style="font-size:13px; color:var(--text-muted); font-style:italic;">No reviews written yet.</p>';

      const content = document.getElementById('product-details-content');
      content.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h3 style="font-size:18px; font-weight:800;">${p.product_name}</h3>
            <span class="badge badge-info">${p.category_name}</span>
          </div>
          <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">${p.description || 'No product description available.'}</p>
          
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; background:var(--bg-main); padding:12px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div>
              <small class="form-label" style="font-size:10px;">Brand</small>
              <strong style="font-size:13px;">${p.brand || 'N/A'}</strong>
            </div>
            <div>
              <small class="form-label" style="font-size:10px;">Price</small>
              <strong style="font-size:13px; color:var(--accent-yellow-dark);">${formatCurrency(p.price)}</strong>
            </div>
            <div>
              <small class="form-label" style="font-size:10px;">Stock Level</small>
              <strong style="font-size:13px;">${p.stock_quantity} units</strong>
            </div>
          </div>
        </div>

        <div>
          <h4 style="font-size:14px; font-weight:700; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-comments" style="color:var(--accent-yellow);"></i> Customer Reviews (${p.reviews_count})
          </h4>
          <div style="max-height:220px; overflow-y:auto; padding-right:4px;">
            ${reviewsHtml}
          </div>
        </div>
      `;

      openModal('modal-product-details');
    }
  } catch (e) {
    showToast('Failed to load product details', 'error');
  }
}

// Confirm Delete Product
function confirmDeleteProduct(id, name) {
  document.getElementById('delete-confirm-message').innerHTML = `Are you sure you want to delete product <strong>${name}</strong> (ID #${id})?`;
  pendingDeleteAction = async () => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message, 'success');
        loadDashboardKPIs();
        loadProducts();
      } else {
        showToast(json.error ? json.error.message : 'Failed to delete product', 'error');
      }
    } catch (e) {
      showToast('Product deletion error', 'error');
    }
  };
  openModal('modal-confirm-delete');
}

// 4. Load Orders Tab
async function loadOrders() {
  try {
    const res = await fetch('/api/orders');
    const json = await res.json();

    const body = document.getElementById('orders-table-body');
    if (json.success && json.data.length > 0) {
      body.innerHTML = json.data.map(o => `
        <tr>
          <td>#${o.order_id}</td>
          <td><strong>${o.customer_name}</strong><br><small style="color:var(--text-muted);">${o.customer_email}</small></td>
          <td>${new Date(o.order_date).toLocaleDateString('en-IN')}</td>
          <td>${o.total_items} items</td>
          <td><span class="badge badge-success">${o.status}</span></td>
          <td style="color: var(--accent-yellow-dark); font-weight:700;">${formatCurrency(o.total_amount)}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-secondary" onclick="viewOrderDetails(${o.order_id})" style="padding: 4px 8px; font-size: 11.5px;">
                <i class="fa-solid fa-receipt"></i> View
              </button>
              <button class="btn btn-secondary" onclick="openUpdateStatusModal(${o.order_id}, '${o.status}')" style="padding: 4px 8px; font-size: 11.5px;">
                <i class="fa-solid fa-pen-to-square"></i> Status
              </button>
              <button class="btn btn-secondary" onclick="confirmDeleteOrder(${o.order_id})" style="padding: 4px 8px; font-size: 11.5px; color:var(--danger); border-color:var(--danger);">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    } else {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders found.</td></tr>';
    }
  } catch (e) {
    console.error('Failed to load orders:', e);
  }
}

// Custom UI Popup: View Single Order Line Items
async function viewOrderDetails(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    const json = await res.json();

    if (json.success) {
      const o = json.data;
      const itemsRowsHtml = o.items.map(i => `
        <tr>
          <td><strong>${i.product_name}</strong></td>
          <td>x${i.quantity}</td>
          <td>${formatCurrency(i.unit_price)}</td>
          <td style="font-weight:700;">${formatCurrency(i.item_total)}</td>
        </tr>
      `).join('');

      const paymentBadge = o.payment 
        ? `<span class="badge badge-success"><i class="fa-solid fa-credit-card"></i> ${o.payment.payment_method} (${o.payment.payment_status})</span>`
        : `<span class="badge badge-warning">Payment Pending</span>`;

      const shipmentBadge = o.shipment
        ? `<span class="badge badge-info"><i class="fa-solid fa-truck-fast"></i> ${o.shipment.carrier} - ${o.shipment.tracking_number} (${o.shipment.shipment_status})</span>`
        : `<span class="badge badge-info"><i class="fa-solid fa-box"></i> Order Processing</span>`;

      const content = document.getElementById('order-details-content');
      content.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div>
              <h3 style="font-size:17px; font-weight:800;">Order #${o.order_id}</h3>
              <small style="color:var(--text-muted);">${new Date(o.order_date).toLocaleString()}</small>
            </div>
            <span class="badge badge-success">${o.status}</span>
          </div>

          <div style="background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px; margin-bottom:14px;">
            <strong style="font-size:13.5px;">Customer: ${o.customer_name}</strong>
            <p style="font-size:12px; color:var(--text-secondary);">${o.customer_email}</p>
          </div>

          <h4 style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:8px;">Line Items Summary</h4>
          <div class="table-responsive" style="margin-bottom:14px;">
            <table class="data-table" style="font-size:12.5px;">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--accent-yellow-light); border:1px solid rgba(245, 158, 11, 0.4); border-radius:var(--radius-md); padding:12px 16px; margin-bottom:14px;">
            <span style="font-weight:700; color:var(--accent-yellow-dark);">Grand Total Amount</span>
            <strong style="font-size:18px; color:var(--accent-yellow-dark);">${formatCurrency(o.total_amount)}</strong>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            ${paymentBadge}
            ${shipmentBadge}
          </div>
        </div>
      `;

      openModal('modal-order-details');
    }
  } catch (e) {
    showToast('Failed to fetch order details', 'error');
  }
}

// Open Order Status Update Modal
function openUpdateStatusModal(orderId, currentStatus) {
  document.getElementById('status-target-order-id').value = orderId;
  document.getElementById('order-status-select').value = currentStatus || 'Confirmed';
  openModal('modal-update-status');
}

// Handle Order Status Update Form Submit
async function handleUpdateOrderStatusSubmit(e) {
  e.preventDefault();
  const orderId = document.getElementById('status-target-order-id').value;
  const status = document.getElementById('order-status-select').value;

  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      showToast(json.message, 'success');
      closeModal('modal-update-status');
      loadDashboardKPIs();
      loadOverviewAnalytics();
      loadOrders();
    } else {
      showToast(json.error ? json.error.message : 'Failed to update order status', 'error');
    }
  } catch (err) {
    showToast('Order status update failed', 'error');
  }
}

// Confirm Delete Order
function confirmDeleteOrder(id) {
  document.getElementById('delete-confirm-message').innerHTML = `Are you sure you want to delete <strong>Order #${id}</strong>?`;
  pendingDeleteAction = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message, 'success');
        loadDashboardKPIs();
        loadOverviewAnalytics();
        loadOrders();
      } else {
        showToast(json.error ? json.error.message : 'Failed to delete order', 'error');
      }
    } catch (e) {
      showToast('Order deletion error', 'error');
    }
  };
  openModal('modal-confirm-delete');
}

// 5. Load Inventory Tab
async function loadInventory() {
  try {
    const res = await fetch('/api/inventory');
    const json = await res.json();

    const body = document.getElementById('inventory-table-body');
    if (json.success && json.data.length > 0) {
      body.innerHTML = json.data.map(i => {
        const isLow = i.quantity < 35;
        const statusBadge = isLow
          ? `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock Alert</span>`
          : `<span class="badge badge-success">Sufficient Stock</span>`;

        return `
          <tr>
            <td>#${i.inventory_id}</td>
            <td><strong>${i.product_name}</strong></td>
            <td><span class="badge badge-info">${i.category_name}</span></td>
            <td>${formatCurrency(i.price)}</td>
            <td style="font-weight:700; ${isLow ? 'color:var(--danger);' : ''}">${i.quantity} units</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      }).join('');
    } else {
      body.innerHTML = '<tr><td colspan="6" style="text-align:center;">No inventory records found.</td></tr>';
    }
  } catch (e) {
    console.error('Failed to load inventory:', e);
  }
}

// 6. Load Customers Tab
async function loadCustomers() {
  try {
    const res = await fetch('/api/admin/customers');
    const json = await res.json();

    const body = document.getElementById('customers-table-body');
    if (json.success && json.data.length > 0) {
      body.innerHTML = json.data.map(c => {
        const safeName = c.customer_name.replace(/'/g, "\\'");

        return `
          <tr>
            <td>#${c.user_id}</td>
            <td><strong>${c.customer_name}</strong></td>
            <td>${c.email}</td>
            <td><strong>${c.total_orders}</strong> orders</td>
            <td style="color: var(--accent-yellow-dark); font-weight:700;">${formatCurrency(c.total_spent)}</td>
            <td>
              <button class="btn btn-secondary" onclick="confirmDeleteCustomer(${c.user_id}, '${safeName}')" style="padding: 4px 10px; font-size: 11.5px; color:var(--danger); border-color:var(--danger);">
                <i class="fa-solid fa-user-minus"></i> Delete
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      body.innerHTML = '<tr><td colspan="6" style="text-align:center;">No registered customers found.</td></tr>';
    }
  } catch (e) {
    console.error('Failed to load customers:', e);
  }
}

// Confirm Delete Customer
function confirmDeleteCustomer(id, name) {
  document.getElementById('delete-confirm-message').innerHTML = `Are you sure you want to delete customer <strong>${name}</strong> (ID #${id})?`;
  pendingDeleteAction = async () => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(json.message, 'success');
        loadDashboardKPIs();
        loadOverviewAnalytics();
        loadCustomers();
      } else {
        showToast(json.error ? json.error.message : 'Failed to delete customer', 'error');
      }
    } catch (e) {
      showToast('Customer deletion error', 'error');
    }
  };
  openModal('modal-confirm-delete');
}

// 7. Load Reviews Tab
async function loadReviews() {
  try {
    const res = await fetch('/api/products');
    const json = await res.json();

    const container = document.getElementById('reviews-container');
    if (json.success && json.data.length > 0) {
      let reviewsHtml = '';
      for (const prod of json.data) {
        const prodRes = await fetch(`/api/products/${prod.product_id}`);
        const prodJson = await prodRes.json();
        if (prodJson.success && prodJson.data.reviews.length > 0) {
          reviewsHtml += prodJson.data.reviews.map(r => `
            <div style="background:var(--surface-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; margin-bottom:12px; box-shadow:var(--shadow-sm);">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <strong>${r.reviewer_name} on ${prod.product_name}</strong>
                <span style="color:var(--warning); font-weight:700;">⭐ ${r.rating}/5</span>
              </div>
              <p style="color:var(--text-secondary); font-size:13px;">"${r.comment || 'No written comment.'}"</p>
              <small style="color:var(--text-muted); font-size:11px;">Posted: ${new Date(r.review_date).toLocaleDateString()}</small>
            </div>
          `).join('');
        }
      }

      container.innerHTML = reviewsHtml || '<p style="text-align:center; padding:20px; color:var(--text-muted);">No product reviews found.</p>';
    }
  } catch (e) {
    console.error('Failed to load reviews:', e);
  }
}

// Select Population Helpers
async function populateCategorySelect(elementId) {
  const select = document.getElementById(elementId);
  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success) {
      select.innerHTML = json.data.map(c => `<option value="${c.category_id}">${c.category_name}</option>`).join('');
    }
  } catch (e) {}
}

async function populateOrderModalSelects() {
  const userSelect = document.getElementById('order-user-select');
  const prodSelect = document.getElementById('order-product-select');

  try {
    const [userRes, prodRes] = await Promise.all([
      fetch('/api/admin/customers'),
      fetch('/api/products')
    ]);

    const userJson = await userRes.json();
    const prodJson = await prodRes.json();

    if (userJson.success) {
      userSelect.innerHTML = userJson.data.map(u => `<option value="${u.user_id}">${u.customer_name} (${u.email})</option>`).join('');
    }

    if (prodJson.success) {
      prodSelect.innerHTML = prodJson.data.map(p => `<option value="${p.product_id}">${p.product_name} - ${formatCurrency(p.price)} (Stock: ${p.stock_quantity})</option>`).join('');
    }
  } catch (e) {}
}

async function populateReviewModalSelects() {
  const userSelect = document.getElementById('review-user-select');
  const prodSelect = document.getElementById('review-product-select');

  try {
    const [userRes, prodRes] = await Promise.all([
      fetch('/api/admin/customers'),
      fetch('/api/products')
    ]);

    const userJson = await userRes.json();
    const prodJson = await prodRes.json();

    if (userJson.success) {
      userSelect.innerHTML = userJson.data.map(u => `<option value="${u.user_id}">${u.customer_name}</option>`).join('');
    }

    if (prodJson.success) {
      prodSelect.innerHTML = prodJson.data.map(p => `<option value="${p.product_id}">${p.product_name}</option>`).join('');
    }
  } catch (e) {}
}

// Form Handlers
async function handleOrderSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('order-user-select').value;
  const prodId = document.getElementById('order-product-select').value;
  const qty = parseInt(document.getElementById('order-qty-input').value, 10);
  const paymentMethod = document.getElementById('order-payment-select').value;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        items: [{ product_id: prodId, quantity: qty }],
        payment_method: paymentMethod
      })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Order #${json.data.order_id} placed successfully!`, 'success');
      closeModal('modal-order');
      loadDashboardKPIs();
      loadOverviewAnalytics();
      loadOrders();
    } else {
      showToast(json.error ? json.error.message : 'Order placement failed.', 'error');
    }
  } catch (err) {
    showToast('Order creation failed', 'error');
  }
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const catId = document.getElementById('product-category-select').value;
  const name = document.getElementById('product-name-input').value;
  const brand = document.getElementById('product-brand-input').value;
  const price = document.getElementById('product-price-input').value;
  const stock = document.getElementById('product-stock-input').value;
  const imageUrl = document.getElementById('product-image-input')?.value;

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: catId,
        product_name: name,
        brand: brand,
        price: price,
        initial_stock: stock,
        image_url: imageUrl
      })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Product '${json.data.product_name}' created!`, 'success');
      closeModal('modal-product');
      loadDashboardKPIs();
      loadProducts();
    } else {
      showToast(json.error ? json.error.message : 'Failed to create product.', 'error');
    }
  } catch (err) {
    showToast('Product creation failed', 'error');
  }
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('user-name-input').value;
  const email = document.getElementById('user-email-input').value;
  const password = document.getElementById('user-password-input').value;
  const phone = document.getElementById('user-phone-input').value;

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      showToast(`Customer '${json.data.name}' registered!`, 'success');
      closeModal('modal-user');
      loadDashboardKPIs();
      loadCustomers();
    } else {
      showToast(json.error ? json.error.message : 'Failed to register customer.', 'error');
    }
  } catch (err) {
    showToast('Customer registration failed', 'error');
  }
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('review-user-select').value;
  const prodId = document.getElementById('review-product-select').value;
  const rating = document.getElementById('review-rating-select').value;
  const comment = document.getElementById('review-comment-input').value;

  try {
    const res = await fetch(`/api/products/${prodId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, rating, comment })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      showToast('Review submitted successfully!', 'success');
      closeModal('modal-review');
      loadReviews();
    } else {
      showToast(json.error ? json.error.message : 'Failed to submit review.', 'error');
    }
  } catch (err) {
    showToast('Review submission failed', 'error');
  }
}
