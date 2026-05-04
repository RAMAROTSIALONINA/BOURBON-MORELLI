const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkProductsStructure() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== STRUCTURE TABLE PRODUCTS ===\n');

    // Obtenir la structure de la table products
    const [structure] = await connection.execute('SHOW COLUMNS FROM products');
    
    console.log('Nombre de colonnes:', structure.length);
    console.log('\nDétail des colonnes:');
    structure.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field.padEnd(20)} | ${col.Type.padEnd(20)} | ${col.Null.padEnd(5)} | ${col.Key}`);
    });

    // Vérifier quelques produits existants
    const [products] = await connection.execute('SELECT id, name, sizes FROM products LIMIT 5');
    
    console.log('\n=== EXEMPLES DE PRODUITS ===\n');
    if (products.length > 0) {
      products.forEach((product, index) => {
        console.log(`Produit ${index + 1}:`);
        console.log(`  ID: ${product.id}`);
        console.log(`  Nom: ${product.name}`);
        console.log(`  Tailles: ${product.sizes || 'NULL'}`);
        console.log(`  Type de tailles: ${typeof product.sizes}`);
        console.log('');
      });
    } else {
      console.log('Aucun produit trouvé dans la base de données');
    }

    // Vérifier s'il y a des produits avec des tailles
    const [productsWithSizes] = await connection.execute('SELECT COUNT(*) as count FROM products WHERE sizes IS NOT NULL AND sizes != ""');
    console.log(`Produits avec des tailles: ${productsWithSizes[0].count}`);

    await connection.end();
    console.log('\nVérification terminée !');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkProductsStructure();
