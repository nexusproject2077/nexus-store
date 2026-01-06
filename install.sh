#!/bin/bash

echo "╔══════════════════════════════════════╗"
echo "║   🚀 FLUX Store - Installation      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    echo "📥 Installez Node.js depuis: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js détecté: $(node --version)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env manquant"
    echo "📝 Création depuis .env.example..."
    cp .env.example .env
    echo "✅ Fichier .env créé"
    echo ""
    echo "⚠️  IMPORTANT: Éditez .env et ajoutez vos clés Stripe !"
    echo ""
fi

# Install dependencies
echo "📦 Installation des dépendances..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dépendances installées"
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║   🎉 Installation terminée !         ║"
    echo "╚══════════════════════════════════════╝"
    echo ""
    echo "Pour démarrer :"
    echo "  1. npm start"
    echo "  2. Ouvrez public/index.html"
    echo ""
    echo "API disponible sur: http://localhost:3000"
    echo ""
else
    echo "❌ Erreur lors de l'installation"
    exit 1
fi
