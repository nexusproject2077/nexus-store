# 💳 Guide Configuration Stripe

## Pourquoi Stripe ?

Stripe est **LE** leader mondial des paiements en ligne :
- ✅ Sécurité maximale (PCI DSS Level 1)
- ✅ Accepte toutes les cartes bancaires
- ✅ Interface simple et moderne
- ✅ Commission : 1,4% + 0,25€ par transaction (Europe)
- ✅ Pas d'abonnement mensuel
- ✅ API exceptionnelle

## 🚀 Étapes de configuration

### 1. Créer un compte Stripe

1. Allez sur https://stripe.com
2. Cliquez sur "Commencer maintenant"
3. Remplissez vos informations
4. Validez votre email

### 2. Activer le mode Test

1. Dans le dashboard Stripe
2. Basculez le switch en haut à gauche sur **"Mode test"**
3. Cela vous permet de tester sans vraie carte

### 3. Obtenir vos clés API

1. Cliquez sur **"Développeurs"** (Developers)
2. Cliquez sur **"Clés API"** (API Keys)
3. Vous verrez 2 clés :

   **🔑 Publishable key** (commence par `pk_test_`)
   - C'est votre clé publique
   - Elle va dans le frontend (HTML)
   - Pas de danger si elle est visible
   
   **🔐 Secret key** (commence par `sk_test_`)
   - C'est votre clé secrète
   - Elle va dans le backend (.env)
   - NE JAMAIS la partager ou la mettre dans le code HTML !

4. Cliquez sur "Révéler la clé de test" pour la Secret key
5. Copiez les deux clés

### 4. Ajouter dans votre .env

Éditez le fichier `.env` :

```env
STRIPE_SECRET_KEY=sk_test_51XxXxX...votre_clé_secrète
STRIPE_PUBLISHABLE_KEY=pk_test_51XxXxX...votre_clé_publique
```

### 5. Redémarrer le serveur

```bash
npm start
```

## 🧪 Tester les paiements

Utilisez ces numéros de carte de test :

### ✅ Paiement réussi
```
Numéro : 4242 4242 4242 4242
Date   : N'importe quelle date future (ex: 12/26)
CVC    : N'importe quel 3 chiffres (ex: 123)
```

### ❌ Paiement refusé
```
Numéro : 4000 0000 0000 0002
Date   : N'importe quelle date future
CVC    : N'importe quel 3 chiffres
```

### 🔐 Authentification 3D Secure requise
```
Numéro : 4000 0027 6000 3184
Date   : N'importe quelle date future
CVC    : N'importe quel 3 chiffres
```

Plus de cartes de test : https://stripe.com/docs/testing

## 🌐 Passer en production

### Quand vous êtes prêt à accepter de vrais paiements :

1. Dans Stripe, cliquez sur **"Activer votre compte"**
2. Remplissez les informations requises :
   - Informations sur votre entreprise
   - Informations bancaires (pour recevoir les paiements)
   - Documents d'identité
3. Attendez la validation (quelques heures à 1 jour)
4. Une fois validé, passez en **"Mode production"**
5. Obtenez vos nouvelles clés (sans `_test`)
6. Remplacez dans `.env` :

```env
STRIPE_SECRET_KEY=sk_live_51XxXxX...
STRIPE_PUBLISHABLE_KEY=pk_live_51XxXxX...
```

## 💰 Tarification Stripe

### Europe (France)
- **1,4% + 0,25€** par transaction réussie
- Pas de frais d'abonnement
- Pas de frais cachés

### Exemple
Vente de 50€ :
- Commission Stripe : (50 × 1,4%) + 0,25€ = **0,95€**
- Vous recevez : **49,05€**

### Délai de paiement
- 2 à 7 jours après la transaction
- Configurable dans Stripe

## 🔒 Sécurité

Stripe gère automatiquement :
- ✅ Chiffrement des données
- ✅ Protection contre la fraude
- ✅ Conformité PCI DSS
- ✅ 3D Secure / SCA
- ✅ Remboursements

Vous n'avez **jamais** accès aux numéros de carte complets.

## 📊 Dashboard Stripe

Après configuration, vous aurez accès à :
- 📈 Statistiques de ventes en temps réel
- 💳 Liste de toutes les transactions
- 👥 Gestion des clients
- 💸 Remboursements en un clic
- 📧 Emails automatiques aux clients
- 🧾 Facturation automatique

## 🆘 Aide

- **Documentation** : https://stripe.com/docs
- **Support** : support@stripe.com
- **Communauté** : https://support.stripe.com

## ⚡ Prêt !

Une fois configuré, votre site acceptera automatiquement les paiements !

Les commandes seront créées dans Printful après paiement réussi.

---

**Besoin d'aide ?** Consultez le README.md principal ou contactez le support Stripe.
