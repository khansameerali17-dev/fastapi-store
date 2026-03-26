// App state
let cartId = localStorage.getItem('freshgrove_cart') || `cart_${Math.random().toString(36).substr(2, 9)}`;
localStorage.setItem('freshgrove_cart', cartId);
let allProducts = [];
let activeCategory = 'All';
let cart = { items: [] };

// DOM Elements
const views = {
    products: document.getElementById('products-view'),
    cart: document.getElementById('cart-view'),
    checkout: document.getElementById('checkout-view'),
    success: document.getElementById('order-success-view'),
    offers: document.getElementById('offers-view'),
    about: document.getElementById('about-view')
};

const productsGrid = document.getElementById('products-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');
const checkoutTotalDisplay = document.getElementById('checkout-amount-display');

// Init
async function init() {
    await fetchProducts();
    await fetchCart();
    
    // Category listeners
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.dataset.category;
            renderProducts();
        });
    });

    // Navigation Listeners
    document.getElementById('cart-icon').addEventListener('click', () => showView('cart'));
    document.getElementById('shop-again-btn').addEventListener('click', resetShop);
    
    // Payment Simulation Listeners
    setupPaymentInteractions();
    
    // Smooth scroll from hero
    window.scrollTo(0,0);
}

function resetShop() {
    cartId = `cart_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('freshgrove_cart', cartId);
    cart.items = [];
    updateCartBadge();
    showView('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigation
function showView(viewName) {
    Object.values(views).forEach(v => {
        if(v) v.classList.remove('active');
    });
    if(views[viewName]) views[viewName].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.view === viewName) link.classList.add('active');
    });

    if(viewName === 'cart') renderCart();
}

// API Calls
async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
        renderProducts();
    } catch (err) {
        console.error("Error fetching products:", err);
    }
}

async function fetchCart() {
    try {
        const res = await fetch(`/api/cart/${cartId}`);
        cart = await res.json();
        updateCartBadge();
    } catch (err) {
        console.error("Error fetching cart:", err);
    }
}

async function addToCart(productId) {
    try {
        const res = await fetch(`/api/cart/${cartId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });
        
        await fetchCart();
        
        // Cart icon animation
        const icon = document.getElementById('cart-icon');
        icon.style.transform = 'scale(1.2)';
        icon.style.boxShadow = 'var(--shadow-glow)';
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
            icon.style.boxShadow = 'var(--shadow-sm)';
        }, 300);
        
    } catch (err) {
        console.error("Error adding to cart:", err);
    }
}

async function updateQuantity(productId, newQty) {
    if (newQty <= 0) {
        await removeFromCart(productId);
        return;
    }
    try {
        const currentItem = cart.items.find(i => i.product_id === productId);
        const diff = newQty - (currentItem ? currentItem.quantity : 0);
        
        await fetch(`/api/cart/${cartId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: productId, quantity: diff })
        });
        await fetchCart();
        renderCart();
    } catch (err) {
        console.error("Error updating quantity:", err);
    }
}

async function removeFromCart(productId) {
    try {
        await fetch(`/api/cart/${cartId}/items/${productId}`, {
            method: 'DELETE'
        });
        await fetchCart();
        renderCart();
    } catch (err) {
        console.error("Error removing from cart:", err);
    }
}

// Rendering
function renderProducts() {
    productsGrid.innerHTML = '';
    
    let filtered = allProducts;
    if (activeCategory !== 'All') {
        filtered = allProducts.filter(p => p.category === activeCategory);
    }

    if (filtered.length === 0) {
        productsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-light);">No products found in this category.</div>`;
        return;
    }

    filtered.forEach((product, i) => {
        const el = document.createElement('div');
        el.className = 'product-card fade-up';
        el.style.animationDelay = `${i * 0.05}s`;
        el.innerHTML = `
            <div class="product-img-wrapper">
                <img src="${product.image_url}" alt="${product.name}" class="product-img" loading="lazy">
            </div>
            <span class="product-category">${product.category}</span>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc">${product.description}</p>
            <div class="product-bottom">
                <span class="product-price">$${product.price.toFixed(2)}</span>
                <button class="add-btn" onclick="addToCart(${product.id})" title="Add to cart">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        productsGrid.appendChild(el);
    });
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    
    if (!cart.items || cart.items.length === 0) {
        cartItemsContainer.innerHTML = '<div class="glass-panel" style="text-align: center; padding: 4rem; color: var(--text-light); border-radius: var(--radius-md);"><h2>Your basket is empty</h2><p>Discover our fresh arrivals and fill it up!</p></div>';
        cartSubtotal.innerText = '$0.00';
        cartTotal.innerText = '$0.00';
        document.querySelector('.cart-summary .btn-primary').style.display = 'none';
        return;
    }

    document.querySelector('.cart-summary .btn-primary').style.display = 'block';
    let subtotal = 0;

    cart.items.forEach(item => {
        const product = item.product || allProducts.find(p => p.id === item.product_id); 
        if(!product) return;

        subtotal += product.price * item.quantity;
        const el = document.createElement('div');
        el.className = 'cart-item fade-up';
        el.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h3 class="cart-item-title">${product.name}</h3>
                <span class="cart-item-price">$${product.price.toFixed(2)}</span>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="updateQuantity(${product.id}, ${item.quantity - 1})">-</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${product.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${product.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        cartItemsContainer.appendChild(el);
    });

    const deliveryFee = 5.00;
    cartSubtotal.innerText = `$${subtotal.toFixed(2)}`;
    const finalTotal = (subtotal + deliveryFee).toFixed(2);
    cartTotal.innerText = `$${finalTotal}`;
    checkoutTotalDisplay.innerText = `$${finalTotal}`;
}

function updateCartBadge() {
    const count = cart.items ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
    cartCount.innerText = count;
    if (count > 0) {
        cartCount.style.transform = 'scale(1.2)';
        setTimeout(() => cartCount.style.transform = 'scale(1)', 200);
    }
}

// Payment Interactions Setup
function setupPaymentInteractions() {
    const ccNumInput = document.getElementById('cc-num');
    const ccNameInput = document.getElementById('cust-name');
    const ccExpInput = document.getElementById('cc-exp');
    
    const prevNum = document.getElementById('preview-number');
    const prevName = document.getElementById('preview-name');
    const prevExp = document.getElementById('preview-expiry');
    
    // Format and Update CC Number
    ccNumInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, ''); // remove non-digits
        val = val.replace(/(.{4})/g, '$1 ').trim(); // add space every 4 digits
        e.target.value = val;
        prevNum.innerText = val || '#### #### #### ####';
        
        // Tilt card effect based on input
        const card = document.getElementById('cc-preview');
        card.style.transform = `perspective(1000px) rotateX(5deg) scale(1.02)`;
        setTimeout(() => card.style.transform = `perspective(1000px) rotateX(0deg) scale(1)`, 300);
    });

    // Update Name
    ccNameInput.addEventListener('input', (e) => {
        prevName.innerText = e.target.value.toUpperCase() || 'NAME ON CARD';
    });

    // Update Expiry Date
    ccExpInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
        e.target.value = val;
        prevExp.innerText = val || 'MM/YY';
    });

    // Payment form submit
    document.getElementById('payment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('pay-btn');
        const btnText = btn.querySelector('.btn-text-content');
        const loader = btn.querySelector('.loader-ring');
        
        // UI Loading state
        btn.disabled = true;
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');

        // Simulate network processing
        setTimeout(async () => {
            try {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cartId, customer_info: { name: ccNameInput.value } })
                });
                
                const order = await res.json();
                
                if (res.ok) {
                    document.getElementById('success-order-id').innerText = `#${order.id}`;
                    document.getElementById('success-order-total').innerText = `$${order.total_amount.toFixed(2)}`;
                    showView('success');
                } else {
                    alert("Payment Declined: " + (order.detail || "Unknown error"));
                }
            } catch (err) {
                console.error("Error Processing:", err);
                alert("Network error during payment processing");
            } finally {
                // Restore button state
                btn.disabled = false;
                btnText.classList.remove('hidden');
                loader.classList.add('hidden');
                
                // Clear form
                document.getElementById('payment-form').reset();
                prevNum.innerText = '#### #### #### ####';
                prevName.innerText = 'NAME ON CARD';
                prevExp.innerText = 'MM/YY';
            }
        }, 2000); // 2 seconds simulated delay
    });

    // Tabs toggle
    document.querySelectorAll('.pay-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.pay-tab').forEach(t => {
                t.classList.remove('active');
                t.classList.add('inactive');
            });
            e.currentTarget.classList.remove('inactive');
            e.currentTarget.classList.add('active');
        });
    });
}

// Boot
window.onload = () => {
    init();
    createParticles();
    setupScrollReveal();
};

// Floating Particles
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = (6 + Math.random() * 6) + 's';
        container.appendChild(p);
    }
}

// Scroll Reveal Observer
function setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // Observe product cards as they are created
    const mutationObs = new MutationObserver(() => {
        document.querySelectorAll('.product-card:not(.revealed)').forEach(card => {
            observer.observe(card);
        });
    });
    const grid = document.getElementById('products-grid');
    if (grid) mutationObs.observe(grid, { childList: true });
}
