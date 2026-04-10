const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🚀 Initialisation de la base de données BOURBON MORELLI...');
    
    // Lire le fichier SQL complet
    const sqlFile = path.join(__dirname, '../../database/database_complete.sql');
    const sqlContent = await fs.readFile(sqlFile, 'utf8');
    
    // Configuration de la base de données
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: 'utf8mb4'
    };

    // Connexion à MySQL sans spécifier la base
    console.log('📡 Connexion à MySQL...');
    const connection = await mysql.createConnection(dbConfig);

    // Exécuter le script SQL complet
    console.log('🔧 Exécution du script de création...');
    await connection.query(sqlContent);
    
    await connection.end();
    
    console.log('✅ Base de données créée avec succès!');
    console.log('\n🎯 IDENTIFIANTS DE CONNEXION:');
    console.log('👤 Admin: admin@bourbonmorelli.com / admin123');
    console.log('👤 Utilisateurs: jean.dupont@email.com / password123');
    console.log('\n🛍️ PRODUITS BOURBON MORELLI DISPONIBLES:');
    console.log('   - Nappe de Table Luxe: 89.99€');
    console.log('   - T-shirt Premium: 39.99€');
    console.log('   - Polo Classique: 49.99€');
    console.log('   - Pantalon Chic: 79.99€');
    console.log('\n🚀 Vous pouvez maintenant démarrer le serveur!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
