const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuration
const PRINTFUL_API_KEY = 'P3rSHxWx6aBSQiNiWviFkSaaqqDOXUuQLZf4diHM';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'votre_clé_stripe_ici';

// Printful API Helper
async function printfulAPI(endpoint, method = 'GET', body = null) {
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

// ========== ROUTES API ==========

// 1. Get all products from Printful
app.get('/api/products', async (req, res) => {
    try {
        // Get store info first
        const storeInfo = await printfulAPI('/stores');
        console.log('Store Info:', storeInfo);
        
        // Get sync products (products with your designs)
        const products = await printfulAPI('/store/products');
        
        // Transform to frontend format
        const transformedProducts = products.result.map(product => ({
            id: product.id,
            name: product.name,
            thumbnail: product.thumbnail_url,
            price: product.currency === 'EUR' ? 
                (parseFloat(product.retail_price) * 0.95).toFixed(2) : // Convert USD to EUR approximation
                product.retail_price,
            currency: '€',
            variants: product.variants || [],
            sync_product_id: product.id
        }));
        
        res.json({
            success: true,
            products: transformedProducts
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            fallback: true
        });
    }
});

// 2. Get product details with variants
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await printfulAPI(`/store/products/${id}`);
        
        // Get detailed variant info
        const variants = await Promise.all(
            product.result.sync_variants.map(async (variant) => {
                return {
                    id: variant.id,
                    name: variant.name,
                    size: variant.size,
                    color: variant.color,
                    price: variant.retail_price,
                    sku: variant.sku,
                    in_stock: variant.inventory > 0,
                    image: variant.files?.[0]?.preview_url || product.result.sync_product.thumbnail_url
                };
            })
        );
        
        res.json({
            success: true,
            product: {
                id: product.result.sync_product.id,
                name: product.result.sync_product.name,
                description: product.result.sync_product.description || 'Produit exclusif FLUX',
                thumbnail: product.result.sync_product.thumbnail_url,
                variants: variants
            }
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 3. Calculate shipping rates
app.post('/api/shipping', async (req, res) => {
    try {
        const { items, address } = req.body;
        
        const shippingRequest = {
            recipient: {
                address1: address.address1,
                city: address.city,
                country_code: address.country_code,
                state_code: address.state_code || '',
                zip: address.zip
            },
            items: items.map(item => ({
                variant_id: item.variant_id,
                quantity: item.quantity
            }))
        };
        
        const rates = await printfulAPI('/shipping/rates', 'POST', shippingRequest);
        
        res.json({
            success: true,
            rates: rates.result
        });
    } catch (error) {
        console.error('Error calculating shipping:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 4. Create Stripe payment intent
app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'eur' } = req.body;
        
        // Pour l'instant, retour simulé (vous ajouterez Stripe après)
        res.json({
            success: true,
            client_secret: 'mock_client_secret_' + Date.now(),
            message: 'Paiement simulé - Ajoutez votre clé Stripe pour activer les vrais paiements'
        });
        
        /* Avec Stripe activé:
        const stripe = require('stripe')(STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            metadata: { integration_check: 'flux_store' }
        });
        
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret
        });
        */
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 5. Create order in Printful after successful payment
app.post('/api/orders', async (req, res) => {
    try {
        const { items, recipient, payment_id } = req.body;
        
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
            items: items.map(item => ({
                sync_variant_id: item.variant_id,
                quantity: item.quantity
            })),
            retail_costs: {
                currency: 'EUR',
                subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                shipping: recipient.shipping_cost || 0,
                tax: 0
            },
            external_id: payment_id // Your payment reference
        };
        
        const order = await printfulAPI('/orders', 'POST', orderData);
        
        res.json({
            success: true,
            order_id: order.result.id,
            message: 'Commande créée avec succès !'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. Confirm order (actually send to production)
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
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 7. Get order status
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await printfulAPI(`/orders/@${id}`);
        
        res.json({
            success: true,
            order: order.result
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'FLUX Store API is running',
        printful: PRINTFUL_API_KEY ? 'connected' : 'not configured',
        stripe: STRIPE_SECRET_KEY !== 'votre_clé_stripe_ici' ? 'connected' : 'not configured'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║   🚀 FLUX Store API Server          ║
    ║   Port: ${PORT}                        ║
    ║   Printful: ✅ Connected              ║
    ║   Status: http://localhost:${PORT}    ║
    ╚══════════════════════════════════════╝
    `);
});

module.exports = app;
