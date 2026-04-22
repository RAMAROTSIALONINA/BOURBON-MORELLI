const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOrdersStructureSimple() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    console.log('=== STRUCTURE EXACTE TABLE ORDERS ===\n');

    // Obtenir la structure exacte
    const [structure] = await connection.execute('SHOW COLUMNS FROM orders');
    
    console.log('Nombre de colonnes:', structure.length);
    console.log('\nDétail des colonnes:');
    structure.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field} - ${col.Type} - NULL: ${col.Null} - KEY: ${col.Key}`);
    });

    // Compter les colonnes
    const columnCount = structure.length;
    console.log(`\nLa table a ${columnCount} colonnes`);

    await connection.end();
    console.log('\nPour les INSERT, utilisez uniquement ces colonnes dans le bon ordre');
    
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

checkOrdersStructureSimple();
