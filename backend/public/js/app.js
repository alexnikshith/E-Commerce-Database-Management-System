/**
 * E-Commerce DBMS Dashboard - Interactive JavaScript SPA Controller
 */

document.addEventListener('DOMContentLoaded', () => {
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

  // Initial Load
  loadDashboardKPIs();
  loadOverviewAnalytics();
  loadProducts();
});

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
  const color = type === 'success' ? 'var(--success)' : 'var(--danger)';
  
  toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${color}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal Handlers
function setupModals() {
  const modalOverlays = document.querySelectorAll('.modal-overlay');
  
  document.getElementById('btn-open-order-modal').addEventListener('click', async () => {
    await populateOrderModalSelects();
    openModal('modal-order');
  });

  document.getElementById('btn-open-product-modal').addEventListener('click', async () => {
    await populateCategorySelect('product-category-select');
    openModal('modal-product');
  });

  document.getElementById('btn-open-user-modal').addEventListener('click', () => {
    openModal('modal-user');
  });

  document.getElementById('btn-open-review-modal').addEventListener('click', async () => {
    await populateReviewModalSelects();
    openModal('modal-review');
  });

  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      closeModal(overlay.id);
    });
  });

  modalOverlays.forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });

  // Submit Forms
  document.getElementById('form-create-order').addEventListener('submit', handleOrderSubmit);
  document.getElementById('form-create-product').addEventListener('submit', handleProductSubmit);
  document.getElementById('form-create-user').addEventListener('submit', handleUserSubmit);
  document.getElementById('form-create-review').addEventListener('submit', handleReviewSubmit);
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
          <td style="color: var(--success); font-weight:700;">${formatCurrency(p.total_revenue)}</td>
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
          <td style="color: var(--success); font-weight:700;">${formatCurrency(c.category_revenue)}</td>
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

    return `
      <tr>
        <td>#${p.product_id}</td>
        <td><strong>${p.product_name}</strong><br><small style="color:var(--text-muted);">${p.description || ''}</small></td>
        <td><span class="badge badge-info">${p.category_name}</span></td>
        <td>${p.brand || 'N/A'}</td>
        <td style="font-weight:700;">${formatCurrency(p.price)}</td>
        <td>${stockBadge}</td>
        <td>
          <button class="btn btn-secondary" onclick="viewProductDetails(${p.product_id})" style="padding: 4px 10px; font-size: 11px;">
            <i class="fa-solid fa-eye"></i> Details
          </button>
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

// View Product Details
async function viewProductDetails(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    const json = await res.json();

    if (json.success) {
      const p = json.data;
      let reviewText = p.reviews.length > 0
        ? p.reviews.map(r => `⭐ ${r.rating}/5 by ${r.reviewer_name}: "${r.comment || ''}"`).join('\n')
        : 'No reviews yet.';
      alert(`Product Details (#${p.product_id}):\nName: ${p.product_name}\nCategory: ${p.category_name}\nBrand: ${p.brand || 'N/A'}\nPrice: ${formatCurrency(p.price)}\nStock: ${p.stock_quantity}\n\nReviews (${p.reviews_count}):\n${reviewText}`);
    }
  } catch (e) {
    showToast('Failed to load product details', 'error');
  }
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
          <td style="color: var(--success); font-weight:700;">${formatCurrency(o.total_amount)}</td>
          <td>
            <button class="btn btn-secondary" onclick="viewOrderDetails(${o.order_id})" style="padding: 4px 10px; font-size: 11px;">
              <i class="fa-solid fa-list-check"></i> View Order
            </button>
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

// View Single Order Line Items
async function viewOrderDetails(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    const json = await res.json();

    if (json.success) {
      const o = json.data;
      const itemsList = o.items.map(i => `- ${i.product_name} x${i.quantity} @ ${formatCurrency(i.unit_price)} = ${formatCurrency(i.item_total)}`).join('\n');
      const paymentInfo = o.payment ? `Payment: ${o.payment.payment_method} (${o.payment.payment_status})` : 'Payment: Pending';
      const shipmentInfo = o.shipment ? `Shipment: ${o.shipment.carrier} - ${o.shipment.tracking_number} (${o.shipment.shipment_status})` : 'Shipment: Processing';

      alert(`Order Header #${o.order_id}\nCustomer: ${o.customer_name} (${o.customer_email})\nDate: ${new Date(o.order_date).toLocaleString()}\nStatus: ${o.status}\nTotal: ${formatCurrency(o.total_amount)}\n\nOrder Items:\n${itemsList}\n\n${paymentInfo}\n${shipmentInfo}`);
    }
  } catch (e) {
    showToast('Failed to fetch order details', 'error');
  }
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
      body.innerHTML = json.data.map(c => `
        <tr>
          <td>#${c.user_id}</td>
          <td><strong>${c.customer_name}</strong></td>
          <td>${c.email}</td>
          <td><strong>${c.total_orders}</strong> orders</td>
          <td style="color: var(--success); font-weight:700;">${formatCurrency(c.total_spent)}</td>
        </tr>
      `).join('');
    } else {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center;">No registered customers found.</td></tr>';
    }
  } catch (e) {
    console.error('Failed to load customers:', e);
  }
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
            <div style="background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; margin-bottom:12px;">
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

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: catId,
        product_name: name,
        brand: brand,
        price: price,
        initial_stock: stock
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
