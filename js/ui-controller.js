// js/ui-controller.js
// Renders products, cart, admin panel, and manages loading states.
// ============================================================

import { 
  fetchProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from './db-logic.js';
import { login, signup, logout, currentUser, isAdmin } from './auth-logic.js';

// ===== DOM references =====
const productGrid = document.getElementById('product-grid');
const productCount = document.getElementById('product-count');
const loader = document.getElementById('global-loader');
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const userGreeting = document.getElementById('user-greeting');
const adminPanel = document.getElementById('admin-panel');
const adminProductList = document.getElementById('admin-product-list');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total-price');
const cartCount = document.getElementById('cart-count');
const authModal = document.getElementById('auth-modal');
const authModalBody = document.getElementById('auth-modal-body');
const productModal = document.getElementById('product-modal');
const productModalBody = document.getElementById('product-modal-body');

// ===== Loading spinner =====
export function showLoader(show) {
  loader.style.display = show ? 'flex' : 'none';
}

// ===== Render products =====
export async function renderProducts() {
  showLoader(true);
  const result = await fetchProducts();
  showLoader(false);
  if (!result.success) {
    productGrid.innerHTML = `<p class="error">Failed to load products: ${result.error}</p>`;
    return;
  }
  const products = result.data;
  if (products.length === 0) {
    productGrid.innerHTML = '<p>No products yet.</p>';
    productCount.textContent = '0 items';
    return;
  }
  productCount.textContent = `${products.length} items`;
  productGrid.innerHTML = products.map(p => `
    <div class="product-card" data-id="${p.id}">
      <img src="${p.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${p.name}" />
      <div class="product-info">
        <h3>${p.name}</h3>
        <p class="price">$${p.price?.toFixed(2) || '0.00'}</p>
        <p class="category">${p.category || 'Uncategorized'}</p>
        <button class="btn btn-primary add-to-cart" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  `).join('');

  // Attach cart listeners
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const product = products.find(p => p.id === id);
      if (product) addToCart(product);
    });
  });

  // Render admin list if admin
  if (isAdmin) renderAdminProducts(products);
}

// ===== Admin product list (with edit/delete) =====
function renderAdminProducts(products) {
  if (!isAdmin) return;
  adminPanel.classList.remove('hidden');
  adminProductList.innerHTML = products.map(p => `
    <div class="admin-product-item">
      <span>${p.name} ($${p.price})</span>
      <div>
        <button class="btn btn-sm btn-outline edit-product" data-id="${p.id}">Edit</button>
        <button class="btn btn-sm btn-danger delete-product" data-id="${p.id}">Delete</button>
      </div>
    </div>
  `).join('');

  // Edit/Delete listeners
  adminProductList.querySelectorAll('.edit-product').forEach(btn => {
    btn.addEventListener('click', () => openProductForm(btn.dataset.id));
  });
  adminProductList.querySelectorAll('.delete-product').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Delete this product?')) {
        showLoader(true);
        const result = await deleteProduct(btn.dataset.id);
        showLoader(false);
        if (result.success) {
          renderProducts(); // refresh
        } else {
          alert('Error: ' + result.error);
        }
      }
    });
  });
}

// ===== Product form (add / edit) =====
async function openProductForm(productId = null) {
  // Fetch product data if editing
  let product = null;
  if (productId) {
    const result = await fetchProducts();
    product = result.data.find(p => p.id === productId);
  }
  const isEditing = !!product;

  productModalBody.innerHTML = `
    <h3>${isEditing ? 'Edit' : 'Add'} Product</h3>
    <form id="product-form">
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="p-name" value="${product?.name || ''}" required />
      </div>
      <div class="form-group">
        <label>Price *</label>
        <input type="number" step="0.01" id="p-price" value="${product?.price || ''}" required />
      </div>
      <div class="form-group">
        <label>Category</label>
        <input type="text" id="p-category" value="${product?.category || ''}" />
      </div>
      <div class="form-group">
        <label>Image URL</label>
        <input type="url" id="p-image" value="${product?.imageUrl || ''}" />
      </div>
      <button type="submit" class="btn btn-primary">${isEditing ? 'Update' : 'Add'} Product</button>
    </form>
  `;

  productModal.classList.remove('hidden');

  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('p-name').value.trim();
    const price = parseFloat(document.getElementById('p-price').value);
    const category = document.getElementById('p-category').value.trim();
    const imageUrl = document.getElementById('p-image').value.trim();

    if (!name || isNaN(price)) {
      alert('Name and price are required.');
      return;
    }

    const data = { name, price, category, imageUrl };
    showLoader(true);
    let result;
    if (isEditing) {
      result = await updateProduct(productId, data);
    } else {
      result = await addProduct(data);
    }
    showLoader(false);
    if (result.success) {
      productModal.classList.add('hidden');
      renderProducts();
    } else {
      alert('Error: ' + result.error);
    }
  });
}

// ===== Cart logic (simple client-side) =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
}

function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    saveCart();
    updateCartUI();
  }
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  cartCount.textContent = totalItems;
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  cartTotal.textContent = `$${totalPrice.toFixed(2)}`;

  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Your cart is empty.</p>';
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <span>${item.name}</span>
        <div>
          <button class="qty-btn" data-id="${item.id}" data-delta="-1">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
          <button class="remove-btn" data-id="${item.id}">✕</button>
        </div>
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    // Attach events
    cartItems.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        updateQuantity(btn.dataset.id, parseInt(btn.dataset.delta));
      });
    });
    cartItems.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
  }
}

// ===== Auth UI =====
export function updateAuthUI(user, admin) {
  if (user) {
    authSection.classList.add('hidden');
    userSection.classList.remove('hidden');
    userGreeting.textContent = `Hello, ${user.displayName || user.email}`;
    if (admin) {
      adminPanel.classList.remove('hidden');
      renderProducts(); // refresh admin list
    } else {
      adminPanel.classList.add('hidden');
    }
  } else {
    authSection.classList.remove('hidden');
    userSection.classList.add('hidden');
    adminPanel.classList.add('hidden');
    cart = [];
    saveCart();
    updateCartUI();
  }
}

// ===== Auth Modal =====
export function openAuthModal(mode = 'login') {
  authModal.classList.remove('hidden');
  authModalBody.innerHTML = `
    <h3>${mode === 'login' ? 'Login' : 'Create Account'}</h3>
    <form id="auth-form">
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="auth-email" required />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="auth-password" required />
      </div>
      <button type="submit" class="btn btn-primary">${mode === 'login' ? 'Login' : 'Sign Up'}</button>
      <p class="auth-switch">${mode === 'login' ? "Don't have an account? " : "Already have an account? "}
        <a href="#" id="auth-switch-link">${mode === 'login' ? 'Sign up' : 'Login'}</a>
      </p>
    </form>
  `;

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    showLoader(true);
    let result;
    if (mode === 'login') {
      result = await login(email, password);
    } else {
      result = await signup(email, password);
      // After signup, optionally create a user doc with role 'user'
      // (This would be better done via Cloud Function, but we'll keep it simple)
      if (result.success) {
        // You could redirect or automatically create the user doc here.
        // For now, we'll just close the modal.
      }
    }
    showLoader(false);
    if (result.success) {
      authModal.classList.add('hidden');
    } else {
      alert('Error: ' + result.error);
    }
  });

  document.getElementById('auth-switch-link').addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(mode === 'login' ? 'signup' : 'login');
  });
}

// ===== Initialization =====
export function initUI() {
  // Toggle cart sidebar
  document.getElementById('cart-toggle').addEventListener('click', () => {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('visible');
  });
  document.getElementById('cart-close').addEventListener('click', () => {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('visible');
  });
  cartOverlay.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('visible');
  });

  // Auth buttons
  document.getElementById('login-btn').addEventListener('click', () => openAuthModal('login'));
  document.getElementById('register-btn').addEventListener('click', () => openAuthModal('signup'));
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await logout();
    updateAuthUI(null, false);
  });

  // Close auth modal
  document.getElementById('auth-modal-close').addEventListener('click', () => {
    authModal.classList.add('hidden');
  });
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) authModal.classList.add('hidden');
  });

  // Close product modal
  document.getElementById('product-modal-close').addEventListener('click', () => {
    productModal.classList.add('hidden');
  });
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) productModal.classList.add('hidden');
  });

  // Add product button (admin)
  document.getElementById('add-product-btn').addEventListener('click', () => openProductForm());

  // Initial render
  renderProducts();
  updateCartUI();
}
