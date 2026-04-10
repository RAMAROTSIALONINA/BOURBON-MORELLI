# 🗄️ Base de données BOURBON MORELLI

## 📋 Instructions d'installation

### 🚀 Méthode 1: Script Node.js (Recommandé)

```bash
cd server/scripts
node setupDatabase.js
```

### 🌐 Méthode 2: phpMyAdmin

1. Ouvrir phpMyAdmin: http://localhost/phpmyadmin
2. Importer le fichier: `database_complete.sql`

### 💻 Méthode 3: Ligne de commande MySQL

```bash
mysql -u root -p < database_complete.sql
```

## 🔑 Identifiants de connexion

### 👤 Administrateur
- **Email**: admin@bourbonmorelli.com
- **Mot de passe**: admin123
- **Accès**: `/admin/dashboard`

### 👤 Utilisateurs de test
- **Email**: jean.dupont@email.com
- **Mot de passe**: password123
- **Email**: marie.martin@email.com
- **Mot de passe**: password123
- **Email**: pierre.bernard@email.com
- **Mot de passe**: password123

## 🛍️ Produits disponibles

| Produit | Prix | Catégorie |
|---------|------|-----------|
| Nappe de Table Luxe | 89.99€ | Nappes |
| T-shirt Premium | 39.99€ | T-Shirts |
| Polo Classique | 49.99€ | Polos |
| Pantalon Chic | 79.99€ | Pantalons |

## 📊 Structure de la base

- **users**: Utilisateurs et authentification
- **categories**: Catégories de produits
- **products**: Produits BOURBON MORELLI
- **product_images**: Images des produits
- **carts/cart_items**: Panier d'achat
- **orders/order_items**: Commandes et détails
- **order_addresses**: Adresses de livraison

## ✅ Après installation

1. Démarrer le serveur backend: `cd server && npm start`
2. Démarrer le frontend: `cd client && npm start`
3. Accéder à l'application: http://localhost:3000

**La base de données est prête à l'emploi !** 🎉
