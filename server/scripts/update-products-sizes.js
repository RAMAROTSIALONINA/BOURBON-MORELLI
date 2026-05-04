const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateProductsSizes() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== MISE À JOUR DES TAILLES DES PRODUITS ===\n');

    // Mettre à jour les produits avec des tailles appropriées
    const updates = [
      { id: 3, name: 'Pantalons premium', sizes: '30,32,34,36,38,40' },
      { id: 21, name: 'T-shirt Premium', sizes: 'S,M,L,XL' },
      { id: 24, name: 'Polos Premium', sizes: 'S,M,L,XL,XXL' },
      { id: 26, name: 'Nappe de Table', sizes: '120x180cm,140x200cm,160x240cm' }
    ];

    for (const update of updates) {
      console.log(`Mise à jour du produit ${update.id}: ${update.name}`);
      console.log(`  Tailles: ${update.sizes}`);
      
      await connection.execute(
        'UPDATE products SET sizes = ? WHERE id = ?',
        [update.sizes, update.id]
      );
      
      console.log('  ✅ Mis à jour avec succès\n');
    }

    // Vérifier les mises à jour
    console.log('=== VÉRIFICATION DES MISES À JOUR ===\n');
    const [updatedProducts] = await connection.execute(
      'SELECT id, name, sizes FROM products WHERE id IN (3, 21, 24, 26)'
    );
    
    updatedProducts.forEach(product => {
      console.log(`Produit ${product.id}: ${product.name}`);
      console.log(`  Tailles: ${product.sizes || 'NULL'}`);
      console.log('');
    });

    await connection.end();
    console.log('Mise à jour terminée !');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

updateProductsSizes();
