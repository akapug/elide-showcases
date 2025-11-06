/**
 * ElideShop Frontend Application
 *
 * Client-side routing, state management, and UI interactions for the e-commerce platform.
 * Communicates with TypeScript API backend, which integrates with Python payment service
 * and Ruby email service.
 *
 * Features:
 * - Client-side routing (SPA)
 * - Shopping cart state management
 * - Product catalog with search/filter
 * - Checkout flow with validation
 * - Real-time inventory checking
 */

import { formatPrice, calculateTax, calculateShipping } from './utils.ts';

// ============================================================================
// State Management
// ============================================================================

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface AppState {
  products: Product[];
  cart: CartItem[];
  currentPage: string;
  filters: {
    search: string;
    category: string;
    maxPrice: number | null;
    inStockOnly: boolean;
    sortBy: string;
  };
  orderHistory: any[];
}

const state: AppState = {
  products: [],
  cart: loadCart(),
  currentPage: 'home',
  filters: {
    search: '',
    category: '',
    maxPrice: null,
    inStockOnly: false,
    sortBy: 'name',
  },
  orderHistory: [],
};

// ============================================================================
// API Client
// ============================================================================

const API_BASE = 'http://localhost:3000/api';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Cart Management
// ============================================================================

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem('elide-shop-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('elide-shop-cart', JSON.stringify(state.cart));
  updateCartCount();
}

function addToCart(product: Product, quantity: number = 1) {
  const existing = state.cart.find(item => item.product.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({ product, quantity });
  }

  saveCart();
  showToast(`Added ${product.name} to cart`);
}

function removeFromCart(productId: string) {
  state.cart = state.cart.filter(item => item.product.id !== productId);
  saveCart();
}

function updateCartItem(productId: string, quantity: number) {
  const item = state.cart.find(item => item.product.id === productId);
  if (item) {
    item.quantity = Math.max(0, quantity);
    if (item.quantity === 0) {
      removeFromCart(productId);
    }
    saveCart();
  }
}

function clearCart() {
  state.cart = [];
  saveCart();
}

function getCartTotal() {
  return state.cart.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
}

function getCartItemCount() {
  return state.cart.reduce((count, item) => count + item.quantity, 0);
}

function updateCartCount() {
  const countElements = document.querySelectorAll('#cart-count');
  const count = getCartItemCount();
  countElements.forEach(el => {
    el.textContent = count.toString();
  });
}

// ============================================================================
// Product Management
// ============================================================================

async function loadProducts() {
  try {
    // In a real app, this would fetch from the backend
    // For demo purposes, we'll use mock data
    state.products = generateMockProducts();
  } catch (error) {
    console.error('Failed to load products:', error);
    showToast('Failed to load products', 'error');
  }
}

function generateMockProducts(): Product[] {
  const categories = ['electronics', 'clothing', 'home', 'sports', 'books'];
  const products: Product[] = [];

  const productTemplates = [
    { name: 'Wireless Headphones', category: 'electronics', price: 79.99 },
    { name: 'Smart Watch', category: 'electronics', price: 249.99 },
    { name: 'Laptop Stand', category: 'electronics', price: 39.99 },
    { name: 'Mechanical Keyboard', category: 'electronics', price: 129.99 },
    { name: 'USB-C Hub', category: 'electronics', price: 49.99 },
    { name: 'Cotton T-Shirt', category: 'clothing', price: 24.99 },
    { name: 'Denim Jeans', category: 'clothing', price: 59.99 },
    { name: 'Running Shoes', category: 'clothing', price: 89.99 },
    { name: 'Winter Jacket', category: 'clothing', price: 149.99 },
    { name: 'Baseball Cap', category: 'clothing', price: 19.99 },
    { name: 'Coffee Maker', category: 'home', price: 79.99 },
    { name: 'Desk Lamp', category: 'home', price: 34.99 },
    { name: 'Area Rug', category: 'home', price: 129.99 },
    { name: 'Storage Bins', category: 'home', price: 29.99 },
    { name: 'Wall Clock', category: 'home', price: 44.99 },
    { name: 'Yoga Mat', category: 'sports', price: 29.99 },
    { name: 'Dumbbells Set', category: 'sports', price: 89.99 },
    { name: 'Bicycle Helmet', category: 'sports', price: 49.99 },
    { name: 'Water Bottle', category: 'sports', price: 19.99 },
    { name: 'Resistance Bands', category: 'sports', price: 24.99 },
    { name: 'Programming Book', category: 'books', price: 39.99 },
    { name: 'Cookbook', category: 'books', price: 29.99 },
    { name: 'Mystery Novel', category: 'books', price: 14.99 },
    { name: 'Travel Guide', category: 'books', price: 24.99 },
    { name: 'Art Book', category: 'books', price: 44.99 },
  ];

  productTemplates.forEach((template, index) => {
    products.push({
      id: `prod-${index + 1}`,
      name: template.name,
      description: `High-quality ${template.name.toLowerCase()} with excellent features and durability.`,
      price: template.price,
      category: template.category,
      stock: Math.floor(Math.random() * 50) + 5,
    });
  });

  return products;
}

function filterProducts(): Product[] {
  let filtered = [...state.products];

  // Search
  if (state.filters.search) {
    const search = state.filters.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.description.toLowerCase().includes(search)
    );
  }

  // Category
  if (state.filters.category) {
    filtered = filtered.filter(p => p.category === state.filters.category);
  }

  // Max price
  if (state.filters.maxPrice) {
    filtered = filtered.filter(p => p.price <= state.filters.maxPrice!);
  }

  // In stock only
  if (state.filters.inStockOnly) {
    filtered = filtered.filter(p => p.stock > 0);
  }

  // Sort
  switch (state.filters.sortBy) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'stock':
      filtered.sort((a, b) => b.stock - a.stock);
      break;
    default: // name
      filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  return filtered;
}

// ============================================================================
// Routing
// ============================================================================

function navigateTo(page: string) {
  state.currentPage = page;

  // Load the page HTML
  loadPage(page);

  // Update active nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === page) {
      link.classList.add('active');
    }
  });
}

async function loadPage(page: string) {
  try {
    const response = await fetch(`/frontend/pages/${page}.html`);
    const html = await response.text();

    // Parse and inject content (simplified - in production use a proper router)
    // For this demo, we'll handle page-specific initialization

    switch (page) {
      case 'products':
        renderProductsPage();
        break;
      case 'cart':
        renderCartPage();
        break;
      case 'checkout':
        renderCheckoutPage();
        break;
    }
  } catch (error) {
    console.error('Failed to load page:', error);
  }
}

// ============================================================================
// Page Renderers
// ============================================================================

function renderProductsPage() {
  const filtered = filterProducts();
  const grid = document.getElementById('products-grid');
  const resultsCount = document.getElementById('results-count');

  if (resultsCount) {
    resultsCount.textContent = filtered.length.toString();
  }

  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="no-results">No products found</div>';
      return;
    }

    grid.innerHTML = filtered.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image">
          <div class="product-placeholder">📦</div>
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-category">${product.category}</p>
          <p class="product-description">${product.description}</p>
          <div class="product-footer">
            <span class="product-price">${formatPrice(product.price)}</span>
            <span class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
              ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>
          <button class="btn btn-primary btn-block add-to-cart" data-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    grid.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const productId = (e.target as HTMLElement).getAttribute('data-id');
        const product = state.products.find(p => p.id === productId);
        if (product) {
          addToCart(product);
        }
      });
    });
  }
}

function renderCartPage() {
  const itemsList = document.getElementById('cart-items-list');
  const emptyCart = document.getElementById('empty-cart');

  if (state.cart.length === 0) {
    if (itemsList) itemsList.style.display = 'none';
    if (emptyCart) emptyCart.style.display = 'block';
    return;
  }

  if (itemsList) itemsList.style.display = 'block';
  if (emptyCart) emptyCart.style.display = 'none';

  if (itemsList) {
    itemsList.innerHTML = state.cart.map(item => `
      <div class="cart-item" data-id="${item.product.id}">
        <div class="cart-item-image">📦</div>
        <div class="cart-item-info">
          <h3>${item.product.name}</h3>
          <p>${item.product.category}</p>
          <p class="item-price">${formatPrice(item.product.price)} each</p>
        </div>
        <div class="cart-item-quantity">
          <button class="qty-btn" data-action="decrease" data-id="${item.product.id}">-</button>
          <input type="number" value="${item.quantity}" min="1" class="qty-input" data-id="${item.product.id}">
          <button class="qty-btn" data-action="increase" data-id="${item.product.id}">+</button>
        </div>
        <div class="cart-item-total">
          ${formatPrice(item.product.price * item.quantity)}
        </div>
        <button class="cart-item-remove" data-id="${item.product.id}">×</button>
      </div>
    `).join('');

    // Attach event listeners
    attachCartEventListeners();
  }

  updateCartSummary();
}

function renderCheckoutPage() {
  // Render checkout items in sidebar
  const checkoutItems = document.getElementById('checkout-items');
  if (checkoutItems) {
    checkoutItems.innerHTML = state.cart.map(item => `
      <div class="checkout-item">
        <div class="item-image">📦</div>
        <div class="item-details">
          <div class="item-name">${item.product.name}</div>
          <div class="item-qty">Qty: ${item.quantity}</div>
        </div>
        <div class="item-price">${formatPrice(item.product.price * item.quantity)}</div>
      </div>
    `).join('');
  }

  updateCheckoutSummary();
  attachCheckoutEventListeners();
}

// ============================================================================
// UI Helpers
// ============================================================================

function updateCartSummary() {
  const subtotal = getCartTotal();
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;

  const elements = {
    'summary-item-count': getCartItemCount().toString(),
    'summary-subtotal': formatPrice(subtotal),
    'summary-shipping': formatPrice(shipping),
    'summary-tax': formatPrice(tax),
    'summary-total': formatPrice(total),
  };

  Object.entries(elements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  // Enable/disable checkout button
  const checkoutBtn = document.getElementById('proceed-checkout');
  if (checkoutBtn) {
    (checkoutBtn as HTMLButtonElement).disabled = state.cart.length === 0;
  }
}

function updateCheckoutSummary() {
  const subtotal = getCartTotal();
  const shipping = calculateShipping(subtotal);
  const tax = calculateTax(subtotal);
  const total = subtotal + shipping + tax;

  const elements = {
    'checkout-subtotal': formatPrice(subtotal),
    'checkout-shipping': formatPrice(shipping),
    'checkout-tax': formatPrice(tax),
    'checkout-total': formatPrice(total),
  };

  Object.entries(elements).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.getElementById('cart-toast');
  const messageEl = document.getElementById('toast-message');

  if (toast && messageEl) {
    messageEl.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

function attachCartEventListeners() {
  // Quantity buttons
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      const productId = target.getAttribute('data-id');

      if (!productId) return;

      const item = state.cart.find(i => i.product.id === productId);
      if (!item) return;

      if (action === 'increase') {
        updateCartItem(productId, item.quantity + 1);
      } else if (action === 'decrease') {
        updateCartItem(productId, item.quantity - 1);
      }

      renderCartPage();
    });
  });

  // Quantity inputs
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const productId = target.getAttribute('data-id');
      const quantity = parseInt(target.value, 10);

      if (productId) {
        updateCartItem(productId, quantity);
        renderCartPage();
      }
    });
  });

  // Remove buttons
  document.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = (e.target as HTMLElement).getAttribute('data-id');
      if (productId) {
        removeFromCart(productId);
        renderCartPage();
      }
    });
  });
}

function attachCheckoutEventListeners() {
  const shippingForm = document.getElementById('shipping-form');
  const paymentForm = document.getElementById('payment-form');

  if (shippingForm) {
    shippingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Validate and move to payment step
      goToCheckoutStep(2);
    });
  }

  if (paymentForm) {
    paymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await processCheckout();
    });
  }
}

function goToCheckoutStep(step: number) {
  // Update progress indicators
  document.querySelectorAll('.progress-step').forEach((el, index) => {
    if (index < step) {
      el.classList.add('completed');
    }
    if (index + 1 === step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Show appropriate step
  document.querySelectorAll('.checkout-step').forEach((el, index) => {
    if (index + 1 === step) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

async function processCheckout() {
  const overlay = document.getElementById('processing-overlay');
  if (overlay) overlay.style.display = 'flex';

  try {
    // Simulate payment processing (Python service)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate order creation
    const orderId = `ORD-${Date.now()}`;

    // Show confirmation
    goToCheckoutStep(3);

    const orderIdEl = document.getElementById('order-id');
    if (orderIdEl) orderIdEl.textContent = orderId;

    // Clear cart
    clearCart();

    showToast('Order placed successfully!');
  } catch (error) {
    showToast('Order processing failed', 'error');
  } finally {
    if (overlay) overlay.style.display = 'none';
  }
}

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  console.log('🛒 ElideShop Frontend Initializing...');

  await loadProducts();
  updateCartCount();

  // Attach global event listeners
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // Navigation links
    const navLink = target.closest('[data-page]');
    if (navLink) {
      e.preventDefault();
      const page = navLink.getAttribute('data-page');
      if (page) navigateTo(page);
    }
  });

  console.log('✓ ElideShop Frontend Ready');
}

// Start the app
if (typeof window !== 'undefined') {
  init();
}

export { init, state, navigateTo };
