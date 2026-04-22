const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOrdersStructure() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== STRUCTURE TABLE ORDERS ===\n');

    // Vérifier la structure de la table orders
    const [structure] = await connection.execute('DESCRIBE orders');
    
    console.log('Colonnes de la table orders:');
    structure.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });

    // Vérifier les commandes existantes
    const [orders] = await connection.execute('SELECT * FROM orders LIMIT 3');
    
    console.log('\nExemples de commandes existantes:');
    if (orders.length > 0) {
      orders.forEach((order, index) => {
        console.log(`\nCommande ${index + 1}:`);
        Object.keys(order).forEach(key => {
          console.log(`  ${key}: ${order[key]}`);
        });
      });
    } else {
      console.log('Aucune commande trouvée');
    }

    await connection.end();
    console.log('\nVérification terminée !');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkOrdersStructure();
