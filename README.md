# 🚀 FLUX Store - E-commerce Complet

Site e-commerce professionnel avec intégration Printful et Stripe.

## ✨ Fonctionnalités

- 🎨 **Design futuriste moderne** - Interface utilisateur époustouflante
- 🛍️ **Catalogue produits** - Synchronisation automatique avec Printful
- 🔍 **Recherche & Filtres** - Trouvez rapidement ce que vous cherchez
- 🛒 **Panier intelligent** - Sauvegarde locale automatique
- 💳 **Paiement Stripe** - Paiements sécurisés intégrés
- 📦 **Commandes automatiques** - Envoi automatique à Printful après paiement
- 📱 **100% Responsive** - Fonctionne sur tous les appareils

## 🎯 Architecture

```
flux-store/
├── server.js           # Backend API (Express + Node.js)
├── package.json        # Dépendances npm
├── .env.example        # Configuration (à copier en .env)
├── public/             # Frontend
│   └── index.html      # Site web (flux-store.html)
└── README.md          # Ce fichier
```

## 🚀 Installation Rapide

### Prérequis
- Node.js 14+ installé
- Compte Printful (✅ Déjà configuré)
- Compte Stripe (optionnel pour tests)

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration

Créez un fichier `.env` à la racine :

```bash
cp .env.example .env
```

Éditez `.env` et ajoutez vos clés Stripe :

```env
# Printful (déjà configuré)
PRINTFUL_API_KEY=P3rSHxWx6aBSQiNiWviFkSaaqqDOXUuQLZf4diHM

# Stripe (obtenez vos clés sur https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_votre_cle_test
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique

PORT=3000
```

### 3. Démarrage

```bash
npm start
```

Le serveur démarre sur http://localhost:3000

### 4. Accéder au site

Ouvrez `flux-store.html` dans votre navigateur.

## 📋 Configuration Printful

### ✅ Déjà configuré !

- **Token** : P3rSHxWx6aBSQiNiWviFkSaaqqDOXUuQLZf4diHM
- **Store** : Nexus Social
- **Permissions** : Orders, Products, Files, Webhooks

### Créer vos produits sur Printful

1. Connectez-vous sur https://printful.com
2. Allez dans **Stores > Nexus Social**
3. Cliquez sur **Add Product**
4. Choisissez un produit (T-shirt, Hoodie, etc.)
5. Uploadez votre design FLUX
6. Définissez les prix
7. Publiez !

Les produits apparaîtront automatiquement sur votre site.

## 💳 Configuration Stripe

### 1. Créez un compte

- Allez sur https://stripe.com
- Créez un compte gratuit
- Activez le mode Test

### 2. Obtenez vos clés API

1. Allez dans **Developers > API Keys**
2. Copiez la **Secret key** (commence par `sk_test_`)
3. Copiez la **Publishable key** (commence par `pk_test_`)
4. Ajoutez-les dans votre `.env`

### 3. Testez les paiements

Utilisez ces cartes de test :
- **Succès** : 4242 4242 4242 4242
- **Échec** : 4000 0000 0000 0002
- Date : N'importe quelle date future
- CVC : N'importe quel 3 chiffres

## 🔧 API Endpoints

### Produits

```bash
GET /api/products
# Récupère tous les produits depuis Printful

GET /api/products/:id
# Récupère les détails d'un produit avec ses variantes
```

### Paiement

```bash
POST /api/create-payment-intent
Body: { amount: 29.99, currency: "eur" }
# Crée une intention de paiement Stripe
```

### Commandes

```bash
POST /api/orders
Body: {
  items: [{variant_id, quantity, price}],
  recipient: {name, email, address...},
  payment_id: "..."
}
# Crée une commande dans Printful

POST /api/orders/:id/confirm
# Confirme et envoie la commande en production

GET /api/orders/:id
# Récupère le statut d'une commande
```

### Livraison

```bash
POST /api/shipping
Body: { items: [...], address: {...} }
# Calcule les frais de livraison
```

## 🌐 Déploiement Production

### Option 1 : Vercel (Recommandé - Gratuit)

1. Installez Vercel CLI :
```bash
npm i -g vercel
```

2. Déployez :
```bash
vercel
```

3. Configurez les variables d'environnement dans le dashboard Vercel

### Option 2 : Heroku

```bash
heroku create flux-store
heroku config:set PRINTFUL_API_KEY=...
heroku config:set STRIPE_SECRET_KEY=...
git push heroku main
```

### Option 3 : VPS (DigitalOcean, AWS, etc.)

```bash
# Sur votre serveur
git clone votre-repo
cd flux-store
npm install
pm2 start server.js --name flux-store
```

## 🎨 Personnalisation

### Couleurs

Éditez dans `flux-store.html`, section `:root` :

```css
:root {
    --primary: #0ea5e9;      /* Bleu principal */
    --secondary: #06b6d4;    /* Cyan */
    --accent: #f97316;       /* Orange */
    --bg-dark: #0a0a0f;      /* Fond sombre */
    --bg-card: #1a1a24;      /* Fond carte */
}
```

### Logo

Remplacez dans le HTML :
```html
<div class="logo">FLUX</div>
```

### Textes

Modifiez les sections hero, footer, etc. dans `flux-store.html`

## 📊 Workflow Complet

1. **Client visite le site** → Produits chargés depuis Printful
2. **Ajoute au panier** → Sauvegardé localement
3. **Checkout** → Paiement via Stripe
4. **Paiement validé** → Commande créée automatiquement dans Printful
5. **Printful produit** → Impression et expédition automatiques
6. **Client reçoit** → Suivi de livraison

## 🐛 Résolution de problèmes

### Le serveur ne démarre pas

```bash
# Vérifiez que Node.js est installé
node --version

# Réinstallez les dépendances
rm -rf node_modules
npm install
```

### Les produits ne se chargent pas

1. Vérifiez que le serveur est démarré
2. Vérifiez votre token Printful
3. Assurez-vous d'avoir des produits publiés sur Printful

### Erreur CORS

Changez l'URL de l'API dans `flux-store.html` :
```javascript
const API_BASE = 'https://votre-domaine.com/api';
```

### Erreur Stripe

1. Vérifiez vos clés API dans `.env`
2. Assurez-vous d'utiliser les clés de test (`sk_test_...`)
3. Consultez les logs du serveur

## 📞 Support

- **Printful** : https://www.printful.com/docs
- **Stripe** : https://stripe.com/docs
- **Issues** : Créez une issue sur votre repo Git

## 📄 Licence

MIT - Libre d'utilisation et modification

## 🎉 Prêt !

Votre boutique FLUX est maintenant opérationnelle !

```
╔══════════════════════════════════════╗
║   🚀 FLUX Store                      ║
║   Frontend: flux-store.html          ║
║   Backend: http://localhost:3000     ║
║   Status: ✅ Opérationnel            ║
╚══════════════════════════════════════╝
```

Pour démarrer :
1. `npm install`
2. `npm start`
3. Ouvrez `flux-store.html`
4. Profitez ! 🎊
