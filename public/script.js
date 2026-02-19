// ========================================
// FLUX - E-commerce JavaScript
// ========================================

// Configuration API
const API_BASE = 'https://nexus-store-3v7f.onrender.com/api';

// État global de l'application
let state = {
    products: [],
    filteredProducts: [],
    cart: JSON.parse(localStorage.getItem('fluxCart')) || [],
    currentCategory: 'all',
    currentSource: 'all', // 'all', 'printful', 'cj', 'ebay'
    searchQuery: ''
};

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Charger les produits si on est sur la page boutique
    const featuredProductsContainer = document.getElementById('featuredProducts');
    if (featuredProductsContainer) {
        loadFeaturedProducts();
    }
    
    // Initialiser les événements
    initializeEventListeners();
    
    // Mettre à jour le compteur du panier
    updateCartCount();
    
    // Initialiser le menu mobile
    initializeMobileMenu();
    
    // Initialiser la newsletter
    initializeNewsletter();
}

// ===== SEARCH FUNCTIONALITY =====
function toggleSearch() {
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchBar) return;
    
    const isVisible = searchBar.style.display !== 'none';
    searchBar.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        setTimeout(() => searchInput && searchInput.focus(), 100);
    } else {
        searchInput.value = '';
        if (searchResults) searchResults.style.display = 'none';
    }
}

function handleSearchInput(event) {
    const query = event.target.value.toLowerCase().trim();
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;
    
    // Redirect to boutique on Enter
    if (event.key === 'Enter' && query) {
        window.location.href = `boutique.html?search=${encodeURIComponent(query)}`;
        return;
    }
    
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    // Search in products
    const products = state.products.length > 0 ? state.products : getAllDemoProducts();
    const results = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const category = (p.category || '').toLowerCase();
        return name.includes(query) || category.includes(query);
    }).slice(0, 5);
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--gray-500);">Aucun résultat trouvé</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = results.map(product => `
        <div class="search-result-item" onclick="window.location.href='boutique.html?product=${product.id}'">
            <img src="${product.thumbnail || product.image}" alt="${product.name}">
            <div class="search-result-info">
                <h4>${product.name}</h4>
                <p>${product.category || 'Produit'}</p>
                <div class="price">${parseFloat(product.price).toFixed(2)} ${product.currency || '€'}</div>
            </div>
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
}

function getAllDemoProducts() {
    return [
        {
            id: 'demo-1',
            name: 'T-Shirt Premium Noir',
            category: 'Mode & Vêtements',
            price: 29.99,
            currency: '€',
            thumbnail: createProductImage('T-SHIRT', '#000000'),
            source: 'printful'
        },
        {
            id: 'demo-2',
            name: 'Écouteurs Bluetooth Sans Fil',
            category: 'Électronique',
            price: 34.99,
            currency: '€',
            thumbnail: createProductImage('BLUETOOTH', '#1a1a2e'),
            source: 'cj'
        },
        {
            id: 'demo-3',
            name: 'Lampe LED Décorative',
            category: 'Maison & Jardin',
            price: 24.99,
            currency: '€',
            thumbnail: createProductImage('LED LAMP', '#ffd700', '#333333'),
            source: 'cj'
        },
        {
            id: 'demo-4',
            name: 'Kit Soin Visage Bio',
            category: 'Beauté & Santé',
            price: 19.99,
            currency: '€',
            thumbnail: createProductImage('SKINCARE', '#e8d5c4', '#333333'),
            source: 'ebay',
            badge: 'eBay'
        },
        {
            id: 'demo-5',
            name: 'Tapis de Yoga Premium',
            category: 'Sport & Loisirs',
            price: 29.99,
            currency: '€',
            thumbnail: createProductImage('YOGA MAT', '#4caf50'),
            source: 'cj'
        },
        {
            id: 'demo-6',
            name: 'Coque iPhone Design',
            category: 'Accessoires',
            price: 14.99,
            currency: '€',
            thumbnail: createProductImage('PHONE CASE', '#2196f3'),
            source: 'ebay',
            badge: 'eBay'
        }
    ];
}

// Expose globally
window.toggleSearch = toggleSearch;
window.handleSearchInput = handleSearchInput;

// ===== GESTION DES ÉVÉNEMENTS =====
function initializeEventListeners() {
    // Panier
    const cartBtn = document.getElementById('cartBtn');
    const closeCart = document.getElementById('closeCart');
    const cartOverlay = document.getElementById('cartOverlay');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cartBtn) cartBtn.addEventListener('click', toggleCart);
    if (closeCart) closeCart.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
    
    // Close search on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const searchBar = document.getElementById('searchBar');
            if (searchBar && searchBar.style.display !== 'none') {
                toggleSearch();
            }
        }
    });
}

// ===== MENU MOBILE =====
function initializeMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
    }
}

// ===== CHARGEMENT DES PRODUITS =====
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE}/products`);
        const data = await response.json();
        
        if (data.success && data.products && data.products.length > 0) {
            state.products = data.products;
            // Afficher seulement 6 produits sur la page d'accueil
            const featured = data.products.slice(0, 6);
            displayProducts(featured, container);
        } else {
            // Charger les produits de démonstration
            loadDemoProducts(container);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        loadDemoProducts(container);
    }
}

// ===== PRODUITS DE DÉMONSTRATION =====
function loadDemoProducts(container) {
    const demoProducts = [
        {
            id: 'demo-1',
            name: 'T-Shirt Premium Noir',
            category: 'Mode & Vêtements',
            price: '29.99',
            currency: '€',
            thumbnail: createProductImage('T-SHIRT', '#000000'),
            badge: 'Nouveau',
            source: 'printful'
        },
        {
            id: 'demo-2',
            name: 'Écouteurs Bluetooth Sans Fil',
            category: 'Électronique',
            price: '34.99',
            currency: '€',
            thumbnail: createProductImage('BLUETOOTH', '#1a1a2e'),
            badge: 'Best-seller',
            source: 'cj'
        },
        {
            id: 'demo-3',
            name: 'Lampe LED Décorative',
            category: 'Maison & Jardin',
            price: '24.99',
            currency: '€',
            thumbnail: createProductImage('LED LAMP', '#ffd700', '#333333'),
            source: 'cj'
        },
        {
            id: 'demo-4',
            name: 'Kit Soin Visage Bio',
            category: 'Beauté & Santé',
            price: '19.99',
            currency: '€',
            thumbnail: createProductImage('SKINCARE', '#e8d5c4', '#333333'),
            badge: 'eBay',
            source: 'ebay'
        },
        {
            id: 'demo-5',
            name: 'Tapis de Yoga Premium',
            category: 'Sport & Loisirs',
            price: '29.99',
            currency: '€',
            thumbnail: createProductImage('YOGA MAT', '#4caf50'),
            source: 'cj'
        },
        {
            id: 'demo-6',
            name: 'Coque iPhone Design',
            category: 'Accessoires',
            price: '14.99',
            currency: '€',
            thumbnail: createProductImage('PHONE CASE', '#2196f3'),
            badge: 'eBay',
            source: 'ebay'
        },
        {
            id: 'demo-7',
            name: 'Hoodie Oversize Gris',
            category: 'Mode & Vêtements',
            price: '59.99',
            currency: '€',
            thumbnail: createProductImage('HOODIE', '#808080'),
            badge: 'Best-seller',
            source: 'printful'
        },
        {
            id: 'demo-8',
            name: 'Power Bank 20000mAh',
            category: 'Électronique',
            price: '24.99',
            currency: '€',
            thumbnail: createProductImage('POWER BANK', '#333333'),
            badge: 'Nouveau',
            source: 'cj'
        }
    ];

    state.products = demoProducts;
    if (container) {
        displayProducts(demoProducts, container);
    }
    console.log('✅ 8 produits de démonstration chargés');
}

// ===== CRÉER UNE IMAGE DE PRODUIT SVG =====
function createProductImage(text, bgColor = '#cccccc', textColor = '#ffffff') {
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
            <rect fill="${bgColor}" width="400" height="500"/>
            <text x="200" y="250" font-family="Arial" font-size="24" fill="${textColor}" text-anchor="middle" font-weight="bold">${text}</text>
        </svg>
    `)}`;
}

// ===== AFFICHAGE DES PRODUITS =====
function displayProducts(products, container) {
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p class="loading">Aucun produit disponible</p>';
        return;
    }
    
    container.innerHTML = products.map(product => {
        // Ensure price is a valid number
        const price = parseFloat(product.price) || 0;
        const currency = product.currency || '€';
        
        let sourceBadge = '';
        if (product.source === 'cj') sourceBadge = '<span class="source-badge source-cj">CJ</span>';
        else if (product.source === 'ebay') sourceBadge = '<span class="source-badge source-ebay">eBay</span>';

        return `
        <div class="product-card" data-id="${product.id}" data-source="${product.source || 'printful'}" onclick="window.location.href='produit.html?id=${product.id}'" style="cursor: pointer;">
            <div class="product-image-container">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                <img src="${product.thumbnail || product.image}"
                     alt="${product.name}"
                     class="product-image"
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 500%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22500%22/%3E%3Ctext x=%22200%22 y=%22250%22 font-family=%22Arial%22 font-size=%2224%22 fill=%22%23999%22 text-anchor=%22middle%22%3EImage non disponible%3C/text%3E%3C/svg%3E'">
                <button class="quick-add" onclick="event.stopPropagation(); addToCart('${product.id}')">
                    Ajouter au panier
                </button>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category || 'Produit'} ${sourceBadge}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${price.toFixed(2)} ${currency}</p>
            </div>
        </div>
    `;
    }).join('');
}

// ===== GESTION DU PANIER =====
function addToCart(productId) {
    const product = state.products.find(p => p.id == productId);
    if (!product) {
        showToast('❌ Produit introuvable');
        return;
    }
    
    const existingItem = state.cart.find(item => item.id == productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            currency: product.currency || '€',
            image: product.thumbnail || product.image,
            category: product.category || 'Produit',
            source: product.source || 'printful',
            color: 'Standard',
            size: 'M',
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showToast('✓ Produit ajouté au panier');
    
    // Track add to cart
    if (typeof trackAddToCart === 'function') {
        trackAddToCart(product);
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id != productId);
    saveCart();
    updateCartCount();
    displayCart();
    showToast('Produit retiré du panier');
}

function updateCartQuantity(productId, change) {
    const item = state.cart.find(item => item.id == productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    saveCart();
    displayCart();
}

function saveCart() {
    localStorage.setItem('fluxCart', JSON.stringify(state.cart));
}

function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

// ===== AFFICHAGE DU PANIER =====
function toggleCart() {
    const modal = document.getElementById('cartModal');
    const overlay = document.getElementById('cartOverlay');
    
    if (!modal || !overlay) return;
    
    modal.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (modal.classList.contains('active')) {
        displayCart();
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

function displayCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    
    if (!cartItemsContainer || !cartTotalEl) return;
    
    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <p>Votre panier est vide</p>
                <a href="boutique.html" class="btn btn-primary" style="margin-top: 1rem;">Découvrir la boutique</a>
            </div>
        `;
        cartTotalEl.textContent = '0,00 €';
        return;
    }
    
    cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">${item.category}${item.color ? ' • ' + item.color : ''}${item.size ? ' • Taille ' + item.size : ''}</div>
                <div class="cart-item-price">${(item.price * item.quantity).toFixed(2)} ${item.currency}</div>
                <div style="margin-top: 0.5rem; display: flex; gap: 1rem; align-items: center;">
                    <button onclick="updateCartQuantity('${item.id}', -1)" style="padding: 0.25rem 0.5rem; background: var(--gray-200); border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">−</button>
                    <span style="font-weight: 600; min-width: 60px; text-align: center;">Qté: ${item.quantity}</span>
                    <button onclick="updateCartQuantity('${item.id}', 1)" style="padding: 0.25rem 0.5rem; background: var(--gray-200); border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">+</button>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">Retirer</button>
            </div>
        </div>
    `).join('');
    
    const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalEl.textContent = `${total.toFixed(2)} €`;
}

// ===== PAIEMENT =====
async function checkout() {
    if (state.cart.length === 0) {
        showToast('⚠️ Votre panier est vide');
        return;
    }
    
    showToast('🔄 Traitement de votre commande...');
    
    // Simuler le processus de paiement
    setTimeout(() => {
        showToast('✓ Commande confirmée ! Merci pour votre achat.');
        
        // Vider le panier après confirmation
        setTimeout(() => {
            state.cart = [];
            saveCart();
            updateCartCount();
            toggleCart();
        }, 2000);
    }, 1500);
    
    // Dans un cas réel, vous appelleriez votre API ici
    /*
    try {
        const total = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const response = await fetch(`${API_BASE}/create-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: total,
                currency: 'eur',
                items: state.cart
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Rediriger vers la page de paiement Stripe
            window.location.href = data.checkout_url;
        }
    } catch (error) {
        console.error('Erreur de paiement:', error);
        showToast('❌ Erreur lors du paiement');
    }
    */
}

// ===== NEWSLETTER =====
function initializeNewsletter() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;
        
        showToast('✓ Merci de votre inscription !');
        form.reset();
        
        // Dans un cas réel, vous enverriez l'email à votre backend
        console.log('Newsletter signup:', email);
    });
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== FILTRES (pour la page boutique) =====
function filterProducts(category) {
    state.currentCategory = category;
    
    if (category === 'all') {
        state.filteredProducts = [...state.products];
    } else {
        state.filteredProducts = state.products.filter(product => {
            const productType = product.type || '';
            const productName = (product.name || '').toLowerCase();
            const productCategory = (product.category || '').toLowerCase();
            
            if (category === 'men') {
                return productType === 'men' || productName.includes('homme') || productName.includes('men');
            } else if (category === 'women') {
                return productType === 'women' || productName.includes('femme') || productName.includes('women');
            } else if (category === 'accessories') {
                return productType === 'accessories' || 
                       productCategory.includes('accessoire') ||
                       productName.includes('bag') || 
                       productName.includes('cap') || 
                       productName.includes('sac');
            }
            
            return false;
        });
    }
    
    const container = document.getElementById('productsGrid') || document.getElementById('featuredProducts');
    if (container) {
        displayProducts(state.filteredProducts, container);
    }
}

// ===== RECHERCHE =====
function searchProducts(query) {
    state.searchQuery = query.toLowerCase();
    
    state.filteredProducts = state.products.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        return name.includes(state.searchQuery) || category.includes(state.searchQuery);
    });
    
    const container = document.getElementById('productsGrid') || document.getElementById('featuredProducts');
    if (container) {
        displayProducts(state.filteredProducts, container);
    }
}

// ===== UTILITAIRES =====
function formatPrice(price, currency = '€') {
    return `${parseFloat(price).toFixed(2)} ${currency}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// ===== FILTRE PAR SOURCE =====
function filterBySource(source) {
    state.currentSource = source;

    if (source === 'all') {
        state.filteredProducts = [...state.products];
    } else {
        state.filteredProducts = state.products.filter(p => p.source === source);
    }

    const container = document.getElementById('productsGrid') || document.getElementById('featuredProducts');
    if (container) {
        displayProducts(state.filteredProducts, container);
    }
}

// ===== RECHERCHE CJ DROPSHIPPING =====
async function searchCJProducts(keyword) {
    try {
        const response = await fetch(`${API_BASE}/cj/search?keyword=${encodeURIComponent(keyword)}&size=20`);
        const data = await response.json();

        if (data.success && data.products) {
            state.products = [...state.products.filter(p => p.source !== 'cj'), ...data.products];
            state.filteredProducts = [...state.products];
            const container = document.getElementById('productsGrid') || document.getElementById('featuredProducts');
            if (container) {
                displayProducts(state.filteredProducts, container);
            }
        }
    } catch (error) {
        console.error('Erreur recherche CJ:', error);
    }
}

// Exposer les fonctions globalement pour les onclick dans le HTML
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.filterProducts = filterProducts;
window.filterBySource = filterBySource;
window.searchCJProducts = searchCJProducts;
window.searchProducts = searchProducts;
window.toggleCart = toggleCart;
window.checkout = checkout;

// ===== GLOBAL SEARCH FUNCTIONALITY =====
window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    
    const isVisible = overlay.style.display !== 'none';
    overlay.style.display = isVisible ? 'none' : 'flex';
    
    if (!isVisible) {
        const input = document.getElementById('globalSearchInput');
        if (input) {
            input.focus();
            input.value = '';
        }
        document.getElementById('searchResults').innerHTML = '';
    }
    
    // Prevent body scroll when search is open
    document.body.style.overflow = isVisible ? 'auto' : 'hidden';
};

// Global search input handler
document.addEventListener('DOMContentLoaded', () => {
    const globalSearchInput = document.getElementById('globalSearchInput');
    if (globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => {
            performGlobalSearch(e.target.value);
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('searchOverlay');
                if (overlay && overlay.style.display !== 'none') {
                    toggleSearch();
                }
            }
        });
    }
});

// Perform global search
function performGlobalSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    if (!query || query.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    const products = state.products || [];
    const searchTerm = query.toLowerCase();
    
    const results = products.filter(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        return name.includes(searchTerm) || category.includes(searchTerm);
    });
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="search-no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <p>Aucun résultat pour "${query}"</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Essayez avec d'autres mots-clés</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = results.slice(0, 8).map(product => `
        <a href="boutique.html?product=${product.id}" class="search-result-item" onclick="toggleSearch()">
            <img src="${product.thumbnail || product.image}" alt="${product.name}" class="search-result-image">
            <div class="search-result-info">
                <div class="search-result-title">${product.name}</div>
                <div class="search-result-category">${product.category || 'Produit'}</div>
                <div class="search-result-price">${parseFloat(product.price).toFixed(2)} ${product.currency}</div>
            </div>
        </a>
    `).join('');
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== LAZY LOADING DES IMAGES =====
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===== ANALYTICS (Google Analytics / AdSense) =====
// Tracker les vues de produits
function trackProductView(productId, productName) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'view_item', {
            'items': [{
                'id': productId,
                'name': productName
            }]
        });
    }
}

// Tracker les ajouts au panier
function trackAddToCart(product) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'add_to_cart', {
            'items': [{
                'id': product.id,
                'name': product.name,
                'price': product.price,
                'quantity': 1
            }]
        });
    }
}

// Tracker les achats
function trackPurchase(items, total) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            'transaction_id': 'T_' + Date.now(),
            'value': total,
            'currency': 'EUR',
            'items': items.map(item => ({
                'id': item.id,
                'name': item.name,
                'price': item.price,
                'quantity': item.quantity
            }))
        });
    }
}

console.log('✅ FLUX E-commerce - JavaScript chargé');