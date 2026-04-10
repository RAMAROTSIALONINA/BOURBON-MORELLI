const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4'
};

async function initDatabase() {
  let connection;
  
  try {
    console.log('Connexion à MySQL...');
    connection = await mysql.createConnection(dbConfig);

    // 1. Créer la base de données si elle n'existe pas
    console.log('Création de la base de données bourbon_morelli...');
    await connection.query('CREATE DATABASE IF NOT EXISTS bourbon_morelli CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('Base de données créée avec succès!');
    
    // Fermer la connexion et se reconnecter à la base de données
    await connection.end();
    
    // Se reconnecter à la base de données bourbon_morelli
    connection = await mysql.createConnection({
      ...dbConfig,
      database: 'bourbon_morelli'
    });
    console.log('Connecté à la base de données bourbon_morelli!');

    // 2. Créer les tables
    console.log('Création des tables...');
    
    // Table users
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('customer', 'admin') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role)
      )
    `);

    // Table categories
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        parent_id INT NULL,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id)
      )
    `);

    // Table products
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        short_description TEXT,
        sku VARCHAR(100) UNIQUE NOT NULL,
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category_id (category_id),
        INDEX idx_status (status),
        INDEX idx_featured (featured),
        FULLTEXT idx_search (name, description)
      )
    `);

    // Table product_images
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        alt_text VARCHAR(255),
        sort_order INT DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id)
      )
    `);

    console.log('Tables créées avec succès!');

    // 3. Insérer les catégories
    console.log('Insertion des catégories...');
    const categories = [
      ['Nappes', 'nappes', 'Collection de nappes élégantes pour toutes occasions'],
      ['T-Shirts', 't-shirts', 'T-Shirts premium coton bio'],
      ['Polos', 'polos', 'Polos classiques et modernes'],
      ['Pantalons', 'pantalons', 'Pantalons sur mesure confortables']
    ];

    for (const [name, slug, description] of categories) {
      await connection.execute(
        'INSERT IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [name, slug, description]
      );
    }

    // 4. Insérer les produits
    console.log('Insertion des produits...');
    const products = [
      ['Nappe de Table Luxe', 'nappe-de-table-luxe', 'Nappe de table luxueuse en coton égyptien, parfaite pour les dîners spéciaux. Dimensions 200x300cm.', 'Nappe de table luxueuse coton égyptien', 'NAP001', 89.99, 1, 'active'],
      ['T-shirt Premium', 't-shirt-premium', 'T-shirt premium en coton bio, coupe moderne et confortable. Disponible en plusieurs couleurs.', 'T-shirt premium coton bio', 'TSH001', 39.99, 2, 'active'],
      ['Polo Classique', 'polo-classique', 'Polo classique en piqué de coton, col boutonné et coupe ajustée. Idéal pour le golf et le quotidien.', 'Polo classique piqué coton', 'POL001', 49.99, 3, 'active'],
      ['Pantalon Chic', 'pantalon-chic', 'Pantalon chic en laine mélangée, coupe droite et finition impeccable. Parfait pour le bureau.', 'Pantalon chic laine mélangée', 'PAN001', 79.99, 4, 'active']
    ];

    for (const [name, slug, description, short_description, sku, price, category_id, status] of products) {
      await connection.execute(
        'INSERT IGNORE INTO products (name, slug, description, short_description, sku, price, category_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, slug, description, short_description, sku, price, category_id, status]
      );
    }

    // 5. Insérer les images de produits
    console.log('Insertion des images de produits...');
    const productImages = [
      [1, '/images/nappe-table.png', 'Nappe de Table Luxe - vue principale', TRUE],
      [2, '/images/T-shirts1.PNG', 'T-shirt Premium - vue principale', TRUE],
      [3, '/images/Polos 1.PNG', 'Polo Classique - vue principale', TRUE],
      [4, '/images/Pantalons 1.PNG', 'Pantalon Chic - vue principale', TRUE]
    ];

    for (const [product_id, image_url, alt_text, is_primary] of productImages) {
      await connection.execute(
        'INSERT IGNORE INTO product_images (product_id, image_url, alt_text, is_primary) VALUES (?, ?, ?, ?)',
        [product_id, image_url, alt_text, is_primary]
      );
    }

    // 6. Créer les utilisateurs avec mots de passe hashés
    console.log('Création des utilisateurs...');
    
    // Hash des mots de passe
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('password123', 12);

    // Insérer l'administrateur
    await connection.execute(
      'INSERT IGNORE INTO users (first_name, last_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['Administrateur', 'BOURBON MORELLI', 'admin@bourbonmorelli.com', adminPassword, '+261 34 12 345 67', 'admin']
    );

    // Insérer les utilisateurs de test
    const testUsers = [
      ['Jean', 'Dupont', 'jean.dupont@email.com', userPassword, '+261 32 11 111 11'],
      ['Marie', 'Martin', 'marie.martin@email.com', userPassword, '+261 33 22 222 22'],
      ['Pierre', 'Bernard', 'pierre.bernard@email.com', userPassword, '+261 34 33 333 33']
    ];

    for (const [first_name, last_name, email, password_hash, phone] of testUsers) {
      await connection.execute(
        'INSERT IGNORE INTO users (first_name, last_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, password_hash, phone, 'customer']
      );
    }

    // 7. Vérifier les données insérées
    console.log('\nVérification des données insérées:');
    
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    
    console.log(`Utilisateurs: ${userCount[0].count}`);
    console.log(`Produits: ${productCount[0].count}`);
    console.log(`Catégories: ${categoryCount[0].count}`);

    console.log('\n' + '='.repeat(50));
    console.log('BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS!');
    console.log('='.repeat(50));
    console.log('\nIdentifiants de connexion:');
    console.log('Admin: admin@bourbonmorelli.com / admin123');
    console.log('Utilisateurs de test:');
    console.log('  - jean.dupont@email.com / password123');
    console.log('  - marie.martin@email.com / password123');
    console.log('  - pierre.bernard@email.com / password123');
    console.log('\nProduits BOURBON MORELLI créés:');
    console.log('  - Nappe de Table Luxe: 89.99');
    console.log('  - T-shirt Premium: 39.99');
    console.log('  - Polo Classique: 49.99');
    console.log('  - Pantalon Chic: 79.99');

  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nConnexion fermée.');
    }
  }
}

// Exécuter l'initialisation
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('\nInitialisation terminée avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nÉchec de l\'initialisation:', error);
      process.exit(1);
    });
}

module.exports = initDatabase;
