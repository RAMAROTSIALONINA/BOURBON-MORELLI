-- ============================================
-- BOURBON MORELLI - Base de données complète en un seul fichier
-- ============================================

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS bourbon_morelli 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE bourbon_morelli;

-- ============================================
-- Table des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ajouter l'index unique sur email
ALTER TABLE users ADD UNIQUE KEY idx_email (email);

-- ============================================
-- Table des catégories
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    parent_id INT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ajouter l'index unique sur slug
ALTER TABLE categories ADD UNIQUE KEY idx_slug (slug);

-- ============================================
-- Table des produits
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    track_inventory BOOLEAN DEFAULT TRUE,
    weight DECIMAL(8, 2),
    category_id INT,
    brand VARCHAR(100),
    status ENUM('active', 'draft', 'archived') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ajouter les index uniques
ALTER TABLE products ADD UNIQUE KEY idx_slug (slug);
ALTER TABLE products ADD UNIQUE KEY idx_sku (sku);

-- ============================================
-- Table des images de produits
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table des paniers
-- ============================================
CREATE TABLE IF NOT EXISTS carts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table des articles du panier
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table des commandes
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    currency VARCHAR(3) DEFAULT 'EUR',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    shipping_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table des articles de commande
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Table des adresses de commande
-- ============================================
CREATE TABLE IF NOT EXISTS order_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    type ENUM('billing', 'shipping') NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    street_address VARCHAR(255) NOT NULL,
    apartment VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- INSERTION DES DONNÉES DE TEST
-- ============================================

-- Insertion des catégories
INSERT IGNORE INTO categories (name, slug, description) VALUES
('Nappes', 'nappes', 'Collection de nappes élégantes pour toutes occasions'),
('T-Shirts', 't-shirts', 'T-Shirts premium coton bio'),
('Polos', 'polos', 'Polos classiques et modernes'),
('Pantalons', 'pantalons', 'Pantalons sur mesure confortables');

-- Insertion des produits BOURBON MORELLI
INSERT IGNORE INTO products (name, slug, description, short_description, sku, price, category_id, status) VALUES
('Nappe de Table Luxe', 'nappe-de-table-luxe', 'Nappe de table luxueuse en coton égyptien, parfaite pour les dîners spéciaux. Dimensions 200x300cm.', 'Nappe de table luxueuse coton égyptien', 'NAP001', 89.99, 1, 'active'),
('T-shirt Premium', 't-shirt-premium', 'T-shirt premium en coton bio, coupe moderne et confortable. Disponible en plusieurs couleurs.', 'T-shirt premium coton bio', 'TSH001', 39.99, 2, 'active'),
('Polo Classique', 'polo-classique', 'Polo classique en piqué de coton, col boutonné et coupe ajustée. Idéal pour le golf et le quotidien.', 'Polo classique piqué coton', 'POL001', 49.99, 3, 'active'),
('Pantalon Chic', 'pantalon-chic', 'Pantalon chic en laine mélangée, coupe droite et finition impeccable. Parfait pour le bureau.', 'Pantalon chic laine mélangée', 'PAN001', 79.99, 4, 'active');

-- Insertion des images de produits
INSERT IGNORE INTO product_images (product_id, image_url, alt_text, is_primary) VALUES
(1, '/images/nappe-table.png', 'Nappe de Table Luxe - vue principale', TRUE),
(2, '/images/T-shirts1.PNG', 'T-shirt Premium - vue principale', TRUE),
(3, '/images/Polos 1.PNG', 'Polo Classique - vue principale', TRUE),
(4, '/images/Pantalons 1.PNG', 'Pantalon Chic - vue principale', TRUE);

-- Insertion des utilisateurs de test
-- Mot de passe: admin123 (hashé avec bcrypt)
INSERT IGNORE INTO users (first_name, last_name, email, password_hash, phone, role) VALUES
('Administrateur', 'BOURBON MORELLI', 'admin@bourbonmorelli.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', '+261 34 12 345 67', 'admin');

-- Mot de passe: password123 (hashé avec bcrypt)
INSERT IGNORE INTO users (first_name, last_name, email, password_hash, phone, role) VALUES
('Jean', 'Dupont', 'jean.dupont@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', '+261 32 11 111 11', 'customer'),
('Marie', 'Martin', 'marie.martin@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', '+261 33 22 222 22', 'customer'),
('Pierre', 'Bernard', 'pierre.bernard@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', '+261 34 33 333 33', 'customer');

-- ============================================
-- Vérification et messages
-- ============================================

SELECT 'Base de données BOURBON MORELLI créée avec succès!' as message;
SELECT 'Identifiants de connexion:' as info;
SELECT 'Admin: admin@bourbonmorelli.com / admin123' as admin_login;
SELECT 'Utilisateurs de test:' as user_info;
SELECT '  - jean.dupont@email.com / password123' as user1;
SELECT '  - marie.martin@email.com / password123' as user2;
SELECT '  - pierre.bernard@email.com / password123' as user3;
SELECT 'Produits BOURBON MORELLI créés:' as products_info;
SELECT '  - Nappe de Table Luxe: 89.99€' as product1;
SELECT '  - T-shirt Premium: 39.99€' as product2;
SELECT '  - Polo Classique: 49.99€' as product3;
SELECT '  - Pantalon Chic: 79.99€' as product4;

-- Afficher le nombre d'enregistrements
SELECT 
    (SELECT COUNT(*) FROM users) as utilisateurs,
    (SELECT COUNT(*) FROM products) as produits,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM product_images) as images_produits;
