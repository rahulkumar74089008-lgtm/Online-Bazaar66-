/**
 * Online-Bazaar66 - Main Application JavaScript
 * This file contains all the business logic for the e-commerce store
 * Security best practices implemented throughout
 */

// DOM Elements - All elements accessed with null checks
const domElements = {
    // Navigation
    navLinks: document.getElementById('navLinks'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    cartCount: document.getElementById('cartCount'),
    accountLink: document.getElementById('accountLink'),
    userStatus: document.getElementById('userStatus'),
    
    // Authentication
    authModal: document.getElementById('authModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    loginTab: document.getElementById('loginTab'),
    registerTab: document.getElementById('registerTab'),
    authForm: document.getElementById('authForm'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    confirmPasswordInput: document.getElementById('confirmPassword'),
    confirmPasswordGroup: document.getElementById('confirmPasswordGroup'),
    emailError: document.getElementById('emailError'),
    passwordError: document.getElementById('passwordError'),
    confirmPasswordError: document.getElementById('confirmPasswordError'),
    authSubmitBtn: document.getElementById('authSubmitBtn'),
    authToggleText: document.getElementById('authToggleText'),
    authToggleLink: document.getElementById('authToggleLink'),
    modalTitle: document.getElementById('modalTitle'),
    
    // Products
    productsContainer: document.getElementById('productsContainer'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    shopNowBtn: document.getElementById('shopNowBtn'),
    
    // Cart
    cartSidebar: document.getElementById('cartSidebar'),
    closeCartBtn: document.getElementById('closeCartBtn'),
    cartItems: document.getElementById('cartItems'),
    emptyCartMsg: document.getElementById('emptyCartMsg'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    clearCartBtn: document.getElementById('clearCartBtn'),
    
    // Other
    privacyLink: document.getElementById('privacyLink'),
    termsLink: document.getElementById('termsLink')
};

// Initialize Firebase App (config loaded from firebase-config.js)
let auth, db;
let currentUser = null;

// Application State
const appState = {
    isLoginMode: true,
    cart: [],
    products: [],
    isLoading: false
};

// Security Configuration
const SECURITY_CONFIG = {
    MAX_PRODUCT_LOAD: 50,
    PASSWORD_MIN_LENGTH: 6,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PRICE_REGEX: /^\d+(\.\d{1,2})?$/,
    INPUT_SANITIZE_REGEX: /[<>"'`]/g,
    SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutes
};

// Initialize the application
function initApp() {
    console.log('Online-Bazaar66 initializing...');
    
    // Initialize Firebase
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            auth = firebase.auth();
            db = firebase.firestore();
            console.log('Firebase initialized successfully');
        } else {
            console.error('Firebase not loaded properly');
            showError('Authentication service unavailable. Please refresh the page.');
            return;
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Failed to initialize authentication. Please check your connection.');
        return;
    }
    
    // Validate DOM elements exist
    if (!validateDOMElements()) {
        console.error('Critical DOM elements missing');
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Check authentication state
    setupAuthStateListener();
    
    // Load products
    loadProducts();
    
    // Load cart from localStorage (with validation)
    loadCartFromStorage();
    
    // Update UI
    updateCartUI();
    
    console.log('Online-Bazaar66 initialized successfully');
}

// Validate critical DOM elements exist
function validateDOMElements() {
    const criticalElements = [
        'productsContainer', 'authModal', 'cartSidebar', 'cartItems'
    ];
    
    for (const elementId of criticalElements) {
        if (!domElements[elementId]) {
            console.error(`Critical DOM element missing: ${elementId}`);
            return false;
        }
    }
    
    return true;
}

// Set up all event listeners with error handling
function setupEventListeners() {
    try {
        // Mobile menu toggle
        if (domElements.mobileMenuBtn) {
            domElements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }
        
        // Shop Now button
        if (domElements.shopNowBtn) {
            domElements.shopNowBtn.addEventListener('click', () => {
                scrollToSection('products');
            });
        }
        
        // Account link
        if (domElements.accountLink) {
            domElements.accountLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (currentUser) {
                    // Show user menu or logout
                    handleUserMenu();
                } else {
                    openAuthModal();
                }
            });
        }
        
        // Cart link
        const cartLink = document.querySelector('.cart-link');
        if (cartLink) {
            cartLink.addEventListener('click', (e) => {
                e.preventDefault();
                toggleCartSidebar();
            });
        }
        
        // Authentication modal
        if (domElements.closeModalBtn) {
            domElements.closeModalBtn.addEventListener('click', closeAuthModal);
        }
        
        // Modal close on outside click
        if (domElements.authModal) {
            domElements.authModal.addEventListener('click', (e) => {
                if (e.target === domElements.authModal) {
                    closeAuthModal();
                }
            });
        }
        
        // Login/Register tabs
        if (domElements.loginTab) {
            domElements.loginTab.addEventListener('click', () => switchAuthMode(true));
        }
        
        if (domElements.registerTab) {
            domElements.registerTab.addEventListener('click', () => switchAuthMode(false));
        }
        
        // Auth form submission
        if (domElements.authForm) {
            domElements.authForm.addEventListener('submit', handleAuthSubmit);
        }
        
        // Auth toggle link
        if (domElements.authToggleLink) {
            domElements.authToggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                switchAuthMode(!appState.isLoginMode);
            });
        }
        
        // Cart sidebar
        if (domElements.closeCartBtn) {
            domElements.closeCartBtn.addEventListener('click', toggleCartSidebar);
        }
        
        // Checkout button
        if (domElements.checkoutBtn) {
            domElements.checkoutBtn.addEventListener('click', handleCheckout);
        }
        
        // Clear cart button
        if (domElements.clearCartBtn) {
            domElements.clearCartBtn.addEventListener('click', clearCart);
        }
        
        // Privacy and Terms links
        if (domElements.privacyLink) {
            domElements.privacyLink.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Privacy Policy - Your data is secure with us. We never share your personal information.');
            });
        }
        
        if (domElements.termsLink) {
            domElements.termsLink.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Terms of Service - By using Online-Bazaar66, you agree to our secure transaction policies.');
            });
        }
        
        // Close cart on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeCartSidebar();
                closeAuthModal();
            }
        });
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Firebase Authentication State Listener
function setupAuthStateListener() {
    if (!auth) return;
    
    auth.onAuthStateChanged((user) => {
        try {
            currentUser = user;
            updateAuthUI();
            
            if (user) {
                console.log('User logged in:', user.email);
                // Store user session timestamp
                localStorage.setItem('userSession', Date.now().toString());
            } else {
                console.log('User logged out');
                localStorage.removeItem('userSession');
            }
            
            // Check session timeout
            checkSessionTimeout();
            
        } catch (error) {
            console.error('Auth state change error:', error);
        }
    });
}

// Update UI based on authentication state
function updateAuthUI() {
    if (!domElements.userStatus || !domElements.accountLink) return;
    
    if (currentUser) {
        // Sanitize email display to prevent XSS
        const safeEmail = sanitizeInput(currentUser.email || 'User');
        domElements.userStatus.textContent = safeEmail.substring(0, 15) + (safeEmail.length > 15 ? '...' : '');
        domElements.accountLink.title = `Logged in as ${safeEmail}`;
    } else {
        domElements.userStatus.textContent = 'Account';
        domElements.accountLink.title = 'Login or Register';
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    if (!domElements.navLinks) return;
    
    domElements.navLinks.classList.toggle('active');
    
    // Update menu icon
    if (domElements.mobileMenuBtn) {
        const icon = domElements.mobileMenuBtn.querySelector('i');
        if (icon) {
            if (domElements.navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
}

// Open authentication modal
function openAuthModal() {
    if (!domElements.authModal) return;
    
    domElements.authModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Reset form
    if (domElements.authForm) {
        domElements.authForm.reset();
    }
    
    // Clear errors
    clearAuthErrors();
}

// Close authentication modal
function closeAuthModal() {
    if (!domElements.authModal) return;
    
    domElements.authModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset to login mode
    switchAuthMode(true);
}

// Switch between login and register modes
function switchAuthMode(isLoginMode) {
    appState.isLoginMode = isLoginMode;
    
    // Update UI
    if (domElements.loginTab && domElements.registerTab) {
        if (isLoginMode) {
            domElements.loginTab.classList.add('active');
            domElements.registerTab.classList.remove('active');
        } else {
            domElements.loginTab.classList.remove('active');
            domElements.registerTab.classList.add('active');
        }
    }
    
    if (domElements.modalTitle) {
        domElements.modalTitle.textContent = isLoginMode ? 'Login' : 'Register';
    }
    
    if (domElements.authSubmitBtn) {
        domElements.authSubmitBtn.textContent = isLoginMode ? 'Login' : 'Register';
    }
    
    if (domElements.confirmPasswordGroup) {
        domElements.confirmPasswordGroup.style.display = isLoginMode ? 'none' : 'block';
    }
    
    if (domElements.authToggleText && domElements.authToggleLink) {
        if (isLoginMode) {
            domElements.authToggleText.innerHTML = 'Don\'t have an account? <a href="#" id="authToggleLink">Register here</a>';
        } else {
            domElements.authToggleText.innerHTML = 'Already have an account? <a href="#" id="authToggleLink">Login here</a>';
        }
        
        // Reattach event listener to new link
        const newLink = document.getElementById('authToggleLink');
        if (newLink) {
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                switchAuthMode(!appState.isLoginMode);
            });
        }
    }
    
    // Clear errors
    clearAuthErrors();
}

// Clear authentication error messages
function clearAuthErrors() {
    if (domElements.emailError) domElements.emailError.textContent = '';
    if (domElements.passwordError) domElements.passwordError.textContent = '';
    if (domElements.confirmPasswordError) domElements.confirmPasswordError.textContent = '';
}

// Handle authentication form submission
async function handleAuthSubmit(e) {
    e.preventDefault();
    
    if (!domElements.emailInput || !domElements.passwordInput) return;
    
    // Get and sanitize inputs
    const email = sanitizeInput(domElements.emailInput.value.trim());
    const password = domElements.passwordInput.value;
    const confirmPassword = domElements.confirmPasswordInput ? domElements.confirmPasswordInput.value : '';
    
    // Validate inputs
    if (!validateAuthInputs(email, password, confirmPassword)) {
        return;
    }
    
    // Show loading state
    if (domElements.authSubmitBtn) {
        domElements.authSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        domElements.authSubmitBtn.disabled = true;
    }
    
    try {
        if (appState.isLoginMode) {
            // Login
            await auth.signInWithEmailAndPassword(email, password);
            showSuccess('Login successful!');
            closeAuthModal();
        } else {
            // Register
            await auth.createUserWithEmailAndPassword(email, password);
            showSuccess('Registration successful! Welcome to Online-Bazaar66!');
            closeAuthModal();
        }
    } catch (error) {
        console.error('Authentication error:', error);
        
        // User-friendly error messages
        let errorMessage = 'Authentication failed. ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'This email is already registered.';
                if (domElements.emailError) {
                    domElements.emailError.textContent = 'Email already registered';
                }
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address.';
                if (domElements.emailError) {
                    domElements.emailError.textContent = 'Please enter a valid email';
                }
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak.';
                if (domElements.passwordError) {
                    domElements.passwordError.textContent = 'Password should be at least 6 characters';
                }
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage += 'Invalid email or password.';
                if (domElements.emailError) {
                    domElements.emailError.textContent = 'Invalid email or password';
                }
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Too many attempts. Please try again later.';
                break;
            default:
                errorMessage += 'Please check your credentials and try again.';
        }
        
        showError(errorMessage);
    } finally {
        // Reset button state
        if (domElements.authSubmitBtn) {
            domElements.authSubmitBtn.innerHTML = appState.isLoginMode ? 'Login' : 'Register';
            domElements.authSubmitBtn.disabled = false;
        }
    }
}

// Validate authentication inputs
function validateAuthInputs(email, password, confirmPassword) {
    let isValid = true;
    
    // Clear previous errors
    clearAuthErrors();
    
    // Validate email
    if (!email) {
        if (domElements.emailError) {
            domElements.emailError.textContent = 'Email is required';
        }
        isValid = false;
    } else if (!SECURITY_CONFIG.EMAIL_REGEX.test(email)) {
        if (domElements.emailError) {
            domElements.emailError.textContent = 'Please enter a valid email';
        }
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        if (domElements.passwordError) {
            domElements.passwordError.textContent = 'Password is required';
        }
        isValid = false;
    } else if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
        if (domElements.passwordError) {
            domElements.passwordError.textContent = `Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters`;
        }
        isValid = false;
    }
    
    // Validate confirm password for registration
    if (!appState.isLoginMode) {
        if (!confirmPassword) {
            if (domElements.confirmPasswordError) {
                domElements.confirmPasswordError.textContent = 'Please confirm your password';
            }
            isValid = false;
        } else if (password !== confirmPassword) {
            if (domElements.confirmPasswordError) {
                domElements.confirmPasswordError.textContent = 'Passwords do not match';
            }
            isValid = false;
        }
    }
    
    return isValid;
}

// Handle user menu (logout)
function handleUserMenu() {
    if (!currentUser) return;
    
    if (confirm(`Logout from ${sanitizeInput(currentUser.email)}?`)) {
        auth.signOut()
            .then(() => {
                showSuccess('Logged out successfully');
            })
            .catch(error => {
                console.error('Logout error:', error);
                showError('Logout failed. Please try again.');
            });
    }
}

// Load products from Firebase or fallback
async function loadProducts() {
    if (!domElements.productsContainer || !domElements.loadingSpinner) return;
    
    appState.isLoading = true;
    domElements.loadingSpinner.style.display = 'block';
    
    try {
        let products = [];
        
        // Try to load from Firebase Firestore
        if (db) {
            const querySnapshot = await db.collection('products')
                .limit(SECURITY_CONFIG.MAX_PRODUCT_LOAD)
                .get();
            
            products = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || 'Unnamed Product',
                    description: data.description || 'No description available',
                    price: parseFloat(data.price) || 0,
                    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    category: data.category || 'General'
                };
            });
        }
        
        // If no products from Firebase, use fallback data
        if (products.length === 0) {
            products = getFallbackProducts();
        }
        
        // Secure the product data (sanitize)
        products = products.map(product => ({
            ...product,
            name: sanitizeInput(product.name),
            description: sanitizeInput(product.description)
        }));
        
        appState.products = products;
        renderProducts(products);
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Use fallback products on error
        const fallbackProducts = getFallbackProducts();
        appState.products = fallbackProducts;
        renderProducts(fallbackProducts);
        
        showError('Could not load products. Showing sample data.');
    } finally {
        appState.isLoading = false;
        if (domElements.loadingSpinner) {
            domElements.loadingSpinner.style.display = 'none';
        }
    }
}

// Get fallback products (when Firebase is not available)
function getFallbackProducts() {
    return [
        {
            id: '1',
            name: 'Wireless Bluetooth Headphones',
            description: 'High-quality wireless headphones with noise cancellation',
            price: 79.99,
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Electronics'
        },
        {
            id: '2',
            name: 'Smart Watch Series 5',
            description: 'Advanced smartwatch with health monitoring features',
            price: 249.99,
            imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w-800&q=80',
            category: 'Electronics'
        },
        {
            id: '3',
            name: 'Premium Coffee Maker',
            description: 'Automatic coffee maker with programmable settings',
            price: 129.99,
            imageUrl: 'https://images.unsplash.com/photo-1495474472287-9d6b2765f1cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Home Appliances'
        },
        {
            id: '4',
            name: 'Yoga Mat Premium',
            description: 'Non-slip yoga mat with carrying strap',
            price: 34.99,
            imageUrl: 'https://images.unsplash.com/photo-1599901860904-17eec82f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Fitness'
        },
        {
            id: '5',
            name: 'Organic Cotton T-Shirt',
            description: 'Comfortable organic cotton t-shirt in various colors',
            price: 24.99,
            imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Fashion'
        },
        {
            id: '6',
            name: 'Portable Power Bank',
            description: 'High-capacity power bank for all your devices',
            price: 45.99,
            imageUrl: 'https://images.unsplash.com/photo-1563013541-5b0c12a9c73f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'Electronics'
        }
    ];
}

// Render products to the DOM
function renderProducts(products) {
    if (!domElements.productsContainer) return;
    
    // Clear container
    domElements.productsContainer.innerHTML = '';
    
    // Create product cards
    products.forEach(product => {
        const productCard = createProductCard(product);
        if (productCard) {
            domElements.productsContainer.appendChild(productCard);
        }
    });
}

// Create a product card element
function createProductCard(product) {
    // Validate product data
    if (!product || !product.id || !product.name) {
        console.error('Invalid product data:', product);
        return null;
    }
    
    // Sanitize product data
    const safeName = sanitizeInput(product.name);
    const safeDescription = sanitizeInput(product.description);
    const safePrice = typeof product.price === 'number' ? product.price.toFixed(2) : '0.00';
    const safeImageUrl = isValidURL(product.imageUrl) ? product.imageUrl : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.productId = product.id;
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${safeImageUrl}" alt="${safeName}" loading="lazy">
        </div>
        <div class="product-info">
            <h3 class="product-title">${safeName}</h3>
            <p class="product-description">${safeDescription}</p>
            <div class="product-price">$${safePrice}</div>
            <div class="product-actions">
                <button class="add-to-cart-btn" data-product-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button class="view-details-btn" data-product-id="${product.id}">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners to buttons
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    const viewDetailsBtn = card.querySelector('.view-details-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => addToCart(product));
    }
    
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', () => showProductDetails(product));
    }
    
    return card;
}

// Add product to cart
function addToCart(product) {
    if (!product || !product.id) {
        showError('Invalid product');
        return;
    }
    
    // Check if product already in cart
    const existingItemIndex = appState.cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
        // Increase quantity
        appState.cart[existingItemIndex].quantity += 1;
    } else {
        // Add new item
        appState.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: 1
        });
    }
    
    // Save cart to localStorage
    saveCartToStorage();
    
    // Update UI
    updateCartUI();
    
    // Show confirmation
    showSuccess(`${sanitizeInput(product.name)} added to cart!`);
    
    // Open cart sidebar
    openCartSidebar();
}

// Show product details
function showProductDetails(product) {
    if (!product) return;
    
    const modalHTML = `
        <div class="modal" id="productModal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>${sanitizeInput(product.name)}</h2>
                    <button class="close-btn" id="closeProductModalBtn">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                        <img src="${product.imageUrl}" alt="${sanitizeInput(product.name)}" style="width: 200px; height: 200px; object-fit: cover; border-radius: 8px;">
                        <div>
                            <h3 style="color: #2563eb; margin-bottom: 10px;">$${product.price.toFixed(2)}</h3>
                            <p style="margin-bottom:15px;">${sanitizeInput(product.description)}</p>
                            <p><strong>Category:</strong> ${sanitizeInput(product.category || 'General')}</p>
                        </div>
                    </div>
                    <button class="btn-primary" id="addToCartFromModal" style="width: 100%;">
                        <i class="fas fa-cart-plus"></i> Add to Cart - $${product.price.toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    const productModal = document.getElementById('productModal');
    const closeBtn = document.getElementById('closeProductModalBtn');
    const addToCartBtn = document.getElementById('addToCartFromModal');
    
    // Show modal
    productModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Close modal events
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            productModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            modalContainer.remove();
        });
    }
    
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            modalContainer.remove();
        }
    });
    
    // Add to cart from modal
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            addToCart(product);
            productModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            modalContainer.remove();
        });
    }
}

// Update cart UI
function updateCartUI() {
    // Update cart count
    if (domElements.cartCount) {
        const totalItems = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
        domElements.cartCount.textContent = totalItems;
        domElements.cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Update cart sidebar
    renderCartItems();
    
    // Update checkout button
    if (domElements.checkoutBtn) {
        domElements.checkoutBtn.disabled = appState.cart.length === 0;
    }
}

// Render cart items in sidebar
function renderCartItems() {
    if (!domElements.cartItems || !domElements.emptyCartMsg || !domElements.cartTotal) return;
    
    // Clear cart items
    domElements.cartItems.innerHTML = '';
    
    if (appState.cart.length === 0) {
        // Show empty cart message
        domElements.emptyCartMsg.style.display = 'block';
        domElements.cartTotal.textContent = '$0.00';
        return;
    }
    
    // Hide empty cart message
    domElements.emptyCartMsg.style.display = 'none';
    
    // Calculate total
    let total = 0;
    
    // Render each cart item
    appState.cart.forEach((item, index) => {
        const safeName = sanitizeInput(item.name);
        const safePrice = typeof item.price === 'number' ? item.price.toFixed(2) : '0.00';
        const safeImageUrl = isValidURL(item.imageUrl) ? item.imageUrl : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
        
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.dataset.itemIndex = index;
        
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${safeImageUrl}" alt="${safeName}" loading="lazy">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${safeName}</div>
                <div class="cart-item-price">$${safePrice} each</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease-quantity" data-index="${index}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase-quantity" data-index="${index}">+</button>
                    <button class="remove-item-btn" data-index="${index}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                <div style="margin-top: 5px; font-weight: 600;">Total: $${itemTotal.toFixed(2)}</div>
            </div>
        `;
        
        // Add event listeners
        const decreaseBtn = cartItem.querySelector('.decrease-quantity');
        const increaseBtn = cartItem.querySelector('.increase-quantity');
        const removeBtn = cartItem.querySelector('.remove-item-btn');
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => updateCartItemQuantity(index, -1));
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => updateCartItemQuantity(index, 1));
        }
        
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeCartItem(index));
        }
        
        domElements.cartItems.appendChild(cartItem);
    });
    
    // Update total
    domElements.cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Update cart item quantity
function updateCartItemQuantity(index, change) {
    if (index < 0 || index >= appState.cart.length) return;
    
    const newQuantity = appState.cart[index].quantity + change;
    
    if (newQuantity < 1) {
        // Remove item if quantity becomes 0
        removeCartItem(index);
    } else {
        // Update quantity
        appState.cart[index].quantity = newQuantity;
        saveCartToStorage();
        updateCartUI();
    }
}

// Remove item from cart
function removeCartItem(index) {
    if (index < 0 || index >= appState.cart.length) return;
    
    const itemName = appState.cart[index].name;
    appState.cart.splice(index, 1);
    saveCartToStorage();
    updateCartUI();
    
    showSuccess(`${sanitizeInput(itemName)} removed from cart`);
}

// Clear entire cart
function clearCart() {
    if (appState.cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        appState.cart = [];
        saveCartToStorage();
        updateCartUI();
        showSuccess('Cart cleared');
    }
}

// Handle checkout
function handleCheckout() {
    if (appState.cart.length === 0) {
        showError('Your cart is empty');
        return;
    }
    
    // If user is not logged in, prompt for login
    if (!currentUser) {
        showError('Please login to proceed with checkout');
        openAuthModal();
        return;
    }
    
    // Calculate total
    const total = appState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // In a real application, this would integrate with a payment gateway
    // For demo purposes, we'll show a confirmation modal
    const checkoutModalHTML = `
        <div class="modal" id="checkoutModal">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Order Summary</h2>
                    <button class="close-btn" id="closeCheckoutModalBtn">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <p style="margin-bottom: 15px;">Thank you for your order!</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin-bottom: 10px;">Order Details</h3>
                        <ul style="list-style: none; padding: 0;">
                            ${appState.cart.map(item => `
                                <li style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span>${sanitizeInput(item.name)} x ${item.quantity}</span>
                                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                            `).join('')}
                        </ul>
                        <hr style="margin: 15px 0; border: none; border-top: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem;">
                            <span>Total:</span>
                            <span>$${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <p style="font-size: 0.9rem; color: #64748b; text-align: center;">
                        <i class="fas fa-shield-alt"></i> This is a demo. In a real application, you would be redirected to a secure payment gateway.
                    </p>
                    <button class="btn-primary" id="confirmOrderBtn" style="width: 100%; margin-top: 20px;">
                        <i class="fas fa-lock"></i> Confirm Secure Order
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = checkoutModalHTML;
    document.body.appendChild(modalContainer);
    
    const checkoutModal = document.getElementById('checkoutModal');
    const closeBtn = document.getElementById('closeCheckoutModalBtn');
    const confirmBtn = document.getElementById('confirmOrderBtn');
    
    // Show modal
    checkoutModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Close modal events
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            checkoutModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            modalContainer.remove();
        });
    }
    
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            checkoutModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            modalContainer.remove();
        }
    });
    
    // Confirm order
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            // In a real app, process payment here
            showSuccess('Order placed successfully! Thank you for shopping with Online-Bazaar66.');
            
            // Clear cart
            appState.cart = [];
            saveCartToStorage();
            updateCartUI();
            
            // Close modals
            checkoutModal.style.display = 'none';
            closeCartSidebar();
            document.body.style.overflow = 'auto';
            modalContainer.remove();
        });
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    try {
        localStorage.setItem('onlineBazaarCart', JSON.stringify(appState.cart));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
}

// Load cart from localStorage
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem('onlineBazaarCart');
        if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            
            // Validate cart data structure
            if (Array.isArray(parsedCart)) {
                // Filter out invalid items
                appState.cart = parsedCart.filter(item => 
                    item && 
                    item.id && 
                    typeof item.quantity === 'number' && 
                    item.quantity > 0 &&
                    typeof item.price === 'number' &&
                    item.price >= 0
                );
            }
        }
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        appState.cart = [];
    }
}

// Check session timeout
function checkSessionTimeout() {
    const sessionTime = localStorage.getItem('userSession');
    if (sessionTime && currentUser) {
        const timeDiff = Date.now() - parseInt(sessionTime);
        if (timeDiff > SECURITY_CONFIG.SESSION_TIMEOUT) {
            // Auto logout after timeout
            auth.signOut()
                .then(() => {
                    showError('Session expired. Please login again.');
                })
                .catch(error => {
                    console.error('Auto logout error:', error);
                });
        }
    }
}

// Toggle cart sidebar
function toggleCartSidebar() {
    if (!domElements.cartSidebar) return;
    
    if (domElements.cartSidebar.classList.contains('open')) {
        closeCartSidebar();
    } else {
        openCartSidebar();
    }
}

// Open cart sidebar
function openCartSidebar() {
    if (!domElements.cartSidebar) return;
    
    domElements.cartSidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// Close cart sidebar
function closeCartSidebar() {
    if (!domElements.cartSidebar) return;
    
    domElements.cartSidebar.classList.remove('open');
    document.body.style.overflow = 'auto';
}

// Scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Show success message
function showSuccess(message) {
    showNotification(message, 'success');
}

// Show error message
function showError(message) {
    showNotification(message, 'error');
}

// Show notification
function showNotification(message, type) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${sanitizeInput(message)}</span>
        </div>
        <button class="close-notification-btn">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 300px;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    // Add close button event
    const closeBtn = notification.querySelector('.close-notification-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
    }
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .close-notification-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: 15px;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Sanitize input to prevent XSS attacks
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return String(input || '');
    }
    
    // Remove potentially dangerous characters
    return input.replace(SECURITY_CONFIG.INPUT_SANITIZE_REGEX, '');
}

// Validate URL
function isValidURL(string) {
    if (typeof string !== 'string') return false;
    
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
