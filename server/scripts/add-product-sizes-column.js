const mysql = require('mysql2/promise');
require('dotenv').config();

async function addProductSizesColumn() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('Vérification de la colonne sizes dans products...');

    const [cols] = await connection.execute(
      "SHOW COLUMNS FROM products LIKE 'sizes'"
    );

    if (cols.length === 0) {
      console.log('Ajout de la colonne sizes...');
      await connection.execute(
        "ALTER TABLE products ADD COLUMN sizes VARCHAR(255) NULL AFTER brand"
      );
      console.log('✅ Colonne sizes ajoutée avec succès !');
    } else {
      console.log('ℹ️  La colonne sizes existe déjà.');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addProductSizesColumn();
