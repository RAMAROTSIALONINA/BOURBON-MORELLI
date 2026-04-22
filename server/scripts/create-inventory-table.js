const mysql = require('mysql2/promise');
require('dotenv').config();

async function createInventoryTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('Vérification de la table inventory...');

    // Vérifier si la table existe
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'inventory'"
    );

    if (tables.length === 0) {
      console.log('La table inventory n\'existe pas, création en cours...');
      
      // Créer la table inventory
      await connection.execute(`
        CREATE TABLE inventory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NULL,
          variant_id INT NULL,
          quantity INT NOT NULL DEFAULT 0,
          reserved_quantity INT NOT NULL DEFAULT 0,
          available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
          location VARCHAR(100),
          low_stock_threshold INT DEFAULT 10,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
          INDEX idx_product_id (product_id),
          INDEX idx_variant_id (variant_id),
          INDEX idx_available_quantity (available_quantity)
        )
      `);
      
      console.log('Table inventory créée avec succès !');
    } else {
      console.log('La table inventory existe déjà.');
      
      // Vérifier si la colonne low_stock_threshold existe
      const [columns] = await connection.execute(`
        SHOW COLUMNS FROM inventory LIKE 'low_stock_threshold'
      `);
      
      if (columns.length === 0) {
        console.log('Ajout de la colonne low_stock_threshold...');
        await connection.execute(`
          ALTER TABLE inventory 
          ADD COLUMN low_stock_threshold INT DEFAULT 10
        `);
        console.log('Colonne low_stock_threshold ajoutée avec succès !');
      }
    }

    await connection.end();
    console.log('Opération terminée avec succès !');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

createInventoryTable();
