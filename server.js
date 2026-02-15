const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const CJ_API_KEY = process.env.CJ_API_KEY || '';
const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

// ========== CJ DROPSHIPPING AUTH ==========

let cjAccessToken = null;
let cjTokenExpiry = null;

async function getCJAccessToken() {
    // Return cached token if still valid (refresh 1 day before expiry)
    if (cjAccessToken && cjTokenExpiry && Date.now() < cjTokenExpiry - 86400000) {
        return cjAccessToken;
    }

    if (!CJ_API_KEY) {
        throw new Error('CJ_API_KEY non configurée. Ajoutez-la dans votre fichier .env');
    }

    const response = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: CJ_API_KEY })
    });

    const data = await response.json();

    if (!data.result || data.code !== 200) {
        throw new Error(data.message || 'Échec authentification CJDropshipping');
    }

    cjAccessToken = data.data.accessToken;
    // Token valid 15 days
    cjTokenExpiry = Date.now() + 15 * 24 * 60 * 60 * 1000;
    console.log('✅ CJDropshipping token obtenu');
    return cjAccessToken;
}

// ========== CJ DROPSHIPPING API HELPER ==========

async function cjAPI(endpoint, method = 'GET', body = null, extraHeaders = {}) {
    const token = await getCJAccessToken();

    const options = {
        method,
        headers: {
            'CJ-Access-Token': token,
            'Content-Type': 'application/json',
            ...extraHeaders
        }
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    // For GET requests with query params, append to URL
    const url = `${CJ_BASE_URL}${endpoint}`;
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.code !== 200 && data.result === false) {
        throw new Error(data.message || 'CJDropshipping API error');
    }

    return data;
}

// ========== PRINTFUL API HELPER ==========

async function printfulAPI(endpoint, method = 'GET', body = null) {
    if (!PRINTFUL_API_KEY) {
        throw new Error('PRINTFUL_API_KEY non configurée');
    }

    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`https://api.printful.com${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || 'Printful API error');
    }

    return data;
}

// ========== ROUTES API - PRODUITS ==========

// 1. Get all products (unified: Printful + CJ)
app.get('/api/products', async (req, res) => {
    const source = req.query.source || 'all'; // 'all', 'printful', 'cj'
    let allProducts = [];

    // Fetch Printful products
    if ((source === 'all' || source === 'printful') && PRINTFUL_API_KEY) {
        try {
            const products = await printfulAPI('/store/products');
            const printfulProducts = products.result.map(product => ({
                id: `pf-${product.id}`,
                name: product.name,
                thumbnail: product.thumbnail_url,
                price: product.currency === 'EUR'
                    ? (parseFloat(product.retail_price) * 0.95).toFixed(2)
                    : product.retail_price,
                currency: '€',
                variants: product.variants || [],
                source: 'printful',
                sync_product_id: product.id
            }));
            allProducts.push(...printfulProducts);
        } catch (error) {
            console.error('Erreur Printful:', error.message);
        }
    }

    // Fetch CJ products
    if ((source === 'all' || source === 'cj') && CJ_API_KEY) {
        try {
            const keyword = req.query.keyword || '';
            const category = req.query.cjCategory || '';
            const page = req.query.page || 1;
            const size = req.query.size || 20;

            let queryParams = `?page=${page}&size=${size}`;
            if (keyword) queryParams += `&keyWord=${encodeURIComponent(keyword)}`;
            if (category) queryParams += `&categoryId=${encodeURIComponent(category)}`;

            const cjData = await cjAPI(`/product/list${queryParams}`);

            if (cjData.data && Array.isArray(cjData.data)) {
                const cjProducts = cjData.data.map(product => ({
                    id: `cj-${product.pid}`,
                    cjProductId: product.pid,
                    name: product.productNameEn || product.productName,
                    thumbnail: product.productImage || '',
                    price: product.sellPrice
                        ? (parseFloat(product.sellPrice) * 1.1).toFixed(2)  // +10% margin
                        : '0.00',
                    originalPrice: product.sellPrice,
                    currency: '€',
                    category: product.categoryName || 'Dropshipping',
                    source: 'cj',
                    variants: [],
                    badge: 'Dropshipping'
                }));
                allProducts.push(...cjProducts);
            }
        } catch (error) {
            console.error('Erreur CJ:', error.message);
        }
    }

    // If no products from any source, return fallback flag
    if (allProducts.length === 0) {
        return res.json({
            success: false,
            fallback: true,
            error: 'Aucune source de produits disponible',
            products: []
        });
    }

    res.json({
        success: true,
        products: allProducts,
        total: allProducts.length
    });
});

// 2. Search CJ products specifically
app.get('/api/cj/search', async (req, res) => {
    try {
        const { keyword, category, page = 1, size = 20, minPrice, maxPrice } = req.query;

        if (!keyword && !category) {
            return res.status(400).json({
                success: false,
                error: 'Veuillez fournir un mot-clé ou une catégorie'
            });
        }

        let queryParams = `?page=${page}&size=${size}`;
        if (keyword) queryParams += `&keyWord=${encodeURIComponent(keyword)}`;
        if (category) queryParams += `&categoryId=${encodeURIComponent(category)}`;
        if (minPrice) queryParams += `&minPrice=${minPrice}`;
        if (maxPrice) queryParams += `&maxPrice=${maxPrice}`;

        const data = await cjAPI(`/product/list${queryParams}`);

        const products = (data.data || []).map(product => ({
            id: `cj-${product.pid}`,
            cjProductId: product.pid,
            name: product.productNameEn || product.productName,
            thumbnail: product.productImage || '',
            price: product.sellPrice
                ? (parseFloat(product.sellPrice) * 1.1).toFixed(2)
                : '0.00',
            originalPrice: product.sellPrice,
            currency: '€',
            category: product.categoryName || 'Dropshipping',
            source: 'cj',
            badge: 'Dropshipping'
        }));

        res.json({
            success: true,
            products,
            total: data.total || products.length,
            page: parseInt(page),
            size: parseInt(size)
        });
    } catch (error) {
        console.error('Erreur recherche CJ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Get CJ product details with variants
app.get('/api/cj/products/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const data = await cjAPI(`/product/query?pid=${pid}`);

        if (!data.data) {
            return res.status(404).json({ success: false, error: 'Produit non trouvé' });
        }

        const product = data.data;
        const variants = (product.variants || []).map(v => ({
            id: v.vid,
            name: v.variantNameEn || v.variantName || '',
            price: v.variantSellPrice
                ? (parseFloat(v.variantSellPrice) * 1.1).toFixed(2)
                : '0.00',
            originalPrice: v.variantSellPrice,
            image: v.variantImage || product.productImage,
            sku: v.variantSku || '',
            in_stock: true
        }));

        res.json({
            success: true,
            product: {
                id: `cj-${product.pid}`,
                cjProductId: product.pid,
                name: product.productNameEn || product.productName,
                description: product.description || product.productNameEn || '',
                thumbnail: product.productImage || '',
                images: product.productImageSet || [product.productImage],
                price: product.sellPrice
                    ? (parseFloat(product.sellPrice) * 1.1).toFixed(2)
                    : '0.00',
                originalPrice: product.sellPrice,
                currency: '€',
                category: product.categoryName || 'Dropshipping',
                source: 'cj',
                variants,
                weight: product.productWeight,
                deliveryTime: product.deliveryTime || null
            }
        });
    } catch (error) {
        console.error('Erreur détails CJ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Get CJ categories
app.get('/api/cj/categories', async (req, res) => {
    try {
        const data = await cjAPI('/product/getCategory');

        res.json({
            success: true,
            categories: data.data || []
        });
    } catch (error) {
        console.error('Erreur catégories CJ:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Get Printful product details (keep existing)
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Route to CJ if ID starts with 'cj-'
        if (id.startsWith('cj-')) {
            const pid = id.replace('cj-', '');
            const data = await cjAPI(`/product/query?pid=${pid}`);

            if (!data.data) {
                return res.status(404).json({ success: false, error: 'Produit non trouvé' });
            }

            const product = data.data;
            const variants = (product.variants || []).map(v => ({
                id: v.vid,
                name: v.variantNameEn || v.variantName || '',
                price: v.variantSellPrice
                    ? (parseFloat(v.variantSellPrice) * 1.1).toFixed(2)
                    : '0.00',
                image: v.variantImage || product.productImage,
                sku: v.variantSku || '',
                in_stock: true
            }));

            return res.json({
                success: true,
                product: {
                    id: `cj-${product.pid}`,
                    name: product.productNameEn || product.productName,
                    description: product.description || '',
                    thumbnail: product.productImage || '',
                    variants,
                    source: 'cj'
                }
            });
        }

        // Printful product
        const pfId = id.startsWith('pf-') ? id.replace('pf-', '') : id;
        const product = await printfulAPI(`/store/products/${pfId}`);

        const variants = await Promise.all(
            product.result.sync_variants.map(async (variant) => ({
                id: variant.id,
                name: variant.name,
                size: variant.size,
                color: variant.color,
                price: variant.retail_price,
                sku: variant.sku,
                in_stock: variant.inventory > 0,
                image: variant.files?.[0]?.preview_url || product.result.sync_product.thumbnail_url
            }))
        );

        res.json({
            success: true,
            product: {
                id: `pf-${product.result.sync_product.id}`,
                name: product.result.sync_product.name,
                description: product.result.sync_product.description || 'Produit exclusif NEXUS',
                thumbnail: product.result.sync_product.thumbnail_url,
                variants,
                source: 'printful'
            }
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== ROUTES API - LIVRAISON ==========

// 6. Calculate shipping rates
app.post('/api/shipping', async (req, res) => {
    try {
        const { items, address } = req.body;

        // Separate items by source
        const printfulItems = items.filter(i => (i.source || '').startsWith('pf') || !i.source);
        const cjItems = items.filter(i => (i.source || '').startsWith('cj'));

        let rates = [];

        // Printful shipping
        if (printfulItems.length > 0 && PRINTFUL_API_KEY) {
            try {
                const shippingRequest = {
                    recipient: {
                        address1: address.address1,
                        city: address.city,
                        country_code: address.country_code,
                        state_code: address.state_code || '',
                        zip: address.zip
                    },
                    items: printfulItems.map(item => ({
                        variant_id: item.variant_id,
                        quantity: item.quantity
                    }))
                };

                const pfRates = await printfulAPI('/shipping/rates', 'POST', shippingRequest);
                rates.push(...(pfRates.result || []).map(r => ({ ...r, source: 'printful' })));
            } catch (e) {
                console.error('Erreur shipping Printful:', e.message);
            }
        }

        // CJ shipping - standard estimate
        if (cjItems.length > 0) {
            rates.push({
                id: 'cj-standard',
                name: 'CJ Standard (10-20 jours)',
                rate: '0.00',
                currency: 'EUR',
                source: 'cj',
                minDays: 10,
                maxDays: 20
            });
            rates.push({
                id: 'cj-express',
                name: 'CJ Express (5-10 jours)',
                rate: '4.99',
                currency: 'EUR',
                source: 'cj',
                minDays: 5,
                maxDays: 10
            });
        }

        res.json({ success: true, rates });
    } catch (error) {
        console.error('Error calculating shipping:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== ROUTES API - COMMANDES ==========

// 7. Create Stripe payment intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'eur' } = req.body;

        // Simulated for now
        res.json({
            success: true,
            client_secret: 'mock_client_secret_' + Date.now(),
            message: 'Paiement simulé - Ajoutez votre clé Stripe pour activer les vrais paiements'
        });

        /* With Stripe enabled:
        const stripe = require('stripe')(STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: currency,
            metadata: { integration_check: 'nexus_store' }
        });

        res.json({
            success: true,
            client_secret: paymentIntent.client_secret
        });
        */
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. Create order (routes to correct supplier)
app.post('/api/orders', async (req, res) => {
    try {
        const { items, recipient, payment_id } = req.body;

        // Separate items by source
        const printfulItems = items.filter(i => i.source === 'printful' || !i.source);
        const cjItems = items.filter(i => i.source === 'cj');

        const results = { printful: null, cj: null };

        // Create Printful order
        if (printfulItems.length > 0 && PRINTFUL_API_KEY) {
            const orderData = {
                recipient: {
                    name: recipient.name,
                    address1: recipient.address1,
                    city: recipient.city,
                    country_code: recipient.country_code,
                    state_code: recipient.state_code || '',
                    zip: recipient.zip,
                    email: recipient.email,
                    phone: recipient.phone || ''
                },
                items: printfulItems.map(item => ({
                    sync_variant_id: item.variant_id,
                    quantity: item.quantity
                })),
                retail_costs: {
                    currency: 'EUR',
                    subtotal: printfulItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    shipping: recipient.shipping_cost || 0,
                    tax: 0
                },
                external_id: payment_id
            };

            const order = await printfulAPI('/orders', 'POST', orderData);
            results.printful = {
                order_id: order.result.id,
                status: 'created'
            };
        }

        // Create CJ order
        if (cjItems.length > 0 && CJ_API_KEY) {
            const cjOrderData = {
                orderNumber: `NEXUS-${Date.now()}`,
                shippingCustomerName: recipient.name,
                shippingAddress: recipient.address1,
                shippingAddress2: recipient.address2 || '',
                shippingCity: recipient.city,
                shippingProvince: recipient.state_code || '',
                shippingCountryCode: recipient.country_code,
                shippingZip: recipient.zip,
                shippingPhone: recipient.phone || '',
                email: recipient.email || '',
                fromCountryCode: 'CN',
                logisticName: recipient.shipping_method === 'express' ? 'CJPacket' : 'PostNL',
                products: cjItems.map(item => ({
                    vid: item.variant_id,
                    quantity: item.quantity
                }))
            };

            try {
                const cjOrder = await cjAPI('/shopping/order/createOrderV2', 'POST', cjOrderData);
                results.cj = {
                    order_id: cjOrder.data?.orderId || null,
                    status: 'created'
                };
            } catch (cjError) {
                console.error('Erreur commande CJ:', cjError.message);
                results.cj = { error: cjError.message, status: 'failed' };
            }
        }

        res.json({
            success: true,
            orders: results,
            message: 'Commande créée avec succès !'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 9. Confirm Printful order
app.post('/api/orders/:id/confirm', async (req, res) => {
    try {
        const { id } = req.params;
        const confirmation = await printfulAPI(`/orders/@${id}/confirm`, 'POST');

        res.json({
            success: true,
            tracking: confirmation.result.shipments || [],
            message: 'Commande confirmée et envoyée en production !'
        });
    } catch (error) {
        console.error('Error confirming order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 10. Get order status
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // CJ order
        if (id.startsWith('cj-')) {
            const orderId = id.replace('cj-', '');
            const data = await cjAPI(`/shopping/order/getOrderDetail?orderId=${orderId}`);
            return res.json({ success: true, order: data.data, source: 'cj' });
        }

        // Printful order
        const order = await printfulAPI(`/orders/@${id}`);
        res.json({ success: true, order: order.result, source: 'printful' });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ========== HEALTH CHECK ==========

app.get('/api/health', async (req, res) => {
    let cjStatus = 'not configured';
    if (CJ_API_KEY) {
        try {
            await getCJAccessToken();
            cjStatus = 'connected';
        } catch {
            cjStatus = 'error';
        }
    }

    res.json({
        success: true,
        message: 'NEXUS Store API is running',
        providers: {
            printful: PRINTFUL_API_KEY ? 'connected' : 'not configured',
            cj: cjStatus,
            stripe: STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== 'votre_clé_stripe_ici' ? 'connected' : 'not configured'
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   NEXUS Store API Server                 ║
    ║   Port: ${PORT}                             ║
    ║   Printful: ${PRINTFUL_API_KEY ? '✅' : '❌'} ${PRINTFUL_API_KEY ? 'Connected' : 'Not configured'}       ║
    ║   CJDropshipping: ${CJ_API_KEY ? '✅' : '❌'} ${CJ_API_KEY ? 'Connected' : 'Not configured'}  ║
    ║   Status: http://localhost:${PORT}         ║
    ╚══════════════════════════════════════════╝
    `);
});

module.exports = app;
