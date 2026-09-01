/**
 * E-Commerce Customer Storefront - JavaScript SPA Controller
 */

let pendingActionAfterAuth = null;

document.addEventListener('DOMContentLoaded', () => {
  checkCustomerAuth();
  setupNavigation();
  setupModals();
  loadProducts();
  populateCustomerSelects();
});

// Customer Session State
function checkCustomerAuth() {
  const userJson = localStorage.getItem('customer_user');
  const unloggedDiv = document.getElementById('auth-unlogged-actions');
  const loggedDiv = document.getElementById('auth-logged-actions');
  const nameSpan = document.getElementById('logged-customer-name');

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (unloggedDiv) unloggedDiv.style.display = 'none';
      if (loggedDiv) loggedDiv.style.display = 'flex';
      if (nameSpan) nameSpan.innerHTML = `<i class="fa-solid fa-user-check"></i> Hi, ${user.name}`;
      return user;
    } catch (e) {}
  }

  if (unloggedDiv) unloggedDiv.style.display = 'flex';
  if (loggedDiv) loggedDiv.style.display = 'none';
  return null;
}

// Require Customer Auth Wrapper
function requireCustomerAuth(actionFn) {
  const loggedUser = checkCustomerAuth();
  if (loggedUser) {
    actionFn(loggedUser);
  } else {
    pendingActionAfterAuth = actionFn;
    openModal('modal-auth-required');
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

// Store Navigation Tabs
function setupNavigation() {
  const navCatalog = document.getElementById('nav-catalog');
  const navMyOrders = document.getElementById('nav-my-orders');
  const viewCatalog = document.getElementById('view-catalog');
  const viewMyOrders = document.getElementById('view-my-orders');

  navCatalog?.addEventListener('click', () => {
    navCatalog.classList.add('active');
    navMyOrders.classList.remove('active');
    viewCatalog.style.display = 'block';
    viewMyOrders.style.display = 'none';
  });

  navMyOrders?.addEventListener('click', () => {
    requireCustomerAuth(async (loggedUser) => {
      navMyOrders.classList.add('active');
      navCatalog.classList.remove('active');
      viewCatalog.style.display = 'none';
      viewMyOrders.style.display = 'block';
      await loadCustomerOrdersDropdown();

      const select = document.getElementById('my-orders-user-select');
      if (select) select.value = loggedUser.user_id;
      loadCustomerOrderHistory(loggedUser.user_id);
    });
  });

  document.getElementById('my-orders-user-select')?.addEventListener('change', (e) => {
    const userId = e.target.value;
    if (userId) loadCustomerOrderHistory(userId);
  });
}

// Modal Handlers
function setupModals() {
  const modalOverlays = document.querySelectorAll('.modal-overlay');

  document.getElementById('btn-open-customer-login-modal')?.addEventListener('click', () => {
    openModal('modal-customer-login');
  });

  document.getElementById('btn-open-user-modal')?.addEventListener('click', () => {
    openModal('modal-user');
  });

  document.getElementById('link-switch-to-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal('modal-customer-login');
    openModal('modal-user');
  });

  // Auth Required Gate Buttons
  document.getElementById('btn-auth-required-login')?.addEventListener('click', () => {
    closeModal('modal-auth-required');
    openModal('modal-customer-login');
  });

  document.getElementById('btn-auth-required-register')?.addEventListener('click', () => {
    closeModal('modal-auth-required');
    openModal('modal-user');
  });

  document.getElementById('btn-open-review-modal')?.addEventListener('click', () => {
    requireCustomerAuth(async () => {
      await populateReviewModalSelects();
      openModal('modal-review');
    });
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
  document.getElementById('form-customer-login')?.addEventListener('submit', handleCustomerLoginSubmit);
  document.getElementById('form-checkout')?.addEventListener('submit', handleCheckoutSubmit);
  document.getElementById('form-create-user')?.addEventListener('submit', handleUserSubmit);
  document.getElementById('form-create-review')?.addEventListener('submit', handleReviewSubmit);

  // Logout Button
  document.getElementById('btn-customer-logout')?.addEventListener('click', () => {
    localStorage.removeItem('customer_user');
    localStorage.removeItem('customer_token');
    checkCustomerAuth();
    showToast('Logged out cleanly.', 'success');
  });
}

// Handle Customer Login Form Submit
async function handleCustomerLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('login-email-input').value;
  const password = document.getElementById('login-password-input').value;

  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const json = await res.json();
    if (res.ok && json.success) {
      localStorage.setItem('customer_user', JSON.stringify(json.data));
      localStorage.setItem('customer_token', json.token);
      showToast(`Welcome back, ${json.data.name}!`, 'success');
      closeModal('modal-customer-login');
      const user = checkCustomerAuth();
      populateCustomerSelects();

      if (typeof pendingActionAfterAuth === 'function') {
        const action = pendingActionAfterAuth;
        pendingActionAfterAuth = null;
        action(user);
      }
    } else {
      showToast(json.error ? json.error.message : 'Invalid email or password.', 'error');
    }
  } catch (err) {
    showToast('Login failed', 'error');
  }
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Restore Catalog Action
async function restoreProductCatalog() {
  const grid = document.getElementById('store-product-grid');
  if (grid) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px; color:var(--accent-amber);"></i><br><br>Restoring catalog products and inventory...</div>';
  }

  try {
    const res = await fetch('/api/products/seed', { method: 'POST' });
    const json = await res.json();

    if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
      window.storeProductsCache = json.data;
      renderProductGrid(json.data);
      setupCategoryPills();
      showToast('Product catalog restored with default items and inventory stock!', 'success');
      return;
    } else {
      const errMsg = (json && json.error && json.error.message) ? json.error.message : 'Failed to restore catalog products.';
      showToast(errMsg, 'error');
    }
  } catch (e) {
    showToast('Catalog restoration connection error.', 'error');
  }

  // Attempt standard load if seed attempt did not complete
  await loadProducts(false);
}

// Load Product Catalog Grid with auto-retry
async function loadProducts(allowAutoRetry = true) {
  const grid = document.getElementById('store-product-grid');

  try {
    const res = await fetch('/api/products');
    const json = await res.json();

    if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
      window.storeProductsCache = json.data;
      renderProductGrid(json.data);
      setupCategoryPills();
      return;
    }

    if (res.ok && json.success && Array.isArray(json.data) && json.data.length === 0) {
      console.log('Catalog empty on fetch. Attempting automatic restoration...');
      const seedRes = await fetch('/api/products/seed', { method: 'POST' });
      const seedJson = await seedRes.json();

      if (seedRes.ok && seedJson.success && Array.isArray(seedJson.data) && seedJson.data.length > 0) {
        window.storeProductsCache = seedJson.data;
        renderProductGrid(seedJson.data);
        setupCategoryPills();
        return;
      }
    }

    throw new Error((json && json.error && json.error.message) ? json.error.message : 'Database connection error.');
  } catch (e) {
    console.warn('Failed to load products:', e.message);

    if (allowAutoRetry) {
      console.log('Auto-retrying catalog fetch in 1 second...');
      setTimeout(() => loadProducts(false), 1000);
      return;
    }

    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:40px; background:var(--bg-main); border:1px dashed var(--border-color); border-radius:var(--radius-lg);">
          <p style="color:var(--text-secondary); font-size:14px; margin-bottom:14px;"><i class="fa-solid fa-triangle-exclamation" style="font-size:24px; color:var(--accent-amber);"></i><br>Unable to connect to product catalog database.<br><small style="color:var(--text-muted); font-size:12px;">(${e.message || 'Server Error'})</small></p>
          <button class="btn btn-details" onclick="restoreProductCatalog()" style="display:inline-flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-rotate"></i> Re-connect & Restore Catalog
          </button>
        </div>
      `;
    }
  }
}


function renderProductGrid(products) {
  const grid = document.getElementById('store-product-grid');
  if (products.length === 0) {

    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">No products match your search or filter.</p>';
    return;
  }

  grid.innerHTML = products.map(p => {
    const stockBadge = p.stock_quantity < 35 
      ? `<span class="product-stock" style="background:#fee2e2; color:#b91c1c;">Low Stock (${p.stock_quantity})</span>`
      : `<span class="product-stock">${p.stock_quantity} available</span>`;

    const safeName = p.product_name.replace(/'/g, "\\'");
    const imgHtml = p.image_url 
      ? `<div class="product-card-image"><img src="${p.image_url}" alt="${safeName}" onerror="this.src='/images/iphone17.jpg'"></div>`
      : `<div class="product-card-image" style="background:#fef3c7; color:#b45309; font-size:36px;"><i class="fa-solid fa-box-open"></i></div>`;

    return `
      <div class="product-card">
        ${imgHtml}
        <div class="product-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="product-brand">${p.brand || 'Featured Brand'}</span>
            <small style="font-size:11px; font-weight:700; color:var(--text-muted); uppercase;">${p.category_name}</small>
          </div>
          <h3 class="product-name">${p.product_name}</h3>
          <p class="product-desc">${p.description || 'Premium quality product with store warranty.'}</p>
          
          <div class="product-meta">
            <span class="product-price">${formatCurrency(p.price)}</span>
            ${stockBadge}
          </div>

          <div class="product-actions">
            <button class="btn btn-details" onclick="triggerViewDetails(${p.product_id})">
              <i class="fa-solid fa-eye"></i> Details
            </button>
            <button class="btn btn-buy" onclick="triggerBuyNow(${p.product_id}, '${safeName}')">
              <i class="fa-solid fa-cart-shopping"></i> Buy Now
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Intercept Details Click with Auth Check
function triggerViewDetails(id) {
  requireCustomerAuth(() => {
    viewProductDetails(id);
  });
}

// Intercept Buy Now Click with Auth Check
function triggerBuyNow(productId, productName) {
  requireCustomerAuth(() => {
    openCheckoutModal(productId, productName);
  });
}

// Category Filter Pills
function setupCategoryPills() {
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const catTarget = pill.getAttribute('data-category');
      if (!window.storeProductsCache) return;

      if (catTarget === 'all') {
        renderProductGrid(window.storeProductsCache);
      } else {
        const catId = parseInt(catTarget, 10);
        const filtered = window.storeProductsCache.filter(p => p.category_id === catId);
        renderProductGrid(filtered);
      }
    });
  });
}

// Search Filter Input
document.getElementById('store-search-input')?.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!window.storeProductsCache) return;

  const filtered = window.storeProductsCache.filter(p => 
    p.product_name.toLowerCase().includes(query) || 
    (p.brand && p.brand.toLowerCase().includes(query)) ||
    p.category_name.toLowerCase().includes(query)
  );
  renderProductGrid(filtered);
});

// View Product Details Custom UI Popup
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
                <span style="color:var(--accent-amber); font-weight:700;">⭐ ${r.rating}/5</span>
              </div>
              <p style="font-size:12.5px; color:var(--text-secondary);">"${r.comment || 'No comment.'}"</p>
              <small style="font-size:10.5px; color:var(--text-muted);">${new Date(r.review_date).toLocaleDateString()}</small>
            </div>
          `).join('')
        : '<p style="font-size:13px; color:var(--text-muted); font-style:italic;">No reviews written yet.</p>';

      const content = document.getElementById('product-details-content');
      const imgDetail = p.image_url ? `<img src="${p.image_url}" style="width:100%; max-height:220px; object-fit:cover; border-radius:12px; margin-bottom:14px; border:1px solid var(--border-color);" alt="${p.product_name}">` : '';

      content.innerHTML = `
        <div style="margin-bottom:16px;">
          ${imgDetail}
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h3 style="font-size:18px; font-weight:800;">${p.product_name}</h3>
            <span style="font-size:11px; font-weight:700; background:var(--accent-yellow-light); color:var(--accent-yellow-dark); padding:4px 10px; border-radius:20px;">${p.category_name}</span>
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
            <i class="fa-solid fa-comments" style="color:var(--accent-amber);"></i> Customer Reviews (${p.reviews_count})
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

// Open Checkout Modal
async function openCheckoutModal(productId, productName) {
  document.getElementById('checkout-product-id').value = productId;
  document.getElementById('checkout-product-name').value = productName;
  await populateCustomerSelects();

  const loggedUser = checkCustomerAuth();
  if (loggedUser) {
    const select = document.getElementById('checkout-user-select');
    if (select) select.value = loggedUser.user_id;
  }

  openModal('modal-checkout');
}

// Populate Customer Select Dropdown
async function populateCustomerSelects() {
  const checkoutSelect = document.getElementById('checkout-user-select');
  try {
    const res = await fetch('/api/admin/customers');
    const json = await res.json();
    if (json.success && json.data.length > 0) {
      if (checkoutSelect) {
        checkoutSelect.innerHTML = json.data.map(u => `<option value="${u.user_id}">${u.customer_name} (${u.email})</option>`).join('');
      }
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
      const loggedUser = checkCustomerAuth();
      if (loggedUser && userSelect) userSelect.value = loggedUser.user_id;
    }

    if (prodJson.success) {
      prodSelect.innerHTML = prodJson.data.map(p => `<option value="${p.product_id}">${p.product_name}</option>`).join('');
    }
  } catch (e) {}
}

// Handle Checkout Form Submit
async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const userId = document.getElementById('checkout-user-select').value;
  const prodId = document.getElementById('checkout-product-id').value;
  const qty = parseInt(document.getElementById('checkout-qty-input').value, 10);
  const paymentMethod = document.getElementById('checkout-payment-select').value;

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
      closeModal('modal-checkout');
      loadProducts();
    } else {
      showToast(json.error ? json.error.message : 'Order placement failed.', 'error');
    }
  } catch (err) {
    showToast('Order creation failed', 'error');
  }
}

// Handle User Registration Submit
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
      showToast(`Account '${json.data.name}' registered! Logged in automatically.`, 'success');
      localStorage.setItem('customer_user', JSON.stringify(json.data));
      localStorage.setItem('customer_token', `customer-token-${json.data.user_id}`);
      closeModal('modal-user');
      const user = checkCustomerAuth();
      populateCustomerSelects();

      if (typeof pendingActionAfterAuth === 'function') {
        const action = pendingActionAfterAuth;
        pendingActionAfterAuth = null;
        action(user);
      }
    } else {
      showToast(json.error ? json.error.message : 'Failed to register customer.', 'error');
    }
  } catch (err) {
    showToast('Customer registration failed', 'error');
  }
}

// Handle Review Submit
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
      loadProducts();
    } else {
      showToast(json.error ? json.error.message : 'Failed to submit review.', 'error');
    }
  } catch (err) {
    showToast('Review submission failed', 'error');
  }
}

// Load Customer Orders Dropdown
async function loadCustomerOrdersDropdown() {
  const select = document.getElementById('my-orders-user-select');
  try {
    const res = await fetch('/api/admin/customers');
    const json = await res.json();
    if (json.success && json.data.length > 0) {
      select.innerHTML = '<option value="">-- Choose Customer Profile --</option>' + 
        json.data.map(u => `<option value="${u.user_id}">${u.customer_name} (${u.email})</option>`).join('');
    }
  } catch (e) {}
}

// Load Selected Customer Order History
async function loadCustomerOrderHistory(userId) {
  try {
    const res = await fetch(`/api/users/${userId}/orders`);
    const json = await res.json();

    const body = document.getElementById('my-orders-table-body');
    if (json.success && json.data.length > 0) {
      body.innerHTML = json.data.map(o => `
        <tr>
          <td style="padding:12px 16px;">#${o.order_id}</td>
          <td style="padding:12px 16px;">${new Date(o.order_date).toLocaleString('en-IN')}</td>
          <td style="padding:12px 16px;"><span class="product-stock" style="background:#dcfce7; color:#15803d;">${o.status}</span></td>
          <td style="padding:12px 16px; font-weight:700; color:var(--accent-yellow-dark);">${formatCurrency(o.total_amount)}</td>
          <td style="padding:12px 16px;">
            <button class="btn btn-details" onclick="viewOrderDetails(${o.order_id})" style="padding:4px 10px; font-size:11.5px;">
              <i class="fa-solid fa-receipt"></i> Details
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      body.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px;">No purchase orders found for this customer account.</td></tr>';
    }
  } catch (e) {
    console.error('Failed to load user orders:', e);
  }
}

// View Order Details Custom UI Popup
async function viewOrderDetails(orderId) {
  try {
    const res = await fetch(`/api/orders/${orderId}`);
    const json = await res.json();

    if (json.success) {
      const o = json.data;
      const itemsRowsHtml = o.items.map(i => `
        <tr>
          <td style="padding:8px 12px;"><strong>${i.product_name}</strong></td>
          <td style="padding:8px 12px;">x${i.quantity}</td>
          <td style="padding:8px 12px;">${formatCurrency(i.unit_price)}</td>
          <td style="padding:8px 12px; font-weight:700;">${formatCurrency(i.item_total)}</td>
        </tr>
      `).join('');

      const paymentBadge = o.payment 
        ? `<span style="font-size:11px; font-weight:700; background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:20px;"><i class="fa-solid fa-credit-card"></i> ${o.payment.payment_method} (${o.payment.payment_status})</span>`
        : `<span style="font-size:11px; font-weight:700; background:#fef3c7; color:#b45309; padding:4px 10px; border-radius:20px;">Payment Pending</span>`;

      const content = document.getElementById('order-details-content');
      content.innerHTML = `
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div>
              <h3 style="font-size:17px; font-weight:800;">Order #${o.order_id}</h3>
              <small style="color:var(--text-muted);">${new Date(o.order_date).toLocaleString()}</small>
            </div>
            <span style="font-size:11px; font-weight:700; background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:20px;">${o.status}</span>
          </div>

          <div style="background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px; margin-bottom:14px;">
            <strong style="font-size:13.5px;">Customer: ${o.customer_name}</strong>
            <p style="font-size:12px; color:var(--text-secondary);">${o.customer_email}</p>
          </div>

          <h4 style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-secondary); margin-bottom:8px;">Order Items</h4>
          <div class="table-responsive" style="margin-bottom:14px;">
            <table style="width:100%; border-collapse:collapse; font-size:12.5px;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:8px 12px; text-align:left;">Product</th>
                  <th style="padding:8px 12px; text-align:left;">Qty</th>
                  <th style="padding:8px 12px; text-align:left;">Unit Price</th>
                  <th style="padding:8px 12px; text-align:left;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
              </tbody>
            </table>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; background:var(--accent-yellow-light); border:1px solid rgba(245, 158, 11, 0.4); border-radius:var(--radius-md); padding:12px 16px; margin-bottom:14px;">
            <span style="font-weight:700; color:var(--accent-yellow-dark);">Grand Total</span>
            <strong style="font-size:18px; color:var(--accent-yellow-dark);">${formatCurrency(o.total_amount)}</strong>
          </div>

          <div>
            ${paymentBadge}
          </div>
        </div>
      `;

      openModal('modal-order-details');
    }
  } catch (e) {
    showToast('Failed to fetch order details', 'error');
  }
}
